import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ServerMetrics {
  ttfb: number;
  dnsLookup: number;
  sslHandshake: number;
  connectionTime: number;
  responseTime: number;
}

export interface BundleInfo {
  name: string;
  size: number;
  loadTime: number;
  status: 'ok' | 'warning' | 'error';
}

export interface EdgeFunctionResult {
  name: string;
  latency: number;
  status: 'ok' | 'slow' | 'error';
  statusCode: number;
  error?: string;
}

export interface WebVitals {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
}

export interface DiagnosticResult {
  server: ServerMetrics;
  bundles: BundleInfo[];
  edgeFunctions: EdgeFunctionResult[];
  webVitals: WebVitals;
  databaseLatency: number;
  timestamp: Date;
  overallScore: number;
  serverInfo: {
    region: string;
    runtime: string;
  };
}

export interface DiagnosticProgress {
  step: string;
  progress: number;
}

export function usePerformanceDiagnostics() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<DiagnosticProgress>({ step: '', progress: 0 });
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const measureServerMetrics = useCallback(async (): Promise<ServerMetrics> => {
    const startTime = performance.now();
    
    try {
      // Measure connection to the app itself
      const response = await fetch(window.location.origin, { 
        method: 'HEAD',
        cache: 'no-store' 
      });
      
      const endTime = performance.now();
      const totalTime = Math.round(endTime - startTime);
      
      // Use Performance API if available
      const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      const navEntry = entries[0];
      
      if (navEntry) {
        return {
          ttfb: Math.round(navEntry.responseStart - navEntry.requestStart),
          dnsLookup: Math.round(navEntry.domainLookupEnd - navEntry.domainLookupStart),
          sslHandshake: Math.round(navEntry.connectEnd - navEntry.secureConnectionStart),
          connectionTime: Math.round(navEntry.connectEnd - navEntry.connectStart),
          responseTime: totalTime,
        };
      }
      
      return {
        ttfb: Math.round(totalTime * 0.3),
        dnsLookup: Math.round(totalTime * 0.1),
        sslHandshake: Math.round(totalTime * 0.15),
        connectionTime: Math.round(totalTime * 0.25),
        responseTime: totalTime,
      };
    } catch {
      return {
        ttfb: -1,
        dnsLookup: -1,
        sslHandshake: -1,
        connectionTime: -1,
        responseTime: -1,
      };
    }
  }, []);

  const measureBundles = useCallback(async (): Promise<BundleInfo[]> => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const jsResources = resources.filter(r => 
      r.name.endsWith('.js') && 
      r.name.includes(window.location.origin)
    );
    
    const bundles: BundleInfo[] = [];
    
    const bundlePatterns = [
      { pattern: /react.*vendor/i, name: 'react-vendor' },
      { pattern: /ui.*vendor/i, name: 'ui-vendor' },
      { pattern: /map.*vendor/i, name: 'map-vendor' },
      { pattern: /chart.*vendor/i, name: 'chart-vendor' },
      { pattern: /index|main/i, name: 'main' },
    ];
    
    for (const resource of jsResources) {
      const matchedPattern = bundlePatterns.find(p => p.pattern.test(resource.name));
      const name = matchedPattern?.name || resource.name.split('/').pop()?.split('.')[0] || 'unknown';
      
      // Estimate size from transfer size or encoded body size
      const size = resource.transferSize || resource.encodedBodySize || 0;
      const loadTime = Math.round(resource.responseEnd - resource.startTime);
      
      let status: 'ok' | 'warning' | 'error' = 'ok';
      const sizeKB = size / 1024;
      
      if (sizeKB > 500) status = 'error';
      else if (sizeKB > 200) status = 'warning';
      
      bundles.push({
        name,
        size: Math.round(sizeKB),
        loadTime,
        status,
      });
    }
    
    // Sort by size descending
    return bundles.sort((a, b) => b.size - a.size).slice(0, 10);
  }, []);

  const measureWebVitals = useCallback((): WebVitals => {
    const vitals: WebVitals = {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null,
    };
    
    // Get paint entries
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');
    if (fcpEntry) {
      vitals.fcp = Math.round(fcpEntry.startTime);
    }
    
    // Get navigation timing for TTFB
    const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navEntries[0]) {
      vitals.ttfb = Math.round(navEntries[0].responseStart);
    }
    
    // LCP - use largest-contentful-paint entries if available
    try {
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      if (lcpEntries.length > 0) {
        const lastLcp = lcpEntries[lcpEntries.length - 1] as PerformanceEntry & { startTime: number };
        vitals.lcp = Math.round(lastLcp.startTime);
      }
    } catch {
      // LCP not available
    }
    
    // CLS - approximate from layout-shift entries
    try {
      const layoutShifts = performance.getEntriesByType('layout-shift') as (PerformanceEntry & { value: number; hadRecentInput: boolean })[];
      let cls = 0;
      for (const shift of layoutShifts) {
        if (!shift.hadRecentInput) {
          cls += shift.value;
        }
      }
      vitals.cls = Math.round(cls * 1000) / 1000;
    } catch {
      // CLS not available
    }
    
    return vitals;
  }, []);

  const calculateOverallScore = useCallback((
    server: ServerMetrics,
    edgeFunctions: EdgeFunctionResult[],
    webVitals: WebVitals,
    databaseLatency: number
  ): number => {
    let score = 100;
    
    // Server metrics (max -30 points)
    if (server.ttfb > 600) score -= 15;
    else if (server.ttfb > 200) score -= 5;
    
    if (server.responseTime > 800) score -= 15;
    else if (server.responseTime > 300) score -= 5;
    
    // Edge functions (max -30 points)
    const slowFunctions = edgeFunctions.filter(f => f.status === 'slow').length;
    const errorFunctions = edgeFunctions.filter(f => f.status === 'error').length;
    score -= slowFunctions * 5;
    score -= errorFunctions * 10;
    
    // Web Vitals (max -30 points)
    if (webVitals.lcp && webVitals.lcp > 4000) score -= 10;
    else if (webVitals.lcp && webVitals.lcp > 2500) score -= 5;
    
    if (webVitals.fcp && webVitals.fcp > 3000) score -= 10;
    else if (webVitals.fcp && webVitals.fcp > 1800) score -= 5;
    
    if (webVitals.cls && webVitals.cls > 0.25) score -= 10;
    else if (webVitals.cls && webVitals.cls > 0.1) score -= 5;
    
    // Database (max -10 points)
    if (databaseLatency > 500) score -= 10;
    else if (databaseLatency > 200) score -= 5;
    
    return Math.max(0, Math.min(100, score));
  }, []);

  const runDiagnostics = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    setProgress({ step: 'Iniciando diagnóstico...', progress: 0 });
    
    try {
      // Step 1: Measure server metrics
      setProgress({ step: 'Medindo métricas do servidor...', progress: 10 });
      const server = await measureServerMetrics();
      
      // Step 2: Measure bundles
      setProgress({ step: 'Analisando bundles...', progress: 25 });
      const bundles = await measureBundles();
      
      // Step 3: Test Edge Functions via our diagnostic function
      setProgress({ step: 'Testando Edge Functions...', progress: 40 });
      
      let edgeFunctions: EdgeFunctionResult[] = [];
      let databaseLatency = -1;
      let serverInfo = { region: 'local', runtime: 'browser' };
      
      try {
        const { data, error: fnError } = await supabase.functions.invoke('performance-diagnostics');
        
        if (fnError) throw fnError;
        
        if (data) {
          edgeFunctions = data.functionTests || [];
          databaseLatency = data.databaseLatency || -1;
          serverInfo = data.serverInfo || serverInfo;
        }
      } catch (err) {
        console.error('Error calling performance-diagnostics:', err);
      }
      
      // Step 4: Measure Web Vitals
      setProgress({ step: 'Coletando Web Vitals...', progress: 70 });
      const webVitals = measureWebVitals();
      
      // Step 5: Calculate overall score
      setProgress({ step: 'Calculando pontuação...', progress: 90 });
      const overallScore = calculateOverallScore(server, edgeFunctions, webVitals, databaseLatency);
      
      const diagnosticResult: DiagnosticResult = {
        server,
        bundles,
        edgeFunctions,
        webVitals,
        databaseLatency,
        timestamp: new Date(),
        overallScore,
        serverInfo,
      };
      
      setResult(diagnosticResult);
      setProgress({ step: 'Diagnóstico completo!', progress: 100 });
      
      // Save to localStorage for history
      const history = JSON.parse(localStorage.getItem('diagnosticHistory') || '[]');
      history.unshift({
        ...diagnosticResult,
        timestamp: diagnosticResult.timestamp.toISOString(),
      });
      localStorage.setItem('diagnosticHistory', JSON.stringify(history.slice(0, 10)));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao executar diagnóstico');
    } finally {
      setIsRunning(false);
    }
  }, [measureServerMetrics, measureBundles, measureWebVitals, calculateOverallScore]);

  const getHistory = useCallback((): DiagnosticResult[] => {
    const history = JSON.parse(localStorage.getItem('diagnosticHistory') || '[]');
    return history.map((item: DiagnosticResult & { timestamp: string }) => ({
      ...item,
      timestamp: new Date(item.timestamp),
    }));
  }, []);

  return {
    isRunning,
    progress,
    result,
    error,
    runDiagnostics,
    getHistory,
  };
}
