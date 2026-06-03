/**
 * Cloudflare Pages Function — Proxy /data/chunks/* to R2 public bucket.
 *
 * The frontend fetches job data from `./data/chunks` (relative path).
 * In production on Cloudflare Pages, this function intercepts those requests
 * and proxies them to the R2 public URL, avoiding CORS issues.
 *
 * For local development without R2, set env.R2_PUBLIC_BASE or
 * the function falls back to ASSETS (static files from the deployment).
 */

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  R2_PUBLIC_BASE?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;

  // Extract the path after /data/chunks/
  const pathParts = params.path as string[] | undefined;
  if (!pathParts || pathParts.length === 0) {
    return new Response('Not Found', { status: 404 });
  }

  const filePath = pathParts.join('/');
  const r2Base = env.R2_PUBLIC_BASE || 'https://pub-44ec4fb39628423389fcf31e0c2ec994.r2.dev';
  const r2Url = `${r2Base}/chunks/${filePath}`;

  try {
    const response = await fetch(r2Url);

    if (!response.ok) {
      // If not found in R2, try static assets (for local dev with actual files)
      const staticResponse = await env.ASSETS.fetch(request);
      if (staticResponse.ok) {
        return staticResponse;
      }
      return new Response(`Not Found: ${filePath}`, { status: 404 });
    }

    // Determine content type based on file extension
    const contentType = getContentType(filePath);

    // Return the proxied response with CORS headers (for local dev)
    const headers = new Headers(response.headers);
    headers.set('Content-Type', contentType);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error(`R2 proxy error for ${filePath}:`, error);

    // Fallback to static assets
    try {
      const staticResponse = await env.ASSETS.fetch(request);
      if (staticResponse.ok) {
        return staticResponse;
      }
    } catch {}

    return new Response(`Proxy error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 502 });
  }
};

function getContentType(filePath: string): string {
  if (filePath.endsWith('.json')) {
    return 'application/json';
  }
  if (filePath.endsWith('.json.gz') || filePath.endsWith('.gz')) {
    return 'application/gzip';
  }
  return 'application/octet-stream';
}
