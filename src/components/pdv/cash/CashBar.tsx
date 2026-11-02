import { ArrowDownCircle, ArrowUpCircle, Lock, LockOpen, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatBRL } from '@/lib/pdvCash/cashReport';
import { cn } from '@/lib/utils';
import type { CashController, CashDialogKind } from './types';

interface Props {
  cash: CashController;
  onAction: (kind: Exclude<CashDialogKind, null>) => void;
  timeZone?: string;
  compact?: boolean;
  className?: string;
}

function openedLabel(iso: string, timeZone?: string): string {
  const d = new Date(iso);
  const opts = timeZone ? { timeZone } : {};
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', ...opts });
  const day = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', ...opts });
  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', ...opts });
  return day === today ? time : `${day} ${time}`;
}

/** Barra compacta do caixa no topo do PDV. */
export function CashBar({ cash, onAction, timeZone, compact, className }: Props) {
  if (cash.isLoading) return null;
  const session = cash.openSession;
  const btn = compact ? 'h-8 px-2 text-xs' : 'h-8';

  if (!session) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm',
          cash.requireOpenCash ? 'border-amber-500/40 bg-amber-500/10' : 'bg-muted/40',
          className,
        )}
      >
        <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate">
          <span className="font-medium">Caixa fechado</span>
          {cash.requireOpenCash && <span className="text-muted-foreground"> — abra o caixa para vender</span>}
        </span>
        <Button size="sm" className={btn} onClick={() => onAction('open')}>
          <Wallet className="h-4 w-4 mr-1" /> Abrir caixa
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2 rounded-md border border-green-500/30 bg-green-500/5 px-3 py-1.5 text-sm', className)}>
      <LockOpen className="h-4 w-4 shrink-0 text-green-600" />
      <span className="min-w-0 flex-1 truncate">
        <span className="font-medium">Caixa aberto</span>
        <span className="text-muted-foreground"> desde {openedLabel(session.opened_at, timeZone)} · troco {formatBRL(session.opening_amount)}</span>
      </span>
      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="outline" className={btn} onClick={() => onAction('sangria')} title="Sangria">
          <ArrowUpCircle className="h-4 w-4 sm:mr-1" /><span className={compact ? 'sr-only' : ''}>Sangria</span>
        </Button>
        <Button size="sm" variant="outline" className={btn} onClick={() => onAction('suprimento')} title="Suprimento">
          <ArrowDownCircle className="h-4 w-4 sm:mr-1" /><span className={compact ? 'sr-only' : ''}>Suprimento</span>
        </Button>
        <Button size="sm" className={btn} onClick={() => onAction('close')}>
          Fechar caixa
        </Button>
      </div>
    </div>
  );
}
