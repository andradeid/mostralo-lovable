import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Gauge, Move, Timer, Zap, Info } from 'lucide-react';
import { WebVitals } from '@/hooks/usePerformanceDiagnostics';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WebVitalsCardProps {
  vitals: WebVitals | null;
  isLoading?: boolean;
}

interface VitalTip {
  good: string;
  needsImprovement: string;
  poor: string;
}

const vitalTips: Record<string, VitalTip> = {
  lcp: {
    good: 'LCP excelente! O conteúdo principal carrega rapidamente.',
    needsImprovement: 'LCP pode melhorar. Otimize imagens hero, use lazy loading e preconnect para fontes.',
    poor: 'LCP crítico! Comprima imagens, use WebP, adicione preload para recursos críticos.',
  },
  fid: {
    good: 'FID excelente! A página responde rapidamente às interações.',
    needsImprovement: 'FID pode melhorar. Reduza JavaScript pesado, use code-splitting.',
    poor: 'FID crítico! Quebre tarefas longas, use web workers para processamento pesado.',
  },
  cls: {
    good: 'CLS excelente! Layout estável sem mudanças inesperadas.',
    needsImprovement: 'CLS pode melhorar. Defina dimensões para imagens e elementos dinâmicos.',
    poor: 'CLS crítico! Reserve espaço para ads/embeds, use aspect-ratio em imagens.',
  },
  fcp: {
    good: 'FCP excelente! Primeira pintura rápida.',
    needsImprovement: 'FCP pode melhorar. Otimize CSS crítico, reduza recursos blocking.',
    poor: 'FCP crítico! Inline CSS crítico, defer scripts não essenciais, use preload.',
  },
};

interface VitalItemProps {
  icon: typeof Activity;
  label: string;
  value: number | null;
  unit: string;
  thresholds: { good: number; needsImprovement: number };
  description: string;
  tipKey: keyof typeof vitalTips;
}

function VitalItem({ icon: Icon, label, value, unit, thresholds, description, tipKey }: VitalItemProps) {
  const getStatus = () => {
    if (value === null) return 'unknown';
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.needsImprovement) return 'needsImprovement';
    return 'poor';
  };
  
  const status = getStatus();
  
  const statusColors = {
    good: 'text-green-500 bg-green-500/10',
    needsImprovement: 'text-yellow-500 bg-yellow-500/10',
    poor: 'text-red-500 bg-red-500/10',
    unknown: 'text-muted-foreground bg-muted',
  };
  
  const statusLabels = {
    good: 'Bom',
    needsImprovement: 'Melhorar',
    poor: 'Ruim',
    unknown: 'N/A',
  };
  
  const tips = vitalTips[tipKey];
  const currentTip = status === 'unknown' 
    ? 'Métrica não disponível. Navegue pela página para coletar dados.' 
    : tips[status as keyof VitalTip];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-help transition-colors hover:bg-muted/70">
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
              <Info className="h-3.5 w-3.5 text-muted-foreground/50" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[300px]">
          <p className="text-xs">{currentTip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function WebVitalsCard({ vitals, isLoading }: WebVitalsCardProps) {
  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Core Web Vitals
          <span className="text-xs font-normal text-muted-foreground ml-1">
            (passe o mouse para dicas)
          </span>
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
              tipKey="lcp"
            />
            <VitalItem
              icon={Zap}
              label="FID"
              value={vitals.fid}
              unit="ms"
              thresholds={{ good: 100, needsImprovement: 300 }}
              description="First Input Delay"
              tipKey="fid"
            />
            <VitalItem
              icon={Move}
              label="CLS"
              value={vitals.cls !== null ? vitals.cls * 1000 : null}
              unit=""
              thresholds={{ good: 100, needsImprovement: 250 }}
              description="Cumulative Layout Shift (×1000)"
              tipKey="cls"
            />
            <VitalItem
              icon={Timer}
              label="FCP"
              value={vitals.fcp}
              unit="ms"
              thresholds={{ good: 1800, needsImprovement: 3000 }}
              description="First Contentful Paint"
              tipKey="fcp"
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
