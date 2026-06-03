# Only Nerds — ATS Intelligence Platform

**115,008 unique company records** mapped to their ATS platforms (Greenhouse, Ashby, Lever, BambooHR, iCIMS, Workable, join.com, Personio, and 20+ more). Find which ATS any company uses, access their job board in one click, and build precision Google Dork queries.

---

## Features

- **ATS Lookup** — Search 115K+ companies and see which ATS platform they use. One click takes you to their job board.
- **Company Directory** — Browse H1B sponsors (2,200+), private market firms (4,200+), and VC portfolios (88 funds, 25 accelerators).
- **Google Dorking Engine** — Interactive query builder targeting specific roles, ATS platforms, experience levels, and locations across Google, Bing, and DuckDuckGo.
- **Region Intelligence** — Filter companies by region (US-CA, EU, ASIA, LATAM, AU-NZ, AFRICA) based on ATS headquarters and location data.
- **Parquet-powered** — All company data (4.2M+ jobs, 115K companies) stored in Apache Parquet format loaded client-side via WASM.

---

## Tech Stack

| Layer | Tools |
|-------|-------|
| Frontend | AstroJS, TypeScript, React 18, Tailwind CSS 3, Framer Motion 11 |
| Data | Apache Parquet, parquet-wasm (WASM), apache-arrow |
| Deployment | Cloudflare Pages |
| Formatting | Google Fonts (Fraunces, Space Grotesk, JetBrains Mono) |

---

## Project Structure

```
/
├── src/
│   ├── pages/             # 14 Astro pages
│   │   ├── index.astro           # Homepage
│   │   ├── companies.astro       # Company directory
│   │   ├── companies-search.astro # ATS Lookup (parquet-powered)
│   │   ├── job-search.astro      # Dorking query builder
│   │   ├── h1b.astro, private-markets.astro, etc.
│   ├── components/        # React + Astro components
│   ├── layouts/           # Layout.astro (SEO, fonts, analytics)
│   ├── lib/               # TypeScript data modules (privateMarkets, h1b, vcPortfolios, etc.)
│   ├── styles/            # global.css (Tailwind + custom theme)
│   └── scripts/           # Build utilities (CSV→Parquet conversion)
├── functions/             # Cloudflare Pages Functions (D1 API)
│   └── api/               # search, stats, click tracking
├── public/
│   ├── data/              # Parquet files + job chunks
│   ├── js/                # Client JS (companies-search, etc.)
│   ├── css/               # Jobs page stylesheet
│   └── assets/            # SVGs, logos, sitemap
├── data/                  # CSV source files + merged parquet
├── docs/                  # Feature documentation
├── scripts/               # CSV→Parquet conversion
├── wrangler.toml          # Cloudflare Pages config
├── .env                   # Local environment (gitignored)
└── astro.config.mjs
```

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev
# → http://localhost:4321

# Build for production
npm run build

# Preview production build
npx astro preview
```

### Data Pipeline

```bash
# Convert CSV source files to Parquet
npm run convert-csvs

# Full build with data conversion
npm run build
```

---

## Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable | Description |
|----------|-------------|
| `R2_PUBLIC_BASE` | Cloudflare R2 bucket URL for job chunks |
| `D1_DATABASE_ID` | Cloudflare D1 database UUID |
| `D1_DATABASE_NAME` | Cloudflare D1 database name |
| `CLOUDFLARE_API_TOKEN` | API token for wrangler deployment |

---

## Deployment

```bash
# Deploy to Cloudflare Pages
npx wrangler pages deploy dist/ --branch main
```

---

## License

Code: MIT. Data: CC BY-NC 4.0.
