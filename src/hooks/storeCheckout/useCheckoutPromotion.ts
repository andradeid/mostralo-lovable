import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  calculatePromotionDiscount,
  fetchFreshPromotion,
  findApplicablePromotions,
  findBestPromotion,
  isPricedInPromotion,
  validatePromotionCode,
} from '@/utils/promotionCalculator';
import { getStorePromotions } from '@/hooks/useStorePromotions';
import { publicSupabase } from '@/integrations/supabase/publicClient';
import type { OrderData, Promotion } from '@/types/promotions';
import type { CartItem } from '@/contexts/CartContext';

/** Produto que pode ir de brinde no pedido. */
export interface GiftOption {
  id: string;
  name: string;
  image_url?: string | null;
}

interface Params {
  open: boolean;
  storeId: string;
  items: CartItem[];
  subtotal: number;
  deliveryType: string;
  /** Taxa de entrega já resolvida (zona ou padrão; 0 na retirada) */
  deliveryFee: number;
  /** Muda quando a zona de entrega muda (revalida a promoção) */
  zoneKey?: unknown;
}

/**
 * Promoção do pedido no checkout da loja: uma por pedido (a automática de maior desconto
 * ou o cupom, se der mais). Regras no núcleo único (_shared/promotion-core) via
 * promotionCalculator — as mesmas que o servidor confere ao gravar o pedido.
 */
export function useCheckoutPromotion({ open, storeId, items, subtotal, deliveryType, deliveryFee, zoneKey }: Params) {
  const queryClient = useQueryClient();
  const [promotionCode, setPromotionCode] = useState('');
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);
  const [promotionDiscount, setPromotionDiscount] = useState(0);
  const [promotionTotalSavings, setPromotionTotalSavings] = useState(0);
  const [isApplyingPromotion, setIsApplyingPromotion] = useState(false);
  const [autoPromotionChecked, setAutoPromotionChecked] = useState(false);
  // Brinde: ids que a promoção permite, os produtos disponíveis e o escolhido pelo cliente
  const [giftIds, setGiftIds] = useState<string[]>([]);
  const [giftOptions, setGiftOptions] = useState<GiftOption[]>([]);
  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);

  const orderData: OrderData = useMemo(() => ({
    items: items.map(item => ({
      id: item.id.includes('_') ? item.id.split('_')[0] : item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      category_id: item.category_id ?? undefined,
    })),
    subtotal,
    deliveryType: deliveryType as OrderData['deliveryType'],
    deliveryFee,
    storeId,
  }), [items, subtotal, deliveryType, deliveryFee, storeId]);

  const clearPromotion = useCallback(() => {
    setAppliedPromotion(null);
    setPromotionDiscount(0);
    setPromotionTotalSavings(0);
    setGiftIds([]);
  }, []);

  const giftKey = giftIds.join(',');
  // Nome e foto dos produtos de brinde (só os disponíveis da loja)
  useEffect(() => {
    let alive = true;
    if (giftIds.length === 0) { setGiftOptions([]); setSelectedGiftId(null); return; }
    (async () => {
      const { data } = await publicSupabase
        .from('products')
        .select('id, name, image_url, is_available, store_id')
        .in('id', giftIds);
      if (!alive) return;
      const list = (data ?? [])
        .filter((p: any) => p.store_id === storeId && p.is_available !== false)
        .sort((a: any, b: any) => giftIds.indexOf(a.id) - giftIds.indexOf(b.id))
        .map((p: any) => ({ id: p.id, name: p.name, image_url: p.image_url }));
      setGiftOptions(list);
      setSelectedGiftId((cur) => (cur && list.some((o) => o.id === cur) ? cur : list[0]?.id ?? null));
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [giftKey, storeId]);

  const findAutoPromotions = useCallback(async (silent = false) => {
    try {
      const cached = await getStorePromotions(queryClient, storeId);
      // Promoções "no preço" já estão no valor do item; aqui só as "no pedido"
      const orderLevel = cached.filter(p => !isPricedInPromotion(p));
      const applicable = await findApplicablePromotions(storeId, orderData, orderLevel);
      if (applicable.length > 0) {
        const best = await findBestPromotion(applicable, orderData);
        if (best) {
          const result = await calculatePromotionDiscount(best, orderData);
          if (result.isValid) {
            setAppliedPromotion(best);
            setPromotionDiscount(result.discount);
            setPromotionTotalSavings(result.totalSavings);
            setGiftIds(result.giftProductIds ?? []);
            if (!silent) toast.success('🎉 Promoção aplicada automaticamente!', { description: result.message });
          }
        }
      }
      setAutoPromotionChecked(true);
    } catch (error) {
      console.error('Erro ao buscar promoções:', error);
    }
  }, [queryClient, storeId, orderData]);

  /** Aplica o cupom digitado (ou o informado, ex.: cupom guardado de um link). */
  const applyPromotionCode = useCallback(async (codeArg?: string) => {
    const code = (codeArg ?? promotionCode).trim();
    if (!code) {
      toast.error('Digite um código de promoção');
      return;
    }
    setIsApplyingPromotion(true);
    try {
      const promotion = await validatePromotionCode(code, storeId);
      if (!promotion) {
        toast.error('Código de promoção inválido ou expirado');
        return;
      }
      const result = await calculatePromotionDiscount(promotion, orderData);
      if (!result.isValid) {
        toast.error(result.message);
        return;
      }
      // Já há promoção automática: só troca se o cupom der desconto maior (uma por pedido)
      if (appliedPromotion && !appliedPromotion.code && appliedPromotion.id !== promotion.id) {
        const current = Number(promotionTotalSavings || promotionDiscount || 0);
        const coupon = Number(result.totalSavings ?? result.discount ?? 0);
        if (coupon <= current) {
          toast.info('A promoção automática já dá um desconto maior que este cupom. Mantivemos a melhor para você.');
          return;
        }
      }
      setAppliedPromotion(promotion);
      setPromotionDiscount(result.discount);
      setPromotionTotalSavings(result.totalSavings);
      setGiftIds(result.giftProductIds ?? []);
      toast.success(result.message);
    } catch (error) {
      console.error('Erro ao aplicar promoção:', error);
      toast.error('Erro ao aplicar promoção');
    } finally {
      setIsApplyingPromotion(false);
    }
  }, [promotionCode, storeId, orderData, appliedPromotion, promotionTotalSavings, promotionDiscount]);

  const removePromotion = useCallback(() => {
    clearPromotion();
    setPromotionCode('');
    toast.info('Promoção removida');
  }, [clearPromotion]);

  /** Servidor recusou a promoção: tira sem aviso extra (a mensagem do servidor já foi mostrada). */
  const dropPromotion = useCallback(() => {
    clearPromotion();
    setPromotionCode('');
  }, [clearPromotion]);

  // Promoção automática na primeira vez que o checkout abre com itens
  useEffect(() => {
    if (open && !autoPromotionChecked && items.length > 0) findAutoPromotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items, autoPromotionChecked]);

  // Revalida ao mudar entrega/retirada, itens ou zona de entrega
  useEffect(() => {
    if (!open || items.length === 0) return;
    (async () => {
      if (appliedPromotion) {
        const result = await calculatePromotionDiscount(appliedPromotion, orderData);
        if (!result.isValid || (result.discount <= 0 && !(result.giftProductIds?.length))) {
          clearPromotion();
          toast.info('Promoção removida (não se aplica mais)');
        } else {
          setPromotionDiscount(result.discount);
          setPromotionTotalSavings(result.totalSavings);
          setGiftIds(result.giftProductIds ?? []);
        }
      } else {
        findAutoPromotions(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryType, items, open, zoneKey]);

  /** Conferência final com a promoção buscada de novo no banco, logo antes de enviar. */
  const finalizePromotion = useCallback(async (): Promise<{ promotion: Promotion | null; discount: number; giftProductId: string | null }> => {
    if (!appliedPromotion) return { promotion: null, discount: 0, giftProductId: null };
    const fresh = (await fetchFreshPromotion(appliedPromotion.id, { storeId, code: appliedPromotion.code })) ?? { ...appliedPromotion, status: 'expired' as const };
    const check = await calculatePromotionDiscount(fresh, orderData);
    const freshGifts = check.giftProductIds ?? [];
    const giftProductId = selectedGiftId && freshGifts.includes(selectedGiftId) ? selectedGiftId : null;
    if (!check.isValid || (check.discount <= 0 && !giftProductId)) return { promotion: null, discount: 0, giftProductId: null };
    return { promotion: appliedPromotion, discount: check.discount, giftProductId };
  }, [appliedPromotion, orderData, storeId, selectedGiftId]);

  return {
    promotionCode,
    setPromotionCode,
    appliedPromotion,
    promotionDiscount,
    promotionTotalSavings,
    isApplyingPromotion,
    applyPromotionCode,
    removePromotion,
    dropPromotion,
    finalizePromotion,
    giftOptions,
    selectedGiftId,
    setSelectedGiftId,
  };
}
