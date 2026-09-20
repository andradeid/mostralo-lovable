import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, AlertCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateMRR, calculateAvgTicket } from '@/utils/mrrCalculator';

interface KPIData {
  mrr: number;
  arr: number;
  avgTicket: number;
  churnRate: number;
  trends: {
    mrr: number;
    arr: number;
    avgTicket: number;
    churn: number;
  };
}

interface MasterAdminKPIsProps {
  compact?: boolean;
}

export function MasterAdminKPIs({ compact = false }: MasterAdminKPIsProps) {
  const [kpis, setKpis] = useState<KPIData>({
    mrr: 0,
    arr: 0,
    avgTicket: 0,
    churnRate: 0,
    trends: { mrr: 0, arr: 0, avgTicket: 0, churn: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      // Lojas faturáveis: ativas E com cobrança automática habilitada
      const { data: activeStores } = await supabase
        .from('stores')
        .select(`
          id,
          status,
          plan_id,
          created_at,
          custom_monthly_price,
          plans:plan_id (
            price,
            billing_cycle
          )
        `)
        .eq('status', 'active')
        .eq('billing_enabled', true);

      if (!activeStores) {
        setLoading(false);
        return;
      }

      // Buscar descontos de cupom por loja (maior desconto aplicado)
      const { data: couponDiscounts } = await supabase
        .from('payment_approvals')
        .select('store_id, coupon_discount')
        .not('store_id', 'is', null)
        .gt('coupon_discount', 0);

      const discountMap = new Map<string, number>();
      couponDiscounts?.forEach(pa => {
        if (pa.store_id) {
          const current = discountMap.get(pa.store_id) || 0;
          discountMap.set(pa.store_id, Math.max(current, Number(pa.coupon_discount || 0)));
        }
      });

      const mrr = calculateMRR(activeStores as any, discountMap);
      const arr = mrr * 12;
      const avgTicket = calculateAvgTicket(mrr, activeStores.length);

      // Churn sobre a mesma base filtrada (lojas faturáveis)
      const { data: billableStores } = await supabase
        .from('stores')
        .select('status')
        .eq('billing_enabled', true);

      const totalStores = billableStores?.length || 0;
      const inactiveStores = billableStores?.filter(s => s.status === 'inactive').length || 0;
      const churnRate = totalStores > 0 ? (inactiveStores / totalStores) * 100 : 0;

      // Calcular tendências (comparar com mês anterior)
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const { data: lastMonthStores } = await supabase
        .from('stores')
        .select(`
          id,
          status,
          plan_id,
          custom_monthly_price,
          plans:plan_id (
            price,
            billing_cycle
          )
        `)
        .eq('status', 'active')
        .eq('billing_enabled', true)
        .lte('created_at', lastMonth.toISOString());

      const lastMonthMrr = calculateMRR((lastMonthStores || []) as any, discountMap);
      const lastMonthArr = lastMonthMrr * 12;
      const lastMonthAvgTicket = calculateAvgTicket(lastMonthMrr, lastMonthStores?.length || 0);

      const trends = {
        mrr: lastMonthMrr > 0 ? ((mrr - lastMonthMrr) / lastMonthMrr) * 100 : 0,
        arr: lastMonthArr > 0 ? ((arr - lastMonthArr) / lastMonthArr) * 100 : 0,
        avgTicket: lastMonthAvgTicket > 0 ? ((avgTicket - lastMonthAvgTicket) / lastMonthAvgTicket) * 100 : 0,
        churn: 0 // Simplificado por enquanto
      };

      setKpis({
        mrr,
        arr,
        avgTicket,
        churnRate,
        trends
      });
    } catch (error) {
      console.error('Erro ao buscar KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      title: 'MRR',
      subtitle: 'Receita Mensal',
      value: `R$ ${kpis.mrr.toFixed(2)}`,
      icon: DollarSign,
      trend: kpis.trends.mrr,
      color: 'text-green-600',
      tooltip: 'Monthly Recurring Revenue: Soma do valor efetivo mensal de todas as lojas ativas. Considera preço personalizado (se houver), desconto de cupom, e converte planos trimestrais/anuais para valor mensal.'
    },
    {
      title: 'ARR',
      subtitle: 'Receita Anual',
      value: `R$ ${kpis.arr.toFixed(2)}`,
      icon: TrendingUp,
      trend: kpis.trends.arr,
      color: 'text-blue-600',
      tooltip: 'Annual Recurring Revenue: MRR × 12. Projeção da receita anual se todas as assinaturas atuais se mantiverem durante 12 meses.'
    },
    {
      title: 'Ticket Médio',
      subtitle: 'Por loja',
      value: `R$ ${kpis.avgTicket.toFixed(2)}`,
      icon: CreditCard,
      trend: kpis.trends.avgTicket,
      color: 'text-purple-600',
      tooltip: 'Valor médio pago por loja ativa por mês. Calculado como: MRR ÷ número de lojas ativas.'
    },
    {
      title: 'Churn',
      subtitle: 'Cancelamento',
      value: `${kpis.churnRate.toFixed(1)}%`,
      icon: AlertCircle,
      trend: kpis.trends.churn,
      color: 'text-orange-600',
      invertTrend: true,
      tooltip: 'Taxa de cancelamento: Percentual de lojas inativas em relação ao total. Calculado como: (lojas inativas ÷ total de lojas) × 100.'
    }
  ];

  // Grid responsivo: 1 coluna no mobile, 2 colunas no compact, 4 no desktop completo
  const gridClass = compact 
    ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' 
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4';

  if (loading) {
    return (
      <div className={gridClass}>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2 p-3 md:p-4">
              <Skeleton className="h-3 w-16" />
            </CardHeader>
            <CardContent className="p-3 md:p-4 pt-0">
              <Skeleton className="h-6 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={gridClass}>
      {kpiCards.map((kpi, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-1 p-3 md:p-4 md:pb-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <CardTitle className="text-xs sm:text-sm font-medium truncate">{kpi.title}</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      <p>{kpi.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{kpi.subtitle}</p>
            </div>
            <kpi.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${kpi.color} flex-shrink-0`} />
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-lg sm:text-xl md:text-2xl font-bold truncate">{kpi.value}</div>
            <p className={`text-[10px] sm:text-xs flex items-center mt-1 ${
              kpi.invertTrend 
                ? (kpi.trend <= 0 ? 'text-green-600' : 'text-red-600')
                : (kpi.trend >= 0 ? 'text-green-600' : 'text-red-600')
            }`}>
              {kpi.trend >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1 flex-shrink-0" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1 flex-shrink-0" />
              )}
              <span className="truncate">
                {kpi.trend >= 0 ? '+' : ''}{kpi.trend.toFixed(1)}% vs mês anterior
              </span>
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
