import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, ShoppingCart, Clock, AlertTriangle, Eye, Plus, TrendingUp, Receipt } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ShopOperationCenterProps {
  storeId: string | null;
}

export function ShopOperationCenter({ storeId }: ShopOperationCenterProps) {
  const today = new Date().toISOString().split('T')[0];

  const { data } = useQuery({
    queryKey: ['shop-operation-center', storeId, today],
    queryFn: async () => {
      if (!storeId) return null;

      const { data: orders } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, status, total, created_at')
        .eq('store_id', storeId)
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false });

      const allOrders = orders || [];
      const preparing = allOrders.filter(o => o.status === 'em_preparo');
      const pending = allOrders.filter(o => o.status === 'entrada' || o.status === 'aguardando_pagamento');
      const inTransit = allOrders.filter(o => o.status === 'em_transito');
      const waitingPickup = allOrders.filter(o => o.status === 'aguarda_retirada');
      const completed = allOrders.filter(o => o.status === 'concluido');
      const lastOrder = allOrders[0] || null;
      const activeOrders = preparing.length + pending.length + inTransit.length + waitingPickup.length;

      // Receita hoje (apenas concluídos)
      const revenueToday = completed.reduce((sum, o) => sum + Number(o.total || 0), 0);
      const totalOrdersToday = allOrders.filter(o => o.status !== 'cancelado').length;
      const ticketMedio = totalOrdersToday > 0 ? revenueToday / totalOrdersToday : 0;

      return {
        preparing: preparing.length,
        pending: pending.length,
        inTransit: inTransit.length,
        waitingPickup: waitingPickup.length,
        activeOrders,
        lastOrder,
        revenueToday,
        totalOrdersToday,
        ticketMedio,
      };
    },
    enabled: !!storeId,
    retry: 2,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Flame className="w-4 h-4 text-primary" />
          Centro de Operação
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Coluna Esquerda — Status operacional */}
          <div className="space-y-3">
            {/* Status dos pedidos */}
            <div className="space-y-2">
              <StatusRow
                icon={<ShoppingCart className="w-4 h-4 text-orange-500" />}
                label="Em preparo"
                value={data?.preparing ?? 0}
                variant="orange"
              />
              <StatusRow
                icon={<Clock className="w-4 h-4 text-yellow-500" />}
                label="Aguardando"
                value={data?.pending ?? 0}
                variant="yellow"
              />
              <StatusRow
                icon={<AlertTriangle className="w-4 h-4 text-blue-500" />}
                label="Em trânsito / retirada"
                value={(data?.inTransit ?? 0) + (data?.waitingPickup ?? 0)}
                variant="blue"
              />
            </div>

            {/* Último pedido */}
            <div className="pt-1 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                {data?.lastOrder ? (
                  <>
                    Último pedido:{' '}
                    <span className="font-medium text-foreground">
                      {formatDistanceToNow(new Date(data.lastOrder.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </>
                ) : (
                  'Nenhum pedido hoje'
                )}
              </p>
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-1">
              <NavLink to="/dashboard/orders" className="flex-1">
                <Button variant="outline" size="sm" className="w-full h-9 text-xs">
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  Ver Pedidos
                </Button>
              </NavLink>
              <NavLink to="/dashboard/orders?new=true" className="flex-1">
                <Button size="sm" className="w-full h-9 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Criar Pedido
                </Button>
              </NavLink>
            </div>
          </div>

          {/* Coluna Direita — Mini KPIs */}
          <div className="grid grid-cols-1 gap-2">
            <MiniKPI
              icon={<Receipt className="w-4 h-4 text-primary" />}
              label="Pedidos hoje"
              value={String(data?.totalOrdersToday ?? 0)}
            />
            <MiniKPI
              icon={<TrendingUp className="w-4 h-4 text-green-500" />}
              label="Receita hoje"
              value={(data?.revenueToday ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            />
            <MiniKPI
              icon={<ShoppingCart className="w-4 h-4 text-muted-foreground" />}
              label="Ticket médio"
              value={(data?.ticketMedio ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusRow({ icon, label, value, variant }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  variant: 'orange' | 'yellow' | 'blue';
}) {
  const bgMap = {
    orange: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
    blue: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
  };

  return (
    <div className={`flex items-center justify-between p-2.5 rounded-lg border ${bgMap[variant]}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}

function MiniKPI({ icon, label, value }: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
      {icon}
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-bold truncate">{value}</p>
      </div>
    </div>
  );
}
