// Prévia de link (OG) para robôs em domínio personalizado da loja.
// Visitantes humanos e domínios internos seguem normalmente para o app.

import { withStoreMeta } from './storeMeta';

export interface PagesContext {
  request: Request;
  next: () => Promise<Response>;
}

const SUPABASE_URL = 'https://noshwvwpjtnvndokbfjx.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA';
const OG_PREVIEW_URL = `${SUPABASE_URL}/functions/v1/store-og-preview`;
const CRAWLER_RE = /(WhatsApp|facebookexternalhit|Twitterbot|TelegramBot|LinkedInBot|Slackbot|Discordbot)/i;
const PRODUCT_RE = /^\/produto\/([^/]+)\/?$/;
const BOOKING_RE = /^\/agendar(\/.*)?$/;

// Mesma lista de src/lib/storePath.ts
const INTERNAL_DOMAINS = [
  'localhost', '127.0.0.1', 'mostralo.me', 'mostralo.app', 'mostralo.com.br',
  'lovable.app', 'pages.dev', 'lovable.dev', 'lovableproject.com', 'gptengineer.run',
  'webcontainer.io', 'stackblitz.io', 'codesandbox.io',
];

function isInternal(host: string): boolean {
  return INTERNAL_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
}

async function slugByDomain(host: string): Promise<string | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_store_slug_by_domain`, {
      method: 'POST',
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_domain: host }),
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    return typeof data === 'string' && data ? data : null;
  } catch {
    return null;
  }
}

export async function handleCustomDomainOg(context: PagesContext): Promise<Response> {
  const url = new URL(context.request.url);
  // Em domínio próprio (Cloudflare for SaaS) a URL pode chegar com o host de origem
  // (lojas.mostralo.com.br / *.pages.dev); o domínio da loja vem nos cabeçalhos.
  const h = context.request.headers;
  const candidates = [h.get('x-forwarded-host'), h.get('host'), url.hostname]
    .filter(Boolean)
    .map((v) => String(v).split(',')[0].trim().toLowerCase().split(':')[0]);
  const host = candidates.find((c) => !isInternal(c));
  if (!host) {
    const res = await context.next();
    if (url.pathname !== '/') return res;
    const dbg = new Response(res.body, res);
    dbg.headers.set('X-OG-Hosts', candidates.join('|'));
    return dbg;
  }

  const product = url.pathname.match(PRODUCT_RE);
  const isHome = url.pathname === '/' || BOOKING_RE.test(url.pathname);
  if (!isHome && !product) return context.next();

  const slug = await slugByDomain(host);
  if (!slug) return context.next();

  // Produto: robôs conhecidos seguem para a prévia do produto (foto e preço).
  if (product) {
    const ua = context.request.headers.get('User-Agent') ?? '';
    if (!CRAWLER_RE.test(ua)) return context.next();
    const target = new URL(OG_PREVIEW_URL);
    target.searchParams.set('slug', slug);
    target.searchParams.set('product', decodeURIComponent(product[1]));
    target.searchParams.set('domain', `https://${host}`);
    return Response.redirect(target.toString(), 302);
  }

  // Página da loja: a própria página já sai com nome, descrição e logo da loja
  // (funciona para qualquer robô de prévia, mesmo os que não se identificam).
  return withStoreMeta(() => context.next(), slug, `https://${host}${url.pathname}`);
}
