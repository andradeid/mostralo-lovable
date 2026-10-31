/**
 * Variáveis das mensagens de agendamento — UM catálogo e UMA troca, usados pelas
 * funções (confirmação, lembrete, pedido de avaliação) e pela prévia do painel.
 * Sem dependências: o navegador importa este arquivo pelo caminho relativo.
 */

export interface BookingTemplateData {
  customerName?: string | null;
  professionalName?: string | null;
  serviceName?: string | null;
  /** AAAA-MM-DD */
  date?: string | null;
  /** HH:MM ou HH:MM:SS */
  time?: string | null;
  price?: number | null;
  locationLink?: string | null;
  /** Link do Mostralo: gerenciar o agendamento (confirmação) ou avaliar (pedido de avaliação). */
  link?: string | null;
  /** Link de avaliação no Google (configurado pelo lojista). */
  googleReviewUrl?: string | null;
}

/** Variáveis aceitas nos modelos (mesma lista mostrada no painel). */
export const BOOKING_TEMPLATE_VARIABLES = [
  '{cliente}', '{profissional}', '{servico}', '{data}', '{horario}', '{valor}', '{localizacao}', '{link}', '{google_review}',
] as const;

export function formatBookingDate(date?: string | null): string {
  if (!date) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : date;
}

export function formatBookingTime(time?: string | null): string {
  return time ? time.substring(0, 5) : '';
}

export function formatBookingPrice(value?: number | null): string {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function renderBookingTemplate(template: string, d: BookingTemplateData): string {
  const values: Record<string, string> = {
    cliente: d.customerName ?? '',
    profissional: d.professionalName ?? '',
    servico: d.serviceName ?? '',
    data: formatBookingDate(d.date),
    horario: formatBookingTime(d.time),
    valor: formatBookingPrice(d.price),
    localizacao: d.locationLink ?? '',
    link: d.link ?? '',
    google_review: d.googleReviewUrl ?? '',
  };
  return (template || '').replace(/\{(cliente|profissional|servico|data|horario|valor|localizacao|link|google_review)\}/gi,
    (_, key: string) => values[key.toLowerCase()] ?? '');
}
