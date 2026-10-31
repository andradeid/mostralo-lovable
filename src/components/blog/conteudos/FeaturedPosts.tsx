import { Link } from "react-router-dom";
import type { ContentItem } from "@/lib/conteudos";
import { metaLine } from "./blogUi";
import { PostImage, PostRow } from "./PostCard";
import { ListenBadge, PostCategory } from "./PostMeta";

/** Destaques: o mais novo grande e os 2 seguintes ao lado (no celular, em lista). */
export function FeaturedPosts({ items }: { items: ContentItem[] }) {
  const [main, ...side] = items;
  if (!main) return null;
  return (
    <section aria-label="Destaques" className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
      <Link to={main.path} className="group relative flex min-h-[420px] flex-col justify-end overflow-hidden rounded-3xl border border-border bg-card max-lg:min-h-0 max-lg:justify-start">
        <PostImage item={main} eager className="aspect-[1200/630] w-full lg:absolute lg:inset-0 lg:h-full lg:aspect-auto" />
        <div className="absolute inset-0 hidden bg-gradient-to-b from-transparent from-25% to-[#070b10]/95 to-80% lg:block" aria-hidden />
        <div className="relative flex flex-col gap-2.5 p-5 lg:p-7">
          <span className="hidden self-start rounded-md bg-primary px-2.5 py-1 text-[11px] font-extrabold tracking-wider text-primary-foreground lg:inline">NOVO</span>
          <div className="flex items-center justify-between gap-3 lg:justify-start"><PostCategory category={main.category} className="lg:text-sky-300" />{main.audio && <ListenBadge className="lg:text-slate-300" />}</div>
          <h2 className="text-2xl font-black leading-tight text-foreground group-hover:text-primary lg:text-[30px] lg:text-white lg:group-hover:text-white">{main.title}</h2>
          <p className="text-[15px] leading-6 text-muted-foreground lg:max-w-2xl lg:text-slate-300">{main.excerpt}</p>
          <span className="text-xs text-muted-foreground lg:text-slate-300">{metaLine(main.date, main.readMinutes)}</span>
        </div>
      </Link>
      <div className="flex flex-col gap-4 lg:gap-5">
        {side.map((it) => (
          <div key={it.path} className="lg:rounded-2xl lg:border lg:border-border lg:bg-card lg:p-3 lg:shadow-sm">
            <PostRow item={it} />
          </div>
        ))}
      </div>
    </section>
  );
}
