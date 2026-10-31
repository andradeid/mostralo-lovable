import type { ArticleAudio } from "@/components/blog/article/articleAudio";

/** Artigos do site (/guia/:slug). */
export interface Artigo {
  slug: string; title: string; h1: string; description: string; excerpt: string; date: string; updated?: string;
  readMinutes: number; keywords?: string[]; image: string; imageAlt?: string; audio?: ArticleAudio; intro: string[];
  sections: { h2: string; blocks: unknown[] }[];
  /** Bloco final de venda do Mostralo (seção "mostralo" da página e da narração). */
  produto: { h2: string; p: string[]; bullets: string[] };
  faq: [string, string][]; sources?: [string, string][]; related?: string[]; category?: string; author?: string;
}

// Um arquivo por artigo em src/content/artigos/*.json (entra sozinho no site, na central e no pré-render)
const mods = import.meta.glob("../content/artigos/*.json", { eager: true, import: "default" }) as Record<string, Artigo>;
export const ARTIGOS: Artigo[] = Object.values(mods).sort((a, b) => b.date.localeCompare(a.date));
