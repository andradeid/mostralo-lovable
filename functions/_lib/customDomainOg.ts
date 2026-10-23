// Páginas no domínio próprio da loja ("/", "/agendar", "/produto/:slug").
// Saem do servidor já com título, descrição, foto, canonical e dados estruturados da loja
// ou do produto — para o Google e para qualquer prévia de link (WhatsApp, Facebook…).
import { customHost, slugByDomain, withProductPage, withStorePage } from './seo';

export interface PagesContext {
  request: Request;
  next: () => Promise<Response>;
}

const PRODUCT_RE = /^\/produto\/([^/]+)\/?$/;
const BOOKING_RE = /^\/agendar(\/.*)?$/;

export async function handleCustomDomainOg(context: PagesContext): Promise<Response> {
  const host = customHost(context.request);
  if (!host) return context.next();

  const url = new URL(context.request.url);
  const product = url.pathname.match(PRODUCT_RE);
  const isHome = url.pathname === '/' || BOOKING_RE.test(url.pathname);
  if (!isHome && !product) return context.next();

  const slug = await slugByDomain(host);
  if (!slug) return context.next();

  const next = () => context.next();
  if (product) return withProductPage(next, slug, decodeURIComponent(product[1]), host);
  return withStorePage(next, slug, host);
}
