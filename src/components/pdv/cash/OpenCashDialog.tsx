import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CashController } from './types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cash: CashController;
}

export function OpenCashDialog({ open, onOpenChange, cash }: Props) {
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      setAmount(0);
      setNotes('');
    }
  }, [open]);

  const submit = async () => {
    try {
      await cash.openCash.mutateAsync({ openingAmount: amount, notes });
      onOpenChange(false);
    } catch {
      // o toast já mostra o erro
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !cash.openCash.isPending && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Abrir caixa</DialogTitle>
          <DialogDescription>Informe quanto de dinheiro tem na gaveta para troco.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cash-opening">Troco inicial</Label>
            <CurrencyInput id="cash-opening" value={amount} onChange={setAmount} autoFocus placeholder="0,00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cash-opening-notes">Observação (opcional)</Label>
            <Textarea id="cash-opening-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={300} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={cash.openCash.isPending}>Cancelar</Button>
          <Button onClick={submit} disabled={cash.openCash.isPending}>
            {cash.openCash.isPending ? 'Abrindo...' : 'Abrir caixa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
