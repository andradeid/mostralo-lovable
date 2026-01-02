import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, Smartphone, Tablet } from 'lucide-react';

interface DeviceData {
  device: string;
  views: number;
  clicks: number;
  conversionRate: number;
}

interface DeviceBreakdownProps {
  data: DeviceData[];
}

const deviceIcons = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet
};

const deviceLabels = {
  desktop: 'Desktop',
  mobile: 'Mobile',
  tablet: 'Tablet'
};

export const DeviceBreakdown = ({ data }: DeviceBreakdownProps) => {
  const maxRate = Math.max(...data.map(d => d.conversionRate), 1);

  return (
    <Card>
      <CardHeader className="pb-2 md:pb-4">
        <CardTitle className="text-sm md:text-base">Por Dispositivo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4">
        {data.length === 0 ? (
          <p className="text-xs md:text-sm text-muted-foreground text-center py-4">Sem dados</p>
        ) : (
          data.map((item) => {
            const Icon = deviceIcons[item.device as keyof typeof deviceIcons] || Monitor;
            const label = deviceLabels[item.device as keyof typeof deviceLabels] || item.device;
            const barWidth = (item.conversionRate / maxRate) * 100;

            return (
              <div key={item.device} className="space-y-1">
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground" />
                    <span className="font-medium">{label}</span>
                  </div>
                  <span className="font-semibold">{item.conversionRate.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 md:h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] md:text-xs text-muted-foreground">
                  <span>{item.views.toLocaleString('pt-BR')} views</span>
                  <span>{item.clicks.toLocaleString('pt-BR')} cliques</span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
