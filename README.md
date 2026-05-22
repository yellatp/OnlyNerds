# Only Nerds - Job Board Aggregator

Automated job board aggregating millions of positions from thousands of companies across multiple ATS platforms. Updated daily.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Local Development](#local-development)
   - [Prerequisites](#prerequisites)
   - [Frontend (AstroJS)](#frontend-astrojs)
   - [Backend (TypeScript Scraper)](#backend-typescript-scraper)
   - [Root Static Page](#root-static-page)
6. [Deployment Overview](#deployment-overview)
7. [Environment Variables & Secrets](#environment-variables--secrets)
8. [License](#license)

---

## Features

- **Multi-platform scraping**: 4 active ATS platforms (Greenhouse, Ashby, Lever, Workable) scraped via round-robin batch scheduler with state persistence
- **Progressive loading**: Chunked gzip data loaded via `DecompressionStream` Web API for fast initial render
- **Advanced filtering**: Filter by title, company, location, ATS platform, experience level, department, salary range, education, industry, workplace type (remote/onsite/hybrid), employment type (full-time/part-time/contract/internship), job freshness, and saved jobs only
- **Job tier classification**: Automatic skill-level tagging (intern/entry/mid/senior) using weighted keyword scoring on job titles
- **Save jobs**: Bookmark jobs for later with localStorage-based persistence
- **URL state sync**: Filter/sort/page state persisted in the URL for shareable/bookmarkable searches
- **Responsive tile layout**: CSS Grid tile-based layout with auto-fill responsive columns
- **Job freshness indicators**: Relative time display ("2 hours ago", "3 days ago") with color-coded badges
- **Round-robin batch scraping**: Scrapes one batch per run across 4 platforms (Greenhouse, Ashby, Lever, Workable) in rotation, persisting progress to disk
- **Rate-limit aware**: Configurable batch sizes (200/100/100/100) and delays between platform switches to avoid getting blocked
- **Cost-efficient**: Incremental processing/uploads — smaller batches = smaller R2 egress per run, respects D1 write limits
- **Automated pipeline**: GitHub Actions every 6 hours: scrape one batch → deduplicate → chunk → compress → upload to Cloudflare R2
- **AstroJS frontend**: Modern static site built with AstroJS, deployable to Cloudflare Pages
- **Dark theme**: OnlyNerds-branded dark UI with custom SVGs and JetBrains Mono typography

---

## Tech Stack

| Layer       | Tools                                                                  |
|-------------|------------------------------------------------------------------------|
| Frontend    | AstroJS, TypeScript, CSS Grid, Bootstrap 5, Leaflet (maps)             |
| Backend     | TypeScript (Node.js), native fetch with R2 S3-compatible API           |
| Data        | Chunked gzip JSON, `DecompressionStream` Web API                       |
| CI/CD       | GitHub Actions (daily cron + manual dispatch)                          |
| Hosting     | Cloudflare Pages (frontend), Cloudflare R2 (data)                      |
| Storage     | Cloudflare R2 (job chunks), Cloudflare D1 (metadata)                   |
| Analytics   | Cloudflare Web Analytics (privacy-first, no cookies)                   |
| Fonts       | JetBrains Mono (Google Fonts)                                          |
| Branding    | OnlyNerds custom SVGs (`{Only}\|<Nerds>`, `{Job}\|<Board>`, face logo) |

---

## Architecture

```
backend/
├── src/
│   ├── index.ts              # Main entry point — round-robin or single-platform mode
│   ├── config.ts             # Environment config, platform settings, batch sizes
│   ├── scheduler.ts          # Round-robin scheduler with state persistence
│   ├── scrapers/
│   │   ├── base.ts           # Abstract base scraper with parallel execution
│   │   ├── greenhouse.ts     # Greenhouse API scraper
│   │   ├── ashby.ts          # Ashby GraphQL API scraper
│   │   ├── bamboohr.ts       # BambooHR API scraper (paused)
│   │   ├── lever.ts          # Lever API scraper
│   │   ├── workday.ts        # Workday API scraper (paused)
│   │   ├── icims.ts          # iCIMS API scraper (paused)
│   │   └── workable.ts       # Workable API scraper
│   ├── processors/
│   │   ├── deduplicator.ts   # URL-based deduplication
│   │   ├── cleaner.ts        # Data cleaning and validation
│   │   └── chunker.ts        # Gzip chunking and manifest generation
│   ├── storage/
│   │   ├── local.ts          # Local filesystem read/write
│   │   └── r2.ts             # Cloudflare R2 upload via S3-compatible API
│   └── utils/
│       ├── types.ts          # TypeScript interfaces and types
│       ├── http.ts           # HTTP client with retry logic
│       └── logger.ts         # Structured logging
├── scheduler-state.json      # Persisted round-robin progress (auto-generated)

frontend/
├── src/
│   ├── pages/
│   │   ├── index.astro       # Main job board page
│   │   ├── about.astro       # About page
│   │   └── api/
│   │       ├── health.ts     # Health check endpoint
│   │       └── stats.ts      # Stats endpoint (D1-backed)
│   ├── components/
│   │   ├── Layout.astro      # Base layout wrapper (nav + footer)
│   │   ├── FilterPanel.astro # Single-row filter bar
│   │   ├── JobTable.astro    # CSS Grid tile layout
│   │   ├── Pagination.astro  # Page navigation
│   │   └── StatsBar.astro    # Summary statistics bar
│   ├── lib/
│   │   ├── types.ts          # Frontend type definitions
│   │   ├── constants.ts      # Filter options, tile config
│   │   ├── filters.ts        # Client-side filter engine
│   │   ├── sorting.ts        # Sort logic + freshness helpers
│   │   ├── pagination.ts     # Pagination calculation
│   │   ├── chunkLoader.ts    # Progressive chunk loading
│   │   ├── storage.ts        # localStorage save/unsave
│   │   └── urlState.ts       # URL query string sync
│   └── styles/
│       └── global.css        # Global styles
├── public/
│   ├── global.css            # Global stylesheet (served as-is)
│   └── assets/
│       ├── JobBoard.svg      # Nav logo: {Job}|<Board> (used in header)
│       ├── OnlyNerds.svg     # Face logo for footer
│       ├── OnlyNerds_Nav.svg # Legacy nav logo (unused)
│       ├── Get_Jobs.svg      # Alternative: {Get}|<Jobs>
│       ├── OnlyNerds_Nav.png # Legacy PNG fallback (unused)
│       └── OnlyNerds.png     # PNG fallback for footer
├── astro.config.mjs          # Astro config (Cloudflare adapter)
└── wrangler.toml             # Cloudflare Pages + Workers config

data/
├── jobs_manifest.json      # Chunk index with metadata
├── jobs_chunk_*.json.gz    # Gzipped job data (~25k jobs per chunk)
├── *_companies.json        # Company lists per ATS platform
├── salary/                 # Salary lookup data
└── trends/                 # Daily trend tracking

assets/                     # Root-level assets (for index.html on port 4323)
├── JobBoard.svg            # Nav logo used in header
├── OnlyNerds.svg           # Face logo for footer
├── OnlyNerds_Nav.svg       # Legacy nav logo (unused)
├── Get_Jobs.svg            # Alternative: {Get}|<Jobs>
├── OnlyNerds_Nav.png       # Legacy PNG fallback (unused)
└── OnlyNerds.png           # PNG fallback for footer

index.html                  # Root static page (served on port 4323)
styles.css                  # Root stylesheet for index.html
js/                         # Vanilla JS modules for root page
```

---

## Project Structure

This repository contains **three deployable projects**:

| # | Project | Directory | Port | Technology | Deployment Target |
|---|---------|-----------|------|------------|-------------------|
| 1 | **Astro Frontend** | `frontend/` | 4322 | AstroJS + Cloudflare adapter | Cloudflare Pages |
| 2 | **Backend Scraper** | `backend/` | — | TypeScript (Node.js) | Linux VM / GitHub Actions |
| 3 | **Root Static Page** | `./` (root) | 4323 | Vanilla HTML/CSS/JS | Cloudflare Pages / Any static host |

---

## Local Development

### Prerequisites

- **Node.js** v18+ (v20+ recommended)
- **npm** v9+
- **Git**
- **Wrangler CLI** (for Cloudflare deployment): `npm install -g wrangler`

### Frontend (AstroJS)

The frontend is an AstroJS static site that loads job data from Cloudflare R2 chunks and renders them in the browser.

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server (hot reload)
npx astro dev
# → http://localhost:4321

# Build for production
npx astro build
# Output: frontend/dist/

# Serve the built site locally
npx serve dist --port 4322
# or
python -m http.server 4322 --bind 127.0.0.1
# → http://127.0.0.1:4322
```

**Key files:**
- [`frontend/src/pages/index.astro`](frontend/src/pages/index.astro) — Main job board page
- [`frontend/src/components/Layout.astro`](frontend/src/components/Layout.astro) — Base layout with OnlyNerds nav + footer
- [`frontend/wrangler.toml`](frontend/wrangler.toml) — Cloudflare Pages configuration
- [`frontend/astro.config.mjs`](frontend/astro.config.mjs) — Astro build configuration

### Backend (TypeScript Scraper)

The backend scrapes 7 ATS platforms in parallel, deduplicates, cleans, chunks, and uploads to Cloudflare R2.

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run full scrape cycle
npx tsx src/index.ts

# Run a single platform (faster for testing)
npx tsx src/index.ts --platform greenhouse
npx tsx src/index.ts --platform ashby
npx tsx src/index.ts --platform lever

# Build TypeScript
npm run build

# Type-check without emitting
npm run typecheck
```

**Key files:**
- [`backend/src/index.ts`](backend/src/index.ts) — Main entry point
- [`backend/src/config.ts`](backend/src/config.ts) — Environment config, platform settings
- [`backend/src/scrapers/base.ts`](backend/src/scrapers/base.ts) — Abstract base scraper
- [`backend/src/storage/r2.ts`](backend/src/storage/r2.ts) — R2 upload logic

### Root Static Page

The root `index.html` is a standalone static page that serves as an alternative frontend. It uses vanilla JavaScript modules from the `js/` directory.

```bash
# Serve from project root
cd /d c:\Users\prudh\Desktop\GitHub_Manager\Job-Aggregator
python -m http.server 4323 --bind 127.0.0.1
# → http://127.0.0.1:4323
```

**Key files:**
- [`index.html`](index.html) — Main page with OnlyNerds nav, footer, and job board
- [`styles.css`](styles.css) — Dark theme stylesheet
- [`js/app.js`](js/app.js) — Main application logic
- [`js/filters.js`](js/filters.js) — Client-side filtering
- [`js/renderer.js`](js/renderer.js) — Job tile rendering
- [`js/jobs_loader.js`](js/jobs_loader.js) — Progressive chunk loading
- [`js/events.js`](js/events.js) — Event handlers
- [`js/storage.js`](js/storage.js) — localStorage save/unsave
- [`js/sorting.js`](js/sorting.js) — Sort logic
- [`js/pagination.js`](js/pagination.js) — Pagination
- [`js/url_state.js`](js/url_state.js) — URL state sync

---

## Deployment Overview

This project has **three separate deployment targets**. See [`DEPLOYMENT.md`](DEPLOYMENT.md) for full step-by-step instructions.

| Component | Deployment Method | Target |
|-----------|-------------------|--------|
| **Frontend** (AstroJS) | `wrangler pages deploy` or GitHub → Cloudflare Pages | Cloudflare Pages |
| **Backend** (Scraper) | GitHub Actions (scheduled) or Linux VM + cron | GitHub Actions / VM |
| **Root Static Page** | `wrangler pages deploy` or any static host | Cloudflare Pages / Any |

---

## Environment Variables & Secrets

### Backend (required for scraping + R2 upload)

| Variable | Required | Description |
|----------|----------|-------------|
| `R2_ENDPOINT` | Yes | Cloudflare R2 S3 endpoint URL |
| `R2_ACCESS_KEY` | Yes | R2 API access key |
| `R2_SECRET_KEY` | Yes | R2 API secret key |
| `R2_BUCKET` | Yes | R2 bucket name (default: `job-aggregator-data`) |
| `R2_REGION` | Yes | Must be `auto` for Cloudflare R2 |
| `R2_PUBLIC_URL` | No | Public R2 URL for frontend access |
| `LOG_LEVEL` | No | `DEBUG` \| `INFO` \| `WARN` \| `ERROR` (default: `INFO`) |

### Frontend (Cloudflare Pages environment variables)

| Variable | Description |
|----------|-------------|
| `R2_PUBLIC_URL` | Public R2 bucket URL for chunk loading |

### GitHub Actions Secrets

Set these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `R2_ENDPOINT` | Cloudflare R2 S3 endpoint |
| `R2_ACCESS_KEY` | R2 API access key |
| `R2_SECRET_KEY` | R2 API secret key |
| `R2_BUCKET` | R2 bucket name |
| `R2_REGION` | `auto` |

---

## Data Pipeline

1. **Scrape**: TypeScript scraper fetches jobs from all seven ATS APIs concurrently (configurable workers per platform)
2. **Classify**: Each job is tagged with a skill level based on title keywords and flagged if posted by a recruiting agency
3. **Clean**: Jobs missing titles, URLs, or company info are dropped
4. **Chunk**: Results are split into ~25k-job gzipped chunks with a manifest file
5. **Upload**: Chunks are uploaded to Cloudflare R2 via S3-compatible API
6. **Deploy**: GitHub Actions or cron triggers the pipeline on schedule

## Company Discovery

Company lists are built from Common Crawl index data using a separate harvesting pipeline. The harvester scans CDX archives for URLs matching 20+ ATS domain patterns, extracts company slugs via regex, and deduplicates across multiple crawl snapshots. This currently yields roughly **55,000+ unique company identifiers** across all platforms.

---

## License

Code in this repository is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

The curated company datasets in `data/` are licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). You're free to use, modify, and share the data for non-commercial purposes. Commercial use of the datasets requires permission — reach out via [GitHub Issues](https://github.com/Feashliaa/job-board-aggregator/issues) or email.

---

Built by [Riley Dorrington](https://github.com/Feashliaa)
