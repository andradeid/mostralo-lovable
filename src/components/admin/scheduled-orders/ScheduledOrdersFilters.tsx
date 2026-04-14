import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlidersHorizontal } from 'lucide-react';

interface ScheduledOrdersFiltersProps {
  filters: {
    status: string;
    deliveryType: string;
    paymentMethod: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function ScheduledOrdersFilters({ filters, onFiltersChange }: ScheduledOrdersFiltersProps) {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const activeFilters = [filters.status, filters.deliveryType, filters.paymentMethod].filter(f => f !== 'all').length;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-foreground">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            Filtros
          </div>
          {activeFilters > 0 && (
            <span className="text-[10px] bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-semibold">
              {activeFilters}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-3">
        {/* Status */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="entrada">Entrada</SelectItem>
              <SelectItem value="preparo">Preparo</SelectItem>
              <SelectItem value="pronto">Pronto</SelectItem>
              <SelectItem value="entrega">Entrega</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tipo de Entrega */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tipo de Entrega</Label>
          <Select value={filters.deliveryType} onValueChange={(value) => handleFilterChange('deliveryType', value)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="pickup">Retirada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Método de Pagamento */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Pagamento</Label>
          <Select value={filters.paymentMethod} onValueChange={(value) => handleFilterChange('paymentMethod', value)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="card">Cartão</SelectItem>
              <SelectItem value="cash">Dinheiro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
