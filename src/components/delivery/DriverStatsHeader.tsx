import { Card } from '@/components/ui/card';
import { Bike, TrendingUp, CheckCircle2, Clock } from 'lucide-react';

interface DriverStatsHeaderProps {
  driverName: string;
  todayStats: {
    total: number;
    completed: number;
    totalEarned: number;
  };
}

export function DriverStatsHeader({ driverName, todayStats }: DriverStatsHeaderProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const firstName = driverName.split(' ')[0];

  return (
    <div className="mb-6">
      {/* Greeting */}
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-bold">
          Olá, {firstName} 👋
        </h1>
      </div>

      {/* Inline Stats */}
      <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Hoje</span>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {/* Total Entregas */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <Bike className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Entregas</span>
              </div>
              <span className="text-2xl font-bold">{todayStats.total}</span>
            </div>

            {/* Concluídas */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-xs text-muted-foreground">Concluídas</span>
              </div>
              <span className="text-2xl font-bold text-green-600">{todayStats.completed}</span>
            </div>

            {/* Total Ganho */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Ganhos</span>
              </div>
              <span className="text-lg md:text-2xl font-bold text-primary">
                {formatCurrency(todayStats.totalEarned)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
