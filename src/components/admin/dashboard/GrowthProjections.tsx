import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

      let totalMRR = 0;
      let totalPrices = 0;
      let countPlans = 0;

      activeStores.forEach(store => {
        const plan = (store as any).plans;
        if (plan) {
          const price = Number(plan.price);
          const cycle = plan.billing_cycle;
          
          let monthlyPrice = price;
          if (cycle === 'quarterly') monthlyPrice = price / 3;
          else if (cycle === 'biannual') monthlyPrice = price / 6;
          else if (cycle === 'annual') monthlyPrice = price / 12;

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
      name: 'Meta Baixa',
      description: 'Crescimento conservador',
      newStoresPerMonth: 2,
      color: 'bg-blue-100 text-blue-800',
      icon: Target
    },
    {
      name: 'Meta Média',
      description: 'Crescimento realista',
      newStoresPerMonth: 5,
      color: 'bg-green-100 text-green-800',
      icon: TrendingUp,
      recommended: true
    },
    {
      name: 'Meta Alta',
      description: 'Crescimento agressivo',
      newStoresPerMonth: 10,
      color: 'bg-purple-100 text-purple-800',
      icon: TrendingUp
    }
  ];

  const valuationMultipliers = [
    { name: 'Conservador', multiplier: 3 },
    { name: 'Médio', multiplier: 5 },
    { name: 'Agressivo', multiplier: 8 }
  ];

  if (loading) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Projeções de Crescimento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Projeções de Crescimento (12 meses)
          </CardTitle>
          <CardDescription>
            Cenários baseados no ticket médio de R$ {data.avgPlanPrice.toFixed(2)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {scenarios.map((scenario) => {
            const { projectedMRR, projectedARR, avgMonthlyFee, totalStores } = calculateProjection(scenario.newStoresPerMonth);
            const totalNewStores = scenario.newStoresPerMonth * 12;
            
            return (
              <div key={scenario.name} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <scenario.icon className="w-4 h-4" />
                    <h4 className="font-semibold">{scenario.name}</h4>
                    {scenario.recommended && (
                      <Badge variant="default" className="text-xs">Recomendado</Badge>
                    )}
                  </div>
                  <Badge className={scenario.color}>
                    +{scenario.newStoresPerMonth} lojas/mês
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{scenario.description}</p>
                <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">MRR em 12 meses</p>
                    <p className="text-lg font-bold text-green-600">
                      R$ {projectedMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ARR em 12 meses</p>
                    <p className="text-lg font-bold text-blue-600">
                      R$ {projectedARR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mensalidade Média</p>
                    <p className="text-lg font-bold text-orange-600">
                      R$ {avgMonthlyFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Total: {totalStores} lojas ativas
                  ({data.currentActiveStores} atuais + {totalNewStores} novas)
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Valuation Simplificado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Valuation Simplificado (SaaS)
          </CardTitle>
          <CardDescription>
            Baseado em múltiplos de ARR
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Valuation Atual */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-semibold mb-3 flex items-center">
              💰 Valuation Atual
              <Badge variant="outline" className="ml-2">
                ARR: R$ {(data.currentMRR * 12).toFixed(2)}
              </Badge>
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {valuationMultipliers.map((val) => (
                <div key={val.name} className="text-center">
                  <p className="text-xs text-muted-foreground">{val.name}</p>
                  <p className="text-sm font-bold">
                    R$ {((data.currentMRR * 12) * val.multiplier).toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">{val.multiplier}x ARR</p>
                </div>
              ))}
            </div>
          </div>

          {/* Valuation Projetado (Meta Média) */}
          {scenarios.map((scenario) => {
            if (!scenario.recommended) return null;
            
            const { projectedARR } = calculateProjection(scenario.newStoresPerMonth);
            
            return (
              <div key={scenario.name} className="border rounded-lg p-4 bg-primary/5">
                <h4 className="font-semibold mb-3 flex items-center">
                  📈 Valuation Projetado ({scenario.name})
                  <Badge variant="default" className="ml-2">
                    ARR: R$ {projectedARR.toFixed(2)}
                  </Badge>
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {valuationMultipliers.map((val) => (
                    <div key={val.name} className="text-center">
                      <p className="text-xs text-muted-foreground">{val.name}</p>
                      <p className="text-sm font-bold text-primary">
                        R$ {(projectedARR * val.multiplier).toFixed(0)}
                      </p>
                      <p className="text-xs text-muted-foreground">{val.multiplier}x ARR</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                  Crescimento de valuation em 12 meses:
                  <span className="text-green-600 font-semibold ml-1">
                    +{(((projectedARR / (data.currentMRR * 12)) - 1) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            );
          })}

          {/* Nota sobre Valuation */}
          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <strong>Nota:</strong> Múltiplos de valuation variam conforme crescimento, churn, 
            margem e mercado. Esta é uma estimativa simplificada para planejamento interno.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
