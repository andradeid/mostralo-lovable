import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Clock, Package, CheckCircle, XCircle, Truck, ChefHat } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

interface StoreRecentActivityProps {
  storeId: string | null;
  maxItems?: number;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  pending: { label: "Novo", variant: "default", icon: Clock },
  confirmed: { label: "Confirmado", variant: "secondary", icon: Package },
  preparing: { label: "Preparando", variant: "secondary", icon: ChefHat },
  ready: { label: "Pronto", variant: "outline", icon: CheckCircle },
  out_for_delivery: { label: "Saiu p/ entrega", variant: "outline", icon: Truck },
  delivered: { label: "Entregue", variant: "outline", icon: CheckCircle },
  completed: { label: "Concluído", variant: "outline", icon: CheckCircle },
  cancelled: { label: "Cancelado", variant: "destructive", icon: XCircle }
};

export function StoreRecentActivity({ storeId, maxItems = 5 }: StoreRecentActivityProps) {
  const { data: recentOrders, isLoading } = useQuery({
    queryKey: ['store-recent-orders', storeId, maxItems],
    queryFn: async () => {
      if (!storeId) return [];

      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, total, status, created_at')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(maxItems);

      if (error) throw error;
      return data || [];
    },
    enabled: !!storeId,
    refetchInterval: 30000,
    staleTime: 15000
  });

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {!recentOrders || recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="w-10 h-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Nenhum pedido recente
            </p>
            <p className="text-xs text-muted-foreground/70">
              Os pedidos aparecerão aqui
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[220px] pr-2">
            <div className="space-y-1">
              {recentOrders.map((order) => {
                const config = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = config.icon;

                return (
                  <Link 
                    key={order.id}
                    to={`/dashboard/orders?highlight=${order.id}`}
                    className="flex items-center justify-between py-2.5 px-2 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1.5 rounded-md bg-muted group-hover:bg-background transition-colors">
                        <StatusIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          #{order.order_number}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                          {order.customer_name || "Cliente"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant={config.variant} className="text-[10px] px-1.5 py-0">
                        {config.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(order.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {recentOrders && recentOrders.length > 0 && (
          <div className="pt-3 border-t mt-2">
            <Link 
              to="/dashboard/orders"
              className="text-xs text-primary hover:underline flex items-center justify-center gap-1"
            >
              Ver todos os pedidos
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
