import { useState, useMemo } from 'react';
import type { RoleGroup, ATSSegment, Level, LocationHub, PostedTime } from '../../data/jobSearch';

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
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
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

export default function JobSearchBuilder({ roleGroups, atsSegments, levels, locationHubs, postedTimes }: Props) {
  const [customRole, setCustomRole]       = useState('');
  const [selRoles, setSelRoles]           = useState<string[]>([]);
  const [selATS, setSelATS]               = useState<string[]>([]);
  const [selLevels, setSelLevels]         = useState<string[]>([]);
  const [selLocations, setSelLocations]   = useState<string[]>([]);
  const [selTime, setSelTime]             = useState<string>('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [copied, setCopied]               = useState(false);

  // Flat map of label -> role object for alias lookup
  const roleMap = useMemo(() => {
    const map: Record<string, { label: string; aliases?: string[] }> = {};
    roleGroups.forEach((g) => g.roles.forEach((r) => { map[r.label] = r; }));
    return map;
  }, [roleGroups]);

  function toggle<T>(arr: T[], item: T, set: (v: T[]) => void) {
    set(arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]);
  }

  const query = useMemo(() => {
    const parts: string[] = [];

    // Roles + aliases
    if (selRoles.length > 0) {
      const terms: string[] = [];
      selRoles.forEach((label) => {
        terms.push(`"${label}"`);
        const role = roleMap[label];
        if (role?.aliases) {
          role.aliases.forEach((a) => terms.push(`"${a}"`));
        }
      });
      parts.push(`(${terms.join(' OR ')})`);
    }

    // Level
    if (selLevels.length > 0) {
      const levelQueries = levels
        .filter((l) => selLevels.includes(l.label))
        .map((l) => l.query);
      if (levelQueries.length > 0) {
        parts.push(`(${levelQueries.join(' OR ')})`);
      }
    }

    // Location
    if (selLocations.length > 0) {
      const locTerms = locationHubs
        .filter((l) => selLocations.includes(l.label))
        .flatMap((l) => l.terms);
      if (locTerms.length > 0) {
        parts.push(`(${locTerms.join(' OR ')})`);
      }
    }

    // ATS (site: operators)
    if (selATS.length > 0) {
      const sites = atsSegments
        .filter((a) => selATS.includes(a.key))
        .flatMap((a) => a.sites)
        .map((s) => `site:${s}`);
      if (sites.length > 0) {
        parts.push(`(${sites.join(' OR ')})`);
      }
    }

    // Company filter
    if (companyFilter.trim()) {
      parts.push(`"${companyFilter.trim()}"`);
    }

    return parts.join('\n');
  }, [selRoles, selLevels, selLocations, selATS, companyFilter, levels, atsSegments, locationHubs, roleMap]);

  // Time filter goes into URL params, not the text query
  const selectedTimeObj = postedTimes.find((t) => t.label === selTime);
  const searchUrl = useMemo(() => {
    if (!query) return '';
    let url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    if (selectedTimeObj) url += `&tbs=${selectedTimeObj.tbs}`;
    return url;
  }, [query, selectedTimeObj]);

  function handleCopy() {
    if (!query) return;
    navigator.clipboard.writeText(query).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleReset() {
    setSelRoles([]);
    setSelATS([]);
    setSelLevels([]);
    setSelLocations([]);
    setSelTime('');
    setCompanyFilter('');
    setCustomRole('');
  }

  const hasSelections = selRoles.length > 0 || selLevels.length > 0 || selLocations.length > 0 || selATS.length > 0 || selTime !== '';

  return (
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">

      {/* Left: Builder */}
      <div class="space-y-6">

        {/* Custom role input */}
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Type a role (optional)
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
                if (!selRoles.includes(customRole.trim())) {
                  setSelRoles([...selRoles, customRole.trim()]);
                }
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
            <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              {group.label}
            </p>
            <div class="flex flex-wrap gap-2">
              {group.roles.map((role) => (
                <div key={role.label} class="flex flex-col gap-0.5">
                  <Pill
                    label={role.label}
                    selected={selRoles.includes(role.label)}
                    onClick={() => toggle(selRoles, role.label, setSelRoles)}
                  />
                  {role.aliases && role.aliases.length > 0 && (
                    <p class="text-center text-[9px] text-slate-600 leading-none">
                      {role.aliases.slice(0, 2).join(', ')}
                      {role.aliases.length > 2 ? ` +${role.aliases.length - 2}` : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Level */}
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Career Level</p>
          <div class="flex flex-wrap gap-2">
            {levels.map((l) => (
              <Pill
                key={l.label}
                label={l.label}
                selected={selLevels.includes(l.label)}
                onClick={() => toggle(selLevels, l.label, setSelLevels)}
              />
            ))}
          </div>
        </div>

        {/* ATS */}
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Application Type (ATS)</p>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {atsSegments.map((seg) => {
              const isSelected = selATS.includes(seg.key);
              return (
                <button
                  key={seg.key}
                  type="button"
                  onClick={() => toggle(selATS, seg.key, setSelATS)}
                  class={[
                    'rounded-xl border p-4 text-left transition-all',
                    isSelected
                      ? `${ATS_COLOR[seg.color]} ring-1`
                      : 'border-slate-700 bg-slate-950 hover:border-slate-600',
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
                    {seg.sites.slice(0, 2).map((s) => (
                      <span key={s} class={`rounded px-1.5 py-0.5 text-[10px] font-mono ${ATS_BADGE[seg.color]}`}>
                        {s.split('.')[0]}
                      </span>
                    ))}
                    {seg.sites.length > 2 && (
                      <span class="rounded px-1.5 py-0.5 text-[10px] text-slate-500">+{seg.sites.length - 2}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Location */}
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Location</p>
          <div class="flex flex-wrap gap-2">
            {locationHubs.map((loc) => (
              <Pill
                key={loc.label}
                label={loc.label}
                selected={selLocations.includes(loc.label)}
                onClick={() => toggle(selLocations, loc.label, setSelLocations)}
              />
            ))}
          </div>
        </div>

        {/* Posted time */}
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Posted Time</p>
            {selTime && (
              <button
                type="button"
                onClick={() => setSelTime('')}
                class="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <div class="flex flex-wrap gap-2">
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
          <p class="mt-2 text-[10px] text-slate-600">Time filter applies to Google search, not the query text itself.</p>
        </div>

        {/* Company / keyword */}
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Company or keyword (optional)
          </p>
          <input
            type="text"
            placeholder="e.g. Stripe, OpenAI, fintech, healthcare..."
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
                <button
                  key={r}
                  type="button"
                  onClick={() => setSelRoles(selRoles.filter((x) => x !== r))}
                  class="flex items-center gap-1 rounded-md bg-violet-900 border border-violet-700 px-2 py-0.5 text-[11px] text-violet-200 hover:bg-violet-800 transition-colors"
                >
                  {r}
                  <span class="text-violet-400">x</span>
                </button>
              ))}
              {selLevels.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setSelLevels(selLevels.filter((x) => x !== l))}
                  class="flex items-center gap-1 rounded-md bg-blue-900 border border-blue-700 px-2 py-0.5 text-[11px] text-blue-200 hover:bg-blue-800 transition-colors"
                >
                  {l}
                  <span class="text-blue-400">x</span>
                </button>
              ))}
              {selLocations.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setSelLocations(selLocations.filter((x) => x !== loc))}
                  class="flex items-center gap-1 rounded-md bg-emerald-900 border border-emerald-700 px-2 py-0.5 text-[11px] text-emerald-200 hover:bg-emerald-800 transition-colors"
                >
                  {loc}
                  <span class="text-emerald-400">x</span>
                </button>
              ))}
              {selATS.map((a) => {
                const seg = atsSegments.find((s) => s.key === a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setSelATS(selATS.filter((x) => x !== a))}
                    class="flex items-center gap-1 rounded-md bg-amber-900 border border-amber-700 px-2 py-0.5 text-[11px] text-amber-200 hover:bg-amber-800 transition-colors"
                  >
                    {seg?.label}
                    <span class="text-amber-400">x</span>
                  </button>
                );
              })}
              {selTime && (
                <button
                  type="button"
                  onClick={() => setSelTime('')}
                  class="flex items-center gap-1 rounded-md bg-amber-900 border border-amber-700 px-2 py-0.5 text-[11px] text-amber-200 hover:bg-amber-800 transition-colors"
                >
                  {selTime}
                  <span class="text-amber-400">x</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Query box */}
        <div class="rounded-xl border border-slate-700 bg-[#080810] overflow-hidden">
          <div class="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <span class="text-xs font-semibold text-slate-400">Generated Query</span>
            <div class="flex items-center gap-2">
              {(query || selTime) && (
                <button
                  type="button"
                  onClick={handleReset}
                  class="rounded bg-slate-800 px-2 py-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                >
                  Reset all
                </button>
              )}
              <button
                type="button"
                onClick={handleCopy}
                disabled={!query}
                class={[
                  'rounded px-2.5 py-1 text-[11px] font-medium transition-colors',
                  query
                    ? copied
                      ? 'bg-emerald-800 text-emerald-300'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
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
                Select a role above to generate your search query.{'\n'}
                All fields are optional. Role alone is enough to start.
              </span>
            )}
          </pre>
          {selTime && (
            <div class="border-t border-slate-800 px-4 py-2 flex items-center gap-2">
              <span class="text-[10px] text-slate-500">Time filter:</span>
              <span class="rounded bg-amber-900 border border-amber-800 px-2 py-0.5 text-[10px] text-amber-300 font-mono">{selectedTimeObj?.tbs}</span>
              <span class="text-[10px] text-slate-600">applied to Google URL</span>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div class="flex gap-3">
          <a
            href={searchUrl || undefined}
            target="_blank"
            rel="noopener noreferrer"
            class={[
              'flex-1 rounded-lg py-2.5 text-center text-sm font-semibold transition-colors',
              searchUrl
                ? 'bg-violet-600 text-white hover:bg-violet-500'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed pointer-events-none',
            ].join(' ')}
          >
            Search on Google
            {selTime && <span class="ml-1 text-[11px] font-normal opacity-70">({selTime})</span>}
          </a>
        </div>

        {/* Aliases note */}
        {selRoles.some((r) => roleMap[r]?.aliases?.length) && (
          <div class="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <p class="text-[10px] text-slate-500 leading-relaxed">
              <span class="text-slate-400 font-medium">Aliases included:</span> Selected roles automatically expand to include shorthand variants (SWE, SDE, etc.) in the search query.
            </p>
          </div>
        )}

        {/* Tip */}
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p class="mb-1 text-xs font-semibold text-white">Pro tip</p>
          <p class="text-xs text-slate-400 leading-relaxed">
            No role selected? Enter a company name and pick an ATS tier to find all open roles at that company across major platforms.
            Add a time filter to catch fresh postings before they fill up.
          </p>
        </div>

      </div>
    </div>
  );
}
