import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatCurrency } from '@/lib/utils';
import { CreditCard, Banknote, QrCode, Wallet, Loader2 } from 'lucide-react';

interface PDVPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtotal: number;
  onConfirm: (paymentMethod: string, discount: number, paymentDetails?: Record<string, any>) => void;
  isProcessing?: boolean;
}

const paymentMethods = [
  { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { value: 'credito', label: 'Cartão Crédito', icon: CreditCard },
  { value: 'debito', label: 'Cartão Débito', icon: CreditCard },
  { value: 'pix', label: 'PIX', icon: QrCode },
  { value: 'outros', label: 'Outros', icon: Wallet },
];

export function PDVPaymentModal({
  open,
  onOpenChange,
  subtotal,
  onConfirm,
  isProcessing = false,
}: PDVPaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState('dinheiro');
  const [discount, setDiscount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState(0);

  const total = subtotal - discount;
  const change = selectedMethod === 'dinheiro' ? Math.max(0, receivedAmount - total) : 0;

  const handleConfirm = () => {
    const paymentDetails: Record<string, any> = {};
    
    if (selectedMethod === 'dinheiro') {
      paymentDetails.received_amount = receivedAmount;
      paymentDetails.change = change;
    }

    onConfirm(selectedMethod, discount, paymentDetails);
  };

  const handleClose = () => {
    if (!isProcessing) {
      setSelectedMethod('dinheiro');
      setDiscount(0);
      setReceivedAmount(0);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar Venda</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Desconto</span>
              <Input
                type="number"
                min={0}
                max={subtotal}
                step={0.01}
                value={discount}
                onChange={(e) => setDiscount(Math.min(subtotal, Number(e.target.value)))}
                className="w-24 h-8 text-right"
              />
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Método de pagamento */}
          <div className="space-y-3">
            <Label>Forma de Pagamento</Label>
            <RadioGroup 
              value={selectedMethod} 
              onValueChange={setSelectedMethod}
              className="grid grid-cols-2 gap-2"
            >
              {paymentMethods.map((method) => (
                <Label
                  key={method.value}
                  htmlFor={method.value}
                  className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMethod === method.value 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-muted-foreground/50'
                  }`}
                >
                  <RadioGroupItem value={method.value} id={method.value} />
                  <method.icon className="h-4 w-4" />
                  <span className="text-sm">{method.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </div>

          {/* Troco (apenas para dinheiro) */}
          {selectedMethod === 'dinheiro' && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="received">Valor Recebido</Label>
                <Input
                  id="received"
                  type="number"
                  min={0}
                  step={0.01}
                  value={receivedAmount || ''}
                  onChange={(e) => setReceivedAmount(Number(e.target.value))}
                  placeholder="0,00"
                  className="text-right text-lg"
                />
              </div>
              {receivedAmount > 0 && (
                <div className="flex justify-between text-lg font-bold">
                  <span>Troco</span>
                  <span className={change > 0 ? 'text-green-600' : ''}>
                    {formatCurrency(change)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              `Confirmar ${formatCurrency(total)}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
