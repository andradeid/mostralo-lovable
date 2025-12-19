import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, RefreshCw, Info, Server } from 'lucide-react';
import { usePerformanceDiagnostics, DiagnosticResult } from '@/hooks/usePerformanceDiagnostics';
import { ServerMetricsCard } from '@/components/admin/diagnostics/ServerMetricsCard';
import { BundleSizeCard } from '@/components/admin/diagnostics/BundleSizeCard';
import { EdgeFunctionTable } from '@/components/admin/diagnostics/EdgeFunctionTable';
import { WebVitalsCard } from '@/components/admin/diagnostics/WebVitalsCard';
import { PerformanceScoreCard } from '@/components/admin/diagnostics/PerformanceScoreCard';
import { DiagnosticHistory } from '@/components/admin/diagnostics/DiagnosticHistory';
import { DiagnosticInsights } from '@/components/admin/diagnostics/DiagnosticInsights';
import { VpsRecommendationsCard } from '@/components/admin/diagnostics/VpsRecommendationsCard';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DiagnosticsPage() {
  const { isRunning, progress, result, error, runDiagnostics, getHistory } = usePerformanceDiagnostics();
  const [history, setHistory] = useState<DiagnosticResult[]>([]);
  
  useEffect(() => {
    setHistory(getHistory());
  }, [getHistory, result]);
  
  const previousScore = history.length > 1 ? history[1]?.overallScore : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Server className="h-6 w-6" />
            Diagnóstico de Performance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analise o tempo de resposta do servidor, bundles e Edge Functions
          </p>
        </div>
        
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          size="lg"
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Executando...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Executar Diagnóstico
            </>
          )}
        </Button>
      </div>
      
      {/* Progress bar */}
      {isRunning && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{progress.step}</span>
            <span className="font-mono">{progress.progress}%</span>
          </div>
          <Progress value={progress.progress} className="h-2" />
        </div>
      )}
      
      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Info about first run */}
      {!result && !isRunning && history.length === 0 && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Execute o diagnóstico para analisar a performance do sistema. O teste leva aproximadamente 10 segundos.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Main Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Score Card */}
        <PerformanceScoreCard 
          score={result?.overallScore ?? null}
          previousScore={previousScore}
          isLoading={isRunning}
        />
        
        {/* Server Metrics */}
        <ServerMetricsCard 
          metrics={result?.server ?? null}
          isLoading={isRunning}
        />
        
        {/* Bundle Size */}
        <BundleSizeCard 
          bundles={result?.bundles ?? null}
          isLoading={isRunning}
        />
        
        {/* Edge Functions */}
        <EdgeFunctionTable 
          functions={result?.edgeFunctions ?? null}
          databaseLatency={result?.databaseLatency ?? -1}
          isLoading={isRunning}
        />
        
        {/* History */}
        <DiagnosticHistory history={history} />
      </div>
      
      {/* Insights - Full width */}
      <DiagnosticInsights 
        result={result}
        isLoading={isRunning}
      />
      
      {/* Web Vitals - Full width */}
      <WebVitalsCard 
        vitals={result?.webVitals ?? null}
        isLoading={isRunning}
      />
      
      {/* VPS Recommendations - Full width */}
      <VpsRecommendationsCard 
        currentMetrics={result}
        isLoading={isRunning}
      />
      
      {/* Server Info */}
      {result?.serverInfo && result.serverInfo.region !== 'unknown' && (
        <div className="text-xs text-muted-foreground text-center">
          Servidor: {result.serverInfo.region} | Runtime: {result.serverInfo.runtime}
        </div>
      )}
    </div>
  );
}
