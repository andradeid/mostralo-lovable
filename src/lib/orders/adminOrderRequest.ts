/**
 * "Novo pedido" do painel: monta o corpo da função admin-create-order a partir do que está na tela.
 * Sem dependências do navegador (testável com node). Regras de preço no núcleo compartilhado
 * supabase/functions/_shared/admin-order.ts (o servidor confere pelo catálogo).
 */
import {
  adminOrderTotals,
  lineSubtotal,
  type AdminDeliveryType,
  type AdminOrderRequest,
  type AdminOrderSource,
  type AdminPaymentMethod,
  type AdminPaymentStatus,
} from '../../../supabase/functions/_shared/admin-order.ts';

export { catalogBasePrice, lineSubtotal } from '../../../supabase/functions/_shared/admin-order.ts';
export type { AdminOrderCreated, AdminOrderRequest } from '../../../supabase/functions/_shared/admin-order.ts';

/** Item como a tela guarda (mesma forma do OrderItem do ProductSelector). */
export interface ScreenOrderItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
  addons: { id: string; name: string; price: number; quantity: number }[];
}

export interface ScreenOrderState {
  storeId: string;
  source?: string;
  customer: { id: string; name: string; phone: string; email?: string | null; address?: string | null };
  items: ScreenOrderItem[];
  deliveryType: AdminDeliveryType;
  deliveryFee: number;
  paymentMethod: AdminPaymentMethod;
  paymentDetails: { card_type?: string } | null;
  paymentStatus: AdminPaymentStatus;
  notes: string;
  driverId: string | null;
}

/** Totais que a tela mostra (subtotal, taxa só no delivery, total). */
export function screenTotals(items: Pick<ScreenOrderItem, 'subtotal'>[], deliveryType: AdminDeliveryType, deliveryFee: number) {
  return adminOrderTotals(items.reduce((s, i) => s + (Number(i.subtotal) || 0), 0), deliveryType, deliveryFee);
}

/** Item com nova quantidade e subtotal recalculado (sem alterar o original). */
export function withQuantity<T extends ScreenOrderItem>(item: T, quantity: number): T {
  return { ...item, quantity, subtotal: lineSubtotal(item.unitPrice, item.addons, quantity) };
}

/** Corpo da função: só ids, quantidades e escolhas do lojista; preços dos itens o servidor tira do catálogo. */
export function buildAdminOrderRequest(s: ScreenOrderState): AdminOrderRequest {
  const isDelivery = s.deliveryType === 'delivery';
  const cardType = s.paymentDetails?.card_type;
  return {
    store_id: s.storeId,
    source: (s.source || 'manual') as AdminOrderSource,
    customer: {
      id: s.customer.id,
      name: s.customer.name,
      phone: s.customer.phone,
      email: s.customer.email ?? null,
      address: s.customer.address ?? null,
    },
    delivery_type: s.deliveryType,
    delivery_fee: isDelivery ? Number(s.deliveryFee) || 0 : 0,
    payment_method: s.paymentMethod,
    payment_details: s.paymentMethod === 'card' && (cardType === 'credit' || cardType === 'debit') ? { card_type: cardType } : null,
    payment_status: s.paymentStatus,
    notes: s.notes,
    driver_id: isDelivery ? s.driverId : null,
    items: s.items.map(i => ({
      product_id: i.productId,
      variant_id: i.variantId ?? null,
      quantity: i.quantity,
      notes: i.notes ?? null,
      addons: (i.addons ?? []).map(a => ({ id: a.id, quantity: a.quantity })),
    })),
  };
}

/** O total gravado ficou diferente do que a tela mostrava? (preço do catálogo mudou ou estava em oferta) */
export const totalDiffers = (shown: number, saved: number) => Math.abs((Number(shown) || 0) - (Number(saved) || 0)) >= 0.01;
