import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface VCFirm {
  name: string;
  displayName: string;
  type: 'VC' | 'accelerator';
  portfolioUrl: string;
  jobBoardUrl: string;
  hasJobBoard: boolean;
}

interface Props { firms: VCFirm[] }

export default function VCDirectory({ firms }: Props) {
  const [typeFilter, setTypeFilter] = useState<'all'|'VC'|'accelerator'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handler = (e: Event) => {
      const f = (e as CustomEvent).detail as Record<string, unknown>;
      if (!f) return;
      if (typeof f.search === 'string') setSearch(f.search);
      if (f.type === 'VC' || f.type === 'accelerator' || f.type === 'all') {
        setTypeFilter(f.type as 'all'|'VC'|'accelerator');
      }
    };
    const clear = () => { setSearch(''); setTypeFilter('all'); };
    window.addEventListener('cn:apply-filters', handler);
    window.addEventListener('cn:clear-filters', clear);
    return () => {
      window.removeEventListener('cn:apply-filters', handler);
      window.removeEventListener('cn:clear-filters', clear);
    };
  }, []);

  const filtered = useMemo(() => {
    let r = firms;
    if (typeFilter !== 'all') r = r.filter((f) => f.type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((f) => f.displayName.toLowerCase().includes(q) || f.name.toLowerCase().includes(q));
    }
    return r;
  }, [firms, typeFilter, search]);

  const vcs    = filtered.filter((f) => f.type === 'VC');
  const accels = filtered.filter((f) => f.type === 'accelerator');

  return (
    <div className="space-y-8">

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search firms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-slate-500"
          />
        </div>

        <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-1">
          {(['all','VC','accelerator'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t === 'all' ? 'All' : t === 'VC' ? 'VC Firms' : 'Accelerators'}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500">{filtered.length} firms</span>
      </div>

      {/* VC Firms */}
      <AnimatePresence>
        {(typeFilter === 'all' || typeFilter === 'VC') && vcs.length > 0 && (
          <motion.section key="vc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">VC Firms ({vcs.length})</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {vcs.map((firm, i) => <FirmCard key={firm.name} firm={firm} index={i} accent="violet" />)}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Accelerators */}
      <AnimatePresence>
        {(typeFilter === 'all' || typeFilter === 'accelerator') && accels.length > 0 && (
          <motion.section key="accel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Accelerators ({accels.length})</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {accels.map((firm, i) => <FirmCard key={firm.name} firm={firm} index={i} accent="blue" />)}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function FirmCard({ firm, index, accent }: { firm: VCFirm; index: number; accent: 'violet'|'blue' }) {
  const s = {
    violet: { badge: 'bg-violet-950 text-violet-400 border border-violet-900', label: 'text-violet-500', jobBtn: 'bg-violet-900 text-violet-200 hover:bg-violet-800', border: 'hover:border-violet-800' },
    blue:   { badge: 'bg-blue-950 text-blue-400 border border-blue-900',       label: 'text-blue-500',   jobBtn: 'bg-blue-900 text-blue-200 hover:bg-blue-800',       border: 'hover:border-blue-800' },
  }[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12, delay: Math.min(index * 0.025, 0.4) }}
      className={`rounded-xl border border-slate-800 bg-slate-900 p-4 transition-colors hover:bg-slate-800 ${s.border}`}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${s.badge}`}>
          {firm.displayName.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white">{firm.displayName}</h3>
          <p className={`text-[10px] font-medium uppercase tracking-wide ${s.label}`}>
            {firm.type === 'VC' ? 'Venture Capital' : 'Accelerator'}
          </p>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${firm.hasJobBoard ? 'bg-emerald-400' : 'bg-slate-600'}`} />
        <span className={`text-xs ${firm.hasJobBoard ? 'text-emerald-400' : 'text-slate-600'}`}>
          {firm.hasJobBoard ? 'Direct job board' : 'No direct job board'}
        </span>
      </div>

      <div className="flex gap-2">
        <a
          href={firm.jobBoardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex-1 rounded-lg py-2 text-center text-xs font-semibold transition-colors ${s.jobBtn}`}
        >
          {firm.hasJobBoard ? 'Job Board' : 'Search Jobs'}
        </a>
        {firm.portfolioUrl && (
          <a
            href={firm.portfolioUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
          >
            Portfolio
          </a>
        )}
      </div>
    </motion.div>
  );
}
