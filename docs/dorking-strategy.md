# Dorking Strategy - What, Why, and What's Left

## What Is Google Dorking?

"Dorking" is using advanced search operators to surface pages that standard queries miss. The operators were documented by Johnny Long in 2004 as "Google Hacking" - but they're not hacking. They're just using the search engine's own syntax to be extremely specific.

For job searching, dorking solves a specific problem: **ATS job boards are usually not linked from homepages, not aggregated by LinkedIn or Indeed, and not crawled by typical job scraper APIs.** But Google, Bing, and DuckDuckGo index them anyway.

---

## The Core Operators Used

| Operator | Meaning | Example |
| -------- | ------- | ------- |
| `site:`  | Restrict results to one domain | `site:boards.greenhouse.io` |
| `"..."`  | Exact phrase match | `"data engineer"` |
| `OR`     | Either term (must be uppercase on Bing) | `"SWE" OR "Software Engineer"` |
| `( )`    | Group Boolean terms | `("NYC" OR "remote")` |
| `-`      | Exclude a term | `-"staffing agency"` |
| `tbs=`   | Date filter (Google URL param only) | `tbs=qdr:w` (past week) |

---

## How the Builder Works

The Job Search Builder (`/job-search`) generates engine-specific queries from a set of structured inputs:

```
Role group → alias expansion → ("title" OR "alias1" OR "alias2")
Level      → query string    → ("senior" OR "Sr.")
Location   → term list       → ("San Francisco" OR "SF Bay Area" OR "remote")
ATS tier   → site list       → (site:greenhouse.io OR site:lever.co)
Company    → exact phrase    → "Stripe"
Posted     → tbs= param      → tbs=qdr:d (Google only)
```

These are joined with implicit AND (each part must match). The parenthesized OR groups create flexibility within each dimension.

### Why Alias Expansion Matters

A company posting the same job might title it:
- "Software Engineer"
- "SWE"
- "Software Developer"
- "SDE"

Without aliases, you'd miss 3 out of 4. The role groups include common industry shorthands, and Google mode expands all of them.

---

## Engine-Specific Query Differences

Each engine's query is generated separately because the parsers are different. See [engine-differences.md](engine-differences.md) for the full breakdown.

**The key rule:** a query valid for Google will often return zero results on Bing or DDG if it has complex nesting. The builder handles this automatically when you pick your engine at Step 1.

---

## What Problems This Solves

### 1. Jobs that aren't on LinkedIn or Indeed

Most ATS platforms (Greenhouse, Lever, Workday, Ashby, Rippling) are separately indexed by Google. A role posted on `jobs.ashbyhq.com/stripe` will appear in a site-scoped dork within 24-72 hours, but may not appear on LinkedIn for days - or ever, if the company didn't buy a LinkedIn job slot.

### 2. Roles posted under non-obvious titles

Companies don't standardize titles. "Staff Machine Learning Engineer," "Senior Applied Scientist," and "ML Platform Engineer" might all be the same seniority. Alias expansion catches the variants so you're not filtering yourself out.

### 3. Fresh postings before they get buried

The `tbs=` time filter lets you see postings from the past hour, day, or week. On Google, roles indexed within the last hour appear almost instantly. This is impossible to replicate on LinkedIn without a paid recruiter account.

### 4. Company-specific dorking from company pages

On H1B, Private Markets, and VC pages, every company card has a role targeting panel. When you type a role, the card link becomes:

```
site:jobs.lever.co/stripe "data analyst" ("entry level" OR "junior")
```

This is scoped to that company's exact ATS domain - not a general search. It surfaces roles that a company's own careers page search might not even show.

---

## Known Limitations and Remaining Problems

### 1. Google IP rate-limiting (the core risk)

Complex dork queries look like automated probes to Google's anti-bot systems. From a shared IP (university dorm, office NAT), five people searching simultaneously looks like one aggressive bot. See [ip-protection.md](ip-protection.md) for what the system does about this and what it cannot fix.

### 2. Once blocked, you're blocked

The IP protection system (cooldowns, jitter, Bing/DDG routing) is **preventive**, not curative. If your IP has already been flagged by Google, a 5-minute cooldown will not clear it. Google IP flags typically last 4-24 hours. The system cannot fix an existing flag - only help prevent creating one.

### 3. ATS indexing lag

Google indexes most ATS boards within 24-72 hours of posting, but it's not real-time. Very fresh postings (< 4 hours) may not appear yet even with `tbs=qdr:h`. Greenhouse and Lever are typically the fastest to get indexed.

### 4. Bing caps at 3 site: operators

The Bing query builder limits ATS sites to 3 total (across all selected tiers) because Bing silently drops operators beyond that. If you need all 8+ sites in a tier, use Google mode.

### 5. DuckDuckGo cannot do complex Boolean

DDG's query parser flattens nested `(A OR B)` expressions into keyword searches. The DDG builder uses a strictly linear query - one role, one level term, one location, one site. If your search requires multi-site OR chains, DDG is the wrong engine.

### 6. intitle: and inurl: are unreliable on Bing and DDG

These operators work consistently only on Google. The builder does not use `intitle:` or `inurl:` - it sticks to `site:` and phrase matching, which are the operators that work across all three engines.

### 7. Date filtering is Google-only

The `tbs=` parameter is a Google-specific URL parameter. Bing and DDG have date filters but they're UI dropdowns that don't map to URL parameters reliably. When you select Bing or DDG, the date filter UI is hidden and replaced with a note to use the engine's own UI filter.

### 8. No server-side proxy

OnlyNerds is a fully static site with no backend. There is no server to route queries through a residential proxy pool or rotate IPs. The IP the user's browser originates from is the IP Google sees. This is a fundamental constraint of the static architecture. The jitter and cooldown system mitigates shared-IP risk but cannot substitute for real proxy rotation.

---

## What This Is Not

- Not web scraping (we generate search URLs, the user's browser opens them)
- Not automated (every search requires a human click)
- Not accessing any private data (all results come from publicly indexed pages)
- Not violating any terms of service (advanced search operators are documented and supported by all three engines)
