// Gera o HTML estático do Blog do Mostralo para buscadores e IAs (roda depois do `vite build`).
// Cada página (/conteudos, categorias, /guia/:slug, /autor/:slug) recebe title, description, canonical,
// Open Graph, JSON-LD e o texto completo dentro de #root. No navegador o React monta por cima normalmente.
// Também grava dist/blog-sitemap.xml (entra no índice /sitemap.xml) e acrescenta o blog ao dist/llms.txt.
// Mesmas regras de src/lib/blog.ts, src/lib/conteudos.ts e src/lib/autores.ts — mude junto.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const SITE = "https://mostralo.com.br";
const BRAND = "Mostralo";
const SIGNUP = "/signup";

if (!existsSync(join(dist, "index.html"))) {
  console.warn("[blog] dist/index.html não encontrado; pulando.");
  process.exit(0);
}
const base = readFileSync(join(dist, "index.html"), "utf8");
if (!base.includes('<div id="root"></div>')) {
  console.warn("[blog] dist/index.html já foi pré-renderizado (rode o vite build antes); pulando.");
  process.exit(0);
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rich = (t) => esc(t).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
const plain = (t) => String(t).replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
const table = (head, rows) =>
  `<table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
const setTag = (html, re, tag) => (re.test(html) ? html.replace(re, tag) : html.replace("</head>", `  ${tag}\n</head>`));

function page({ path, title, description, image, imageAlt, ogType = "website", jsonLd = [], body }) {
  const url = `${SITE}${path}`;
  let html = base;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  // JSON-LD da página inicial (organização, software) não vale para as páginas do blog
  html = html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
  html = setTag(html, /<meta name="description"[^>]*>/, `<meta name="description" content="${esc(description)}">`);
  html = html.replace(/\s*<meta name="keywords"[^>]*>/, "");
  html = setTag(html, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`);
  html = setTag(html, /<meta property="og:type"[^>]*>/, `<meta property="og:type" content="${ogType}" />`);
  html = setTag(html, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`);
  html = setTag(html, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(description)}" />`);
  html = setTag(html, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`);
  html = setTag(html, /<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${image}" />`);
  html = setTag(html, /<meta property="og:image:alt"[^>]*>/, `<meta property="og:image:alt" content="${esc(imageAlt ?? title)}" />`);
  html = setTag(html, /<meta name="twitter:url"[^>]*>/, `<meta name="twitter:url" content="${url}" />`);
  html = setTag(html, /<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(title)}" />`);
  html = setTag(html, /<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(description)}" />`);
  html = setTag(html, /<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${image}" />`);
  const ld = jsonLd
    .map((o) => `<script type="application/ld+json" data-route-jsonld="true">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`)
    .join("\n  ");
  html = html.replace(
    "</head>",
    `  ${ld}\n  <style>.seo-static{max-width:56rem;margin:0 auto;padding:4rem 1rem;font-family:Inter,system-ui,sans-serif;line-height:1.6;color:#3d3830;background:#f8f6f1}.seo-static h1,.seo-static h2,.seo-static h3{color:#221f1a}.seo-static a{color:#c2410c}.seo-static img{max-width:100%;height:auto}.seo-static table{width:100%;border-collapse:collapse;margin:1rem 0}.seo-static th,.seo-static td{border:1px solid #e2ddd3;padding:.5rem;text-align:left}html,body{background:#f8f6f1}</style>\n</head>`,
  );
  html = html.replace('<div id="root"></div>', `<div id="root"><main class="seo-static">${body}</main></div>`);
  // "<rota>.html": a Cloudflare Pages serve /rota sem redirecionar para /rota/
  const out = join(dist, `${path.replace(/^\//, "")}.html`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  return url;
}

// ---------- dados ----------
const artDir = join(root, "src/content/artigos");
const artigos = existsSync(artDir)
  ? readdirSync(artDir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join(artDir, f), "utf8"))).sort((a, b) => b.date.localeCompare(a.date))
  : [];
const hub = JSON.parse(readFileSync(join(root, "src/content/conteudos.json"), "utf8"));
const autores = readdirSync(join(root, "src/content/autores")).filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(root, "src/content/autores", f), "utf8")));
const AUTOR_PADRAO = "marcos-andrade";
const autorDe = (slug) => autores.find((x) => x.slug === (slug ?? AUTOR_PADRAO)) ?? autores[0];
const autorLd = (au) => ({ "@type": "Person", name: au.name, jobTitle: au.role, url: `${SITE}/autor/${au.slug}`, image: `${SITE}${au.image}`, sameAs: au.sameAs });
const publisher = { "@type": "Organization", name: BRAND, url: `${SITE}/`, logo: { "@type": "ImageObject", url: `${SITE}/mostralo-icon.png` } };
const urls = []; // [url, lastmod, images[]]

function block(b) {
  if (b.p) return `<p>${rich(b.p)}</p>`;
  if (b.ul) return `<ul>${b.ul.map((x) => `<li>${rich(x)}</li>`).join("")}</ul>`;
  if (b.ol) return `<ol>${b.ol.map((x) => `<li>${rich(x)}</li>`).join("")}</ol>`;
  if (b.tip) return `<p><strong>Dica:</strong> ${rich(b.tip)}</p>`;
  if (b.templates) return b.templates.map((t) => `<h3>${esc(t.title)}</h3><blockquote>${esc(t.text).replace(/\n/g, "<br>")}</blockquote>`).join("");
  if (b.table) return table(b.table.head, b.table.rows.map((r) => r.map(plain)));
  if (b.img) return `<figure><img src="${esc(b.img)}" alt="${esc(b.alt)}" width="1200" height="675" loading="lazy">${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ""}</figure>`;
  return "";
}

// ---------- artigos (/guia/:slug) ----------
for (const a of artigos) {
  const au = autorDe(a.author);
  const path = `/guia/${a.slug}`;
  const url = `${SITE}${path}`;
  const image = `${SITE}${a.image}`;
  const heroAlt = a.imageAlt ?? a.h1;
  const cat = a.category ?? "Guias";
  const inline = a.sections.flatMap((s) => s.blocks).filter((b) => b && b.img);
  const images = [
    { "@type": "ImageObject", url: image, width: 1200, height: 630, caption: heroAlt },
    ...inline.map((b) => ({ "@type": "ImageObject", url: `${SITE}${b.img}`, width: 1200, height: 675, caption: b.caption ? `${b.alt}. ${b.caption}` : b.alt })),
  ];
  const rel = (a.related ?? []).map((s) => artigos.find((x) => x.slug === s)).filter(Boolean);
  const catSlug = cat.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const body = `<nav><a href="/">Início</a> › <a href="/conteudos">Blog</a> › <a href="/conteudos/categoria/${catSlug}">${esc(cat)}</a></nav>
<article><h1>${esc(a.h1)}</h1><p>Por <a href="/autor/${au.slug}" rel="author">${esc(au.name)}</a>, ${esc(au.role)} · Atualizado em ${esc(a.updated ?? a.date)} · ${a.readMinutes} min de leitura</p>
<img src="${a.image}" alt="${esc(heroAlt)}" width="1200" height="630">
${a.audio ? `<p>Versão em áudio deste artigo:</p><audio controls preload="none" src="${esc(a.audio.src)}"></audio>` : ""}
${a.intro.map((t) => `<p>${rich(t)}</p>`).join("")}
${a.sections.map((sec) => `<h2>${esc(sec.h2)}</h2>${sec.blocks.map(block).join("")}`).join("")}
<aside><h2>Sobre o autor</h2><p><strong>${esc(au.name)}</strong>, ${esc(au.role)}. ${esc(au.bio)} <a href="/autor/${au.slug}">Ver todos os artigos</a></p></aside>
<h2>${esc(a.produto.h2)}</h2>${a.produto.p.map((t) => `<p>${rich(t)}</p>`).join("")}<ul>${a.produto.bullets.map((t) => `<li>${rich(t)}</li>`).join("")}</ul>
<p><a href="${SIGNUP}">Começar no ${BRAND}</a></p>
<h2>Perguntas frequentes</h2>${a.faq.map(([q, ans]) => `<h3>${esc(q)}</h3><p>${rich(ans)}</p>`).join("")}
${a.sources?.length ? `<h2>Fontes</h2><ul>${a.sources.map(([t, u]) => `<li><a href="${esc(u)}" rel="nofollow noopener">${esc(t)}</a></li>`).join("")}</ul>` : ""}
${rel.length ? `<h2>Leia também</h2><ul>${rel.map((r) => `<li><a href="/guia/${r.slug}">${esc(r.h1)}</a></li>`).join("")}</ul>` : ""}
<p><a href="/conteudos">Todos os guias do blog</a></p></article>`;
  page({
    path, title: a.title, description: a.description, image, imageAlt: heroAlt, ogType: "article", body,
    jsonLd: [
      {
        "@context": "https://schema.org", "@type": "Article", headline: a.h1, description: a.description, image: images,
        author: autorLd(au), publisher,
        datePublished: a.date, dateModified: a.updated ?? a.date, inLanguage: "pt-BR", mainEntityOfPage: url,
      },
      { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: a.faq.map(([q, ans]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: plain(ans) } })) },
      {
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: `${SITE}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/conteudos` },
          { "@type": "ListItem", position: 3, name: a.h1, item: url },
        ],
      },
    ],
  });
  urls.push([url, a.updated ?? a.date, [a.image, ...inline.map((b) => b.img)]]);
}

// ---------- blog (/conteudos, categorias e páginas) ----------
{
  const PER_PAGE = 12;
  const slug = (c) => c.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const pathOf = (cat, p) => `${cat ? `${hub.path}/categoria/${slug(cat)}` : hub.path}${p > 1 ? `/pagina/${p}` : ""}`;
  const guias = artigos.map((a) => ({ path: `/guia/${a.slug}`, category: a.category ?? "Guias", title: a.h1, excerpt: a.excerpt, date: a.updated ?? a.date }));
  const items = [...guias, ...(hub.items ?? [])]
    .map((it, i) => ({ it, i }))
    .sort((a, b) => (b.it.date ?? "").localeCompare(a.it.date ?? "") || a.i - b.i)
    .map((x) => x.it);
  const cats = hub.categories.filter((c) => items.some((i) => i.category === c));
  const catNav = `<nav aria-label="Categorias"><ul><li><a href="${hub.path}">Todos</a></li>${cats.map((c) => `<li><a href="${pathOf(c, 1)}">${esc(c)}</a></li>`).join("")}</ul></nav>`;
  const lastmod = items[0]?.date ?? new Date().toISOString().slice(0, 10);
  const render = (cat) => {
    const list = cat ? items.filter((i) => i.category === cat) : items;
    const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
    for (let p = 1; p <= pages; p++) {
      const slice = list.slice((p - 1) * PER_PAGE, p * PER_PAGE);
      const path = pathOf(cat, p);
      const url = `${SITE}${path}`;
      const name = cat ? `${cat}: guias para o seu negócio` : `Blog do ${BRAND}`;
      const title = cat || p > 1 ? `${name}${p > 1 ? ` — página ${p}` : ""} | ${BRAND}` : hub.title;
      const description = cat ? (hub.categoryInfo?.[cat] ?? hub.description) : p > 1 ? `${hub.description} Página ${p}.` : hub.description;
      const h1 = cat ?? hub.h1;
      const pager = pages > 1 ? `<nav aria-label="Páginas"><p>Página ${p} de ${pages}: ${Array.from({ length: pages }, (_, i) => i + 1).map((n) => (n === p ? `<strong>${n}</strong>` : `<a href="${pathOf(cat, n)}">${n}</a>`)).join(" ")}</p>${p > 1 ? `<a rel="prev" href="${pathOf(cat, p - 1)}">Anterior</a> ` : ""}${p < pages ? `<a rel="next" href="${pathOf(cat, p + 1)}">Próxima</a>` : ""}</nav>` : "";
      const start = !cat && p === 1 && hub.start?.length ? `<h2>Comece por aqui</h2><ul>${hub.start.map((x) => `<li><a href="${x.path}">${esc(x.label)}</a></li>`).join("")}</ul>` : "";
      const body = `<nav><a href="/">Início</a> › ${cat ? `<a href="${hub.path}">Blog</a> › ${esc(cat)}` : "Blog"}${p > 1 ? ` › Página ${p}` : ""}</nav><h1>${esc(h1)}</h1><p>${esc(cat ? hub.categoryInfo?.[cat] ?? "" : hub.lead)}</p>
${start}${catNav}<ul>${slice.map((i) => `<li><a href="${i.path}">${esc(i.title)}</a> — ${esc(i.excerpt)}</li>`).join("")}</ul>${pager}
<p><a href="${SIGNUP}">Começar no ${BRAND}</a></p>`;
      page({
        path, title, description, image: `${SITE}${hub.image ?? "/og-image.png"}`, body,
        jsonLd: [
          {
            "@context": "https://schema.org", "@type": "CollectionPage", name: title.replace(` | ${BRAND}`, ""), description, url, inLanguage: "pt-BR",
            mainEntity: { "@type": "ItemList", itemListElement: slice.map((it, i) => ({ "@type": "ListItem", position: (p - 1) * PER_PAGE + i + 1, url: `${SITE}${it.path}`, name: it.title })) },
          },
          {
            "@context": "https://schema.org", "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Início", item: `${SITE}/` },
              { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}${hub.path}` },
              ...(cat ? [{ "@type": "ListItem", position: 3, name: cat, item: `${SITE}${pathOf(cat, 1)}` }] : []),
            ],
          },
        ],
      });
      urls.push([url, lastmod, []]);
    }
  };
  render(null);
  cats.forEach(render);
}

// ---------- autor (/autor/:slug) ----------
for (const au of autores) {
  const mine = artigos.filter((x) => (x.author ?? AUTOR_PADRAO) === au.slug);
  const path = `/autor/${au.slug}`;
  const url = `${SITE}${path}`;
  const body = `<nav><a href="/">Início</a> › <a href="/conteudos">Blog</a> › ${esc(au.name)}</nav>
<img src="${au.image}" alt="${esc(au.name)}" width="128" height="128"><h1>${esc(au.name)}</h1><p>${esc(au.role)}</p>
${au.about.map((t) => `<p>${esc(t)}</p>`).join("")}
<p>${au.sameAs.map((u) => `<a href="${esc(u)}" rel="me noopener">${esc(u.replace(/^https?:\/\//, ""))}</a>`).join(" · ")}</p>
<h2>Artigos de ${esc(au.name.split(" ")[0])}</h2><ul>${mine.map((x) => `<li><a href="/guia/${x.slug}">${esc(x.h1)}</a></li>`).join("")}</ul>`;
  page({
    path, title: `${au.name}, ${au.role} | Blog do ${BRAND}`, description: au.bio, image: `${SITE}${au.image}`, body,
    jsonLd: [{
      "@context": "https://schema.org", "@type": "ProfilePage", url, inLanguage: "pt-BR", mainEntity: { ...autorLd(au), description: au.about.join(" ") },
      hasPart: mine.map((x) => ({ "@type": "Article", headline: x.h1, url: `${SITE}/guia/${x.slug}` })),
    }],
  });
  if (mine.length) urls.push([url, mine[0].updated ?? mine[0].date, []]);
}

// ---------- sitemap do blog (entra no índice /sitemap.xml por functions/_lib/seo.ts) ----------
{
  const sm = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.map(([u, d, imgs]) => `  <url><loc>${u}</loc>${d ? `<lastmod>${d}</lastmod>` : ""}${imgs.map((i) => `<image:image><image:loc>${SITE}${i}</image:loc></image:image>`).join("")}</url>`).join("\n")}
</urlset>
`;
  writeFileSync(join(dist, "blog-sitemap.xml"), sm);
}

// ---------- llms.txt: resumo do Mostralo (public/llms.txt) + artigos do blog ----------
{
  const lp = join(dist, "llms.txt");
  if (existsSync(lp) && artigos.length) {
    const byCat = new Map();
    for (const a of artigos) {
      const c = a.category ?? "Guias";
      if (!byCat.has(c)) byCat.set(c, []);
      byCat.get(c).push(`- [${a.h1}](${SITE}/guia/${a.slug}): ${a.description}`);
    }
    const head = readFileSync(lp, "utf8").trim();
    writeFileSync(lp, [head, `## Blog do ${BRAND} (${SITE}/conteudos)`, ...[...byCat].map(([c, l]) => `### ${c}\n${l.join("\n")}`)].join("\n\n") + "\n");
  }
}

console.log(`[blog] ${urls.length} páginas do blog geradas (${artigos.length} artigos).`);
