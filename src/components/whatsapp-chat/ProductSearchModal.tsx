import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Send, Loader2, Package, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  image_url: string | null;
}

interface ProductSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  onSendProduct: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  sending?: boolean;
}

export function ProductSearchModal({ open, onOpenChange, storeId, onSendProduct, onAddToCart, sending }: ProductSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sendingProductId, setSendingProductId] = useState<string | null>(null);

  const searchProducts = useCallback(async (term: string) => {
    if (!term.trim() || !storeId) {
      setProducts([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, description, image_url')
        .eq('store_id', storeId)
        .eq('is_available', true)
        .ilike('name', `%${term}%`)
        .order('name')
        .limit(20);

      if (error) throw error;
      setProducts((data || []) as Product[]);
    } catch (err) {
      console.error('[ProductSearchModal] Erro:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const debouncedSearch = useDebouncedCallback((term: string) => {
    searchProducts(term);
  }, 400);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleSend = async (product: Product) => {
    setSendingProductId(product.id);
    onSendProduct(product);
    // O modal será fechado pelo componente pai após o envio
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  // Reset ao abrir/fechar
  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setSearchTerm('');
      setProducts([]);
      setSearched(false);
      setSendingProductId(null);
    }
    onOpenChange(value);
  };

  // Limpar estado sempre que o modal abrir
  useEffect(() => {
    if (open) {
      setSearchTerm('');
      setProducts([]);
      setSearched(false);
      setSendingProductId(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Buscar Produto
          </DialogTitle>
        </DialogHeader>

        {/* Campo de busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos em todo o catálogo..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {/* Lista de produtos */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          )}

          {!loading && searched && products.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum produto encontrado para "{searchTerm}"
            </div>
          )}

          {!loading && !searched && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Digite o nome do produto para buscar
            </div>
          )}

          {!loading && products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              {/* Imagem */}
              <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-base font-bold text-primary">
                  {formatPrice(product.price)}
                </p>
              </div>

              {/* Botões de ação */}
              <div className="flex gap-1.5 flex-shrink-0">
                {onAddToCart && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 px-2"
                    title="Adicionar ao carrinho"
                    onClick={() => {
                      onAddToCart(product);
                    }}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="default"
                  className="gap-1.5"
                  disabled={sending || sendingProductId === product.id}
                  onClick={() => handleSend(product)}
                >
                  {sendingProductId === product.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Enviar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
