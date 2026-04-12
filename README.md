# OnlyNerds

**Career intelligence for people who do their homework.**

Live at [onlynerds.win](https://onlynerds.win) — Free, community-built, no sign-ups, no paywalls.

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

### `/companies` — Companies Directory

Combined, filterable view of three datasets in one page. Switch between H1B, Private Markets, and VC sections without leaving the page. Sticky section navigation with IntersectionObserver active highlighting.

### `/h1b` — H1B Intelligence

Searchable database of 2,200+ tech companies ranked by H1B sponsorship likelihood (Very High, High, Medium, Low). Filter by sector, category, Fortune 500 status, boutique firms, and analyst picks.

### `/private-markets` — Private Market Companies

Late-stage private companies filtered by sector, funding round (Series A through Pre-IPO), and amount raised. Surfaces firms that rarely appear on standard job boards.

### `/vc-portfolios` — VC Portfolio Job Boards

Direct links to job boards for 100+ top VC firms and accelerators including a16z, Sequoia, Lightspeed, General Catalyst, Y Combinator, Techstars, and more.

### `/job-search` — Job Search Builder

Google Dorking query builder with:

- Role groups with automatic alias expansion (e.g. "Software Engineer" expands to SWE, SDE, Software Developer)
- ATS segment targeting (Greenhouse, Lever, Workday, Ashby, etc.)
- Seniority level filters (Intern through Staff/Principal)
- Location hubs (Bay Area, NYC, Seattle, Austin, Remote, India, and more)
- Posted time filter (Past 1h to Past week via `tbs=` parameter)
- Smart job boards grid with direct links

### `/resources` — Resources Hub

11-section knowledge base accessible via modal overlays:

- Learning Paths (DS/ML/AI career tracks)
- SQL Mastery (9 platforms + execution order reference + set theory vs imperative logic)
- AI/ML (courses, papers, tools)
- DSA (LeetCode patterns, system design)
- Tech Blogs and newsletters
- Salary intelligence
- Dorking reference guide
- Networking strategies
- Career strategy guides
- Resume playbooks

### `/brand` — Brand Assets

Download OnlyNerds logo assets (SVG + PNG) for use in blog posts, presentations, or contributions.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Astro 4 (`output: 'static'`) |
| Styling | Tailwind CSS 3 with custom warm neutral palette |
| Components | React 18 islands (`client:load`) |
| Animations | Framer Motion 11 |
| Fonts | Fraunces (display) + Space Grotesk (sans) + JetBrains Mono (mono) |
| Data | CSV + JSON parsed at build time via Node `fs.readFileSync` |
| Hosting | Cloudflare Pages |

No databases. No APIs. No server runtime. Pure static output — every page is pre-rendered HTML.

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
    h1b/H1BFilter.tsx               Filterable H1B company grid
    private/PrivateFilter.tsx       Filterable private market grid
    vc/VCDirectory.tsx              VC portfolio directory with search
    jobsearch/JobSearchBuilder.tsx  Dorking query builder
  data/
    h1b.ts                          Parses data/startups_h1b_database.csv
    privateMarkets.ts               Parses data/Privately_Listed_Companies.csv
    vcPortfolios.ts                 Parses data/Portfolio.csv
    resources.ts                    Job boards, learning resources, SQL resources
    jobSearch.ts                    Role groups, ATS segments, location hubs, posted times
    parser.ts                       CSV parser + smartCareerLink utility
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
  styles/global.css                 Design system, film grain, custom cursor
data/
  startups_h1b_database.csv
  Privately_Listed_Companies.csv
  Portfolio.csv
public/
  OnlyNerds.svg / .png
  OnlyNerds_Nav.svg / .png
  Alphonso_logo.png
  robots.txt
  sitemap.xml
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

### Data contributions (no code needed)

- Know a company missing from the H1B or Private Markets database? Email the details.
- Found a wrong career URL or outdated job board link? Report it via email or GitHub issue.
- Have a VC firm or accelerator that should be listed? Open an issue with the name and URLs.

### Code contributions

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-change`
3. Make your changes
4. Run `npm run build` to verify no build errors
5. Open a pull request — describe what you changed and why

### Resource contributions

Found a learning resource, salary dataset, or career strategy that belongs here? Email [pavan.yellathakota.ds@gmail.com](mailto:pavan.yellathakota.ds@gmail.com) with the link and a one-line description. All contributions are credited by name on the platform.

### Share it

Share with one person who would benefit. That is the most effective form of contribution.

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

## License

Apache License 2.0 — see [LICENSE](LICENSE).

Copyright 2025 Pavan Yellathakota.

---

## Built By

**Pavan Yellathakota (PYE)** — Data Scientist and ML Practitioner

[pye.pages.dev](https://pye.pages.dev) · [GitHub](https://github.com/yellatp) · [LinkedIn](https://linkedin.com/in/yellatp)

Built in association with [Alphonso AI](https://alphonsohq.com).
