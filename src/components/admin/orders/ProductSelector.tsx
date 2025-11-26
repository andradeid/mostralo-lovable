import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export function ProductSelector({ storeId, onAddProduct }: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [selectedAddons, setSelectedAddons] = useState<Record<string, { quantity: number }>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [storeId]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_available', true)
        .order('name');

      if (error) throw error;
      
      // Buscar variantes e addons separadamente para cada produto
      const productsWithDetails = await Promise.all(
        (data || []).map(async (product) => {
          const [variantsRes, addonsRes] = await Promise.all([
            supabase
              .from('product_variants')
              .select('*')
              .eq('product_id', product.id)
              .eq('is_available', true),
            supabase
              .from('addons')
              .select('*')
              .eq('store_id', storeId)
              .eq('is_available', true)
              .then(res => {
                // Pegar apenas os addons vinculados ao produto via product_addons
                return supabase
                  .from('product_addons')
                  .select('addon_id')
                  .eq('product_id', product.id)
                  .then(paRes => {
                    if (paRes.error) return { data: [], error: paRes.error };
                    const addonIds = paRes.data.map(pa => pa.addon_id);
                    return {
                      data: res.data?.filter(a => addonIds.includes(a.id)).map(a => ({ addon: a })) || [],
                      error: res.error
                    };
                  });
              })
          ]);
          
          return {
            id: product.id,
            name: product.name,
            price: product.price,
            category: undefined,
            variants: variantsRes.data || [],
            product_addons: addonsRes.data || []
          };
        })
      );
      
      setProducts(productsWithDetails);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find(p => p.id === productId);
    setSelectedProduct(product || null);
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
    setSelectedProductId('');
    setSelectedProduct(null);
    setSelectedVariantId('');
    setSelectedAddons({});
    setQuantity(1);
    setNotes('');
  };

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-card">
      <Label className="text-base font-semibold">Adicionar Produto</Label>
      
      <div className="space-y-2">
        <Label>Produto</Label>
        <Select value={selectedProductId} onValueChange={handleProductSelect} disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um produto" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name} - R$ {product.price.toFixed(2)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
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
