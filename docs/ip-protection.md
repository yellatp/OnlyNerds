# IP Protection - Design, Mechanics, and Limits

## Why IP Protection Exists

Google detects "automated-like" query patterns from a single IP address. Complex Boolean queries - especially with multiple `site:` operators - are a strong signal. When multiple users share a public IP (university dorm, office NAT, coffee shop Wi-Fi), they appear as a single source to Google.

The result is either:
- A CAPTCHA interstitial (annoying, resolvable)
- A `429 Too Many Requests` page (temporary block, 4-24 hours)
- Silent result degradation (Google returns results but quietly throttles quality)

**None of these can be fixed client-side once they happen.** The goal of this system is prevention.

---

## Layer 1 - Progressive Cooldown (localStorage)

After each Google dork click, a timestamp is recorded in `localStorage` under the key `on_dork_ts`.

```
Soft cooldown: 45 seconds after any Google dork
Hard freeze:   5 minutes if >= 5 dorks in any 3-minute sliding window
```

The UI communicates this clearly:
- Button shows `IP Protection: 32s` during soft cooldown (amber)
- Button shows `Deep Freeze: 4m 12s` during hard freeze (red)
- A "Switch to Bing now" button appears during hard freeze

### Why 45 seconds (not less)?

Google's anti-bot system measures query velocity per IP. One complex dork every 45 seconds is well within normal human behavior. Anything faster than ~20 seconds starts to look automated from a shared IP.

### Why 5 dorks in 3 minutes triggers the freeze?

5 complex dork queries in 3 minutes from a single IP is the threshold where Google typically starts showing CAPTCHAs. The freeze is intentionally conservative to leave a safety margin.

### What localStorage persistence means

The cooldown survives page refreshes. If you fire 4 dorks, close the tab, and reopen it 1 minute later, the system will correctly calculate the remaining window. The timestamps are stored as a JSON array of Unix milliseconds and cleaned up automatically after 15 minutes.

---

## Layer 2 - Query Jitter

Every Google URL gets a unique "jitter token" appended automatically:

```
-"x1faa64"
```

The format is `-"x{6-char random hex}"`. The minus operator excludes this string from results. Since the string is random nonsense that no job posting will ever contain, it has **zero effect on result quality**.

What it does: makes each user's URL technically distinct at the string level. From Google's perspective, two users on the same IP searching for:

```
"data engineer" site:greenhouse.io -"x1faa64"
"data engineer" site:greenhouse.io -"xa92b11"
```

...are two different queries, not duplicate automated probes of the same query.

### Why jitter is Google-only

**Bing:** The minus operator works differently on Bing. Bing can sometimes apply exclusion more aggressively at the domain level, not just string matching. Adding a random minus term introduces unpredictable behavior. Bing also doesn't have the same IP-based velocity detection problem (it's far more lenient).

**DuckDuckGo:** DDG's minus operator is extremely aggressive - it can suppress entire pages that contain a similar string anywhere in their metadata, not just visible text. Adding jitter noise could legitimately exclude real results. DDG also routes through a proxy layer, so the shared-IP problem is structurally different.

---

## Layer 3 - Multi-Engine Routing

The engine selector in the Job Search Builder is the most important safety feature. Each engine has a different risk profile:

| Engine       | IP Rate Limits | Complex Queries | Privacy |
| ------------ | -------------- | --------------- | ------- |
| Google       | Strict         | Full support    | Logged  |
| Bing         | Lenient        | Partial support | Logged  |
| DuckDuckGo   | Effectively none | Linear only  | Not logged |

When you switch engines, the query is **completely regenerated** for that engine's syntax. This is not a copy-paste - it's a different query string built by a different function (`buildGoogleQuery`, `buildBingQuery`, `buildDDGQuery` in `JobSearchBuilder.tsx`).

During a hard freeze, a "Switch to Bing now - query rewrites automatically" button appears. Clicking it switches the engine selector to Bing, which immediately regenerates the query in Bing-compatible syntax and removes the cooldown block (Bing has no cooldown).

---

## The Shared IP Problem

The single hardest problem to solve without a backend.

When 10 students in a dorm all use OnlyNerds at 9pm to search for jobs, they all share the same dormitory IP. Each student's localStorage is separate - each one might be within their own 45-second cooldown window. But from Google's perspective, 10 complex dork queries fired from one IP in 5 minutes is bot activity.

### What we do about it

**Jitter** makes each query URL string distinct, which helps at the cache/deduplication layer but does not fool Google's IP-level velocity detection.

**The real answer is engine routing:** in a shared-IP environment, Bing and DuckDuckGo are strictly safer. We communicate this in the UI via the engine selector notes and the Pro Tips panel.

There is no client-side technical solution that fully eliminates shared-IP risk. A proper solution would require:
- A server-side proxy that rotates residential IPs per request
- Rate limiting at the server level across all users
- Request queuing

OnlyNerds is a static site with no backend. These are architectural solutions that are out of scope.

---

## What the System Cannot Fix

### 1. Existing IP flags

If your IP is already flagged (you're seeing CAPTCHAs or 429 pages on Google), the cooldown system will not un-flag you. Google IP flags typically clear within 4-24 hours, sometimes longer. The only reliable fixes are:
- Wait (usually resolves by the next day)
- Switch to mobile data (different IP)
- Use a VPN (different IP)
- Use Bing or DuckDuckGo (not affected by Google's IP flags)

### 2. Network-level flags

Some universities and large corporate networks have their entire IP range flagged by Google due to past automated activity by other users. If Google consistently CAPTCHAs you even after waiting, this is the likely cause. Again: Bing and DDG are unaffected.

### 3. Aggressive scraper protection on specific ATS platforms

Some ATS platforms (not search engines) have their own bot detection. Rapidly visiting many `greenhouse.io` job pages from the same IP can trigger Cloudflare protection on the ATS side, not the search engine side. The cooldown system only addresses search engine rate-limiting, not downstream ATS protection.

### 4. The DDG zero-results problem

DuckDuckGo does not show a CAPTCHA when it detects "automated-like" behavior. It silently returns zero results with a "We couldn't find anything" message. If you're using DDG and seeing zero results on a query that should return results, the query may be too complex (DDG is flattening the Boolean), or DDG may be rate-limiting the upstream Bing API call. Simplify the query or try again after a minute.

---

## Implementation Files

| File | Role |
| ---- | ---- |
| `src/data/dorkSafety.ts` | Core cooldown logic, jitter, engine URL builders |
| `src/components/jobsearch/JobSearchBuilder.tsx` | UI: engine selector, cooldown display, per-engine query generation |

### dorkSafety.ts exports

```typescript
recordDorkClick()                              // call on each Google dork
getCooldownState(): CooldownState             // poll every second for UI
buildEngineUrl(query, engine, tbs?): string  // final URL, jitter on Google only
withJitter(query): string                     // appends -"x{hex}"
formatCooldownTime(secs): string             // "45s", "4m 12s"
```

Constants (defined at top of file):

```typescript
SOFT_MS        = 45_000        // 45s soft cooldown
HARD_THRESHOLD = 5             // clicks in window to trigger freeze
HARD_WINDOW_MS = 3 * 60_000   // 3-minute sliding window
HARD_MS        = 5 * 60_000   // 5-minute deep freeze
```
