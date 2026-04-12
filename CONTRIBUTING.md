# Contributing to OnlyNerds

OnlyNerds is a shared system, not a silo. The data and tools here are built collectively for jobseekers who do their homework.

There are three ways to contribute. Pick one - you don't need to know how to code for the first two.

---

## 1. Data Contributions (No code required)

The most impactful contributions are data fixes and additions.

### H1B Companies (`data/startups_h1b_database.csv`)

**Columns:** `Company Name`, `Business Sector`, `Category`, `Tags`, `H1B Sponsorship Likelihood`, `Fortune 500`, `Fortune 1500`, `Boutique`, `AnalystsPick`, `Publicly traded`

**Likelihood values:** `Very High`, `High`, `Medium`, `Low`, `Unknown`

**Boolean columns:** `Yes` or `No` only.

Open a PR with your changes. In the PR description, link to the public source (USCIS data, company career page, LCA disclosure, etc.). Do not submit based on anecdotal information.

### Private Markets (`data/Privately_Listed_Companies.csv`)

**Columns:** `Company_Name`, `Sector`, `Funding_round`, `Amount_raised`, `Sub-sector`, `Source Website`

Source must be publicly available. Do not reference the institutional database name in the `Source Website` column - use the public company or funding announcement URL only.

### VC / Accelerator Portfolios (`data/Portfolio.csv`)

**Columns:** `Name`, `Type` (VC or accelerator), `Portfolio`, `JobBoard`

Use `N/A` for `JobBoard` if the firm has no direct job board. Do not fabricate URLs.

### University Data

University datasets (`data/usa-universities.csv`, `data/world-universities.csv`) are sourced from public academic registries. If an entry is outdated or missing, open an issue with the correct name, country code, and URL. Only accredited institutions with publicly verifiable websites.

---

## 2. Broken Link Reports (No code required)

Career links, job board URLs, and portfolio pages go stale. If you find a broken link:

1. Open a GitHub Issue
2. Use the title format: `[Broken Link] Company Name - page type`
3. Include the current broken URL and the correct one if you found it

---

## 3. Code Contributions

### Setup

```bash
git clone https://github.com/yellatp/OnlyNerds.git
cd OnlyNerds
npm install
npm run dev
```

Dev server starts at `http://localhost:4321`.

### Stack

- **Astro 4** - static site generator (`output: 'static'`)
- **React 18** - interactive islands (`client:load` only, never `client:only`)
- **Tailwind CSS 3** - utility classes, custom warm neutral palette
- **Framer Motion 11** - animations in React islands

### Rules

**Data loading is build-time only.** All CSV parsing happens in `src/data/*.ts` using Node `fs.readFileSync`. Data is passed as serializable props to React islands. Do not fetch data client-side.

**No new server routes.** The site is fully static. There is no API. Do not add `prerender = false` to any page.

**No `client:only`.** Use `client:load` for React islands. This ensures proper SSR hydration.

**Do not reference the source database name in any user-visible UI.** Private Markets data source is not to be mentioned by name anywhere.

**No em-dashes in content strings.** Use a hyphen (`-`) if a separator is needed.

**Keep the design system.** Zero border-radius (except `rounded-full`). Warm neutral palette. Three fonts: Fraunces (display H1 only), Space Grotesk (body), JetBrains Mono (nav/labels/code). Do not introduce new font families.

### Adding a new page

1. Create `src/pages/[name].astro` with `export const prerender = true`
2. Import `Layout`, `Navbar`, `Footer`
3. Add route to the `links` array in `src/components/shared/NavbarClient.tsx`
4. Add route to the Pages column in `src/components/shared/Footer.astro`
5. Add to `public/sitemap.xml`

### PR checklist

- [ ] `npm run build` passes with zero errors
- [ ] No `.env` or secret files staged
- [ ] Data changes include a public source reference
- [ ] No new external dependencies added without discussion

---

## What we don't accept

- Scraped or paywalled data
- Company self-submissions claiming high H1B likelihood without public LCA evidence
- UI redesigns that break the design system
- Features that require a server (API keys, auth, databases)
- Em-dashes in user-visible content

---

## License

By contributing, you agree that your contributions are licensed under [Apache 2.0](LICENSE).
