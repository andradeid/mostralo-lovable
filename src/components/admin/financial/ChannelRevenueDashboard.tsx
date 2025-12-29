import { useRevenueByChannel } from '@/hooks/useRevenueByChannel';
import { ChannelRevenueCards } from './ChannelRevenueCards';
import { ChannelComparisonChart } from './ChannelComparisonChart';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface ChannelRevenueDashboardProps {
  storeId: string | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function ChannelRevenueDashboard({ storeId }: ChannelRevenueDashboardProps) {
  const { data, isLoading } = useRevenueByChannel(storeId);

  const channels = data?.channels || [];
  const monthlyData = data?.monthlyByChannel || [];
  const totalRevenue = data?.totalRevenue || 0;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header com total geral */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receita Total por Canal</p>
              <p className="text-2xl md:text-3xl font-bold text-primary">
                {isLoading ? '...' : formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards por canal */}
      <ChannelRevenueCards channels={channels} isLoading={isLoading} />

      {/* Gráficos comparativos */}
      <ChannelComparisonChart 
        channels={channels} 
        monthlyData={monthlyData}
        isLoading={isLoading} 
      />
    </div>
  );
}
