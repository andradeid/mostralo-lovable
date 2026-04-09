import { Building2, DollarSign, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const months = [
    { value: 3, label: '3 meses', emoji: '🎯' },
    { value: 6, label: '6 meses', emoji: '🚀' },
    { value: 12, label: '12 meses', emoji: '👑' },
  ];
  
  const calculateProjection = (monthsAhead: number) => {
    const newStores = targetStoresPerMonth * monthsAhead;
    const totalStores = currentActiveStores + newStores;
    const monthlyRevenue = totalStores * avgPlanPrice;
    const annualRevenue = monthlyRevenue * 12;
    
    return { newStores, totalStores, monthlyRevenue, annualRevenue };
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Projeções de Conquista</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {months.map(({ value, label, emoji }, index) => {
          const p = calculateProjection(value);
          
          return (
            <div
              key={value}
              className={cn(
                "rounded-xl border bg-card p-4 space-y-3 transition-all hover:border-primary/30",
                index === 2 && "border-primary/20 bg-primary/[0.02]"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Em {label}
                </span>
                <span className="text-lg">{emoji}</span>
              </div>

              {/* Lojas */}
              <div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                  <Building2 className="h-2.5 w-2.5" /> Lojas Ativas
                </div>
                <p className="text-2xl font-black text-blue-500">{p.totalStores}</p>
                <p className="text-[10px] text-muted-foreground">+{p.newStores} novas</p>
              </div>

              {/* MRR */}
              <div className="pt-2 border-t">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                  <DollarSign className="h-2.5 w-2.5" /> MRR
                </div>
                <p className="text-xl font-bold text-green-500">
                  R$ {(p.monthlyRevenue / 1000).toFixed(1)}k
                </p>
              </div>

              {/* ARR */}
              <div className="pt-2 border-t">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                  <TrendingUp className="h-2.5 w-2.5" /> ARR
                </div>
                <p className="text-lg font-bold text-orange-500">
                  R$ {(p.annualRevenue / 1000).toFixed(0)}k
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
