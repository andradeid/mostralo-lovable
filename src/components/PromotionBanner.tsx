import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Promotion } from '@/types/promotions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Tag, Clock, Calendar, Sparkles, TruckIcon, Gift, Percent, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PromotionProductsModal } from './PromotionProductsModal';

interface PromotionBannerProps {
  storeId: string;
  storeSlug: string;
  onApplyCode?: (code: string) => void;
}

export const PromotionBanner = ({ storeId, storeSlug, onApplyCode }: PromotionBannerProps) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);

  useEffect(() => {
    fetchPromotions();
  }, [storeId]);

  const fetchPromotions = async () => {
    try {
      const { data } = await supabase
        .from('promotions')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'active')
        .eq('is_visible_on_store', true)
        .lte('start_date', new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
        .order('display_order');

      if (data) {
        setPromotions(data);
      }
    } catch (error) {
      console.error('Erro ao buscar promoções:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || promotions.length === 0) {
    return null;
  }

  const getDiscountDisplay = (promotion: Promotion) => {
    if (promotion.type === 'percentage' && promotion.discount_percentage) {
      return {
        value: `${promotion.discount_percentage}%`,
        label: 'OFF',
        icon: <Percent className="w-6 h-6" />
      };
    }
    if (promotion.type === 'fixed_amount' && promotion.discount_amount) {
      return {
        value: `R$ ${promotion.discount_amount}`,
        label: 'OFF',
        icon: <Tag className="w-6 h-6" />
      };
    }
    if (promotion.type === 'free_delivery') {
      return {
        value: 'FRETE',
        label: 'GRÁTIS',
        icon: <TruckIcon className="w-6 h-6" />
      };
    }
    if (promotion.type === 'bogo' && promotion.bogo_buy_quantity && promotion.bogo_get_quantity) {
      return {
        value: `${promotion.bogo_buy_quantity}+${promotion.bogo_get_quantity}`,
        label: 'PROMO',
        icon: <Gift className="w-6 h-6" />
      };
    }
    return {
      value: '🎁',
      label: 'PROMO',
      icon: <Sparkles className="w-6 h-6" />
    };
  };

  return (
    <div className="w-full mb-6">
      <style>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .shimmer {
          background: linear-gradient(
            to right,
            transparent 0%,
            rgba(255, 255, 255, 0.3) 50%,
            transparent 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 3s infinite;
        }
      `}</style>
      
      <Carousel className="w-full">
        <CarouselContent>
          {promotions.map((promotion) => {
            const discount = getDiscountDisplay(promotion);
            
            return (
              <CarouselItem key={promotion.id}>
                <Card className="relative overflow-hidden bg-gradient-to-r from-orange-500 via-orange-400 to-red-500 border-4 border-orange-400 shadow-2xl">
                  {/* Badge "PROMOÇÃO ATIVA" */}
                  <div className="absolute top-3 left-3 z-10">
                    <Badge className="bg-orange-600 text-white text-sm font-bold px-3 py-1.5 animate-pulse shadow-lg">
                      <Sparkles className="w-4 h-4 mr-1" />
                      PROMOÇÃO ATIVA
                    </Badge>
                  </div>

                  {/* Background shimmer effect */}
                  <div className="absolute inset-0 shimmer opacity-30 pointer-events-none" />

                  <div className="relative p-6 md:p-8">
                    <div className="flex flex-col lg:flex-row items-start gap-6">
                      {/* Lado esquerdo: Conteúdo principal */}
                      <div className="flex-1 flex flex-col md:flex-row items-start md:items-center gap-6 min-w-0">
                        {/* Círculo de desconto grande */}
                        <div className="flex-shrink-0 w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-white to-orange-50 border-4 border-white shadow-2xl flex flex-col items-center justify-center">
                          <span className="text-2xl md:text-4xl font-black text-orange-600 leading-none">
                            {discount.value}
                          </span>
                          <span className="text-xs md:text-sm font-bold text-orange-600 mt-1">
                            {discount.label}
                          </span>
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 space-y-3 text-white min-w-0">
                          <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight">
                            {promotion.name}
                          </h3>
                          
                          {promotion.description && (
                            <p className="text-base md:text-lg font-semibold text-white/95 leading-snug">
                              {promotion.description}
                            </p>
                          )}

                          {/* Informações extras (data, horário) */}
                          <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm font-medium text-white/90">
                            {promotion.end_date && (
                              <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {format(new Date(promotion.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                                </span>
                              </div>
                            )}

                            {promotion.start_time && promotion.end_time && (
                              <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {promotion.start_time} - {promotion.end_time}
                                </span>
                              </div>
                            )}

                            {promotion.minimum_order_value && (
                              <div className="flex items-center gap-1.5 bg-white/10 px-2 py-1 rounded-md backdrop-blur-sm">
                                <Tag className="w-4 h-4" />
                                <span>
                                  Mín: R$ {promotion.minimum_order_value}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Código promocional destacado */}
                          {promotion.code && (
                            <div className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-white/20 backdrop-blur-sm rounded-xl border-2 border-white/40 shadow-lg">
                              <Tag className="w-4 h-4 md:w-5 md:h-5 text-white" />
                              <span className="font-mono font-black text-xl md:text-2xl text-white tracking-wider">
                                {promotion.code}
                              </span>
                            </div>
                          )}

                          {/* Botões de ação */}
                          <div className="flex flex-wrap gap-3 pt-2">
                            {promotion.code && onApplyCode && (
                              <Button
                                size="lg"
                                className="bg-white text-orange-600 hover:bg-orange-50 font-bold text-base px-6 shadow-xl hover:scale-105 transition-transform"
                                onClick={() => onApplyCode(promotion.code!)}
                              >
                                Usar Código
                                <Tag className="w-5 h-5 ml-2" />
                              </Button>
                            )}

                            {(promotion.scope === 'specific_products' || promotion.scope === 'category') && (
                              <Button
                                size="lg"
                                variant="outline"
                                className="bg-white/20 backdrop-blur-sm text-white border-white/40 hover:bg-white/30 font-bold text-base px-6 shadow-xl hover:scale-105 transition-transform"
                                onClick={() => setSelectedPromotion(promotion)}
                              >
                                <Package className="w-5 h-5 mr-2" />
                                Ver Produtos
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Lado direito: Imagem do banner (se existir) */}
                      {promotion.banner_image_url && (
                        <div className="w-full lg:w-80 flex-shrink-0">
                          <img
                            src={promotion.banner_image_url}
                            alt={promotion.name}
                            className="w-full h-48 lg:h-full object-cover rounded-xl shadow-2xl border-4 border-white/20"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {promotions.length > 1 && (
          <>
            <CarouselPrevious className="left-2 bg-white text-orange-600 hover:bg-orange-50" />
            <CarouselNext className="right-2 bg-white text-orange-600 hover:bg-orange-50" />
          </>
        )}
      </Carousel>

      {/* Modal de produtos */}
      {selectedPromotion && (
        <PromotionProductsModal
          promotionId={selectedPromotion.id}
          promotionName={selectedPromotion.name}
          promotionType={selectedPromotion.type}
          promotionScope={selectedPromotion.scope}
          discountPercentage={selectedPromotion.discount_percentage}
          discountAmount={selectedPromotion.discount_amount}
          isOpen={!!selectedPromotion}
          onClose={() => setSelectedPromotion(null)}
          storeSlug={storeSlug}
        />
      )}
    </div>
  );
};
