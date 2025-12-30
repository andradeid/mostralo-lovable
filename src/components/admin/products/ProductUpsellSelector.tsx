import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { X, Plus, GripVertical, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
}

interface UpsellConfig {
  productId: string;
  price: number | null;
  priority: number;
  product?: Product;
}

interface ProductUpsellSelectorProps {
  storeId: string | undefined;
  productId?: string;
  selectedUpsells: UpsellConfig[];
  onUpsellsChange: (upsells: UpsellConfig[]) => void;
}

export function ProductUpsellSelector({
  storeId,
  productId,
  selectedUpsells,
  onUpsellsChange
}: ProductUpsellSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (storeId) {
      fetchProducts();
    }
  }, [storeId]);

  const fetchProducts = async () => {
    if (!storeId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, image_url')
        .eq('store_id', storeId)
        .eq('is_available', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  const availableProducts = products.filter(p => 
    p.id !== productId && 
    !selectedUpsells.some(u => u.productId === p.id)
  );

  const filteredProducts = availableProducts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUpsell = (product: Product) => {
    if (selectedUpsells.length >= 3) return;
    
    const newUpsell: UpsellConfig = {
      productId: product.id,
      price: null,
      priority: selectedUpsells.length + 1,
      product
    };

    onUpsellsChange([...selectedUpsells, newUpsell]);
    setSearchOpen(false);
    setSearchTerm('');
  };

  const handleRemoveUpsell = (productId: string) => {
    const updated = selectedUpsells
      .filter(u => u.productId !== productId)
      .map((u, idx) => ({ ...u, priority: idx + 1 }));
    onUpsellsChange(updated);
  };

  const handlePriceChange = (productId: string, price: string) => {
    const numPrice = price === '' ? null : parseFloat(price);
    const updated = selectedUpsells.map(u => 
      u.productId === productId ? { ...u, price: numPrice } : u
    );
    onUpsellsChange(updated);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...selectedUpsells];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onUpsellsChange(updated.map((u, idx) => ({ ...u, priority: idx + 1 })));
  };

  const moveDown = (index: number) => {
    if (index === selectedUpsells.length - 1) return;
    const updated = [...selectedUpsells];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onUpsellsChange(updated.map((u, idx) => ({ ...u, priority: idx + 1 })));
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Sugira até 3 produtos complementares quando este item for adicionado ao carrinho.
      </div>

      {/* Lista de upsells selecionados */}
      {selectedUpsells.length > 0 && (
        <div className="space-y-3">
          {selectedUpsells.map((upsell, index) => {
            const product = upsell.product || products.find(p => p.id === upsell.productId);
            if (!product) return null;

            return (
              <Card key={upsell.productId}>
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDown(index)}
                        disabled={index === selectedUpsells.length - 1}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      >
                        ▼
                      </button>
                    </div>

                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-xl">
                        🍽️
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium text-sm">{product.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            Preço normal: {formatCurrency(product.price)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleRemoveUpsell(upsell.productId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-2">
                        <Label className="text-xs">Preço especial (opcional)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder={`${product.price.toFixed(2)}`}
                          value={upsell.price ?? ''}
                          onChange={(e) => handlePriceChange(upsell.productId, e.target.value)}
                          className="h-8 mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Botão para adicionar */}
      {selectedUpsells.length < 3 && (
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Upsell ({selectedUpsells.length}/3)
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Buscar produto..." 
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandList>
                <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                <CommandGroup>
                  {filteredProducts.slice(0, 10).map((product) => (
                    <CommandItem
                      key={product.id}
                      onSelect={() => handleAddUpsell(product)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-sm">
                          🍽️
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(product.price)}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {selectedUpsells.length === 3 && (
        <p className="text-xs text-muted-foreground text-center">
          Limite máximo de 3 upsells atingido
        </p>
      )}
    </div>
  );
}
