import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  end_date: string | null;
  promotion_label: string;
  show_countdown: boolean;
  status: string;
  start_date?: string | null;
  is_public?: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const PromotionBanner = () => {
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPromotionData();
  }, []);

  // Ativar animação após carregar os dados
  useEffect(() => {
    if (coupon) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [coupon]);

  // Calcular tempo restante
  useEffect(() => {
    if (!coupon?.end_date) return;

    const calculateTimeLeft = () => {
      const difference = new Date(coupon.end_date!).getTime() - new Date().getTime();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [coupon]);

  const fetchPromotionData = async () => {
    try {
      // Buscar cupom público ativo
      const { data: couponData, error: couponError } = await (supabase as any)
        .from('coupons')
        .select('*')
        .eq('is_public', true)
        .eq('status', 'active')
        .or(`start_date.is.null,start_date.lte.${new Date().toISOString()}`)
        .or(`end_date.is.null,end_date.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle() as { data: Coupon | null; error: any };

      if (couponError) throw couponError;

      if (couponData) {
        setCoupon(couponData as Coupon);

        // Buscar planos se necessário
        const { data: plansData } = await supabase
          .from('plans')
          .select('id, name, price')
          .eq('status', 'active');

        setPlans(plansData || []);
      }
    } catch (error) {
      console.error('Erro ao buscar promoção:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (coupon) {
      navigator.clipboard.writeText(coupon.code);
      toast({
        title: 'Código Copiado!',
        description: `Use o código ${coupon.code} no checkout`,
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const calculateDiscountedPrice = (originalPrice: number) => {
    if (!coupon) return originalPrice;

    if (coupon.discount_type === 'percentage') {
      return originalPrice * (1 - coupon.discount_value / 100);
    } else {
      return originalPrice - coupon.discount_value;
    }
  };

  if (loading || !coupon) {
    return null;
  }

  const lowestPlan = plans.reduce((min, plan) => 
    plan.price < min.price ? plan : min
  , plans[0]);

  const discountedPrice = lowestPlan ? calculateDiscountedPrice(lowestPlan.price) : 0;
  const savings = lowestPlan ? lowestPlan.price - discountedPrice : 0;

  return (
    <div className="w-full">
      <div className={`relative overflow-hidden rounded-xl shadow-xl transition-all duration-500 ${
        isVisible ? 'animate-fade-in-up' : 'opacity-0 translate-y-5'
      }`}>
        <div className="grid md:grid-cols-2">
          {/* Left Side - Orange/Red Gradient */}
          <div className="bg-gradient-to-br from-orange-500 to-red-500 dark:from-orange-600 dark:to-red-600 p-4 md:p-6 flex flex-col items-center justify-center text-center">
            <div className="space-y-3 flex flex-col items-center">
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-12 h-12 bg-white/20 rounded-full transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`} style={{ transitionDelay: '100ms' }}>
                <Ticket className="w-6 h-6 text-white" />
              </div>

              {/* Badge */}
              <Badge className={`bg-yellow-400 text-yellow-900 hover:bg-yellow-400 font-bold text-xs transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`} style={{ transitionDelay: '200ms' }}>
                {coupon.promotion_label || 'OFERTA LIMITADA'}
              </Badge>

              {/* Main Discount - Hero */}
              <h2 className={`text-3xl md:text-4xl font-black text-white drop-shadow-lg transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`} style={{ transitionDelay: '300ms' }}>
                {coupon.discount_type === 'percentage' 
                  ? `${coupon.discount_value}% OFF`
                  : `${formatPrice(coupon.discount_value)} OFF`
                }
              </h2>

              {/* Description */}
              {coupon.description && (
                <p className={`text-sm text-white/80 font-medium max-w-xs transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                }`} style={{ transitionDelay: '350ms' }}>
                  {coupon.description}
                </p>
              )}

              {/* Coupon Code - Compact */}
              <div className={`inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 border border-white/30 transition-all duration-500 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
              }`} style={{ transitionDelay: '400ms' }}>
                <code className="text-sm font-mono font-bold text-white tracking-wider">
                  {coupon.code}
                </code>
                <Button 
                  onClick={copyCode} 
                  size="sm" 
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-white/20 text-white transition-all hover:scale-110"
                >
                  📋
                </Button>
              </div>

              {/* Prices */}
              {lowestPlan && discountedPrice > 0 && (
                <div className={`flex flex-col items-center gap-1 text-white transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                }`} style={{ transitionDelay: '450ms' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-base line-through opacity-70">
                      {formatPrice(lowestPlan.price)}
                    </span>
                    <span className="text-xl md:text-2xl font-black text-yellow-300 drop-shadow-lg">
                      {formatPrice(discountedPrice)}
                    </span>
                  </div>
                  {savings > 0 && (
                    <p className="text-xs opacity-90">
                      Economize <span className="font-bold text-yellow-300">{formatPrice(savings)}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Pink Gradient */}
          {coupon.show_countdown && coupon.end_date && (
            <div className="bg-gradient-to-br from-pink-500 to-pink-600 dark:from-pink-600 dark:to-pink-700 p-3 md:p-4 flex flex-col items-center justify-center text-white">
              <div className="space-y-2.5 w-full">
                {/* Countdown Title */}
                <p className={`text-center text-sm font-semibold transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                }`} style={{ transitionDelay: '550ms' }}>
                  Termina em:
                </p>

                {/* Countdown Timer */}
                <div className={`flex items-center justify-center gap-1 transition-all duration-500 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                }`} style={{ transitionDelay: '600ms' }}>
                  <div className="flex flex-col items-center">
                    <div className="text-2xl md:text-3xl font-bold tabular-nums">
                      {String(timeLeft?.days || 0).padStart(2, '0')}
                    </div>
                    <div className="text-[10px] uppercase font-medium">
                      DIAS
                    </div>
                  </div>

                  <div className="text-xl font-bold mx-0.5">:</div>

                  <div className="flex flex-col items-center">
                    <div className="text-2xl md:text-3xl font-bold tabular-nums">
                      {String(timeLeft?.hours || 0).padStart(2, '0')}
                    </div>
                    <div className="text-[10px] uppercase font-medium">
                      HORAS
                    </div>
                  </div>

                  <div className="text-xl font-bold mx-0.5">:</div>

                  <div className="flex flex-col items-center">
                    <div className="text-2xl md:text-3xl font-bold tabular-nums">
                      {String(timeLeft?.minutes || 0).padStart(2, '0')}
                    </div>
                    <div className="text-[10px] uppercase font-medium">
                      MIN
                    </div>
                  </div>

                  <div className="text-xl font-bold mx-0.5">:</div>

                  <div className="flex flex-col items-center">
                    <div className="text-2xl md:text-3xl font-bold tabular-nums">
                      {String(timeLeft?.seconds || 0).padStart(2, '0')}
                    </div>
                    <div className="text-[10px] uppercase font-medium">
                      SEG
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <Button 
                  size="default" 
                  className={`w-full bg-white text-orange-600 hover:bg-white/90 font-bold text-sm shadow-lg h-9 transition-all duration-500 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
                  }`}
                  style={{ transitionDelay: '700ms' }}
                  onClick={() => {
                    const plansSection = document.getElementById('plans');
                    if (plansSection) {
                      plansSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  Aproveitar Oferta
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

