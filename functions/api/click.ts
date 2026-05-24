/**
 * Cloudflare Pages Function — Apply Click Tracking
 *
 * Records when a user clicks "Apply" on a job listing:
 *   POST /api/click
 *   Body: { url: string, title?: string, company?: string }
 *
 * Requires a D1 binding named "DB" in wrangler.toml.
 */

interface Env {
  DB: D1Database;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const body = await request.json() as { url?: string; title?: string; company?: string };

    if (!body.url) {
      return new Response(JSON.stringify({ error: 'Missing url' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    await env.DB.prepare(
      'INSERT INTO apply_clicks (job_url, title, company) VALUES (?, ?, ?)'
    ).bind(body.url, body.title || null, body.company || null).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('D1 click tracking error:', error);
    return new Response(JSON.stringify({ error: 'Failed to record click' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
};
