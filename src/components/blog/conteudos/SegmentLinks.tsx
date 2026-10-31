import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { blogPath } from "@/lib/blog";
import { CAT_BORDER, catText } from "./blogUi";

/** "Por segmento": atalhos para as categorias (menos Guias, que já é o grosso da lista). */
export function SegmentLinks({ categories, counts, info, current }: { categories: string[]; counts: Record<string, number>; info: Record<string, string>; current: string | null }) {
  const list = categories.filter((c) => c !== "Guias" && c !== current && counts[c]);
  if (!list.length) return null;
  return (
    <section className="space-y-3" aria-labelledby="segmentos">
      <h2 id="segmentos" className="text-xl font-extrabold text-foreground">Por segmento</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((c) => (
          <Link key={c} to={blogPath(c)} className={cn("flex flex-col gap-1.5 rounded-xl border border-l-4 border-border bg-card p-4 shadow-sm transition hover:border-primary/40", CAT_BORDER[c])}>
            <b className="text-foreground">{c}</b>
            <span className="line-clamp-2 text-[13px] leading-5 text-muted-foreground">{info[c]}</span>
            <span className={cn("mt-1 text-[13px] font-bold", catText(c))}>{counts[c]} conteúdos →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
