import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, ShoppingCart, Clock, AlertTriangle, Eye, Plus, TrendingUp, Receipt } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDashboardOrders } from '@/hooks/useDashboardOrders';

interface ShopOperationCenterProps {
  storeId: string | null;
}

export function ShopOperationCenter({ storeId }: ShopOperationCenterProps) {
  const { data: dashOrders } = useDashboardOrders(storeId);

  const preparing = dashOrders?.byStatus?.['em_preparo']?.length || 0;
  const pending = (dashOrders?.byStatus?.['entrada']?.length || 0) +
    (dashOrders?.byStatus?.['aguardando_pagamento']?.length || 0);
  const inTransit = dashOrders?.byStatus?.['em_transito']?.length || 0;
  const waitingPickup = dashOrders?.byStatus?.['aguarda_retirada']?.length || 0;
  const lastOrder = dashOrders?.allOrders?.[0] || null;
  const revenueToday = dashOrders?.revenueToday || 0;
  const totalOrdersToday = dashOrders?.orderCount || 0;
  const ticketMedio = dashOrders?.avgTicket || 0;

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
          <div className="space-y-3">
            <div className="space-y-2">
              <StatusRow
                icon={<ShoppingCart className="w-4 h-4 text-orange-500" />}
                label="Em preparo" value={preparing} variant="orange"
              />
              <StatusRow
                icon={<Clock className="w-4 h-4 text-yellow-500" />}
                label="Aguardando" value={pending} variant="yellow"
              />
              <StatusRow
                icon={<AlertTriangle className="w-4 h-4 text-blue-500" />}
                label="Em trânsito / retirada" value={inTransit + waitingPickup} variant="blue"
              />
            </div>
            <div className="pt-1 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                {lastOrder ? (
                  <>Último pedido:{' '}
                    <span className="font-medium text-foreground">
                      {formatDistanceToNow(new Date(lastOrder.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </>
                ) : 'Nenhum pedido hoje'}
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <NavLink to="/dashboard/orders" className="flex-1">
                <Button variant="outline" size="sm" className="w-full h-9 text-xs">
                  <Eye className="w-3.5 h-3.5 mr-1.5" />Ver Pedidos
                </Button>
              </NavLink>
              <NavLink to="/dashboard/orders?new=true" className="flex-1">
                <Button size="sm" className="w-full h-9 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />Criar Pedido
                </Button>
              </NavLink>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <MiniKPI icon={<Receipt className="w-4 h-4 text-primary" />}
              label="Pedidos hoje" value={String(totalOrdersToday)} />
            <MiniKPI icon={<TrendingUp className="w-4 h-4 text-green-500" />}
              label="Receita hoje"
              value={revenueToday.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
            <MiniKPI icon={<ShoppingCart className="w-4 h-4 text-muted-foreground" />}
              label="Ticket médio"
              value={ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusRow({ icon, label, value, variant }: {
  icon: React.ReactNode; label: string; value: number;
  variant: 'orange' | 'yellow' | 'blue';
}) {
  const bgMap = {
    orange: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800',
    blue: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
  };
  return (
    <div className={`flex items-center justify-between p-2.5 rounded-lg border ${bgMap[variant]}`}>
      <div className="flex items-center gap-2">{icon}<span className="text-xs font-medium">{label}</span></div>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}

function MiniKPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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
