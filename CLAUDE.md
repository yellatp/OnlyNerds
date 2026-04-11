# CareerNext - Claude Code Configuration

## Project Overview

CareerNext is a hybrid Astro 4 + Tailwind + React + Framer Motion career intelligence platform for jobseekers. It surfaces H1B sponsoring companies, privately-listed firms, VC/accelerator portfolios, and curated job resources.

## Tech Stack

- **Framework**: Astro 4 (hybrid output with `@astrojs/node@^8`)
- **Styling**: Tailwind CSS 3
- **Interactivity**: React 18 islands (`client:load`) + Framer Motion 11
- **AI**: DeepSeek API via server-side endpoint
- **Fonts**: Inter (body) + JetBrains Mono (code)

## Project Structure

```
src/
├── layouts/Layout.astro
├── components/
│   ├── shared/
│   │   ├── Navbar.astro
│   │   ├── Footer.astro
│   │   └── AiChat.tsx          # Floating AI chat (React island)
│   ├── h1b/H1BFilter.tsx       # Filter + paginated grid for H1B data
│   ├── private/PrivateFilter.tsx
│   └── vc/VCDirectory.tsx
├── data/
│   ├── parser.ts               # CSV parser + smartCareerLink utility
│   ├── h1b.ts                  # Parses data/startups_h1b_database.csv
│   ├── privateMarkets.ts       # Parses data/Privately_Listed_Companies.csv
│   └── vcPortfolios.ts         # Parses data/Portfolio.csv
└── pages/
    ├── api/chat.ts             # Server-side DeepSeek proxy (not prerendered)
    ├── index.astro             # Home page
    ├── h1b.astro               # /h1b
    ├── private-markets.astro   # /private-markets
    ├── vc-portfolios.astro     # /vc-portfolios
    └── resources.astro         # /resources
data/
├── startups_h1b_database.csv
├── Privately_Listed_Companies.csv
├── Portfolio.csv
├── companies.json              # YC portfolio (reference only - too large for client)
└── techstars.json              # Techstars portfolio (reference only)
```

## Commands

```bash
npm run dev      # Start dev server at localhost:4321
npm run build    # Build for production
npm run preview  # Preview the built server
```

## Output Mode

- `output: 'hybrid'` with `@astrojs/node@^8` adapter
- All content pages have `export const prerender = true`
- Only `src/pages/api/chat.ts` is server-rendered (`prerender = false`)
- Data files use `process.cwd()` for CSV paths (resolves correctly in both dev and dist)

## Design System

- Background: `#080810`
- Cards: `bg-white/[0.02] border border-white/[0.06]` (glassmorphism)
- Sector accent colors:
  - H1B: emerald (`#10b981`)
  - Private Markets: amber (`#f59e0b`)
  - VC/Accelerators: violet (`#8b5cf6`)
  - Resources: blue (`#3b82f6`)
- Hover: `bg-white/[0.04]` + sector border color
- Card animations: Framer Motion `AnimatePresence` with `delay: i * 0.018`

## Key Patterns

### Data Loading (Build-time)

Data is parsed at Astro build time in `src/data/*.ts` using Node `fs.readFileSync`. The parsed arrays are passed as serializable JSON props to React islands.

```typescript
// In .astro page frontmatter:
const companies = getH1BCompanies(); // runs at build time
```

```astro
<!-- Pass to island: -->
<H1BFilter client:load companies={companies} sectors={sectors} />
```

### Smart Career Link

Defined in `src/data/parser.ts`:

```typescript
export function smartCareerLink(name: string, url?: string): string {
  if (url && url !== 'N/A' && url.startsWith('http')) return url;
  return `https://www.google.com/search?q=${encodeURIComponent(name + ' Careers')}`;
}
```

### AI Chat Filter Flow

1. User types a natural language query in the floating chat
2. `AiChat.tsx` sends `{ messages, page }` to `POST /api/chat`
3. Server endpoint calls DeepSeek with a page-specific filter schema
4. DeepSeek returns structured JSON: `{ response, filters }`
5. `AiChat.tsx` dispatches `window.dispatchEvent(new CustomEvent('cn:apply-filters', { detail: filters }))`
6. Filter components listen for `cn:apply-filters` and apply the filters locally

### Adding a New Page

1. Create `src/pages/[name].astro` with `export const prerender = true`
2. Import `Layout`, `Navbar`, `Footer`, `AiChat`
3. Add route to `navLinks` in `src/components/shared/Navbar.astro`
4. Add page schema to `PAGE_SCHEMAS` in `src/pages/api/chat.ts`
5. Pass the correct `page` prop to `<AiChat />`

### Page Size

All filter components support `pageSize` of 10, 15, or 25. The AI can set this via `filters.pageSize`.

## Security

- `.env` and `secrets.txt` are in `.gitignore` - never commit these
- `.env.example` is the safe-to-commit template
- API key is read server-side only via `import.meta.env.DEEPSEEK_API_KEY` (no `PUBLIC_` prefix)
- The key never reaches the client bundle

## Data Notes

- **H1B** (`startups_h1b_database.csv`): `Company Name`, `Business Sector`, `Category`, `Tags`, `H1B Sponsorship Likelihood`, `Fortune 500`, `Fortune 1500`, `Boutique`, `AnalystsPick`, `Publicly traded`
- **Private Markets** (`Privately_Listed_Companies.csv`): `Company_Name`, `Sector`, `Funding_round`, `Amount_raised`, `Sub-sector`, `Source Website` - do NOT reference the source database name in UI
- **VC Portfolios** (`Portfolio.csv`): `Name`, `Type` (VC/accelerator), `Portfolio`, `JobBoard` - `N/A` means no direct job board
- **YC** (`companies.json`): 5,819 companies. Currently reference only - not loaded client-side due to size

## Do Not

- Do not reference "Forge" or the institutional source database in any user-visible UI
- Do not use `PUBLIC_` prefix on `DEEPSEEK_API_KEY` - it must stay server-side only
- Do not load `companies.json` or `techstars.json` client-side without virtualization
- Do not use `client:only` - prefer `client:load` for proper SSR hydration
- Do not add em-dashes to any user-facing content strings
- Do not use `output: 'static'` - the API route requires hybrid mode
