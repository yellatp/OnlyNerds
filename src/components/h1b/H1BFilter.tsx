import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface H1BCompany {
  name: string;
  sector: string;
  category: string;
  tags: string[];
  likelihood: string;
  fortune500: boolean;
  analystsPick: boolean;
  publiclyTraded: boolean;
  boutique: boolean;
  careerUrl: string;
}

interface Props {
  companies: H1BCompany[];
  sectors: string[];
  categories: string[];
}

const LIKELIHOOD_ORDER = ['Very High', 'High', 'Medium', 'Low', 'Unknown'];

const LIKELIHOOD_STYLE: Record<string, string> = {
  'Very High': 'bg-emerald-950 text-emerald-300 border border-emerald-900',
  'High':      'bg-green-950 text-green-300 border border-green-900',
  'Medium':    'bg-yellow-950 text-yellow-300 border border-yellow-900',
  'Low':       'bg-red-950 text-red-300 border border-red-900',
  'Unknown':   'bg-slate-800 text-slate-400 border border-slate-700',
};

const PAGE_SIZES = [10, 15, 25] as const;

export default function H1BFilter({ companies, sectors }: Props) {
  const [search,       setSearch]       = useState('');
  const [selLikelihood,setSelLikelihood]= useState<string[]>([]);
  const [selSectors,   setSelSectors]   = useState<string[]>([]);
  const [fortune500,   setFortune500]   = useState(false);
  const [analystsPick, setAnalystsPick] = useState(false);
  const [publiclyTraded,setPubliclyTraded]= useState(false);
  const [sort,         setSort]         = useState<'likelihood'|'name'|'sector'>('likelihood');
  const [pageSize,     setPageSize]     = useState<10|15|25>(15);
  const [page,         setPage]         = useState(1);

  /* AI filter listener */
  useEffect(() => {
    const handler = (e: Event) => {
      const f = (e as CustomEvent).detail as Record<string, unknown>;
      if (!f) return;
      if (typeof f.search === 'string')            setSearch(f.search);
      if (Array.isArray(f.likelihood))             setSelLikelihood(f.likelihood as string[]);
      if (Array.isArray(f.sectors))                setSelSectors(f.sectors as string[]);
      if (typeof f.fortune500 === 'boolean')       setFortune500(f.fortune500);
      if (typeof f.analystsPick === 'boolean')     setAnalystsPick(f.analystsPick);
      if (typeof f.publiclyTraded === 'boolean')   setPubliclyTraded(f.publiclyTraded);
      if (PAGE_SIZES.includes(f.pageSize as 10|15|25)) setPageSize(f.pageSize as 10|15|25);
      setPage(1);
    };
    const clear = () => {
      setSearch(''); setSelLikelihood([]); setSelSectors([]);
      setFortune500(false); setAnalystsPick(false); setPubliclyTraded(false);
      setPage(1);
    };
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
      c.tags.some((t) => t.toLowerCase().includes(q))
    );
    if (selSectors.length)    r = r.filter((c) => selSectors.some((s) => c.sector.toLowerCase().includes(s.toLowerCase())));
    if (selLikelihood.length) r = r.filter((c) => selLikelihood.includes(c.likelihood));
    if (fortune500)           r = r.filter((c) => c.fortune500);
    if (analystsPick)         r = r.filter((c) => c.analystsPick);
    if (publiclyTraded)       r = r.filter((c) => c.publiclyTraded);
    return [...r].sort((a, b) => {
      if (sort === 'likelihood') return LIKELIHOOD_ORDER.indexOf(a.likelihood) - LIKELIHOOD_ORDER.indexOf(b.likelihood);
      if (sort === 'sector')     return a.sector.localeCompare(b.sector);
      return a.name.localeCompare(b.name);
    });
  }, [companies, search, selSectors, selLikelihood, fortune500, analystsPick, publiclyTraded, sort]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const slice      = filtered.slice((page - 1) * pageSize, page * pageSize);
  const hasFilters = search || selSectors.length || selLikelihood.length || fortune500 || analystsPick || publiclyTraded;

  const clearAll = () => {
    setSearch(''); setSelLikelihood([]); setSelSectors([]);
    setFortune500(false); setAnalystsPick(false); setPubliclyTraded(false);
    setPage(1);
  };

  const toggleLikelihood = (l: string) => {
    setSelLikelihood((p) => p.includes(l) ? p.filter((v) => v !== l) : [...p, l]);
    setPage(1);
  };
  const toggleSector = (s: string) => {
    setSelSectors((p) => p.includes(s) ? p.filter((v) => v !== s) : [...p, s]);
    setPage(1);
  };

  return (
    <div className="space-y-4">

      {/* Filter panel */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">

        {/* Search */}
        <div className="relative mb-4">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search by company name, sector, or tag..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-slate-500 focus:bg-slate-800"
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">

          {/* Likelihood */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Sponsorship Likelihood</p>
            <div className="flex flex-wrap gap-1.5">
              {LIKELIHOOD_ORDER.filter((l) => l !== 'Unknown').map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => toggleLikelihood(l)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    selLikelihood.includes(l)
                      ? 'bg-emerald-900 text-emerald-300 ring-1 ring-emerald-700'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Sectors */}
          <div className="flex-1">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Sector</p>
            <div className="flex flex-wrap gap-1.5">
              {sectors.slice(0, 10).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSector(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    selSectors.includes(s)
                      ? 'bg-emerald-900 text-emerald-300 ring-1 ring-emerald-700'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Filter by</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Fortune 500', val: fortune500,     set: () => { setFortune500((p) => !p);     setPage(1); } },
                { label: 'Analyst Pick',val: analystsPick,   set: () => { setAnalystsPick((p) => !p);   setPage(1); } },
                { label: 'Public',      val: publiclyTraded, set: () => { setPubliclyTraded((p) => !p); setPage(1); } },
              ].map(({ label, val, set }) => (
                <button
                  key={label}
                  type="button"
                  onClick={set}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    val
                      ? 'bg-emerald-900 text-emerald-300 ring-1 ring-emerald-700'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom controls */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
          <span className="text-xs text-slate-500">
            {filtered.length.toLocaleString()} results
            {hasFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="ml-3 text-emerald-400 underline underline-offset-2 hover:text-emerald-300"
              >
                Clear filters
              </button>
            )}
          </span>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              Per page:
              {PAGE_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setPageSize(s); setPage(1); }}
                  className={`rounded px-2 py-0.5 font-medium transition-colors ${
                    pageSize === s ? 'bg-emerald-900 text-emerald-300' : 'hover:text-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </span>
            <span className="flex items-center gap-1.5">
              Sort:
              {(['likelihood', 'name', 'sector'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSort(s)}
                  className={`rounded px-2 py-0.5 font-medium capitalize transition-colors ${
                    sort === s ? 'bg-emerald-900 text-emerald-300' : 'hover:text-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </span>
          </div>
        </div>
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {slice.map((c, i) => (
            <motion.a
              key={c.name + i}
              href={c.careerUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, delay: Math.min(i * 0.02, 0.25) }}
              whileHover={{ y: -2 }}
              className="group flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700 hover:bg-slate-800"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-white leading-snug group-hover:text-emerald-100 transition-colors line-clamp-2">
                  {c.name}
                </span>
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                  LIKELIHOOD_STYLE[c.likelihood] ?? LIKELIHOOD_STYLE['Unknown']
                }`}>
                  {c.likelihood}
                </span>
              </div>

              <p className="text-xs text-slate-500">{c.sector}</p>

              <div className="flex flex-wrap gap-1.5">
                {c.fortune500    && <Tag label="F500"         color="amber" />}
                {c.analystsPick  && <Tag label="Analyst Pick" color="violet" />}
                {c.publiclyTraded&& <Tag label="Public"       color="blue" />}
                {c.boutique      && <Tag label="Boutique"     color="slate" />}
              </div>
            </motion.a>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {slice.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm text-slate-500">No companies match your filters.</p>
          <button type="button" onClick={clearAll} className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
            Clear filters
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-30"
          >
            Previous
          </button>
          <span className="px-3 text-xs text-slate-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-700 hover:text-white disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function Tag({ label, color }: { label: string; color: string }) {
  const styles: Record<string, string> = {
    amber:  'bg-amber-950 text-amber-400 border border-amber-900',
    violet: 'bg-violet-950 text-violet-400 border border-violet-900',
    blue:   'bg-blue-950 text-blue-400 border border-blue-900',
    slate:  'bg-slate-800 text-slate-400 border border-slate-700',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${styles[color] ?? styles.slate}`}>
      {label}
    </span>
  );
}
