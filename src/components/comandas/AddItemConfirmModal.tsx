import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Minus, Plus, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
}

interface AddItemConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onConfirm: (product: Product, quantity: number, notes: string) => void;
  isAdding?: boolean;
}

export function AddItemConfirmModal({
  open,
  onOpenChange,
  product,
  onConfirm,
  isAdding = false,
}: AddItemConfirmModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (!product) return;
    onConfirm(product, quantity, notes);
    // Reset state after confirm
    setQuantity(1);
    setNotes('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setQuantity(1);
    setNotes('');
  };

  const decreaseQuantity = () => {
    if (quantity > 1) setQuantity(q => q - 1);
  };

  const increaseQuantity = () => {
    setQuantity(q => q + 1);
  };

  if (!product) return null;

  const totalPrice = product.price * quantity;

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">Confirmar Adição</AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Imagem do produto */}
          {product.image_url && (
            <div className="w-24 h-24 mx-auto rounded-lg overflow-hidden bg-muted">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Nome e preço */}
          <div className="text-center">
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <p className="text-muted-foreground">{formatCurrency(product.price)} cada</p>
          </div>

          {/* Seletor de quantidade */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={decreaseQuantity}
              disabled={quantity <= 1}
            >
              <Minus className="h-5 w-5" />
            </Button>
            <span className="text-3xl font-bold w-16 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={increaseQuantity}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>

          {/* Total */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(totalPrice)}</p>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Input
              id="notes"
              placeholder="Ex: Sem cebola, bem passado..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
            disabled={isAdding}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="w-full sm:w-auto"
            disabled={isAdding}
          >
            {isAdding ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adicionando...
              </>
            ) : (
              <>Confirmar Adição</>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
