import marcos from "@/content/autores/marcos-andrade.json";

/** Autores do blog (assinatura dos artigos e página /autor/:slug). Sem `author` no artigo, vale o padrão. */
export interface Autor { slug: string; name: string; role: string; image: string; bio: string; about: string[]; sameAs: string[] }
export const AUTORES: Autor[] = [marcos];
export const AUTOR_PADRAO = "marcos-andrade";
export const autorDe = (slug?: string): Autor => AUTORES.find((a) => a.slug === (slug ?? AUTOR_PADRAO)) ?? AUTORES[0];
export const autorPath = (a: Autor) => `/autor/${a.slug}`;

/** Person do JSON-LD (artigos e página do autor). */
export const autorJsonLd = (a: Autor, site: string) => ({
  "@type": "Person", name: a.name, jobTitle: a.role, url: `${site}${autorPath(a)}`, image: `${site}${a.image}`, sameAs: a.sameAs,
});
