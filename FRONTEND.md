# OnlyNerds — Frontend Deployment Guide

> Deploy the AstroJS frontend to **Cloudflare Pages**.

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Node.js v18+ | v22+ recommended |
| npm v9+ | |
| Cloudflare account | Free tier works for Pages |
| Wrangler CLI | `npm install -g wrangler` |

---

## Deployment

### 1. Build

```bash
npm install
npm run build
# Output: dist/
```

### 2. Deploy to Cloudflare Pages

```bash
npx wrangler pages deploy dist/ --branch main
```

### 3. Configure Environment Variables

In the **Cloudflare Dashboard** → your Pages project → **Settings** → **Environment variables**:

| Variable | Description |
|----------|-------------|
| `R2_PUBLIC_BASE` | R2 bucket URL for job chunks (optional, falls back to default) |

### 4. Configure D1 Database Binding

In **Cloudflare Dashboard** → your Pages project → **Settings** → **Functions** → **D1 database bindings**:

| Variable name | Database |
|---------------|----------|
| `DB` | `job-aggregator-db` |

Initialize the schema:

```bash
npx wrangler d1 execute job-aggregator-db --file=data/schema.sql
```

---

## Cloudflare Functions

The project includes Cloudflare Pages Functions in `functions/api/`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stats` | GET | Job/company/platform counts from D1 |
| `/api/search` | GET | Search/filter jobs with pagination |
| `/api/click` | POST | Record apply clicks |

---

## Data Updates

### Companies (`companies.parquet`)

The companies dataset is a merged parquet file combining scraped ATS company lists. To update:

1. Source new company lists from your ATS scraper pipeline
2. Run the merge script to combine with existing data
3. Copy to `public/data/companies.parquet`
4. Rebuild and redeploy

### Job Data (D1 + R2 chunks)

Job postings are stored in Cloudflare D1 (for real-time queries) and R2 buckets (for chunked fallback). The backend scraper populates both.
