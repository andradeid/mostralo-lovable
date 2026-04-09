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
      <div className="flex items-center gap-1.5 px-0.5">
        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold">Projeções</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {months.map(({ value, label, emoji }, index) => {
          const p = calculateProjection(value);
          
          return (
            <div
              key={value}
              className={cn(
                "rounded-xl border bg-card p-3 transition-all hover:border-primary/30",
                index === 2 && "border-primary/20"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {label}
                </span>
                <span className="text-sm">{emoji}</span>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-2xl font-black text-blue-500 leading-none">{p.totalStores}</p>
                  <p className="text-[10px] text-muted-foreground">lojas (+{p.newStores})</p>
                </div>

                <div className="flex gap-3 pt-1.5 border-t">
                  <div>
                    <p className="text-[9px] text-muted-foreground">MRR</p>
                    <p className="text-sm font-bold text-green-500">
                      R$ {(p.monthlyRevenue / 1000).toFixed(1)}k
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground">ARR</p>
                    <p className="text-sm font-bold text-orange-500">
                      R$ {(p.annualRevenue / 1000).toFixed(0)}k
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
