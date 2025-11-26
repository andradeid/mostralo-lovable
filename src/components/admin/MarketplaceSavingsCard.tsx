import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/use-auth';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useCountUp } from '@/hooks/useCountUp';
import { supabase } from '@/integrations/supabase/client';
import { TrendingDown, Wallet, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { formatCurrency } from '@/utils/driverEarnings';

interface MarketplaceSavingsCardProps {
  variant?: 'default' | 'compact';
  className?: string;
}

export function MarketplaceSavingsCard({ variant = 'default', className = '' }: MarketplaceSavingsCardProps) {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { storeId: validatedStoreId } = useStoreAccess();

  const marketplaceFee = 0.25; // 25%
  const totalSavings = totalRevenue * marketplaceFee;
  const monthlySavings = monthlyRevenue * marketplaceFee;

  const animatedSavings = useCountUp(totalSavings, 2000);

  useEffect(() => {
    if (validatedStoreId) {
      fetchSavings();
    }
  }, [validatedStoreId]);

  const fetchSavings = async () => {
    if (!validatedStoreId) return;

    try {
      // Buscar receita total de pedidos concluídos usando validatedStoreId
      const { data: orders } = await supabase
        .from('orders')
        .select('total')
        .eq('store_id', validatedStoreId)
        .eq('status', 'concluido');

      const total = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      setTotalRevenue(total);

      // Buscar receita do mês atual
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const { data: monthOrders } = await supabase
        .from('orders')
        .select('total')
        .eq('store_id', validatedStoreId)
        .eq('status', 'concluido')
        .gte('created_at', firstDayOfMonth.toISOString());

      const monthlyTotal = monthOrders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
      setMonthlyRevenue(monthlyTotal);

      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar economia:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (totalRevenue === 0) {
    return (
      <Card className={`border-2 border-dashed border-muted ${className}`}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <Sparkles className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Complete seu primeiro pedido para ver sua economia!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact variant para OrdersPage
  if (variant === 'compact') {
    return (
      <Card className={`border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 ${className}`}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Economia Total vs Marketplace</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(animatedSavings)}
                </p>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    Calculamos 25% do valor total dos seus pedidos concluídos, que é a comissão média cobrada por marketplaces como iFood, Rappi e Uber Eats.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant para Dashboard (VERSÃO COMPACTA)
  return (
    <Card className={`border-2 border-emerald-300 bg-gradient-to-br from-emerald-500 to-green-600 text-white ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            💰 Economia vs Marketplace
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8">
                  <HelpCircle className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Calculamos 25% do valor total dos seus pedidos concluídos, que é a comissão média cobrada por marketplaces como iFood, Rappi e Uber Eats.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Valor Principal - COMPACTO */}
        <div className="text-center space-y-1 bg-white/10 rounded-lg p-3 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <p className="text-xs font-medium text-white/90">VOCÊ ECONOMIZOU</p>
          </div>
          <p className="text-3xl font-bold drop-shadow-lg">
            {formatCurrency(animatedSavings)}
          </p>
          <p className="text-xs text-white/80">em comissões</p>
        </div>

        {/* Estatísticas Unificadas */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm text-center">
            <p className="text-[10px] text-white/70 mb-0.5">Receita Total</p>
            <p className="text-sm font-bold">{formatCurrency(totalRevenue)}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm text-center">
            <p className="text-[10px] text-white/70 mb-0.5">Ec. Mensal</p>
            <p className="text-sm font-bold">{formatCurrency(monthlySavings)}</p>
          </div>
          <div className="bg-red-500/20 rounded-lg p-2 backdrop-blur-sm text-center border border-red-300/30">
            <p className="text-[10px] text-white/70 mb-0.5">iFood = 25%</p>
            <p className="text-sm font-bold text-red-200">-{formatCurrency(totalSavings)}</p>
          </div>
        </div>

        {/* Sugestões Inline */}
        <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
          <p className="text-xs text-white/90">
            🚀 <span className="font-medium">Invista essa economia:</span> cardápio, marketing, equipamentos
          </p>
        </div>

        {/* Call to Action - Menor */}
        <NavLink to="/dashboard/reports">
          <Button variant="secondary" size="sm" className="w-full bg-white text-emerald-600 hover:bg-white/90">
            Ver Relatórios Detalhados
            <ArrowRight className="w-3 h-3 ml-2" />
          </Button>
        </NavLink>
      </CardContent>
    </Card>
  );
}
