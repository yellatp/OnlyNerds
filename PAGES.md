# OnlyNerds — Pages Reference

14 routes. All pages use the shared `Layout.astro` (SEO, fonts, analytics, DustParticles background). Interactive pages use React components with `client:load`.

---

## `/` — Landing Page (`index.astro`)

**Purpose**: Platform homepage — stats, feature tiles, explore grid, contribute CTA.

**Data imports**: `getH1BCompanies()`, `getPrivateCompanies()`, `getVCFirms()` for stats counts.

**Components**: Navbar, Footer.

**Content sections**:
- Hero: headline "Career Intelligence for Serious Builders", stats (H1B/Private/VC/Accelerator counts), CTAs for ATS Lookup / Dork Builder / Directory
- Feature tiles (6): ATS Lookup, Job Board, Dork Builder, H1B Intelligence, Private Markets, VC Portfolios
- Contribute CTA: GitHub link, contact link
- Explore grid (4 cards): ATS Lookup, Dork Builder, Directory, Contribute

---

## `/companies-search` — ATS Lookup (`companies-search.astro`)

**Purpose**: Searchable, filterable directory of 115,008 companies mapped to their ATS platforms. Find which ATS any company uses and navigate to their job board in one click.

**External dependencies**: `parquet-wasm` 0.6.1 (CDN, parquet reader WASM), `apache-arrow` 17.

**Data source**: `public/data/companies.parquet` (2.4MB, merged from old + new datasets). Loaded client-side via WASM.

**Features**:
- Search by company name
- Filter by ATS platform (25+ platforms, dynamically listed)
- Region filter (US-CA, EU, ASIA, LATAM, AU-NZ, AFRICA) — mutually exclusive, sums to total
- Sort by name (A-Z / Z-A)
- Pagination (50/100/150/200 per page)
- 6 tiles per row, two-row card layout (name + ATS badge)
- Click opens company's job board URL in new tab
- Stats ribbon: Total + per-region counts with colored indicators
- Excluded ATS: Workday, SmartRecruiters (broken URLs)

**Stats**: Total 115,008 — US-CA ~60K, EU ~52K, ASIA ~1.8K, LATAM ~640, AU-NZ ~178, AFRICA ~88

---

## `/company-search` — Dorking Builder (`job-search.astro`)

**Purpose**: Google Dorking query builder for tech jobs. Interactive company lookup + dork query generator.

**Data imports**: `ROLE_GROUPS`, `ATS_SEGMENTS`, `LEVELS`, `LOCATION_HUBS`, `POSTED_TIMES` from `jobSearch.ts`, `SMART_JOB_BOARDS` from `resources.ts`.

**Components**: Navbar, Footer, JobSearchBuilder (React, `client:load`), CompanyLookup (React, `client:load`).

**Content sections**:
- Curated job boards
- Company Lookup — load companies.parquet and search by name/ATS
- Dorking Query Builder — pick engine (Google/Bing/DDG), role, level, ATS, location, posted time

---

## `/dorking-jobs` — Dorking Guide (`dorking-jobs.astro`)

**Purpose**: Comprehensive educational guide on Google Dorking for job search.

**Content**: 12+ operators, 30+ query templates, 6 ATS targets, power dork recipes, pro tips, quick reference.

---

## `/companies` — Company Directory (`companies.astro`)

**Purpose**: Aggregated view of H1B sponsors, private market firms, VC portfolios, and accelerators.

**Data imports**: `getH1BCompanies()`, `getPrivateCompanies()`, `getVCFirms()`.

**Sections**: H1B Sponsors, Private Markets, VC Portfolios, Startup Accelerators, Universities.

---

## `/h1b` — H1B Sponsors (`h1b.astro`)

2,200+ H1B-visa-sponsoring companies. Filter by sector, category, likelihood.

---

## `/private-markets` — Private Market Companies (`private-markets.astro`)

4,200+ late-stage private companies. Filter by sector, funding round.

---

## `/vc-portfolios` — VC Portfolios (`vc-portfolios.astro`)

88 VC funds + 25 accelerators. Browse portfolio job boards.

---

## `/universities` — Data Downloads (`universities.astro`)

Download USA (2,000+) and World (9,000+) university directories.

---

## `/resources` — Career Resources (`resources.astro`)

Curated toolkit: DS/ML paths, SQL, DSA prep, salary intel, dorking, networking, career strategy, resume tips.

---

## Other Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/contact` | `contact.astro` | Contact & contribution guide |
| `/brand` | `brand.astro` | Logo/brand asset downloads |
| `/privacy-policy` | `privacy-policy.astro` | Privacy policy (analytics) |

---

## Shared Architecture

**Layout** (`src/layouts/Layout.astro`): SEO, Open Graph, JSON-LD, 3 Google Fonts, Cloudflare Analytics, Clarity, DustParticles background.

**Build**: `npm run build` → static output to `dist/`, ~5s.
