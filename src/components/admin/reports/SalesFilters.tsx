import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, Truck, Store, UtensilsCrossed, ShoppingBag } from 'lucide-react';

export type SalesChannel = 'all' | 'delivery' | 'pickup' | 'table' | 'counter';
export type SalesStatus = 'all' | 'open' | 'preparing' | 'completed' | 'cancelled';
export type PaymentMethod = 'all' | 'cash' | 'credit' | 'debit' | 'pix';

interface SalesFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  channel: SalesChannel;
  onChannelChange: (channel: SalesChannel) => void;
  status: SalesStatus;
  onStatusChange: (status: SalesStatus) => void;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onClearFilters: () => void;
}

export function SalesFilters({
  searchQuery,
  onSearchChange,
  channel,
  onChannelChange,
  status,
  onStatusChange,
  paymentMethod,
  onPaymentMethodChange,
  onClearFilters,
}: SalesFiltersProps) {
  const hasFilters = searchQuery || channel !== 'all' || status !== 'all' || paymentMethod !== 'all';

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:flex-wrap">
      {/* Busca */}
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por número, cliente ou telefone..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filtro de Canal */}
      <Select value={channel} onValueChange={(v) => onChannelChange(v as SalesChannel)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Canal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Canais</SelectItem>
          <SelectItem value="delivery">
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4" /> Delivery
            </span>
          </SelectItem>
          <SelectItem value="pickup">
            <span className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" /> Retirada
            </span>
          </SelectItem>
          <SelectItem value="table">
            <span className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" /> Mesa
            </span>
          </SelectItem>
          <SelectItem value="counter">
            <span className="flex items-center gap-2">
              <Store className="h-4 w-4" /> Balcão PDV
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Filtro de Status */}
      <Select value={status} onValueChange={(v) => onStatusChange(v as SalesStatus)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Status</SelectItem>
          <SelectItem value="open">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Entrada/Aberta
            </span>
          </SelectItem>
          <SelectItem value="preparing">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500" /> Em Preparo
            </span>
          </SelectItem>
          <SelectItem value="completed">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Concluído
            </span>
          </SelectItem>
          <SelectItem value="cancelled">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Cancelado
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Filtro de Pagamento */}
      <Select value={paymentMethod} onValueChange={(v) => onPaymentMethodChange(v as PaymentMethod)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Pagamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Pagamentos</SelectItem>
          <SelectItem value="cash">Dinheiro</SelectItem>
          <SelectItem value="credit">Cartão Crédito</SelectItem>
          <SelectItem value="debit">Cartão Débito</SelectItem>
          <SelectItem value="pix">PIX</SelectItem>
        </SelectContent>
      </Select>

      {/* Limpar Filtros */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters} className="gap-2">
          <X className="h-4 w-4" />
          Limpar
        </Button>
      )}
    </div>
  );
}
