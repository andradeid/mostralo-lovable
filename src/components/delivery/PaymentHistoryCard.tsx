import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatCurrency } from '@/utils/driverEarnings';
import { formatOrderNumber } from '@/utils/addressFormatter';
import { Store, Clock, CheckCircle2, Send, Eye } from 'lucide-react';

interface Earning {
  id: string;
  order_id: string;
  delivery_fee: number;
  earnings_amount: number;
  payment_status: string;
  paid_at?: string;
  payment_reference?: string;
  payment_receipt_url?: string;
  payment_requested_at?: string;
  delivered_at: string;
  order_number?: string;
  store_name?: string;
}

interface Props {
  earning: Earning;
  onViewReceipt?: (earningId: string) => void;
}

export function PaymentHistoryCard({ earning, onViewReceipt }: Props) {
  return (
    <Card className="p-3 hover:bg-muted/30 transition-colors">
      {/* Linha 1: Data + Pedido + Status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 space-y-1">
          <div className="text-xs text-muted-foreground">
            {format(new Date(earning.delivered_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
          </div>
          <div className="font-bold text-sm">
            {formatOrderNumber(earning.order_number || '')}
          </div>
        </div>
        
        <div>
          {earning.payment_requested_at && earning.payment_status === 'pending' ? (
            <Badge variant="outline" className="border-yellow-500 text-yellow-700 text-xs">
              <Send className="w-3 h-3 mr-1" />
              Solicitado
            </Badge>
          ) : earning.payment_status === 'pending' ? (
            <Badge variant="secondary" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Pendente
            </Badge>
          ) : (
            <Badge className="bg-green-600 text-xs">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Pago
            </Badge>
          )}
        </div>
      </div>

      {/* Linha 2: Loja */}
      {earning.store_name && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <Store className="w-3 h-3" />
          <span className="truncate">{earning.store_name}</span>
        </div>
      )}

      {/* Linha 3: Taxa + Ganho */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="text-xs space-y-0.5">
          <div className="text-muted-foreground">Taxa</div>
          <div className="font-medium">{formatCurrency(parseFloat(earning.delivery_fee.toString()))}</div>
        </div>
        
        <div className="text-right">
          <div className="text-xs text-muted-foreground mb-0.5">Ganho</div>
          <div className="font-bold text-lg text-green-600">
            {formatCurrency(parseFloat(earning.earnings_amount.toString()))}
          </div>
        </div>
      </div>

      {/* Linha 4: Info de Pagamento (se pago) */}
      {earning.paid_at && (
        <div className="mt-2 pt-2 border-t space-y-1">
          <div className="text-xs text-muted-foreground">
            Pago em {format(new Date(earning.paid_at), 'dd/MM/yyyy', { locale: ptBR })}
          </div>
          {earning.payment_reference && (
            <div className="text-xs text-muted-foreground">
              Ref: {earning.payment_reference}
            </div>
          )}
          {earning.payment_receipt_url && onViewReceipt && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-1 h-8 text-xs"
              onClick={() => onViewReceipt(earning.id)}
            >
              <Eye className="w-3 h-3 mr-1" />
              Ver Comprovante
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
