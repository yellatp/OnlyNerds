import { useState, useMemo, useEffect } from 'react';
import type { RoleGroup, ATSSegment, Level, LocationHub, PostedTime } from '../../data/jobSearch';
import {
  getCooldownState, recordDorkClick, buildEngineUrl,
  formatCooldownTime, type CooldownState,
} from '../../data/dorkSafety';

interface Props {
  roleGroups: RoleGroup[];
  atsSegments: ATSSegment[];
  levels: Level[];
  locationHubs: LocationHub[];
  postedTimes: PostedTime[];
}

const ATS_COLOR: Record<string, string> = {
  emerald: 'border-emerald-700 bg-emerald-950 text-emerald-300 ring-emerald-600',
  amber:   'border-amber-700 bg-amber-950 text-amber-300 ring-amber-600',
  red:     'border-red-700 bg-red-950 text-red-300 ring-red-600',
};

const ATS_BADGE: Record<string, string> = {
  emerald: 'bg-emerald-900 text-emerald-300 border border-emerald-800',
  amber:   'bg-amber-900 text-amber-300 border border-amber-800',
  red:     'bg-red-900 text-red-300 border border-red-800',
};

function Pill({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      class={[
        'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
        selected
          ? 'border-violet-600 bg-violet-900 text-violet-200 ring-1 ring-violet-700'
          : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

type Engine = 'google' | 'bing' | 'ddg';

// ─── Per-engine query builders ───────────────────────────────────────────────

/**
 * Google: Full Boolean syntax.
 * Nested parentheses, unlimited site: operators, alias expansion, tbs= time filter.
 * Jitter appended automatically by buildEngineUrl.
 */
function buildGoogleQuery(
  selRoles: string[],
  roleMap: Record<string, { label: string; aliases?: string[] }>,
  selLevels: string[],
  allLevels: Level[],
  selLocations: string[],
  locationHubs: LocationHub[],
  customCity: string,
  customCountry: string,
  selATS: string[],
  atsSegments: ATSSegment[],
  companyFilter: string,
): string {
  const parts: string[] = [];

  if (selRoles.length > 0) {
    const terms: string[] = [];
    selRoles.forEach((label) => {
      terms.push(`"${label}"`);
      roleMap[label]?.aliases?.forEach((a) => terms.push(`"${a}"`));
    });
    parts.push(terms.length === 1 ? terms[0] : `(${terms.join(' OR ')})`);
  }

  if (selLevels.length > 0) {
    const lq = allLevels.filter((l) => selLevels.includes(l.label)).map((l) => l.query);
    if (lq.length > 0) parts.push(`(${lq.join(' OR ')})`);
  }

  const locTerms: string[] = [];
  locationHubs.filter((l) => selLocations.includes(l.label)).flatMap((l) => l.terms).forEach((t) => locTerms.push(t));
  if (customCity.trim())    locTerms.push(`"${customCity.trim()}"`);
  if (customCountry.trim()) locTerms.push(`"${customCountry.trim()}"`);
  if (locTerms.length > 0) parts.push(locTerms.length === 1 ? locTerms[0] : `(${locTerms.join(' OR ')})`);

  if (selATS.length > 0) {
    const sites = atsSegments.filter((a) => selATS.includes(a.key)).flatMap((a) => a.sites).map((s) => `site:${s}`);
    if (sites.length > 0) parts.push(`(${sites.join(' OR ')})`);
  }

  if (companyFilter.trim()) parts.push(`"${companyFilter.trim()}"`);
  return parts.join('\n');
}

/**
 * Bing: Flat structure.
 * - site: operators go FIRST (Bing drops sites beyond ~3 when nested in parens)
 * - Max 3 ATS sites total (Bing ignores the rest)
 * - Aliases limited to 2 per role (shorter query = better Bing parsing)
 * - Level simplified to first quoted term (Bing chokes on complex nested OR in level blocks)
 * - Location as flat OR chain, no outer parens
 * - No jitter (minus operator applied differently on Bing)
 */
function buildBingQuery(
  selRoles: string[],
  roleMap: Record<string, { label: string; aliases?: string[] }>,
  selLevels: string[],
  allLevels: Level[],
  selLocations: string[],
  locationHubs: LocationHub[],
  customCity: string,
  customCountry: string,
  selATS: string[],
  atsSegments: ATSSegment[],
  companyFilter: string,
): string {
  const parts: string[] = [];

  // Sites FIRST in Bing, max 3 (no outer parens - Bing handles flat OR better)
  if (selATS.length > 0) {
    const sites = atsSegments.filter((a) => selATS.includes(a.key))
      .flatMap((a) => a.sites)
      .slice(0, 3)
      .map((s) => `site:${s}`);
    if (sites.length > 0) parts.push(sites.join(' OR '));
  }

  // Roles: flat OR, max 2 aliases per role (keep query short for Bing)
  if (selRoles.length > 0) {
    const terms: string[] = [];
    selRoles.forEach((label) => {
      terms.push(`"${label}"`);
      roleMap[label]?.aliases?.slice(0, 2).forEach((a) => terms.push(`"${a}"`));
    });
    parts.push(terms.join(' OR '));
  }

  // Level: extract only first quoted term per level (avoid complex nested OR blocks)
  if (selLevels.length > 0) {
    const lterms = allLevels.filter((l) => selLevels.includes(l.label)).map((l) => {
      const match = l.query.match(/"([^"]+)"/);
      return match ? `"${match[1]}"` : l.query.split(' OR ')[0].trim();
    });
    if (lterms.length > 0) parts.push(lterms.join(' OR '));
  }

  // Location: flat OR, max 2 terms per hub (no outer parens)
  const locTerms: string[] = [];
  locationHubs.filter((l) => selLocations.includes(l.label))
    .forEach((l) => l.terms.slice(0, 2).forEach((t) => locTerms.push(t)));
  if (customCity.trim())    locTerms.push(`"${customCity.trim()}"`);
  if (customCountry.trim()) locTerms.push(`"${customCountry.trim()}"`);
  if (locTerms.length > 0) parts.push(locTerms.join(' OR '));

  if (companyFilter.trim()) parts.push(`"${companyFilter.trim()}"`);
  return parts.join('\n');
}

/**
 * DuckDuckGo: Linear syntax only.
 * - No nested parentheses (DDG flattens them, treating every word as a keyword)
 * - No OR chains (use primary terms only)
 * - Single site: operator (DDG aggregates from Bing's API; multiple site: rarely helps)
 * - Single location term (chains confuse DDG's query parser)
 * - No aliases (keep query short and precise)
 * - No jitter (DDG's aggressive minus can suppress pages from metadata matches)
 */
function buildDDGQuery(
  selRoles: string[],
  selLevels: string[],
  allLevels: Level[],
  selLocations: string[],
  locationHubs: LocationHub[],
  customCity: string,
  customCountry: string,
  selATS: string[],
  atsSegments: ATSSegment[],
  companyFilter: string,
): string {
  const parts: string[] = [];

  // Role: primary name only, max 2 selected roles (no alias expansion)
  if (selRoles.length > 0) {
    parts.push(`"${selRoles[0]}"`);
    if (selRoles.length > 1) parts.push(`"${selRoles[1]}"`);
  }

  // Level: first quoted term from first selected level only
  if (selLevels.length > 0) {
    const firstLevel = allLevels.find((l) => selLevels.includes(l.label));
    if (firstLevel) {
      const match = firstLevel.query.match(/"([^"]+)"/);
      if (match) parts.push(`"${match[1]}"`);
    }
  }

  // Location: single term only (DDG cannot parse OR location chains reliably)
  if (customCity.trim()) {
    parts.push(`"${customCity.trim()}"`);
  } else if (customCountry.trim()) {
    parts.push(`"${customCountry.trim()}"`);
  } else if (selLocations.length > 0) {
    const hub = locationHubs.find((l) => selLocations.includes(l.label));
    if (hub) parts.push(hub.terms[0]);
  }

  // Site: single site from first selected ATS segment
  if (selATS.length > 0) {
    const firstSeg = atsSegments.find((a) => selATS.includes(a.key));
    if (firstSeg) parts.push(`site:${firstSeg.sites[0]}`);
  }

  if (companyFilter.trim()) parts.push(`"${companyFilter.trim()}"`);
  return parts.join(' '); // single line for DDG - no newlines
}

// ─── Engine UI config ─────────────────────────────────────────────────────────

const ENGINE_META = {
  google: {
    label: 'Google',
    sublabel: 'Full Boolean syntax',
    traits: ['Nested operators', 'Alias expansion', 'Date filter via tbs=', 'IP protection active'],
    accent: 'violet',
    activeCard: 'border-violet-600 bg-violet-950/40',
    activeLabel: 'text-violet-400',
    inactiveLabel: 'text-slate-500',
    btnActive: 'bg-violet-700 text-white',
    btnSearch: 'bg-violet-600 hover:bg-violet-500 text-white',
  },
  bing: {
    label: 'Bing',
    sublabel: 'Flat structure - no cooldown',
    traits: ['Sites at front (max 3)', 'Flat OR chains', 'Level simplified', 'No IP limits here'],
    accent: 'blue',
    activeCard: 'border-blue-600 bg-blue-950/40',
    activeLabel: 'text-blue-400',
    inactiveLabel: 'text-slate-500',
    btnActive: 'bg-blue-700 text-white',
    btnSearch: 'bg-blue-600 hover:bg-blue-500 text-white',
  },
  ddg: {
    label: 'DuckDuckGo',
    sublabel: 'Linear only - max privacy',
    traits: ['Single site operator', 'No OR chains', 'No alias expansion', 'No IP logging'],
    accent: 'emerald',
    activeCard: 'border-emerald-600 bg-emerald-950/40',
    activeLabel: 'text-emerald-400',
    inactiveLabel: 'text-slate-500',
    btnActive: 'bg-emerald-700 text-white',
    btnSearch: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function JobSearchBuilder({ roleGroups, atsSegments, levels, locationHubs, postedTimes }: Props) {
  const [engine, setEngine]                 = useState<Engine>('google');
  const [customRole, setCustomRole]         = useState('');
  const [selRoles, setSelRoles]             = useState<string[]>([]);
  const [selATS, setSelATS]                 = useState<string[]>([]);
  const [selLevels, setSelLevels]           = useState<string[]>([]);
  const [selLocations, setSelLocations]     = useState<string[]>([]);
  const [customCity, setCustomCity]         = useState('');
  const [customCountry, setCustomCountry]   = useState('');
  const [selTime, setSelTime]               = useState<string>('');
  const [companyFilter, setCompanyFilter]   = useState('');
  const [copied, setCopied]                 = useState(false);
  const [cooldown, setCooldown]             = useState<CooldownState>({ type: 'none', secondsLeft: 0, recentClicks: 0 });

  useEffect(() => {
    const tick = () => setCooldown(getCooldownState());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const roleMap = useMemo(() => {
    const map: Record<string, { label: string; aliases?: string[] }> = {};
    roleGroups.forEach((g) => g.roles.forEach((r) => { map[r.label] = r; }));
    return map;
  }, [roleGroups]);

  function toggle<T>(arr: T[], item: T, set: (v: T[]) => void) {
    set(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  }

  // Engine-specific query generation
  const query = useMemo(() => {
    if (engine === 'google') {
      return buildGoogleQuery(
        selRoles, roleMap, selLevels, levels,
        selLocations, locationHubs, customCity, customCountry,
        selATS, atsSegments, companyFilter,
      );
    }
    if (engine === 'bing') {
      return buildBingQuery(
        selRoles, roleMap, selLevels, levels,
        selLocations, locationHubs, customCity, customCountry,
        selATS, atsSegments, companyFilter,
      );
    }
    return buildDDGQuery(
      selRoles, selLevels, levels,
      selLocations, locationHubs, customCity, customCountry,
      selATS, atsSegments, companyFilter,
    );
  }, [engine, selRoles, selLevels, selLocations, customCity, customCountry, selATS, companyFilter,
      levels, atsSegments, locationHubs, roleMap]);

  const selectedTimeObj = postedTimes.find((t) => t.label === selTime);
  const isGoogleBlocked = engine === 'google' && cooldown.type !== 'none';
  const canSearch       = Boolean(query) && !isGoogleBlocked;
  const meta            = ENGINE_META[engine];

  function handleSearch() {
    if (!query || isGoogleBlocked) return;
    if (engine === 'google') recordDorkClick();
    const tbs = engine === 'google' ? selectedTimeObj?.tbs : undefined;
    window.open(buildEngineUrl(query, engine, tbs), '_blank', 'noopener,noreferrer');
  }

  function getButtonLabel(): string {
    if (!query) return 'Build a query first';
    if (cooldown.type === 'hard' && engine === 'google')
      return `Deep Freeze: ${formatCooldownTime(cooldown.secondsLeft)}`;
    if (cooldown.type === 'soft' && engine === 'google')
      return `IP Protection: ${cooldown.secondsLeft}s`;
    return `Search on ${ENGINE_META[engine].label}`;
  }

  function getButtonClass(): string {
    if (!query) return 'bg-slate-800 text-slate-500 cursor-not-allowed';
    if (cooldown.type === 'hard' && engine === 'google')
      return 'bg-red-950 border border-red-900 text-red-400 cursor-not-allowed font-mono';
    if (cooldown.type === 'soft' && engine === 'google')
      return 'bg-amber-950 border border-amber-900 text-amber-400 cursor-not-allowed font-mono';
    return meta.btnSearch;
  }

  function handleCopy() {
    if (!query) return;
    navigator.clipboard.writeText(query).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleReset() {
    setSelRoles([]); setSelATS([]); setSelLevels([]); setSelLocations([]);
    setCustomCity(''); setCustomCountry(''); setSelTime('');
    setCompanyFilter(''); setCustomRole('');
  }

  const hasSelections = selRoles.length > 0 || selLevels.length > 0 || selLocations.length > 0
    || selATS.length > 0 || selTime !== '' || customCity.trim() !== '' || customCountry.trim() !== '';

  return (
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">

      {/* Left: Builder */}
      <div class="space-y-6">

        {/* STEP 1: Engine selector - first thing the user picks */}
        <div class="rounded-xl border-2 border-slate-700 bg-slate-900 p-5">
          <div class="mb-1 flex items-center gap-2">
            <span class="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Step 1</span>
            <p class="text-sm font-bold text-white">Pick your search engine</p>
          </div>
          <p class="mb-4 text-[11px] text-slate-400 leading-relaxed">
            Your query syntax is generated specifically for the engine you choose. Google, Bing, and DuckDuckGo parse Boolean operators differently - switching engines rewrites the query.
          </p>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {(['google', 'bing', 'ddg'] as const).map((e) => {
              const m = ENGINE_META[e];
              const active = engine === e;
              return (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEngine(e)}
                  class={[
                    'rounded-xl border-2 p-3 text-left transition-all',
                    active ? m.activeCard : 'border-slate-700 bg-slate-950 hover:border-slate-600',
                  ].join(' ')}
                >
                  <div class="mb-1.5 flex items-center gap-2">
                    <span class={`h-2 w-2 rounded-full ${active ? `bg-${m.accent}-400` : 'bg-slate-600'}`} />
                    <span class={`text-xs font-bold ${active ? m.activeLabel : 'text-slate-400'}`}>{m.label}</span>
                    {active && (
                      <span class={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase bg-${m.accent}-900 ${m.activeLabel}`}>Active</span>
                    )}
                  </div>
                  <p class="mb-2 text-[10px] text-slate-500">{m.sublabel}</p>
                  <ul class="space-y-0.5">
                    {m.traits.map((t) => (
                      <li key={t} class={`text-[9px] ${active ? m.activeLabel : 'text-slate-600'}`}>
                        {active ? '+ ' : '- '}{t}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* Engine-specific notice */}
          {engine === 'bing' && (
            <div class="mt-3 rounded-lg border border-blue-900 bg-blue-950/30 px-3 py-2">
              <p class="text-[10px] text-blue-400 leading-relaxed">
                <span class="font-semibold">Bing mode:</span> Sites are placed first in the query (Bing ignores sites beyond position 3 when nested). Level terms are simplified to their primary keyword. Alias list is trimmed to 2 per role to prevent query bloat.
              </p>
            </div>
          )}
          {engine === 'ddg' && (
            <div class="mt-3 rounded-lg border border-emerald-900 bg-emerald-950/30 px-3 py-2">
              <p class="text-[10px] text-emerald-400 leading-relaxed">
                <span class="font-semibold">DuckDuckGo mode:</span> Query is kept strictly linear. Only your primary role, first level, first location, and first ATS site are used. OR chains and nested parens are dropped because DDG flattens them into keyword searches.
              </p>
            </div>
          )}
          {engine === 'google' && (
            <div class="mt-3 rounded-lg border border-violet-900 bg-violet-950/30 px-3 py-2">
              <p class="text-[10px] text-violet-400 leading-relaxed">
                <span class="font-semibold">Google mode:</span> Full Boolean syntax with nested parentheses, complete alias expansion, and all ATS sites. IP protection (45s cooldown, 5-min deep freeze after heavy use) is active. Query jitter is applied automatically.
              </p>
            </div>
          )}
        </div>

        {/* STEP 2: Role input */}
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div class="mb-1 flex items-center gap-2">
            <span class="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Step 2</span>
            <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Role</p>
          </div>
          <p class="mb-3 text-[10px] text-slate-500">
            Type a custom role or pick from the groups below.
            {engine === 'ddg' && ' DDG uses your first 2 selected roles only.'}
            {engine === 'bing' && ' Bing includes primary name + up to 2 aliases per role.'}
            {engine === 'google' && ' Google expands all selected roles with their full alias list.'}
          </p>
          <input
            type="text"
            placeholder="e.g. Quantitative Analyst, Research Engineer..."
            value={customRole}
            onInput={(e) => setCustomRole((e.target as HTMLInputElement).value)}
            class="cn-input px-4"
          />
          {customRole.trim() && (
            <button
              type="button"
              onClick={() => {
                if (!selRoles.includes(customRole.trim())) setSelRoles([...selRoles, customRole.trim()]);
                setCustomRole('');
              }}
              class="mt-2 rounded-lg bg-violet-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-600 transition-colors"
            >
              Add role
            </button>
          )}
        </div>

        {/* Role groups */}
        {roleGroups.map((group) => (
          <div key={group.label} class="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">{group.label}</p>
            <div class="flex flex-wrap gap-2">
              {group.roles.map((role) => (
                <div key={role.label} class="flex flex-col gap-0.5">
                  <Pill label={role.label} selected={selRoles.includes(role.label)} onClick={() => toggle(selRoles, role.label, setSelRoles)} />
                  {role.aliases && role.aliases.length > 0 && engine !== 'ddg' && (
                    <p class="text-center text-[9px] text-slate-600 leading-none">
                      {role.aliases.slice(0, engine === 'bing' ? 2 : undefined).join(', ')}{engine === 'google' && role.aliases.length > 2 ? ` +${role.aliases.length - 2}` : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Level */}
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">Career Level</p>
          {engine === 'ddg' && (
            <p class="mb-2 text-[10px] text-emerald-600">DDG: only the first selected level is used in the query.</p>
          )}
          {engine === 'bing' && (
            <p class="mb-2 text-[10px] text-blue-600">Bing: level query simplified to primary keyword per selection.</p>
          )}
          <div class="flex flex-wrap gap-2 mt-2">
            {levels.map((l) => (
              <Pill key={l.label} label={l.label} selected={selLevels.includes(l.label)} onClick={() => toggle(selLevels, l.label, setSelLevels)} />
            ))}
          </div>
        </div>

        {/* ATS */}
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">Application Type (ATS)</p>
          {engine === 'bing' && (
            <div class="mb-3 rounded border border-blue-900/50 bg-blue-950/20 px-3 py-1.5">
              <p class="text-[10px] text-blue-500">Bing caps site: operators at 3. Only the first 3 ATS domains across all selected tiers will be included.</p>
            </div>
          )}
          {engine === 'ddg' && (
            <div class="mb-3 rounded border border-emerald-900/50 bg-emerald-950/20 px-3 py-1.5">
              <p class="text-[10px] text-emerald-500">DDG works best with a single site: operator. Only the first site from your first selected ATS tier will be used.</p>
            </div>
          )}
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3 mt-2">
            {atsSegments.map((seg) => {
              const isSelected = selATS.includes(seg.key);
              const sitesShown = engine === 'bing' ? Math.min(seg.sites.length, 2) : engine === 'ddg' ? 1 : 2;
              return (
                <button
                  key={seg.key}
                  type="button"
                  onClick={() => toggle(selATS, seg.key, setSelATS)}
                  class={[
                    'rounded-xl border p-4 text-left transition-all',
                    isSelected ? `${ATS_COLOR[seg.color]} ring-1` : 'border-slate-700 bg-slate-950 hover:border-slate-600',
                  ].join(' ')}
                >
                  <div class="mb-1 flex items-center justify-between">
                    <span class="text-sm font-semibold text-white">{seg.label}</span>
                    {isSelected && (
                      <svg class="h-3.5 w-3.5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <path d="M5 13l4 4L19 7"/>
                      </svg>
                    )}
                  </div>
                  <p class="text-xs text-slate-500">{seg.sublabel}</p>
                  <div class="mt-2 flex flex-wrap gap-1">
                    {seg.sites.slice(0, sitesShown).map((s) => (
                      <span key={s} class={`rounded px-1.5 py-0.5 text-[10px] font-mono ${ATS_BADGE[seg.color]}`}>{s.split('.')[0]}</span>
                    ))}
                    {seg.sites.length > sitesShown && <span class="rounded px-1.5 py-0.5 text-[10px] text-slate-500">+{seg.sites.length - sitesShown}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Location */}
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">Location</p>
          {engine === 'ddg'
            ? <p class="mb-3 text-[10px] text-emerald-600">DDG: only your first location is included. City input takes priority over hub selections.</p>
            : engine === 'bing'
              ? <p class="mb-3 text-[10px] text-blue-600">Bing: max 2 terms per hub, flat OR (no nested parens). City and country are appended as-is.</p>
              : <p class="mb-3 text-[10px] text-slate-500">Pick a region, type a city, or type a country - mix any combination.</p>
          }
          <div class="mb-4 flex flex-wrap gap-2">
            {locationHubs.map((loc) => (
              <Pill key={loc.label} label={loc.label} selected={selLocations.includes(loc.label)} onClick={() => toggle(selLocations, loc.label, setSelLocations)} />
            ))}
          </div>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p class="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-slate-500">Add city (optional)</p>
              <input type="text" placeholder="NYC, San Francisco, Bengaluru, London..." value={customCity}
                onInput={(e) => setCustomCity((e.target as HTMLInputElement).value)} class="cn-input px-4" />
            </div>
            <div>
              <p class="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-slate-500">Add country (optional)</p>
              <input type="text" placeholder="Netherlands, Japan, Brazil, South Korea..." value={customCountry}
                onInput={(e) => setCustomCountry((e.target as HTMLInputElement).value)} class="cn-input px-4" />
            </div>
          </div>
        </div>

        {/* Posted time */}
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div class="mb-1 flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Posted Time</p>
            {selTime && (
              <button type="button" onClick={() => setSelTime('')} class="text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
                Clear
              </button>
            )}
          </div>
          {(engine === 'bing' || engine === 'ddg') ? (
            <div class="mb-3 rounded border border-slate-700 bg-slate-950 px-3 py-2">
              <p class="text-[10px] text-slate-500">
                Date filtering via URL is Google-only (uses <span class="font-mono">tbs=</span> parameter).
                {engine === 'bing' ? " On Bing, use the 'Date' dropdown in search results after opening." : " On DDG, use the 'Any Time' dropdown in results after opening."}
              </p>
            </div>
          ) : (
            <div class="mb-3 flex flex-wrap gap-2 mt-1">
              {postedTimes.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setSelTime(selTime === t.label ? '' : t.label)}
                  class={[
                    'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                    selTime === t.label
                      ? 'border-amber-600 bg-amber-900 text-amber-200 ring-1 ring-amber-700'
                      : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200',
                  ].join(' ')}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Company / keyword */}
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">Company or Keyword</p>
          <p class="mb-3 text-[10px] text-slate-500 leading-relaxed">
            No idea which ATS a company uses? Just type the company name. If you know the ATS, select a tier above instead.
          </p>
          <input
            type="text"
            placeholder="e.g. Stripe, OpenAI, Palantir, fintech, healthcare..."
            value={companyFilter}
            onInput={(e) => setCompanyFilter((e.target as HTMLInputElement).value)}
            class="cn-input px-4"
          />
        </div>

      </div>

      {/* Right: Query output (sticky) */}
      <div class="lg:sticky lg:top-28 lg:self-start space-y-4">

        {/* Active selections */}
        {hasSelections && (
          <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p class="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Active Filters</p>
            <div class="flex flex-wrap gap-1.5">
              {selRoles.map((r) => (
                <button key={r} type="button" onClick={() => setSelRoles(selRoles.filter((x) => x !== r))}
                  class="flex items-center gap-1 rounded-md bg-violet-900 border border-violet-700 px-2 py-0.5 text-[11px] text-violet-200 hover:bg-violet-800 transition-colors">
                  {r}<span class="text-violet-400">x</span>
                </button>
              ))}
              {selLevels.map((l) => (
                <button key={l} type="button" onClick={() => setSelLevels(selLevels.filter((x) => x !== l))}
                  class="flex items-center gap-1 rounded-md bg-blue-900 border border-blue-700 px-2 py-0.5 text-[11px] text-blue-200 hover:bg-blue-800 transition-colors">
                  {l}<span class="text-blue-400">x</span>
                </button>
              ))}
              {selLocations.map((loc) => (
                <button key={loc} type="button" onClick={() => setSelLocations(selLocations.filter((x) => x !== loc))}
                  class="flex items-center gap-1 rounded-md bg-emerald-900 border border-emerald-700 px-2 py-0.5 text-[11px] text-emerald-200 hover:bg-emerald-800 transition-colors">
                  {loc}<span class="text-emerald-400">x</span>
                </button>
              ))}
              {customCity.trim() && (
                <button type="button" onClick={() => setCustomCity('')}
                  class="flex items-center gap-1 rounded-md bg-emerald-900 border border-emerald-700 px-2 py-0.5 text-[11px] text-emerald-200 hover:bg-emerald-800 transition-colors">
                  {customCity.trim()}<span class="text-emerald-400">x</span>
                </button>
              )}
              {customCountry.trim() && (
                <button type="button" onClick={() => setCustomCountry('')}
                  class="flex items-center gap-1 rounded-md bg-emerald-900 border border-emerald-700 px-2 py-0.5 text-[11px] text-emerald-200 hover:bg-emerald-800 transition-colors">
                  {customCountry.trim()}<span class="text-emerald-400">x</span>
                </button>
              )}
              {selATS.map((a) => {
                const seg = atsSegments.find((s) => s.key === a);
                return (
                  <button key={a} type="button" onClick={() => setSelATS(selATS.filter((x) => x !== a))}
                    class="flex items-center gap-1 rounded-md bg-amber-900 border border-amber-700 px-2 py-0.5 text-[11px] text-amber-200 hover:bg-amber-800 transition-colors">
                    {seg?.label}<span class="text-amber-400">x</span>
                  </button>
                );
              })}
              {selTime && (
                <button type="button" onClick={() => setSelTime('')}
                  class="flex items-center gap-1 rounded-md bg-amber-900 border border-amber-700 px-2 py-0.5 text-[11px] text-amber-200 hover:bg-amber-800 transition-colors">
                  {selTime}<span class="text-amber-400">x</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Query box */}
        <div class="rounded-xl border border-slate-700 bg-[#080810] overflow-hidden">
          <div class="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-400">Query</span>
              <span class={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${ENGINE_META[engine].btnActive}`}>
                {ENGINE_META[engine].label}
              </span>
            </div>
            <div class="flex items-center gap-2">
              {(query || selTime) && (
                <button type="button" onClick={handleReset} class="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-400 hover:text-white transition-colors">
                  Reset all
                </button>
              )}
              <button
                type="button"
                onClick={handleCopy}
                disabled={!query}
                class={[
                  'rounded px-2.5 py-1 text-[11px] font-medium transition-colors',
                  query ? copied ? 'bg-emerald-800 text-emerald-300' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        : 'bg-slate-900 text-slate-600 cursor-not-allowed',
                ].join(' ')}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
          <pre class="min-h-[140px] whitespace-pre-wrap break-words px-4 py-4 font-mono text-[11px] text-slate-300 leading-relaxed">
            {query || (
              <span class="text-slate-600">
                Pick an engine above, then select a role to generate your query.{'\n'}
                Query syntax adapts automatically for the chosen engine.
              </span>
            )}
          </pre>
          {selTime && engine === 'google' && (
            <div class="border-t border-slate-800 px-4 py-2 flex items-center gap-2">
              <span class="text-[10px] text-slate-500">Time filter:</span>
              <span class="rounded bg-amber-900 border border-amber-800 px-2 py-0.5 text-[10px] text-amber-300 font-mono">{selectedTimeObj?.tbs}</span>
              <span class="text-[10px] text-slate-600">appended to Google URL</span>
            </div>
          )}
          {(engine === 'bing' || engine === 'ddg') && selTime && (
            <div class="border-t border-slate-800 px-4 py-2 flex items-center gap-2">
              <span class="text-[10px] text-slate-500">Time filter ignored on {ENGINE_META[engine].label} - use their UI filters instead.</span>
            </div>
          )}
        </div>

        {/* Cooldown panel - Google only */}
        {engine === 'google' && cooldown.type !== 'none' && (
          <div class={[
            'rounded-xl border p-4',
            cooldown.type === 'hard' ? 'border-red-900 bg-red-950/40' : 'border-amber-900 bg-amber-950/40',
          ].join(' ')}>
            <div class="flex items-center gap-3 mb-2">
              <span
                class={`font-mono text-2xl font-bold tabular-nums ${cooldown.type === 'hard' ? 'text-red-400' : 'text-amber-400'}`}
              >
                {formatCooldownTime(cooldown.secondsLeft)}
              </span>
              <div>
                <p class={`text-xs font-bold ${cooldown.type === 'hard' ? 'text-red-300' : 'text-yellow-300'}`}>
                  {cooldown.type === 'hard' ? 'Deep Freeze Active' : 'IP Protection Active'}
                </p>
                <p class="text-[10px] text-slate-400">
                  {cooldown.type === 'hard'
                    ? `${cooldown.recentClicks} dorks in 3 min. Pausing to keep your IP off Google's radar.`
                    : 'Keeping 45s between Google dorks. Switch to Bing or DDG for no limits.'}
                </p>
              </div>
            </div>
            {cooldown.type === 'hard' && (
              <button
                type="button"
                onClick={() => setEngine('bing')}
                class="w-full rounded-lg bg-blue-900 border border-blue-800 py-1.5 text-xs font-semibold text-blue-200 hover:bg-blue-800 transition-colors"
              >
                Switch to Bing now - query rewrites automatically
              </button>
            )}
          </div>
        )}

        {/* Search button */}
        <button
          type="button"
          onClick={handleSearch}
          disabled={!canSearch}
          class={['w-full rounded-lg py-2.5 text-sm font-semibold transition-colors', getButtonClass()].join(' ')}
        >
          {getButtonLabel()}
          {selTime && engine === 'google' && cooldown.type === 'none' && (
            <span class="ml-1 text-[11px] font-normal opacity-70">({selTime})</span>
          )}
        </button>

        {/* Aliases note */}
        {engine === 'google' && selRoles.some((r) => roleMap[r]?.aliases?.length) && (
          <div class="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <p class="text-[10px] text-slate-500 leading-relaxed">
              <span class="text-slate-400 font-medium">Aliases included:</span> Google mode expands each role with all shorthand variants (SWE, SDE, etc.) in the query.
            </p>
          </div>
        )}
        {engine === 'bing' && selRoles.some((r) => (roleMap[r]?.aliases?.length ?? 0) > 2) && (
          <div class="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <p class="text-[10px] text-slate-500 leading-relaxed">
              <span class="text-slate-400 font-medium">Bing mode:</span> Aliases capped at 2 per role. Switch to Google for full alias expansion.
            </p>
          </div>
        )}

        {/* Tips */}
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-2">
          <p class="text-xs font-semibold text-white">Engine guide</p>
          {engine === 'google' && (
            <>
              <p class="text-xs text-slate-400 leading-relaxed">Google indexes ATS pages fastest and supports the most complex Boolean queries. Use it for precise, nested dorks.</p>
              <p class="text-xs text-slate-400 leading-relaxed">Query jitter is applied automatically on each click - your URL differs slightly from the next user's on the same IP, reducing shared-IP flagging risk.</p>
              <p class="text-xs text-slate-400 leading-relaxed">On a shared network (dorm, office)? Switch to Bing or DDG to avoid contributing to a shared-IP flag.</p>
            </>
          )}
          {engine === 'bing' && (
            <>
              <p class="text-xs text-slate-400 leading-relaxed">Bing indexes most major ATS platforms (Greenhouse, Lever, Workday) reliably and is far more lenient on complex queries from shared IPs.</p>
              <p class="text-xs text-slate-400 leading-relaxed">Bing requires OR to be capitalized (it is, automatically). Lowercase "or" is treated as a search keyword on Bing.</p>
              <p class="text-xs text-slate-400 leading-relaxed">No jitter is applied on Bing - the minus operator works differently and adding noise terms can reduce result quality.</p>
            </>
          )}
          {engine === 'ddg' && (
            <>
              <p class="text-xs text-slate-400 leading-relaxed">DuckDuckGo does not log your IP or search history. It aggregates results primarily from Bing's API, so ATS indexing is solid.</p>
              <p class="text-xs text-slate-400 leading-relaxed">DDG doesn't support intitle: or inurl: reliably. Stick to site: and keyword terms. Complex OR chains are flattened into keyword searches.</p>
              <p class="text-xs text-slate-400 leading-relaxed">If DDG returns zero results, it won't show a CAPTCHA - it simply says "nothing found." That's the DDG way of signaling a query that's too complex.</p>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
