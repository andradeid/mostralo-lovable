import { useMemo } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { PublicShell } from "@/components/blog/PublicShell";
import { allContent, HUB, searchContent } from "@/lib/conteudos";
import { blogPath, categoryFromSlug, paginate } from "@/lib/blog";
import { ContentSearch } from "@/components/blog/conteudos/ContentSearch";
import { FeaturedPosts } from "@/components/blog/conteudos/FeaturedPosts";
import { StartHere } from "@/components/blog/conteudos/StartHere";
import { CategoryNav } from "@/components/blog/conteudos/CategoryNav";
import { PostGrid } from "@/components/blog/conteudos/PostGrid";
import { BlogCta } from "@/components/blog/conteudos/BlogCta";
import { BlogPagination } from "@/components/blog/conteudos/BlogPagination";
import { SegmentLinks } from "@/components/blog/conteudos/SegmentLinks";
import { useBlogMeta } from "@/components/blog/useBlogMeta";

const hub = HUB as typeof HUB & { start?: { path: string; label: string }[]; categoryInfo?: Record<string, string>; image?: string };

/** Blog do Mostralo (/conteudos): destaques, categorias com página própria, busca e paginação. */
export default function Conteudos() {
  const items = useMemo(allContent, []);
  const { categoria, pagina } = useParams();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const setQ = (v: string) => setParams(v.trim() ? { q: v } : {}, { replace: true });

  const category = categoryFromSlug(hub.categories, categoria);
  const pageNum = Number(pagina ?? 1);
  const counts = useMemo(() => Object.fromEntries(hub.categories.map((c) => [c, items.filter((i) => i.category === c).length])), [items]);

  const list = category ? items.filter((i) => i.category === category) : items;
  const found = useMemo(() => searchContent(list, q), [list, q]);
  const searching = !!q.trim();
  const view = paginate(list, pageNum, !category);
  const metaTitle = category || view.page > 1
    ? `${category ? `${category}: guias para o seu negócio` : "Blog do Mostralo"}${view.page > 1 ? ` — página ${view.page}` : ""} | Mostralo`
    : hub.title;
  useBlogMeta({
    title: metaTitle,
    description: category ? hub.categoryInfo?.[category] ?? hub.description : hub.description,
    path: blogPath(category, view.page), image: hub.image,
  });

  // Endereço inválido: categoria que não existe, /pagina/1 ou página além da última
  if ((categoria && !category) || (pagina && (!Number.isInteger(pageNum) || pageNum < 2 || pageNum > view.pages))) {
    return <Navigate to={blogPath(category, pagina && pageNum > 1 ? view.pages : 1)} replace />;
  }

  const shown = searching ? found : view.items;
  const firstHalf = shown.slice(0, 6);
  const secondHalf = shown.slice(6);
  const h1 = category ?? hub.h1;
  const lead = category ? hub.categoryInfo?.[category] ?? "" : hub.lead;

  return (
    <PublicShell themeable>
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 md:px-6 md:py-14">
        <header className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-10">
          <div>
            <nav aria-label="Trilha" className="text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground">Início</Link> › {category ? <><Link to="/conteudos" className="hover:text-foreground">Blog</Link> › <span className="text-foreground">{category}</span></> : <span className="text-foreground">Blog</span>}
              {view.page > 1 && <> › Página {view.page}</>}
            </nav>
            <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-foreground md:text-5xl">{h1}</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">{lead}</p>
          </div>
          <ContentSearch value={q} onChange={setQ} total={found.length} className="w-full md:max-w-md md:flex-none" />
        </header>

        {!searching && view.featured.length > 0 && <FeaturedPosts items={view.featured} />}
        {!searching && !category && view.page === 1 && <StartHere items={hub.start ?? []} />}

        <section className="flex flex-col gap-5" aria-labelledby="lista">
          <h2 id="lista" className="text-xl font-extrabold text-foreground">{searching ? `Resultados para "${q}"` : category ? `Todos de ${category}` : view.page === 1 ? "Mais recentes" : `Página ${view.page}`}</h2>
          <CategoryNav categories={hub.categories} counts={counts} total={items.length} active={category} />
          {shown.length > 0 ? (
            <>
              <PostGrid items={firstHalf} />
              {!searching && <BlogCta />}
              <PostGrid items={secondHalf} />
              {searching && <BlogCta />}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              Nada encontrado para "{q}"{category ? ` em ${category}` : ""}.{" "}
              <button type="button" className="font-semibold text-primary underline-offset-2 hover:underline" onClick={() => setQ("")}>Limpar busca</button>
            </div>
          )}
          {!searching && <BlogPagination category={category} page={view.page} pages={view.pages} from={view.from} to={view.to} total={view.total} />}
        </section>

        {!searching && <SegmentLinks categories={hub.categories} counts={counts} info={hub.categoryInfo ?? {}} current={category} />}
      </div>
    </PublicShell>
  );
}
