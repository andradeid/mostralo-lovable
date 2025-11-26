import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CountdownTimer } from './CountdownTimer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Plan {
  id: string;
  name: string;
  price: number;
  discount_price: number;
  discount_percentage: number;
  promotion_label: string;
  promotion_end_date: string;
}

export const PromotionBanner = () => {
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivePromotion();
  }, []);

  const fetchActivePromotion = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, price, discount_price, discount_percentage, promotion_label, promotion_end_date')
        .eq('status', 'active')
        .eq('promotion_active', true)
        .gte('promotion_end_date', new Date().toISOString())
        .order('discount_percentage', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && data.discount_price && data.promotion_end_date) {
        setActivePlan(data as Plan);
      }
    } catch (error) {
      console.error('Erro ao buscar promoção:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpire = () => {
    setActivePlan(null);
  };

  if (loading || !activePlan) {
    return null;
  }

  const savings = activePlan.price - activePlan.discount_price;

  return (
    <div className="relative overflow-hidden">
      {/* Background com gradiente animado */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 animate-gradient-x"></div>
      
      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Content */}
      <div className="relative px-4 py-8 sm:py-12 max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Badge de promoção */}
          <div className="flex items-center gap-2">
            <Badge className="bg-white text-red-600 hover:bg-white text-sm sm:text-base px-4 py-1 font-bold animate-pulse">
              <Sparkles className="w-4 h-4 mr-2" />
              {activePlan.promotion_label || 'OFERTA LIMITADA'}
            </Badge>
          </div>

          {/* Título principal */}
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-5xl font-black text-white drop-shadow-lg">
              Desconto de {activePlan.discount_percentage}% OFF
            </h2>
            <p className="text-lg sm:text-xl text-white/90 font-semibold">
              Use o código: <span className="bg-white text-red-600 px-3 py-1 rounded font-mono">DESCONTO{activePlan.discount_percentage}</span>
            </p>
          </div>

          {/* Contador regressivo */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border-2 border-white/20">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-sm sm:text-base">
                Oferta expira em:
              </span>
            </div>
            <CountdownTimer 
              endDate={activePlan.promotion_end_date} 
              onExpire={handleExpire}
            />
          </div>

          {/* Preços */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-2xl max-w-md w-full">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <TrendingDown className="w-6 h-6 text-green-600" />
                <span className="text-sm font-semibold text-gray-600">
                  Plano {activePlan.name}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl line-through text-gray-400">
                    R$ {activePlan.price.toFixed(2)}
                  </span>
                  <Badge variant="destructive" className="text-xs">
                    -{activePlan.discount_percentage}%
                  </Badge>
                </div>
                
                <div className="text-5xl sm:text-6xl font-black text-green-600">
                  R$ {activePlan.discount_price.toFixed(2)}
                </div>
                
                <p className="text-sm text-gray-600">
                  Economize <span className="font-bold text-green-600">R$ {savings.toFixed(2)}</span> nesta promoção!
                </p>
              </div>

              <Button asChild size="lg" className="w-full text-lg font-bold bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg hover:shadow-xl transition-all">
                <Link to="/pricing">
                  Aproveitar Oferta Agora
                </Link>
              </Button>

              <p className="text-xs text-gray-500 text-center">
                ⚡ Vagas limitadas • Garanta sua vaga antes que acabe!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

