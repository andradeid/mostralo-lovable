import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PromotionCodeInput } from '../PromotionCodeInput';
import { PromotionSummary } from '../PromotionSummary';
import { Smartphone, CreditCard, Banknote, Tag, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';
import type { Promotion } from '@/types/promotions';

type PaymentMethod = Database['public']['Enums']['payment_method'];

interface PaymentStepProps {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onPaymentDetailsChange?: (details: any) => void;
  needsChange: boolean;
  onNeedsChangeToggle: (needs: boolean) => void;
  changeAmount: string;
  onChangeAmountChange: (amount: string) => void;
  promotionCode: string;
  onPromotionCodeChange: (code: string) => void;
  onApplyPromotion: () => void;
  onRemovePromotion: () => void;
  appliedPromotion: Promotion | null;
  promotionDiscount: number;
  isApplyingPromotion: boolean;
  subtotal: number;
  deliveryFee: number;
  total: number;
  primaryColor?: string;
  secondaryColor?: string;
  onlinePaymentEnabled?: boolean;
  acceptsCash?: boolean;
  acceptsDebit?: boolean;
  acceptsCredit?: boolean;
  acceptsPix?: boolean;
}

export const PaymentStep = ({
  paymentMethod,
  onPaymentMethodChange,
  onPaymentDetailsChange,
  needsChange,
  onNeedsChangeToggle,
  changeAmount,
  onChangeAmountChange,
  promotionCode,
  onPromotionCodeChange,
  onApplyPromotion,
  onRemovePromotion,
  appliedPromotion,
  promotionDiscount,
  isApplyingPromotion,
  subtotal,
  deliveryFee,
  total,
  primaryColor = '#FF9500',
  secondaryColor,
  onlinePaymentEnabled = false,
  acceptsCash = true,
  acceptsDebit = false,
  acceptsCredit = false,
  acceptsPix = false,
}: PaymentStepProps) => {
  const [showPromotionInput, setShowPromotionInput] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string>('cash');

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Determinar o título do cartão baseado nas opções habilitadas
  const allPaymentMethods = [
    {
      id: 'pix_online',
      value: 'pix' as PaymentMethod,
      icon: Smartphone,
      title: 'Pix',
      subtitle: 'Pagamento online instantâneo',
      category: 'online',
      enabled: onlinePaymentEnabled && acceptsPix
    },
    {
      id: 'pix_delivery',
      value: 'pix' as PaymentMethod,
      icon: Smartphone,
      title: 'Pix',
      subtitle: 'Pagar na entrega',
      category: 'delivery',
      enabled: acceptsPix && !onlinePaymentEnabled
    },
    {
      id: 'cash',
      value: 'cash' as PaymentMethod,
      icon: Banknote,
      title: 'Dinheiro',
      subtitle: 'Pagar na entrega',
      category: 'delivery',
      enabled: acceptsCash
    },
    {
      id: 'credit_card',
      value: 'card' as PaymentMethod,
      icon: CreditCard,
      title: 'Cartão de crédito',
      subtitle: 'Pagar na entrega',
      category: 'delivery',
      enabled: acceptsCredit
    },
    {
      id: 'debit_card',
      value: 'card' as PaymentMethod,
      icon: CreditCard,
      title: 'Cartão de débito',
      subtitle: 'Pagar na entrega',
      category: 'delivery',
      enabled: acceptsDebit
    }
  ];

  // Filtrar apenas métodos habilitados
  const paymentMethods = allPaymentMethods.filter(m => m.enabled);
  const onlineMethods = paymentMethods.filter(m => m.category === 'online');
  const deliveryMethods = paymentMethods.filter(m => m.category === 'delivery');

  return (
    <div className="space-y-6">
      {/* Cupom de Desconto */}
      <div>
        {!appliedPromotion ? (
          !showPromotionInput ? (
            <Card
              className="cursor-pointer transition-all hover:shadow-md border-2"
              onClick={() => setShowPromotionInput(true)}
            >
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Tag className="w-5 h-5" style={{ color: primaryColor }} />
                  <div>
                    <p className="font-medium text-sm">Tem um cupom de desconto?</p>
                    <p className="text-xs text-muted-foreground">Clique e insira o código</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>
          ) : (
            <PromotionCodeInput
              value={promotionCode}
              onChange={onPromotionCodeChange}
              onApply={onApplyPromotion}
              isLoading={isApplyingPromotion}
            />
          )
        ) : (
          <PromotionSummary
            promotion={appliedPromotion}
            discount={promotionDiscount}
            onRemove={onRemovePromotion}
          />
        )}
      </div>

      {/* Métodos de Pagamento Online */}
      {onlineMethods.length > 0 && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Pagar online</Label>
          <div className="space-y-2">
            {onlineMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethodId === method.id;
              
              return (
                <Card
                  key={method.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    isSelected ? "bg-primary/5" : ""
                  )}
                  style={{
                    borderWidth: '2px',
                    borderColor: isSelected ? primaryColor : 'hsl(var(--border))'
                  }}
                  onClick={() => {
                    setSelectedMethodId(method.id);
                    onPaymentMethodChange(method.value);
                  }}
                >
                  <div className="p-4 flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: isSelected ? primaryColor : 'hsl(var(--border))'
                      }}
                    >
                      {isSelected && (
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: primaryColor }}
                        />
                      )}
                    </div>
                    <Icon className="w-5 h-5" style={{ color: isSelected ? primaryColor : 'currentColor' }} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{method.title}</p>
                      <p className="text-xs text-muted-foreground">{method.subtitle}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Métodos de Pagamento na Entrega */}
      {deliveryMethods.length > 0 && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Pagar na entrega</Label>
          <div className="space-y-2">
            {deliveryMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethodId === method.id;
              
              return (
                <Card
                  key={method.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    isSelected ? "bg-primary/5" : ""
                  )}
                  style={{
                    borderWidth: '2px',
                    borderColor: isSelected ? primaryColor : 'hsl(var(--border))'
                  }}
                  onClick={() => {
                    setSelectedMethodId(method.id);
                    onPaymentMethodChange(method.value);
                    
                    // Passar detalhes do tipo de cartão
                    if (onPaymentDetailsChange) {
                      if (method.id === 'credit_card') {
                        onPaymentDetailsChange({ card_type: 'credit' });
                      } else if (method.id === 'debit_card') {
                        onPaymentDetailsChange({ card_type: 'debit' });
                      } else {
                        onPaymentDetailsChange(null);
                      }
                    }
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-6 h-6 rounded-full border-2 flex items-center justify-center"
                        style={{
                          borderColor: isSelected ? primaryColor : 'hsl(var(--border))'
                        }}
                      >
                        {isSelected && (
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: primaryColor }}
                          />
                        )}
                      </div>
                      <Icon className="w-5 h-5" style={{ color: isSelected ? primaryColor : 'currentColor' }} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{method.title}</p>
                        <p className="text-xs text-muted-foreground">{method.subtitle}</p>
                      </div>
                    </div>

                    {/* Troco para Dinheiro */}
                    {method.id === 'cash' && isSelected && (
                      <div className="mt-4 space-y-3 pl-9">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="needs-change"
                            checked={needsChange}
                            onChange={(e) => onNeedsChangeToggle(e.target.checked)}
                            className="rounded"
                            style={{ accentColor: primaryColor }}
                          />
                          <Label htmlFor="needs-change" className="text-sm font-normal cursor-pointer">
                            Preciso de troco
                          </Label>
                        </div>
                        
                        {needsChange && (
                          <div className="space-y-1">
                            <Label htmlFor="change-amount" className="text-xs">
                              Troco para quanto?
                            </Label>
                            <Input
                              id="change-amount"
                              type="text"
                              placeholder="R$ 50,00"
                              value={changeAmount}
                              onChange={(e) => onChangeAmountChange(e.target.value)}
                              className="h-10"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Resumo do Pedido */}
      <div>
        <Separator className="mb-4" />
        <div className="space-y-2">
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
            <div className="flex justify-between text-sm" style={{ color: primaryColor }}>
              <span>Desconto</span>
              <span>-{formatPrice(promotionDiscount)}</span>
            </div>
          )}
          
          <Separator className="my-2" />
          
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span style={{ color: primaryColor }}>{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
