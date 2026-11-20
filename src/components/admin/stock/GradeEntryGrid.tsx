// Entrada de mercadoria de produto com grade: quantos chegaram de cada combinação (cor × tamanho).
import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { fetchGradeVariants, type StockVariant } from '@/hooks/stock/stockQueries';
import { normalizeGrade } from '@/lib/grade/grade';

interface Props {
  productId: string;
  grade: unknown;
  quantities: Record<string, string>;
  onChange: (q: Record<string, string>) => void;
  onVariants?: (v: StockVariant[]) => void;
}

export function GradeEntryGrid({ productId, grade: rawGrade, quantities, onChange, onVariants }: Props) {
  const grade = useMemo(() => normalizeGrade(rawGrade), [rawGrade]);
  const [variants, setVariants] = useState<StockVariant[] | null>(null);

  useEffect(() => {
    let alive = true;
    setVariants(null);
    fetchGradeVariants(productId)
      .then((v) => {
        if (!alive) return;
        setVariants(v);
        onVariants?.(v);
      })
      .catch(() => alive && setVariants([]));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  if (!variants) return <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  const rows = grade?.attributes[0];
  const cols = grade?.attributes[1];
  if (!grade || !rows || !variants.length) return <p className="text-sm text-muted-foreground">Cadastre as combinações da grade no produto antes da entrada.</p>;
  const find = (r: string, c?: string) => variants.find((v) => v.attributes?.[rows.name] === r && (!cols || v.attributes?.[cols.name] === c));

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-muted-foreground">
          <tr>
            <th className="px-2 py-1.5 text-left font-medium">{rows.name}</th>
            {(cols ? cols.values : [{ value: 'Chegaram' }]).map((c) => <th key={c.value} className="px-1 py-1.5 font-medium text-center">{c.value}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.values.map((r) => (
            <tr key={r.value} className="border-t">
              <th scope="row" className="px-2 py-1 text-left font-medium whitespace-nowrap">{r.value}</th>
              {(cols ? cols.values.map((c) => find(r.value, c.value)) : [find(r.value)]).map((v, i) => (
                <td key={i} className="px-1 py-1 text-center">
                  {v && (
                    <div className="flex flex-col items-center">
                      <Input
                        aria-label={`Chegaram ${v.name}`}
                        inputMode="numeric"
                        value={quantities[v.id] ?? ''}
                        onChange={(e) => onChange({ ...quantities, [v.id]: e.target.value.replace(/\D/g, '') })}
                        placeholder="0"
                        className="h-8 w-14 text-center"
                      />
                      <span className="text-[10px] text-muted-foreground">tem {Math.max(0, Number(v.stock_quantity) || 0)}</span>
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
