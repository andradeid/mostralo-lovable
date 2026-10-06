// Cloudflare Pages Function: /api/sb/*
// Proxy SOMENTE LEITURA com cache de borda para as tabelas públicas da vitrine.
// Sempre usa a anon key (o Authorization do cliente é ignorado).

interface PagesContext {
  request: Request;
  waitUntil: (p: Promise<unknown>) => void;
}

const SUPABASE_URL = 'https://noshwvwpjtnvndokbfjx.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA';

const ALLOWED_TABLES = new Set([
  'public_stores',
  'public_store_config',
  'categories',
  'products',
  'product_variants',
  'product_addons',
  'category_addon_categories',
  'addons',
  'addon_categories',
  'banners',
  'promotions',
  'promotion_products',
  'promotion_categories',
]);

const PATH_RE = /^\/api\/sb\/rest\/v1\/([a-z_]+)\/?$/;
const FORWARD_HEADERS = ['accept', 'range', 'prefer', 'accept-profile'];
const CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=300';

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, apikey, accept, range, prefer, accept-profile, content-type, x-client-info',
  'Access-Control-Expose-Headers': 'content-range, content-profile',
};

const forbidden = () =>
  new Response(JSON.stringify({ message: 'Forbidden' }), {
    status: 403,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

export const onRequest = async (context: PagesContext): Promise<Response> => {
  const { request } = context;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'GET') return forbidden();

  const url = new URL(request.url);
  const match = url.pathname.match(PATH_RE);
  if (!match || !ALLOWED_TABLES.has(match[1])) return forbidden();

  // Chave do cache: URL completa + headers que mudam a resposta.
  const varyKey = FORWARD_HEADERS.map((h) => `${h}=${request.headers.get(h) ?? ''}`).join('&');
  const cacheUrl = new URL(url.toString());
  cacheUrl.searchParams.set('__v', varyKey);
  const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });
  const cache = (caches as unknown as { default: Cache }).default;

  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const headers = new Headers({ apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` });
  for (const h of FORWARD_HEADERS) {
    const v = request.headers.get(h);
    if (v) headers.set(h, v);
  }

  const upstream = await fetch(`${SUPABASE_URL}/rest/v1/${match[1]}${url.search}`, { headers });
  const response = new Response(upstream.body, upstream);
  for (const [k, v] of Object.entries(CORS)) response.headers.set(k, v);

  if (upstream.status === 200 || upstream.status === 206) {
    response.headers.set('Cache-Control', CACHE_CONTROL);
    response.headers.delete('Set-Cookie');
    context.waitUntil(cache.put(cacheKey, response.clone()));
  } else {
    response.headers.set('Cache-Control', 'no-store');
  }
  return response;
};
