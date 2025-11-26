import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { User, Phone, MapPin, CreditCard, Banknote, Smartphone, Edit2, Package, Calendar, Clock } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import type { Promotion } from '@/types/promotions';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type DeliveryType = Database['public']['Enums']['delivery_type'];
type PaymentMethod = Database['public']['Enums']['payment_method'];

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ConfirmationStepProps {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  needsChange: boolean;
  changeAmount: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  promotionDiscount: number;
  total: number;
  appliedPromotion: Promotion | null;
  isScheduled: boolean;
  selectedDate?: Date;
  selectedTime: string;
  onEditStep: (step: number) => void;
  primaryColor?: string;
  secondaryColor?: string;
}

export const ConfirmationStep = ({
  customerName,
  customerPhone,
  customerEmail,
  customerAddress,
  deliveryType,
  paymentMethod,
  needsChange,
  changeAmount,
  items,
  subtotal,
  deliveryFee,
  promotionDiscount,
  total,
  appliedPromotion,
  isScheduled,
  selectedDate,
  selectedTime,
  onEditStep,
  primaryColor = '#FF9500',
  secondaryColor
}: ConfirmationStepProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const deliveryTypeLabels = {
    delivery: 'Entrega',
    pickup: 'Retirada',
    table: 'Consumir no local'
  };

  const paymentMethodLabels = {
    pix: 'Pix',
    cash: 'Dinheiro',
    credit_card: 'Cartão de crédito',
    debit_card: 'Cartão de débito'
  };

  const PaymentIcon = paymentMethod === 'pix' ? Smartphone : paymentMethod === 'cash' ? Banknote : CreditCard;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Revise seu pedido</h3>
        <p className="text-sm text-muted-foreground">
          Confira todas as informações antes de confirmar
        </p>
      </div>

      {/* Informações do Cliente */}
      <Card>
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <User className="w-4 h-4" style={{ color: primaryColor }} />
              Informações para {deliveryTypeLabels[deliveryType].toLowerCase()}
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto p-1 -mt-1"
              onClick={() => onEditStep(1)}
            >
              <Edit2 className="w-4 h-4" style={{ color: primaryColor }} />
            </Button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{customerName}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{customerPhone}</span>
            </div>
            
            {customerEmail && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>✉</span>
                <span>{customerEmail}</span>
              </div>
            )}
            
            {deliveryType === 'delivery' && customerAddress && (
              <div className="flex items-start gap-2 mt-3 pt-3 border-t">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span className="flex-1">{customerAddress}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Agendamento */}
      {isScheduled && selectedDate && selectedTime && (
        <Card>
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
                Agendamento
              </h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-1 -mt-1"
                onClick={() => onEditStep(0)}
              >
                <Edit2 className="w-4 h-4" style={{ color: primaryColor }} />
              </Button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{selectedTime}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Itens do Pedido */}
      <Card>
        <div className="p-4">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" style={{ color: primaryColor }} />
            Itens do pedido
          </h4>
          
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Resumo Financeiro */}
      <Card>
        <div className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          
          {deliveryFee > 0 && (
            <div className="flex justify-between text-sm">
              <span>Taxa de entrega</span>
              <span>{formatPrice(deliveryFee)}</span>
            </div>
          )}
          
          {promotionDiscount > 0 && (
            <>
              <div className="flex justify-between text-sm" style={{ color: primaryColor }}>
                <span>Desconto {appliedPromotion?.code && `(${appliedPromotion.code})`}</span>
                <span>-{formatPrice(promotionDiscount)}</span>
              </div>
            </>
          )}
          
          <Separator className="my-2" />
          
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span style={{ color: primaryColor }}>{formatPrice(total)}</span>
          </div>
        </div>
      </Card>

      {/* Forma de Pagamento */}
      <Card>
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4" style={{ color: primaryColor }} />
              Pagamento
            </h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto p-1 -mt-1"
              onClick={() => onEditStep(2)}
            >
              <Edit2 className="w-4 h-4" style={{ color: primaryColor }} />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <PaymentIcon className="w-4 h-4" style={{ color: primaryColor }} />
            <span>{paymentMethodLabels[paymentMethod]}</span>
          </div>
          
          {paymentMethod === 'cash' && needsChange && changeAmount && (
            <p className="text-xs text-muted-foreground mt-2">
              Troco para: R$ {changeAmount}
            </p>
          )}
        </div>
      </Card>

      {/* Mensagem Final */}
      <div className="text-center py-4">
        <p className="text-lg font-semibold" style={{ color: primaryColor }}>
          Você está a um passo da Felicidade 😋
        </p>
      </div>
    </div>
  );
};
