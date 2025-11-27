import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, TrendingUp, DollarSign, Building2 } from 'lucide-react';

interface ProjectedRewardsProps {
  targetStoresPerMonth: number;
  avgPlanPrice: number;
  currentActiveStores: number;
}

export const ProjectedRewards = ({ 
  targetStoresPerMonth, 
  avgPlanPrice,
  currentActiveStores 
}: ProjectedRewardsProps) => {
  const months = [3, 6, 12];
  
  const calculateProjection = (monthsAhead: number) => {
    const newStores = targetStoresPerMonth * monthsAhead;
    const totalStores = currentActiveStores + newStores;
    const monthlyRevenue = totalStores * avgPlanPrice;
    const annualRevenue = monthlyRevenue * 12;
    const valuation = annualRevenue * 3; // Múltiplo conservador de 3x ARR
    
    return {
      newStores,
      totalStores,
      monthlyRevenue,
      annualRevenue,
      valuation
    };
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-blue-500/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          O Que Você Vai Conquistar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-6">
          Se você mantiver essa meta, aqui está o que vai alcançar:
        </p>
        
        <div className="space-y-6">
          {months.map((monthsAhead) => {
            const projection = calculateProjection(monthsAhead);
            
            return (
              <div key={monthsAhead} className="p-4 rounded-lg bg-background border-2 border-primary/20">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  Em {monthsAhead} {monthsAhead === 1 ? 'mês' : 'meses'}
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <Building2 className="h-3 w-3" />
                      Lojas Ativas
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {projection.totalStores}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      +{projection.newStores} novas
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <DollarSign className="h-3 w-3" />
                      MRR
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {(projection.monthlyRevenue / 1000).toFixed(1)}k
                    </p>
                    <p className="text-xs text-muted-foreground">
                      por mês
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <TrendingUp className="h-3 w-3" />
                      ARR
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      R$ {(projection.annualRevenue / 1000).toFixed(1)}k
                    </p>
                    <p className="text-xs text-muted-foreground">
                      por ano
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                      <Trophy className="h-3 w-3" />
                      Valuation
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      R$ {(projection.valuation / 1000).toFixed(1)}k
                    </p>
                    <p className="text-xs text-muted-foreground">
                      estimado
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
            💡 <strong>Lembre-se:</strong> Cada loja que você conquista te aproxima desses números. 
            Consistência é a chave para transformar metas em realidade!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
