import { useState, useEffect } from 'react';
import { TotemCartItem } from '@/pages/totem/TotemPage';
import { TotemConfig } from '@/hooks/useTotemConfig';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Plus, Minus, Loader2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

interface Addon {
  id: string;
  name: string;
  price: number;
  category_id: string | null;
}

interface AddonCategory {
  id: string;
  name: string;
  min_selections: number | null;
  max_selections: number | null;
}

interface TotemProductModalProps {
  product: Product;
  config: TotemConfig;
  storeId: string;
  onClose: () => void;
  onAddToCart: (item: TotemCartItem) => void;
  salesPaused?: boolean;
}

export function TotemProductModal({
  product,
  config,
  storeId,
  onClose,
  onAddToCart,
  salesPaused = false,
}: TotemProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [addonCategories, setAddonCategories] = useState<AddonCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAddons = async () => {
      setLoading(true);
      try {
        // Buscar categorias de adicionais
        const { data: categoriesData } = await supabase
          .from('addon_categories')
          .select('id, name, min_selections, max_selections')
          .eq('store_id', storeId)
          .eq('is_active', true)
          .order('display_order');

        if (categoriesData) {
          setAddonCategories(categoriesData);
        }

        // Buscar adicionais
        const { data: addonsData } = await supabase
          .from('addons')
          .select('id, name, price, category_id')
          .eq('store_id', storeId)
          .eq('is_available', true)
          .order('display_order');

        if (addonsData) {
          setAddons(addonsData);
        }
      } catch (err) {
        console.error('Erro ao carregar adicionais:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAddons();
  }, [storeId]);

  const handleAddonToggle = (addon: Addon, checked: boolean) => {
    if (checked) {
      setSelectedAddons(prev => [...prev, addon]);
    } else {
      setSelectedAddons(prev => prev.filter(a => a.id !== addon.id));
    }
  };

  const handleAddToCart = () => {
    const item: TotemCartItem = {
      id: `${product.id}-${Date.now()}`,
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image_url: product.image_url,
      notes,
      addons: selectedAddons.map(a => ({ id: a.id, name: a.name, price: a.price })),
    };
    onAddToCart(item);
  };

  const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  const itemTotal = (product.price + addonsTotal) * quantity;

  // Agrupar adicionais por categoria
  const groupedAddons = addonCategories.map(category => ({
    ...category,
    addons: addons.filter(addon => addon.category_id === category.id),
  }));

  const uncategorizedAddons = addons.filter(addon => !addon.category_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-lg max-h-[90vh] rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: config.dark_mode ? '#1a1a1a' : '#ffffff' }}
      >
        {/* Header com imagem */}
        <div className="relative">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-24" style={{ backgroundColor: config.theme_color }} />
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold">{product.name}</h2>
            {product.description && (
              <p className="mt-2" style={{ color: config.dark_mode ? '#a1a1a1' : '#6b7280' }}>
                {product.description}
              </p>
            )}
            <p className="text-xl font-bold mt-2" style={{ color: config.theme_color }}>
              R$ {product.price.toFixed(2)}
            </p>
          </div>

          {/* Adicionais */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: config.theme_color }} />
            </div>
          ) : (
            <>
              {groupedAddons.map(category => (
                category.addons.length > 0 && (
                  <div key={category.id}>
                    <h3 className="font-semibold mb-2">{category.name}</h3>
                    <div className="space-y-2">
                      {category.addons.map(addon => (
                        <label
                          key={addon.id}
                          className="flex items-center justify-between p-3 rounded-lg border cursor-pointer"
                          style={{ borderColor: config.dark_mode ? '#333' : '#e5e7eb' }}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedAddons.some(a => a.id === addon.id)}
                              onCheckedChange={(checked) => handleAddonToggle(addon, checked as boolean)}
                            />
                            <span>{addon.name}</span>
                          </div>
                          <span style={{ color: config.theme_color }}>
                            + R$ {addon.price.toFixed(2)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              ))}

              {uncategorizedAddons.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Adicionais</h3>
                  <div className="space-y-2">
                    {uncategorizedAddons.map(addon => (
                      <label
                        key={addon.id}
                        className="flex items-center justify-between p-3 rounded-lg border cursor-pointer"
                        style={{ borderColor: config.dark_mode ? '#333' : '#e5e7eb' }}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedAddons.some(a => a.id === addon.id)}
                            onCheckedChange={(checked) => handleAddonToggle(addon, checked as boolean)}
                          />
                          <span>{addon.name}</span>
                        </div>
                        <span style={{ color: config.theme_color }}>
                          + R$ {addon.price.toFixed(2)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Observações */}
          {config.show_item_notes && (
            <div>
              <h3 className="font-semibold mb-2">Observações</h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Sem cebola, bem passado..."
                className="resize-none"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="p-4 border-t"
          style={{ borderColor: config.dark_mode ? '#333' : '#e5e7eb' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="p-2 rounded-full border"
                style={{ borderColor: config.theme_color, color: config.theme_color }}
              >
                <Minus className="h-5 w-5" />
              </button>
              <span className="text-xl font-bold w-8 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="p-2 rounded-full text-white"
                style={{ backgroundColor: config.theme_color }}
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            <span className="text-xl font-bold" style={{ color: config.theme_color }}>
              R$ {itemTotal.toFixed(2)}
            </span>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={salesPaused}
            className={`w-full h-14 text-lg font-semibold text-white ${salesPaused ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ backgroundColor: config.theme_color }}
          >
            {salesPaused ? 'Vendas Pausadas' : 'Adicionar ao Carrinho'}
          </Button>
        </div>
      </div>
    </div>
  );
}
