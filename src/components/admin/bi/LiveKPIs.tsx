import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, DollarSign, TrendingUp, Users, Target, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface KPIData {
  activeStores: number;
  currentMRR: number;
  projectedARR: number;
  avgTicket: number;
  churnRate: number;
  activeSalespeople: number;
  pendingSalespeople: number;
  totalSalespeople: number;
  conversionRate: number;
}

export function LiveKPIs() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      // Lojas ativas
      const { count: activeStores } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // MRR atual (soma dos planos das lojas ativas com preços customizados e cupons)
      const { data: storesWithPlans } = await supabase
        .from('stores')
        .select('id, plan_id, custom_monthly_price, plans:plan_id(price)')
        .eq('status', 'active');

      // Buscar descontos de cupom por loja
      const { data: couponDiscounts } = await supabase
        .from('payment_approvals')
        .select('store_id, coupon_discount')
        .not('store_id', 'is', null)
        .gt('coupon_discount', 0);

      // Criar mapa de desconto por store_id
      const discountMap = new Map<string, number>();
      couponDiscounts?.forEach(pa => {
        if (pa.store_id) {
          const current = discountMap.get(pa.store_id) || 0;
          discountMap.set(pa.store_id, Math.max(current, Number(pa.coupon_discount || 0)));
        }
      });

      const currentMRR = storesWithPlans?.reduce((sum, store: any) => {
        const planPrice = Number(store.plans?.price || 0);
        const couponDiscount = discountMap.get(store.id) || 0;
        
        // Prioridade: custom_monthly_price > (plan_price - coupon_discount) > plan_price
        const effectivePrice = store.custom_monthly_price 
          ? Number(store.custom_monthly_price)
          : Math.max(0, planPrice - couponDiscount);
        return sum + effectivePrice;
      }, 0) || 0;

      const projectedARR = currentMRR * 12;
      const avgTicket = activeStores ? currentMRR / activeStores : 0;

      // Vendedores
      const { data: salespeople } = await supabase
        .from('salespeople')
        .select('status');

      const activeSalespeople = salespeople?.filter(s => s.status === 'active').length || 0;
      const pendingSalespeople = salespeople?.filter(s => s.status === 'pending_approval' || s.status === 'pending_contract').length || 0;
      const totalSalespeople = salespeople?.length || 0;

      // Conversão de leads (aprovados vs total cadastrados)
      const { count: totalApprovals } = await supabase
        .from('payment_approvals')
        .select('*', { count: 'exact', head: true });

      const { count: approvedApprovals } = await supabase
        .from('payment_approvals')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const conversionRate = totalApprovals ? ((approvedApprovals || 0) / totalApprovals) * 100 : 0;

      // Churn rate (lojas inativas vs total)
      const { count: totalStores } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true });

      const churnRate = totalStores ? (((totalStores - (activeStores || 0)) / totalStores) * 100) : 0;

      setKpis({
        activeStores: activeStores || 0,
        currentMRR,
        projectedARR,
        avgTicket,
        churnRate,
        activeSalespeople,
        pendingSalespeople,
        totalSalespeople,
        conversionRate
      });
    } catch (error) {
      console.error('Erro ao buscar KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-2 md:gap-3 grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-4 md:pb-2">
              <div className="h-3 md:h-4 bg-muted rounded w-16 md:w-24" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-4 md:pt-0">
              <div className="h-5 md:h-8 bg-muted rounded w-20 md:w-32 mb-1 md:mb-2" />
              <div className="h-2 md:h-3 bg-muted rounded w-12 md:w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!kpis) return null;

  const kpiCards = [
    {
      title: "Lojas Ativas",
      value: kpis.activeStores.toString(),
      subtitle: `Churn: ${kpis.churnRate.toFixed(1)}%`,
      icon: Store
    },
    {
      title: "MRR Atual",
      value: `R$ ${kpis.currentMRR.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      subtitle: "Receita Mensal",
      icon: DollarSign
    },
    {
      title: "ARR Projetado",
      value: `R$ ${kpis.projectedARR.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      subtitle: "Receita Anual",
      icon: TrendingUp
    },
    {
      title: "Ticket Médio",
      value: `R$ ${kpis.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      subtitle: "Por loja/mês",
      icon: Target
    },
    {
      title: "Vendedores",
      value: kpis.activeSalespeople.toString(),
      subtitle: `${kpis.pendingSalespeople} pendentes`,
      icon: UserCheck
    },
    {
      title: "Total Vendedores",
      value: kpis.totalSalespeople.toString(),
      subtitle: "Cadastrados",
      icon: Users
    },
    {
      title: "Conversão",
      value: `${kpis.conversionRate.toFixed(1)}%`,
      subtitle: "Leads aprovados",
      icon: TrendingUp
    },
    {
      title: "Valuation",
      value: `R$ ${(kpis.projectedARR * 5).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      subtitle: "5x ARR",
      icon: DollarSign
    }
  ];

  return (
    <div className="grid gap-2 md:gap-3 grid-cols-2 lg:grid-cols-4">
      {kpiCards.map((kpi, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-4 md:pb-2">
            <CardTitle className="text-[10px] md:text-xs font-medium truncate">{kpi.title}</CardTitle>
            <kpi.icon className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-4 md:pt-0">
            <div className="text-base md:text-xl lg:text-2xl font-bold truncate">{kpi.value}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground truncate">
              {kpi.subtitle}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
