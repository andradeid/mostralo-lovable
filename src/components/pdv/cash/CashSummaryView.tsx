import { Separator } from '@/components/ui/separator';
import { cashDifference, formatBRL, methodRows, type CashSummary } from '@/lib/pdvCash/cashReport';
import { cn } from '@/lib/utils';

function Row({ label, value, strong, className }: { label: string; value: string; strong?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 text-sm', strong && 'font-semibold', className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

/** Resumo do caixa: vendas por forma, total, sangrias/suprimentos e dinheiro esperado na gaveta. */
export function CashSummaryView({ summary }: { summary: CashSummary }) {
  const rows = methodRows(summary);
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase text-muted-foreground">Vendas por forma de pagamento</p>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma venda desde a abertura.</p>
        ) : (
          rows.map((r) => (
            <Row key={r.key} label={`${r.label} (${r.count})`} value={formatBRL(r.total)} />
          ))
        )}
        <Row label={`Total vendido (${summary.sales_count})`} value={formatBRL(summary.sales_total)} strong />
        {summary.discounts > 0 && <Row label="Descontos dados" value={formatBRL(summary.discounts)} />}
      </div>

      <Separator />

      <div className="space-y-1.5">
        <p className="text-xs font-medium uppercase text-muted-foreground">Dinheiro na gaveta</p>
        <Row label="Troco inicial" value={formatBRL(summary.opening_amount)} />
        <Row label="+ Vendas em dinheiro" value={formatBRL(summary.cash_sales)} />
        <Row label="+ Suprimentos" value={formatBRL(summary.suprimentos)} />
        <Row label="− Sangrias" value={formatBRL(summary.sangrias)} />
        <div className="flex items-center justify-between rounded-md bg-primary/10 px-3 py-2">
          <span className="text-sm font-semibold">Dinheiro esperado na gaveta</span>
          <span className="text-lg font-bold tabular-nums text-primary">{formatBRL(summary.expected_cash)}</span>
        </div>
      </div>
    </div>
  );
}

/** Diferença contado − esperado com cor: verde "sobrou", vermelho "faltou", neutro "bateu". */
export function CashDifferenceText({ counted, expected, className }: { counted: number; expected: number; className?: string }) {
  const diff = cashDifference(counted, expected);
  const color =
    diff.status === 'sobrou' ? 'text-green-600 dark:text-green-400'
    : diff.status === 'faltou' ? 'text-red-600 dark:text-red-400'
    : 'text-muted-foreground';
  return (
    <span className={cn('font-semibold tabular-nums', color, className)}>
      {diff.status === 'bateu' ? 'Bateu' : `${diff.label} ${formatBRL(Math.abs(diff.value))}`}
    </span>
  );
}
