/**
 * Cloudflare Pages Function — D1 Stats API
 *
 * Returns aggregate statistics from the D1 database:
 *   GET /api/stats
 *     → { totalJobs, totalCompanies, totalPlatforms, lastUpdated }
 *
 * Requires a D1 binding named "DB" in wrangler.toml:
 *   [[d1_databases]]
 *   binding = "DB"
 *   database_name = "job-aggregator-db"
 *   database_id = "01442a72-dac8-419b-a367-96b9a450fb0e"
 */

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env } = context;

  try {
    // Run all stats queries in parallel
    const [jobCountResult, companyCountResult, platformCountResult, lastUpdatedResult] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) as count FROM jobs').all(),
      env.DB.prepare('SELECT COUNT(DISTINCT company) as count FROM jobs').all(),
      env.DB.prepare('SELECT COUNT(DISTINCT ats) as count FROM jobs').all(),
      env.DB.prepare('SELECT MAX(scraped_at) as last_updated FROM jobs').all(),
    ]);

    const stats = {
      totalJobs: (jobCountResult.results?.[0] as any)?.count || 0,
      totalCompanies: (companyCountResult.results?.[0] as any)?.count || 0,
      totalPlatforms: (platformCountResult.results?.[0] as any)?.count || 0,
      lastUpdated: (lastUpdatedResult.results?.[0] as any)?.last_updated || null,
    };

    return new Response(JSON.stringify(stats), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=300', // 5 min cache
      },
    });
  } catch (error) {
    console.error('D1 stats error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch stats' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};
