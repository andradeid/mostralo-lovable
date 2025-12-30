import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Search, Plus, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { AddItemConfirmModal } from '@/components/comandas/AddItemConfirmModal';
import { UpsellModal } from '@/components/upsell/UpsellModal';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
  category_id: string | null;
  categories?: {
    name: string;
  };
}

interface PDVProductGridProps {
  onAddProduct: (product: { product_id: string; product_name: string; unit_price: number; quantity: number; notes?: string }) => void;
  isAdding?: boolean;
}

export function PDVProductGrid({ onAddProduct, isAdding = false }: PDVProductGridProps) {
  const { storeId } = useStoreAccess();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [upsellTriggerProductId, setUpsellTriggerProductId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Buscar produtos da loja
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['pdv-products', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          description,
          image_url,
          is_available,
          category_id,
          categories (name)
        `)
        .eq('store_id', storeId)
        .eq('is_available', true)
        .order('name');

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!storeId,
  });

  // Buscar categorias
  const { data: categories = [] } = useQuery({
    queryKey: ['pdv-categories', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return data;
    },
    enabled: !!storeId,
  });

  // Filtrar produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setConfirmModalOpen(true);
  };

  const handleConfirmAdd = (product: Product, quantity: number, notes: string) => {
    onAddProduct({
      product_id: product.id,
      product_name: product.name,
      unit_price: product.price,
      quantity,
      notes: notes || undefined,
    });
    setConfirmModalOpen(false);
    
    // Mostrar modal de upsell
    setUpsellTriggerProductId(product.id);
    setShowUpsellModal(true);
    setSelectedProduct(null);
  };

  const handleUpsellAccept = (upsellProduct: { id: string; name: string; price: number; image_url: string | null; quantity: number }) => {
    onAddProduct({
      product_id: upsellProduct.id,
      product_name: upsellProduct.name,
      unit_price: upsellProduct.price,
      quantity: upsellProduct.quantity,
    });
  };

  const handleUpsellDecline = () => {
    setShowUpsellModal(false);
    setUpsellTriggerProductId(null);
  };

  if (loadingProducts) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Busca - sticky no mobile */}
      <div className={`relative ${isMobile ? 'sticky top-0 z-10 bg-background pb-2' : ''}`}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar produto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`pl-11 ${isMobile ? 'h-12 text-base' : ''}`}
        />
      </div>

      {/* Filtros de categoria - scroll horizontal no mobile */}
      {isMobile ? (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="lg"
              onClick={() => setSelectedCategory(null)}
              className="h-11 px-4 text-base shrink-0"
            >
              Todos
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="lg"
                onClick={() => setSelectedCategory(category.id)}
                className="h-11 px-4 text-base shrink-0"
              >
                {category.name}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Todos
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      )}

      {/* Grid de produtos - 2 colunas no mobile, mais no desktop */}
      <div className={`grid gap-3 ${
        isMobile 
          ? 'grid-cols-2' 
          : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
      }`}>
        {filteredProducts.map((product) => (
          <Card 
            key={product.id}
            className="cursor-pointer hover:border-primary transition-colors overflow-hidden active:scale-[0.98]"
            onClick={() => handleProductClick(product)}
          >
            <CardContent className={`p-0 ${isMobile ? '' : 'p-3'}`}>
              {product.image_url && (
                <div className={`aspect-square overflow-hidden bg-muted ${isMobile ? '' : 'mb-2 rounded-md'}`}>
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              <div className={isMobile ? 'p-3' : ''}>
                <h4 className={`font-medium line-clamp-2 ${isMobile ? 'text-base min-h-[3rem]' : 'text-sm min-h-[2.5rem]'}`}>
                  {product.name}
                </h4>
                <p className={`text-primary font-bold mt-1 ${isMobile ? 'text-lg' : 'text-sm'}`}>
                  {formatCurrency(product.price)}
                </p>
                <Button 
                  size={isMobile ? "lg" : "sm"}
                  className={`w-full mt-2 ${isMobile ? 'h-12 text-base' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick(product);
                  }}
                >
                  <Plus className={isMobile ? "h-5 w-5 mr-2" : "h-4 w-4 mr-1"} />
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm 
            ? 'Nenhum produto encontrado com essa busca.' 
            : 'Nenhum produto disponível.'}
        </div>
      )}

      {/* Modal de confirmação */}
      <AddItemConfirmModal
        open={confirmModalOpen}
        onOpenChange={setConfirmModalOpen}
        product={selectedProduct}
        onConfirm={handleConfirmAdd}
        isAdding={isAdding}
      />

      {/* Upsell Modal */}
      {storeId && (
        <UpsellModal
          open={showUpsellModal}
          onOpenChange={(open) => {
            setShowUpsellModal(open);
            if (!open) setUpsellTriggerProductId(null);
          }}
          storeId={storeId}
          triggerProductId={upsellTriggerProductId || ''}
          onAccept={handleUpsellAccept}
          onDecline={handleUpsellDecline}
        />
      )}
    </div>
  );
}
