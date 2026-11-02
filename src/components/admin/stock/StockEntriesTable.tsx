// Histórico de entradas de mercadoria (mais recentes primeiro).
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { brl } from '@/lib/brl';
import type { StockEntryRow } from '@/hooks/stock/stockQueries';

const dateFmt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export function StockEntriesTable({ entries }: { entries: StockEntryRow[] }) {
  if (entries.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-10">Nenhuma entrada registrada ainda.</p>;
  }
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Custo unit.</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Nota</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap">{dateFmt.format(new Date(e.created_at))}</TableCell>
                <TableCell className="min-w-[160px]">
                  <p>{e.products?.name ?? 'Produto removido'}</p>
                  {e.notes && <p className="text-xs text-muted-foreground">{e.notes}</p>}
                </TableCell>
                <TableCell className="text-right font-semibold text-green-700 dark:text-green-400">+{e.quantity}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {Number(e.unit_cost) > 0 ? brl(e.unit_cost) : '—'}
                </TableCell>
                <TableCell>{e.supplier ?? '—'}</TableCell>
                <TableCell>{e.invoice_number ?? '—'}</TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  {e.stock_before ?? 0} → {e.stock_after ?? 0}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {entries.length >= 200 && (
        <p className="text-xs text-muted-foreground">Mostrando as últimas 200 entradas.</p>
      )}
    </div>
  );
}
