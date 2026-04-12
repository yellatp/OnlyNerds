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

const ENGINE_LABELS: Record<Engine, string> = {
  google: 'Google',
  bing:   'Bing',
  ddg:    'DuckDuckGo',
};

const ENGINE_ACTIVE: Record<Engine, string> = {
  google: 'bg-violet-700 text-white',
  bing:   'bg-blue-700 text-white',
  ddg:    'bg-emerald-700 text-white',
};

const ENGINE_BTN: Record<Engine, string> = {
  google: 'bg-violet-600 hover:bg-violet-500 text-white',
  bing:   'bg-blue-600 hover:bg-blue-500 text-white',
  ddg:    'bg-emerald-600 hover:bg-emerald-500 text-white',
};

export default function JobSearchBuilder({ roleGroups, atsSegments, levels, locationHubs, postedTimes }: Props) {
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
  const [engine, setEngine]                 = useState<Engine>('google');
  const [cooldown, setCooldown]             = useState<CooldownState>({ type: 'none', secondsLeft: 0, recentClicks: 0 });

  // Poll cooldown state every second
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

  const query = useMemo(() => {
    const parts: string[] = [];

    if (selRoles.length > 0) {
      const terms: string[] = [];
      selRoles.forEach((label) => {
        terms.push(`"${label}"`);
        roleMap[label]?.aliases?.forEach((a) => terms.push(`"${a}"`));
      });
      parts.push(`(${terms.join(' OR ')})`);
    }

    if (selLevels.length > 0) {
      const lq = levels.filter((l) => selLevels.includes(l.label)).map((l) => l.query);
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
  }, [selRoles, selLevels, selLocations, customCity, customCountry, selATS, companyFilter, levels, atsSegments, locationHubs, roleMap]);

  const selectedTimeObj = postedTimes.find((t) => t.label === selTime);

  const isGoogleBlocked = engine === 'google' && cooldown.type !== 'none';
  const canSearch       = Boolean(query) && !isGoogleBlocked;

  function handleSearch() {
    if (!query || isGoogleBlocked) return;
    if (engine === 'google') recordDorkClick();
    const url = buildEngineUrl(query, engine, selectedTimeObj?.tbs);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function getButtonLabel(): string {
    if (!query) return 'Build a query first';
    if (cooldown.type === 'hard' && engine === 'google')
      return `Deep Freeze: ${formatCooldownTime(cooldown.secondsLeft)}`;
    if (cooldown.type === 'soft' && engine === 'google')
      return `IP Protection: ${cooldown.secondsLeft}s`;
    return `Search on ${ENGINE_LABELS[engine]}`;
  }

  function getButtonClass(): string {
    if (!query) return 'bg-slate-800 text-slate-500 cursor-not-allowed';
    if (cooldown.type === 'hard' && engine === 'google')
      return 'bg-red-950 border border-red-900 text-red-400 cursor-not-allowed font-mono';
    if (cooldown.type === 'soft' && engine === 'google')
      return 'bg-amber-950 border border-amber-900 text-amber-400 cursor-not-allowed font-mono';
    return ENGINE_BTN[engine];
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

        {/* Custom role input */}
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Type a role (optional)</p>
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
                  {role.aliases && role.aliases.length > 0 && (
                    <p class="text-center text-[9px] text-slate-600 leading-none">
                      {role.aliases.slice(0, 2).join(', ')}{role.aliases.length > 2 ? ` +${role.aliases.length - 2}` : ''}
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
              <Pill key={l.label} label={l.label} selected={selLevels.includes(l.label)} onClick={() => toggle(selLevels, l.label, setSelLevels)} />
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
                    {seg.sites.slice(0, 2).map((s) => (
                      <span key={s} class={`rounded px-1.5 py-0.5 text-[10px] font-mono ${ATS_BADGE[seg.color]}`}>{s.split('.')[0]}</span>
                    ))}
                    {seg.sites.length > 2 && <span class="rounded px-1.5 py-0.5 text-[10px] text-slate-500">+{seg.sites.length - 2}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Location */}
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">Location</p>
          <p class="mb-3 text-[10px] text-slate-500">Pick a region, type a city, or type a country - mix any combination.</p>
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
          <div class="mb-3 flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-widest text-slate-400">Posted Time</p>
            {selTime && (
              <button type="button" onClick={() => setSelTime('')} class="text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
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
          <p class="mt-2 text-[10px] text-slate-600">Time filter applies to Google search URL only. Not supported on Bing/DDG.</p>
        </div>

        {/* Company / keyword */}
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p class="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">Enter a company name or pick an ATS tier</p>
          <p class="mb-3 text-[10px] text-slate-500 leading-relaxed">
            No idea which ATS a company uses? Just type the company name. If you know the ATS, select a tier above instead. Either approach works.
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
            <span class="text-xs font-semibold text-slate-400">Generated Query</span>
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
                Select a role above to generate your search query.{'\n'}
                All fields are optional. Role alone is enough to start.
              </span>
            )}
          </pre>
          {selTime && (
            <div class="border-t border-slate-800 px-4 py-2 flex items-center gap-2">
              <span class="text-[10px] text-slate-500">Time filter:</span>
              <span class="rounded bg-amber-900 border border-amber-800 px-2 py-0.5 text-[10px] text-amber-300 font-mono">{selectedTimeObj?.tbs}</span>
              <span class="text-[10px] text-slate-600">Google only</span>
            </div>
          )}
        </div>

        {/* Engine selector */}
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p class="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Search Engine</p>
          <div class="mb-3 flex rounded-lg border border-slate-700 bg-slate-950 p-1">
            {(['google', 'bing', 'ddg'] as const).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEngine(e)}
                class={[
                  'flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors',
                  engine === e ? ENGINE_ACTIVE[e] : 'text-slate-500 hover:text-slate-300',
                ].join(' ')}
              >
                {ENGINE_LABELS[e]}
              </button>
            ))}
          </div>
          <p class="text-[10px] leading-relaxed" style={{ color: engine === 'google' ? '#706E66' : '#6ee7b7' }}>
            {engine === 'google'
              ? 'Google indexes ATS pages fastest but rate-limits complex queries from shared IPs. IP protection is active.'
              : engine === 'bing'
                ? 'Bing indexes most ATS platforms, is significantly more lenient on advanced queries, and has no cooldown here.'
                : 'DuckDuckGo does not log your IP, has no rate limits for dorking, and often surfaces results Google hides.'}
          </p>
        </div>

        {/* Cooldown state - shown only for Google */}
        {engine === 'google' && cooldown.type !== 'none' && (
          <div class={[
            'rounded-xl border p-4',
            cooldown.type === 'hard'
              ? 'border-red-900 bg-red-950/40'
              : 'border-amber-900 bg-amber-950/40',
          ].join(' ')}>
            <div class="flex items-center gap-3 mb-2">
              <span
                class="font-mono text-2xl font-bold tabular-nums"
                style={{ color: cooldown.type === 'hard' ? '#f87171' : '#fbbf24' }}
              >
                {formatCooldownTime(cooldown.secondsLeft)}
              </span>
              <div>
                <p class="text-xs font-bold" style={{ color: cooldown.type === 'hard' ? '#fca5a5' : '#fcd34d' }}>
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
                Switch to Bing now (no cooldown)
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
        {selRoles.some((r) => roleMap[r]?.aliases?.length) && (
          <div class="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <p class="text-[10px] text-slate-500 leading-relaxed">
              <span class="text-slate-400 font-medium">Aliases included:</span> Selected roles expand to include shorthand variants (SWE, SDE, etc.) in the query.
            </p>
          </div>
        )}

        {/* Tips */}
        <div class="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-2">
          <p class="text-xs font-semibold text-white">Pro tips</p>
          <p class="text-xs text-slate-400 leading-relaxed">
            Shared IP? Switch to Bing or DuckDuckGo - no cooldown, ATS indexing is solid, and they won't CAPTCHA you.
          </p>
          <p class="text-xs text-slate-400 leading-relaxed">
            Query jitter is applied automatically on each click - your URL will differ slightly from the next user's on the same IP, reducing shared-IP flagging.
          </p>
        </div>

      </div>
    </div>
  );
}
