import { Fragment, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowRight, Check, Clock, Copy, Lightbulb, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { blogPath } from "@/lib/blog";
import { autorDe } from "@/lib/autores";
import { AuthorByline } from "@/components/blog/article/AuthorByline";
import { AuthorBox } from "@/components/blog/article/AuthorBox";
import { PublicShell, SIGNUP_PATH, waLink } from "@/components/blog/PublicShell";
import { ARTIGOS, type Artigo } from "@/lib/artigos";
import { ArticleAudioPlayer } from "@/components/blog/article/ArticleAudioPlayer";
import { autorJsonLd } from "@/lib/autores";
import { BLOG_SITE, blogPublisher, useBlogMeta } from "@/components/blog/useBlogMeta";
export { ARTIGOS };
export type { Artigo };

type Block =
  | { p: string } | { ul: string[] } | { ol: string[] } | { tip: string } | { walink: true } | { img: string; alt: string; caption?: string }
  | { templates: { title: string; text: string }[] } | { table: { head: string[]; rows: string[][] } };

/** Texto com **negrito** e [link](url) — o mesmo formato é convertido no pré-render. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);
  return (
    <>
      {parts.map((p, i) => {
        const b = p.match(/^\*\*(.+)\*\*$/);
        if (b) return <strong key={i} className="text-foreground">{b[1]}</strong>;
        const l = p.match(/^\[(.+)\]\((.+)\)$/);
        if (l) {
          const [, label, href] = l;
          return href.startsWith("/") ? (
            <Link key={i} to={href} className="font-semibold text-primary underline-offset-2 hover:underline">{label}</Link>
          ) : (
            <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline-offset-2 hover:underline">{label}</a>
          );
        }
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

function Template({ title, text }: { title: string; text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-foreground">{title}</p>
        <button type="button" onClick={() => navigator.clipboard?.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1500); })}
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground">
          {ok ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />} {ok ? "Copiado" : "Copiar"}
        </button>
      </div>
      <p className="mt-2 whitespace-pre-line rounded-md bg-[#d9fdd3] px-3 py-2 text-sm leading-6 text-[#111]">{text}</p>
    </div>
  );
}

/** Gerador de link do WhatsApp (wa.me) com mensagem pronta. */
function WaLinkGenerator() {
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("Olá! Vim pelo site e quero saber mais.");
  const [ok, setOk] = useState(false);
  let d = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (d.length === 10 || d.length === 11) d = "55" + d;
  const valid = d.length >= 12 && d.length <= 13;
  const link = valid ? `https://wa.me/${d}${msg.trim() ? `?text=${encodeURIComponent(msg.trim())}` : ""}` : "";
  return (
    <div className="mt-6 rounded-xl border border-primary/40 bg-card p-5">
      <p className="font-bold text-foreground">Gerador de link do WhatsApp</p>
      <label className="mt-4 block text-sm text-muted-foreground">Seu WhatsApp com DDD
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(61) 99999-9999" inputMode="tel"
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground" />
      </label>
      <label className="mt-3 block text-sm text-muted-foreground">Mensagem que já vem escrita (opcional)
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={2}
          className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground" />
      </label>
      <div className="mt-4 rounded-md bg-muted/40 p-3 font-mono text-sm break-all text-foreground">{link || "Digite o número com DDD para gerar o link"}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" disabled={!link} onClick={() => navigator.clipboard?.writeText(link).then(() => { setOk(true); setTimeout(() => setOk(false), 1500); })}>
          {ok ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />} {ok ? "Copiado" : "Copiar link"}
        </Button>
        {link && <Button size="sm" variant="outline" asChild><a href={link} target="_blank" rel="noopener noreferrer">Testar link</a></Button>}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">O link é gerado no seu navegador; nada é salvo.</p>
    </div>
  );
}

function RenderBlock({ b }: { b: Block }) {
  if ("walink" in b) return <WaLinkGenerator />;
  if ("img" in b)
    return (
      <figure className="my-8">
        <img src={b.img} alt={b.alt} loading="lazy" width={1200} height={675} className="w-full rounded-xl border border-border object-cover" />
        {b.caption && <figcaption className="mt-2 text-center text-sm text-muted-foreground">{b.caption}</figcaption>}
      </figure>
    );
  if ("p" in b) return <p className="mt-4 leading-8 text-muted-foreground"><Rich text={b.p} /></p>;
  if ("ul" in b) return <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-muted-foreground">{b.ul.map((t) => <li key={t}><Rich text={t} /></li>)}</ul>;
  if ("ol" in b) return <ol className="mt-4 list-decimal space-y-2 pl-6 leading-7 text-muted-foreground">{b.ol.map((t) => <li key={t}><Rich text={t} /></li>)}</ol>;
  if ("tip" in b) return (
    <p className="mt-5 flex gap-3 rounded-lg border border-primary/30 bg-primary/10 p-4 leading-7 text-muted-foreground">
      <Lightbulb className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden /> <span><Rich text={b.tip} /></span>
    </p>
  );
  if ("templates" in b) return <div className="mt-5 grid gap-3 md:grid-cols-2">{b.templates.map((t) => <Template key={t.title} {...t} />)}</div>;
  if ("table" in b) return (
    <div className="mt-5 overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-muted/50 text-foreground"><tr>{b.table.head.map((h) => <th key={h} scope="col" className="px-4 py-3 font-bold">{h}</th>)}</tr></thead>
        <tbody>{b.table.rows.map((r, i) => <tr key={i} className="border-t border-border">{r.map((c, j) => <td key={j} className={j === 0 ? "px-4 py-3 font-semibold text-foreground" : "px-4 py-3 text-muted-foreground"}><Rich text={c} /></td>)}</tr>)}</tbody>
      </table>
    </div>
  );
  return null;
}

const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

export default function GuiaArtigo() {
  const { slug } = useParams();
  const a = ARTIGOS.find((x) => x.slug === slug);
  useBlogMeta(a ? {
    title: a.title, description: a.description, path: `/guia/${a.slug}`, image: a.image, type: "article",
    jsonLd: [
      { "@context": "https://schema.org", "@type": "Article", headline: a.h1, description: a.description, image: `${BLOG_SITE}${a.image}`,
        author: autorJsonLd(autorDe(a.author), BLOG_SITE), publisher: blogPublisher,
        datePublished: a.date, dateModified: a.updated ?? a.date, inLanguage: "pt-BR", mainEntityOfPage: `${BLOG_SITE}/guia/${a.slug}` },
      { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: a.faq.map(([q, ans]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: ans.replace(/\*\*|\[|\]\([^)]*\)/g, "") } })) },
    ],
  } : null);
  if (!a) return <Navigate to="/conteudos" replace />;
  const autor = autorDe(a.author);
  const related = (a.related ?? []).map((s) => ARTIGOS.find((x) => x.slug === s)).filter(Boolean).slice(0, 4) as Artigo[];

  return (
    <PublicShell themeable>
      <article className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
        <nav aria-label="Trilha" className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Início</Link> › <Link to="/conteudos" className="hover:text-foreground">Blog</Link> › <Link to={blogPath(a.category ?? "Guias")} className="hover:text-foreground">{a.category ?? "Guias"}</Link>
        </nav>
        <h1 className="mt-6 text-3xl font-black leading-tight text-foreground md:text-[2.6rem]">{a.h1}</h1>
        <AuthorByline autor={autor} updated={fmt(a.updated ?? a.date)} minutes={a.readMinutes} />
        <img src={a.image} alt={a.imageAlt ?? a.h1} width={1200} height={630} className="mt-8 w-full rounded-xl border border-border" />
        {a.audio && <ArticleAudioPlayer audio={a.audio} />}
        <div data-read="intro">
          {a.intro.map((t) => <p key={t} className="mt-6 text-lg leading-8 text-muted-foreground"><Rich text={t} /></p>)}
        </div>

        <nav aria-label="Neste artigo" className="mt-8 rounded-lg border border-border bg-card p-5">
          <p className="text-sm font-bold text-foreground">Neste artigo</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            {a.sections.map((s, i) => <li key={s.h2}><a href={`#s${i + 1}`} className="hover:text-foreground">{s.h2}</a></li>)}
            <li><a href="#mostralo" className="hover:text-foreground">{a.produto.h2}</a></li>
            <li><a href="#faq" className="hover:text-foreground">Perguntas frequentes</a></li>
          </ol>
        </nav>

        {a.sections.map((s, i) => (
          <section key={s.h2} data-read={`s${i + 1}`}>
            <h2 id={`s${i + 1}`} className="mt-14 scroll-mt-24 text-2xl font-black text-foreground">{s.h2}</h2>
            {(s.blocks as Block[]).map((b, j) => <RenderBlock key={j} b={b} />)}
          </section>
        ))}

        <AuthorBox autor={autor} />

        <section id="mostralo" data-read="mostralo" className="mt-14 scroll-mt-24 rounded-xl border border-primary/40 bg-primary/10 p-6 md:p-8">
          <h2 className="text-2xl font-black text-foreground">{a.produto.h2}</h2>
          {a.produto.p.map((t) => <p key={t} className="mt-3 leading-7 text-muted-foreground"><Rich text={t} /></p>)}
          <ul className="mt-4 space-y-2">
            {a.produto.bullets.map((t) => <li key={t} className="flex gap-2 text-muted-foreground"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" /> <span><Rich text={t} /></span></li>)}
          </ul>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg"><Link to={SIGNUP_PATH}>Começar no Mostralo</Link></Button>
            <Button asChild size="lg" variant="outline">
              <a href={waLink(`Olá! Li o artigo "${a.h1}" e quero saber mais do Mostralo.`)} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2 h-4 w-4" /> Falar com um especialista</a>
            </Button>
          </div>
        </section>

        <h2 id="faq" className="mt-14 scroll-mt-24 text-2xl font-black text-foreground">Perguntas frequentes</h2>
        <div className="mt-6 divide-y divide-border rounded-lg border border-border">
          {a.faq.map(([q, ans]) => (
            <details key={q} className="p-5">
              <summary className="cursor-pointer font-bold text-foreground">{q}</summary>
              <p className="mt-3 leading-7 text-muted-foreground"><Rich text={ans} /></p>
            </details>
          ))}
        </div>

        {a.sources?.length ? (
          <>
            <h2 className="mt-12 text-lg font-bold text-foreground">Fontes</h2>
            <ul className="mt-3 list-disc space-y-1 pl-6 text-sm text-muted-foreground">
              {a.sources.map(([t, u]) => <li key={u}><a href={u} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-foreground hover:underline">{t}</a></li>)}
            </ul>
          </>
        ) : null}

        {related.length > 0 && (
          <>
            <h2 className="mt-14 text-2xl font-black text-foreground">Leia também</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {related.map((r) => (
                <Link key={r.slug} to={`/guia/${r.slug}`} className="group overflow-hidden rounded-lg border border-border bg-card transition hover:border-primary/50">
                  <img src={r.image} alt={r.h1} loading="lazy" width={1200} height={630} className="aspect-[1200/630] w-full object-cover" />
                  <div className="p-4">
                    <p className="font-bold leading-snug text-foreground">{r.h1}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary">Ler <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
        <p className="mt-10 text-sm text-muted-foreground">Veja todos os <Link to="/conteudos" className="underline hover:text-foreground">guias do blog</Link>.</p>
      </article>
    </PublicShell>
  );
}
