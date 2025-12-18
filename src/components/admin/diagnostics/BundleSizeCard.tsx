import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, FileCode } from 'lucide-react';
import { BundleInfo } from '@/hooks/usePerformanceDiagnostics';
import { Progress } from '@/components/ui/progress';

interface BundleSizeCardProps {
  bundles: BundleInfo[] | null;
  isLoading?: boolean;
}

export function BundleSizeCard({ bundles, isLoading }: BundleSizeCardProps) {
  const totalSize = bundles?.reduce((sum, b) => sum + b.size, 0) || 0;
  
  const getStatus = () => {
    if (!bundles || bundles.length === 0) return { status: 'N/A', color: 'text-muted-foreground', bg: 'bg-muted' };
    if (totalSize <= 500) return { status: 'ok', color: 'text-green-500', bg: 'bg-green-500/20' };
    if (totalSize <= 1000) return { status: 'warning', color: 'text-yellow-500', bg: 'bg-yellow-500/20' };
    return { status: 'heavy', color: 'text-red-500', bg: 'bg-red-500/20' };
  };
  
  const overall = getStatus();
  
  const getStatusColor = (status: 'ok' | 'warning' | 'error') => {
    switch (status) {
      case 'ok': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4" />
            Bundles
          </CardTitle>
          <div className={`px-2 py-1 rounded text-xs font-medium ${overall.bg} ${overall.color}`}>
            {isLoading ? 'Analisando...' : `${totalSize}KB`}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-1">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-2 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : bundles && bundles.length > 0 ? (
          <div className="space-y-3">
            {bundles.slice(0, 6).map((bundle, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <FileCode className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground truncate max-w-[120px]">
                      {bundle.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-muted-foreground">
                      {bundle.loadTime}ms
                    </span>
                    <span className={`font-mono font-medium ${
                      bundle.status === 'ok' ? 'text-green-500' :
                      bundle.status === 'warning' ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {bundle.size}KB
                    </span>
                  </div>
                </div>
                <Progress 
                  value={Math.min((bundle.size / 300) * 100, 100)} 
                  className={`h-1.5 [&>div]:${getStatusColor(bundle.status)}`}
                />
              </div>
            ))}
            {bundles.length > 6 && (
              <p className="text-xs text-muted-foreground text-center">
                +{bundles.length - 6} bundles
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Execute o diagnóstico para analisar os bundles
          </p>
        )}
      </CardContent>
    </Card>
  );
}
