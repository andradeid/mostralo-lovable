import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";
import type { ContentItem } from "@/lib/conteudos";
import { metaLine } from "./blogUi";
import { ListenBadge, PostCategory } from "./PostMeta";

/** Card de post na grade do blog. */
export function PostCard({ item }: { item: ContentItem }) {
  return (
    <Link to={item.path} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50">
      <PostImage item={item} className="aspect-[1200/630] w-full" />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center justify-between gap-2"><PostCategory category={item.category} />{item.audio && <ListenBadge />}</div>
        <h3 className="text-lg font-bold leading-snug text-foreground group-hover:text-primary">{item.title}</h3>
        <p className="line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">{item.excerpt}</p>
        <span className="text-xs text-muted-foreground">{metaLine(item.date, item.readMinutes)}</span>
      </div>
    </Link>
  );
}

/** Linha compacta (foto pequena) — celular e destaques laterais. */
export function PostRow({ item }: { item: ContentItem }) {
  return (
    <Link to={item.path} className="group grid grid-cols-[112px_1fr] items-center gap-3 sm:grid-cols-[160px_1fr] sm:gap-4">
      <PostImage item={item} className="h-[76px] w-[112px] rounded-xl sm:h-[104px] sm:w-[160px]" />
      <div className="flex min-w-0 flex-col gap-1">
        <PostCategory category={item.category} />
        <h3 className="text-[15px] font-bold leading-snug text-foreground group-hover:text-primary sm:text-base">{item.title}</h3>
        <span className="text-xs text-muted-foreground">{metaLine(item.date, item.readMinutes)}</span>
      </div>
    </Link>
  );
}

export function PostImage({ item, className, eager }: { item: ContentItem; className?: string; eager?: boolean }) {
  if (!item.image) {
    return <div className={`flex items-center justify-center bg-gradient-to-br from-primary/25 to-primary/5 ${className ?? ""}`}><BookOpen className="h-10 w-10 text-primary" aria-hidden /></div>;
  }
  return <img src={item.image} alt="" loading={eager ? "eager" : "lazy"} width={1200} height={630} className={`object-cover ${className ?? ""}`} />;
}
