import hub from "@/content/conteudos.json";
import { ARTIGOS } from "@/lib/artigos";

export interface ContentItem { path: string; category: string; title: string; excerpt: string; image?: string; date?: string; keywords?: string[]; readMinutes?: number; audio?: boolean }

/**
 * Lista única das páginas de conteúdo do site (central /conteudos).
 * Os artigos (/guia/:slug) entram sozinhos; outras páginas do site entram por src/content/conteudos.json (items).
 * O mesmo cálculo é repetido em scripts/prerender-blog.mjs para a versão estática.
 */
export function allContent(): ContentItem[] {
  const guias: ContentItem[] = ARTIGOS.map((a) => ({ path: `/guia/${a.slug}`, category: a.category ?? "Guias", title: a.h1, excerpt: a.excerpt, image: a.image, date: a.updated ?? a.date, keywords: a.keywords, readMinutes: a.readMinutes, audio: !!a.audio }));
  const items = [...guias, ...(hub.items as ContentItem[])];
  // Mais recentes primeiro; sem data vão para o fim, na ordem do arquivo
  return items
    .map((it, i) => ({ it, i }))
    .sort((a, b) => (b.it.date ?? "").localeCompare(a.it.date ?? "") || a.i - b.i)
    .map((x) => x.it);
}

export const HUB = hub;

/** Texto sem acento e em minúsculas, para a busca achar "otica" em "óptica" e "orcamento" em "orçamento". */
export const normalizeSearch = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/p(?=t)/g, "");

/** Busca nos conteúdos: todas as palavras digitadas precisam aparecer no título, resumo, categoria ou palavras-chave. */
export function searchContent(items: ContentItem[], query: string): ContentItem[] {
  const words = normalizeSearch(query).split(/\s+/).filter((w) => w.length > 1);
  if (!words.length) return items;
  return items.filter((it) => {
    const hay = normalizeSearch([it.title, it.excerpt, it.category, ...(it.keywords ?? [])].join(" "));
    return words.every((w) => hay.includes(w));
  });
}
