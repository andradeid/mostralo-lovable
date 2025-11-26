import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, MapPin, Phone, ShoppingBag, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  total_orders: number;
  total_spent: number;
  last_order_at?: string;
}

interface CustomerCardProps {
  customer: Customer;
  onViewDetails: (id: string) => void;
}

export const CustomerCard = ({ customer, onViewDetails }: CustomerCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div>
              <h3 className="font-semibold text-lg">{customer.name}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <ShoppingBag className="h-3 w-3" />
                  {customer.total_orders} pedidos
                </Badge>
                <Badge variant="outline">
                  R$ {Number(customer.total_spent).toFixed(2)}
                </Badge>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{customer.phone}</span>
              </div>

              {customer.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}

              {customer.address && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{customer.address}</span>
                </div>
              )}

              {customer.last_order_at && (
                <div className="text-xs text-muted-foreground mt-2">
                  Último pedido: {format(new Date(customer.last_order_at), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              )}
            </div>
          </div>

          <div className="flex md:flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(customer.id)}
              className="flex-1 md:flex-none"
            >
              <Eye className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Ver Detalhes</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
