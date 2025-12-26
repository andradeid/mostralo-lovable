import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTableComanda } from '@/hooks/useTableComanda';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/utils';
import { 
  Loader2, 
  QrCode, 
  Plus, 
  ShoppingCart, 
  User, 
  LogOut,
  ChefHat,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useSEO } from '@/hooks/useSEO';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  is_available: boolean;
}

interface Category {
  id: string;
  name: string;
  display_order: number;
}

interface ComandaItem {
  id: string;
  product_name: string;
  quantity: number;
  total_price: number;
  requires_approval: boolean;
  approved_at: string | null;
  preparation_status: string | null;
}

export default function TableMenuPage() {
  const { storeSlug, tableNumber } = useParams<{ storeSlug: string; tableNumber: string }>();
  const navigate = useNavigate();
  const { customerData, addItemToComanda, isLoading: isAddingItem, clearSession } = useTableComanda();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  // Verificar autenticação
  useEffect(() => {
    if (!customerData?.comandaId) {
      navigate(`/mesa/${storeSlug}/${tableNumber}`);
    }
  }, [customerData, storeSlug, tableNumber, navigate]);

  // Buscar dados da loja
  const { data: store } = useQuery({
    queryKey: ['store-by-slug', storeSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, slug, logo_url')
        .eq('slug', storeSlug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!storeSlug
  });

  // Buscar categorias
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', store?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, display_order')
        .eq('store_id', store!.id)
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!store?.id
  });

  // Buscar produtos
  const { data: products = [] } = useQuery({
    queryKey: ['products', store?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, description, price, image_url, category_id, is_available')
        .eq('store_id', store!.id)
        .eq('is_available', true)
        .order('name');
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!store?.id
  });

  // Buscar itens da comanda
  const { data: comandaItems = [], refetch: refetchItems } = useQuery({
    queryKey: ['comanda-items', customerData?.comandaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comanda_items')
        .select('id, product_name, quantity, total_price, requires_approval, approved_at, preparation_status')
        .eq('comanda_id', customerData!.comandaId)
        .order('added_at', { ascending: false });
      if (error) throw error;
      return data as ComandaItem[];
    },
    enabled: !!customerData?.comandaId,
    refetchInterval: 10000 // Atualizar a cada 10s
  });

  useSEO({
    title: store ? `Cardápio - ${store.name}` : 'Cardápio'
  });

  const handleAddItem = async (product: Product) => {
    const success = await addItemToComanda({
      productId: product.id,
      productName: product.name,
      unitPrice: product.price,
      quantity: 1
    });

    if (success) {
      toast.success(`${product.name} adicionado!`, {
        description: customerData?.requireApproval 
          ? 'Aguardando aprovação do garçom' 
          : 'Enviado para a cozinha'
      });
      refetchItems();
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate(`/mesa/${storeSlug}/${tableNumber}`);
  };

  const filteredProducts = activeCategory 
    ? products.filter(p => p.category_id === activeCategory)
    : products;

  const totalComanda = comandaItems.reduce((sum, item) => sum + item.total_price, 0);
  const pendingItems = comandaItems.filter(item => item.requires_approval && !item.approved_at);

  if (!customerData?.comandaId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {store?.logo_url && (
              <img src={store.logo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
            )}
            <div>
              <p className="font-semibold">{store?.name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <QrCode className="h-3 w-3" />
                Mesa {tableNumber}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowSummary(!showSummary)}
              className="relative"
            >
              <ShoppingCart className="h-5 w-5" />
              {comandaItems.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {comandaItems.length}
                </Badge>
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Customer info */}
        <div className="px-4 pb-3 flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{customerData.customerName}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-primary font-medium">Comanda #{customerData.comandaNumber}</span>
        </div>

        {/* Categories */}
        <ScrollArea className="pb-3">
          <div className="flex gap-2 px-4">
            <Button
              variant={activeCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(null)}
            >
              Todos
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Pending approval warning */}
      {pendingItems.length > 0 && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <span className="text-amber-700">
            {pendingItems.length} {pendingItems.length === 1 ? 'item aguardando' : 'itens aguardando'} aprovação do garçom
          </span>
        </div>
      )}

      {/* Summary Panel */}
      {showSummary && (
        <Card className="mx-4 mt-4">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Seu Consumo
            </h3>
            {comandaItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum item ainda</p>
            ) : (
              <div className="space-y-2">
                {comandaItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span>{item.quantity}x {item.product_name}</span>
                      {item.requires_approval && !item.approved_at && (
                        <Clock className="h-3 w-3 text-amber-500" />
                      )}
                      {item.preparation_status === 'preparing' && (
                        <ChefHat className="h-3 w-3 text-orange-500" />
                      )}
                      {item.preparation_status === 'ready' && (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                    <span className="font-medium">{formatCurrency(item.total_price)}</span>
                  </div>
                ))}
                <div className="pt-2 mt-2 border-t flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(totalComanda)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      <div className="p-4 grid gap-3">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="flex">
              {product.image_url && (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-24 h-24 object-cover"
                />
              )}
              <CardContent className="flex-1 p-3 flex flex-col justify-between">
                <div>
                  <h3 className="font-medium">{product.name}</h3>
                  {product.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {product.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-primary">{formatCurrency(product.price)}</span>
                  <Button 
                    size="sm" 
                    onClick={() => handleAddItem(product)}
                    disabled={isAddingItem}
                  >
                    {isAddingItem ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total consumido</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalComanda)}</p>
        </div>
        <Button variant="outline" onClick={() => setShowSummary(!showSummary)}>
          Ver Comanda ({comandaItems.length})
        </Button>
      </div>
    </div>
  );
}
