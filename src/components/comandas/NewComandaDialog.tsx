import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, X } from 'lucide-react';
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
  const isMobile = useIsMobile();

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

  const content = (
    <div className={`space-y-6 ${isMobile ? 'px-4' : ''}`}>
      {/* Tipo de comanda - botões grandes */}
      <div className="space-y-3">
        <Label className={isMobile ? 'text-base' : ''}>Tipo de Comanda</Label>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={type === 'balcao' ? 'default' : 'outline'}
            className={`flex flex-col items-center gap-2 ${isMobile ? 'h-28 text-lg' : 'h-24'}`}
            onClick={() => setType('balcao')}
          >
            <span className={isMobile ? 'text-4xl' : 'text-3xl'}>🛒</span>
            <span className="font-medium">Balcão</span>
          </Button>

          <Button
            variant={type === 'mesa' ? 'default' : 'outline'}
            className={`flex flex-col items-center gap-2 ${isMobile ? 'h-28 text-lg' : 'h-24'}`}
            onClick={() => setType('mesa')}
          >
            <span className={isMobile ? 'text-4xl' : 'text-3xl'}>🍽️</span>
            <span className="font-medium">Mesa</span>
          </Button>
        </div>
      </div>

      {/* Número da mesa (apenas para mesa) */}
      {type === 'mesa' && (
        <div className="space-y-2">
          <Label htmlFor="tableNumber" className={isMobile ? 'text-base' : ''}>Número da Mesa *</Label>
          <Input
            id="tableNumber"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="Ex: 1, 2, A1..."
            autoFocus
            className={isMobile ? 'h-14 text-lg' : ''}
          />
        </div>
      )}

      {/* Nome do cliente (opcional) */}
      <div className="space-y-2">
        <Label htmlFor="customerName" className={isMobile ? 'text-base' : ''}>Nome do Cliente (opcional)</Label>
        <Input
          id="customerName"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Nome do cliente"
          className={isMobile ? 'h-14 text-lg' : ''}
        />
      </div>
    </div>
  );

  const footer = (
    <div className={`flex gap-2 ${isMobile ? 'flex-col' : 'sm:flex-row sm:justify-end'}`}>
      <Button 
        size={isMobile ? "lg" : "default"}
        className={isMobile ? 'h-14 text-lg' : ''}
        onClick={handleConfirm} 
        disabled={!isValid || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Criando...
          </>
        ) : (
          'Abrir Comanda'
        )}
      </Button>
      <Button 
        variant="outline" 
        size={isMobile ? "lg" : "default"}
        onClick={handleClose} 
        disabled={isLoading}
        className={isMobile ? 'h-12' : ''}
      >
        Cancelar
      </Button>
    </div>
  );

  // Usar Drawer no mobile, Dialog no desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="text-xl">Nova Comanda</DrawerTitle>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="absolute right-4 top-4">
                <X className="h-5 w-5" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
          <div className="overflow-auto max-h-[60vh] pb-4">
            {content}
          </div>
          <DrawerFooter className="pt-2">
            {footer}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Comanda</DialogTitle>
        </DialogHeader>
        {content}
        <DialogFooter className="gap-2">
          {footer}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
