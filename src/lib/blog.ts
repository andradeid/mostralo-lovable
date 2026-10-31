import type { ContentItem } from "./conteudos";

/**
 * Blog (/conteudos): páginas e categorias com endereço próprio, bons para o Google.
 *   /conteudos                     → página 1 (3 destaques + 9)
 *   /conteudos/pagina/2            → próximas 12
 *   /conteudos/categoria/<slug>    → só a categoria, 12 por página (/pagina/N também)
 * A mesma regra está em scripts/prerender-blog.mjs (versão estática) — mude os dois juntos.
 */
export const BLOG_BASE = "/conteudos";
export const PER_PAGE = 12;
export const FEATURED = 3;

export const categorySlug = (c: string) =>
  c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function categoryFromSlug(categories: string[], slug?: string): string | null {
  if (!slug) return null;
  return categories.find((c) => categorySlug(c) === slug) ?? null;
}

export function blogPath(category: string | null, page = 1): string {
  const base = category ? `${BLOG_BASE}/categoria/${categorySlug(category)}` : BLOG_BASE;
  return page > 1 ? `${base}/pagina/${page}` : base;
}

export interface BlogPage { featured: ContentItem[]; items: ContentItem[]; page: number; pages: number; total: number; from: number; to: number }

/** Monta uma página do blog. Na página 1 do blog geral, os 3 primeiros viram destaque e contam nos 12. */
export function paginate(list: ContentItem[], page: number, withFeatured: boolean): BlogPage {
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const p = Math.min(Math.max(1, page), pages);
  const slice = list.slice((p - 1) * PER_PAGE, p * PER_PAGE);
  const feat = withFeatured && p === 1 ? slice.slice(0, FEATURED) : [];
  return { featured: feat, items: slice.slice(feat.length), page: p, pages, total: list.length, from: list.length ? (p - 1) * PER_PAGE + 1 : 0, to: (p - 1) * PER_PAGE + slice.length };
}

/** Números que aparecem na paginação: 1 … 4 5 6 … 10. `null` = reticências. */
export function pageNumbers(page: number, pages: number): (number | null)[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | null)[] = [1];
  const lo = Math.max(2, page - 1), hi = Math.min(pages - 1, page + 1);
  if (lo > 2) out.push(null);
  for (let i = lo; i <= hi; i++) out.push(i);
  if (hi < pages - 1) out.push(null);
  out.push(pages);
  return out;
}

/** Todas as rotas de lista do blog (para meta tags e sitemap). */
export function allBlogPaths(list: ContentItem[], categories: string[]): { path: string; category: string | null; page: number }[] {
  const out: { path: string; category: string | null; page: number }[] = [];
  const add = (cat: string | null, n: number) => {
    const pages = Math.max(1, Math.ceil(n / PER_PAGE));
    for (let p = 1; p <= pages; p++) out.push({ path: blogPath(cat, p), category: cat, page: p });
  };
  add(null, list.length);
  for (const c of categories) {
    const n = list.filter((i) => i.category === c).length;
    if (n) add(c, n);
  }
  return out;
}
