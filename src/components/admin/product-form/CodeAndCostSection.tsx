// Código de barras (aceita leitor USB: o Enter do leitor não envia o formulário)
// e, para dono/admin, preço de custo com a margem sobre o preço de venda.
// Opções do PDV: vendido por quilo (preço = preço do kg) e atalho no modo Misto.
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Switch } from '@/components/ui/switch';
import { ScanBarcode } from 'lucide-react';
import { barcodeKind, normalizeBarcode } from '@/lib/pdv/barcode';
import { calculateMargin, effectiveSalePrice, formatMargin } from '@/lib/products/margin';
import type { ProductFormApi } from './types';
import type { ProductCostApi } from './useProductCost';

const KIND_LABEL: Record<string, string> = {
  ean8: 'EAN-8',
  upc12: 'UPC-12',
  ean13: 'EAN-13',
  gtin14: 'GTIN-14',
  interno: 'Código interno',
};

export function CodeAndCostSection({ form, cost }: { form: ProductFormApi; cost: ProductCostApi }) {
  const barcode = normalizeBarcode(form.watch('barcode'));
  const salePrice = effectiveSalePrice({
    price: form.watch('price'),
    is_on_offer: form.watch('is_on_offer'),
    offer_price: form.watch('offer_price'),
  });
  const margin = calculateMargin(salePrice, cost.cost);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Código e custo</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="barcode">Código de barras</Label>
          <div className="relative">
            <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="barcode"
              className="pl-9"
              inputMode="text"
              autoComplete="off"
              placeholder="Leia com o leitor ou digite"
              {...form.register('barcode')}
              onKeyDown={(e) => {
                // O leitor termina com Enter: só confirma o campo, não salva o produto
                if (e.key === 'Enter') e.preventDefault();
              }}
            />
          </div>
          {form.formState.errors.barcode ? (
            <p className="text-sm text-destructive">{form.formState.errors.barcode.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {barcode ? KIND_LABEL[barcodeKind(barcode)] : 'Opcional. Usado no PDV e na entrada de mercadoria.'}
            </p>
          )}
        </div>

        {cost.canEditCost && (
          <div className="space-y-2">
            <Label htmlFor="cost_price">Preço de custo</Label>
            <CurrencyInput
              id="cost_price"
              value={cost.cost ?? 0}
              onChange={(value) => cost.setCost(value)}
            />
            <p
              className={`text-xs ${margin && margin.profit < 0 ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {margin && cost.cost ? formatMargin(margin) : 'Só a equipe da loja vê. Não aparece na loja.'}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="sold_by_weight">Vendido por quilo (preço = preço por kg)</Label>
            <p className="text-xs text-muted-foreground">No PDV, digita-se o peso. O estoque não é controlado.</p>
          </div>
          <Switch
            id="sold_by_weight"
            checked={!!form.watch('sold_by_weight')}
            onCheckedChange={(checked) => {
              form.setValue('sold_by_weight', checked, { shouldDirty: true });
              if (checked) {
                form.setValue('track_stock', false);
                form.setValue('stock_quantity', null);
              }
            }}
          />
        </div>
        <div className="flex items-start justify-between gap-3 rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="pdv_shortcut">Mostrar como atalho no PDV</Label>
            <p className="text-xs text-muted-foreground">Botão grande no modo Misto (padaria).</p>
          </div>
          <Switch
            id="pdv_shortcut"
            checked={!!form.watch('pdv_shortcut')}
            onCheckedChange={(checked) => form.setValue('pdv_shortcut', checked, { shouldDirty: true })}
          />
        </div>
      </div>
    </div>
  );
}
