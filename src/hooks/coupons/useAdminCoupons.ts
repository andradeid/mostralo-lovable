// Dados e ações da tela de cupons do master: carregar cupons e planos, abrir o
// formulário (novo, editar, duplicar), salvar, excluir e copiar código.
// Código movido da AdminCouponsPage sem mudança.
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  buildCouponRecord,
  couponToFormData,
  duplicateCouponFormData,
  type Coupon,
  type FormDiscountType,
  type Plan,
} from '@/lib/coupons/adminCoupons';

export function useAdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage' as FormDiscountType,
    discount_value: 0,
    final_price: 0,
    applies_to: 'all_plans' as 'all_plans' | 'specific_plans',
    plan_ids: [] as string[],
    max_uses: null as number | null,
    max_uses_per_user: 1,
    start_date: null as string | null,
    end_date: null as string | null,
    status: 'active' as 'active' | 'inactive' | 'expired',
    is_public: false,
    promotion_label: 'OFERTA LIMITADA',
    show_countdown: true,
    duration_type: 'once' as 'once' | 'multiple' | 'forever',
    duration_months: 1 as number | null,
  });

  useEffect(() => {
    fetchCoupons();
    fetchPlans();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false }) as { data: any[] | null; error: any };

      if (error) throw error;
      setCoupons((data || []) as any);
    } catch (error) {
      console.error('Erro ao buscar cupons:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os cupons.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, price')
        .eq('status', 'active');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
    }
  };

  const handleNew = () => {
    setSelectedCoupon(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      final_price: 0,
      applies_to: 'all_plans',
      plan_ids: [],
      max_uses: null,
      max_uses_per_user: 1,
      start_date: null,
      end_date: null,
      status: 'active',
      is_public: false,
      promotion_label: 'OFERTA LIMITADA',
      show_countdown: true,
      duration_type: 'once',
      duration_months: 1,
    });
    setDialogOpen(true);
  };

  const handleEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setFormData(couponToFormData(coupon));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const dataToSave = buildCouponRecord(formData, plans);

      if (selectedCoupon) {
        const { error } = await (supabase as any)
          .from('coupons')
          .update(dataToSave)
          .eq('id', selectedCoupon.id);

        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Cupom atualizado!' });
      } else {
        const { error } = await (supabase as any)
          .from('coupons')
          .insert([dataToSave]);

        if (error) throw error;
        toast({ title: 'Sucesso', description: 'Cupom criado!' });
      }

      setDialogOpen(false);
      fetchCoupons();
    } catch (error: any) {
      console.error('Erro ao salvar cupom:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o cupom.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) return;

    try {
      const { error } = await (supabase as any)
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Sucesso', description: 'Cupom excluído!' });
      fetchCoupons();
    } catch (error) {
      toast({ title: 'Erro', description: 'Não foi possível excluir o cupom.', variant: 'destructive' });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copiado!', description: `Código ${code} copiado para área de transferência.` });
  };

  const handleDuplicate = (coupon: Coupon) => {
    setSelectedCoupon(null);
    setFormData(duplicateCouponFormData(coupon));
    setDialogOpen(true);
  };

  return {
    coupons,
    plans,
    loading,
    dialogOpen,
    setDialogOpen,
    selectedCoupon,
    saving,
    formData,
    setFormData,
    handleNew,
    handleEdit,
    handleSave,
    handleDelete,
    copyCode,
    handleDuplicate,
  };
}

export type CouponFormState = ReturnType<typeof useAdminCoupons>['formData'];
export type SetCouponFormState = ReturnType<typeof useAdminCoupons>['setFormData'];
