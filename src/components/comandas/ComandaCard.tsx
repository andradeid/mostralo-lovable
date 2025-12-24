import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Comanda } from '@/hooks/useComandas';
import { formatCurrency } from '@/lib/utils';
import { Clock, User, MapPin, ShoppingBag, MoreVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ComandaCardProps {
  comanda: Comanda;
  onClick?: () => void;
  onClose?: () => void;
  onCancel?: () => void;
}

export function ComandaCard({ comanda, onClick, onClose, onCancel }: ComandaCardProps) {
  const getStatusBadge = () => {
    switch (comanda.status) {
      case 'open':
        return <Badge className="bg-green-500">Aberta</Badge>;
      case 'closed':
        return <Badge variant="secondary">Fechada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return null;
    }
  };

  const timeOpen = formatDistanceToNow(new Date(comanda.opened_at), {
    locale: ptBR,
    addSuffix: false,
  });

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        comanda.status === 'open' ? 'border-green-500/50' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl font-bold">#{comanda.number}</CardTitle>
            {getStatusBadge()}
          </div>
          {comanda.status === 'open' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onClose?.(); 
                  }}
                >
                  Fechar Comanda
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onCancel?.(); 
                  }}
                >
                  Cancelar Comanda
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <ShoppingBag className="h-4 w-4" />
            <span className="capitalize">{comanda.type === 'mesa' ? 'Mesa' : 'Balcão'}</span>
          </div>
          {comanda.table_number && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>Mesa {comanda.table_number}</span>
            </div>
          )}
        </div>

        {comanda.customer_name && (
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{comanda.customer_name}</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Aberta há {timeOpen}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-lg font-bold text-primary">
            {formatCurrency(comanda.total)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
