// Troca as meta tags do index.html (título, descrição, og:*, twitter:*) pelas da loja.
// Vale para qualquer visitante — inclusive robôs de prévia de link (WhatsApp Web/Desktop,
// Facebook etc.) que nem sempre se identificam pelo User-Agent.

const SUPABASE_URL = 'https://noshwvwpjtnvndokbfjx.supabase.co';
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA';

interface StoreMeta {
  name: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const HTMLRewriter: any;

async function loadStore(slug: string): Promise<StoreMeta | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/public_stores?select=name,description,logo_url,cover_url&slug=eq.${encodeURIComponent(slug)}&limit=1`,
      {
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
        // cache curto na borda da Cloudflare
        cf: { cacheTtl: 120, cacheEverything: true },
      } as RequestInit,
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as StoreMeta[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Devolve o index.html com as meta tags da loja; se algo falhar, devolve a página original. */
export async function withStoreMeta(
  next: () => Promise<Response>,
  slug: string,
  pageUrl: string,
): Promise<Response> {
  const [res, store] = await Promise.all([next(), loadStore(slug)]);
  const ct = res.headers.get('content-type') ?? '';
  if (!store || !ct.includes('text/html') || typeof HTMLRewriter === 'undefined') return res;

  const title = store.name;
  const description = (store.description || `Peça online na ${store.name}.`).slice(0, 200);
  const image = store.logo_url || store.cover_url || '';

  const set = (attr: string) => ({
    element(el: { setAttribute: (k: string, v: string) => void; remove: () => void }) {
      el.setAttribute('content', attr);
    },
  });
  const drop = {
    element(el: { remove: () => void }) {
      el.remove();
    },
  };

  try {
  let rw = new HTMLRewriter()
    .on('title', {
      element(el: { setInnerContent: (s: string) => void }) {
        el.setInnerContent(title);
      },
    })
    .on('meta[name="description"]', set(description))
    .on('meta[property="og:title"]', set(title))
    .on('meta[property="og:description"]', set(description))
    .on('meta[property="og:url"]', set(pageUrl))
    .on('meta[property="og:site_name"]', set(store.name))
    .on('meta[name="twitter:title"]', set(title))
    .on('meta[name="twitter:description"]', set(description))
    .on('meta[name="twitter:url"]', set(pageUrl))
    .on('link[rel="canonical"]', {
      element(el: { setAttribute: (k: string, v: string) => void }) {
        el.setAttribute('href', pageUrl);
      },
    });
  if (image) {
    rw = rw
      .on('meta[property="og:image"]', set(image))
      .on('meta[name="twitter:image"]', set(image))
      // as dimensões do index.html são da imagem do Mostralo (1200x630)
      .on('meta[property="og:image:width"]', drop)
      .on('meta[property="og:image:height"]', drop);
  }
  const out = rw.transform(res);
  const headers = new Headers(out.headers);
  headers.set('X-Store-Meta', esc(slug));
  return new Response(out.body, { status: out.status, headers });
  } catch {
    return res; // nunca derruba a página por causa da prévia
  }
}
