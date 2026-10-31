import { Link } from "react-router-dom";
import { Linkedin } from "lucide-react";
import { autorPath, type Autor } from "@/lib/autores";

/** Quadro "sobre o autor" no fim do artigo. */
export function AuthorBox({ autor }: { autor: Autor }) {
  const linkedin = autor.sameAs.find((u) => u.includes("linkedin.com"));
  return (
    <aside aria-label="Sobre o autor" className="mt-14 flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-start md:p-6">
      <img src={autor.image} alt={autor.name} width={72} height={72} loading="lazy" className="h-[72px] w-[72px] flex-none rounded-full object-cover" />
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sobre o autor</p>
        <p className="mt-1 font-bold text-foreground">{autor.name} <span className="font-normal text-muted-foreground">· {autor.role}</span></p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{autor.bio}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
          {linkedin && <a href={linkedin} target="_blank" rel="noopener noreferrer me" className="inline-flex items-center gap-1 text-primary hover:underline"><Linkedin className="h-4 w-4" /> LinkedIn</a>}
          <Link to={autorPath(autor)} className="text-primary hover:underline">Ver todos os artigos</Link>
        </div>
      </div>
    </aside>
  );
}
