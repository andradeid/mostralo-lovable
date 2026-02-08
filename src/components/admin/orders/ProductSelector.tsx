import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Search, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  price: number;
  category?: { name: string };
  variants?: ProductVariant[];
  product_addons?: { addon: Addon }[];
}

interface ProductVariant {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
  product_id?: string;
}

interface Addon {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
  addons: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
}

interface ProductSelectorProps {
  storeId: string;
  onAddProduct: (item: OrderItem) => void;
}

const SEARCH_LIMIT = 20;
const DEBOUNCE_MS = 400;

export function ProductSelector({ storeId, onAddProduct }: ProductSelectorProps) {
  // Estado de busca
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
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
      // 1. Buscar produtos que correspondem ao termo
      const { data: products, error } = await supabase
        .from('products')
        .select('id, name, price')
        .eq('store_id', storeId)
        .eq('is_available', true)
        .ilike('name', `%${term}%`)
        .order('name')
        .limit(SEARCH_LIMIT);

      if (error) throw error;

      if (!products || products.length === 0) {
        setSearchResults([]);
        setShowResults(true);
        return;
      }

      const productIds = products.map(p => p.id);

      // 2. Buscar variantes e addons em batch (apenas para os resultados)
      const [variantsRes, addonsRes, productAddonsRes] = await Promise.all([
        supabase
          .from('product_variants')
          .select('*')
          .in('product_id', productIds)
          .eq('is_available', true),
        supabase
          .from('addons')
          .select('*')
          .eq('store_id', storeId)
          .eq('is_available', true),
        supabase
          .from('product_addons')
          .select('product_id, addon_id')
          .in('product_id', productIds),
      ]);

      // 3. Indexar para lookup O(1)
      const variantsByProduct = new Map<string, ProductVariant[]>();
      for (const v of variantsRes.data || []) {
        const list = variantsByProduct.get(v.product_id) || [];
        list.push(v);
        variantsByProduct.set(v.product_id, list);
      }

      const addonsById = new Map<string, Addon>();
      for (const a of addonsRes.data || []) {
        addonsById.set(a.id, a);
      }

      const addonIdsByProduct = new Map<string, string[]>();
      for (const pa of productAddonsRes.data || []) {
        const list = addonIdsByProduct.get(pa.product_id) || [];
        list.push(pa.addon_id);
        addonIdsByProduct.set(pa.product_id, list);
      }

      // 4. Montar resultado
      const results: Product[] = products.map((product) => {
        const variants = variantsByProduct.get(product.id) || [];
        const linkedAddonIds = addonIdsByProduct.get(product.id) || [];
        const productAddons = linkedAddonIds
          .map(addonId => {
            const addon = addonsById.get(addonId);
            return addon ? { addon } : null;
          })
          .filter(Boolean) as { addon: Addon }[];

        return {
          id: product.id,
          name: product.name,
          price: product.price,
          variants,
          product_addons: productAddons,
        };
      });

      setSearchResults(results);
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

    const variant = selectedProduct.variants?.find(v => v.id === selectedVariantId);
    const basePrice = variant ? variant.price : selectedProduct.price;

    const addons = Object.entries(selectedAddons).map(([addonId, { quantity: addonQty }]) => {
      const addonData = selectedProduct.product_addons
        ?.find(pa => pa.addon.id === addonId)?.addon;
      return {
        id: addonId,
        name: addonData?.name || '',
        price: addonData?.price || 0,
        quantity: addonQty,
      };
    });

    const addonsTotal = addons.reduce((sum, addon) => sum + (addon.price * addon.quantity), 0);
    const itemSubtotal = (basePrice + addonsTotal) * quantity;

    const orderItem: OrderItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      variantId: variant?.id,
      variantName: variant?.name,
      quantity,
      unitPrice: basePrice,
      subtotal: itemSubtotal,
      notes,
      addons,
    };

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
              placeholder="Digite o nome do produto para buscar..."
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
                      R$ {product.price.toFixed(2)}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
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
                    {variant.name} - R$ {variant.price.toFixed(2)}
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
                    {addon.name} - R$ {addon.price.toFixed(2)}
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
    </div>
  );
}
