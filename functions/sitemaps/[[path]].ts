// Cloudflare Pages Function: /sitemaps/site.xml e /sitemaps/:slug.xml
import { siteSitemap, storeSitemap } from '../_lib/seo';

interface PagesContext {
  request: Request;
  next: () => Promise<Response>;
}

export const onRequestGet = async (context: PagesContext): Promise<Response> => {
  const m = new URL(context.request.url).pathname.match(/^\/sitemaps\/([^/]+)\.xml$/);
  if (!m) return context.next();
  const name = decodeURIComponent(m[1]);
  if (name === 'site') return siteSitemap();
  return (await storeSitemap(name)) ?? new Response('Not found', { status: 404 });
};
