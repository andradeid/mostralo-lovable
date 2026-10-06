// Cloudflare Pages Function: /sitemap.xml
// Replica o proxy do nginx para a edge function "sitemap" do Supabase.
// Fallback: arquivo estático public/sitemap.xml via ASSETS (não reexecuta Functions, sem loop).

interface Env {
  ASSETS: { fetch: (input: Request | URL | string) => Promise<Response> };
}

interface PagesContext {
  request: Request;
  env: Env;
}

const SITEMAP_URL = 'https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/sitemap';

export const onRequestGet = async (context: PagesContext): Promise<Response> => {
  try {
    const upstream = await fetch(SITEMAP_URL, { headers: { Accept: 'application/xml' } });
    if (upstream.status === 200) {
      return new Response(await upstream.text(), {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
  } catch {
    // segue para o fallback
  }

  const fallback = await context.env.ASSETS.fetch(new URL('/sitemap.xml', context.request.url));
  return new Response(fallback.body, {
    status: fallback.status,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
