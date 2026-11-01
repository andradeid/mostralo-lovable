/**
 * Aviso "faltam R$ X para frete grátis" no carrinho e no resumo do checkout.
 * Só informa — não calcula desconto nem preço (isso continua no núcleo de promoções).
 * As regras de "promoção ativa agora" (status, período, dias e horário no fuso da loja),
 * tipo de entrega, itens elegíveis e limite de usos vêm do mesmo núcleo que o servidor usa.
 */
import {
  itemIsEligible,
  promotionActiveAt,
  round2,
  type CoreContext,
  type CoreItem,
  type CorePromotion,
  type DeliveryKind,
} from '../../supabase/functions/_shared/promotion-core';

export type FreeDeliveryProgress =
  | { state: 'none' }
  | { state: 'missing'; missing: number; minimum: number; promotionId: string }
  | { state: 'reached'; promotionId: string };

export interface FreeDeliveryInput {
  items: CoreItem[];
  /** Tipo de entrega. Mesa/retirada não têm frete → nada a mostrar. */
  deliveryType: DeliveryKind | 'table' | string;
  /** Tipo da promoção já aplicada ao pedido (uma por pedido), se houver. */
  appliedPromotionType?: string | null;
}

const num = (v: unknown): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

/** Promoção de frete grátis automática que valeria para este pedido, ignorando o pedido mínimo. */
export function freeDeliveryApplies(p: CorePromotion, input: FreeDeliveryInput, ctx: CoreContext): boolean {
  if (p.type !== 'free_delivery') return false;
  if (p.code) return false; // cupom: o cliente precisa digitar — não anunciar
  if (input.deliveryType !== 'delivery') return false;
  if (p.applies_to_delivery === false) return false;
  if (p.first_order_only && ctx.isFirstOrder !== true) return false; // sem saber se é 1ª compra, não promete
  if (p.max_uses_per_customer && ctx.customerUses != null && ctx.customerUses >= p.max_uses_per_customer) return false;
  if (p.max_uses && num(p.current_uses) >= p.max_uses) return false;
  if (!promotionActiveAt(p, ctx).ok) return false;
  if (p.scope !== 'all_products' && p.scope !== 'delivery_type') {
    if (!input.items.some(i => itemIsEligible(p, i))) return false;
  }
  return true;
}

/**
 * Situação do frete grátis para o pedido: quanto falta para a promoção de menor mínimo,
 * ou "atingido". Se outra promoção (não de frete) já está aplicada, não diz "você ganhou"
 * — vale uma promoção por pedido e o frete grátis poderia não ser a escolhida.
 */
export function freeDeliveryProgress(promotions: CorePromotion[], input: FreeDeliveryInput, ctx: CoreContext): FreeDeliveryProgress {
  const subtotal = input.items.reduce((s, i) => s + num(i.unitPrice) * num(i.quantity), 0);
  if (subtotal <= 0) return { state: 'none' };

  let reached: CorePromotion | null = null;
  let closest: { p: CorePromotion; minimum: number; missing: number } | null = null;
  for (const p of promotions) {
    if (!freeDeliveryApplies(p, input, ctx)) continue;
    const minimum = num(p.minimum_order_value);
    if (minimum <= 0 || subtotal + 0.001 >= minimum) {
      reached = reached ?? p;
      continue;
    }
    const missing = round2(minimum - subtotal);
    if (!closest || missing < closest.missing) closest = { p, minimum, missing };
  }

  if (reached) {
    const other = input.appliedPromotionType && input.appliedPromotionType !== 'free_delivery';
    return other ? { state: 'none' } : { state: 'reached', promotionId: reached.id };
  }
  if (closest) return { state: 'missing', missing: closest.missing, minimum: closest.minimum, promotionId: closest.p.id };
  return { state: 'none' };
}

/** "R$ 12,40" (sem depender de Intl, para ficar igual em qualquer ambiente). */
export function formatBRL(value: number): string {
  const [int, dec] = Math.abs(round2(value)).toFixed(2).split('.');
  const withDots = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${value < 0 ? '-' : ''}R$ ${withDots},${dec}`;
}

/** Texto da faixa; null quando não há nada a mostrar. */
export function freeDeliveryMessage(progress: FreeDeliveryProgress): string | null {
  if (progress.state === 'missing') return `Faltam ${formatBRL(progress.missing)} para frete grátis`;
  if (progress.state === 'reached') return 'Você ganhou frete grátis';
  return null;
}
