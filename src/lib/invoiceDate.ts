/**
 * Formata a data de vencimento de faturas (subscription_invoices.due_date).
 * O banco grava data pura ("YYYY-MM-DD") no fuso de Brasília; tratar como
 * data pura evita o deslocamento de um dia causado por new Date("YYYY-MM-DD")
 * (interpretado como UTC meia-noite → dia anterior em GMT-3).
 */
export function formatInvoiceDueDate(
  dueDate: string | null | undefined,
  pattern: "dd/MM/yyyy" | "dd/MM/yy" = "dd/MM/yyyy"
): string {
  if (!dueDate) return "-";

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(dueDate);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return pattern === "dd/MM/yy"
      ? `${day}/${month}/${year.slice(2)}`
      : `${day}/${month}/${year}`;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: pattern === "dd/MM/yy" ? "2-digit" : "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(dueDate));
}
