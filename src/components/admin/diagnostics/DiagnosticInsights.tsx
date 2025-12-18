import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, AlertTriangle, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { DiagnosticResult } from '@/hooks/usePerformanceDiagnostics';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DiagnosticInsightsProps {
  result: DiagnosticResult | null;
  isLoading?: boolean;
}

interface Insight {
  severity: 'critical' | 'warning' | 'success';
  title: string;
  problem: string;
  solution: string;
}

function generateInsights(result: DiagnosticResult): Insight[] {
  const insights: Insight[] = [];
  
  // Server metrics
  if (result.server.ttfb > 600) {
    insights.push({
      severity: 'critical',
      title: 'TTFB muito alto',
      problem: `Servidor demora ${result.server.ttfb}ms para responder (ideal: < 200ms)`,
      solution: 'Configure cache agressivo, use CDN como Cloudflare, ou aproxime o servidor dos usuários'
    });
  } else if (result.server.ttfb > 200) {
    insights.push({
      severity: 'warning',
      title: 'TTFB pode melhorar',
      problem: `TTFB de ${result.server.ttfb}ms está acima do ideal (< 200ms)`,
      solution: 'Considere ativar cache no edge ou otimizar queries do backend'
    });
  }
  
  if (result.server.responseTime > 800) {
    insights.push({
      severity: 'critical',
      title: 'Resposta do servidor lenta',
      problem: `Tempo de resposta de ${result.server.responseTime}ms é muito alto`,
      solution: 'Verifique gargalos no servidor, otimize rotas e reduza payload'
    });
  }
  
  if (result.server.dnsLookup > 150) {
    insights.push({
      severity: 'warning',
      title: 'DNS lookup lento',
      problem: `DNS levou ${result.server.dnsLookup}ms (ideal: < 50ms)`,
      solution: 'Use DNS mais rápido como Cloudflare (1.1.1.1) ou adicione dns-prefetch'
    });
  }
  
  if (result.server.sslHandshake > 300) {
    insights.push({
      severity: 'warning',
      title: 'SSL handshake lento',
      problem: `Handshake levou ${result.server.sslHandshake}ms`,
      solution: 'Ative TLS 1.3 e HTTP/2, considere session resumption'
    });
  }
  
  // Database latency
  if (result.databaseLatency > 500) {
    insights.push({
      severity: 'critical',
      title: 'Banco de dados muito lento',
      problem: `Latência de ${result.databaseLatency}ms é crítica`,
      solution: 'Verifique se Supabase está na região correta, adicione índices nas queries'
    });
  } else if (result.databaseLatency > 200) {
    insights.push({
      severity: 'warning',
      title: 'Banco de dados pode ser otimizado',
      problem: `Latência de ${result.databaseLatency}ms (ideal: < 100ms)`,
      solution: 'Otimize queries, use select específicos em vez de *, considere cache'
    });
  }
  
  // Edge Functions
  const slowFuncs = result.edgeFunctions.filter(f => f.status === 'slow');
  const errorFuncs = result.edgeFunctions.filter(f => f.status === 'error');
  
  if (errorFuncs.length > 0) {
    insights.push({
      severity: 'critical',
      title: `${errorFuncs.length} Edge Function(s) com erro`,
      problem: `Funções: ${errorFuncs.map(f => f.name).join(', ')}`,
      solution: 'Verifique os logs das funções no Supabase Dashboard para identificar o erro'
    });
  }
  
  if (slowFuncs.length > 0) {
    insights.push({
      severity: 'warning',
      title: `${slowFuncs.length} Edge Function(s) lenta(s)`,
      problem: `Funções lentas: ${slowFuncs.map(f => `${f.name} (${f.latency}ms)`).join(', ')}`,
      solution: 'Otimize queries, reduza dependências, considere cache de resultados'
    });
  }
  
  // Web Vitals
  if (result.webVitals.lcp && result.webVitals.lcp > 4000) {
    insights.push({
      severity: 'critical',
      title: 'LCP muito alto',
      problem: `Maior elemento leva ${result.webVitals.lcp}ms para renderizar`,
      solution: 'Otimize imagens hero, use lazy loading, preload recursos críticos'
    });
  } else if (result.webVitals.lcp && result.webVitals.lcp > 2500) {
    insights.push({
      severity: 'warning',
      title: 'LCP precisa de atenção',
      problem: `LCP de ${result.webVitals.lcp}ms está acima do recomendado (< 2500ms)`,
      solution: 'Comprima imagens, use formatos modernos (WebP), implemente preconnect'
    });
  }
  
  if (result.webVitals.cls && result.webVitals.cls > 0.25) {
    insights.push({
      severity: 'critical',
      title: 'Muita instabilidade visual (CLS)',
      problem: `CLS de ${result.webVitals.cls.toFixed(3)} causa mudanças bruscas no layout`,
      solution: 'Defina dimensões fixas para imagens, reserve espaço para conteúdo dinâmico'
    });
  } else if (result.webVitals.cls && result.webVitals.cls > 0.1) {
    insights.push({
      severity: 'warning',
      title: 'Layout shifts detectados',
      problem: `CLS de ${result.webVitals.cls.toFixed(3)} pode incomodar usuários`,
      solution: 'Use aspect-ratio em imagens, evite inserir conteúdo acima de existente'
    });
  }
  
  if (result.webVitals.fcp && result.webVitals.fcp > 3000) {
    insights.push({
      severity: 'critical',
      title: 'Primeira pintura muito lenta',
      problem: `FCP de ${result.webVitals.fcp}ms deixa tela branca por muito tempo`,
      solution: 'Otimize CSS crítico, reduza recursos render-blocking, use preload'
    });
  }
  
  // Bundles
  const largeBundles = result.bundles.filter(b => b.size > 500);
  if (largeBundles.length > 0) {
    insights.push({
      severity: 'critical',
      title: 'Bundles muito grandes',
      problem: `${largeBundles.map(b => `${b.name}: ${b.size}KB`).join(', ')}`,
      solution: 'Use code-splitting, lazy load componentes pesados, tree-shake imports'
    });
  }
  
  const warningBundles = result.bundles.filter(b => b.size > 200 && b.size <= 500);
  if (warningBundles.length > 2) {
    insights.push({
      severity: 'warning',
      title: 'Múltiplos bundles grandes',
      problem: `${warningBundles.length} bundles acima de 200KB`,
      solution: 'Considere code-splitting adicional ou lazy loading de dependências'
    });
  }
  
  // Success messages if everything is good
  if (insights.length === 0) {
    insights.push({
      severity: 'success',
      title: 'Performance excelente!',
      problem: 'Todas as métricas estão dentro dos parâmetros ideais',
      solution: 'Continue monitorando regularmente para manter a qualidade'
    });
  } else if (insights.filter(i => i.severity === 'critical').length === 0) {
    insights.push({
      severity: 'success',
      title: 'Sem problemas críticos',
      problem: 'A aplicação está funcionando bem no geral',
      solution: 'Otimize os pontos de atenção para alcançar performance ideal'
    });
  }
  
  // Sort by severity (critical first)
  return insights.sort((a, b) => {
    const order = { critical: 0, warning: 1, success: 2 };
    return order[a.severity] - order[b.severity];
  });
}

function InsightItem({ insight }: { insight: Insight }) {
  const iconMap = {
    critical: <XCircle className="h-5 w-5 text-red-500 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0" />,
    success: <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />,
  };
  
  const bgMap = {
    critical: 'bg-red-500/10 border-red-500/20',
    warning: 'bg-yellow-500/10 border-yellow-500/20',
    success: 'bg-green-500/10 border-green-500/20',
  };
  
  const titleColorMap = {
    critical: 'text-red-500',
    warning: 'text-yellow-500',
    success: 'text-green-500',
  };

  return (
    <div className={`p-4 rounded-lg border ${bgMap[insight.severity]}`}>
      <div className="flex items-start gap-3">
        {iconMap[insight.severity]}
        <div className="space-y-1.5 min-w-0">
          <h4 className={`font-medium ${titleColorMap[insight.severity]}`}>
            {insight.title}
          </h4>
          <p className="text-sm text-muted-foreground">
            {insight.problem}
          </p>
          <div className="flex items-start gap-1.5 text-sm">
            <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span className="text-foreground">{insight.solution}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DiagnosticInsights({ result, isLoading }: DiagnosticInsightsProps) {
  const insights = result ? generateInsights(result) : [];
  
  const criticalCount = insights.filter(i => i.severity === 'critical').length;
  const warningCount = insights.filter(i => i.severity === 'warning').length;

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights de Performance
          </CardTitle>
          {result && (
            <div className="flex items-center gap-2 text-xs">
              {criticalCount > 0 && (
                <span className="px-2 py-1 rounded bg-red-500/20 text-red-500 font-medium">
                  {criticalCount} crítico{criticalCount > 1 ? 's' : ''}
                </span>
              )}
              {warningCount > 0 && (
                <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-500 font-medium">
                  {warningCount} atenção
                </span>
              )}
              {criticalCount === 0 && warningCount === 0 && (
                <span className="px-2 py-1 rounded bg-green-500/20 text-green-500 font-medium">
                  Tudo OK
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : result ? (
          <ScrollArea className="h-[320px] pr-4">
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <InsightItem key={index} insight={insight} />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Execute o diagnóstico para ver insights de performance
          </p>
        )}
      </CardContent>
    </Card>
  );
}
