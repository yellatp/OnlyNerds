/**
 * Cloudflare Pages Function — D1 Search API
 *
 * Search and filter jobs from the D1 database:
 *   GET /api/search?q=engineer&company=Google&ats=greenhouse&category=Technology&limit=50&offset=0
 *
 * Parameters (all optional):
 *   q        - Full-text search on title/company/location
 *   company  - Filter by company name (partial match)
 *   ats      - Filter by ATS platform (greenhouse, ashby, lever, workable, bamboohr)
 *   category - Filter by job category
 *   domain   - Filter by domain
 *   skill_level - Filter by skill level (entry, mid, senior, lead)
 *   employment_type - Filter by employment type
 *   remote   - Filter by remote (1 = remote, 0 = on-site)
 *   limit    - Max results (default: 50, max: 200)
 *   offset   - Pagination offset (default: 0)
 *
 * Requires a D1 binding named "DB" in wrangler.toml:
 *   [[d1_databases]]
 *   binding = "DB"
 *   database_name = "job-aggregator-db"
 *   database_id = "d27185cb-ca2d-4dc3-96bf-d21d558fced3"
 */

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const params = url.searchParams;

  try {
    // Build the query dynamically based on provided filters
    const conditions: string[] = [];
    const bindings: any[] = [];

    // Full-text search on title, company, location
    const q = params.get('q');
    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      conditions.push('(title LIKE ? OR company LIKE ? OR location LIKE ?)');
      bindings.push(searchTerm, searchTerm, searchTerm);
    }

    // Company filter
    const company = params.get('company');
    if (company && company.trim()) {
      conditions.push('company LIKE ?');
      bindings.push(`%${company.trim()}%`);
    }

    // ATS platform filter
    const ats = params.get('ats');
    if (ats && ats.trim()) {
      conditions.push('ats = ?');
      bindings.push(ats.trim().toLowerCase());
    }

    // Category filter
    const category = params.get('category');
    if (category && category.trim()) {
      conditions.push('category = ?');
      bindings.push(category.trim());
    }

    // Domain filter
    const domain = params.get('domain');
    if (domain && domain.trim()) {
      conditions.push('domain = ?');
      bindings.push(domain.trim());
    }

    // Skill level filter
    const skillLevel = params.get('skill_level');
    if (skillLevel && skillLevel.trim()) {
      conditions.push('skill_level = ?');
      bindings.push(skillLevel.trim().toLowerCase());
    }

    // Employment type filter
    const employmentType = params.get('employment_type');
    if (employmentType && employmentType.trim()) {
      conditions.push('employment_type = ?');
      bindings.push(employmentType.trim().toLowerCase());
    }

    // Remote filter
    const remote = params.get('remote');
    if (remote === '1' || remote === 'true') {
      conditions.push('remote = 1');
    } else if (remote === '0' || remote === 'false') {
      conditions.push('remote = 0');
    }

    // Pagination
    const limit = Math.min(parseInt(params.get('limit') || '50', 10), 200);
    const offset = Math.max(parseInt(params.get('offset') || '0', 10), 0);

    // Build WHERE clause
    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Get total count (for pagination)
    const countQuery = `SELECT COUNT(*) as total FROM jobs ${whereClause}`;
    const countResult = await env.DB.prepare(countQuery).bind(...bindings).all();
    const total = (countResult.results?.[0] as any)?.total || 0;

    // Get paginated results
    const dataQuery = `SELECT * FROM jobs ${whereClause} ORDER BY scraped_at DESC LIMIT ? OFFSET ?`;
    const dataResult = await env.DB.prepare(dataQuery).bind(...bindings, limit, offset).all();

    return new Response(JSON.stringify({
      jobs: dataResult.results || [],
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=60', // 1 min cache for search
      },
    });
  } catch (error) {
    console.error('D1 search error:', error);
    return new Response(JSON.stringify({ error: 'Search failed', jobs: [], total: 0 }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};
