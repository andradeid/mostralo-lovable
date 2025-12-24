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
import { Loader2 } from 'lucide-react';

interface NewComandaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (type: 'balcao' | 'mesa', tableNumber?: string, customerName?: string) => void;
  isLoading?: boolean;
}

export function NewComandaDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
}: NewComandaDialogProps) {
  const [type, setType] = useState<'balcao' | 'mesa'>('balcao');
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');

  const handleConfirm = () => {
    onConfirm(
      type,
      type === 'mesa' ? tableNumber : undefined,
      customerName || undefined
    );
  };

  const handleClose = () => {
    if (!isLoading) {
      setType('balcao');
      setTableNumber('');
      setCustomerName('');
      onOpenChange(false);
    }
  };

  const isValid = type === 'balcao' || (type === 'mesa' && tableNumber.trim() !== '');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Comanda</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tipo de comanda */}
          <div className="space-y-3">
            <Label>Tipo</Label>
            <RadioGroup 
              value={type} 
              onValueChange={(v) => setType(v as 'balcao' | 'mesa')}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="balcao"
                className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                  type === 'balcao' 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-muted-foreground/50'
                }`}
              >
                <RadioGroupItem value="balcao" id="balcao" className="sr-only" />
                <span className="text-2xl">🛒</span>
                <span className="font-medium">Balcão</span>
                <span className="text-xs text-muted-foreground text-center">
                  Venda rápida no balcão
                </span>
              </Label>

              <Label
                htmlFor="mesa"
                className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer transition-colors ${
                  type === 'mesa' 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-muted-foreground/50'
                }`}
              >
                <RadioGroupItem value="mesa" id="mesa" className="sr-only" />
                <span className="text-2xl">🍽️</span>
                <span className="font-medium">Mesa</span>
                <span className="text-xs text-muted-foreground text-center">
                  Consumo em mesa
                </span>
              </Label>
            </RadioGroup>
          </div>

          {/* Número da mesa (apenas para mesa) */}
          {type === 'mesa' && (
            <div className="space-y-2">
              <Label htmlFor="tableNumber">Número da Mesa *</Label>
              <Input
                id="tableNumber"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Ex: 1, 2, A1..."
                autoFocus
              />
            </div>
          )}

          {/* Nome do cliente (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="customerName">Nome do Cliente (opcional)</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nome do cliente"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              'Abrir Comanda'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
