// Cloudflare Pages Function: /loja/*
// Crawlers de redes sociais recebem 302 para a edge function de OG preview.
// Demais requisições seguem para o app (SPA).

import { withStoreMeta } from '../_lib/storeMeta';

interface PagesContext {
  request: Request;
  next: () => Promise<Response>;
}

const OG_PREVIEW_URL = 'https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/store-og-preview';
const CRAWLER_RE = /(WhatsApp|facebookexternalhit|Twitterbot|TelegramBot|LinkedInBot|Slackbot|Discordbot)/i;
const PRODUCT_RE = /^\/loja\/([^/]+)\/produto\/([^/]+)\/?$/;
const STORE_RE = /^\/loja\/([^/]+)\/?$/;

export const onRequest = async (context: PagesContext): Promise<Response> => {
  const ua = context.request.headers.get('User-Agent') ?? '';
  const url = new URL(context.request.url);
  const product = url.pathname.match(PRODUCT_RE);
  const store = product ? null : url.pathname.match(STORE_RE);
  if (!product && !store) return context.next();

  // Página da loja: meta tags da loja para qualquer visitante (prévia de link sempre certa).
  if (store) return withStoreMeta(() => context.next(), decodeURIComponent(store[1]), `${url.origin}${url.pathname}`);

  if (!CRAWLER_RE.test(ua)) return context.next();

  const target = new URL(OG_PREVIEW_URL);
  target.searchParams.set('slug', decodeURIComponent((product ?? store)![1]));
  if (product) target.searchParams.set('product', decodeURIComponent(product[2]));
  target.searchParams.set('domain', url.origin);

  return Response.redirect(target.toString(), 302);
};
