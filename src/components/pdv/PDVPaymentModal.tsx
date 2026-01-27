import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/utils';
import { CreditCard, Banknote, QrCode, Wallet, Loader2, X, Package, Printer } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { CartItem } from '@/hooks/usePDV';

interface PDVPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subtotal: number;
  items: CartItem[];
  onConfirm: (paymentMethod: string, discount: number, paymentDetails?: Record<string, any>, shouldPrint?: boolean) => void;
  isProcessing?: boolean;
}

const paymentMethods = [
  { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { value: 'credito', label: 'Crédito', icon: CreditCard },
  { value: 'debito', label: 'Débito', icon: CreditCard },
  { value: 'pix', label: 'PIX', icon: QrCode },
  { value: 'outros', label: 'Outros', icon: Wallet },
];

export function PDVPaymentModal({
  open,
  onOpenChange,
  subtotal,
  items,
  onConfirm,
  isProcessing = false,
}: PDVPaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState('dinheiro');
  const [discount, setDiscount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [shouldPrint, setShouldPrint] = useState(true);
  const isMobile = useIsMobile();

  const total = subtotal - discount;
  const change = selectedMethod === 'dinheiro' ? Math.max(0, receivedAmount - total) : 0;

  const handleConfirm = () => {
    const paymentDetails: Record<string, any> = {};
    
    if (selectedMethod === 'dinheiro') {
      paymentDetails.received_amount = receivedAmount;
      paymentDetails.change = change;
    }

    onConfirm(selectedMethod, discount, paymentDetails, shouldPrint);
  };

  const handleClose = () => {
    if (!isProcessing) {
      setSelectedMethod('dinheiro');
      setDiscount(0);
      setReceivedAmount(0);
      onOpenChange(false);
    }
  };

  // Componente de lista de itens reutilizável
  const ItemsList = ({ maxHeight }: { maxHeight: string }) => (
    <ScrollArea className={`${maxHeight} border rounded-lg`}>
      <div className="p-2 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
            {item.image_url ? (
              <img 
                src={item.image_url} 
                alt={item.product_name}
                className="w-12 h-12 object-cover rounded flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 bg-muted-foreground/20 rounded flex items-center justify-center flex-shrink-0">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm break-words leading-tight">{item.product_name}</p>
              <p className="text-xs text-muted-foreground">
                {item.quantity}× {formatCurrency(item.unit_price)}
              </p>
            </div>
            <p className="font-bold text-sm whitespace-nowrap min-w-[70px] text-right">
              {formatCurrency(item.total_price)}
            </p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  // Componente de resumo e pagamento
  const PaymentSection = () => (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="bg-muted rounded-lg p-4 space-y-3">
        <div className={`flex justify-between ${isMobile ? 'text-base' : ''}`}>
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatCurrency(subtotal)}</span>
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
            className={`text-right ${isMobile ? 'w-28 h-12 text-lg' : 'w-24 h-8'}`}
          />
        </div>
        <div className={`flex justify-between font-bold pt-2 border-t ${isMobile ? 'text-xl' : 'text-lg'}`}>
          <span>Total</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Método de pagamento */}
      <div className="space-y-3">
        <Label className={isMobile ? 'text-base' : ''}>Forma de Pagamento</Label>
        <div className="grid grid-cols-2 gap-2">
          {paymentMethods.map((method) => (
            <Button
              key={method.value}
              variant={selectedMethod === method.value ? "default" : "outline"}
              className={`flex items-center gap-2 ${isMobile ? 'h-14 text-base' : 'h-12'}`}
              onClick={() => setSelectedMethod(method.value)}
            >
              <method.icon className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
              {method.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Troco (apenas para dinheiro) */}
      {selectedMethod === 'dinheiro' && (
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="received" className={isMobile ? 'text-base' : ''}>Valor Recebido</Label>
            <Input
              id="received"
              type="number"
              min={0}
              step={0.01}
              value={receivedAmount || ''}
              onChange={(e) => setReceivedAmount(Number(e.target.value))}
              placeholder="0,00"
              className={`text-right ${isMobile ? 'h-14 text-xl' : 'text-lg'}`}
            />
          </div>
          {receivedAmount > 0 && (
            <div className={`flex justify-between font-bold ${isMobile ? 'text-xl' : 'text-lg'}`}>
              <span>Troco</span>
              <span className={change > 0 ? 'text-green-600' : ''}>
                {formatCurrency(change)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const footer = (
    <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'sm:flex-row sm:justify-between sm:items-center'}`}>
      {/* Toggle de impressão */}
      <button
        type="button"
        onClick={() => setShouldPrint(!shouldPrint)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          shouldPrint 
            ? 'bg-primary/10 text-primary border border-primary/30' 
            : 'bg-muted text-muted-foreground border border-border'
        } ${isMobile ? 'justify-center h-12' : ''}`}
      >
        <Printer className="h-4 w-4" />
        <span className="text-sm font-medium">
          {shouldPrint ? 'Imprimir recibo' : 'Sem impressão'}
        </span>
      </button>
      
      <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
        <Button
          size={isMobile ? "lg" : "default"}
          className={`${isMobile ? 'h-14 text-lg' : ''}`}
          onClick={handleConfirm}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            `Confirmar ${formatCurrency(total)}`
          )}
        </Button>
        <Button 
          variant="outline" 
          size={isMobile ? "lg" : "default"}
          onClick={handleClose} 
          disabled={isProcessing}
          className={isMobile ? 'h-12' : ''}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );

  // Usar Drawer no mobile, Dialog expandido no desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl">Finalizar Venda</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="absolute right-4 top-4">
                <X className="h-5 w-5" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="overflow-auto max-h-[60vh] pb-4">
            <div className="space-y-4 px-4">
              {items.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-base">Itens da Venda ({items.length})</Label>
                  <ItemsList maxHeight="max-h-60" />
                </div>
              )}
              <PaymentSection />
            </div>
          </div>
          <DrawerFooter className="pt-2">
            {footer}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Modal grande com 2 colunas
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">Finalizar Venda</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-8 overflow-hidden">
          {/* Coluna Esquerda - Lista de Itens */}
          <div className="space-y-3 overflow-hidden">
            <Label className="text-base font-semibold">Itens da Venda ({items.length})</Label>
            <ItemsList maxHeight="h-[500px]" />
          </div>

          {/* Coluna Direita - Pagamento */}
          <div className="space-y-4 overflow-auto max-h-[550px] pr-2">
            <PaymentSection />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4 border-t">
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
