import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Loader2, X, ScanBarcode } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { brl } from '@/lib/brl';
import { notFoundMessage, scanAddedMessage } from '@/lib/barcode/scanRules';
import { useProductScan, SCAN_TOAST_ID } from '@/hooks/barcode/useProductScan';
import { QuickProductDialog } from '@/components/admin/products/quick/QuickProductDialog';
import {
  buildOrderItem,
  loadSelectorProduct,
  searchSelectorProducts,
  type OrderItem,
  type SelectorProduct as Product,
} from './productSelectorData';

export type { OrderItem } from './productSelectorData';

/** Zona do leitor de código de barras: data-barcode-zone no conteúdo do diálogo "Novo pedido". */
export const NEW_ORDER_BARCODE_ZONE = 'novo-pedido';

interface ProductSelectorProps {
  storeId: string;
  onAddProduct: (item: OrderItem) => void;
}

const DEBOUNCE_MS = 400;

export function ProductSelector({ storeId, onAddProduct }: ProductSelectorProps) {
  // Estado de busca
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Estado de seleção
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [selectedAddons, setSelectedAddons] = useState<Record<string, { quantity: number }>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Buscar produtos por nome (server-side com ilike)
  const searchProducts = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      setSearchResults(await searchSelectorProducts(storeId, term));
      setShowResults(true);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast.error('Erro ao buscar produtos');
    } finally {
      setIsSearching(false);
    }
  }, [storeId]);

  // Debounce da busca
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      searchProducts(value);
    }, DEBOUNCE_MS);
  };

  // Selecionar produto da lista de resultados
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setShowResults(false);
    setSelectedVariantId('');
    setSelectedAddons({});
    setQuantity(1);
    setNotes('');
  };

  // Limpar seleção
  const handleClearSelection = () => {
    setSelectedProduct(null);
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
    setSelectedVariantId('');
    setSelectedAddons({});
    setQuantity(1);
    setNotes('');
  };

  // Leitor de código de barras: com o diálogo aberto, sem precisar de campo focado
  const [notFoundCode, setNotFoundCode] = useState<string | null>(null);
  const scan = useProductScan({
    storeId: storeId || null,
    zone: NEW_ORDER_BARCODE_ZONE,
    onClearSearch: () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setIsSearching(false);
      handleClearSelection();
    },
    onNotFound: setNotFoundCode,
    onProduct: async (scanned) => {
      setNotFoundCode(null);
      const product = await loadSelectorProduct(storeId, scanned.id);
      if (!product) return;
      // Com variações: abre a escolha da opção, como no clique
      if (product.variants?.some((v) => v.is_available)) {
        handleProductSelect(product);
        toast.info(`Escolha a opção de ${product.name}`, { id: SCAN_TOAST_ID });
        return;
      }
      onAddProduct(buildOrderItem(product, undefined, {}, 1, ''));
      toast.success(scanAddedMessage(product.name), { id: SCAN_TOAST_ID, duration: 1500 });
    },
  });

  const handleAddonToggle = (addonId: string, checked: boolean) => {
    if (checked) {
      setSelectedAddons(prev => ({ ...prev, [addonId]: { quantity: 1 } }));
    } else {
      setSelectedAddons(prev => {
        const newAddons = { ...prev };
        delete newAddons[addonId];
        return newAddons;
      });
    }
  };

  const handleAddonQuantity = (addonId: string, qty: number) => {
    setSelectedAddons(prev => ({
      ...prev,
      [addonId]: { quantity: Math.max(1, qty) }
    }));
  };

  const handleAddToOrder = () => {
    if (!selectedProduct) {
      toast.error('Selecione um produto');
      return;
    }

    if (selectedProduct.variants && selectedProduct.variants.length > 0 && !selectedVariantId) {
      toast.error('Selecione uma variante');
      return;
    }

    const orderItem = buildOrderItem(selectedProduct, selectedVariantId || undefined, selectedAddons, quantity, notes);

    onAddProduct(orderItem);
    toast.success('Produto adicionado ao pedido');
    
    // Reset
    handleClearSelection();
  };

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-card">
      <Label className="text-base font-semibold">Adicionar Produto</Label>
      
      {/* Campo de busca com autocomplete */}
      <div className="space-y-2">
        <Label>Produto</Label>
        <div className="relative" ref={containerRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0 && !selectedProduct) {
                  setShowResults(true);
                }
              }}
              placeholder="Digite o nome ou leia o código de barras..."
              data-barcode-search=""
              autoComplete="off"
              className="pl-10 pr-10"
              disabled={!!selectedProduct}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {selectedProduct && (
              <button
                onClick={handleClearSelection}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted hover:bg-muted-foreground/20 flex items-center justify-center"
                aria-label="Limpar seleção"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Dropdown de resultados */}
          {showResults && !selectedProduct && (
            <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
              {searchResults.length === 0 && !isSearching ? (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  Nenhum produto encontrado
                </div>
              ) : (
                searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 text-sm hover:bg-accent hover:text-accent-foreground",
                      "flex items-center justify-between border-b last:border-b-0 transition-colors"
                    )}
                  >
                    <span className="truncate flex-1 mr-2">{product.name}</span>
                    <span className="text-muted-foreground font-medium whitespace-nowrap">
                      {brl(product.price)}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {notFoundCode && (
          <div className="flex items-center justify-between gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm">
            <span className="flex items-center gap-2 min-w-0">
              <ScanBarcode className="h-4 w-4 shrink-0 text-destructive" />
              <span className="truncate">{notFoundMessage(notFoundCode)}</span>
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {scan.canCreate ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    scan.openQuickCreate(notFoundCode);
                    setNotFoundCode(null);
                  }}
                >
                  Cadastrar agora
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">Peça ao dono ou admin para cadastrar</span>
              )}
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => setNotFoundCode(null)} aria-label="Fechar aviso">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        {!selectedProduct && searchTerm.length > 0 && searchTerm.length < 2 && (
          <p className="text-xs text-muted-foreground">Digite pelo menos 2 caracteres para buscar</p>
        )}
      </div>

      {/* Fechar dropdown ao clicar fora */}
      {showResults && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowResults(false)}
        />
      )}
      
      {selectedProduct?.variants && selectedProduct.variants.length > 0 && (
        <div className="space-y-2">
          <Label>Escolha uma opção *</Label>
          <RadioGroup value={selectedVariantId} onValueChange={setSelectedVariantId}>
            {selectedProduct.variants
              .filter(v => v.is_available)
              .map((variant) => (
                <div key={variant.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={variant.id} id={variant.id} />
                  <Label htmlFor={variant.id} className="font-normal">
                    {variant.name} - {brl(variant.price)}
                  </Label>
                </div>
              ))}
          </RadioGroup>
        </div>
      )}
      
      {selectedProduct?.product_addons && selectedProduct.product_addons.length > 0 && (
        <div className="space-y-3">
          <Label>Adicionais</Label>
          {selectedProduct.product_addons
            .filter(pa => pa.addon.is_available)
            .map(({ addon }) => (
              <div key={addon.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2 flex-1">
                  <Checkbox 
                    id={addon.id}
                    checked={!!selectedAddons[addon.id]}
                    onCheckedChange={(checked) => handleAddonToggle(addon.id, checked as boolean)}
                  />
                  <Label htmlFor={addon.id} className="font-normal">
                    {addon.name} - {brl(addon.price)}
                  </Label>
                </div>
                {selectedAddons[addon.id] && (
                  <Input
                    type="number"
                    min="1"
                    value={selectedAddons[addon.id].quantity}
                    onChange={(e) => handleAddonQuantity(addon.id, Number(e.target.value))}
                    className="w-20"
                  />
                )}
              </div>
            ))}
        </div>
      )}
      
      <div className="space-y-2">
        <Label>Quantidade</Label>
        <Input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
        />
      </div>
      
      <div className="space-y-2">
        <Label>Observações do item (opcional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex: Sem cebola, bem passado..."
          rows={2}
        />
      </div>
      
      <Button 
        onClick={handleAddToOrder} 
        className="w-full"
        disabled={!selectedProduct}
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar ao Pedido
      </Button>
      <QuickProductDialog {...scan.quickDialogProps} />
    </div>
  );
}
