import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CashController } from './types';

interface Props {
  type: 'sangria' | 'suprimento' | null;
  onOpenChange: (open: boolean) => void;
  cash: CashController;
}

const TEXTS = {
  sangria: { title: 'Sangria', description: 'Dinheiro que sai da gaveta (ex.: depósito, pagamento de fornecedor).', placeholder: 'Ex.: depósito no banco' },
  suprimento: { title: 'Suprimento', description: 'Dinheiro que entra na gaveta (ex.: mais troco).', placeholder: 'Ex.: reforço de troco' },
};

export function CashMovementDialog({ type, onOpenChange, cash }: Props) {
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('');
  const sessionId = cash.openSession?.id;
  const t = TEXTS[type ?? 'sangria'];

  useEffect(() => {
    if (type) {
      setAmount(0);
      setReason('');
    }
  }, [type]);

  const submit = async () => {
    if (!type || !sessionId) return;
    try {
      await cash.addMovement.mutateAsync({ sessionId, type, amount, reason });
      onOpenChange(false);
    } catch {
      // o toast já mostra o erro
    }
  };

  const pending = cash.addMovement.isPending;

  return (
    <Dialog open={!!type} onOpenChange={(v) => !pending && onOpenChange(v)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cash-mov-amount">Valor</Label>
            <CurrencyInput id="cash-mov-amount" value={amount} onChange={setAmount} autoFocus placeholder="0,00" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cash-mov-reason">Motivo</Label>
            <Input id="cash-mov-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t.placeholder} maxLength={200} />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancelar</Button>
          <Button onClick={submit} disabled={pending || amount <= 0 || !sessionId}>
            {pending ? 'Salvando...' : `Registrar ${t.title.toLowerCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
