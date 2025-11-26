import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CouponValidationResult {
  isValid: boolean;
  coupon: any | null;
  discountAmount: number;
  finalPrice: number;
  error: string | null;
}

export const useCouponValidation = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validateCoupon = async (
    code: string,
    planId: string,
    planPrice: number,
    userId?: string
  ): Promise<CouponValidationResult> => {
    setLoading(true);

    try {
      // Buscar cupom pelo código
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (couponError || !coupon) {
        return {
          isValid: false,
          coupon: null,
          discountAmount: 0,
          finalPrice: planPrice,
          error: 'Cupom não encontrado'
        };
      }

      // Verificar status
      if (coupon.status !== 'active') {
        return {
          isValid: false,
          coupon: null,
          discountAmount: 0,
          finalPrice: planPrice,
          error: coupon.status === 'expired' ? 'Cupom expirado' : 'Cupom inativo'
        };
      }

      // Verificar datas
      const now = new Date();
      if (coupon.start_date && new Date(coupon.start_date) > now) {
        return {
          isValid: false,
          coupon: null,
          discountAmount: 0,
          finalPrice: planPrice,
          error: 'Este cupom ainda não está disponível'
        };
      }

      if (coupon.end_date && new Date(coupon.end_date) < now) {
        return {
          isValid: false,
          coupon: null,
          discountAmount: 0,
          finalPrice: planPrice,
          error: 'Cupom expirado'
        };
      }

      // Verificar limite de usos
      if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
        return {
          isValid: false,
          coupon: null,
          discountAmount: 0,
          finalPrice: planPrice,
          error: 'Limite de usos do cupom atingido'
        };
      }

      // Verificar se aplica ao plano
      if (coupon.applies_to === 'specific_plans') {
        if (!coupon.plan_ids || !coupon.plan_ids.includes(planId)) {
          return {
            isValid: false,
            coupon: null,
            discountAmount: 0,
            finalPrice: planPrice,
            error: 'Este cupom não é válido para o plano selecionado'
          };
        }
      }

      // Verificar uso por usuário (se tiver userId)
      if (userId) {
        const { data: usages, error: usageError } = await supabase
          .from('coupon_usages')
          .select('id')
          .eq('coupon_id', coupon.id)
          .eq('user_id', userId);

        if (usageError) {
          console.error('Erro ao verificar uso do cupom:', usageError);
        }

        if (usages && usages.length >= coupon.max_uses_per_user) {
          return {
            isValid: false,
            coupon: null,
            discountAmount: 0,
            finalPrice: planPrice,
            error: 'Você já utilizou este cupom o máximo de vezes permitido'
          };
        }
      }

      // Calcular desconto
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (planPrice * coupon.discount_value) / 100;
      } else {
        discountAmount = coupon.discount_value;
      }

      // Garantir que o desconto não seja maior que o preço
      discountAmount = Math.min(discountAmount, planPrice);

      const finalPrice = planPrice - discountAmount;

      return {
        isValid: true,
        coupon,
        discountAmount,
        finalPrice,
        error: null
      };

    } catch (error: any) {
      console.error('Erro ao validar cupom:', error);
      return {
        isValid: false,
        coupon: null,
        discountAmount: 0,
        finalPrice: planPrice,
        error: 'Erro ao validar cupom. Tente novamente.'
      };
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async (
    couponId: string,
    userId: string | null,
    customerId: string | null,
    discountApplied: number,
    originalPrice: number,
    finalPrice: number
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('coupon_usages')
        .insert([
          {
            coupon_id: couponId,
            user_id: userId,
            customer_id: customerId,
            discount_applied: discountApplied,
            original_price: originalPrice,
            final_price: finalPrice,
            ip_address: null, // Pode ser obtido via API
            user_agent: navigator.userAgent
          }
        ]);

      if (error) {
        console.error('Erro ao registrar uso do cupom:', error);
        return false;
      }

      toast({
        title: 'Cupom Aplicado!',
        description: `Desconto de R$ ${discountApplied.toFixed(2)} aplicado com sucesso!`,
      });

      return true;
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
      return false;
    }
  };

  return {
    validateCoupon,
    applyCoupon,
    loading
  };
};

