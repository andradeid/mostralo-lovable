// Cloudflare Pages Function: /robots.txt
// Domínio da loja: aponta para o sitemap dela e para o sitemap da loja no mostralo.com.br
// (assim o Search Console do Mostralo aceita as páginas dos domínios próprios).
import { MAIN_ORIGIN, customHost, robots, slugByDomain } from './_lib/seo';

interface PagesContext {
  request: Request;
}

export const onRequestGet = async (context: PagesContext): Promise<Response> => {
  const host = customHost(context.request);
  if (host) {
    const slug = await slugByDomain(host);
    if (slug) return robots([`https://${host}/sitemap.xml`, `${MAIN_ORIGIN}/sitemaps/${encodeURIComponent(slug)}.xml`]);
  }
  return robots([`${MAIN_ORIGIN}/sitemap.xml`]);
};
