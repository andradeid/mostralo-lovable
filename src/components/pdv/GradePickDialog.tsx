// PDV: produto com grade (cor × tamanho) — escolhe a combinação na tabela com o estoque de cada uma.
import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchGradeVariants, type StockVariant } from '@/hooks/stock/stockQueries';
import { normalizeGrade } from '@/lib/grade/grade';
import { formatCurrency } from '@/lib/utils';

export interface GradePickProduct {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  grade?: unknown;
}

interface Props {
  product: GradePickProduct | null;
  onPick: (product: GradePickProduct, variant: StockVariant) => void;
  onClose: () => void;
  /** Texto do título (ex.: entrada de mercadoria). */
  title?: string;
  /** Entrada de mercadoria: combinação sem estoque também pode ser escolhida. */
  allowSoldOut?: boolean;
}

export function GradePickDialog({ product, onPick, onClose, title = 'Escolha a cor e o tamanho', allowSoldOut = false }: Props) {
  const [variants, setVariants] = useState<StockVariant[] | null>(null);
  const grade = useMemo(() => normalizeGrade(product?.grade), [product?.grade]);

  useEffect(() => {
    if (!product) return;
    let alive = true;
    setVariants(null);
    fetchGradeVariants(product.id)
      .then((v) => alive && setVariants(v))
      .catch((e) => {
        console.error('[grade] Erro ao buscar combinações:', e);
        if (alive) setVariants([]);
      });
    return () => { alive = false; };
  }, [product]);

  const rows = grade?.attributes[0];
  const cols = grade?.attributes[1];
  const find = (r: string, c?: string) =>
    variants?.find((v) => v.attributes?.[rows!.name] === r && (!cols || v.attributes?.[cols.name] === c));

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{product?.name}</DialogTitle>
          <DialogDescription>{title}{product ? ` · ${formatCurrency(Number(product.price) || 0)}` : ''}</DialogDescription>
        </DialogHeader>
        {!variants ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : !grade || !rows || variants.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6">Este produto ainda não tem combinações cadastradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate" style={{ borderSpacing: 6 }}>
              <thead>
                <tr>
                  <th />
                  {(cols ? cols.values : [{ value: 'Estoque' }]).map((c) => (
                    <th key={c.value} className="text-xs font-semibold text-muted-foreground text-center">{c.value}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.values.map((r) => (
                  <tr key={r.value}>
                    <th scope="row" className="text-left text-sm font-semibold pr-2 whitespace-nowrap">{r.value}</th>
                    {(cols ? cols.values.map((c) => find(r.value, c.value)) : [find(r.value)]).map((v, i) => {
                      if (!v) return <td key={i} />;
                      const qty = v.track_stock && v.stock_quantity != null ? Math.max(0, Number(v.stock_quantity)) : null;
                      const out = qty === 0 && !allowSoldOut;
                      return (
                        <td key={v.id}>
                          <button
                            type="button"
                            disabled={out}
                            onClick={() => product && onPick(product, v)}
                            aria-label={`${v.name}${qty === null ? '' : `, ${qty} em estoque`}`}
                            className={`w-full min-w-14 h-14 rounded-lg border flex flex-col items-center justify-center text-sm font-bold transition ${
                              out ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-background hover:border-primary hover:bg-primary/5'
                            }`}
                          >
                            {cols ? cols.values[i].value : r.value}
                            <span className="text-[11px] font-medium text-muted-foreground">
                              {qty === null ? '' : qty === 0 ? 'esgotado' : `${qty} un.`}
                            </span>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
