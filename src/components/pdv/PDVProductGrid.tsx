import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus, Minus, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

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
  onAddProduct: (product: { product_id: string; product_name: string; unit_price: number; quantity: number }) => void;
}

export function PDVProductGrid({ onAddProduct }: PDVProductGridProps) {
  const { storeId } = useStoreAccess();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

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

  const handleAddProduct = (product: Product) => {
    onAddProduct({
      product_id: product.id,
      product_name: product.name,
      unit_price: product.price,
      quantity: 1,
    });
  };

  if (loadingProducts) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produto..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filtros de categoria */}
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

      {/* Grid de produtos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filteredProducts.map((product) => (
          <Card 
            key={product.id}
            className="cursor-pointer hover:border-primary transition-colors overflow-hidden"
            onClick={() => handleAddProduct(product)}
          >
            <CardContent className="p-3">
              {product.image_url && (
                <div className="aspect-square mb-2 rounded-md overflow-hidden bg-muted">
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <h4 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
                {product.name}
              </h4>
              <p className="text-primary font-bold text-sm mt-1">
                {formatCurrency(product.price)}
              </p>
              <Button 
                size="sm" 
                className="w-full mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddProduct(product);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
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
    </div>
  );
}
