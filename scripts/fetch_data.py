#!/usr/bin/env python3
"""
YC Explorer Data Fetcher
Fetches company data from YC's Algolia API and scrapes founder details.
Designed to run as a GitHub Actions cron job.
"""

import json
import os
import re
import sys
import time
import urllib.request
import urllib.parse
from datetime import datetime, timezone

ALGOLIA_APP_ID = "45BWZJ1SGC"
ALGOLIA_API_KEY = "NzllNTY5MzJiZGM2OTY2ZTQwMDEzOTNhYWZiZGRjODlhYzVkNjBmOGRjNzJiMWM4ZTU0ZDlhYTZjOTJiMjlhMWFuYWx5dGljc1RhZ3M9eWNkYyZyZXN0cmljdEluZGljZXM9WUNDb21wYW55X3Byb2R1Y3Rpb24lMkNZQ0NvbXBhbnlfQnlfTGF1bmNoX0RhdGVfcHJvZHVjdGlvbiZ0YWdGaWx0ZXJzPSU1QiUyMnljZGNfcHVibGljJTIyJTVE"
ALGOLIA_URL = f"https://{ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/YCCompany_production/query"

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
COMPANIES_FILE = os.path.join(DATA_DIR, "companies.json")
META_FILE = os.path.join(DATA_DIR, "meta.json")

HEADERS = {
    "X-Algolia-Application-Id": ALGOLIA_APP_ID,
    "X-Algolia-API-Key": ALGOLIA_API_KEY,
    "Content-Type": "application/json",
    "User-Agent": "YC-Explorer/1.0"
}


def algolia_query(query="", page=0, hits_per_page=1000, facet_filters=None, facets=None):
    """Query the YC Algolia index."""
    body = {
        "query": query,
        "hitsPerPage": hits_per_page,
        "page": page,
    }
    if facet_filters:
        body["facetFilters"] = facet_filters
    if facets:
        body["facets"] = facets

    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(ALGOLIA_URL, data=data, headers=HEADERS, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"  [ERROR] Algolia query failed: {e}", file=sys.stderr)
        return None


def fetch_all_companies():
    """Fetch all companies from the Algolia index, querying per batch to bypass 1000-hit limit."""
    all_companies = []

    # First, get batch facets to know all batches
    result = algolia_query(hits_per_page=0, facets=["batch"])
    if not result:
        return []

    total = result["nbHits"]
    batches = result.get("facets", {}).get("batch", {})
    print(f"Total companies: {total}")
    print(f"Batches found: {len(batches)}")

    # Fetch companies per batch to avoid the 1000-hit API limit
    for batch_name, count in sorted(batches.items(), key=lambda x: normalize_batch(x[0]), reverse=True):
        print(f"  Fetching batch: {batch_name} ({count} companies)...")
        page = 0
        batch_companies = []
        while True:
            result = algolia_query(
                page=page,
                hits_per_page=1000,
                facet_filters=[[f"batch:{batch_name}"]]
            )
            if not result or not result.get("hits"):
                break
            batch_companies.extend(result["hits"])
            if page >= result.get("nbPages", 0) - 1:
                break
            page += 1
            time.sleep(0.1)
        all_companies.extend(batch_companies)
        print(f"    Got {len(batch_companies)} companies (running total: {len(all_companies)})")
        time.sleep(0.1)

    return all_companies


def scrape_founder_details(slug):
    """Scrape founder details from a YC company page."""
    url = f"https://www.ycombinator.com/companies/{slug}"
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    })

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        return []

    founders = []
    seen_slugs = set()

    # Pattern: founder name in bold text followed by LinkedIn link
    # e.g., "font-bold">Adam Iseman</div>...linkedin.com/in/adamiseman"
    # Extract name-linkedin pairs from the Active Founders section
    founder_blocks = re.findall(
        r'text-xl font-bold"?>([^<]+)</div>.*?linkedin\.com/in/([a-zA-Z0-9_/-]+)',
        html, re.DOTALL
    )
    for name, li_slug in founder_blocks:
        li_slug = li_slug.rstrip("/")
        if li_slug not in seen_slugs:
            seen_slugs.add(li_slug)
            founders.append({
                "name": name.strip(),
                "linkedin": f"https://www.linkedin.com/in/{li_slug}",
                "linkedin_slug": li_slug
            })

    # Also try mobile layout pattern: "text-lg font-bold">Name</div>
    if not founders:
        founder_blocks = re.findall(
            r'text-lg font-bold"?>([^<]+)</div>.*?linkedin\.com/in/([a-zA-Z0-9_/-]+)',
            html, re.DOTALL
        )
        for name, li_slug in founder_blocks:
            li_slug = li_slug.rstrip("/")
            if li_slug not in seen_slugs:
                seen_slugs.add(li_slug)
                founders.append({
                    "name": name.strip(),
                    "linkedin": f"https://www.linkedin.com/in/{li_slug}",
                    "linkedin_slug": li_slug
                })

    # Fallback: just extract LinkedIn URLs
    if not founders:
        linkedin_urls = list(set(re.findall(r'linkedin\.com/in/([a-zA-Z0-9_-]+)', html)))
        for li_slug in linkedin_urls:
            if li_slug not in seen_slugs:
                seen_slugs.add(li_slug)
                founders.append({
                    "linkedin": f"https://www.linkedin.com/in/{li_slug}",
                    "linkedin_slug": li_slug
                })

    return founders


def normalize_batch(batch_str):
    """Convert batch string to a sortable format."""
    season_order = {"Winter": 0, "Spring": 1, "Summer": 2, "Fall": 3}
    parts = batch_str.split(" ")
    if len(parts) == 2:
        season, year = parts
        return f"{year}-{season_order.get(season, 9):01d}"
    return batch_str


def process_company(hit):
    """Process a single Algolia hit into our data format."""
    return {
        "id": hit.get("id"),
        "name": hit.get("name", ""),
        "slug": hit.get("slug", ""),
        "url": hit.get("website", ""),
        "yc_url": f"https://www.ycombinator.com/companies/{hit.get('slug', '')}",
        "logo": hit.get("small_logo_thumb_url", ""),
        "one_liner": hit.get("one_liner", ""),
        "description": hit.get("long_description", ""),
        "batch": hit.get("batch", ""),
        "batch_sort": normalize_batch(hit.get("batch", "")),
        "industry": hit.get("industry", ""),
        "industries": hit.get("industries", []),
        "subindustry": hit.get("subindustry", ""),
        "tags": hit.get("tags", []),
        "team_size": hit.get("team_size", 0),
        "status": hit.get("status", ""),
        "location": hit.get("all_locations", ""),
        "regions": hit.get("regions", []),
        "is_hiring": hit.get("isHiring", False),
        "top_company": hit.get("top_company", False),
        "launched_at": hit.get("launched_at"),
        "founders": [],  # Will be enriched by scraping
    }


def load_existing_data():
    """Load existing companies data if available."""
    if os.path.exists(COMPANIES_FILE):
        try:
            with open(COMPANIES_FILE, "r") as f:
                data = json.load(f)
                return {c["id"]: c for c in data.get("companies", [])}
        except (json.JSONDecodeError, KeyError):
            pass
    return {}


def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    # Load existing data to preserve founder info
    existing = load_existing_data()
    print(f"Loaded {len(existing)} existing companies")

    # Fetch all companies from Algolia
    print("\n=== Fetching companies from Algolia ===")
    raw_companies = fetch_all_companies()
    print(f"Fetched {len(raw_companies)} companies total")

    # Process companies
    companies = []
    for hit in raw_companies:
        company = process_company(hit)
        # Preserve existing founder data
        if company["id"] in existing and existing[company["id"]].get("founders"):
            company["founders"] = existing[company["id"]]["founders"]
        companies.append(company)

    # Scrape founder details for companies that don't have them yet
    # Prioritize recent batches
    needs_founders = [c for c in companies if not c["founders"]]
    needs_founders.sort(key=lambda c: c["batch_sort"], reverse=True)

    # Limit scraping per run to avoid rate limiting (GitHub Actions has 6h limit)
    scrape_limit = int(os.environ.get("SCRAPE_LIMIT", "200"))
    scrape_count = 0

    print(f"\n=== Scraping founder details (limit: {scrape_limit}) ===")
    for company in needs_founders:
        if scrape_count >= scrape_limit:
            break
        if not company["slug"]:
            continue

        founders = scrape_founder_details(company["slug"])
        if founders:
            company["founders"] = founders
            print(f"  {company['name']}: {len(founders)} founders found")
        else:
            company["founders"] = []

        scrape_count += 1
        if scrape_count % 10 == 0:
            print(f"  Scraped {scrape_count}/{scrape_limit}...")
        time.sleep(0.5)  # Rate limiting

    print(f"\nScraped {scrape_count} companies for founder details")

    # Compute batch statistics
    batch_stats = {}
    for c in companies:
        batch = c["batch"]
        if batch not in batch_stats:
            batch_stats[batch] = {"total": 0, "industries": {}, "statuses": {}, "ai_count": 0}
        batch_stats[batch]["total"] += 1
        ind = c["industry"] or "Unspecified"
        batch_stats[batch]["industries"][ind] = batch_stats[batch]["industries"].get(ind, 0) + 1
        st = c["status"]
        batch_stats[batch]["statuses"][st] = batch_stats[batch]["statuses"].get(st, 0) + 1
        if any(t in (c.get("tags") or []) for t in ["AI", "Artificial Intelligence", "Generative AI", "Machine Learning", "Deep Learning"]):
            batch_stats[batch]["ai_count"] += 1

    # Sort companies by batch (newest first), then name
    companies.sort(key=lambda c: (c["batch_sort"], c["name"]), reverse=True)

    # Build output
    output = {
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "total_companies": len(companies),
        "total_with_founders": sum(1 for c in companies if c["founders"]),
        "batch_stats": batch_stats,
        "companies": companies
    }

    # Write data
    with open(COMPANIES_FILE, "w") as f:
        json.dump(output, f, separators=(",", ":"))

    # Write readable meta
    meta = {
        "last_updated": output["last_updated"],
        "total_companies": output["total_companies"],
        "total_with_founders": output["total_with_founders"],
        "batches": sorted(batch_stats.keys(), key=lambda b: normalize_batch(b), reverse=True)
    }
    with open(META_FILE, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"\n=== Done ===")
    print(f"Total companies: {len(companies)}")
    print(f"Companies with founder data: {output['total_with_founders']}")
    print(f"Data written to {COMPANIES_FILE}")


if __name__ == "__main__":
    main()
