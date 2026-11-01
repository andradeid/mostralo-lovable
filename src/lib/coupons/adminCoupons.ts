// Regras puras da tela de cupons do master (src/pages/admin/AdminCouponsPage.tsx):
// formulário a partir do cupom, desconto por preço final, registro gravado,
// status calculado pelas datas, filtros e números dos cards.
// Mesma regra que ficava dentro da página.

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  applies_to: 'all_plans' | 'specific_plans';
  plan_ids: string[];
  max_uses: number | null;
  max_uses_per_user: number;
  used_count: number;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'inactive' | 'expired';
  is_public: boolean;
  promotion_label: string;
  show_countdown: boolean;
  duration_type: 'once' | 'multiple' | 'forever';
  duration_months: number | null;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
}

// Tipo interno para o formulário (inclui final_price)
export type FormDiscountType = 'percentage' | 'fixed' | 'final_price';

export interface CouponFormData {
  code: string;
  name: string;
  description: string;
  discount_type: FormDiscountType;
  discount_value: number;
  final_price: number;
  applies_to: 'all_plans' | 'specific_plans';
  plan_ids: string[];
  max_uses: number | null;
  max_uses_per_user: number;
  start_date: string | null;
  end_date: string | null;
  status: 'active' | 'inactive' | 'expired';
  is_public: boolean;
  promotion_label: string;
  show_countdown: boolean;
  duration_type: 'once' | 'multiple' | 'forever';
  duration_months: number | null;
}

export type CouponComputedStatus = 'active' | 'inactive' | 'expired' | 'scheduled';

// Formulário preenchido para editar um cupom
export const couponToFormData = (coupon: Coupon): CouponFormData => ({
  code: coupon.code,
  name: coupon.name,
  description: coupon.description || '',
  discount_type: coupon.discount_type,
  discount_value: coupon.discount_value,
  final_price: 0,
  applies_to: coupon.applies_to,
  plan_ids: coupon.plan_ids || [],
  max_uses: coupon.max_uses,
  max_uses_per_user: coupon.max_uses_per_user,
  start_date: coupon.start_date,
  end_date: coupon.end_date,
  status: coupon.status,
  is_public: coupon.is_public,
  promotion_label: coupon.promotion_label,
  show_countdown: coupon.show_countdown,
  duration_type: coupon.duration_type || 'once',
  duration_months: coupon.duration_months || 1,
});

// Formulário de um novo cupom copiado de outro (sem datas, ativo e não público)
export const duplicateCouponFormData = (coupon: Coupon): CouponFormData => ({
  code: coupon.code + '_COPY',
  name: coupon.name + ' (Cópia)',
  description: coupon.description || '',
  discount_type: coupon.discount_type,
  discount_value: coupon.discount_value,
  final_price: 0,
  applies_to: coupon.applies_to,
  plan_ids: coupon.plan_ids || [],
  max_uses: coupon.max_uses,
  max_uses_per_user: coupon.max_uses_per_user,
  start_date: null,
  end_date: null,
  status: 'active',
  is_public: false,
  promotion_label: coupon.promotion_label,
  show_countdown: coupon.show_countdown,
  duration_type: coupon.duration_type || 'once',
  duration_months: coupon.duration_months || 1,
});

// Calcula o desconto baseado no preço final
export const getCalculatedDiscount = (formData: CouponFormData, plans: Plan[]) => {
  if (formData.discount_type !== 'final_price') return null;
  if (formData.plan_ids.length !== 1) return null;

  const selectedPlan = plans.find(p => p.id === formData.plan_ids[0]);
  if (!selectedPlan) return null;

  const discount = selectedPlan.price - formData.final_price;
  const percentage = ((discount / selectedPlan.price) * 100).toFixed(1);

  return {
    originalPrice: selectedPlan.price,
    finalPrice: formData.final_price,
    discount,
    percentage,
    planName: selectedPlan.name,
    isValid: formData.final_price > 0 && formData.final_price < selectedPlan.price
  };
};

// Registro gravado em coupons (lança erro se "Preço Final" estiver sem plano)
export const buildCouponRecord = (formData: CouponFormData, plans: Plan[]) => {
  // Se for preço final, converter para desconto fixo
  let dataToSave: any = {
    code: formData.code.toUpperCase().replace(/\s/g, ''),
    name: formData.name,
    description: formData.description,
    applies_to: formData.applies_to,
    plan_ids: formData.plan_ids,
    max_uses: formData.max_uses,
    max_uses_per_user: formData.max_uses_per_user,
    start_date: formData.start_date,
    end_date: formData.end_date,
    status: formData.status,
    is_public: formData.is_public,
    promotion_label: formData.promotion_label,
    show_countdown: formData.show_countdown,
    duration_type: formData.duration_type,
    duration_months: formData.duration_type === 'forever' ? null : (formData.duration_type === 'once' ? 1 : formData.duration_months),
  };

  // Auto-ajustar max_uses_per_user baseado na duração
  if (formData.duration_type === 'once') {
    dataToSave.max_uses_per_user = 1;
  } else if (formData.duration_type === 'multiple') {
    dataToSave.max_uses_per_user = formData.duration_months || 1;
  } else if (formData.duration_type === 'forever') {
    dataToSave.max_uses_per_user = 0; // 0 = ilimitado
  }

  if (formData.discount_type === 'final_price') {
    // Converter preço final para desconto fixo
    const selectedPlan = plans.find(p => p.id === formData.plan_ids[0]);
    if (!selectedPlan) {
      throw new Error('Selecione um plano específico para usar Preço Final');
    }
    const calculatedDiscount = selectedPlan.price - formData.final_price;
    dataToSave.discount_type = 'fixed';
    dataToSave.discount_value = calculatedDiscount;
  } else {
    dataToSave.discount_type = formData.discount_type;
    dataToSave.discount_value = formData.discount_value;
  }

  return dataToSave;
};

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price);
};

// Computed status que considera datas para "agendado" e "expirado"
export const getComputedStatus = (coupon: Coupon, now: Date = new Date()): CouponComputedStatus => {
  if (coupon.status === 'inactive') return 'inactive';
  if (coupon.end_date && new Date(coupon.end_date) < now) return 'expired';
  if (coupon.start_date && new Date(coupon.start_date) > now) return 'scheduled';
  if (coupon.status === 'expired') return 'expired';
  return 'active';
};

export const getStatusConfig = (status: string) => {
  const configs: Record<string, { label: string; className: string; dot: string }> = {
    active: { label: 'Ativo', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
    inactive: { label: 'Inativo', className: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' },
    expired: { label: 'Expirado', className: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20', dot: 'bg-zinc-400' },
    scheduled: { label: 'Agendado', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20', dot: 'bg-amber-500' },
  };
  return configs[status] || configs.inactive;
};

// Números dos cards do topo
export const getCouponStats = (coupons: Coupon[]) => {
  const activeCoupons = coupons.filter(c => getComputedStatus(c) === 'active').length;
  const scheduledCoupons = coupons.filter(c => getComputedStatus(c) === 'scheduled').length;
  const totalUses = coupons.reduce((sum, c) => sum + c.used_count, 0);
  const totalMaxUses = coupons.reduce((sum, c) => sum + (c.max_uses || 0), 0);
  const conversionRate = totalMaxUses > 0 ? ((totalUses / totalMaxUses) * 100).toFixed(1) : '—';
  return { activeCoupons, scheduledCoupons, totalUses, conversionRate };
};

// Filtros aplicados
export const filterCoupons = (coupons: Coupon[], filterStatus: string, filterDiscountType: string) =>
  coupons.filter(coupon => {
    const computedStatus = getComputedStatus(coupon);
    if (filterStatus !== 'all' && computedStatus !== filterStatus) return false;
    if (filterDiscountType !== 'all' && coupon.discount_type !== filterDiscountType) return false;
    return true;
  });
