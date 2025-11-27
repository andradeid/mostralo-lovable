import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

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

export function MasterAdminKPIs() {
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
      // Buscar lojas ativas com planos
      const { data: activeStores } = await supabase
        .from('stores')
        .select(`
          id,
          status,
          plan_id,
          created_at,
          subscription_expires_at,
          plans:plan_id (
            price,
            billing_cycle
          )
        `)
        .eq('status', 'active');

      if (!activeStores) {
        setLoading(false);
        return;
      }

      // Calcular MRR (mensalizar todos os planos)
      let mrr = 0;
      activeStores.forEach(store => {
        const plan = (store as any).plans;
        if (plan) {
          const price = Number(plan.price);
          const cycle = plan.billing_cycle;
          
          // Converter para mensal
          if (cycle === 'monthly') {
            mrr += price;
          } else if (cycle === 'quarterly') {
            mrr += price / 3;
          } else if (cycle === 'biannual') {
            mrr += price / 6;
          } else if (cycle === 'annual') {
            mrr += price / 12;
          }
        }
      });

      const arr = mrr * 12;
      const avgTicket = activeStores.length > 0 ? mrr / activeStores.length : 0;

      // Calcular churn rate
      const { data: allStores } = await supabase
        .from('stores')
        .select('status');

      const totalStores = allStores?.length || 0;
      const inactiveStores = allStores?.filter(s => s.status === 'inactive').length || 0;
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
          plans:plan_id (
            price,
            billing_cycle
          )
        `)
        .eq('status', 'active')
        .lte('created_at', lastMonth.toISOString());

      let lastMonthMrr = 0;
      lastMonthStores?.forEach(store => {
        const plan = (store as any).plans;
        if (plan) {
          const price = Number(plan.price);
          const cycle = plan.billing_cycle;
          
          if (cycle === 'monthly') {
            lastMonthMrr += price;
          } else if (cycle === 'quarterly') {
            lastMonthMrr += price / 3;
          } else if (cycle === 'biannual') {
            lastMonthMrr += price / 6;
          } else if (cycle === 'annual') {
            lastMonthMrr += price / 12;
          }
        }
      });

      const lastMonthArr = lastMonthMrr * 12;
      const lastMonthAvgTicket = lastMonthStores?.length ? lastMonthMrr / lastMonthStores.length : 0;

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
      subtitle: 'Receita Mensal Recorrente',
      value: `R$ ${kpis.mrr.toFixed(2)}`,
      icon: DollarSign,
      trend: kpis.trends.mrr,
      color: 'text-green-600'
    },
    {
      title: 'ARR',
      subtitle: 'Receita Anual Recorrente',
      value: `R$ ${kpis.arr.toFixed(2)}`,
      icon: TrendingUp,
      trend: kpis.trends.arr,
      color: 'text-blue-600'
    },
    {
      title: 'Ticket Médio',
      subtitle: 'Por loja ativa',
      value: `R$ ${kpis.avgTicket.toFixed(2)}`,
      icon: CreditCard,
      trend: kpis.trends.avgTicket,
      color: 'text-purple-600'
    },
    {
      title: 'Churn Rate',
      subtitle: 'Taxa de cancelamento',
      value: `${kpis.churnRate.toFixed(1)}%`,
      icon: AlertCircle,
      trend: kpis.trends.churn,
      color: 'text-orange-600',
      invertTrend: true // Churn menor é melhor
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiCards.map((kpi, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{kpi.subtitle}</p>
            </div>
            <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <p className={`text-xs flex items-center mt-1 ${
              kpi.invertTrend 
                ? (kpi.trend <= 0 ? 'text-green-600' : 'text-red-600')
                : (kpi.trend >= 0 ? 'text-green-600' : 'text-red-600')
            }`}>
              {kpi.trend >= 0 ? (
                <TrendingUp className="w-3 h-3 mr-1" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-1" />
              )}
              {kpi.trend >= 0 ? '+' : ''}{kpi.trend.toFixed(1)}% vs mês anterior
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
