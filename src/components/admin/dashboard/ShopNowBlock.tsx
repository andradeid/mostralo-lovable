import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, ShoppingCart, Clock, AlertTriangle, Plus, Eye, Package } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDashboardOrders } from '@/hooks/useDashboardOrders';

interface ShopNowBlockProps {
  storeId: string | null;
}

export function ShopNowBlock({ storeId }: ShopNowBlockProps) {
  const { data: dashOrders } = useDashboardOrders(storeId);

  const preparing = dashOrders?.byStatus?.['em_preparo'] || [];
  const pending = [
    ...(dashOrders?.byStatus?.['entrada'] || []),
    ...(dashOrders?.byStatus?.['aguardando_pagamento'] || []),
  ];
  const inTransit = dashOrders?.byStatus?.['em_transito'] || [];
  const waitingPickup = dashOrders?.byStatus?.['aguarda_retirada'] || [];
  const lastOrder = dashOrders?.allOrders?.[0] || null;
  const totalActive = preparing.length + pending.length + inTransit.length + waitingPickup.length;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Agora
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {totalActive > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {pending.length > 0 && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold">{pending.length}</p>
                  <p className="text-[10px] text-muted-foreground">Aguardando</p>
                </div>
              </div>
            )}
            {preparing.length > 0 && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                <Package className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold">{preparing.length}</p>
                  <p className="text-[10px] text-muted-foreground">Em preparo</p>
                </div>
              </div>
            )}
            {inTransit.length > 0 && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold">{inTransit.length}</p>
                  <p className="text-[10px] text-muted-foreground">Em trânsito</p>
                </div>
              </div>
            )}
            {waitingPickup.length > 0 && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <AlertTriangle className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold">{waitingPickup.length}</p>
                  <p className="text-[10px] text-muted-foreground">Aguarda retirada</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">Nenhum pedido em andamento</p>
          </div>
        )}

        {lastOrder && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Último pedido
            </p>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
              <ShoppingCart className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  #{lastOrder.order_number} — {lastOrder.customer_name || 'Cliente'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatDistanceToNow(new Date(lastOrder.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>
              <span className="text-sm font-semibold shrink-0">
                {Number(lastOrder.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <NavLink to="/dashboard/orders">
            <Button variant="outline" size="sm" className="w-full h-9 text-xs">
              <Eye className="w-3.5 h-3.5 mr-1.5" />
              Ver Pedidos
            </Button>
          </NavLink>
          <NavLink to="/dashboard/products">
            <Button size="sm" className="w-full h-9 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Novo Produto
            </Button>
          </NavLink>
        </div>
      </CardContent>
    </Card>
  );
}
