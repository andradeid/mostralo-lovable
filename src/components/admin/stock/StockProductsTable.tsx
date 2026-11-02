// Lista dos produtos com estoque controlado: estoque, alerta, custo, valor em estoque e margem.
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PackagePlus } from 'lucide-react';
import { brl } from '@/lib/brl';
import { calculateMargin, effectiveSalePrice, stockValue } from '@/lib/products/margin';
import { stockStatus } from '@/lib/stock/stockEntry';
import type { StockProduct } from '@/hooks/stock/stockQueries';

interface Props {
  products: StockProduct[];
  costs: Record<string, number>;
  onEntry: (product: StockProduct) => void;
}

const STATUS = {
  sem_estoque: { label: 'Sem estoque', className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-900' },
  baixo: { label: 'Baixo', className: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-900' },
  ok: { label: 'OK', className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-900' },
} as const;

export function StockProductsTable({ products, costs, onEntry }: Props) {
  if (products.length === 0) {
    return <p className="text-center text-sm text-muted-foreground py-10">Nenhum produto encontrado.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead className="text-right">Estoque</TableHead>
            <TableHead className="text-right">Alerta</TableHead>
            <TableHead className="text-right">Custo</TableHead>
            <TableHead className="text-right">Valor em estoque</TableHead>
            <TableHead className="text-right">Margem</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => {
            const cost = costs[p.id] ?? null;
            const status = STATUS[stockStatus(p.stock_quantity, p.stock_alert_threshold)];
            const value = stockValue(p.stock_quantity, cost);
            const margin = calculateMargin(effectiveSalePrice(p), cost);
            return (
              <TableRow key={p.id}>
                <TableCell className="min-w-[180px]">
                  <p className="font-medium">{p.name}</p>
                  {p.barcode && <p className="text-xs text-muted-foreground">{p.barcode}</p>}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <span className="font-semibold mr-2">{p.stock_quantity ?? 0}</span>
                  <Badge variant="outline" className={status.className}>{status.label}</Badge>
                </TableCell>
                <TableCell className="text-right">{p.stock_alert_threshold ?? 5}</TableCell>
                <TableCell className="text-right whitespace-nowrap">{cost !== null ? brl(cost) : '—'}</TableCell>
                <TableCell className="text-right whitespace-nowrap">{value !== null ? brl(value) : '—'}</TableCell>
                <TableCell className={`text-right whitespace-nowrap ${margin && margin.profit < 0 ? 'text-destructive' : ''}`}>
                  {margin ? `${margin.percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%` : '—'}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" className="h-8" onClick={() => onEntry(p)}>
                    <PackagePlus className="h-4 w-4 mr-1" />
                    Entrada
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
