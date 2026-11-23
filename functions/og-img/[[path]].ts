// Cloudflare Pages Function: /og-img/*
// Imagem da prévia de link (og:image) das lojas, servida pelo mostralo.com.br.
// Só repassa imagens do bucket público store-images, com cache de borda.

import { SUPABASE_URL } from '../_lib/seo';

interface PagesContext {
  request: Request;
}

const PATH_RE = /^\/og-img\/(stores\/[A-Za-z0-9._\-/]+\.(?:jpe?g|png|webp))$/i;

export async function onRequest({ request }: PagesContext): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
  const url = new URL(request.url);
  const m = url.pathname.match(PATH_RE);
  if (!m || m[1].includes('..')) return new Response('Not found', { status: 404 });

  const upstream = await fetch(`${SUPABASE_URL}/storage/v1/object/public/store-images/${m[1]}${url.search}`, {
    cf: { cacheEverything: true, cacheTtl: 86400 },
  } as RequestInit);
  const type = upstream.headers.get('content-type') ?? '';
  if (!upstream.ok || !type.startsWith('image/')) return new Response('Not found', { status: 404 });

  const headers = new Headers({
    'Content-Type': type,
    'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    'Access-Control-Allow-Origin': '*',
  });
  const len = upstream.headers.get('content-length');
  if (len) headers.set('Content-Length', len);
  return new Response(request.method === 'HEAD' ? null : upstream.body, { status: 200, headers });
}
