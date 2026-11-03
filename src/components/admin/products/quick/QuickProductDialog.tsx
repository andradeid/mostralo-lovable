// Cadastro rápido de produto a partir de um código lido e não cadastrado: nome, preço,
// categoria, código (bloqueado) e, opcionais, custo e quantidade inicial em estoque.
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ScanBarcode } from 'lucide-react';
import { buildQuickProduct } from '@/lib/products/quickProduct';
import { DUPLICATE_BARCODE_MESSAGE, isDuplicateBarcodeError } from '@/lib/stock/stockEntry';
import type { StockProduct } from '@/hooks/stock/stockQueries';
import { saveQuickProduct } from './saveQuickProduct';

export interface QuickProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string | null;
  barcode: string;
  /** Mostra o campo de estoque inicial (na tela de Estoque a entrada abre logo depois). */
  askInitialStock?: boolean;
  onCreated: (product: StockProduct) => void;
}

function useStoreCategories(storeId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['quick-product-categories', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('store_id', storeId!)
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data ?? [];
    },
    enabled: enabled && !!storeId,
    staleTime: 60_000,
  });
}

export function QuickProductDialog({ open, onOpenChange, storeId, barcode, askInitialStock = true, onCreated }: QuickProductDialogProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [categoryId, setCategoryId] = useState('');
  const [cost, setCost] = useState<number | null>(null);
  const [initialStock, setInitialStock] = useState('');
  const [soldByWeight, setSoldByWeight] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);
  const { data: categories = [], isLoading: loadingCategories } = useStoreCategories(storeId, open);

  useEffect(() => {
    if (!open) return;
    setName('');
    setPrice(0);
    setCost(null);
    setInitialStock('');
    setSoldByWeight(false);
    setError('');
    setTimeout(() => nameRef.current?.focus(), 50);
  }, [open, barcode]);

  // Loja com uma categoria só: já vem escolhida
  useEffect(() => {
    if (open && !categoryId && categories.length === 1) setCategoryId(categories[0].id);
  }, [open, categories, categoryId]);

  const submit = async () => {
    if (!storeId) return;
    const built = buildQuickProduct({ name, price, categoryId, barcode, cost, initialStock: askInitialStock ? initialStock : '', soldByWeight });
    if ('error' in built) {
      setError(built.error);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { product, warning } = await saveQuickProduct(storeId, built);
      toast.success(`${product.name} cadastrado`);
      if (warning) toast.warning(warning);
      onOpenChange(false);
      onCreated(product);
    } catch (e) {
      console.error('Erro no cadastro rápido:', e);
      setError(isDuplicateBarcodeError(e) ? DUPLICATE_BARCODE_MESSAGE : 'Não foi possível cadastrar o produto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar produto</DialogTitle>
          <DialogDescription>Cadastro rápido do código lido. Foto e detalhes podem ser completados depois em Produtos.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="quick-barcode">Código de barras</Label>
            <div className="relative">
              <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="quick-barcode" value={barcode} readOnly disabled className="pl-9 font-mono" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-name">Nome *</Label>
            <Input id="quick-name" ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Coca-Cola 350ml" autoComplete="off" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quick-price">{soldByWeight ? 'Preço do kg *' : 'Preço de venda *'}</Label>
              <CurrencyInput id="quick-price" value={price} onChange={setPrice} />
            </div>
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={loadingCategories}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingCategories ? 'Carregando...' : 'Escolha'} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="quick-cost">Custo unitário</Label>
              <CurrencyInput id="quick-cost" value={cost ?? 0} onChange={(v) => setCost(v > 0 ? v : null)} />
            </div>
            {askInitialStock && !soldByWeight && (
              <div className="space-y-2">
                <Label htmlFor="quick-stock">Estoque inicial</Label>
                <Input
                  id="quick-stock"
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="quick-weight">Vendido por quilo</Label>
              <p className="text-xs text-muted-foreground">O preço é o do kg; no PDV, digita-se o peso.</p>
            </div>
            <Switch id="quick-weight" checked={soldByWeight} onCheckedChange={setSoldByWeight} />
          </div>

          {!loadingCategories && categories.length === 0 && (
            <p className="text-sm text-muted-foreground">A loja ainda não tem categoria ativa. Crie uma em Categorias.</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !storeId}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cadastrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
