import { useEffect } from "react";

const SITE = "https://mostralo.com.br";

export interface BlogMeta { title: string; description: string; path: string; image?: string; type?: string; jsonLd?: object[] }

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", content);
}

/**
 * Título, descrição, canonical, Open Graph e JSON-LD das páginas do blog no navegador.
 * O HTML pré-renderizado (scripts/prerender-blog.mjs) já sai com o mesmo conteúdo para os buscadores.
 */
export function useBlogMeta(meta: BlogMeta | null) {
  const key = meta ? `${meta.path}|${meta.title}` : "";
  useEffect(() => {
    if (!meta) return;
    const url = `${SITE}${meta.path}`;
    const image = meta.image ? (meta.image.startsWith("http") ? meta.image : `${SITE}${meta.image}`) : `${SITE}/og-image.png`;
    document.title = meta.title;
    setMeta("name", "description", meta.description);
    setMeta("property", "og:title", meta.title);
    setMeta("property", "og:description", meta.description);
    setMeta("property", "og:url", url);
    setMeta("property", "og:type", meta.type ?? "website");
    setMeta("property", "og:image", image);
    setMeta("name", "twitter:title", meta.title);
    setMeta("name", "twitter:description", meta.description);
    setMeta("name", "twitter:image", image);
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement("link"); link.rel = "canonical"; document.head.appendChild(link); }
    link.href = url;
    document.head.querySelectorAll("script[data-route-jsonld]").forEach((el) => el.remove());
    for (const data of meta.jsonLd ?? []) {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.dataset.routeJsonld = "true";
      s.textContent = JSON.stringify(data);
      document.head.appendChild(s);
    }
    return () => { document.head.querySelectorAll("script[data-route-jsonld]").forEach((el) => el.remove()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

export const blogPublisher = { "@type": "Organization", name: "Mostralo", url: `${SITE}/`, logo: { "@type": "ImageObject", url: `${SITE}/mostralo-icon.png` } };
export const BLOG_SITE = SITE;
