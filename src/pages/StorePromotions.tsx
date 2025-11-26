import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Tag, Clock, Calendar, DollarSign, Copy, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PromotionProductsModal } from '@/components/PromotionProductsModal';
import { PromotionProductCard } from '@/components/PromotionProductCard';
import BottomNavigation from '@/components/BottomNavigation';
import { Loader2 } from 'lucide-react';

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  code: string | null;
  type: string;
  discount_percentage: number | null;
  discount_amount: number | null;
  scope: string;
  minimum_order_value: number | null;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  banner_image_url: string | null;
  allowed_days: string[] | null;
}

interface Store {
  id: string;
  slug: string;
  name: string;
  configuration?: {
    primary_color?: string;
    secondary_color?: string;
  };
  theme_colors?: any;
}

export default function StorePromotions() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [store, setStore] = useState<Store | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [promotionProducts, setPromotionProducts] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPromotion, setSelectedPromotion] = useState<{
    id: string;
    name: string;
    type: string;
    scope: string;
    discountPercentage: number | null;
    discountAmount: number | null;
  } | null>(null);

  useEffect(() => {
    if (slug) {
      fetchData();
    }
  }, [slug]);

  const fetchData = async () => {
    try {
      // Buscar loja
      const { data: storeData, error: storeError } = await supabase
        .from('public_stores')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (storeError || !storeData) {
        console.error('Erro ao buscar loja:', storeError);
        navigate('/');
        return;
      }

      // Buscar configuração da loja
      const { data: configData } = await supabase
        .from('public_store_config')
        .select('*')
        .eq('store_id', storeData.id)
        .maybeSingle();

      const processedStore = {
        ...storeData,
        configuration: configData || {
          primary_color: '#EF4444',
          secondary_color: '#10B981'
        }
      };
      
      setStore(processedStore);

      // Buscar promoções ativas
      const now = new Date().toISOString();
      const { data: promotionsData, error: promotionsError } = await supabase
        .from('promotions')
        .select('*')
        .eq('store_id', storeData.id)
        .eq('status', 'active')
        .eq('is_visible_on_store', true)
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('created_at', { ascending: false });

      if (promotionsError) {
        console.error('Erro ao buscar promoções:', promotionsError);
      } else {
        setPromotions(promotionsData || []);
        
        // Buscar produtos de cada promoção (limitado a 3)
        if (promotionsData && promotionsData.length > 0) {
          const productsMap: Record<string, any[]> = {};
          
          for (const promo of promotionsData) {
            let products = [];
            
            if (promo.scope === 'specific_products') {
              const { data: promoProducts } = await supabase
                .from('promotion_products')
                .select('product_id')
                .eq('promotion_id', promo.id);
              
              if (promoProducts && promoProducts.length > 0) {
                const productIds = promoProducts.map(p => p.product_id);
                const { data: productsData } = await supabase
                  .from('products')
                  .select('*')
                  .in('id', productIds)
                  .eq('is_available', true)
                  .limit(3);
                
                products = productsData || [];
              }
            } else if (promo.scope === 'category') {
              const { data: promoCategories } = await supabase
                .from('promotion_categories')
                .select('category_id')
                .eq('promotion_id', promo.id);
              
              if (promoCategories && promoCategories.length > 0) {
                const categoryIds = promoCategories.map(c => c.category_id);
                const { data: productsData } = await supabase
                  .from('products')
                  .select('*')
                  .in('category_id', categoryIds)
                  .eq('is_available', true)
                  .limit(3);
                
                products = productsData || [];
              }
            } else if (promo.scope === 'all_products') {
              const { data: productsData } = await supabase
                .from('products')
                .select('*')
                .eq('store_id', storeData.id)
                .eq('is_available', true)
                .limit(3);
              
              products = productsData || [];
            }
            
            productsMap[promo.id] = products;
          }
          
          setPromotionProducts(productsMap);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDiscountDisplay = (promotion: Promotion) => {
    if (promotion.type === 'percentage' && promotion.discount_percentage) {
      return `${promotion.discount_percentage}% OFF`;
    }
    if (promotion.type === 'fixed_amount' && promotion.discount_amount) {
      return `R$ ${promotion.discount_amount.toFixed(2)} OFF`;
    }
    if (promotion.type === 'bogo') {
      return 'Compre e Ganhe';
    }
    return 'Desconto';
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    if (store) {
      localStorage.setItem(`pending_promo_${store.id}`, code);
    }
    toast({
      title: 'Código copiado! 🎉',
      description: `Código "${code}" copiado e será aplicado no checkout.`,
      duration: 3000,
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDaysDisplay = (days: string[] | null) => {
    if (!days || days.length === 0) return 'Todos os dias';
    if (days.length === 7) return 'Todos os dias';
    
    const daysMap: Record<string, string> = {
      sunday: 'Dom',
      monday: 'Seg',
      tuesday: 'Ter',
      wednesday: 'Qua',
      thursday: 'Qui',
      friday: 'Sex',
      saturday: 'Sáb',
    };
    
    return days.map(d => daysMap[d] || d).join(', ');
  };

  const resolvePrimary = (s?: Store | null) => {
    if (!s) return '#EF4444';
    if (s.configuration?.primary_color) return s.configuration.primary_color;
    const theme = s.theme_colors;
    try {
      if (typeof theme === 'string') {
        const parsed = JSON.parse(theme);
        if (parsed?.primary) return parsed.primary as string;
      } else if (theme?.primary) {
        return theme.primary as string;
      }
    } catch {}
    return '#EF4444';
  };

  const primaryColor = resolvePrimary(store);
  const secondaryColor = store?.configuration?.secondary_color || '#10B981';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 shadow-md" style={{ backgroundColor: primaryColor, color: 'white' }}>
        <div className="max-w-[1080px] mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/loja/${slug}`)}
              className="hover:bg-white/10"
              style={{ color: 'white' }}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              <h1 className="text-lg font-bold">Promoções</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-[1080px] mx-auto px-4 py-6">
        {promotions.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhuma promoção ativa</h2>
            <p className="text-muted-foreground">
              No momento não temos promoções disponíveis. Volte em breve! 😊
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promotions.map((promotion) => (
              <Card key={promotion.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Banner da promoção */}
                {promotion.banner_image_url && (
                  <div className="relative h-48 md:h-64">
                    <Badge 
                      className="absolute top-3 right-3 z-10 text-white font-bold px-4 py-1.5"
                      style={{ backgroundColor: primaryColor }}
                    >
                      🎉 PROMOÇÃO ATIVA
                    </Badge>
                    <img
                      src={promotion.banner_image_url}
                      alt={promotion.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <CardContent className="p-4 md:p-6 space-y-4">
                  {/* Nome e descrição */}
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold">{promotion.name}</h3>
                    {promotion.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {promotion.description}
                      </p>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="space-y-2 text-sm">
                    {/* Validade */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Válido até {promotion.end_date ? formatDate(promotion.end_date) : 'indeterminado'}
                      </span>
                    </div>

                    {/* Dias permitidos */}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{getDaysDisplay(promotion.allowed_days)}</span>
                      {promotion.start_time && promotion.end_time && (
                        <span className="text-xs">
                          ({promotion.start_time} - {promotion.end_time})
                        </span>
                      )}
                    </div>

                    {/* Valor mínimo */}
                    {promotion.minimum_order_value && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>Pedido mínimo: R$ {promotion.minimum_order_value.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Código promocional */}
                  {promotion.code && (
                    <div className="bg-muted rounded-lg p-3 border-2 border-dashed border-primary/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Código Promocional</div>
                          <div className="font-mono font-bold text-primary text-lg">
                            {promotion.code}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyCode(promotion.code!)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copiar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* PRODUTOS DA PROMOÇÃO */}
                  {promotionProducts[promotion.id]?.length > 0 && (
                    <div className="space-y-3 pt-4 border-t">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase">
                        Produtos em Promoção
                      </h4>
                      <div className="space-y-3">
                        {promotionProducts[promotion.id].map((product) => (
                          <PromotionProductCard
                            key={product.id}
                            product={product}
                            discountPercentage={promotion.discount_percentage}
                            discountAmount={promotion.discount_amount}
                            promotionType={promotion.type}
                            showActionButton={false}
                            primaryColor={primaryColor}
                            secondaryColor={secondaryColor}
                          />
                        ))}
                      </div>

                      {/* Botão "Ver todos os produtos" */}
                      {(promotion.scope === 'specific_products' || promotion.scope === 'category') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-3"
                          style={{ 
                            borderColor: primaryColor, 
                            color: primaryColor 
                          }}
                          onClick={() => setSelectedPromotion({
                            id: promotion.id,
                            name: promotion.name,
                            type: promotion.type,
                            scope: promotion.scope,
                            discountPercentage: promotion.discount_percentage,
                            discountAmount: promotion.discount_amount,
                          })}
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Ver Todos os Produtos
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Botão usar código */}
                  {promotion.code && (
                    <Button
                      size="sm"
                      className="w-full text-white hover:opacity-90"
                      style={{ backgroundColor: primaryColor }}
                      onClick={() => handleCopyCode(promotion.code!)}
                    >
                      Usar Código
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de produtos */}
      {selectedPromotion && slug && (
        <PromotionProductsModal
          promotionId={selectedPromotion.id}
          promotionName={selectedPromotion.name}
          promotionType={selectedPromotion.type}
          promotionScope={selectedPromotion.scope}
          discountPercentage={selectedPromotion.discountPercentage}
          discountAmount={selectedPromotion.discountAmount}
          isOpen={!!selectedPromotion}
          onClose={() => setSelectedPromotion(null)}
          storeSlug={slug}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      )}

      {/* Bottom Navigation */}
      {store && (
        <BottomNavigation
          currentRoute="promotions"
          storeSlug={store.slug}
        />
      )}
    </div>
  );
}
