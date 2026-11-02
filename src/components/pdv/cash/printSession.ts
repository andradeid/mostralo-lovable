import { toast } from 'sonner';
import { fetchCashMovements, type CashSession } from '@/hooks/pdvCash/useCashSession';
import type { CashSummary } from '@/lib/pdvCash/cashReport';
import { printCashReport } from '@/utils/printCashReport';

interface PrintSessionOptions {
  session: CashSession & { opened_by_name?: string | null; closed_by_name?: string | null };
  /** Resumo ao vivo (caixa aberto); para caixa fechado usa o resumo guardado no fechamento. */
  summary?: CashSummary | null;
  storeName: string;
  timeZone?: string;
}

/** Busca sangrias/suprimentos e abre a impressão 80mm do relatório do caixa. */
export async function printCashSession({ session, summary, storeName, timeZone }: PrintSessionOptions) {
  const finalSummary = summary ?? session.summary;
  if (!finalSummary) {
    toast.error('Resumo do caixa indisponível');
    return;
  }
  let movements: Awaited<ReturnType<typeof fetchCashMovements>> = [];
  try {
    movements = await fetchCashMovements(session.id);
  } catch {
    // imprime mesmo sem a lista de movimentos
  }
  printCashReport({
    storeName,
    summary: finalSummary,
    openedAt: session.opened_at,
    closedAt: session.status === 'closed' ? session.closed_at : null,
    openedByName: session.opened_by_name,
    closedByName: session.closed_by_name,
    countedAmount: session.status === 'closed' ? session.counted_amount : null,
    openingNotes: session.opening_notes,
    closingNotes: session.closing_notes,
    movements,
    timeZone,
  });
}
