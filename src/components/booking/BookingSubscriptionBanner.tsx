import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Sparkles, ChevronRight, Infinity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BookingSubscriptionBannerProps {
  storeId: string;
  storeSlug: string;
}

export function BookingSubscriptionBanner({ storeId, storeSlug }: BookingSubscriptionBannerProps) {
  // Fetch subscription plans to show preview
  const { data: plans = [] } = useQuery({
    queryKey: ['public-subscription-plans-preview', storeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_subscription_plans')
        .select('id, name, price, billing_cycle')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('price', { ascending: true })
        .limit(2);
      
      if (error) {
        console.error('Error fetching plans:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!storeId
  });

  // Don't render if no plans available
  if (plans.length === 0) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const lowestPrice = plans.length > 0 ? Math.min(...plans.map(p => p.price)) : 0;

  return (
    <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground">Clube de Assinaturas</h3>
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Assine um plano e economize nos seus agendamentos!
            </p>
            {lowestPrice > 0 && (
              <p className="text-sm mt-1">
                <span className="text-muted-foreground">A partir de </span>
                <span className="font-semibold text-primary">{formatPrice(lowestPrice)}/mês</span>
              </p>
            )}
          </div>
          
          <div className="flex-shrink-0 w-full sm:w-auto">
            <Link to={`/assinaturas/${storeSlug}`}>
              <Button className="w-full sm:w-auto group">
                Ver Planos
                <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
