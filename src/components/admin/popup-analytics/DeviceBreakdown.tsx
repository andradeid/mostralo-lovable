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
      <CardHeader>
        <CardTitle className="text-base">Conversão por Dispositivo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>
        ) : (
          data.map((item) => {
            const Icon = deviceIcons[item.device as keyof typeof deviceIcons] || Monitor;
            const label = deviceLabels[item.device as keyof typeof deviceLabels] || item.device;
            const barWidth = (item.conversionRate / maxRate) * 100;

            return (
              <div key={item.device} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{label}</span>
                  </div>
                  <span className="font-semibold">{item.conversionRate.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
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
