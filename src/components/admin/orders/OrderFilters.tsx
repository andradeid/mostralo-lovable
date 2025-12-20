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
    <div className="flex flex-col gap-3 p-3 sm:p-4 bg-background rounded-lg border">
      {/* Search - Full width sempre */}
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar pedido..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 text-sm"
        />
      </div>
      
      {/* Filters Row */}
      <div className="flex flex-wrap gap-2 sm:gap-3">

        <Select value={paymentStatusFilter} onValueChange={onPaymentStatusChange}>
          <SelectTrigger className="w-[130px] sm:w-[160px] text-xs sm:text-sm">
            <SelectValue placeholder="Pagamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="paid">Pago</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={deliveryTypeFilter} onValueChange={onDeliveryTypeChange}>
          <SelectTrigger className="w-[110px] sm:w-[140px] text-xs sm:text-sm">
            <SelectValue placeholder="Entrega" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="delivery">Delivery</SelectItem>
            <SelectItem value="pickup">Retirada</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={onClearFilters} className="h-9 sm:h-10">
          <X className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Limpar</span>
        </Button>
      </div>
    </div>
  );
};
