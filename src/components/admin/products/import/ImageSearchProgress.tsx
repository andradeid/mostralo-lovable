import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Search, XCircle, SkipForward, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface ImageSearchProgressProps {
  progress: {
    current: number;
    total: number;
    currentBatch: number;
    totalBatches: number;
    currentProduct: string;
    successCount: number;
    failCount: number;
  };
  onCancel: () => void;
  onSkip: () => void;
}

export function ImageSearchProgress({ progress, onCancel, onSkip }: ImageSearchProgressProps) {
  const percentage = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  const estimatedTimeRemaining = () => {
    if (progress.current === 0) return 'Calculando...';
    
    // Estimativa: ~1 segundo por produto
    const remaining = progress.total - progress.current;
    const seconds = remaining;
    
    if (seconds < 60) {
      return `~${seconds} segundos`;
    }
    
    const minutes = Math.ceil(seconds / 60);
    return `~${minutes} minuto${minutes > 1 ? 's' : ''}`;
  };

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Search className="h-5 w-5 text-primary animate-pulse" />
          Buscando e salvando imagens...
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Lote atual:</span>
            <span className="font-medium ml-2">
              {progress.currentBatch} de {progress.totalBatches}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Tempo restante:</span>
            <span className="font-medium ml-2">{estimatedTimeRemaining()}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso: {progress.current} de {progress.total} produtos</span>
            <span className="font-medium">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-3" />
        </div>

        {/* Current Product */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
          <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          <span className="text-sm truncate">{progress.currentProduct || 'Preparando...'}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>{progress.successCount} encontradas</span>
          </div>
          <div className="flex items-center gap-1 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <span>{progress.failCount} não encontradas</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            variant="secondary" 
            onClick={onSkip}
            className="flex-1"
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Pular e Importar
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Produtos sem imagem serão importados normalmente, podendo adicionar a imagem depois.
        </p>
      </CardContent>
    </Card>
  );
}
