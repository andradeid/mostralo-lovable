import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PromotionProductCard } from '@/components/PromotionProductCard';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  offer_price: number | null;
  is_on_offer: boolean;
  image_url: string | null;
  slug: string;
}

interface PromotionProductsModalProps {
  promotionId: string;
  promotionName: string;
  promotionType: string;
  promotionScope: string;
  discountPercentage?: number | null;
  discountAmount?: number | null;
  isOpen: boolean;
  onClose: () => void;
  storeSlug: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export const PromotionProductsModal = ({
  promotionId,
  promotionName,
  promotionType,
  promotionScope,
  discountPercentage,
  discountAmount,
  isOpen,
  onClose,
  storeSlug,
  primaryColor = '#3B82F6',
  secondaryColor = '#10B981'
}: PromotionProductsModalProps) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen, promotionId]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from('products').select('id, name, description, price, offer_price, is_on_offer, image_url, slug');

      if (promotionScope === 'specific_products') {
        // Buscar produtos específicos
        const { data: promoProducts } = await supabase
          .from('promotion_products')
          .select('product_id')
          .eq('promotion_id', promotionId);

        if (promoProducts && promoProducts.length > 0) {
          const productIds = promoProducts.map(p => p.product_id);
          query = query.in('id', productIds);
        } else {
          setProducts([]);
          setLoading(false);
          return;
        }
      } else if (promotionScope === 'category') {
        // Buscar produtos por categoria
        const { data: promoCategories } = await supabase
          .from('promotion_categories')
          .select('category_id')
          .eq('promotion_id', promotionId);

        if (promoCategories && promoCategories.length > 0) {
          const categoryIds = promoCategories.map(c => c.category_id);
          query = query.in('category_id', categoryIds);
        } else {
          setProducts([]);
          setLoading(false);
          return;
        }
      } else if (promotionScope === 'all_products') {
        // Buscar loja da promoção
        const { data: promotion } = await supabase
          .from('promotions')
          .select('store_id')
          .eq('id', promotionId)
          .single();

        if (promotion) {
          query = query.eq('store_id', promotion.store_id);
        }
      }

      query = query.eq('is_available', true).order('name');

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setProducts(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar produtos:', err);
      setError(err.message || 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const calculatePromotionalPrice = (product: Product): number | null => {
    const basePrice = product.is_on_offer && product.offer_price 
      ? product.offer_price 
      : product.price;

    if (promotionType === 'percentage' && discountPercentage) {
      return basePrice * (1 - discountPercentage / 100);
    }
    
    if (promotionType === 'fixed_amount' && discountAmount) {
      return Math.max(0, basePrice - discountAmount);
    }

    return null;
  };

  const getDiscountPercentage = (product: Product): number | null => {
    if (promotionType === 'percentage' && discountPercentage) {
      return discountPercentage;
    }
    
    if (promotionType === 'fixed_amount' && discountAmount) {
      const basePrice = product.is_on_offer && product.offer_price 
        ? product.offer_price 
        : product.price;
      return Math.round((discountAmount / basePrice) * 100);
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            {promotionName}
          </DialogTitle>
          <DialogDescription>
            Produtos elegíveis para esta promoção
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border rounded-lg p-4 space-y-3">
                <Skeleton className="w-full h-40 rounded-md" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Nenhum produto encontrado para esta promoção
            </p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="space-y-3 mt-4">
            {products.map((product) => (
              <PromotionProductCard
                key={product.id}
                product={product}
                discountPercentage={discountPercentage}
                discountAmount={discountAmount}
                promotionType={promotionType}
                showActionButton={true}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                onProductClick={(id) => {
                  const clickedProduct = products.find(p => p.id === id);
                  if (clickedProduct?.slug) {
                    navigate(`/loja/${storeSlug}/produto/${clickedProduct.slug}`);
                    onClose();
                  }
                }}
              />
            ))}
          </div>
        )}

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
