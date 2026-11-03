// "Informe o peso": produto vendido por quilo. Peso em kg com vírgula, mostra o valor calculado,
// Enter adiciona, Esc cancela. Inline no modo Misto; em diálogo (WeightDialog) nos outros modos.
import { useEffect, useRef, useState } from 'react';
import { Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn, formatCurrency } from '@/lib/utils';
import { formatKg, parseWeightKg, weightPrice } from '@/lib/pdv/weight';
import type { WeighingState } from './types';
import { Kbd } from './HotkeyHints';

interface PanelProps {
  weighing: WeighingState;
  onConfirm: (kg: number) => void;
  onCancel: () => void;
  className?: string;
  /** Sem moldura (dentro do diálogo). */
  bare?: boolean;
}

export function WeightPanel({ weighing, onConfirm, onCancel, className, bare = false }: PanelProps) {
  const { product, initialKg, replaceItemId } = weighing;
  const [text, setText] = useState(initialKg ? formatKg(initialKg) : '');
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(initialKg ? formatKg(initialKg) : '');
    setTouched(false);
    const t = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 30);
    return () => clearTimeout(t);
  }, [product.id, initialKg, replaceItemId]);

  const parsed = parseWeightKg(text);
  const kg = 'kg' in parsed ? parsed.kg : null;
  const parseError = 'error' in parsed ? parsed.error : '';
  const value = kg != null ? weightPrice(kg, product.price) : 0;
  const showError = touched && !!parseError;

  const submit = () => {
    setTouched(true);
    if (kg != null) onConfirm(kg);
  };

  return (
    <div className={cn(!bare && 'rounded-xl border-2 border-primary/40 bg-card p-4 shadow-sm', 'space-y-3', className)}>
      {!bare && (
        <div className="flex items-start gap-3">
          <Scale className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Informe o peso</p>
            <p className="truncate text-lg font-bold">{product.name}</p>
            <p className="text-sm text-muted-foreground">{formatCurrency(product.price)}/kg</p>
          </div>
        </div>
      )}
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="grid grid-cols-[1fr_auto] items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="pdv-weight">Peso (kg)</Label>
            <Input
              id="pdv-weight"
              ref={inputRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setTouched(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  e.stopPropagation(); // não sai da tela cheia do PDV
                  onCancel();
                }
              }}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,000"
              className="h-14 text-right text-3xl font-bold tabular-nums"
              aria-invalid={showError}
            />
          </div>
          <div className="pb-1 text-right">
            <p className="text-xs text-muted-foreground">Valor</p>
            <p className="text-2xl font-extrabold tabular-nums text-primary">{formatCurrency(value)}</p>
          </div>
        </div>
        <p className={cn('min-h-[1.25rem] text-sm', showError ? 'text-destructive' : 'text-muted-foreground')}>
          {showError ? parseError : 'Use vírgula: 0,450 = 450 g.'}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar <Kbd className="ml-2">Esc</Kbd>
          </Button>
          <Button type="submit" className="flex-1">
            {replaceItemId ? 'Atualizar' : 'Adicionar'} <Kbd className="ml-2 border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground">Enter</Kbd>
          </Button>
        </div>
      </form>
    </div>
  );
}

/** O mesmo painel num diálogo (modos Grade e Lista). */
export function WeightDialog({ weighing, onConfirm, onCancel }: { weighing: WeighingState | null; onConfirm: (kg: number) => void; onCancel: () => void }) {
  return (
    <Dialog open={!!weighing} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm">
        {weighing && (
          <>
            <DialogHeader>
              <DialogTitle>Informe o peso</DialogTitle>
              <DialogDescription>
                {weighing.product.name} · {formatCurrency(weighing.product.price)}/kg
              </DialogDescription>
            </DialogHeader>
            <WeightPanel weighing={weighing} onConfirm={onConfirm} onCancel={onCancel} bare />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
