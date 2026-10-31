import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/** "Comece por aqui": os guias principais, escolhidos em src/content/conteudos.json (start). */
export function StartHere({ items }: { items: { path: string; label: string }[] }) {
  if (!items.length) return null;
  return (
    <section className="space-y-3" aria-labelledby="comece">
      <h2 id="comece" className="text-xl font-extrabold text-foreground">Comece por aqui</h2>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((s, i) => (
          <Link key={s.path} to={s.path} className="group flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm transition hover:border-primary/50">
            <span className="text-[15px] font-bold text-foreground">{i + 1}. {s.label}</span>
            <ArrowRight className="h-4 w-4 flex-none text-primary transition group-hover:translate-x-0.5" aria-hidden />
          </Link>
        ))}
      </div>
    </section>
  );
}
