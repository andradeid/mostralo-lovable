import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger>
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
        <div className="space-y-2">
          <Label>Tipo de Entrega</Label>
          <Select value={filters.deliveryType} onValueChange={(value) => handleFilterChange('deliveryType', value)}>
            <SelectTrigger>
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
        <div className="space-y-2">
          <Label>Pagamento</Label>
          <Select value={filters.paymentMethod} onValueChange={(value) => handleFilterChange('paymentMethod', value)}>
            <SelectTrigger>
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
