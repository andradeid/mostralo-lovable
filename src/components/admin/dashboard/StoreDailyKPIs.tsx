import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, ShoppingCart, Wallet, AlertTriangle } from "lucide-react";
import { useDashboardOrders } from "@/hooks/useDashboardOrders";

interface StoreDailyKPIsProps {
  storeId: string | null;
}

export function StoreDailyKPIs({ storeId }: StoreDailyKPIsProps) {
  const { data: dashOrders, isLoading: loadingOrders } = useDashboardOrders(storeId);

  // Apenas dados complementares que o hook consolidado não tem
  const { data: extraStats, isLoading: loadingExtra } = useQuery({
    queryKey: ['store-daily-kpis-extra', storeId],
    queryFn: async () => {
      if (!storeId) return null;

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Pedidos de ontem para comparação + estoque baixo (em paralelo)
      const [{ data: yesterdayOrders }, { data: stockData }] = await Promise.all([
        supabase
          .from('orders')
          .select('total')
          .eq('store_id', storeId)
          .gte('created_at', `${yesterdayStr}T00:00:00`)
          .lt('created_at', `${today}T00:00:00`)
          .not('status', 'eq', 'cancelado'),
        supabase.rpc('count_low_stock_products', { p_store_id: storeId }),
      ]);

      const yesterdayTotal = yesterdayOrders?.reduce((acc, o) => acc + Number(o.total || 0), 0) || 0;
      const lowStockCount = Number(stockData?.[0]?.low_stock_count) || 0;

      return { yesterdayTotal, lowStockCount };
    },
    enabled: !!storeId,
    staleTime: 300_000, // 5 min
    retry: 2,
  });

  const isLoading = loadingOrders || loadingExtra;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4"><Skeleton className="h-16 w-full" /></Card>
        ))}
      </div>
    );
  }

  const todayTotal = dashOrders?.revenueToday || 0;
  const orderCount = dashOrders?.orderCount || 0;
  const avgTicket = dashOrders?.avgTicket || 0;
  const yesterdayTotal = extraStats?.yesterdayTotal || 0;
  const lowStockCount = extraStats?.lowStockCount || 0;

  let growthPercent = 0;
  if (yesterdayTotal > 0) {
    growthPercent = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;
  } else if (todayTotal > 0) {
    growthPercent = 100;
  }

  const kpis = [
    {
      label: "Vendas Hoje",
      value: `R$ ${todayTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      change: growthPercent,
      showChange: true
    },
    {
      label: "Pedidos", value: orderCount, icon: ShoppingCart,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      label: "Ticket Médio",
      value: `R$ ${avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: Wallet,
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400"
    },
    {
      label: "Estoque Baixo", value: lowStockCount, icon: AlertTriangle,
      iconBg: lowStockCount ? "bg-orange-100 dark:bg-orange-900/30" : "bg-gray-100 dark:bg-gray-800",
      iconColor: lowStockCount ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground",
      highlight: lowStockCount > 0
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        const isPositive = kpi.change && kpi.change >= 0;
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;
        return (
          <Card key={index} className={`p-4 transition-all hover:shadow-md ${
            kpi.highlight ? 'border-orange-300 dark:border-orange-700' : ''
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${kpi.iconBg}`}>
                <Icon className={`w-4 h-4 ${kpi.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
                <p className="text-lg font-bold truncate">{kpi.value}</p>
                {kpi.showChange && (
                  <div className={`flex items-center gap-1 text-[10px] ${
                    isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    <TrendIcon className="w-3 h-3" />
                    <span>{Math.abs(kpi.change || 0).toFixed(1)}% vs ontem</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
