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
import { Switch } from '@/components/ui/switch';
import { formatCurrency } from '@/lib/utils';
import { CreditCard, Banknote, QrCode, Wallet, Loader2, Printer } from 'lucide-react';

interface CloseComandaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtotal: number;
  onConfirm: (paymentMethod: string, discount: number, serviceFee: number, paymentDetails?: Record<string, any>) => void;
  isProcessing?: boolean;
  onPrint?: () => void;
}

const paymentMethods = [
  { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { value: 'credito', label: 'Cartão Crédito', icon: CreditCard },
  { value: 'debito', label: 'Cartão Débito', icon: CreditCard },
  { value: 'pix', label: 'PIX', icon: QrCode },
  { value: 'outros', label: 'Outros', icon: Wallet },
];

export function CloseComandaModal({
  open,
  onOpenChange,
  subtotal,
  onConfirm,
  isProcessing = false,
  onPrint,
}: CloseComandaModalProps) {
  const [selectedMethod, setSelectedMethod] = useState('dinheiro');
  const [discount, setDiscount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [includeServiceFee, setIncludeServiceFee] = useState(true);
  const [serviceFeePercentage, setServiceFeePercentage] = useState(10);

  const serviceFee = includeServiceFee ? (subtotal * serviceFeePercentage) / 100 : 0;
  const total = subtotal + serviceFee - discount;
  const change = selectedMethod === 'dinheiro' ? Math.max(0, receivedAmount - total) : 0;

  const handleConfirm = () => {
    const paymentDetails: Record<string, any> = {};
    
    if (selectedMethod === 'dinheiro') {
      paymentDetails.received_amount = receivedAmount;
      paymentDetails.change = change;
    }

    onConfirm(selectedMethod, discount, serviceFee, paymentDetails);
  };

  const handleClose = () => {
    if (!isProcessing) {
      setSelectedMethod('dinheiro');
      setDiscount(0);
      setReceivedAmount(0);
      setIncludeServiceFee(true);
      setServiceFeePercentage(10);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Fechar Comanda</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resumo */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            
            {/* Taxa de Serviço */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Switch
                  id="service-fee"
                  checked={includeServiceFee}
                  onCheckedChange={setIncludeServiceFee}
                />
                <Label htmlFor="service-fee" className="text-muted-foreground cursor-pointer">
                  Taxa de Serviço
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={serviceFeePercentage}
                  onChange={(e) => setServiceFeePercentage(Number(e.target.value))}
                  className="w-16 h-8 text-right"
                  disabled={!includeServiceFee}
                />
                <span className="text-sm text-muted-foreground">%</span>
                {includeServiceFee && (
                  <span className="text-sm font-medium ml-2">
                    ({formatCurrency(serviceFee)})
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Desconto</span>
              <Input
                type="number"
                min={0}
                max={subtotal + serviceFee}
                step={0.01}
                value={discount}
                onChange={(e) => setDiscount(Math.min(subtotal + serviceFee, Number(e.target.value)))}
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
                  htmlFor={`close-${method.value}`}
                  className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMethod === method.value 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-muted-foreground/50'
                  }`}
                >
                  <RadioGroupItem value={method.value} id={`close-${method.value}`} />
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
                <Label htmlFor="received-close">Valor Recebido</Label>
                <Input
                  id="received-close"
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

        <DialogFooter className="gap-2 sm:gap-2">
          {onPrint && (
            <Button variant="outline" onClick={onPrint} disabled={isProcessing}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          )}
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
