// F2: quantidade do último item (número inteiro). Item por quilo abre o peso no lugar.
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { parseQuantity } from '@/lib/pdv/hotkeys';
import type { CartItem } from '@/hooks/usePDV';

interface Props {
  item: CartItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (itemId: string, quantity: number) => void;
}

export function QuantityDialog({ item, open, onOpenChange, onConfirm }: Props) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !item) return;
    setText(String(item.quantity));
    setError('');
    const t = setTimeout(() => inputRef.current?.select(), 30);
    return () => clearTimeout(t);
  }, [open, item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = () => {
    if (!item) return;
    const r = parseQuantity(text);
    if ('error' in r) {
      setError(r.error);
      return;
    }
    onConfirm(item.id, r.quantity);
    onOpenChange(false);
  };

  return (
    <Dialog open={open && !!item} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Quantidade</DialogTitle>
          <DialogDescription className="line-clamp-2">{item?.product_name}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="space-y-3"
        >
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => {
              setText(e.target.value.replace(/\D/g, ''));
              setError('');
            }}
            inputMode="numeric"
            autoComplete="off"
            className="h-14 text-center text-3xl font-bold tabular-nums"
            aria-invalid={!!error}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Confirmar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
