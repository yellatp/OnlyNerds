#!/usr/bin/env python3
"""
Techstars Portfolio Data Fetcher & Founder Enricher
Fetches company data from Techstars' Typesense search API and attempts
to enrich each company with founder names and LinkedIn URLs.

Phase 1 - Company data:
  The Techstars portfolio page (https://www.techstars.com/portfolio) loads
  company data from a Typesense instance. This script queries that API
  directly to extract all portfolio companies.

Phase 2 - Founder enrichment:
  The Typesense API does NOT contain founder data. Founder info
  (founder_profile_arrays) is loaded client-side from a Salesforce backend
  when users click a company in the portfolio modal. This data is NOT
  accessible via any public API.

  The scraper uses a multi-strategy approach:
    1. Fetch the Techstars portfolio page with ?company=NAME query param
    2. Check __NEXT_DATA__ for any SSR-embedded founder data
    3. Fetch the company's own website for personal LinkedIn URLs

  IMPORTANT: Because the Techstars site is a client-rendered React SPA,
  the pure HTTP approach has limited success. To get full founder coverage,
  swap in a headless browser (Playwright/Selenium) in scrape_founders_from_page()
  that can execute JS, wait for the company modal to render, and extract the
  founder_profile_arrays data.

Usage:
  python fetch_techstars.py              # Full fetch + enrich
  python fetch_techstars.py --enrich-only  # Skip Typesense, just enrich existing data
  SCRAPE_LIMIT=100 python fetch_techstars.py --enrich-only  # Limit to 100 companies

Uses only Python standard library (urllib, json, re).
"""

import json
import os
import re
import ssl
import sys
import time
import urllib.request
import urllib.parse
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# Typesense API configuration (extracted from the Techstars Next.js app's
# runtimeConfig embedded in __NEXT_DATA__ on the /portfolio page)
# ---------------------------------------------------------------------------
TYPESENSE_URL = "https://8gbms7c94riane0lp-1.a1.typesense.net"
TYPESENSE_API_KEY = "0QKFSu4mIDX9UalfCNQN4qjg2xmukDE0"
TYPESENSE_COLLECTION = "companies"

# How many records to request per page (Typesense max is 250)
PER_PAGE = 250

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "techstars.json")

HEADERS = {
    "X-TYPESENSE-API-KEY": TYPESENSE_API_KEY,
    "Content-Type": "application/json",
    "User-Agent": "YC-Explorer/1.0 TechstarsFetcher",
}

# ---------------------------------------------------------------------------
# Optional: set to True to also fetch the Typesense config dynamically from
# the live Techstars site (in case keys rotate). Falls back to hardcoded
# values above if the live fetch fails.
# ---------------------------------------------------------------------------
AUTO_DISCOVER_CONFIG = True


def discover_typesense_config():
    """
    Fetch the Techstars portfolio page and extract the Typesense URL and
    API key from the __NEXT_DATA__ JSON blob. Returns (url, key) or None.
    """
    print("Discovering Typesense config from techstars.com/portfolio...")
    req = urllib.request.Request(
        "https://www.techstars.com/portfolio",
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        },
    )
    try:
        ctx = ssl.create_default_context()
        with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
            html = resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  [WARN] Could not fetch portfolio page: {e}", file=sys.stderr)
        return None

    # Extract __NEXT_DATA__ JSON
    match = re.search(
        r'<script\s+id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL
    )
    if not match:
        # Fallback: look for the pattern without the id attribute
        match = re.search(r'__NEXT_DATA__[^>]*>(.*?)</script>', html, re.DOTALL)
    if not match:
        print("  [WARN] Could not find __NEXT_DATA__ in page", file=sys.stderr)
        return None

    try:
        data = json.loads(match.group(1))
    except json.JSONDecodeError:
        print("  [WARN] Could not parse __NEXT_DATA__ JSON", file=sys.stderr)
        return None

    runtime = data.get("runtimeConfig", {})
    url = runtime.get("TYPESENSE_SEARCH_URL", "")
    key = runtime.get("TYPESENSE_SEARCH_TOKEN", "")
    if url and key:
        print(f"  Found Typesense URL: {url}")
        print(f"  Found Typesense key: {key[:8]}...")
        return url, key

    print("  [WARN] Typesense config not found in runtimeConfig", file=sys.stderr)
    return None


def typesense_search(query="*", page=1, per_page=PER_PAGE, filters="",
                     facet_by="", ts_url=None, ts_key=None):
    """
    Execute a search against the Typesense multi_search endpoint.
    Returns the parsed JSON response or None on failure.
    """
    url = ts_url or TYPESENSE_URL
    key = ts_key or TYPESENSE_API_KEY

    search_params = {
        "collection": TYPESENSE_COLLECTION,
        "q": query,
        "per_page": per_page,
        "page": page,
    }
    if filters:
        search_params["filter_by"] = filters
    if facet_by:
        search_params["facet_by"] = facet_by
        search_params["max_facet_values"] = 200

    body = json.dumps({"searches": [search_params]}).encode("utf-8")

    headers = {
        "X-TYPESENSE-API-KEY": key,
        "Content-Type": "application/json",
        "User-Agent": "YC-Explorer/1.0 TechstarsFetcher",
    }
    req = urllib.request.Request(
        f"{url}/multi_search",
        data=body,
        headers=headers,
        method="POST",
    )

    try:
        ctx = ssl.create_default_context()
        with urllib.request.urlopen(req, timeout=30, context=ctx) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            return result.get("results", [{}])[0]
    except Exception as e:
        print(f"  [ERROR] Typesense search failed (page {page}): {e}", file=sys.stderr)
        return None


def fetch_all_companies(ts_url=None, ts_key=None):
    """Fetch all companies from Typesense, paginating through results."""
    all_companies = []

    # First request to get total count
    result = typesense_search(page=1, per_page=PER_PAGE, ts_url=ts_url, ts_key=ts_key)
    if not result:
        print("[ERROR] Initial query failed, aborting.", file=sys.stderr)
        return []

    total = result.get("found", 0)
    hits = result.get("hits", [])
    all_companies.extend([h["document"] for h in hits])
    print(f"Total companies in Typesense: {total}")
    print(f"  Page 1: got {len(hits)} companies (running total: {len(all_companies)})")

    # Calculate total pages
    total_pages = (total + PER_PAGE - 1) // PER_PAGE

    # Fetch remaining pages
    for page in range(2, total_pages + 1):
        result = typesense_search(page=page, per_page=PER_PAGE, ts_url=ts_url, ts_key=ts_key)
        if not result:
            print(f"  [WARN] Page {page} failed, continuing...", file=sys.stderr)
            time.sleep(1)
            continue

        hits = result.get("hits", [])
        all_companies.extend([h["document"] for h in hits])
        print(f"  Page {page}/{total_pages}: got {len(hits)} companies (running total: {len(all_companies)})")

        # Light rate limiting
        time.sleep(0.2)

    return all_companies


def slugify(name):
    """Convert a company name to a URL-friendly slug."""
    slug = name.lower().strip()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s-]+', '-', slug)
    slug = slug.strip('-')
    return slug


def determine_status(doc):
    """Determine the company status from the boolean flags."""
    if doc.get("is_exit"):
        return "Exited"
    if doc.get("is_current_session"):
        return "In Program"
    if doc.get("is_1b"):
        return "Unicorn"
    return "Active"


def build_batch_string(doc):
    """
    Build a batch/program string like 'Techstars Boulder 2009'.
    Uses the first program name and the first session year.
    """
    programs = doc.get("program_names", [])
    year = doc.get("first_session_year")
    if programs and year:
        return f"{programs[0]} {year}"
    if programs:
        return programs[0]
    if year:
        return f"Techstars {year}"
    return ""


def build_location(doc):
    """Build a location string from city, state, country."""
    parts = []
    city = doc.get("city", "")
    state = doc.get("state_province", "")
    country = doc.get("country", "")
    if city:
        parts.append(city)
    if state:
        parts.append(state)
    if country:
        parts.append(country)
    return ", ".join(parts)


def build_regions(doc):
    """Build a regions list from world region and subregion."""
    regions = []
    wr = doc.get("worldregion", "")
    wsr = doc.get("worldsubregion", "")
    if wr:
        regions.append(wr)
    if wsr and wsr != wr:
        regions.append(wsr)
    return regions


def ensure_url(url_str):
    """Ensure a URL has a protocol prefix."""
    if not url_str:
        return ""
    url_str = url_str.strip()
    if url_str and not url_str.startswith("http"):
        return f"https://{url_str}"
    return url_str


def process_company(doc):
    """Convert a raw Typesense document into our normalized schema."""
    name = doc.get("company_name", "").strip()
    slug = slugify(name)
    company_id = doc.get("company_id", doc.get("id", ""))

    # Build tags from industry verticals and boolean flags
    tags = list(doc.get("industry_vertical", []))
    if doc.get("is_1b"):
        tags.append("Unicorn")
    if doc.get("is_exit"):
        tags.append("Exit")
    if doc.get("is_current_session"):
        tags.append("Current Session")
    if doc.get("is_accelerator_company"):
        tags.append("Accelerator")
    if doc.get("is_network_company"):
        tags.append("Network")

    # Determine the primary industry from the first industry vertical
    verticals = doc.get("industry_vertical", [])
    industry = verticals[0] if verticals else ""

    # Build social links for metadata
    social = {}
    if doc.get("linkedin_url"):
        social["linkedin"] = ensure_url(doc["linkedin_url"])
    if doc.get("twitter_url"):
        social["twitter"] = ensure_url(doc["twitter_url"])
    if doc.get("facebook_url"):
        social["facebook"] = ensure_url(doc["facebook_url"])
    if doc.get("crunchbase_url"):
        social["crunchbase"] = ensure_url(doc["crunchbase_url"])

    return {
        "id": f"techstars-{slug}" if slug else f"techstars-{company_id}",
        "name": name,
        "slug": slug,
        "url": ensure_url(doc.get("website", "")),
        "source_url": f"https://www.techstars.com/portfolio",
        "logo": doc.get("logo_url", ""),
        "one_liner": doc.get("brief_description", ""),
        "batch": build_batch_string(doc),
        "industry": industry,
        "tags": tags,
        "team_size": 0,  # Not available in Typesense data
        "status": determine_status(doc),
        "location": build_location(doc),
        "regions": build_regions(doc),
        "founders": [],  # Not available in Typesense data
        "source": "techstars",
        # Extra fields from Techstars data
        "social": social if social else {},
        "programs": doc.get("program_names", []),
        "program_slugs": doc.get("program_slugs", []),
        "first_year": doc.get("first_session_year"),
        "is_accelerator_company": doc.get("is_accelerator_company", False),
        "is_network_company": doc.get("is_network_company", False),
    }


def load_existing_data():
    """Load existing techstars.json if available, returning the companies list."""
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r") as f:
                data = json.load(f)
                companies = data.get("companies", [])
                return {c["id"]: c for c in companies}
        except (json.JSONDecodeError, KeyError):
            pass
    return {}


# ---------------------------------------------------------------------------
# Founder enrichment via Techstars portfolio page scraping
# ---------------------------------------------------------------------------
# The Techstars portfolio (https://www.techstars.com/portfolio) is a React
# (Next.js) SPA. Individual company detail modals are rendered client-side,
# and founder data (founder_profile_arrays) is loaded from a Salesforce
# backend that is NOT exposed through the public Typesense API.
#
# The scraping strategy below works as follows:
#   1. Fetch the portfolio page with ?company=NAME query param
#   2. Parse the full HTML for any LinkedIn personal profile URLs
#      (linkedin.com/in/...) -- these are distinct from company LinkedIn URLs
#   3. Attempt to extract founder names from nearby HTML context
#   4. As a secondary signal, check the company's own website for team pages
#
# Because the page is client-rendered, the hit rate for pure HTTP scraping is
# limited. To get full coverage, swap in a headless browser (Playwright /
# Selenium) that can execute JS and wait for the modal to render.
# ---------------------------------------------------------------------------

PORTFOLIO_BASE_URL = "https://www.techstars.com/portfolio"

# Browser-like headers for scraping
SCRAPE_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


def scrape_founders_from_page(company_name, company_slug, company_url=""):
    """
    Attempt to scrape founder names and LinkedIn URLs for a Techstars company.

    Multi-strategy approach:
      1. Fetch the Techstars portfolio page with ?company=NAME
      2. Check __NEXT_DATA__ for any embedded founder data
      3. Fetch the company's own website homepage for LinkedIn /in/ URLs

    The Techstars portfolio page is client-rendered (React/Next.js SPA), so
    strategies 1-2 have limited success with plain HTTP. Strategy 3 is a
    useful fallback since many startup homepages link to founder LinkedIn
    profiles.

    For full coverage, replace this with a headless browser approach
    (Playwright/Selenium) that can execute JavaScript and wait for the
    Techstars company modal to render.

    Returns a list of founder dicts matching the YC format:
        [{"name": "...", "linkedin": "...", "linkedin_slug": "..."}]
    or an empty list if nothing was found.
    """
    founders = []
    seen_slugs = set()
    ctx = ssl.create_default_context()

    # --- Strategy 1: Fetch Techstars portfolio page with company param ---
    encoded_name = urllib.parse.quote(company_name)
    page_url = (
        f"{PORTFOLIO_BASE_URL}"
        f"?category=all%20companies&company={encoded_name}"
    )

    try:
        req = urllib.request.Request(page_url, headers=SCRAPE_HEADERS)
        with urllib.request.urlopen(req, timeout=20, context=ctx) as resp:
            html = resp.read().decode("utf-8", errors="replace")
    except Exception:
        html = ""

    if html:
        founders = _extract_founders_from_html(html, seen_slugs)

    # --- Strategy 2: Check __NEXT_DATA__ for any embedded founder data ---
    if not founders and html:
        founders = _extract_founders_from_next_data(html, company_name, seen_slugs)

    # --- Strategy 3: Fetch the company's own website for LinkedIn URLs ---
    if not founders and company_url:
        founders = _scrape_company_website(company_url, seen_slugs, ctx)

    return founders


def _scrape_company_website(company_url, seen_slugs, ctx=None):
    """
    Fetch a company's homepage and extract personal LinkedIn URLs.
    Many startup homepages link to founders' LinkedIn profiles in the
    footer, header, or team section.
    """
    founders = []
    if not company_url:
        return founders

    if ctx is None:
        ctx = ssl.create_default_context()

    # Normalize the URL
    url = company_url.strip()
    if not url.startswith("http"):
        url = f"https://{url}"

    try:
        req = urllib.request.Request(url, headers=SCRAPE_HEADERS)
        with urllib.request.urlopen(req, timeout=10, context=ctx) as resp:
            html = resp.read().decode("utf-8", errors="replace")
    except Exception:
        return founders

    # Extract personal LinkedIn URLs (exclude company pages)
    personal_urls = set(re.findall(
        r'linkedin\.com/in/([a-zA-Z0-9_.-]+)', html
    ))

    # Filter out obviously non-personal slugs
    for li_slug in personal_urls:
        li_slug = li_slug.rstrip("/.")
        if (
            li_slug not in seen_slugs
            and len(li_slug) > 2
            and li_slug not in ("company", "school", "jobs", "pulse", "feed")
        ):
            seen_slugs.add(li_slug)
            name_guess = _name_from_linkedin_slug(li_slug)
            founders.append({
                "name": name_guess,
                "linkedin": f"https://www.linkedin.com/in/{li_slug}",
                "linkedin_slug": li_slug,
            })

    return founders


def _extract_founders_from_html(html, seen_slugs):
    """
    Extract personal LinkedIn URLs (linkedin.com/in/...) from HTML and
    attempt to pair them with nearby name text.
    """
    founders = []

    # Look for founder name + LinkedIn pairs in proximity.
    # Pattern: some text that looks like a name near a LinkedIn /in/ URL.
    # The Techstars modal renders: <a ... href="...linkedin.com/in/SLUG">
    #   <div/span with name>Name</div/span>
    # Try both orderings (name before link, link before name).

    # Pattern A: name in a tag, then LinkedIn URL nearby
    blocks_a = re.findall(
        r'(?:font-bold|font-semibold|founder|team)[^>]*>([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)'
        r'[^"]{0,500}?linkedin\.com/in/([a-zA-Z0-9_./-]+)',
        html, re.DOTALL
    )
    for name, li_slug in blocks_a:
        li_slug = li_slug.rstrip("/")
        if li_slug not in seen_slugs and len(li_slug) > 1:
            seen_slugs.add(li_slug)
            founders.append({
                "name": name.strip(),
                "linkedin": f"https://www.linkedin.com/in/{li_slug}",
                "linkedin_slug": li_slug,
            })

    # Pattern B: LinkedIn URL then name nearby
    blocks_b = re.findall(
        r'linkedin\.com/in/([a-zA-Z0-9_./-]+)[^"]*"[^>]*>'
        r'[^<]{0,200}?([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)',
        html, re.DOTALL
    )
    for li_slug, name in blocks_b:
        li_slug = li_slug.rstrip("/")
        if li_slug not in seen_slugs and len(li_slug) > 1:
            seen_slugs.add(li_slug)
            founders.append({
                "name": name.strip(),
                "linkedin": f"https://www.linkedin.com/in/{li_slug}",
                "linkedin_slug": li_slug,
            })

    # Fallback: extract personal LinkedIn URLs without names.
    # Exclude company LinkedIn URLs (linkedin.com/company/...).
    if not founders:
        personal_urls = set(re.findall(
            r'linkedin\.com/in/([a-zA-Z0-9_.-]+)', html
        ))
        for li_slug in personal_urls:
            li_slug = li_slug.rstrip("/.")
            if li_slug not in seen_slugs and len(li_slug) > 1:
                seen_slugs.add(li_slug)
                # Derive a rough name from the slug
                name_guess = _name_from_linkedin_slug(li_slug)
                founders.append({
                    "name": name_guess,
                    "linkedin": f"https://www.linkedin.com/in/{li_slug}",
                    "linkedin_slug": li_slug,
                })

    return founders


def _extract_founders_from_next_data(html, company_name, seen_slugs):
    """
    Look inside the __NEXT_DATA__ JSON blob for any company-specific
    founder information. This catches cases where SSR includes detail data.
    """
    founders = []
    match = re.search(
        r'<script\s+id="__NEXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL
    )
    if not match:
        return founders

    try:
        data = json.loads(match.group(1))
    except json.JSONDecodeError:
        return founders

    # Recursively search the JSON tree for founder_profile_arrays or
    # any structure containing personal LinkedIn URLs near the company name.
    text = json.dumps(data)
    if "founder_profile_arrays" in text:
        # Extract the arrays -- they look like: [[name, ?, ?, linkedin_url], ...]
        array_matches = re.findall(
            r'"founder_profile_arrays"\s*:\s*(\[\[.*?\]\])',
            text, re.DOTALL
        )
        for arr_str in array_matches:
            try:
                arrays = json.loads(arr_str)
                for entry in arrays:
                    if isinstance(entry, list) and len(entry) >= 1:
                        name = entry[0] if entry[0] else ""
                        li_url = entry[3] if len(entry) > 3 and entry[3] else ""
                        li_slug = ""
                        if li_url:
                            slug_match = re.search(
                                r'linkedin\.com/in/([a-zA-Z0-9_./-]+)', li_url
                            )
                            if slug_match:
                                li_slug = slug_match.group(1).rstrip("/")
                        if name and li_slug and li_slug not in seen_slugs:
                            seen_slugs.add(li_slug)
                            founders.append({
                                "name": name.strip(),
                                "linkedin": f"https://www.linkedin.com/in/{li_slug}",
                                "linkedin_slug": li_slug,
                            })
                        elif name and name not in seen_slugs:
                            seen_slugs.add(name)
                            entry_dict = {"name": name.strip()}
                            if li_url:
                                entry_dict["linkedin"] = li_url
                            founders.append(entry_dict)
            except (json.JSONDecodeError, IndexError, TypeError):
                continue

    return founders


def _name_from_linkedin_slug(slug):
    """
    Attempt to derive a human-readable name from a LinkedIn slug.
    e.g. 'john-smith-123' -> 'John Smith'
    """
    # Remove trailing digits (common LinkedIn disambiguators)
    cleaned = re.sub(r'-?\d+$', '', slug)
    # Split on hyphens, capitalize, filter junk
    parts = [p.capitalize() for p in cleaned.split('-') if p and len(p) > 1]
    if len(parts) >= 2:
        return ' '.join(parts[:3])  # Take up to 3 name parts
    return slug


def enrich_founders(companies):
    """
    Enrich companies with founder data by scraping Techstars profile pages.

    - Loads existing data to preserve previously scraped founders.
    - Respects SCRAPE_LIMIT env var (default 300).
    - Prioritizes newest companies (2025-2026 batches first).
    - Uses 0.5s delay between requests.
    - Saves progress incrementally every 50 companies.
    """
    scrape_limit = int(os.environ.get("SCRAPE_LIMIT", "300"))

    # Build lookup for existing founder data
    existing = load_existing_data()
    preserved_count = 0
    for company in companies:
        cid = company["id"]
        if cid in existing and existing[cid].get("founders"):
            company["founders"] = existing[cid]["founders"]
            preserved_count += 1

    # Also update source_url to include company-specific link
    for company in companies:
        if company.get("slug"):
            company["source_url"] = (
                f"{PORTFOLIO_BASE_URL}"
                f"?category=all%20companies"
                f"&company={urllib.parse.quote(company['name'])}"
            )

    # Determine which companies still need founder data
    needs_founders = [c for c in companies if not c.get("founders")]

    # Sort: newest first (2026 > 2025 > ...), then accelerator before network
    needs_founders.sort(
        key=lambda c: (
            -(c.get("first_year") or 0),
            0 if c.get("is_accelerator_company") else 1,
            c["name"].lower(),
        )
    )

    total_needing = len(needs_founders)
    print(f"  Companies with existing founders: {preserved_count}")
    print(f"  Companies needing founders: {total_needing}")
    print(f"  Scrape limit this run: {scrape_limit}")

    scrape_count = 0
    found_count = 0

    for company in needs_founders:
        if scrape_count >= scrape_limit:
            break

        name = company.get("name", "")
        slug = company.get("slug", "")
        if not name:
            continue

        company_url = company.get("url", "")
        founders = scrape_founders_from_page(name, slug, company_url)
        company["founders"] = founders

        scrape_count += 1
        if founders:
            found_count += 1
            print(
                f"  [{scrape_count}/{scrape_limit}] {name}: "
                f"{len(founders)} founder(s) found"
            )
        elif scrape_count % 50 == 0:
            print(
                f"  [{scrape_count}/{scrape_limit}] Progress... "
                f"({found_count} with founders so far)"
            )

        # Incremental save every 50 companies
        if scrape_count % 50 == 0:
            _save_data(companies)
            print(f"  [checkpoint] Saved progress at {scrape_count} companies")

        time.sleep(0.5)

    print(
        f"\n  Scraping complete: {scrape_count} attempted, "
        f"{found_count} with founders found"
    )
    return companies


def _save_data(companies):
    """Write the current companies list to the output file."""
    accelerator_count = sum(
        1 for c in companies if c.get("is_accelerator_company")
    )
    network_count = sum(
        1 for c in companies if c.get("is_network_company")
    )
    statuses = {}
    industries = {}
    programs_count = {}
    for c in companies:
        st = c["status"]
        statuses[st] = statuses.get(st, 0) + 1
        ind = c["industry"] or "Unspecified"
        industries[ind] = industries.get(ind, 0) + 1
        for p in c.get("programs", []):
            programs_count[p] = programs_count.get(p, 0) + 1

    output = {
        "source": "techstars",
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "total_companies": len(companies),
        "total_with_founders": sum(1 for c in companies if c.get("founders")),
        "stats": {
            "accelerator_companies": accelerator_count,
            "network_companies": network_count,
            "statuses": statuses,
            "top_industries": dict(
                sorted(industries.items(), key=lambda x: -x[1])[:20]
            ),
            "total_programs": len(programs_count),
        },
        "companies": companies,
    }
    with open(OUTPUT_FILE, "w") as f:
        json.dump(output, f, separators=(",", ":"))


def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    # ---------------------------------------------------------------
    # Phase 1: Fetch company list from Typesense (or load existing)
    # ---------------------------------------------------------------
    # If --enrich-only is passed, skip the Typesense fetch and just
    # enrich the existing data file.
    enrich_only = "--enrich-only" in sys.argv

    if enrich_only:
        print("=== Enrich-only mode: loading existing data ===")
        existing = load_existing_data()
        if not existing:
            print("[ERROR] No existing data to enrich.", file=sys.stderr)
            sys.exit(1)
        companies = list(existing.values())
        print(f"Loaded {len(companies)} existing companies")
    else:
        # Optionally discover config dynamically
        ts_url = TYPESENSE_URL
        ts_key = TYPESENSE_API_KEY
        if AUTO_DISCOVER_CONFIG:
            discovered = discover_typesense_config()
            if discovered:
                ts_url, ts_key = discovered
            else:
                print("  Using hardcoded Typesense config as fallback")

        # Fetch all companies
        print("\n=== Fetching companies from Techstars Typesense API ===")
        raw_companies = fetch_all_companies(ts_url=ts_url, ts_key=ts_key)
        print(f"\nFetched {len(raw_companies)} raw company records")

        if not raw_companies:
            print("[ERROR] No companies fetched, aborting.", file=sys.stderr)
            sys.exit(1)

        # Process and normalize
        print("\n=== Processing companies ===")
        companies = []
        seen_ids = set()
        for doc in raw_companies:
            company = process_company(doc)
            # Deduplicate by company ID
            if company["id"] in seen_ids:
                continue
            seen_ids.add(company["id"])
            companies.append(company)

    # Sort by year (newest first), then by name
    companies.sort(
        key=lambda c: (-(c.get("first_year") or 0), c["name"].lower())
    )

    # Compute summary stats
    statuses = {}
    industries = {}
    programs_count = {}
    for c in companies:
        st = c["status"]
        statuses[st] = statuses.get(st, 0) + 1
        ind = c["industry"] or "Unspecified"
        industries[ind] = industries.get(ind, 0) + 1
        for p in c.get("programs", []):
            programs_count[p] = programs_count.get(p, 0) + 1

    accelerator_count = sum(1 for c in companies if c.get("is_accelerator_company"))
    network_count = sum(1 for c in companies if c.get("is_network_company"))

    print(f"\n  Total unique companies: {len(companies)}")
    print(f"  Accelerator companies: {accelerator_count}")
    print(f"  Network companies: {network_count}")
    print(f"  Statuses: {statuses}")
    print(f"  Top industries: {dict(sorted(industries.items(), key=lambda x: -x[1])[:10])}")

    # ---------------------------------------------------------------
    # Phase 2: Enrich with founder data
    # ---------------------------------------------------------------
    print("\n=== Enriching companies with founder data ===")
    companies = enrich_founders(companies)

    # ---------------------------------------------------------------
    # Phase 3: Save final output
    # ---------------------------------------------------------------
    _save_data(companies)

    # Also write a readable version for debugging (first 5 companies)
    sample_file = os.path.join(DATA_DIR, "techstars_sample.json")
    total_with_founders = sum(1 for c in companies if c.get("founders"))
    sample = {
        "source": "techstars",
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "total_companies": len(companies),
        "total_with_founders": total_with_founders,
        "stats": {
            "accelerator_companies": accelerator_count,
            "network_companies": network_count,
            "statuses": statuses,
            "top_industries": dict(sorted(industries.items(), key=lambda x: -x[1])[:20]),
            "total_programs": len(programs_count),
        },
        "companies_sample": companies[:5],
    }
    with open(sample_file, "w") as f:
        json.dump(sample, f, indent=2)

    print(f"\n=== Done ===")
    print(f"Total companies: {len(companies)}")
    print(f"Companies with founder data: {total_with_founders}")
    print(f"Data written to {OUTPUT_FILE}")
    print(f"Sample written to {sample_file}")


if __name__ == "__main__":
    main()
