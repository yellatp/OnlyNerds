/**
 * Dork Safety - Progressive IP protection for Google search queries.
 *
 * Why this exists:
 * Google detects high-velocity automated probes from a single IP. When multiple
 * users share an IP (university dorm, office NAT) and fire complex dork queries
 * simultaneously, Google sees one source and issues a 429 or persistent CAPTCHA.
 *
 * Strategy:
 *  - 45s soft cooldown after each Google dork (one click = one count)
 *  - 5-minute deep freeze after 5 dorks in any 3-minute window
 *  - Bing and DuckDuckGo: no cooldown (much more lenient on complex queries)
 *  - Query jitter: appends a short unique hex token to each URL so identical
 *    queries from different users on the same IP look distinct to Google
 *  - localStorage persistence: survives page refresh
 */

const STORAGE_KEY    = 'on_dork_ts';
const SOFT_MS        = 45_000;        // 45 s between Google dorks
const HARD_THRESHOLD = 5;             // N clicks in HARD_WINDOW → deep freeze
const HARD_WINDOW_MS = 3 * 60_000;   // 3-minute sliding window
const HARD_MS        = 5 * 60_000;   // 5-minute deep freeze

export type CooldownType = 'none' | 'soft' | 'hard';

export interface CooldownState {
  type: CooldownType;
  secondsLeft: number;
  recentClicks: number; // clicks in last 3 min (for UI messaging)
}

function load(): number[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as number[]; }
  catch { return []; }
}

function save(ts: number[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ts));
}

/** Call once per Google dork click. */
export function recordDorkClick(): void {
  const now = Date.now();
  const ts = load().filter((t) => now - t < HARD_MS * 3); // drop ancient history
  ts.push(now);
  save(ts);
}

/** Returns current cooldown state derived from localStorage. Safe to call every second. */
export function getCooldownState(): CooldownState {
  const now = Date.now();
  const ts  = load();
  if (!ts.length) return { type: 'none', secondsLeft: 0, recentClicks: 0 };

  const inWindow = ts.filter((t) => now - t < HARD_WINDOW_MS);

  // Hard freeze: too many clicks in the sliding window
  if (inWindow.length >= HARD_THRESHOLD) {
    const freezeEnd = inWindow[0] + HARD_MS;
    if (now < freezeEnd) {
      return {
        type: 'hard',
        secondsLeft: Math.ceil((freezeEnd - now) / 1000),
        recentClicks: inWindow.length,
      };
    }
  }

  // Soft cooldown: less than 45s since last click
  const last = Math.max(...ts);
  if (now - last < SOFT_MS) {
    return {
      type: 'soft',
      secondsLeft: Math.ceil((last + SOFT_MS - now) / 1000),
      recentClicks: inWindow.length,
    };
  }

  return { type: 'none', secondsLeft: 0, recentClicks: inWindow.length };
}

/**
 * Appends a 6-char hex jitter token to the query.
 * Makes each user's query technically unique on the same IP.
 * The -"x…" operator excludes a string that no job posting contains,
 * so it has zero effect on results.
 */
export function withJitter(query: string): string {
  const j = Math.random().toString(16).slice(2, 8);
  return `${query} -"x${j}"`;
}

/** Build the final search URL for the chosen engine with jitter applied. */
export function buildEngineUrl(
  query: string,
  engine: 'google' | 'bing' | 'ddg',
  tbs?: string,
): string {
  const q = encodeURIComponent(withJitter(query));
  if (engine === 'bing') return `https://www.bing.com/search?q=${q}`;
  if (engine === 'ddg')  return `https://duckduckgo.com/?q=${q}`;
  let url = `https://www.google.com/search?q=${q}`;
  if (tbs) url += `&tbs=${tbs}`;
  return url;
}

/** Inject jitter into an existing Google search URL's q param. */
export function jitterGoogleUrl(url: string): string {
  try {
    const u = new URL(url);
    const q = u.searchParams.get('q') ?? '';
    u.searchParams.set('q', withJitter(q));
    return u.toString();
  } catch { return url; }
}

export function formatCooldownTime(secs: number): string {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}
