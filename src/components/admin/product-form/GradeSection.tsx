// Grade de estoque (cor × tamanho): características, valores e a tabela com estoque e código de cada combinação.
// A definição vai em products.grade (form 'grade'); as combinações são as variações (attributes/estoque/código).
import { useEffect, useMemo, useState } from 'react';
import { Barcode, Plus, Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  buildGradeVariants, isColorAttribute, normalizeGrade, sizeRange, totalGradeStock,
  type Grade, type GradeAttribute,
} from '@/lib/grade/grade';
import { fillMissingBarcodes } from '@/lib/grade/barcodeLabel';
import { printGradeLabels } from '@/utils/printGradeLabels';
import type { ProductFormApi, ProductVariant } from './types';

interface Props {
  form: ProductFormApi;
  variants: ProductVariant[];
  setVariants: (v: ProductVariant[]) => void;
}

const DEFAULT_GRADE: GradeAttribute[] = [
  { name: 'Cor', values: [] },
  { name: 'Tamanho', values: [] },
];

function salePrice(form: ProductFormApi): number {
  const v = form.getValues();
  return v.is_on_offer && v.offer_price ? Number(v.offer_price) : Number(v.price) || 0;
}

export function GradeSection({ form, variants, setVariants }: Props) {
  const saved = form.watch('grade');
  const enabled = !!saved;
  const [draft, setDraft] = useState<GradeAttribute[]>(() => saved?.attributes ?? DEFAULT_GRADE);
  const [on, setOn] = useState<boolean>(enabled);
  const [newValue, setNewValue] = useState<Record<number, string>>({});
  const [range, setRange] = useState({ from: '34', to: '44' });
  const [fillQty, setFillQty] = useState('');

  // Produto carregado (editar) depois da 1ª renderização
  useEffect(() => {
    if (saved && !on) {
      setOn(true);
      setDraft(saved.attributes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  const grade: Grade | null = useMemo(() => (on ? normalizeGrade({ attributes: draft }) : null), [on, draft]);
  const gradeVariants = variants.filter((v) => !!v.attributes);

  /** Aplica a grade: grava no formulário e refaz as combinações mantendo estoque/código. */
  const apply = (attrs: GradeAttribute[]) => {
    setDraft(attrs);
    const g = normalizeGrade({ attributes: attrs });
    form.setValue('grade', g, { shouldDirty: true });
    const next = g ? buildGradeVariants(g, gradeVariants, salePrice(form)) : [];
    setVariants(next);
    form.setValue('stock_quantity', totalGradeStock(next));
  };

  const toggle = (checked: boolean) => {
    setOn(checked);
    if (checked) {
      apply(draft.length ? draft : DEFAULT_GRADE);
    } else {
      form.setValue('grade', null, { shouldDirty: true });
      setVariants([]);
    }
  };

  const addValues = (idx: number, raw: string) => {
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const attrs = draft.map((a, i) => i === idx ? { ...a, values: [...a.values, ...parts.map((value) => ({ value }))] } : a);
    setNewValue((s) => ({ ...s, [idx]: '' }));
    apply(attrs);
  };
  const removeValue = (idx: number, value: string) =>
    apply(draft.map((a, i) => i === idx ? { ...a, values: a.values.filter((v) => v.value !== value) } : a));
  const setHex = (idx: number, value: string, hex: string) =>
    apply(draft.map((a, i) => i === idx ? { ...a, values: a.values.map((v) => v.value === value ? { ...v, hex } : v) } : a));
  const rename = (idx: number, name: string) => {
    const attrs = draft.map((a, i) => i === idx ? { ...a, name } : a);
    setDraft(attrs);
  };
  const addRange = (idx: number) => {
    const values = sizeRange(Number(range.from), Number(range.to));
    if (values.length) addValues(idx, values.join(','));
  };

  const setStock = (id: string, qty: string) => {
    const next = variants.map((v) => v.name === id && v.attributes ? { ...v, stock_quantity: Math.max(0, Math.floor(Number(qty) || 0)) } : v);
    setVariants(next);
    form.setValue('stock_quantity', totalGradeStock(next));
  };
  const setBarcode = (id: string, code: string) =>
    setVariants(variants.map((v) => v.name === id && v.attributes ? { ...v, barcode: code.trim() || null } : v));
  const fillAll = () => {
    const n = Math.max(0, Math.floor(Number(fillQty) || 0));
    const next = variants.map((v) => v.attributes ? { ...v, stock_quantity: n } : v);
    setVariants(next);
    form.setValue('stock_quantity', totalGradeStock(next));
  };
  const generateCodes = () => setVariants(fillMissingBarcodes(variants));
  const printLabels = () => printGradeLabels(gradeVariants.map((v) => ({
    productName: form.getValues('name') || 'Produto',
    variantName: v.name,
    barcode: v.barcode ?? '',
    price: salePrice(form),
    copies: Number(v.stock_quantity) || 0,
  })));

  const rows = grade?.attributes[0];
  const cols = grade?.attributes[1];
  const cell = (r: string, c?: string) => gradeVariants.find((v) => v.attributes?.[rows!.name] === r && (!cols || v.attributes?.[cols.name] === c));
  const total = totalGradeStock(gradeVariants);
  const soldOut = gradeVariants.filter((v) => (Number(v.stock_quantity) || 0) <= 0).length;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium">Grade (cor e tamanho)</h3>
          <p className="text-sm text-muted-foreground">
            Para calçados, roupas e produtos que mudam de cor ou tamanho. Cada combinação tem estoque e código de barras próprios.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Switch id="has_grade" checked={on} onCheckedChange={toggle} />
          <Label htmlFor="has_grade">Produto com grade</Label>
        </div>
      </div>

      {on && (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            {draft.map((attr, idx) => {
              const color = isColorAttribute(attr);
              return (
                <div key={idx} className="border rounded-lg p-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`attr-${idx}`} className="shrink-0">Característica {idx + 1}</Label>
                    <Input id={`attr-${idx}`} value={attr.name} onChange={(e) => rename(idx, e.target.value)} onBlur={() => apply(draft)} className="h-9" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {attr.values.map((v) => (
                      <span key={v.value} className="inline-flex items-center gap-1.5 h-9 pl-2 pr-1 rounded-full bg-muted text-sm">
                        {color && (
                          <input
                            type="color"
                            aria-label={`Cor de ${v.value}`}
                            value={v.hex || '#cccccc'}
                            onChange={(e) => setHex(idx, v.value, e.target.value)}
                            className="w-5 h-5 rounded-full border-0 p-0 bg-transparent cursor-pointer"
                          />
                        )}
                        {v.value}
                        <button type="button" aria-label={`Remover ${v.value}`} onClick={() => removeValue(idx, v.value)} className="w-7 h-7 inline-flex items-center justify-center rounded-full hover:bg-background">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newValue[idx] ?? ''}
                      onChange={(e) => setNewValue((s) => ({ ...s, [idx]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addValues(idx, newValue[idx] ?? ''); } }}
                      placeholder={color ? 'Ex.: Preto, Branco' : 'Ex.: P, M, G ou 37'}
                      className="h-9"
                    />
                    <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => addValues(idx, newValue[idx] ?? '')} aria-label="Adicionar valor">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {!color && (
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-muted-foreground whitespace-nowrap">Numeração de</span>
                      <Input aria-label="Tamanho inicial" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} className="h-8 w-16" inputMode="numeric" />
                      <span className="text-muted-foreground">a</span>
                      <Input aria-label="Tamanho final" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} className="h-8 w-16" inputMode="numeric" />
                      <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => addRange(idx)}>Adicionar</Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {grade && rows && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor="fill-all" className="text-sm text-muted-foreground font-normal">Estoque de todas</Label>
                <Input id="fill-all" value={fillQty} onChange={(e) => setFillQty(e.target.value)} inputMode="numeric" className="h-9 w-20" />
                <Button type="button" variant="outline" size="sm" className="h-9" onClick={fillAll}>Aplicar</Button>
                <Button type="button" variant="outline" size="sm" className="h-9" onClick={generateCodes}>
                  <Barcode className="w-4 h-4 mr-1" /> Gerar códigos
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-9" onClick={printLabels}>
                  <Printer className="w-4 h-4 mr-1" /> Imprimir etiquetas
                </Button>
              </div>

              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-muted-foreground">
                    <tr>
                      <th className="text-left font-medium px-3 py-2">{cols ? `${rows.name} \\ ${cols.name}` : rows.name}</th>
                      {cols ? cols.values.map((c) => <th key={c.value} className="font-medium px-2 py-2 text-center">{c.value}</th>)
                        : <th className="font-medium px-2 py-2 text-center">Estoque</th>}
                      <th className="font-medium px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.values.map((r) => {
                      const line = (cols ? cols.values.map((c) => cell(r.value, c.value)) : [cell(r.value)]);
                      const lineTotal = line.reduce((s, v) => s + (Number(v?.stock_quantity) || 0), 0);
                      return (
                        <tr key={r.value} className="border-t">
                          <td className="px-3 py-2 font-medium whitespace-nowrap">
                            <span className="inline-flex items-center gap-2">
                              {r.hex && <span className="w-3.5 h-3.5 rounded-full border" style={{ background: r.hex }} aria-hidden="true" />}
                              {r.value}
                            </span>
                          </td>
                          {line.map((v, i) => (
                            <td key={i} className="px-1.5 py-1.5 text-center align-top">
                              {v && (
                                <div className="flex flex-col items-center gap-1">
                                  <Input
                                    aria-label={`Estoque ${v.name}`}
                                    value={String(v.stock_quantity ?? 0)}
                                    onChange={(e) => setStock(v.name, e.target.value)}
                                    inputMode="numeric"
                                    className={`h-9 w-16 text-center font-semibold ${(Number(v.stock_quantity) || 0) <= 0 ? 'border-red-300 bg-red-50 dark:bg-red-950/30' : ''}`}
                                  />
                                  <input
                                    aria-label={`Código de barras ${v.name}`}
                                    value={v.barcode ?? ''}
                                    onChange={(e) => setBarcode(v.name, e.target.value)}
                                    placeholder="código"
                                    className="w-24 text-[11px] text-center bg-transparent text-muted-foreground border-b border-transparent focus:border-border outline-none"
                                  />
                                </div>
                              )}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-right font-semibold">{lineTotal}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="flex justify-between gap-2 px-3 py-2 border-t bg-muted/30 text-sm">
                  <span className="text-muted-foreground">
                    {gradeVariants.length} combinações{soldOut > 0 && <> · <span className="text-red-700 dark:text-red-400 font-medium">{soldOut} sem estoque</span> (aparecem esgotadas na loja)</>}
                  </span>
                  <span>Estoque total: <strong>{total}</strong></span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Preço igual para toda a grade (o preço do produto ou da oferta). Código vazio: use "Gerar códigos" para criar um interno e imprimir a etiqueta; se a peça já tem o código da fábrica, digite ou leia com o leitor.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
