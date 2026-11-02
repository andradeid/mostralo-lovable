// Entrada de mercadoria: produto, quantidade, custo unitário (opcional), fornecedor, nota e
// observação. Mostra o estoque antes → depois e grava pela função stock_add_entry.
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ArrowRight, Loader2, X } from 'lucide-react';
import { brl } from '@/lib/brl';
import { buildStockEntryArgs, costAfterEntry, stockErrorMessage } from '@/lib/stock/stockEntry';
import { addStockEntry, fetchProductCost, type StockEntryRow } from '@/hooks/stock/stockQueries';
import { StockProductPicker } from './StockProductPicker';

/** O mínimo do produto que o diálogo precisa (serve o produto da tela Produtos e o do Estoque). */
export interface StockEntryProduct {
  id: string;
  name: string;
  barcode?: string | null;
  track_stock: boolean | null;
  stock_quantity: number | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  /** Produto já escolhido (ex.: botão no cartão do produto). Sem ele, o diálogo pede o produto. */
  product?: StockEntryProduct | null;
  onSaved?: (entry: StockEntryRow) => void;
}

export function StockEntryDialog({ open, onOpenChange, storeId, product: fixedProduct, onSaved }: Props) {
  const [product, setProduct] = useState<StockEntryProduct | null>(fixedProduct ?? null);
  const [currentCost, setCurrentCost] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState<number | null>(null);
  const [supplier, setSupplier] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const quantityRef = useRef<HTMLInputElement>(null);

  // Ao abrir: começa do zero (ou com o produto já escolhido)
  useEffect(() => {
    if (!open) return;
    setProduct(fixedProduct ?? null);
    setQuantity('');
    setUnitCost(null);
    setSupplier('');
    setInvoiceNumber('');
    setNotes('');
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fixedProduct?.id]);

  // Custo atual do produto (para mostrar o custo médio depois da entrada)
  useEffect(() => {
    setCurrentCost(null);
    if (!open || !product) return;
    let alive = true;
    fetchProductCost(product.id)
      .then((c) => alive && setCurrentCost(c))
      .catch(() => undefined);
    setTimeout(() => quantityRef.current?.focus(), 50);
    return () => {
      alive = false;
    };
  }, [open, product?.id]);

  const before = product?.stock_quantity ?? 0;
  const qty = /^\d+$/.test(quantity.trim()) ? Number(quantity.trim()) : 0;
  const newCost = qty > 0 ? costAfterEntry(currentCost, before, qty, unitCost) : null;

  const submit = async (keepOpen: boolean) => {
    const built = buildStockEntryArgs({
      productId: product?.id ?? null,
      quantity,
      unitCost,
      supplier,
      invoiceNumber,
      notes,
    });
    if ('error' in built) {
      setError(built.error);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const entry = await addStockEntry({ ...built.args });
      toast.success(`Entrada registrada: ${product!.name} +${built.args.p_quantity} (estoque ${entry.stock_before ?? before} → ${entry.stock_after ?? before + built.args.p_quantity})`);
      onSaved?.(entry);
      if (keepOpen) {
        // Próximo item da mesma nota: mantém fornecedor e número da nota
        setProduct(null);
        setQuantity('');
        setUnitCost(null);
        setNotes('');
      } else {
        onOpenChange(false);
      }
    } catch (e) {
      console.error('Erro na entrada de mercadoria:', e);
      setError(stockErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Entrada de mercadoria</DialogTitle>
          <DialogDescription>Some ao estoque o que chegou do fornecedor.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit(false);
          }}
        >
          <div className="space-y-2">
            <Label>Produto</Label>
            {product ? (
              <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  {product.barcode && <p className="text-xs text-muted-foreground">{product.barcode}</p>}
                </div>
                {!fixedProduct && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setProduct(null)} title="Trocar produto">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ) : (
              <StockProductPicker storeId={storeId} onSelect={setProduct} autoFocus={open} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="entry-qty">Quantidade *</Label>
              <Input
                id="entry-qty"
                ref={quantityRef}
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Ex: 12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-cost">Custo unitário</Label>
              <CurrencyInput
                id="entry-cost"
                value={unitCost ?? 0}
                onChange={(v) => setUnitCost(v > 0 ? v : null)}
              />
            </div>
          </div>

          {product && (
            <div className="rounded-md bg-muted/60 px-3 py-2 text-sm space-y-1">
              <p className="flex items-center gap-2">
                Estoque: <strong>{before}</strong>
                <ArrowRight className="h-3.5 w-3.5" />
                <strong>{before + qty}</strong>
              </p>
              {!product.track_stock && (
                <p className="text-xs text-muted-foreground">O controle de estoque será ligado para este produto.</p>
              )}
              {unitCost !== null && newCost !== null && (
                <p className="text-xs text-muted-foreground">
                  Custo do produto: {currentCost !== null ? `${brl(currentCost)} → ` : ''}
                  {brl(newCost)}
                  {currentCost !== null && before > 0 ? ' (média)' : ''}
                </p>
              )}
              {unitCost === null && (
                <p className="text-xs text-muted-foreground">Sem custo informado, o custo do produto não muda.</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="entry-supplier">Fornecedor</Label>
              <Input id="entry-supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-invoice">Nº da nota</Label>
              <Input id="entry-invoice" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entry-notes">Observação</Label>
            <Textarea id="entry-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2 sm:gap-0">
            {!fixedProduct && (
              <Button type="button" variant="outline" disabled={saving} onClick={() => submit(true)}>
                Registrar e lançar outro
              </Button>
            )}
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Registrar entrada
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
