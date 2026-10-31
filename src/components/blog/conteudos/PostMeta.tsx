import { Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import { catText } from "./blogUi";

/** Categoria do post (colorida) e o aviso "Ouvir" quando tem narração. */
export function PostCategory({ category, className }: { category: string; className?: string }) {
  return <span className={cn("text-[11px] font-extrabold uppercase tracking-wider", catText(category), className)}>{category}</span>;
}

export function ListenBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground", className)} title="Este artigo tem versão em áudio">
      <Headphones className="h-3.5 w-3.5" aria-hidden /> Ouvir
    </span>
  );
}
