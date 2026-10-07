// Prévia de link (OG) para robôs em domínio personalizado da loja.
// Visitantes humanos e domínios internos seguem normalmente para o app.

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
  const ua = context.request.headers.get('User-Agent') ?? '';
  if (!CRAWLER_RE.test(ua)) return context.next();

  const url = new URL(context.request.url);
  const host = url.hostname.toLowerCase();
  if (isInternal(host)) return context.next();

  const product = url.pathname.match(PRODUCT_RE);
  if (url.pathname !== '/' && !product && !BOOKING_RE.test(url.pathname)) return context.next();

  const slug = await slugByDomain(host);
  if (!slug) return context.next();

  const target = new URL(OG_PREVIEW_URL);
  target.searchParams.set('slug', slug);
  if (product) target.searchParams.set('product', decodeURIComponent(product[1]));
  target.searchParams.set('domain', url.origin);
  return Response.redirect(target.toString(), 302);
}
