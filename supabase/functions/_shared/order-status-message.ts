// Aviso de status do pedido ao cliente pelo WhatsApp da loja: textos e regras puras.
// Usado por order-status-whatsapp e testado em src/lib/orderStatusMessage.test.ts. Sem Deno.
//
// Variáveis dos modelos (as mesmas da tela "Mensagens automáticas"):
// {nome} {primeiro_nome} {loja} {link_loja} {numero_pedido} {valor_total} {itens_pedido}
// {endereco_entrega} {tipo_entrega} {link_pedido} {whatsapp_loja} {saudacao} {tempo_estimado}

export type OrderStatusEvent =
  | 'order_received'
  | 'order_confirmed'
  | 'order_ready'
  | 'order_in_transit'
  | 'order_completed'
  | 'order_cancelled';

export const ORDER_STATUS_EVENTS: OrderStatusEvent[] = [
  'order_received', 'order_confirmed', 'order_ready', 'order_in_transit', 'order_completed', 'order_cancelled',
];

/** Evento a partir do kind gravado no registro (status_order_confirmed → order_confirmed). */
export function eventFromKind(kind: string): OrderStatusEvent | null {
  const ev = kind.startsWith('status_') ? kind.slice(7) : '';
  return (ORDER_STATUS_EVENTS as string[]).includes(ev) ? (ev as OrderStatusEvent) : null;
}

export interface OrderMessageData {
  customerName?: string | null;
  storeName?: string | null;
  storeSlug?: string | null;
  storeCustomDomain?: string | null;
  storeCustomDomainVerified?: boolean | null;
  storePhone?: string | null;
  orderId?: string | null;
  orderNumber?: string | number | null;
  orderTotal?: number | null;
  deliveryAddress?: string | null;
  deliveryType?: string | null;
  orderItems?: string;
  estimatedTime?: string;
  greeting?: string;
  baseUrl?: string;
}

const brl = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "Bom dia" / "Boa tarde" / "Boa noite" no fuso da loja. */
export function greetingAt(now: Date, timeZone = 'America/Sao_Paulo'): string {
  let hour: number;
  try {
    hour = Number(new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(now));
  } catch {
    hour = (now.getUTCHours() + 21) % 24;
  }
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Lista de itens: "• 2x Bolo (R$ 30,00)". */
export function formatOrderItems(items: Array<{ quantity?: number | null; product_name?: string | null; subtotal?: number | null }>): string {
  return (items ?? [])
    .map((i) => `• ${i.quantity ?? 1}x ${i.product_name ?? ''} (R$ ${brl(Number(i.subtotal ?? 0))})`)
    .join('\n');
}

/**
 * Tempo estimado: minutos ("40 minutos", "1h30min"); de 1 dia para cima (encomenda com prazo em
 * dias úteis), a data limite: "até qui. 03/12".
 */
export function formatEstimatedTime(minutes: number | null | undefined, createdAt?: string | null, timeZone = 'America/Sao_Paulo'): string {
  if (!minutes || minutes <= 0) return '';
  if (minutes >= 24 * 60 && createdAt) {
    const d = new Date(new Date(createdAt).getTime() + minutes * 60000);
    const wd = new Intl.DateTimeFormat('pt-BR', { timeZone, weekday: 'short' }).format(d);
    const dm = new Intl.DateTimeFormat('pt-BR', { timeZone, day: '2-digit', month: '2-digit' }).format(d);
    return `até ${wd} ${dm}`;
  }
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (m === 0) return h === 1 ? '1 hora' : `${h} horas`;
    return `${h}h${m}min`;
  }
  return `${minutes} minutos`;
}

/** Link da loja e do pedido (domínio próprio verificado tem prioridade). */
export function storeLinks(d: OrderMessageData): { storeLink: string; orderLink: string } {
  const base = d.storeCustomDomain && d.storeCustomDomainVerified
    ? `https://${d.storeCustomDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`
    : (d.baseUrl || 'https://mostralo.com.br').replace(/\/+$/, '');
  const own = !!(d.storeCustomDomain && d.storeCustomDomainVerified);
  const storeLink = own ? base : d.storeSlug ? `${base}/loja/${d.storeSlug}` : base;
  const orderLink = d.orderId ? `${base}/pedido/${d.orderId}` : '';
  return { storeLink, orderLink };
}

/** Troca as variáveis do modelo pelos dados do pedido. */
export function renderOrderMessage(template: string, d: OrderMessageData): string {
  const { storeLink, orderLink } = storeLinks(d);
  const name = (d.customerName ?? '').trim();
  const vars: Record<string, string> = {
    '{nome}': name,
    '{primeiro_nome}': name.split(/\s+/)[0] ?? '',
    '{loja}': d.storeName ?? '',
    '{link_loja}': storeLink,
    '{numero_pedido}': d.orderNumber != null ? String(d.orderNumber) : '',
    '{valor_total}': d.orderTotal != null ? brl(Number(d.orderTotal)) : '',
    '{itens_pedido}': d.orderItems ?? '',
    '{endereco_entrega}': d.deliveryAddress ?? '',
    '{tipo_entrega}': d.deliveryType === 'delivery' ? 'Delivery' : 'Retirada no Balcão',
    '{link_pedido}': orderLink,
    '{whatsapp_loja}': d.storePhone ?? '',
    '{saudacao}': d.greeting ?? '',
    '{tempo_estimado}': d.estimatedTime ?? '',
  };
  let out = template ?? '';
  for (const [k, v] of Object.entries(vars)) out = out.split(k).join(v);
  return out.replace(/\n{3,}/g, '\n\n').trim();
}
