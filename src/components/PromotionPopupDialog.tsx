import { storePath } from '@/lib/storePath';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Package, X, Truck, Percent, Gift, ShoppingBag, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
  bogo_buy_quantity?: number;
  bogo_get_quantity?: number;
  bogo_discount_percentage?: number;
  first_order_only?: boolean;
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

/** Retorna os badges de benefícios da promoção */
function getPromotionBenefits(promotion: Promotion) {
  const benefits: { label: string; icon: React.ReactNode; color: string }[] = [];
  // Valores numéricos chegam do banco como texto ("10.00"); normalizar antes de formatar
  const pct = Number(promotion.discount_percentage) || 0;
  const amount = Number(promotion.discount_amount) || 0;
  const pctLabel = `${pct.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}% OFF`;
  const amountLabel = `Economia de ${amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;

  // Frete grátis
  if (promotion.type === 'free_delivery') {
    benefits.push({ label: 'Frete Grátis', icon: <Truck className="w-3 h-3" />, color: 'bg-green-500' });
    // Pode ter desconto combinado
    if (pct > 0) {
      benefits.push({ label: pctLabel, icon: <Percent className="w-3 h-3" />, color: 'bg-orange-500' });
    } else if (amount > 0) {
      benefits.push({ label: amountLabel, icon: <Tag className="w-3 h-3" />, color: 'bg-orange-500' });
    }
  } else if (promotion.type === 'percentage' && pct > 0) {
    benefits.push({ label: pctLabel, icon: <Percent className="w-3 h-3" />, color: 'bg-orange-500' });
  } else if (promotion.type === 'fixed_amount' && amount > 0) {
    benefits.push({ label: amountLabel, icon: <Tag className="w-3 h-3" />, color: 'bg-orange-500' });
  } else if (promotion.type === 'bogo') {
    const buy = Number(promotion.bogo_buy_quantity) || 2;
    const get = Number(promotion.bogo_get_quantity) || 1;
    const bogoPct = Number(promotion.bogo_discount_percentage ?? 100);
    benefits.push({ label: `${bogoPct >= 100 ? `Leve ${buy} Pague ${buy - get}` : `Compre ${buy}, ${bogoPct}% OFF no${get > 1 ? "s" : ""} próximo${get > 1 ? "s" : ""}`}`, icon: <Gift className="w-3 h-3" />, color: 'bg-purple-500' });
  }

  if (promotion.first_order_only) {
    benefits.push({ label: '1º Pedido', icon: <ShoppingBag className="w-3 h-3" />, color: 'bg-blue-500' });
  }

  return benefits;
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

  useEffect(() => {
    if (!promotion) return;
    if (open && promotion && (promotion.scope === 'specific_products' || promotion.scope === 'category')) {
      fetchProducts();
    }
  }, [open, promotion]);

  if (!promotion) return null;

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

  const benefits = getPromotionBenefits(promotion);

  const hasProductList = promotion.scope === 'specific_products' || promotion.scope === 'category';
  const minOrder = Number(promotion.minimum_order_value || 0);
  const formatMoney = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleCopyCode = async () => {
    if (!promotion.code) return;
    try { await navigator.clipboard.writeText(promotion.code); } catch { /* sem permissão */ }
    onApplyCode?.(promotion.code);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0 [&>button]:hidden">
          {promotion.banner_image_url && (
            <img
              src={promotion.banner_image_url}
              alt={promotion.name}
              className="w-full max-h-56 object-cover rounded-t-lg"
            />
          )}

          <div className="space-y-4 p-6">
            {/* Cabeçalho: sempre visível, com botão de fechar */}
            <div className="flex items-start justify-between gap-3">
              <DialogTitle className="text-xl font-bold leading-tight">{promotion.name}</DialogTitle>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-full p-1.5 hover:bg-muted transition-colors"
                aria-label="Fechar"
              >
                <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            {benefits.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {benefits.map((b, i) => (
                  <Badge key={i} className={`${b.color} text-white text-xs flex items-center gap-1`}>
                    {b.icon}
                    {b.label}
                  </Badge>
                ))}
              </div>
            )}

            {promotion.description ? (
              <DialogDescription className="text-sm text-muted-foreground">{promotion.description}</DialogDescription>
            ) : (
              <DialogDescription className="sr-only">Detalhes da promoção</DialogDescription>
            )}

            {minOrder > 0 && (
              <p className="text-sm">Válida para pedidos a partir de <strong>{formatMoney(minOrder)}</strong>.</p>
            )}

            {promotion.code && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Use o cupom no checkout</p>
                  <p className="font-mono text-lg font-bold" style={{ color: primaryColor }}>{promotion.code}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Copiar cupom
                </button>
              </div>
            )}

            {/* Produtos da promoção (só quando ela vale para produtos ou categorias específicas) */}
            {hasProductList && (
              <div className="space-y-3">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Package className="h-5 w-5" style={{ color: primaryColor }} />
                  Produtos em Promoção
                </h3>

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
                        isFreeDelivery={promotion.type === 'free_delivery'}
                        onProductClick={(id) => {
                          const clickedProduct = products.find(p => p.id === id);
                          if (clickedProduct?.slug) {
                            navigate(storePath(storeSlug, `/produto/${clickedProduct.slug}`));
                            onClose();
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg py-3 font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              {hasProductList ? 'Continuar comprando' : 'Aproveitar agora'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
