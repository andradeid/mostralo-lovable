import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { autorPath, type Autor } from "@/lib/autores";

/** Assinatura abaixo do título do artigo: foto, nome, cargo, data e tempo de leitura. */
export function AuthorByline({ autor, updated, minutes }: { autor: Autor; updated: string; minutes: number }) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
      <Link to={autorPath(autor)} className="flex items-center gap-2.5 hover:text-foreground">
        <img src={autor.image} alt={autor.name} width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
        <span className="leading-tight"><b className="block font-semibold text-foreground">{autor.name}</b><span className="text-xs">{autor.role}</span></span>
      </Link>
      <span aria-hidden className="hidden h-6 w-px bg-border sm:block" />
      <span>Atualizado em {updated}</span>
      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {minutes} min de leitura</span>
    </div>
  );
}
