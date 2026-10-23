// Cloudflare Pages Function: /sitemap.xml
// Domínio da loja: sitemap da loja (página inicial + produtos).
// Mostralo: índice com as páginas do site e um sitemap por loja (/sitemaps/:slug.xml).
import { customHost, mainSitemapIndex, slugByDomain, storeSitemap } from './_lib/seo';

interface PagesContext {
  request: Request;
}

export const onRequestGet = async (context: PagesContext): Promise<Response> => {
  const host = customHost(context.request);
  if (host) {
    const slug = await slugByDomain(host);
    const r = slug ? await storeSitemap(slug, host) : null;
    if (r) return r;
  }
  return mainSitemapIndex();
};
