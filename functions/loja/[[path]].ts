// Cloudflare Pages Function: /loja/*
// Página da loja e do produto saem do servidor com SEO da loja (título, descrição, foto,
// canonical, dados estruturados); /loja/:slug/feed.xml e /loja/:slug/sitemap.xml são gerados aqui.
import { merchantFeed, storeSitemap, withProductPage, withStorePage } from '../_lib/seo';

interface PagesContext {
  request: Request;
  next: () => Promise<Response>;
}

const STORE_RE = /^\/loja\/([^/]+)\/?$/;
const PRODUCT_RE = /^\/loja\/([^/]+)\/produto\/([^/]+)\/?$/;
const FEED_RE = /^\/loja\/([^/]+)\/feed\.xml$/;
const SITEMAP_RE = /^\/loja\/([^/]+)\/sitemap\.xml$/;

export const onRequest = async (context: PagesContext): Promise<Response> => {
  const url = new URL(context.request.url);
  const next = () => context.next();
  const p = url.pathname;

  let m = p.match(FEED_RE);
  if (m) return (await merchantFeed(decodeURIComponent(m[1]))) ?? next();
  m = p.match(SITEMAP_RE);
  if (m) return (await storeSitemap(decodeURIComponent(m[1]))) ?? next();
  m = p.match(PRODUCT_RE);
  if (m) return withProductPage(next, decodeURIComponent(m[1]), decodeURIComponent(m[2]));
  m = p.match(STORE_RE);
  if (m) return withStorePage(next, decodeURIComponent(m[1]));
  return next();
};
