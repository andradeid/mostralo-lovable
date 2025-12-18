import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, CheckCircle, AlertCircle, XCircle, Database } from 'lucide-react';
import { EdgeFunctionResult } from '@/hooks/usePerformanceDiagnostics';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EdgeFunctionTableProps {
  functions: EdgeFunctionResult[] | null;
  databaseLatency: number;
  isLoading?: boolean;
}

export function EdgeFunctionTable({ functions, databaseLatency, isLoading }: EdgeFunctionTableProps) {
  const getStatusIcon = (status: 'ok' | 'slow' | 'error') => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'slow':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };
  
  const getLatencyColor = (latency: number, status: 'ok' | 'slow' | 'error') => {
    if (status === 'error') return 'text-red-500';
    if (latency < 100) return 'text-green-500';
    if (latency < 300) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const avgLatency = functions && functions.length > 0
    ? Math.round(functions.reduce((sum, f) => sum + f.latency, 0) / functions.length)
    : 0;
  
  const getAvgStatus = () => {
    if (!functions || functions.length === 0) return { color: 'text-muted-foreground', bg: 'bg-muted' };
    if (avgLatency < 100) return { color: 'text-green-500', bg: 'bg-green-500/20' };
    if (avgLatency < 300) return { color: 'text-yellow-500', bg: 'bg-yellow-500/20' };
    return { color: 'text-red-500', bg: 'bg-red-500/20' };
  };
  
  const avgStatus = getAvgStatus();

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Edge Functions
          </CardTitle>
          <div className={`px-2 py-1 rounded text-xs font-medium ${avgStatus.bg} ${avgStatus.color}`}>
            {isLoading ? 'Testando...' : `${avgLatency}ms avg`}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-2">
              {/* Database latency first */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">database</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-sm ${
                    databaseLatency < 0 ? 'text-red-500' :
                    databaseLatency < 100 ? 'text-green-500' :
                    databaseLatency < 300 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {databaseLatency < 0 ? 'Error' : `${databaseLatency}ms`}
                  </span>
                  {databaseLatency < 0 ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : databaseLatency < 100 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : databaseLatency < 300 ? (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              
              {/* Edge functions */}
              {functions && functions.length > 0 ? (
                functions.map((func, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{func.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-sm ${getLatencyColor(func.latency, func.status)}`}>
                        {func.status === 'error' ? 'Error' : `${func.latency}ms`}
                      </span>
                      {getStatusIcon(func.status)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Execute o diagnóstico para testar as funções
                </p>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
