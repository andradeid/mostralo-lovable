import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Target, DollarSign } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProjectionData {
  currentMRR: number;
  currentActiveStores: number;
  avgPlanPrice: number;
}

export function GrowthProjections() {
  const [data, setData] = useState<ProjectionData>({
    currentMRR: 0,
    currentActiveStores: 0,
    avgPlanPrice: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectionData();
  }, []);

  const fetchProjectionData = async () => {
    try {
      const { data: activeStores } = await supabase
        .from('stores')
        .select(`
          id,
          status,
          custom_monthly_price,
          plans:plan_id (
            price,
            billing_cycle
          )
        `)
        .eq('status', 'active');

      if (!activeStores) {
        setLoading(false);
        return;
      }

      // Buscar descontos de cupom por loja
      const { data: couponDiscounts } = await supabase
        .from('payment_approvals')
        .select('store_id, coupon_discount')
        .not('store_id', 'is', null)
        .gt('coupon_discount', 0);

      // Criar mapa de desconto por store_id
      const discountMap = new Map<string, number>();
      couponDiscounts?.forEach(pa => {
        if (pa.store_id) {
          const current = discountMap.get(pa.store_id) || 0;
          discountMap.set(pa.store_id, Math.max(current, Number(pa.coupon_discount || 0)));
        }
      });

      let totalMRR = 0;
      let totalPrices = 0;
      let countPlans = 0;

      activeStores.forEach(store => {
        const storeData = store as any;
        const plan = storeData.plans;
        if (plan) {
          const planPrice = Number(plan.price);
          const couponDiscount = discountMap.get(storeData.id) || 0;
          const cycle = plan.billing_cycle;
          
          // Prioridade: custom_monthly_price > (plan_price - coupon_discount) > plan_price
          const effectivePrice = storeData.custom_monthly_price 
            ? Number(storeData.custom_monthly_price)
            : Math.max(0, planPrice - couponDiscount);
          
          let monthlyPrice = effectivePrice;
          if (cycle === 'quarterly') monthlyPrice = effectivePrice / 3;
          else if (cycle === 'biannual') monthlyPrice = effectivePrice / 6;
          else if (cycle === 'annual') monthlyPrice = effectivePrice / 12;

          totalMRR += monthlyPrice;
          totalPrices += monthlyPrice;
          countPlans++;
        }
      });

      setData({
        currentMRR: totalMRR,
        currentActiveStores: activeStores.length,
        avgPlanPrice: countPlans > 0 ? totalPrices / countPlans : 297 // fallback para preço médio
      });
    } catch (error) {
      console.error('Erro ao buscar dados de projeção:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProjection = (newStoresPerMonth: number, months: number = 12) => {
    const totalNewStores = newStoresPerMonth * months;
    const totalStores = data.currentActiveStores + totalNewStores;
    const monthlyIncrease = newStoresPerMonth * data.avgPlanPrice;
    const projectedMRR = data.currentMRR + (monthlyIncrease * months);
    const projectedARR = projectedMRR * 12;
    const avgMonthlyFee = totalStores > 0 ? projectedMRR / totalStores : 0;
    return { projectedMRR, projectedARR, avgMonthlyFee, totalStores };
  };

  const scenarios = [
    {
      id: 'low',
      name: 'Baixa',
      description: 'Crescimento conservador',
      newStoresPerMonth: 2,
      color: 'bg-blue-100 text-blue-800',
      icon: Target
    },
    {
      id: 'medium',
      name: 'Média',
      description: 'Crescimento realista',
      newStoresPerMonth: 5,
      color: 'bg-green-100 text-green-800',
      icon: TrendingUp,
      recommended: true
    },
    {
      id: 'high',
      name: 'Alta',
      description: 'Crescimento agressivo',
      newStoresPerMonth: 10,
      color: 'bg-purple-100 text-purple-800',
      icon: TrendingUp
    }
  ];

  const valuationMultipliers = [
    { name: '3x', multiplier: 3 },
    { name: '5x', multiplier: 5 },
    { name: '8x', multiplier: 8 }
  ];

  if (loading) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
      {/* Projeções de Crescimento com Tabs */}
      <Card>
        <CardHeader className="pb-2 p-3 md:p-4">
          <CardTitle className="flex items-center text-sm md:text-base">
            <TrendingUp className="w-4 h-4 mr-2" />
            Projeções (12 meses)
          </CardTitle>
          <CardDescription className="text-xs">
            Ticket médio: R$ {data.avgPlanPrice.toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 md:p-4 pt-0">
          <Tabs defaultValue="medium" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-8 md:h-9">
              {scenarios.map((scenario) => (
                <TabsTrigger 
                  key={scenario.id} 
                  value={scenario.id}
                  className="text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {scenario.name}
                  {scenario.recommended && <span className="hidden sm:inline ml-1">✓</span>}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {scenarios.map((scenario) => {
              const { projectedMRR, projectedARR, avgMonthlyFee, totalStores } = calculateProjection(scenario.newStoresPerMonth);
              const totalNewStores = scenario.newStoresPerMonth * 12;
              
              return (
                <TabsContent key={scenario.id} value={scenario.id} className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{scenario.description}</p>
                    <Badge className={`${scenario.color} text-xs`}>
                      +{scenario.newStoresPerMonth}/mês
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 md:gap-3">
                    <div className="bg-muted/50 rounded-lg p-2 md:p-3 text-center">
                      <p className="text-[10px] md:text-xs text-muted-foreground">MRR</p>
                      <p className="text-sm md:text-lg font-bold text-green-600">
                        R$ {(projectedMRR / 1000).toFixed(1)}k
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 md:p-3 text-center">
                      <p className="text-[10px] md:text-xs text-muted-foreground">ARR</p>
                      <p className="text-sm md:text-lg font-bold text-blue-600">
                        R$ {(projectedARR / 1000).toFixed(1)}k
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 md:p-3 text-center">
                      <p className="text-[10px] md:text-xs text-muted-foreground">Ticket</p>
                      <p className="text-sm md:text-lg font-bold text-orange-600">
                        R$ {avgMonthlyFee.toFixed(0)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                    {totalStores} lojas ({data.currentActiveStores} + {totalNewStores} novas)
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Valuation Simplificado */}
      <Card>
        <CardHeader className="pb-2 p-3 md:p-4">
          <CardTitle className="flex items-center text-sm md:text-base">
            <DollarSign className="w-4 h-4 mr-2" />
            Valuation (SaaS)
          </CardTitle>
          <CardDescription className="text-xs">
            Múltiplos de ARR
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 md:p-4 pt-0 space-y-3">
          {/* Valuation Atual */}
          <div className="border rounded-lg p-3 bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-xs md:text-sm">💰 Atual</h4>
              <Badge variant="outline" className="text-[10px] md:text-xs">
                ARR: R$ {(data.currentMRR * 12).toFixed(0)}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {valuationMultipliers.map((val) => (
                <div key={val.name} className="text-center">
                  <p className="text-[10px] text-muted-foreground">{val.name}</p>
                  <p className="text-xs md:text-sm font-bold">
                    R$ {((data.currentMRR * 12) * val.multiplier / 1000).toFixed(1)}k
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Valuation Projetado (Meta Média) */}
          {scenarios.map((scenario) => {
            if (!scenario.recommended) return null;
            
            const { projectedARR } = calculateProjection(scenario.newStoresPerMonth);
            const growthPercent = data.currentMRR > 0 
              ? (((projectedARR / (data.currentMRR * 12)) - 1) * 100).toFixed(0) 
              : 0;
            
            return (
              <div key={scenario.id} className="border rounded-lg p-3 bg-primary/5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-xs md:text-sm">📈 Projetado</h4>
                  <Badge variant="default" className="text-[10px] md:text-xs">
                    +{growthPercent}%
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {valuationMultipliers.map((val) => (
                    <div key={val.name} className="text-center">
                      <p className="text-[10px] text-muted-foreground">{val.name}</p>
                      <p className="text-xs md:text-sm font-bold text-primary">
                        R$ {(projectedARR * val.multiplier / 1000).toFixed(1)}k
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Nota */}
          <p className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded">
            Estimativa simplificada baseada em múltiplos de ARR.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
