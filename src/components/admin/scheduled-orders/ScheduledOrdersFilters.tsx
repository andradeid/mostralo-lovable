import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ScheduledOrder } from '@/lib/scheduledOrders';
import { SlidersHorizontal } from 'lucide-react';

interface ScheduledOrdersFiltersProps {
  filters: {
    status: string;
    deliveryType: string;
    paymentMethod: string;
  };
  orders: ScheduledOrder[];
  onFiltersChange: (filters: ScheduledOrdersFiltersProps['filters']) => void;
}

export function ScheduledOrdersFilters({ filters, onFiltersChange, orders }: ScheduledOrdersFiltersProps) {
  const handleFilterChange = (key: keyof ScheduledOrdersFiltersProps['filters'], value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const activeFilters = [filters.status, filters.deliveryType, filters.paymentMethod].filter(f => f !== 'all').length;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="flex items-center justify-between text-xs font-medium text-foreground">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            Filtros
          </div>
          {activeFilters > 0 && (
            <span className="text-[9px] bg-primary text-primary-foreground rounded-full px-1.5 py-0 font-semibold">
              {activeFilters}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 pt-0 space-y-2">
        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Status</Label>
          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="entrada">Entrada</SelectItem>
              <SelectItem value="confirmado">Confirmado</SelectItem>
              <SelectItem value="em_preparo">Em preparo</SelectItem>
              <SelectItem value="aguarda_retirada">Aguarda retirada</SelectItem>
              <SelectItem value="em_transito">Em trânsito</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Tipo de Entrega</Label>
          <Select value={filters.deliveryType} onValueChange={(value) => handleFilterChange('deliveryType', value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="delivery">{orders.find(o => o.delivery_type === 'delivery')?.delivery_label || 'Entrega'}</SelectItem>
              <SelectItem value="pickup">{orders.find(o => o.delivery_type === 'pickup')?.delivery_label || 'Retirada'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[10px] text-muted-foreground">Pagamento</Label>
          <Select value={filters.paymentMethod} onValueChange={(value) => handleFilterChange('paymentMethod', value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pix">{orders.find(o => o.payment_method === 'pix')?.payment_label || 'Pix'}</SelectItem>
              <SelectItem value="card">{orders.find(o => o.payment_method === 'card')?.payment_label || 'Cartão'}</SelectItem>
              <SelectItem value="cash">{orders.find(o => o.payment_method === 'cash')?.payment_label || 'Dinheiro'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
