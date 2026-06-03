import { useState, useEffect, useMemo } from 'react';

interface Company {
  name: string;
  ats: string;
  domain: string;
  total_jobs: number;
  locations_count: number;
  salary_median: number | null;
  salary_p25: number | null;
  salary_p75: number | null;
  jobs_entry: number;
  jobs_intern: number;
  jobs_mid: number;
  jobs_senior: number;
  locations_sample: string;
}

const ATS_LIST = [
  'greenhouse', 'lever', 'ashby', 'workday', 'bamboohr',
  'icims', 'workable', 'smartrecruiters', 'recruitee',
  'jobvite', 'paylocity', 'breezyhr', 'jazzhr', 'personio',
  'teamtailor',
];

const ATS_COLORS: Record<string, string> = {
  greenhouse: '#4ade80', lever: '#94a3b8', ashby: '#fb923c',
  workday: '#a78bfa', bamboohr: '#38bdf8', icims: '#cbd5e1',
  workable: '#2dd4bf', smartrecruiters: '#94a3b8', recruitee: '#e2e8f0',
  jobvite: '#fdba74', paylocity: '#34d399', breezyhr: '#cbd5e1',
  jazzhr: '#38bdf8', personio: '#94a3b8', teamtailor: '#fb923c',
};

export default function CompanyLookup() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [atsFilter, setAtsFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/data/companies.parquet');
        const buf = await resp.arrayBuffer();
        const { readParquet } = await import('https://cdn.jsdelivr.net/npm/parquet-wasm@0.6.1/esm/+esm');
        const { tableFromIPC } = await import('https://cdn.jsdelivr.net/npm/apache-arrow@17/+esm');
        const wasmTable = readParquet(new Uint8Array(buf));
        const table = tableFromIPC(wasmTable.intoIPCStream());
        const n = Number(table.numRows);
        const fieldNames = ['name', 'ats', 'domain', 'total_jobs', 'locations_count',
          'salary_median', 'salary_p25', 'salary_p75',
          'jobs_entry', 'jobs_intern', 'jobs_mid', 'jobs_senior', 'locations_sample'];
        const cols: Record<string, any[]> = {};
        const toNum = (v: any) => typeof v === 'bigint' ? Number(v) : v;
        for (const f of fieldNames) {
          const col = table.getChild(f);
          if (!col) { cols[f] = []; continue; }
          const arr = new Array(col.length);
          for (let i = 0; i < col.length; i++) arr[i] = toNum(col.get(i));
          cols[f] = arr;
        }
        const rows: Company[] = [];
        for (let i = 0; i < n; i++) {
          rows.push({
            name: cols.name?.[i] ?? '',
            ats: cols.ats?.[i] ?? '',
            domain: cols.domain?.[i] ?? '',
            total_jobs: cols.total_jobs?.[i] ?? 0,
            locations_count: cols.locations_count?.[i] ?? 0,
            salary_median: cols.salary_median?.[i] ?? null,
            salary_p25: cols.salary_p25?.[i] ?? null,
            salary_p75: cols.salary_p75?.[i] ?? null,
            jobs_entry: cols.jobs_entry?.[i] ?? 0,
            jobs_intern: cols.jobs_intern?.[i] ?? 0,
            jobs_mid: cols.jobs_mid?.[i] ?? 0,
            jobs_senior: cols.jobs_senior?.[i] ?? 0,
            locations_sample: cols.locations_sample?.[i] ?? '',
          });
        }
        setCompanies(rows);
      } catch (err) {
        console.error('Company load failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const a = atsFilter.toLowerCase();
    return companies.filter(c => {
      if (q && !c.name.toLowerCase().includes(q) && !(c.domain || '').toLowerCase().includes(q)) return false;
      if (a && c.ats?.toLowerCase() !== a) return false;
      return true;
    }).slice(0, 50);
  }, [companies, search, atsFilter]);

  const handleUseInDork = (name: string) => {
    setSelected(name);
    const input = document.getElementById('dork-company-input') as HTMLInputElement;
    if (input) { input.value = name; input.dispatchEvent(new Event('input', { bubbles: true })); }
    document.getElementById('dorking-builder')?.scrollIntoView({ behavior: 'smooth' });
  };

  function fmt(n: any) { return (n == null || isNaN(n)) ? '-' : Number(n).toLocaleString(); }

  function fmtCurrency(n: any) {
    if (n == null || n === 0 || isNaN(n)) return null;
    return '$' + Math.round(Number(n)).toLocaleString();
  }

  const atsColor = (ats: string) => ATS_COLORS[ats?.toLowerCase()] || '#706E66';

  return (
    <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div class="mb-4 flex items-center gap-2">
        <span class="h-1.5 w-1.5 rounded-full bg-amber-400" />
        <h2 class="text-xs font-semibold uppercase tracking-widest text-amber-500">Company Lookup</h2>
      </div>
      <p class="mb-4 text-xs text-slate-400 leading-relaxed">
        Find out which ATS a company uses, then build a targeted dork query below.
      </p>

      <div class="mb-4 flex flex-wrap gap-3">
        <div class="relative flex-1 min-w-[200px]">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" placeholder="Search company..."
            value={search} onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
            class="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-amber-700 transition-colors"
          />
        </div>
        <select value={atsFilter} onChange={(e) => setAtsFilter(e.target.value)}
          class="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none focus:border-amber-700 transition-colors">
          <option value="">All ATS</option>
          {ATS_LIST.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {loading ? (
        <div class="flex items-center gap-2 py-4 text-xs text-slate-500">
          <div class="h-1 w-24 rounded bg-slate-800 overflow-hidden">
            <div class="h-full w-1/3 rounded bg-slate-600 animate-pulse" />
          </div>
          Loading companies...
        </div>
      ) : (
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[480px] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <p class="col-span-full text-sm text-slate-500 py-4 text-center">No companies found.</p>
          ) : filtered.map(c => (
            <div key={c.name}
              class={`rounded-xl border p-3 transition-all ${selected === c.name ? 'border-amber-600 bg-amber-950/30' : 'border-slate-800 bg-[#0D0D0B] hover:border-slate-600'}`}>
              <div class="flex items-start justify-between gap-2 mb-2">
                <span class="text-sm font-semibold text-slate-200 truncate" title={c.name}>{c.name}</span>
                {c.ats && (
                  <span class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-mono font-medium"
                    style={{ background: `${atsColor(c.ats)}20`, color: atsColor(c.ats) }}>
                    {c.ats}
                  </span>
                )}
              </div>
              <div class="flex items-center gap-3 text-[11px] text-slate-500 mb-2">
                <span><strong class="text-slate-300">{fmt(c.total_jobs)}</strong> jobs</span>
                <span><strong class="text-slate-300">{fmt(c.locations_count)}</strong> locations</span>
                {fmtCurrency(c.salary_median) && <span class="text-amber-500">{fmtCurrency(c.salary_median)}</span>}
              </div>
              <button type="button" onClick={() => handleUseInDork(c.name)}
                class="w-full rounded-lg border border-amber-800 bg-amber-950/40 py-1.5 text-[11px] font-semibold text-amber-400 hover:bg-amber-900/60 transition-colors">
                Use in Dork Builder
              </button>
            </div>
          ))}
        </div>
      )}
      <p class="mt-3 text-[10px] text-slate-600">
        Showing {Math.min(filtered.length, 50)} of {companies.length.toLocaleString()} companies.
      </p>
    </div>
  );
}
