// Cloudflare Pages Function: /feed.xml no domínio da loja (Google Merchant Center).
import { customHost, merchantFeed, slugByDomain } from './_lib/seo';

interface PagesContext {
  request: Request;
  next: () => Promise<Response>;
}

export const onRequestGet = async (context: PagesContext): Promise<Response> => {
  const host = customHost(context.request);
  if (!host) return context.next();
  const slug = await slugByDomain(host);
  if (!slug) return context.next();
  return (await merchantFeed(slug, host)) ?? context.next();
};
