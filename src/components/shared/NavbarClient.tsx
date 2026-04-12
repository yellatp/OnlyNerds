import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const links = [
  { href: '/',           label: 'Home',       dot: null             },
  { href: '/companies',  label: 'Companies',  dot: '#7AB87A'        },
  { href: '/job-search', label: 'Job Search', dot: '#C49A3A'        },
  { href: '/resources',  label: 'Resources',  dot: '#6B9AC4'        },
  { href: '/contact',    label: 'Contact',    dot: null             },
];

interface Props {
  pathname: string;
}

export default function NavbarClient({ pathname }: Props) {
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll  = () => setScrolled(window.scrollY > 24);
    const onResize  = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' || pathname === '' : pathname.startsWith(href);

  const barVariants = {
    closed: { rotate: 0, y: 0, opacity: 1 },
    open:   { rotate: 0, y: 0, opacity: 1 },
  };

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        borderBottom: '0.5px solid #1C1C18',
        background: scrolled ? 'rgba(13,13,13,0.92)' : '#0D0D0D',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        transition: 'background 0.4s ease, backdrop-filter 0.4s ease',
      }}
    >
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6 sm:px-10">

        {/* Logo */}
        <a href="/" className="flex shrink-0 items-center">
          <img
            src="/OnlyNerds_Nav.svg"
            alt="OnlyNerds"
            className="h-20 w-auto"
            onError={(e) => { (e.target as HTMLImageElement).src = '/OnlyNerds_Nav.png'; }}
          />
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center md:flex" role="navigation">
          {links.map((l) => {
            const active = isActive(l.href);
            return (
              <a
                key={l.href}
                href={l.href}
                className="relative flex items-center gap-1.5 px-3 py-5"
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.13em',
                  color: active ? '#EDEDEA' : '#706E66',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = '#C8C6BE';
                }}
                onMouseLeave={(e) => {
                  if (!active) (e.currentTarget as HTMLElement).style.color = '#706E66';
                }}
              >
                {l.dot && (
                  <span
                    style={{ width: 6, height: 6, borderRadius: '50%', background: l.dot, flexShrink: 0, display: 'inline-block' }}
                  />
                )}
                {l.label}
                {/* Active indicator underline — animates between items */}
                {active && (
                  <motion.span
                    layoutId="nav-active-line"
                    className="absolute bottom-0 left-0 right-0"
                    style={{ height: '1px', background: '#A09E96' }}
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Desktop right — GitHub button */}
        <div className="hidden items-center md:flex">
          <a
            href="https://github.com/yellatp/OnlyNerds"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: '0.5px solid #1C1C18',
              padding: '6px 12px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.13em',
              color: '#706E66',
              textDecoration: 'none',
              transition: 'border-color 0.2s ease, color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = '#4A4844';
              el.style.color = '#C8C6BE';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = '#1C1C18';
              el.style.color = '#706E66';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            GitHub
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle navigation"
          aria-expanded={open}
          className="flex h-9 w-9 flex-col items-center justify-center gap-1.5 md:hidden"
          style={{ background: 'none', border: 'none' }}
        >
          <motion.span
            animate={{ rotate: open ? 45 : 0, y: open ? 7.5 : 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            style={{ display: 'block', height: '1px', width: '20px', background: '#A09E96', transformOrigin: 'center' }}
          />
          <motion.span
            animate={{ opacity: open ? 0 : 1, scaleX: open ? 0 : 1 }}
            transition={{ duration: 0.18 }}
            style={{ display: 'block', height: '1px', width: '20px', background: '#A09E96' }}
          />
          <motion.span
            animate={{ rotate: open ? -45 : 0, y: open ? -7.5 : 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            style={{ display: 'block', height: '1px', width: '20px', background: '#A09E96', transformOrigin: 'center' }}
          />
        </button>

      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile-drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            style={{ overflow: 'hidden', borderTop: '0.5px solid #1C1C18' }}
          >
            <nav className="px-6 pb-4 pt-1">
              {links.map((l) => {
                const active = isActive(l.href);
                return (
                  <a
                    key={l.href}
                    href={l.href}
                    className="flex items-center gap-2 py-3"
                    style={{
                      borderBottom: '0.5px solid #1C1C18',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.13em',
                      color: active ? '#EDEDEA' : '#706E66',
                      textDecoration: 'none',
                    }}
                  >
                    {l.dot && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: l.dot, flexShrink: 0, display: 'inline-block' }} />
                    )}
                    {l.label}
                  </a>
                );
              })}
              <a
                href="https://github.com/yellatp/OnlyNerds"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2"
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.13em',
                  color: '#706E66',
                  textDecoration: 'none',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                GitHub
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
