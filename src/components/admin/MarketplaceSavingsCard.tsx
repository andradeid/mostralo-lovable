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
  variant?: 'default' | 'compact' | 'inline';
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

  // Inline variant to match other KPI cards in the stats row
  if (variant === 'inline') {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Economia vs Marketplace</p>
            <p className="text-3xl font-bold text-emerald-600">
              {formatCurrency(totalRevenue === 0 ? 0 : animatedSavings)}
            </p>
          </div>
          <TrendingDown className="h-12 w-12 text-emerald-500 opacity-20" />
        </div>
      </Card>
    );
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

  // Default variant para Dashboard (VERSÃO COMPACTA E DISCRETA)
  return (
    <Card className={`border ${className}`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          <span className="flex items-center gap-2">
            💰 Economia vs Marketplace
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
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
      
      <CardContent className="space-y-3 pt-0 px-4 pb-4">
        {/* 4 KPIs em linha */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Card 1: Você Economizou */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Você Economizou</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(animatedSavings)}</p>
          </div>
          
          {/* Card 2: Receita Total */}
          <div className="bg-muted/50 border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Receita Total</p>
            <p className="text-lg font-bold">{formatCurrency(totalRevenue)}</p>
          </div>
          
          {/* Card 3: Ec. Mensal */}
          <div className="bg-muted/50 border rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Ec. Mensal</p>
            <p className="text-lg font-bold">{formatCurrency(monthlySavings)}</p>
          </div>
          
          {/* Card 4: iFood = 25% */}
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">iFood = 25%</p>
            <p className="text-lg font-bold text-red-500 dark:text-red-400">-{formatCurrency(totalSavings)}</p>
          </div>
        </div>
        
        {/* Sugestões + Botão inline */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-muted/30 rounded-lg px-3 py-2">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            🚀 <span className="font-medium">Invista essa economia:</span> cardápio, marketing, equipamentos
          </p>
          <NavLink to="/dashboard/reports">
            <Button variant="link" size="sm" className="text-emerald-600 dark:text-emerald-400 h-auto p-0 text-xs">
              Ver Relatórios <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </NavLink>
        </div>
      </CardContent>
    </Card>
  );
}
