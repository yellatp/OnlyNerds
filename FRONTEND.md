# Only Nerds — Frontend Deployment Guide

> Deploy the vanilla HTML/CSS/JS frontend to **Cloudflare Pages** via **GitHub** integration.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Repository Setup](#repository-setup)
4. [Cloudflare Pages Setup](#cloudflare-pages-setup)
5. [Deployment](#deployment)
6. [Custom Domain](#custom-domain)
7. [Data Updates](#data-updates)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│              GitHub Repository (standalone)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  onlynerds-jobs  (Vanilla HTML/CSS/JS at root)       │   │
│  │  ├── index.html     (entry point)                    │   │
│  │  ├── styles.css     (all styles)                     │   │
│  │  ├── js/            (ES modules)                     │   │
│  │  ├── assets/        (SVGs, PNGs)                     │   │
│  │  └── data/chunks/   (gzip job data)                  │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │ Push to main branch
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Cloudflare Pages                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  No build step — serves static files directly        │   │
│  │  Output dir: / (root)                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Key Points:**
- The frontend is a **vanilla HTML/CSS/JS** static site — no build step required
- Cloudflare Pages serves the files directly from the repository
- Job data is loaded from local `data/chunks/` directory (gzip JSON files)
- No Node.js, no npm, no build tools needed
- **Light/Dark theme toggle** — persists preference in `localStorage`, respects OS `prefers-color-scheme`

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| GitHub account | For repository hosting |
| Cloudflare account | Free tier works for Pages |

---

## Repository Setup

The frontend has already been pushed to its own GitHub repository:

- **Remote URL**: `https://github.com/yellatp/onlynerds-jobs.git`
- **Branch**: `main`

The repository contains only the vanilla frontend source files.

---

## Cloudflare Pages Setup

### Step 1: Log in to Cloudflare Dashboard

Go to [dash.cloudflare.com](https://dash.cloudflare.com) and log in.

### Step 2: Create a Pages Project

1. Navigate to **Workers & Pages** → **Pages**
2. Click **Connect to Git**
3. Authorize Cloudflare to access your GitHub account
4. Select the `onlynerds-jobs` repository

### Step 3: Configure Build Settings

| Setting | Value |
|---------|-------|
| **Project name** | `onlynerds-jobs` |
| **Production branch** | `main` |
| **Build command** | (leave empty — no build needed) |
| **Build output directory** | `/` (root) |
| **Root directory** | (leave empty) |

> **Important:** Since this is a static HTML site, there is **no build command**. Cloudflare Pages will serve the files directly from the repository.

### Step 4: Deploy

Click **Save and Deploy**. Cloudflare will:
1. Clone your repository
2. Serve the files directly (no build step)
3. Assign a `*.pages.dev` URL (e.g., `onlynerds-jobs.pages.dev`)

---

## Deployment

### Automatic (Recommended)

Every push to `main` branch triggers an automatic deployment:

```bash
git add .
git commit -m "Update feature X"
git push origin main
```

### Manual Redeploy

In the Cloudflare Dashboard:
1. Go to **Workers & Pages** → `onlynerds-jobs`
2. Click **Deployments** tab
3. Click the three dots (⋮) on any deployment
4. Select **Retry deployment**

---

## Custom Domain

1. In Cloudflare Dashboard → `onlynerds-jobs` → **Custom domains**
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `jobs.onlynerds.win`)
4. Follow the DNS configuration instructions

---

## D1 Database API Endpoints

The frontend now includes **Cloudflare Pages Functions** that query the **D1 database** directly. These provide real-time stats, search, and click tracking alongside the static chunk files.

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stats` | GET | Returns `{ totalJobs, totalCompanies, totalPlatforms, lastUpdated }` |
| `/api/search?q=...&company=...&ats=...&category=...&limit=50&offset=0` | GET | Search/filter jobs with pagination |
| `/api/click` | POST | Record an apply click `{ url, title?, company? }` |

### Required D1 Binding

In the **Cloudflare Dashboard** → `onlynerds-jobs` → **Settings** → **Functions** → **D1 database bindings**:

| Variable name | Database |
|---------------|----------|
| `DB` | `job-aggregator-db` (ID: `d27185cb-ca2d-4dc3-96bf-d21d558fced3`) |

### Initialize the D1 Schema

After creating the D1 binding, run the schema against the database:

```bash
npx wrangler d1 execute job-aggregator-db --file=./schema.sql
```

Or via the Cloudflare Dashboard → D1 → `job-aggregator-db` → **Query** tab → paste the contents of `schema.sql`.

### How the Frontend Uses D1

The frontend still loads job data from `data/chunks/` (gzip JSON files) for the main job board. The D1 endpoints are used for:

- **Stats**: `/api/stats` provides real-time job/company/platform counts
- **Search**: `/api/search` enables server-side filtering without loading all chunks
- **Click tracking**: `/api/click` records apply clicks for analytics

---

## Data Updates

### Static Chunks (for main job board)

The job data is stored in `data/chunks/` as gzip JSON files. To update the data:

1. Run the backend scraper on your Linux machine (see [`BACKEND.md`](BACKEND.md))
2. Copy the updated `data/chunks/` directory to the frontend repository
3. Commit and push to trigger a redeployment

```bash
# After running the backend scraper, copy the new chunks:
cp -r /path/to/backend/data/chunks ./frontend/data/
git add data/chunks/
git commit -m "Update job data chunks"
git push origin main
```

### D1 Database (for real-time queries)

The D1 database is populated by the backend scraper directly (via the D1 HTTP API). No manual data copy needed for D1 — the backend inserts jobs as it scrapes them.

To manually export D1 data to R2 chunks (if needed):

```bash
cd backend && npx tsx src/index.ts --export-chunks
```

---

## Troubleshooting

### Site shows blank page

1. Check the browser console for errors (F12 → Console)
2. Verify all file paths in `index.html` are correct (relative paths)
3. Ensure `data/chunks/jobs_manifest.json` exists and is valid JSON

### Jobs not loading

1. Open browser DevTools → Network tab
2. Check if `jobs_manifest.json` and chunk files are being fetched correctly
3. Verify the chunk files are valid gzip archives

### Deployment not updating

1. Check Cloudflare Dashboard → Deployments for the latest status
2. Hard refresh your browser (Ctrl+Shift+R / Cmd+Shift+R)
3. Clear Cloudflare cache: Dashboard → Caching → Purge Everything

### 404 errors on assets

1. Verify the asset files exist in the repository
2. Check that file paths in `index.html` use correct relative paths (e.g., `assets/OnlyNerds.svg` not `/assets/OnlyNerds.svg`)
