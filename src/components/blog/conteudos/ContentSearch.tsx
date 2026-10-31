import { Search, X } from "lucide-react";

/** Campo de busca da central de conteúdos. */
export function ContentSearch({
  value,
  onChange,
  total,
  className = "mt-8 max-w-xl",
}: {
  value: string;
  onChange: (v: string) => void;
  total: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="text"
          role="searchbox"
          enterKeyHint="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Buscar no blog: barbearia, delivery, agenda, cardápio…"
          aria-label="Buscar no blog"
          className="h-12 w-full rounded-full border border-border bg-card pl-12 pr-12 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Limpar busca"
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {value.trim() && (
        <p
          className="mt-2 pl-4 text-sm text-muted-foreground"
          aria-live="polite"
        >
          {total === 1
            ? "1 conteúdo encontrado"
            : `${total} conteúdos encontrados`}
        </p>
      )}
    </div>
  );
}
