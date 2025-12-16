import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, AlertCircle, XCircle, Loader2, Circle,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface OperationStep {
  step: string;
  status: 'pending' | 'running' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
  timestamp?: string;
}

interface OperationProgressCardProps {
  title?: string;
  steps: OperationStep[];
  isRunning?: boolean;
  className?: string;
}

const statusConfig = {
  pending: {
    icon: Circle,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    label: 'Pendente',
  },
  running: {
    icon: Loader2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    label: 'Executando',
  },
  success: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    label: 'Sucesso',
  },
  warning: {
    icon: AlertCircle,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    label: 'Aviso',
  },
  error: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    label: 'Erro',
  },
};

export function OperationProgressCard({ 
  title = 'Progresso da Operação',
  steps, 
  isRunning = false,
  className 
}: OperationProgressCardProps) {
  if (steps.length === 0) return null;

  const hasError = steps.some(s => s.status === 'error');
  const hasWarning = steps.some(s => s.status === 'warning');
  const allSuccess = steps.every(s => s.status === 'success');

  return (
    <Card className={cn('border-2', className, {
      'border-green-500/50': allSuccess && !isRunning,
      'border-yellow-500/50': hasWarning && !hasError && !isRunning,
      'border-red-500/50': hasError && !isRunning,
      'border-blue-500/50': isRunning,
    })}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {title}
          </div>
          {isRunning ? (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Em execução
            </Badge>
          ) : allSuccess ? (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Concluído
            </Badge>
          ) : hasError ? (
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
              <XCircle className="h-3 w-3 mr-1" />
              Erro
            </Badge>
          ) : hasWarning ? (
            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
              <AlertCircle className="h-3 w-3 mr-1" />
              Atenção
            </Badge>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] pr-4">
          <div className="space-y-2">
            {steps.map((step, index) => {
              const config = statusConfig[step.status];
              const Icon = config.icon;
              
              return (
                <div 
                  key={`${step.step}-${index}`}
                  className={cn(
                    'flex items-start gap-3 p-2 rounded-lg transition-colors',
                    config.bgColor
                  )}
                >
                  <Icon 
                    className={cn(
                      'h-5 w-5 mt-0.5 shrink-0',
                      config.color,
                      step.status === 'running' && 'animate-spin'
                    )} 
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', config.color)}>
                      {step.message}
                    </p>
                    {step.details && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {step.details}
                      </p>
                    )}
                  </div>
                  {step.timestamp && (
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {step.timestamp}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default OperationProgressCard;
