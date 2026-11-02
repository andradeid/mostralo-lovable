import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCashSummary, type CashSession } from '@/hooks/pdvCash/useCashSession';
import { formatBRL } from '@/lib/pdvCash/cashReport';
import { CashDifferenceText, CashSummaryView } from './CashSummaryView';
import { printCashSession } from './printSession';
import type { CashController } from './types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cash: CashController;
  storeName: string;
  timeZone?: string;
}

export function CloseCashDialog({ open, onOpenChange, cash, storeName, timeZone }: Props) {
  const session = cash.openSession;
  const [counted, setCounted] = useState(0);
  const [touched, setTouched] = useState(false);
  const [notes, setNotes] = useState('');
  const [closed, setClosed] = useState<CashSession | null>(null);
  const summaryQuery = useCashSummary(session?.id, open && !closed);
  const summary = summaryQuery.data;

  useEffect(() => {
    if (open) {
      setCounted(0);
      setTouched(false);
      setNotes('');
      setClosed(null);
    }
  }, [open]);

  const pending = cash.closeCash.isPending;

  const submit = async () => {
    if (!session) return;
    try {
      const result = await cash.closeCash.mutateAsync({ sessionId: session.id, countedAmount: counted, notes });
      setClosed(result);
    } catch {
      // o toast já mostra o erro
    }
  };

  const content = closed ? (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" /> Caixa fechado
        </DialogTitle>
        <DialogDescription>Guarde o relatório junto com o dinheiro.</DialogDescription>
      </DialogHeader>
      <div className="space-y-2 rounded-md border p-3 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Esperado</span><span className="tabular-nums">{formatBRL(closed.expected_cash ?? 0)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Contado</span><span className="tabular-nums">{formatBRL(closed.counted_amount ?? 0)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Diferença</span>
          <CashDifferenceText counted={closed.counted_amount ?? 0} expected={closed.expected_cash ?? 0} />
        </div>
      </div>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>Concluir</Button>
        <Button onClick={() => printCashSession({ session: closed, storeName, timeZone })} className="gap-2">
          <Printer className="h-4 w-4" /> Imprimir relatório
        </Button>
      </DialogFooter>
    </>
  ) : (
    <>
      <DialogHeader>
        <DialogTitle>Fechar caixa</DialogTitle>
        <DialogDescription>Confira o resumo, conte o dinheiro da gaveta e informe o valor.</DialogDescription>
      </DialogHeader>
      <ScrollArea className="max-h-[60vh] pr-3">
        <div className="space-y-4">
          {summaryQuery.isLoading || !summary ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              {summaryQuery.isError ? 'Não foi possível carregar o resumo.' : <Loader2 className="h-5 w-5 animate-spin" />}
            </div>
          ) : (
            <CashSummaryView summary={summary} />
          )}
          <div className="space-y-2">
            <Label htmlFor="cash-counted">Quanto tem na gaveta (contado)</Label>
            <CurrencyInput
              id="cash-counted"
              value={counted}
              onChange={(v) => { setCounted(v); setTouched(true); }}
              placeholder="0,00"
            />
            {touched && summary && (
              <p className="text-sm">
                Diferença: <CashDifferenceText counted={counted} expected={summary.expected_cash} />
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="cash-closing-notes">Observação (opcional)</Label>
            <Textarea id="cash-closing-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={300} />
          </div>
        </div>
      </ScrollArea>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancelar</Button>
        <Button onClick={submit} disabled={pending || !touched || !session || !summary}>
          {pending ? 'Fechando...' : 'Confirmar fechamento'}
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !pending && onOpenChange(v)}>
      <DialogContent className="sm:max-w-lg">{content}</DialogContent>
    </Dialog>
  );
}
