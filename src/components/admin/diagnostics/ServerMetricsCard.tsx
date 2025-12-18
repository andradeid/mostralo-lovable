import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server, Wifi, Lock, Clock, Info } from 'lucide-react';
import { ServerMetrics } from '@/hooks/usePerformanceDiagnostics';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ServerMetricsCardProps {
  metrics: ServerMetrics | null;
  isLoading?: boolean;
}

interface MetricTip {
  good: string;
  warning: string;
  bad: string;
}

const metricTips: Record<string, MetricTip> = {
  ttfb: {
    good: 'TTFB excelente! O servidor está respondendo rapidamente.',
    warning: 'TTFB aceitável. Considere cache no edge para melhorar.',
    bad: 'TTFB alto. Configure cache agressivo, CDN (Cloudflare) ou aproxime o servidor.',
  },
  dns: {
    good: 'DNS lookup rápido. Boa configuração!',
    warning: 'DNS pode melhorar. Adicione dns-prefetch no HTML.',
    bad: 'DNS lento. Use DNS rápido (Cloudflare 1.1.1.1) e adicione dns-prefetch.',
  },
  ssl: {
    good: 'SSL handshake rápido. TLS otimizado!',
    warning: 'SSL pode ser otimizado. Verifique se TLS 1.3 está ativo.',
    bad: 'SSL lento. Ative TLS 1.3, HTTP/2 e session resumption.',
  },
  connection: {
    good: 'Conexão estabelecida rapidamente!',
    warning: 'Conexão aceitável. CDN pode ajudar.',
    bad: 'Conexão lenta. Use CDN ou servidor mais próximo dos usuários.',
  },
};

function MetricItem({ 
  icon: Icon, 
  label, 
  value, 
  unit = 'ms',
  thresholds,
  tipKey
}: { 
  icon: typeof Server;
  label: string; 
  value: number; 
  unit?: string;
  thresholds: { good: number; bad: number };
  tipKey: keyof typeof metricTips;
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
  
  const tips = metricTips[tipKey];
  const currentTip = status === 'error' ? 'Erro ao medir. Tente novamente.' : tips[status as keyof MetricTip];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center justify-between p-3 rounded-lg ${statusBg[status]} cursor-help transition-colors hover:opacity-80`}>
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-mono text-sm font-medium ${statusColors[status]}`}>
                {value < 0 ? 'N/A' : `${value}${unit}`}
              </span>
              <Info className="h-3.5 w-3.5 text-muted-foreground/50" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-[280px]">
          <p className="text-xs">{currentTip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
              tipKey="ttfb"
            />
            <MetricItem 
              icon={Wifi}
              label="DNS Lookup" 
              value={metrics.dnsLookup} 
              thresholds={{ good: 50, bad: 150 }}
              tipKey="dns"
            />
            <MetricItem 
              icon={Lock}
              label="SSL Handshake" 
              value={metrics.sslHandshake} 
              thresholds={{ good: 100, bad: 300 }}
              tipKey="ssl"
            />
            <MetricItem 
              icon={Server}
              label="Conexão Total" 
              value={metrics.connectionTime} 
              thresholds={{ good: 200, bad: 500 }}
              tipKey="connection"
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
