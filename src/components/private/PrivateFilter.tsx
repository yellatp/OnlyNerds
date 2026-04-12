import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TARGET_LEVELS, buildTargetedUrl } from '../../data/dorkUtils';

export interface PrivateCompany {
  name: string;
  sector: string;
  fundingRound: string;
  amountRaised: string;
  subSector: string;
  careerUrl: string;
}

interface Props {
  companies: PrivateCompany[];
  sectors: string[];
  rounds: string[];
}

const ROUND_ORDER = [
  'Pre-Seed','Seed','Series Seed','Series A','Series B','Series C',
  'Series D','Series E','Series F','Growth','Late Stage','Private Equity',
];

const PAGE_SIZES = [10, 15, 25] as const;

export default function PrivateFilter({ companies, sectors, rounds }: Props) {
  const [search,     setSearch]     = useState('');
  const [selSectors, setSelSectors] = useState<string[]>([]);
  const [selRounds,  setSelRounds]  = useState<string[]>([]);
  const [sort,       setSort]       = useState<'name'|'sector'|'round'>('name');
  const [pageSize,   setPageSize]   = useState<10|15|25>(15);
  const [page,       setPage]       = useState(1);
  const [targetRole,  setTargetRole]  = useState('');
  const [targetLevel, setTargetLevel] = useState('');

  useEffect(() => {
    const handler = (e: Event) => {
      const f = (e as CustomEvent).detail as Record<string, unknown>;
      if (!f) return;
      if (typeof f.search === 'string')   setSearch(f.search);
      if (Array.isArray(f.sectors))       setSelSectors(f.sectors as string[]);
      if (Array.isArray(f.rounds))        setSelRounds(f.rounds as string[]);
      if (PAGE_SIZES.includes(f.pageSize as 10|15|25)) setPageSize(f.pageSize as 10|15|25);
      setPage(1);
    };
    const clear = () => { setSearch(''); setSelSectors([]); setSelRounds([]); setPage(1); };
    window.addEventListener('cn:apply-filters', handler);
    window.addEventListener('cn:clear-filters', clear);
    return () => {
      window.removeEventListener('cn:apply-filters', handler);
      window.removeEventListener('cn:clear-filters', clear);
    };
  }, []);

  const filtered = useMemo(() => {
    let r = companies;
    const q = search.toLowerCase().trim();
    if (q) r = r.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.sector.toLowerCase().includes(q) ||
      c.subSector.toLowerCase().includes(q)
    );
    if (selSectors.length) r = r.filter((c) => selSectors.some((s) => c.sector.toLowerCase().includes(s.toLowerCase())));
    if (selRounds.length)  r = r.filter((c) => selRounds.includes(c.fundingRound));
    return [...r].sort((a, b) => {
      if (sort === 'round') {
        const ai = ROUND_ORDER.indexOf(a.fundingRound);
        const bi = ROUND_ORDER.indexOf(b.fundingRound);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
      }
      if (sort === 'sector') return a.sector.localeCompare(b.sector);
      return a.name.localeCompare(b.name);
    });
  }, [companies, search, selSectors, selRounds, sort]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const slice      = filtered.slice((page - 1) * pageSize, page * pageSize);
  const hasFilters = search || selSectors.length || selRounds.length;
  const clearAll   = () => { setSearch(''); setSelSectors([]); setSelRounds([]); setPage(1); };

  const popularRounds = rounds
    .filter((r) => r !== '--')
    .sort((a, b) => {
      const ai = ROUND_ORDER.indexOf(a); const bi = ROUND_ORDER.indexOf(b);
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
    })
    .slice(0, 12);

  const selectedLevelQuery = TARGET_LEVELS.find((l) => l.label === targetLevel)?.query ?? '';

  return (
    <div className="space-y-4">

      {/* Role + Level targeting */}
      <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-500">
            Target a Role (optional)
          </p>
          {(targetRole || targetLevel) && (
            <button
              type="button"
              onClick={() => { setTargetRole(''); setTargetLevel(''); }}
              className="ml-auto text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear targeting
            </button>
          )}
        </div>
        <div className="mb-3">
          <input
            type="text"
            placeholder="SWE, SDE, SRE, Data Engineer, Data Analyst, ML Engineer..."
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 px-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-amber-700"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TARGET_LEVELS.map((l) => (
            <button
              key={l.label}
              type="button"
              onClick={() => setTargetLevel(targetLevel === l.label ? '' : l.label)}
              className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                targetLevel === l.label
                  ? 'border-amber-600 bg-amber-900 text-amber-200'
                  : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        {targetRole && (
          <p className="mt-2 text-[10px] text-amber-600">
            Company links will open a Google dork scoped to "{targetRole}"{targetLevel ? ` at ${targetLevel} level` : ''}.
          </p>
        )}
      </div>

      {/* Filter panel */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">

        <div className="relative mb-4">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search by company name or sector..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-slate-500 focus:bg-slate-800"
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Sector</p>
            <div className="flex flex-wrap gap-1.5">
              {sectors.slice(0, 10).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setSelSectors((p) => p.includes(s) ? p.filter((v) => v !== s) : [...p, s]); setPage(1); }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    selSectors.includes(s)
                      ? 'bg-amber-900 text-amber-300 ring-1 ring-amber-700'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Funding Round</p>
            <div className="flex flex-wrap gap-1.5">
              {popularRounds.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setSelRounds((p) => p.includes(r) ? p.filter((v) => v !== r) : [...p, r]); setPage(1); }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    selRounds.includes(r)
                      ? 'bg-amber-900 text-amber-300 ring-1 ring-amber-700'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
          <span className="text-xs text-slate-500">
            {filtered.length.toLocaleString()} results
            {hasFilters && (
              <button type="button" onClick={clearAll} className="ml-3 text-amber-400 underline underline-offset-2 hover:text-amber-300">
                Clear filters
              </button>
            )}
          </span>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              Per page:
              {PAGE_SIZES.map((s) => (
                <button key={s} type="button" onClick={() => { setPageSize(s); setPage(1); }}
                  className={`rounded px-2 py-0.5 font-medium transition-colors ${pageSize === s ? 'bg-amber-900 text-amber-300' : 'hover:text-slate-300'}`}>
                  {s}
                </button>
              ))}
            </span>
            <span className="flex items-center gap-1.5">
              Sort:
              {(['name','sector','round'] as const).map((s) => (
                <button key={s} type="button" onClick={() => setSort(s)}
                  className={`rounded px-2 py-0.5 font-medium capitalize transition-colors ${sort === s ? 'bg-amber-900 text-amber-300' : 'hover:text-slate-300'}`}>
                  {s}
                </button>
              ))}
            </span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {slice.map((c, i) => (
            <motion.a
              key={c.name + i}
              href={buildTargetedUrl(c.careerUrl, c.name, targetRole, selectedLevelQuery)}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, delay: Math.min(i * 0.015, 0.2) }}
              whileHover={{ y: -2 }}
              className="group flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700 hover:bg-slate-800"
            >
              {targetRole && (
                <div className="flex items-center gap-1 rounded bg-amber-950/60 px-2 py-0.5 text-[9px] text-amber-400 font-mono -mb-1">
                  <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  dork: {targetRole}{targetLevel ? ` · ${targetLevel}` : ''}
                </div>
              )}
              <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-amber-100 transition-colors line-clamp-2">
                {c.name}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">{c.sector}</p>
              {c.subSector && <p className="text-[10px] text-slate-600 line-clamp-1">{c.subSector}</p>}
              {c.fundingRound !== '--' && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="rounded-md bg-amber-950 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-900">
                    {c.fundingRound}
                  </span>
                  {c.amountRaised !== '--' && (
                    <span className="text-[10px] text-slate-600">{c.amountRaised}</span>
                  )}
                </div>
              )}
            </motion.a>
          ))}
        </AnimatePresence>
      </div>

      {slice.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-slate-500">No companies match your filters.</p>
          <button type="button" onClick={clearAll} className="mt-2 text-xs text-amber-400 underline underline-offset-2 hover:text-amber-300">
            Clear filters
          </button>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-30">
            Previous
          </button>
          <span className="px-3 text-xs text-slate-500">Page {page} of {totalPages}</span>
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-30">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
