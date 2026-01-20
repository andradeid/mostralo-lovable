import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, ShoppingCart, Wallet, AlertTriangle } from "lucide-react";

interface StoreDailyKPIsProps {
  storeId: string | null;
}

export function StoreDailyKPIs({ storeId }: StoreDailyKPIsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['store-daily-kpis', storeId],
    queryFn: async () => {
      if (!storeId) return null;

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Buscar pedidos de hoje
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total, status')
        .eq('store_id', storeId)
        .gte('created_at', `${today}T00:00:00`)
        .not('status', 'eq', 'cancelled');

      // Buscar pedidos de ontem para comparação
      const { data: yesterdayOrders } = await supabase
        .from('orders')
        .select('total')
        .eq('store_id', storeId)
        .gte('created_at', `${yesterdayStr}T00:00:00`)
        .lt('created_at', `${today}T00:00:00`)
        .not('status', 'eq', 'cancelled');

      // Buscar produtos com estoque baixo
      const { data: products } = await supabase
        .from('products')
        .select('id, stock_quantity, stock_alert_threshold')
        .eq('store_id', storeId)
        .eq('track_stock', true)
        .not('stock_quantity', 'is', null)
        .not('stock_alert_threshold', 'is', null);

      // Calcular métricas
      const todayTotal = todayOrders?.reduce((acc, o) => acc + Number(o.total || 0), 0) || 0;
      const orderCount = todayOrders?.length || 0;
      const avgTicket = orderCount > 0 ? todayTotal / orderCount : 0;
      const yesterdayTotal = yesterdayOrders?.reduce((acc, o) => acc + Number(o.total || 0), 0) || 0;
      
      let growthPercent = 0;
      if (yesterdayTotal > 0) {
        growthPercent = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;
      } else if (todayTotal > 0) {
        growthPercent = 100;
      }

      const lowStockCount = products?.filter(
        p => Number(p.stock_quantity) <= Number(p.stock_alert_threshold)
      ).length || 0;

      return {
        todayTotal,
        orderCount,
        avgTicket,
        growthPercent,
        lowStockCount
      };
    },
    enabled: !!storeId,
    refetchInterval: 60000,
    staleTime: 30000
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-16 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  const kpis = [
    {
      label: "Vendas Hoje",
      value: `R$ ${(stats?.todayTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      change: stats?.growthPercent || 0,
      showChange: true
    },
    {
      label: "Pedidos",
      value: stats?.orderCount || 0,
      icon: ShoppingCart,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400"
    },
    {
      label: "Ticket Médio",
      value: `R$ ${(stats?.avgTicket || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: Wallet,
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400"
    },
    {
      label: "Estoque Baixo",
      value: stats?.lowStockCount || 0,
      icon: AlertTriangle,
      iconBg: stats?.lowStockCount ? "bg-orange-100 dark:bg-orange-900/30" : "bg-gray-100 dark:bg-gray-800",
      iconColor: stats?.lowStockCount ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground",
      highlight: (stats?.lowStockCount || 0) > 0
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        const isPositive = kpi.change && kpi.change >= 0;
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;

        return (
          <Card 
            key={index} 
            className={`p-4 transition-all hover:shadow-md ${
              kpi.highlight ? 'border-orange-300 dark:border-orange-700' : ''
            }`}
          >
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
