import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PerformanceScoreCardProps {
  score: number | null;
  previousScore?: number | null;
  isLoading?: boolean;
}

export function PerformanceScoreCard({ score, previousScore, isLoading }: PerformanceScoreCardProps) {
  const getScoreColor = (s: number) => {
    if (s >= 90) return 'text-green-500';
    if (s >= 70) return 'text-yellow-500';
    if (s >= 50) return 'text-orange-500';
    return 'text-red-500';
  };
  
  const getScoreBg = (s: number) => {
    if (s >= 90) return 'from-green-500/20 to-green-500/5';
    if (s >= 70) return 'from-yellow-500/20 to-yellow-500/5';
    if (s >= 50) return 'from-orange-500/20 to-orange-500/5';
    return 'from-red-500/20 to-red-500/5';
  };
  
  const getScoreLabel = (s: number) => {
    if (s >= 90) return 'Excelente';
    if (s >= 70) return 'Bom';
    if (s >= 50) return 'Precisa Melhorar';
    return 'Crítico';
  };
  
  const getScoreRing = (s: number) => {
    if (s >= 90) return 'ring-green-500/30';
    if (s >= 70) return 'ring-yellow-500/30';
    if (s >= 50) return 'ring-orange-500/30';
    return 'ring-red-500/30';
  };
  
  const getScoreDescription = (s: number) => {
    if (s >= 90) return 'Sua aplicação está com performance excepcional! Continue monitorando para manter esse nível.';
    if (s >= 70) return 'Performance boa, mas há espaço para melhorias. Verifique os insights abaixo.';
    if (s >= 50) return 'Performance abaixo do ideal. Corrija os pontos críticos identificados nos insights.';
    return 'Performance crítica! Priorize as correções dos problemas identificados urgentemente.';
  };
  
  const diff = score !== null && previousScore !== null ? score - previousScore : null;

  return (
    <Card className={`bg-gradient-to-br ${score !== null ? getScoreBg(score) : 'from-muted to-muted/50'}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm text-muted-foreground font-medium">Performance Score</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-[250px]">
                    <p className="text-xs">
                      Pontuação calculada com base em: tempo de resposta do servidor, 
                      latência do banco, Web Vitals e performance das Edge Functions.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {score !== null && (
              <>
                <p className={`text-sm font-medium ${getScoreColor(score)}`}>
                  {getScoreLabel(score)}
                </p>
                <p className="text-xs text-muted-foreground max-w-[180px]">
                  {getScoreDescription(score)}
                </p>
              </>
            )}
          </div>
          
          {isLoading ? (
            <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
          ) : score !== null ? (
            <div className={`relative w-20 h-20 rounded-full ring-4 ${getScoreRing(score)} flex items-center justify-center bg-background`}>
              <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
                {score}
              </span>
              
              {diff !== null && diff !== 0 && (
                <div className={`absolute -bottom-1 -right-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium ${
                  diff > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                }`}>
                  {diff > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {Math.abs(diff)}
                </div>
              )}
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full ring-4 ring-muted flex items-center justify-center bg-background">
              <Minus className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
