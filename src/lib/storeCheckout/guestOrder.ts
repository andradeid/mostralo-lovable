/**
 * Envio do pedido da loja (cardápio digital): identifica o cliente pelo telefone,
 * guarda o perfil no aparelho e cria o pedido na função create-guest-order-v3,
 * que confere preços, taxa e promoção no servidor (núcleo _shared/promotion-core).
 * Usado pelo diálogo de checkout da loja e pela página /checkout.
 */
import { supabase } from '@/integrations/supabase/client';
import { resilientEdgeFetch } from '@/lib/resilientFetch';

export const GUEST_ORDER_FUNCTION = 'create-guest-order-v3';

export interface IdentifiedCustomer {
  customerId: string;
  token: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  expiresAt: string | null;
}

/** Token do cliente salvo neste aparelho para a loja (ou undefined). */
export function savedDeviceToken(storeId: string): string | undefined {
  try {
    const raw = localStorage.getItem(`customer_${storeId}`);
    const token = raw ? JSON.parse(raw)?.token : undefined;
    return typeof token === 'string' && token ? token : undefined;
  } catch {
    return undefined;
  }
}

/** Resolve ou cria o cliente da loja pelo telefone (customer-auth-v2). null = falhou. */
export async function identifyCustomerByPhone(params: {
  storeId: string;
  phone: string;
  name: string;
  email?: string;
  address?: string;
}): Promise<IdentifiedCustomer | null> {
  const { data, error } = await supabase.functions.invoke('customer-auth-v2', {
    body: {
      action: 'identify-by-phone',
      // Token deste aparelho: o servidor reaproveita e "Meus pedidos" continua com o histórico daqui
      token: savedDeviceToken(params.storeId),
      phone: params.phone,
      store_id: params.storeId,
      name: params.name,
      email: params.email || undefined,
      address: params.address,
    },
  });
  if (error || data?.error || !data?.customer?.id) {
    console.error('[checkout] Erro ao identificar cliente:', error || data?.error);
    return null;
  }
  return {
    customerId: data.customer.id,
    token: data.token,
    name: data.customer.name,
    phone: data.customer.phone,
    email: data.customer.email ?? null,
    address: data.customer.address ?? null,
    expiresAt: data.expires_at ?? null,
  };
}

/** Perfil do cliente guardado no aparelho (pré-preenche o próximo pedido e abre "Meus pedidos"). */
export function saveCustomerProfile(
  storeId: string,
  customer: IdentifiedCustomer,
  extra: { address: string | null; latitude: number | null; longitude: number | null },
) {
  try {
    localStorage.setItem(`customer_${storeId}`, JSON.stringify({
      customer_id: customer.customerId,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: extra.address,
      latitude: extra.latitude,
      longitude: extra.longitude,
      token: customer.token,
      expires_at: customer.expiresAt,
      saved_at: new Date().toISOString(),
    }));
  } catch { /* armazenamento indisponível: segue sem perfil salvo */ }
}

export interface GuestOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string | null;
}

export interface GuestOrderPayload {
  customer_token: string;
  store_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_address: string | null;
  delivery_type: string;
  payment_method: string | null;
  payment_details: unknown;
  subtotal: number;
  delivery_fee: number;
  total: number;
  notes: string | null;
  scheduled_for: string | null;
  promotion_id: string | null;
  promotion_code: string | null;
  promotion_discount: number | null;
  is_outside_delivery_zone?: boolean;
  requires_zone_approval?: boolean;
  items: GuestOrderItem[];
}

export interface GuestOrderCreated {
  order_id: string;
  order_number: string;
  status: string;
  total?: number;
}

export type GuestOrderResult =
  | { kind: 'created'; order: GuestOrderCreated }
  /** Recusa do servidor com mensagem pronta (400 regra do banco / 409 preço, cupom, promoção) */
  | { kind: 'rejected'; status: number; message: string; code: string | null }
  /** Erro de rede/servidor, mas o pedido foi gravado (achado nos últimos 10 s) */
  | { kind: 'recovered'; order: { order_id: string; order_number: string } }
  | { kind: 'failed'; message: string };

/** Cria o pedido sem retry (evita duplicar). Em falha de rede, procura o pedido recém-gravado. */
export async function createGuestOrder(payload: GuestOrderPayload): Promise<GuestOrderResult> {
  const { data, error, timedOut, status, code } = await resilientEdgeFetch<GuestOrderCreated>(
    GUEST_ORDER_FUNCTION,
    payload as unknown as Record<string, unknown>,
    { timeoutMs: 30000, maxRetries: 1 },
  );
  if (data && !error) return { kind: 'created', order: data };

  console.error('[checkout] Erro na criação do pedido:', error, 'timedOut:', timedOut);
  if ((status === 400 || status === 409) && error) return { kind: 'rejected', status, message: error, code: code ?? null };

  if (payload.customer_phone) {
    const since = new Date(Date.now() - 10000).toISOString();
    const { data: existing } = await supabase
      .from('orders')
      .select('id, order_number')
      .eq('store_id', payload.store_id)
      .eq('customer_phone', payload.customer_phone)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) return { kind: 'recovered', order: { order_id: existing.id, order_number: existing.order_number } };
  }

  return {
    kind: 'failed',
    message: timedOut
      ? 'Servidor indisponível no momento. Por favor, aguarde alguns segundos e tente novamente.'
      : (error || 'Erro ao criar pedido'),
  };
}

/** Mensagem de recusa ligada a cupom/promoção (o servidor tirou a promoção). */
export const isPromotionRejection = (r: { status: number; message: string; code?: string | null }) =>
  r.status === 409 && (/^(promotion_|discount_)/.test(r.code ?? '') || /cupom|promo[çc][ãa]o/i.test(r.message));

/** Mensagem de recusa ligada a data/horário do agendamento. */
export const isScheduleRejection = (r: { status: number; message: string }) =>
  r.status === 400 && /hor[áa]rio|data|agendamento|dispon[íi]vel/i.test(r.message);
