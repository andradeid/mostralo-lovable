import { useState, useEffect } from 'react';
import { StoreInfo, TotemCartItem } from '@/pages/totem/TotemPage';
import { TotemConfig } from '@/hooks/useTotemConfig';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingCart, Plus, Minus, ArrowLeft, Store, Loader2 } from 'lucide-react';
import { TotemProductModal } from './TotemProductModal';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
}

interface TotemProductsProps {
  store: StoreInfo;
  config: TotemConfig;
  cart: TotemCartItem[];
  cartTotal: number;
  onAddToCart: (item: TotemCartItem) => void;
  onViewCart: () => void;
  onBack: () => void;
}

export function TotemProducts({
  store,
  config,
  cart,
  cartTotal,
  onAddToCart,
  onViewCart,
  onBack,
}: TotemProductsProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Buscar categorias
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('id, name')
          .eq('store_id', store.id)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (categoriesData) {
          setCategories(categoriesData);
          if (categoriesData.length > 0 && !selectedCategory) {
            setSelectedCategory(categoriesData[0].id);
          }
        }

        // Buscar produtos
        const { data: productsData } = await supabase
          .from('products')
          .select('id, name, description, price, image_url, category_id')
          .eq('store_id', store.id)
          .eq('is_available', true)
          .order('display_order', { ascending: true });

        if (productsData) {
          setProducts(productsData);
        }
      } catch (err) {
        console.error('Erro ao carregar produtos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [store.id]);

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category_id === selectedCategory)
    : products;

  const handleQuickAdd = (product: Product) => {
    const newItem: TotemCartItem = {
      id: `${product.id}-${Date.now()}`,
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image_url: product.image_url,
      notes: '',
      addons: [],
    };
    onAddToCart(newItem);
  };

  const logoSizeMap = {
    small: 'h-8 w-8',
    medium: 'h-10 w-10',
    large: 'h-12 w-12',
  };

  const cardSizeClasses = {
    small: 'h-32',
    medium: 'h-40',
    large: 'h-48',
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: config.dark_mode ? '#333' : '#e5e7eb' }}
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {config.show_logo && (
            <div className={`${logoSizeMap[config.logo_size || 'medium']} rounded-full overflow-hidden bg-muted flex items-center justify-center`}>
              {store.logo_url ? (
                <img src={store.logo_url} alt={store.name} className="w-full h-full object-cover" />
              ) : (
                <Store className="h-5 w-5" style={{ color: config.theme_color }} />
              )}
            </div>
          )}
          <span className="font-semibold text-lg">{store.name}</span>
        </div>
      </header>

      {/* Categories */}
      {config.categories_position !== 'hidden' && (
        <div
          className={`${
            config.categories_position === 'left'
              ? 'hidden lg:flex flex-col w-48 border-r'
              : 'flex overflow-x-auto border-b'
          } p-2 gap-2`}
          style={{ borderColor: config.dark_mode ? '#333' : '#e5e7eb' }}
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category.id
                  ? 'text-white'
                  : config.dark_mode
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              style={{
                backgroundColor: selectedCategory === category.id ? config.theme_color : undefined,
              }}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {/* Products Grid */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: config.theme_color }} />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className={`rounded-xl border overflow-hidden cursor-pointer transition-transform hover:scale-105 ${cardSizeClasses[config.product_card_size || 'medium']}`}
                style={{
                  borderColor: config.dark_mode ? '#333' : '#e5e7eb',
                  backgroundColor: config.dark_mode ? '#262626' : '#fff',
                }}
                onClick={() => setSelectedProduct(product)}
              >
                {config.show_product_images && product.image_url && (
                  <div className="h-1/2 overflow-hidden">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-3 flex flex-col justify-between h-1/2">
                  <div>
                    <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                    {config.show_product_description && product.description && (
                      <p
                        className="text-xs line-clamp-1 mt-1"
                        style={{ color: config.dark_mode ? '#a1a1a1' : '#6b7280' }}
                      >
                        {product.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-sm" style={{ color: config.theme_color }}>
                      R$ {product.price.toFixed(2)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickAdd(product);
                      }}
                      className="p-2 rounded-full text-white"
                      style={{ backgroundColor: config.theme_color }}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Cart Bar */}
      {cartItemsCount > 0 && (
        <div
          className="p-4 border-t cursor-pointer"
          style={{
            backgroundColor: config.theme_color,
            borderColor: config.theme_color,
          }}
          onClick={onViewCart}
        >
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="h-6 w-6" />
                <span className="absolute -top-2 -right-2 bg-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                  style={{ color: config.theme_color }}
                >
                  {cartItemsCount}
                </span>
              </div>
              <span className="font-medium">Ver Carrinho</span>
            </div>
            <span className="font-bold text-lg">R$ {cartTotal.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {selectedProduct && (
        <TotemProductModal
          product={selectedProduct}
          config={config}
          storeId={store.id}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(item) => {
            onAddToCart(item);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}
