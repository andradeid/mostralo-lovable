// Carrega faturas, lojas e planos; filtra faturas.
// Código movido da SubscriptionPaymentsManagementPage sem mudança de comportamento.
import { supabase } from "@/integrations/supabase/client";
import type { CouponInfo, Store } from "@/lib/subscriptionPayments/types";

export type UseInvoiceLoadersDeps = { [K in 'invoices' | 'setInvoices' | 'setFilteredInvoices' | 'setLoading' | 'statusFilter' | 'searchTerm' | 'stores' | 'setStores' | 'plans' | 'setPlans']: any };

export function useInvoiceLoaders(deps: UseInvoiceLoadersDeps) {
  const { invoices, setInvoices, setFilteredInvoices, setLoading, statusFilter, searchTerm, stores, setStores, plans, setPlans } = deps;
  const fetchInvoices = async () => {
    const { data } = await supabase
      .from('subscription_invoices')
      .select(`
        *,
        stores (
          name,
          profiles:owner_id (
            full_name,
            email
          )
        ),
        plans (name, price)
      `)
      .order('due_date', { ascending: false });

    if (data) {
      // Buscar informações de cupom para cada fatura via payment_approvals
      const invoicesWithCoupons = await Promise.all(
        data.map(async (invoice: any) => {
          // Buscar payment_approval da loja que tenha cupom
          const { data: approvalWithCoupon } = await supabase
            .from('payment_approvals')
            .select(`
              coupon_id,
              coupon_discount,
              payment_amount,
              coupons (
                code,
                name,
                discount_type,
                discount_value
              )
            `)
            .eq('store_id', invoice.store_id)
            .not('coupon_id', 'is', null)
            .eq('status', 'approved')
            .order('approved_at', { ascending: false })
            .limit(1)
            .single();

          let coupon_info: CouponInfo | null = null;
          
          if (approvalWithCoupon?.coupons) {
            const coupon = approvalWithCoupon.coupons as any;
            coupon_info = {
              coupon_id: approvalWithCoupon.coupon_id,
              coupon_code: coupon.code,
              coupon_name: coupon.name,
              discount_type: coupon.discount_type,
              discount_value: coupon.discount_value,
              discount_applied: approvalWithCoupon.coupon_discount || 0,
              original_price: invoice.plans?.price || invoice.amount + (approvalWithCoupon.coupon_discount || 0)
            };
          }

          return {
            ...invoice,
            coupon_info
          };
        })
      );

      setInvoices(invoicesWithCoupons as any);
    }
    setLoading(false);
  };

  const fetchStores = async () => {
    const { data } = await supabase
      .from('stores')
      .select('id, name, custom_monthly_price, discount_reason, plan_id')
      .order('name');
    
    if (data) {
      setStores(data as Store[]);
    }
  };

  const fetchPlans = async () => {
    const { data } = await supabase
      .from('plans')
      .select('id, name, price')
      .eq('status', 'active')
      .order('name');
    
    if (data) {
      setPlans(data);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    if (statusFilter !== "all") {
      filtered = filtered.filter(inv => inv.payment_status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(inv => 
        inv.stores?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.stores?.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.stores?.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredInvoices(filtered);
  };


  return {
    fetchInvoices,
    fetchStores,
    fetchPlans,
    filterInvoices,
  };
}
