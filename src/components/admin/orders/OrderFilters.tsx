import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X, Calendar } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type PaymentStatus = Database['public']['Enums']['payment_status'];
type DeliveryType = Database['public']['Enums']['delivery_type'];

interface OrderFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  paymentStatusFilter: PaymentStatus | 'all';
  onPaymentStatusChange: (value: PaymentStatus | 'all') => void;
  deliveryTypeFilter: DeliveryType | 'all';
  onDeliveryTypeChange: (value: DeliveryType | 'all') => void;
  onClearFilters: () => void;
}

export const OrderFilters = ({
  searchTerm,
  onSearchChange,
  paymentStatusFilter,
  onPaymentStatusChange,
  deliveryTypeFilter,
  onDeliveryTypeChange,
  onClearFilters
}: OrderFiltersProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 bg-background rounded-lg border">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número ou nome do cliente..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={paymentStatusFilter} onValueChange={onPaymentStatusChange}>
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Status do pagamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os pagamentos</SelectItem>
          <SelectItem value="pending">Pendente</SelectItem>
          <SelectItem value="paid">Pago</SelectItem>
          <SelectItem value="cancelled">Cancelado</SelectItem>
        </SelectContent>
      </Select>

      <Select value={deliveryTypeFilter} onValueChange={onDeliveryTypeChange}>
        <SelectTrigger className="w-full md:w-[200px]">
          <SelectValue placeholder="Tipo de entrega" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os tipos</SelectItem>
          <SelectItem value="delivery">Delivery</SelectItem>
          <SelectItem value="pickup">Retirada</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" onClick={onClearFilters}>
        <X className="h-4 w-4 mr-2" />
        Limpar
      </Button>
    </div>
  );
};
