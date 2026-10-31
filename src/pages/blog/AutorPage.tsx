import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Globe, Linkedin } from "lucide-react";
import { PublicShell } from "@/components/blog/PublicShell";
import { PostGrid } from "@/components/blog/conteudos/PostGrid";
import { AUTOR_PADRAO, AUTORES } from "@/lib/autores";
import { allContent } from "@/lib/conteudos";
import { ARTIGOS } from "@/lib/artigos";
import { useBlogMeta } from "@/components/blog/useBlogMeta";

/** Página do autor (/autor/:slug): foto, quem é e os artigos que ele assina. */
export default function AutorPage() {
  const { slug } = useParams();
  const autor = AUTORES.find((a) => a.slug === slug);
  const posts = useMemo(() => {
    if (!autor) return [];
    const mine = new Set(ARTIGOS.filter((a) => (a.author ?? AUTOR_PADRAO) === autor.slug).map((a) => `/guia/${a.slug}`));
    return allContent().filter((it) => mine.has(it.path));
  }, [autor]);
  useBlogMeta(autor ? { title: `${autor.name}, ${autor.role} | Blog do Mostralo`, description: autor.bio, path: `/autor/${autor.slug}`, image: autor.image } : null);
  if (!autor) return <Navigate to="/conteudos" replace />;
  const linkedin = autor.sameAs.find((u) => u.includes("linkedin.com"));
  const site = autor.sameAs.find((u) => !u.includes("linkedin.com"));

  return (
    <PublicShell themeable>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:px-6 md:py-14">
        <nav aria-label="Trilha" className="text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Início</Link> › <Link to="/conteudos" className="hover:text-foreground">Blog</Link> › <span className="text-foreground">{autor.name}</span>
        </nav>
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <img src={autor.image} alt={autor.name} width={128} height={128} className="h-28 w-28 flex-none rounded-full object-cover md:h-32 md:w-32" />
          <div>
            <h1 className="text-3xl font-black text-foreground md:text-4xl">{autor.name}</h1>
            <p className="mt-1 text-lg font-semibold text-primary">{autor.role}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
              {linkedin && <a href={linkedin} target="_blank" rel="noopener noreferrer me" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"><Linkedin className="h-4 w-4" /> LinkedIn</a>}
              {site && <a href={site} target="_blank" rel="noopener noreferrer me" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"><Globe className="h-4 w-4" /> {site.replace(/^https?:\/\//, "")}</a>}
            </div>
          </div>
        </header>
        <section className="max-w-3xl space-y-3 text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
          {autor.about.map((p) => <p key={p}>{p}</p>)}
        </section>
        <section className="flex flex-col gap-5" aria-labelledby="artigos">
          <h2 id="artigos" className="text-xl font-extrabold text-foreground">Artigos de {autor.name.split(" ")[0]} ({posts.length})</h2>
          <PostGrid items={posts} />
        </section>
      </div>
    </PublicShell>
  );
}
