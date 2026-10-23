// Cloudflare Pages Function: /agendar/*
// Domínio da loja: SEO da loja (via handleCustomDomainOg).
// mostralo.com.br/agendar/:slug: página de agendamento sai com nome, descrição e logo da loja.
import { handleCustomDomainOg, type PagesContext } from '../_lib/customDomainOg';
import { MAIN_ORIGIN, customHost, withStorePage } from '../_lib/seo';

export const onRequest = async (context: PagesContext): Promise<Response> => {
  if (customHost(context.request)) return handleCustomDomainOg(context);
  const m = new URL(context.request.url).pathname.match(/^\/agendar\/([^/]+)\/?$/);
  if (!m) return context.next();
  const slug = decodeURIComponent(m[1]);
  return withStorePage(() => context.next(), slug, undefined, `${MAIN_ORIGIN}/agendar/${encodeURIComponent(slug)}`);
};
