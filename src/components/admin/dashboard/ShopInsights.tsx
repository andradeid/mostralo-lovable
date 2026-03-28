import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, ArrowRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface ShopInsightsProps {
  storeId: string | null;
}

export function ShopInsights({ storeId }: ShopInsightsProps) {
  const { data: insights } = useQuery({
    queryKey: ['shop-insights', storeId],
    queryFn: async () => {
      if (!storeId) return [];

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Pedidos hoje
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total, status, created_at')
        .eq('store_id', storeId)
        .gte('created_at', `${todayStr}T00:00:00`)
        .not('status', 'eq', 'cancelado');

      // Pedidos ontem
      const { data: yesterdayOrders } = await supabase
        .from('orders')
        .select('total')
        .eq('store_id', storeId)
        .gte('created_at', `${yesterdayStr}T00:00:00`)
        .lt('created_at', `${todayStr}T00:00:00`)
        .not('status', 'eq', 'cancelado');

      // Estoque baixo
      const { data: lowStock } = await supabase
        .rpc('count_low_stock_products', { p_store_id: storeId });

      const todayTotal = todayOrders?.reduce((acc, o) => acc + Number(o.total || 0), 0) || 0;
      const yesterdayTotal = yesterdayOrders?.reduce((acc, o) => acc + Number(o.total || 0), 0) || 0;
      const lowStockCount = Number(lowStock?.[0]?.low_stock_count) || 0;

      const result: Array<{
        icon: 'up' | 'down' | 'alert' | 'tip';
        text: string;
        cta?: { label: string; to: string };
      }> = [];

      // Comparação com ontem
      if (yesterdayTotal > 0) {
        const diff = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;
        if (diff > 0) {
          result.push({
            icon: 'up',
            text: `Hoje está ${Math.abs(diff).toFixed(0)}% melhor que ontem em vendas`,
          });
        } else if (diff < -10) {
          result.push({
            icon: 'down',
            text: `Vendas ${Math.abs(diff).toFixed(0)}% abaixo de ontem`,
            cta: { label: 'Ver relatórios', to: '/dashboard/reports' },
          });
        }
      }

      // Ticket médio
      const orderCount = todayOrders?.length || 0;
      if (orderCount > 0) {
        const avgTicket = todayTotal / orderCount;
        result.push({
          icon: 'tip',
          text: `Ticket médio de ${avgTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} hoje`,
        });
      }

      // Horário de pico
      if (todayOrders && todayOrders.length >= 3) {
        const hourCounts: Record<number, number> = {};
        for (const o of todayOrders) {
          const h = new Date(o.created_at).getHours();
          hourCounts[h] = (hourCounts[h] || 0) + 1;
        }
        const peakHour = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0];
        if (peakHour) {
          result.push({
            icon: 'tip',
            text: `Horário de pico: ${peakHour[0]}h com ${peakHour[1]} pedidos`,
          });
        }
      }

      // Estoque baixo
      if (lowStockCount > 0) {
        result.push({
          icon: 'alert',
          text: `${lowStockCount} produto(s) com estoque baixo`,
          cta: { label: 'Ver produtos', to: '/dashboard/products' },
        });
      }

      // Sem vendas
      if (orderCount === 0) {
        const hour = new Date().getHours();
        if (hour >= 10) {
          result.push({
            icon: 'down',
            text: 'Nenhuma venda registrada hoje ainda',
          });
        }
      }

      return result.slice(0, 3);
    },
    enabled: !!storeId,
    retry: 2,
    staleTime: 120_000,
  });

  if (!insights || insights.length === 0) return null;

  const iconMap = {
    up: <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />,
    down: <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />,
    alert: <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0" />,
    tip: <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />,
  };

  return (
    <Card className="border-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          Insights do dia
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {insights.map((insight, i) => (
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
            {iconMap[insight.icon]}
            <p className="text-sm flex-1 min-w-0">{insight.text}</p>
            {insight.cta && (
              <NavLink to={insight.cta.to}>
                <Button variant="ghost" size="sm" className="h-7 text-xs shrink-0 px-2">
                  {insight.cta.label}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </NavLink>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
