import { Loader2, Printer, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCashHistory, useCashMovements, useCashSummary } from '@/hooks/pdvCash/useCashSession';
import { formatBRL, formatDateTimeBR } from '@/lib/pdvCash/cashReport';
import { CashDifferenceText, CashSummaryView } from './CashSummaryView';
import { printCashSession } from './printSession';
import type { CashController, CashDialogKind } from './types';

interface Props {
  cash: CashController;
  storeId: string | null;
  storeName: string;
  timeZone?: string;
  onAction: (kind: Exclude<CashDialogKind, null>) => void;
}

function CurrentCash({ cash, storeName, timeZone, onAction }: Omit<Props, 'storeId'>) {
  const session = cash.openSession;
  const summary = useCashSummary(session?.id, true);
  const movements = useCashMovements(session?.id);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between gap-2">
          <span>Caixa atual</span>
          {session && summary.data && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 gap-1"
              onClick={() => printCashSession({ session, summary: summary.data, storeName, timeZone })}
            >
              <Printer className="h-4 w-4" /> Imprimir parcial
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cash.isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : !session ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center text-muted-foreground">
            <Wallet className="h-10 w-10 opacity-50" />
            <p>O caixa está fechado.</p>
            <Button onClick={() => onAction('open')}>Abrir caixa</Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Aberto em {formatDateTimeBR(session.opened_at, timeZone)}
              {session.opening_notes ? ` · ${session.opening_notes}` : ''}
            </p>
            {summary.data ? (
              <CashSummaryView summary={summary.data} />
            ) : (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            )}
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">Sangrias e suprimentos</p>
              {(movements.data || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum lançamento.</p>
              ) : (
                <ul className="space-y-1.5">
                  {movements.data!.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate">
                        <span className="text-muted-foreground tabular-nums">{formatDateTimeBR(m.created_at, timeZone).split(' ').pop()}</span>{' '}
                        {m.type === 'sangria' ? 'Sangria' : 'Suprimento'}
                        {m.reason ? <span className="text-muted-foreground"> · {m.reason}</span> : null}
                      </span>
                      <span className={`tabular-nums font-medium ${m.type === 'sangria' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {m.type === 'sangria' ? '−' : '+'}{formatBRL(m.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => onAction('sangria')}>Sangria</Button>
              <Button variant="outline" size="sm" onClick={() => onAction('suprimento')}>Suprimento</Button>
              <Button size="sm" onClick={() => onAction('close')}>Fechar caixa</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function CashHistory({ storeId, storeName, timeZone }: { storeId: string | null; storeName: string; timeZone?: string }) {
  const history = useCashHistory(storeId, true);
  const items = history.data || [];
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Caixas fechados</CardTitle>
      </CardHeader>
      <CardContent>
        {history.isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">Nenhum caixa fechado ainda.</p>
        ) : (
          <ul className="divide-y">
            {items.map((s) => (
              <li key={s.id} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0 space-y-0.5 text-sm">
                  <p className="font-medium">
                    {formatDateTimeBR(s.opened_at, timeZone)} → {formatDateTimeBR(s.closed_at, timeZone).split(' ').pop()}
                  </p>
                  {(s.opened_by_name || s.closed_by_name) && (
                    <p className="truncate text-xs text-muted-foreground">
                      {s.opened_by_name ? `Abriu: ${s.opened_by_name}` : ''}
                      {s.opened_by_name && s.closed_by_name ? ' · ' : ''}
                      {s.closed_by_name ? `Fechou: ${s.closed_by_name}` : ''}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Esperado {formatBRL(s.expected_cash ?? 0)} · Contado {formatBRL(s.counted_amount ?? 0)}
                  </p>
                  <CashDifferenceText className="text-xs" counted={s.counted_amount ?? 0} expected={s.expected_cash ?? 0} />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0"
                  title="Imprimir relatório"
                  onClick={() => printCashSession({ session: s, storeName, timeZone })}
                >
                  <Printer className="h-4 w-4" />
                  <span className="sr-only">Imprimir relatório</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function RequireOpenCashSetting({ cash }: { cash: CashController }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-4">
        <div className="space-y-1">
          <Label htmlFor="pdv-require-open-cash" className="text-sm font-medium">Exigir caixa aberto para vender</Label>
          <p className="text-xs text-muted-foreground">
            Ligado: o PDV só finaliza vendas e fecha comandas com o caixa aberto.
            {!cash.canManageSettings && ' Só o dono ou administrador da loja pode mudar.'}
          </p>
        </div>
        <Switch
          id="pdv-require-open-cash"
          checked={cash.requireOpenCash}
          disabled={!cash.canManageSettings || cash.setRequireOpenCash.isPending}
          onCheckedChange={(v) => cash.setRequireOpenCash.mutate(v)}
        />
      </CardContent>
    </Card>
  );
}

/** Aba "Caixa" do PDV: caixa atual, histórico de caixas fechados e a opção de exigir caixa aberto. */
export function CashTab(props: Props) {
  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pb-4">
        <RequireOpenCashSetting cash={props.cash} />
        <div className="grid gap-4 lg:grid-cols-2">
          <CurrentCash cash={props.cash} storeName={props.storeName} timeZone={props.timeZone} onAction={props.onAction} />
          <CashHistory storeId={props.storeId} storeName={props.storeName} timeZone={props.timeZone} />
        </div>
      </div>
    </ScrollArea>
  );
}
