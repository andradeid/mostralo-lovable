import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Package, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PromotionProductCard } from '@/components/PromotionProductCard';
import { Skeleton } from '@/components/ui/skeleton';

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

interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: string;
  scope: string;
  discount_percentage?: number;
  discount_amount?: number;
  code?: string;
  banner_image_url?: string;
  start_date: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  minimum_order_value?: number;
}

interface PromotionPopupDialogProps {
  promotion: Promotion | null;
  open: boolean;
  onClose: () => void;
  onApplyCode?: (code: string) => void;
  storeSlug?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export function PromotionPopupDialog({
  promotion,
  open,
  onClose,
  onApplyCode,
  storeSlug = '',
  primaryColor = '#3B82F6',
  secondaryColor = '#10B981',
}: PromotionPopupDialogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const navigate = useNavigate();

  if (!promotion) return null;

  useEffect(() => {
    if (open && (promotion.scope === 'specific_products' || promotion.scope === 'category')) {
      fetchProducts();
    }
  }, [open, promotion]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    
    try {
      let query = supabase
        .from('products')
        .select('id, name, description, price, offer_price, is_on_offer, image_url, slug');

      if (promotion.scope === 'specific_products') {
        const { data: promoProducts } = await supabase
          .from('promotion_products')
          .select('product_id')
          .eq('promotion_id', promotion.id);

        if (promoProducts && promoProducts.length > 0) {
          const productIds = promoProducts.map(p => p.product_id);
          query = query.in('id', productIds);
        } else {
          setProducts([]);
          setLoadingProducts(false);
          return;
        }
      } else if (promotion.scope === 'category') {
        const { data: promoCategories } = await supabase
          .from('promotion_categories')
          .select('category_id')
          .eq('promotion_id', promotion.id);

        if (promoCategories && promoCategories.length > 0) {
          const categoryIds = promoCategories.map(c => c.category_id);
          query = query.in('category_id', categoryIds);
        } else {
          setProducts([]);
          setLoadingProducts(false);
          return;
        }
      }

      query = query.eq('is_available', true).order('name');
      const { data } = await query;
      setProducts(data || []);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto [&>button]:hidden">
          {/* Seção de produtos para promoções específicas */}
          {(promotion.scope === 'specific_products' || promotion.scope === 'category') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" style={{ color: primaryColor }} />
                  Produtos em Promoção
                </h3>
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5 hover:bg-muted transition-colors"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
              
              {loadingProducts && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 p-3 border rounded-lg">
                      <Skeleton className="w-20 h-20 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-6 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {!loadingProducts && products.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum produto encontrado para esta promoção
                </p>
              )}
              
              {!loadingProducts && products.length > 0 && (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {products.map((product) => (
                    <PromotionProductCard
                      key={product.id}
                      product={product}
                      discountPercentage={promotion.discount_percentage}
                      discountAmount={promotion.discount_amount}
                      promotionType={promotion.type}
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
