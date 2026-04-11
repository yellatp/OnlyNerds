import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  filtersApplied?: boolean;
}

interface Props {
  page: string;
  pageLabel: string;
  accentColor: 'emerald' | 'amber' | 'violet' | 'blue';
}

const HINTS: Record<string, string[]> = {
  'h1b': [
    '25 fintech companies with high H1B sponsorship',
    'Fortune 500 companies in Enterprise Software',
    'Analyst picks with Very High likelihood',
  ],
  'private-markets': [
    'Enterprise Software companies',
    'Series B healthcare companies',
    'Show 25 results per page',
  ],
  'vc-portfolios': [
    'Show only accelerators',
    'Which VCs have job boards?',
  ],
  'home': [
    'What is CareerNext?',
    'Where should I look for H1B jobs?',
  ],
  'resources': [
    'Best tools for H1B visa research',
    'How do I optimize my resume?',
  ],
};

const ACCENT: Record<string, { bg: string; ring: string; text: string; btn: string }> = {
  emerald: { bg: 'bg-emerald-600',     ring: 'ring-emerald-700', text: 'text-emerald-400', btn: 'bg-emerald-600 hover:bg-emerald-500' },
  amber:   { bg: 'bg-amber-600',       ring: 'ring-amber-700',   text: 'text-amber-400',   btn: 'bg-amber-600 hover:bg-amber-500' },
  violet:  { bg: 'bg-violet-600',      ring: 'ring-violet-700',  text: 'text-violet-400',  btn: 'bg-violet-600 hover:bg-violet-500' },
  blue:    { bg: 'bg-blue-600',        ring: 'ring-blue-700',    text: 'text-blue-400',    btn: 'bg-blue-600 hover:bg-blue-500' },
};

export default function AiChat({ page, pageLabel, accentColor }: Props) {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const [dot, setDot]         = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const ac        = ACCENT[accentColor] ?? ACCENT.violet;
  const hints     = HINTS[page] ?? HINTS.home;

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const applyFilters = useCallback((filters: Record<string, unknown>) => {
    if (!filters || !Object.keys(filters).length) return;
    window.dispatchEvent(new CustomEvent('cn:apply-filters', { detail: filters }));
    setDot(true);
  }, []);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: 'user', content: trimmed };
    setMessages((p) => [...p, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, page }),
      });

      if (!res.ok) throw new Error('Server error');
      const data = await res.json();

      if (data.error) {
        setMessages((p) => [...p, { role: 'assistant', content: data.error }]);
        return;
      }

      const hasFilters = data.filters && Object.keys(data.filters).length > 0;
      setMessages((p) => [
        ...p,
        { role: 'assistant', content: data.response ?? 'Done.', filtersApplied: hasFilters },
      ]);

      if (hasFilters) applyFilters(data.filters);
    } catch {
      setMessages((p) => [
        ...p,
        { role: 'assistant', content: 'Could not reach the AI service. Please check your connection.' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, page, applyFilters]);

  const clearAll = () => {
    setMessages([]);
    setDot(false);
    window.dispatchEvent(new CustomEvent('cn:clear-filters'));
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full ring-2 ${ac.ring} ${ac.bg} text-white shadow-2xl transition-transform hover:scale-105`}
        aria-label="Open AI chat"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.svg key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }} className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12"/>
            </motion.svg>
          ) : (
            <motion.svg key="chat" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ duration: 0.15 }} className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
            </motion.svg>
          )}
        </AnimatePresence>

        {/* Notification dot */}
        {dot && !open && (
          <span className="absolute right-0 top-0 h-3 w-3 rounded-full bg-white ring-2 ring-[#080810]" />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed z-50 flex h-[500px] w-[360px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
            style={{ bottom: '5.5rem', right: '1.5rem' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-slow" />
                <div>
                  <p className="text-xs font-semibold text-white">CareerNext AI</p>
                  <p className="text-[10px] text-slate-500">{pageLabel}</p>
                </div>
              </div>
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded px-2 py-1 text-[10px] text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Ask me to filter companies or answer career questions.
                  </p>
                  <div className="space-y-2">
                    {hints.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => send(h)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-left text-xs text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? `${ac.bg} text-white`
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {msg.content}
                    {msg.filtersApplied && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-400">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                          <path d="M5 13l4 4L19 7"/>
                        </svg>
                        Filters applied to the page
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-xl bg-slate-800 px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="block h-1.5 w-1.5 rounded-full bg-slate-500"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-slate-800 p-3">
              <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about companies..."
                  disabled={loading}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors focus:border-slate-500 focus:bg-slate-700 disabled:opacity-50"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={loading || !input.trim()}
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ac.btn} text-white transition disabled:opacity-30`}
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
