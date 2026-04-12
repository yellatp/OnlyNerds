# OnlyNerds

**Career intelligence for people who do their homework.**

Live at [onlynerds.win](https://onlynerds.win) - Free, community-built, no sign-ups, no paywalls.

---

## What It Is

OnlyNerds is a career intelligence platform and resource repository for tech jobseekers, students, and practitioners. Think of it as an "awesome list" - but interactive, filterable, and built with a real UI.

It surfaces data and tools that are otherwise scattered across dozens of sites:

- H1B visa sponsoring companies with sponsorship likelihood scores
- Late-stage private market companies that are actively hiring
- Direct job board links for 100+ VC firms and accelerators
- A Google Dorking query builder for finding jobs before they hit major boards
- Curated learning paths for Data Science, ML, AI, SQL, and engineering

---

## Features

### `/companies` - Companies Directory

Combined, filterable view of three datasets in one page. Switch between H1B, Private Markets, and VC sections without leaving the page. Sticky section navigation with IntersectionObserver active highlighting.

### `/h1b` - H1B Intelligence

Searchable database of 2,200+ tech companies ranked by H1B sponsorship likelihood (Very High, High, Medium, Low). Filter by sector, category, Fortune 500 status, boutique firms, and analyst picks.

Role targeting: type a role and pick a level - every company card link becomes a targeted Google dork scoped to that role on that company's ATS domain.

### `/private-markets` - Private Market Companies

Late-stage private companies filtered by sector, funding round (Series A through Pre-IPO), and amount raised. Surfaces firms that rarely appear on standard job boards.

Role targeting on every card, same as H1B.

### `/vc-portfolios` - VC Portfolio Job Boards

Direct links to job boards for 100+ top VC firms and accelerators including a16z, Sequoia, Lightspeed, General Catalyst, Y Combinator, Techstars, and more.

Role + level targeting: when a role is typed, the "Job Board" button becomes a targeted dork on that firm's job board domain.

### `/job-search` - Job Search Builder

Multi-engine Google Dorking query builder with engine-aware syntax:

**Engine selector (Step 1)** - pick Google, Bing, or DuckDuckGo first. The query is generated specifically for the chosen engine because each engine parses Boolean operators differently.

| Feature            | Google           | Bing                  | DuckDuckGo        |
| ------------------ | ---------------- | --------------------- | ----------------- |
| Nested `(A OR B)`  | Full support     | Flattened             | Dropped entirely  |
| site: operators    | Unlimited        | Max 3, placed first   | Single site only  |
| Alias expansion    | All aliases      | 2 per role            | None              |
| Date filter        | `tbs=` URL param | UI dropdown only      | UI dropdown only  |
| Query jitter       | Yes (auto)       | No                    | No                |
| IP rate limits     | Yes (protected)  | Lenient               | None              |

Additional features:
- Role groups with automatic alias expansion (Google only)
- ATS segment targeting (Greenhouse, Lever, Workday, Ashby, and more)
- Seniority level filters (Intern through Staff/Principal)
- Location hubs (Bay Area, NYC, Seattle, Austin, Remote, India, and more) + custom city/country inputs
- Posted time filter for Google (Past 1h to Past week via `tbs=` parameter)

**IP Protection (Google only):**
- 45-second soft cooldown between dork searches
- 5-minute deep freeze after 5 searches in any 3-minute window
- Query jitter: unique `-"x{hex}"` token on every Google URL so queries from the same IP look distinct
- "Switch to Bing" button appears automatically during deep freeze
- All state persists in localStorage across page refreshes

### `/resources` - Resources Hub

11-section knowledge base accessible via modal overlays:

- Learning Paths (DS/ML/AI career tracks)
- SQL Mastery (9 platforms + execution order reference)
- AI/ML (courses, papers, tools)
- DSA (LeetCode patterns, system design)
- Tech Blogs and newsletters
- Salary intelligence
- Dorking reference guide
- Networking strategies
- Career strategy guides
- Resume playbooks

### `/brand` - Brand Assets

Download OnlyNerds logo assets (SVG + PNG) for use in blog posts, presentations, or contributions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Astro 4 (`output: 'static'`) |
| Styling | Tailwind CSS 3 with custom warm neutral palette |
| Components | React 18 islands (`client:load`) |
| Animations | Framer Motion 11 |
| Fonts | Fraunces (display) + Space Grotesk (sans) + JetBrains Mono (mono) |
| Data | CSV + JSON parsed at build time via Node `fs.readFileSync` |
| Hosting | Cloudflare Pages |

No databases. No APIs. No server runtime. Pure static output - every page is pre-rendered HTML.

---

## Project Structure

```text
src/
  layouts/Layout.astro              Full SEO head (OG, Twitter Card, JSON-LD, canonical)
  components/
    shared/
      Navbar.astro                  Thin Astro wrapper that passes pathname
      NavbarClient.tsx              React Navbar: scroll-aware glass, animated hamburger
      Footer.astro                  4-col footer with Alphonso AI credit
    h1b/H1BFilter.tsx               Filterable H1B company grid + role targeting
    private/PrivateFilter.tsx       Filterable private market grid + role targeting
    vc/VCDirectory.tsx              VC portfolio directory + role targeting
    jobsearch/JobSearchBuilder.tsx  Multi-engine dorking query builder
  data/
    h1b.ts                          Parses data/startups_h1b_database.csv
    privateMarkets.ts               Parses data/Privately_Listed_Companies.csv
    vcPortfolios.ts                 Parses data/Portfolio.csv
    resources.ts                    Job boards, learning resources, SQL resources
    jobSearch.ts                    Role groups, ATS segments, location hubs, posted times
    parser.ts                       CSV parser + smartCareerLink utility
    dorkUtils.ts                    TARGET_LEVELS + buildTargetedUrl for company pages
    dorkSafety.ts                   IP protection: cooldown, jitter, engine URL builder
  pages/
    index.astro
    companies.astro
    h1b.astro
    private-markets.astro
    vc-portfolios.astro
    job-search.astro
    resources.astro
    contact.astro
    brand.astro
    universities.astro
  styles/global.css                 Design system, film grain, custom cursor
data/
  startups_h1b_database.csv
  Privately_Listed_Companies.csv
  Portfolio.csv
docs/
  dorking-strategy.md               What dorking is, how the builder works, known limits
  ip-protection.md                  IP protection design, jitter, cooldown, what it can't fix
  engine-differences.md             Google vs Bing vs DDG syntax reference
public/
  _headers                          Cloudflare Pages security headers
  robots.txt
  sitemap.xml
  OnlyNerds.svg / .png
  Alphonso_logo.png
```

---

## Running Locally

```bash
git clone https://github.com/yellatp/OnlyNerds.git
cd OnlyNerds
npm install
npm run dev       # dev server at localhost:4321
npm run build     # static output to dist/
npm run preview   # preview built output
```

Requires Node 18+.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contributor guide including data column specs, code rules, and the PR checklist.

The short version:

- **Data fixes** (H1B likelihood, broken links, missing companies) - open a PR with a public source reference. No code required.
- **Broken links** - open a GitHub issue with the format `[Broken Link] Company Name - page type`.
- **Code** - fork, create a branch, run `npm run build` before opening a PR.

---

## Design System

Brutalist editorial aesthetic:

- Background `#0D0D0D`, cards `#141410`, borders `0.5px solid #1C1C18`
- Zero `border-radius` on all containers (sharp corners throughout)
- 2% film grain overlay via SVG feTurbulence
- Tile hover: `scale(1.015)` with `0.5s cubic-bezier(0.23, 1, 0.32, 1)`
- Custom circle cursor that expands on interactive elements
- Fraunces (H1 display) + Space Grotesk (body) + JetBrains Mono (nav, buttons, labels)

---

## Documentation

Technical deep-dives are in [docs/](docs/):

- [docs/dorking-strategy.md](docs/dorking-strategy.md) - What dorking is, how the builder works, problems solved and problems that remain
- [docs/ip-protection.md](docs/ip-protection.md) - IP protection design rationale, jitter mechanics, shared-IP defense, what the system cannot fix
- [docs/engine-differences.md](docs/engine-differences.md) - Google vs Bing vs DuckDuckGo operator support and query syntax reference

---

## License

Apache License 2.0 - see [LICENSE](LICENSE).

Copyright 2025 Pavan Yellathakota.

---

## Built By

**Pavan Yellathakota (PYE)** - Data Scientist and ML Practitioner

[pye.pages.dev](https://pye.pages.dev) - [GitHub](https://github.com/yellatp) - [LinkedIn](https://linkedin.com/in/yellatp)

Built in association with [Alphonso AI](https://alphonso.app).
