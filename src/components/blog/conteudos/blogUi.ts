/** Cores e formatos do blog (cards, chips e destaques). */
export const CAT_TEXT: Record<string, string> = {
  Guias: "text-primary",
  Agendamento: "text-violet-600 dark:text-violet-400",
  "Delivery e pedidos": "text-emerald-600 dark:text-emerald-400",
  "Por segmento": "text-sky-600 dark:text-sky-400",
  "Gestão e vendas": "text-amber-600 dark:text-amber-400",
};
export const CAT_BORDER: Record<string, string> = {
  Guias: "border-l-primary",
  Agendamento: "border-l-violet-500",
  "Delivery e pedidos": "border-l-emerald-500",
  "Por segmento": "border-l-sky-500",
  "Gestão e vendas": "border-l-amber-500",
};
export const catText = (c: string) => CAT_TEXT[c] ?? "text-primary";

export const fmtDate = (d?: string) =>
  d ? new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).replace(".", "").replace(/ de /g, " ") : null;

export const metaLine = (date?: string, minutes?: number) => [fmtDate(date), minutes ? `${minutes} min de leitura` : null].filter(Boolean).join(" · ");
