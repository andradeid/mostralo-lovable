import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, Wifi, Lock, Clock } from 'lucide-react';
import { ServerMetrics } from '@/hooks/usePerformanceDiagnostics';

interface ServerMetricsCardProps {
  metrics: ServerMetrics | null;
  isLoading?: boolean;
}

function MetricItem({ 
  icon: Icon, 
  label, 
  value, 
  unit = 'ms',
  thresholds 
}: { 
  icon: typeof Server;
  label: string; 
  value: number; 
  unit?: string;
  thresholds: { good: number; bad: number };
}) {
  const getStatus = () => {
    if (value < 0) return 'error';
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.bad) return 'warning';
    return 'bad';
  };
  
  const status = getStatus();
  const statusColors = {
    good: 'text-green-500',
    warning: 'text-yellow-500',
    bad: 'text-red-500',
    error: 'text-muted-foreground',
  };
  
  const statusBg = {
    good: 'bg-green-500/10',
    warning: 'bg-yellow-500/10',
    bad: 'bg-red-500/10',
    error: 'bg-muted/50',
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${statusBg[status]}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className={`font-mono text-sm font-medium ${statusColors[status]}`}>
        {value < 0 ? 'N/A' : `${value}${unit}`}
      </span>
    </div>
  );
}

export function ServerMetricsCard({ metrics, isLoading }: ServerMetricsCardProps) {
  const getOverallStatus = () => {
    if (!metrics || metrics.responseTime < 0) return { status: 'error', color: 'text-muted-foreground', bg: 'bg-muted' };
    if (metrics.responseTime <= 300) return { status: 'ok', color: 'text-green-500', bg: 'bg-green-500/20' };
    if (metrics.responseTime <= 600) return { status: 'warning', color: 'text-yellow-500', bg: 'bg-yellow-500/20' };
    return { status: 'slow', color: 'text-red-500', bg: 'bg-red-500/20' };
  };
  
  const overall = getOverallStatus();

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-4 w-4" />
            Servidor
          </CardTitle>
          <div className={`px-2 py-1 rounded text-xs font-medium ${overall.bg} ${overall.color}`}>
            {isLoading ? 'Testando...' : metrics ? `${metrics.responseTime}ms` : 'N/A'}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : metrics ? (
          <>
            <MetricItem 
              icon={Clock}
              label="Time to First Byte" 
              value={metrics.ttfb} 
              thresholds={{ good: 200, bad: 600 }}
            />
            <MetricItem 
              icon={Wifi}
              label="DNS Lookup" 
              value={metrics.dnsLookup} 
              thresholds={{ good: 50, bad: 150 }}
            />
            <MetricItem 
              icon={Lock}
              label="SSL Handshake" 
              value={metrics.sslHandshake} 
              thresholds={{ good: 100, bad: 300 }}
            />
            <MetricItem 
              icon={Server}
              label="Conexão Total" 
              value={metrics.connectionTime} 
              thresholds={{ good: 200, bad: 500 }}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Execute o diagnóstico para ver as métricas
          </p>
        )}
      </CardContent>
    </Card>
  );
}
