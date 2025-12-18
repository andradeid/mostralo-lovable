import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Gauge, Move, Timer, Zap } from 'lucide-react';
import { WebVitals } from '@/hooks/usePerformanceDiagnostics';

interface WebVitalsCardProps {
  vitals: WebVitals | null;
  isLoading?: boolean;
}

interface VitalItemProps {
  icon: typeof Activity;
  label: string;
  value: number | null;
  unit: string;
  thresholds: { good: number; needsImprovement: number };
  description: string;
}

function VitalItem({ icon: Icon, label, value, unit, thresholds, description }: VitalItemProps) {
  const getStatus = () => {
    if (value === null) return 'unknown';
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.needsImprovement) return 'needs-improvement';
    return 'poor';
  };
  
  const status = getStatus();
  
  const statusColors = {
    good: 'text-green-500 bg-green-500/10',
    'needs-improvement': 'text-yellow-500 bg-yellow-500/10',
    poor: 'text-red-500 bg-red-500/10',
    unknown: 'text-muted-foreground bg-muted',
  };
  
  const statusLabels = {
    good: 'Bom',
    'needs-improvement': 'Melhorar',
    poor: 'Ruim',
    unknown: 'N/A',
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div>
          <span className="text-sm font-medium">{label}</span>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-mono text-sm px-2 py-0.5 rounded ${statusColors[status]}`}>
          {value !== null ? `${value}${unit}` : 'N/A'}
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
      </div>
    </div>
  );
}

export function WebVitalsCard({ vitals, isLoading }: WebVitalsCardProps) {
  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Core Web Vitals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : vitals ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <VitalItem
              icon={Gauge}
              label="LCP"
              value={vitals.lcp}
              unit="ms"
              thresholds={{ good: 2500, needsImprovement: 4000 }}
              description="Largest Contentful Paint"
            />
            <VitalItem
              icon={Zap}
              label="FID"
              value={vitals.fid}
              unit="ms"
              thresholds={{ good: 100, needsImprovement: 300 }}
              description="First Input Delay"
            />
            <VitalItem
              icon={Move}
              label="CLS"
              value={vitals.cls !== null ? vitals.cls * 1000 : null}
              unit=""
              thresholds={{ good: 100, needsImprovement: 250 }}
              description="Cumulative Layout Shift (×1000)"
            />
            <VitalItem
              icon={Timer}
              label="FCP"
              value={vitals.fcp}
              unit="ms"
              thresholds={{ good: 1800, needsImprovement: 3000 }}
              description="First Contentful Paint"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Execute o diagnóstico para coletar Web Vitals
          </p>
        )}
      </CardContent>
    </Card>
  );
}
