import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { blogPath, pageNumbers } from "@/lib/blog";

const box = "flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-bold";

/** Paginação com links de verdade (o Google segue para as páginas seguintes). */
export function BlogPagination({ category, page, pages, from, to, total }: { category: string | null; page: number; pages: number; from: number; to: number; total: number }) {
  if (pages <= 1) return null;
  const prev = page > 1 ? blogPath(category, page - 1) : null;
  const next = page < pages ? blogPath(category, page + 1) : null;
  const Arrow = ({ to: href, children, rel }: { to: string | null; children: React.ReactNode; rel: string }) =>
    href ? <Link to={href} rel={rel} className={cn(box, "gap-1 border-border text-foreground hover:border-primary/50")}>{children}</Link>
      : <span className={cn(box, "gap-1 border-border text-muted-foreground/50")} aria-disabled>{children}</span>;
  return (
    <nav aria-label="Páginas" className="flex flex-col items-center gap-2.5">
      <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-center">
        <Arrow to={prev} rel="prev"><ArrowLeft className="h-4 w-4" aria-hidden /> Anterior</Arrow>
        <span className="text-sm text-muted-foreground sm:hidden">Página {page} de {pages}</span>
        <div className="hidden gap-2 sm:flex">
          {pageNumbers(page, pages).map((n, i) => n === null
            ? <span key={`e${i}`} className="flex h-10 items-center px-1 text-muted-foreground">…</span>
            : <Link key={n} to={blogPath(category, n)} aria-current={n === page ? "page" : undefined}
                className={cn(box, n === page ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:border-primary/50")}>{n}</Link>)}
        </div>
        <Arrow to={next} rel="next">Próxima <ArrowRight className="h-4 w-4" aria-hidden /></Arrow>
      </div>
      <span className="text-xs text-muted-foreground">Mostrando {from}–{to} de {total} conteúdos</span>
    </nav>
  );
}
