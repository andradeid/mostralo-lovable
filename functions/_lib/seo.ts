// SEO das lojas (Cloudflare Pages Functions).
// O app é uma SPA: sem isto, o Google e as prévias de link recebem o index.html genérico
// do Mostralo (título "Mostralo 360°" e canonical apontando para a home) em todas as lojas.
// Aqui a página da loja e a do produto já saem do servidor com título, descrição, foto,
// preço, canonical certo e dados estruturados (schema.org), e cada loja ganha sitemap,
// feed do Google Merchant e robots.txt próprios.

export const SUPABASE_URL = 'https://noshwvwpjtnvndokbfjx.supabase.co';
export const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA';
export const MAIN_ORIGIN = 'https://mostralo.com.br';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const HTMLRewriter: any;

export interface SeoStore {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  instagram: string | null;
  facebook: string | null;
}

export interface SeoProduct {
  name: string;
  slug: string | null;
  description: string | null;
  price: number;
  offer_price: number | null;
  is_on_offer: boolean | null;
  image_url: string | null;
  image_gallery: string[] | null;
  is_available: boolean | null;
  updated_at: string | null;
}

const H = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
const EDGE_CACHE = { cf: { cacheTtl: 120, cacheEverything: true } } as RequestInit;

async function getJson<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}${path}`, { ...EDGE_CACHE, ...init, headers: { ...H, ...(init.headers || {}) } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function rpc<T>(fn: string, body: unknown): Promise<T | null> {
  return getJson<T>(`/rest/v1/rpc/${fn}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

const STORE_COLS =
  'id,name,slug,description,logo_url,cover_url,phone,whatsapp,address,city,state,latitude,longitude,instagram,facebook';

/** null = loja não existe/indisponível; undefined = não deu para consultar agora. */
export async function loadStore(slug: string): Promise<SeoStore | null | undefined> {
  const rows = await getJson<SeoStore[]>(
    `/rest/v1/public_stores?select=${STORE_COLS}&slug=eq.${encodeURIComponent(slug)}&limit=1`,
  );
  if (rows === null) return undefined;
  return rows[0] ?? null;
}

/** Loja inexistente ou indisponível: a SPA continua abrindo (mostra o aviso), mas o Google recebe 404. */
function notFound(res: Response): Response {
  const headers = new Headers(res.headers);
  headers.set('X-Robots-Tag', 'noindex');
  return new Response(res.body, { status: 404, headers });
}

export async function slugByDomain(host: string): Promise<string | null> {
  const r = await rpc<string>('get_store_slug_by_domain', { p_domain: host });
  return typeof r === 'string' && r ? r : null;
}

/** Domínio próprio verificado e se a loja está fora do Google (seo_hidden: lojas de teste). */
export async function storeSeo(slug: string): Promise<{ domain: string | null; hidden: boolean }> {
  const r = await rpc<{ domain: string | null; hidden: boolean }[]>('get_store_seo', { p_slug: slug });
  const row = r?.[0];
  return { domain: row?.domain ? publicHost(row.domain) : null, hidden: !!row?.hidden };
}

export async function domainBySlug(slug: string): Promise<string | null> {
  return (await storeSeo(slug)).domain;
}

/** Loja de teste: a página abre normalmente, mas o Google é avisado para não indexar. */
function noindex(res: Response): Response {
  const headers = new Headers(res.headers);
  headers.set('X-Robots-Tag', 'noindex');
  return new Response(res.body, { status: res.status, headers });
}

export async function listStores(): Promise<{ slug: string; domain: string | null }[]> {
  const r = await rpc<{ slug: string; domain: string | null }[]>('list_public_store_domains', {});
  return (r ?? []).map((s) => ({ slug: s.slug, domain: s.domain ? publicHost(s.domain) : null }));
}

const PRODUCT_COLS =
  'name,slug,description,price,offer_price,is_on_offer,image_url,image_gallery,is_available,updated_at';

export async function loadProducts(storeId: string): Promise<SeoProduct[]> {
  const rows = await getJson<SeoProduct[]>(
    `/rest/v1/products?select=${PRODUCT_COLS}&store_id=eq.${storeId}&is_available=eq.true&order=display_order.asc&limit=2000`,
  );
  return rows ?? [];
}

export async function loadProduct(storeId: string, productSlug: string): Promise<SeoProduct | null> {
  const rows = await getJson<SeoProduct[]>(
    `/rest/v1/products?select=${PRODUCT_COLS}&store_id=eq.${storeId}&slug=eq.${encodeURIComponent(productSlug)}&limit=1`,
  );
  return rows?.[0] ?? null;
}

/** Links antigos "?produto=<id>" (feed antigo): descobre o slug do produto para redirecionar. */
export async function productSlugById(productId: string): Promise<string | null> {
  if (!/^[0-9a-f-]{36}$/i.test(productId)) return null;
  const rows = await getJson<{ slug: string | null }[]>(
    `/rest/v1/products?select=slug&id=eq.${productId}&limit=1`,
  );
  return rows?.[0]?.slug ?? null;
}

// ---------- endereços ----------

/** Host público exatamente como cadastrado e verificado (o verify-domain já grava "www." nos novos). */
export function publicHost(d: string): string {
  return d.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0].replace(/\.$/, '');
}

export function storeHome(slug: string, domain: string | null): string {
  return domain ? `https://${domain}/` : `${MAIN_ORIGIN}/loja/${slug}`;
}

export function productUrl(storeSlug: string, domain: string | null, productSlug: string): string {
  return domain
    ? `https://${domain}/produto/${productSlug}`
    : `${MAIN_ORIGIN}/loja/${storeSlug}/produto/${productSlug}`;
}

// ---------- utilidades ----------

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const xml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const clean = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();
const money = (n: number) => Number(n).toFixed(2);
/** JSON dentro de <script>: sem "</" para não fechar a tag. */
const jsonLd = (o: unknown) => JSON.stringify(o).replace(/</g, '\\u003c');

function effectivePrice(p: SeoProduct): number {
  return p.is_on_offer && p.offer_price && p.offer_price > 0 ? Number(p.offer_price) : Number(p.price);
}

function images(p: SeoProduct): string[] {
  const all = [p.image_url, ...(p.image_gallery ?? [])].filter((u): u is string => !!u && /^https?:\/\//.test(u));
  return [...new Set(all)];
}

function storeLd(store: SeoStore, url: string) {
  const sameAs = [store.instagram, store.facebook]
    .filter((u): u is string => !!u && u.trim() !== '')
    .map((u) => (/^https?:\/\//.test(u) ? u : `https://instagram.com/${u.replace(/^@/, '')}`));
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: store.name,
    url,
    description: clean(store.description) || undefined,
    image: store.cover_url || store.logo_url || undefined,
    logo: store.logo_url || undefined,
    telephone: store.whatsapp || store.phone || undefined,
    address: store.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: store.address,
          addressLocality: store.city || undefined,
          addressRegion: store.state || undefined,
          addressCountry: 'BR',
        }
      : undefined,
    geo:
      store.latitude && store.longitude
        ? { '@type': 'GeoCoordinates', latitude: store.latitude, longitude: store.longitude }
        : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  };
}

function productLd(store: SeoStore, p: SeoProduct, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: clean(p.description) || p.name,
    image: images(p),
    sku: p.slug || undefined,
    brand: { '@type': 'Brand', name: store.name },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'BRL',
      price: money(effectivePrice(p)),
      availability: p.is_available === false ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: store.name },
    },
  };
}

// ---------- reescrita do index.html ----------

interface PageMeta {
  title: string;
  description: string;
  image: string | null;
  url: string;
  type: 'website' | 'product';
  siteName: string;
  ld: unknown[];
}

function rewrite(res: Response, m: PageMeta, tag: string): Response {
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('text/html') || typeof HTMLRewriter === 'undefined') return res;
  try {
    type El = {
      setAttribute: (k: string, v: string) => void;
      setInnerContent: (s: string) => void;
      remove: () => void;
      append: (s: string, o: { html: boolean }) => void;
    };
    const set = (v: string) => ({ element: (el: El) => el.setAttribute('content', v) });
    const drop = { element: (el: El) => el.remove() };
    let rw = new HTMLRewriter()
      .on('title', { element: (el: El) => el.setInnerContent(m.title) })
      .on('meta[name="description"]', set(m.description))
      .on('meta[name="keywords"]', drop)
      .on('link[rel="canonical"]', { element: (el: El) => el.setAttribute('href', m.url) })
      .on('meta[property="og:type"]', set(m.type))
      .on('meta[property="og:title"]', set(m.title))
      .on('meta[property="og:description"]', set(m.description))
      .on('meta[property="og:url"]', set(m.url))
      .on('meta[property="og:site_name"]', set(m.siteName))
      .on('meta[name="twitter:title"]', set(m.title))
      .on('meta[name="twitter:description"]', set(m.description))
      .on('meta[name="twitter:url"]', set(m.url))
      // dados estruturados do Mostralo (empresa/software) não valem para a página da loja
      .on('script[type="application/ld+json"]', drop)
      .on('head', {
        element: (el: El) =>
          el.append(m.ld.map((o) => `<script type="application/ld+json">${jsonLd(o)}</script>`).join(''), {
            html: true,
          }),
      });
    if (m.image) {
      rw = rw
        .on('meta[property="og:image"]', set(m.image))
        .on('meta[name="twitter:image"]', set(m.image))
        // as dimensões do index.html são da imagem do Mostralo (1200x630)
        .on('meta[property="og:image:width"]', drop)
        .on('meta[property="og:image:height"]', drop);
    }
    const out = rw.transform(res);
    const headers = new Headers(out.headers);
    headers.set('X-Store-Meta', esc(tag));
    return new Response(out.body, { status: out.status, headers });
  } catch {
    return res; // nunca derruba a página por causa do SEO
  }
}

/** Página inicial (ou /agendar) da loja. */
export async function withStorePage(
  next: () => Promise<Response>,
  slug: string,
  knownDomain?: string | null,
  urlOverride?: string,
): Promise<Response> {
  const [res, store, seo] = await Promise.all([next(), loadStore(slug), storeSeo(slug)]);
  if (store === null) return notFound(res);
  if (!store) return res;
  if (seo.hidden) return noindex(res);
  const domain = knownDomain !== undefined ? knownDomain : seo.domain;
  const url = urlOverride ?? storeHome(store.slug, domain);
  const local = [store.city, store.state].filter(Boolean).join(' - ');
  const description = (
    clean(store.description) || `Peça online na ${store.name}${local ? ` (${local})` : ''}.`
  ).slice(0, 200);
  return rewrite(
    res,
    {
      title: local ? `${store.name} | ${local}` : store.name,
      description,
      image: store.logo_url || store.cover_url,
      url,
      type: 'website',
      siteName: store.name,
      ld: [storeLd(store, url)],
    },
    store.slug,
  );
}

/** Página de um produto da loja. */
export async function withProductPage(
  next: () => Promise<Response>,
  slug: string,
  productSlug: string,
  knownDomain?: string | null,
): Promise<Response> {
  const [res, store, seo] = await Promise.all([next(), loadStore(slug), storeSeo(slug)]);
  if (store === null) return notFound(res);
  if (!store) return res;
  if (seo.hidden) return noindex(res);
  const domain = knownDomain !== undefined ? knownDomain : seo.domain;
  const p = await loadProduct(store.id, productSlug);
  if (!p) return withStorePageFromResponse(res, store, domain);
  const url = productUrl(store.slug, domain, productSlug);
  const price = effectivePrice(p);
  const priceTxt = price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const description = (clean(p.description) || `${p.name} na ${store.name}.`).slice(0, 200);
  const home = storeHome(store.slug, domain);
  return rewrite(
    res,
    {
      title: `${p.name} - ${priceTxt} | ${store.name}`,
      description,
      image: images(p)[0] || store.logo_url,
      url,
      type: 'product',
      siteName: store.name,
      ld: [
        productLd(store, p, url),
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: store.name, item: home },
            { '@type': 'ListItem', position: 2, name: p.name, item: url },
          ],
        },
      ],
    },
    `${store.slug}/${productSlug}`,
  );
}

function withStorePageFromResponse(res: Response, store: SeoStore, domain: string | null): Response {
  const url = storeHome(store.slug, domain);
  return rewrite(
    res,
    {
      title: store.name,
      description: (clean(store.description) || `Peça online na ${store.name}.`).slice(0, 200),
      image: store.logo_url || store.cover_url,
      url,
      type: 'website',
      siteName: store.name,
      ld: [storeLd(store, url)],
    },
    store.slug,
  );
}

// ---------- sitemap, feed e robots ----------

const XML_HEADERS = { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=1800' };

/** Sitemap de uma loja: página inicial + todos os produtos disponíveis. */
export async function storeSitemap(slug: string, knownDomain?: string | null): Promise<Response | null> {
  const [store, seo] = await Promise.all([loadStore(slug), storeSeo(slug)]);
  if (!store || seo.hidden) return null;
  const domain = knownDomain !== undefined ? knownDomain : seo.domain;
  const products = await loadProducts(store.id);
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    `<url><loc>${xml(storeHome(store.slug, domain))}</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>${today}</lastmod></url>`,
    ...products
      .filter((p) => p.slug)
      .map((p) => {
        const img = images(p)[0];
        return `<url><loc>${xml(productUrl(store.slug, domain, p.slug!))}</loc>${
          p.updated_at ? `<lastmod>${p.updated_at.slice(0, 10)}</lastmod>` : ''
        }<changefreq>weekly</changefreq><priority>0.8</priority>${
          img ? `<image:image><image:loc>${xml(img)}</image:loc><image:title>${xml(p.name)}</image:title></image:image>` : ''
        }</url>`;
      }),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`;
  return new Response(body, { status: 200, headers: XML_HEADERS });
}

/** Índice de sitemaps do Mostralo: páginas do site + um sitemap por loja. */
export async function mainSitemapIndex(): Promise<Response> {
  const stores = await listStores();
  const today = new Date().toISOString().slice(0, 10);
  const items = [
    `<sitemap><loc>${MAIN_ORIGIN}/sitemaps/site.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    // Blog: arquivo estático gerado no build por scripts/prerender-blog.mjs
    `<sitemap><loc>${MAIN_ORIGIN}/blog-sitemap.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    ...stores.map(
      (s) => `<sitemap><loc>${MAIN_ORIGIN}/sitemaps/${encodeURIComponent(s.slug)}.xml</loc><lastmod>${today}</lastmod></sitemap>`,
    ),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items.join('\n')}
</sitemapindex>`;
  return new Response(body, { status: 200, headers: XML_HEADERS });
}

/** Páginas institucionais do Mostralo. */
export function siteSitemap(): Response {
  const today = new Date().toISOString().slice(0, 10);
  const pages: [string, string, string][] = [
    ['/', '1.0', 'weekly'],
    ['/conteudos', '0.8', 'weekly'],
    ['/seja-vendedor', '0.5', 'monthly'],
    ['/termos-de-uso', '0.3', 'monthly'],
    ['/privacidade', '0.3', 'monthly'],
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(([p, pr, cf]) => `<url><loc>${MAIN_ORIGIN}${p}</loc><lastmod>${today}</lastmod><changefreq>${cf}</changefreq><priority>${pr}</priority></url>`)
  .join('\n')}
</urlset>`;
  return new Response(body, { status: 200, headers: XML_HEADERS });
}

/** Feed de produtos no formato do Google Merchant Center (RSS 2.0). */
export async function merchantFeed(slug: string, knownDomain?: string | null): Promise<Response | null> {
  const store = await loadStore(slug);
  if (!store) return null;
  const domain = knownDomain !== undefined ? knownDomain : await domainBySlug(slug);
  const products = await loadProducts(store.id);
  const items = products
    .filter((p) => p.slug && images(p).length > 0 && Number(p.price) > 0)
    .map((p) => {
      const imgs = images(p);
      const onSale = !!(p.is_on_offer && p.offer_price && p.offer_price > 0 && p.offer_price < p.price);
      return `<item>
<g:id>${xml(`${store.slug}-${p.slug}`)}</g:id>
<title>${xml(p.name.slice(0, 150))}</title>
<description>${xml((clean(p.description) || p.name).slice(0, 5000))}</description>
<link>${xml(productUrl(store.slug, domain, p.slug!))}</link>
<g:image_link>${xml(imgs[0])}</g:image_link>
${imgs.slice(1, 10).map((u) => `<g:additional_image_link>${xml(u)}</g:additional_image_link>`).join('\n')}
<g:availability>${p.is_available === false ? 'out_of_stock' : 'in_stock'}</g:availability>
<g:price>${money(p.price)} BRL</g:price>
${onSale ? `<g:sale_price>${money(p.offer_price!)} BRL</g:sale_price>` : ''}
<g:condition>new</g:condition>
<g:brand>${xml(store.name)}</g:brand>
<g:identifier_exists>no</g:identifier_exists>
</item>`;
    });
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${xml(store.name)}</title>
<link>${xml(storeHome(store.slug, domain))}</link>
<description>${xml(clean(store.description) || `Produtos da ${store.name}`)}</description>
${items.join('\n')}
</channel>
</rss>`;
  return new Response(body, { status: 200, headers: XML_HEADERS });
}

/** robots.txt: domínio da loja aponta para o próprio sitemap e para o do Mostralo (envio entre sites). */
export function robots(lines: string[]): Response {
  const body = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /auth
Disallow: /api/

${lines.map((l) => `Sitemap: ${l}`).join('\n')}
`;
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}

// ---------- domínio interno x domínio da loja ----------

// Mesma lista de src/lib/storePath.ts
const INTERNAL_DOMAINS = [
  'localhost', '127.0.0.1', 'mostralo.me', 'mostralo.app', 'mostralo.com.br',
  'lovable.app', 'pages.dev', 'lovable.dev', 'lovableproject.com', 'gptengineer.run',
  'webcontainer.io', 'stackblitz.io', 'codesandbox.io',
];

export function isInternal(host: string): boolean {
  return INTERNAL_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
}

/** Host do domínio da loja (Cloudflare for SaaS pode entregar a URL com o host de origem). */
export function customHost(request: Request): string | null {
  const url = new URL(request.url);
  const h = request.headers;
  const candidates = [h.get('x-forwarded-host'), h.get('host'), url.hostname]
    .filter(Boolean)
    .map((v) => String(v).split(',')[0].trim().toLowerCase().split(':')[0]);
  return candidates.find((c) => !isInternal(c)) ?? null;
}
