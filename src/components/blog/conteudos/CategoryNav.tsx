import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { blogPath } from "@/lib/blog";

/** Categorias do blog: cada uma é um link para a sua página (/conteudos/categoria/...). No celular rola para o lado. */
export function CategoryNav({ categories, counts, total, active }: { categories: string[]; counts: Record<string, number>; total: number; active: string | null }) {
  const chips: [string | null, string, number][] = [[null, "Todos", total], ...categories.filter((c) => counts[c]).map((c) => [c, c, counts[c]] as [string, string, number])];
  return (
    <nav aria-label="Categorias" className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:overflow-visible sm:px-0">
      <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
        {chips.map(([cat, label, n]) => {
          const on = cat === active;
          return (
            <Link key={label} to={blogPath(cat)} aria-current={on ? "page" : undefined}
              className={cn("whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-bold transition",
                on ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground")}>
              {label} <span className="opacity-70">{n}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
