import { useEffect, useState } from 'react';
import { Brain, Calculator, FileText, Mic, Phone, Check, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcessingStep {
  id: string;
  label: string;
  icon: React.ElementType;
  duration: number;
}

const PROCESSING_STEPS: ProcessingStep[] = [
  { id: 'analyze', label: 'Analisando suas respostas...', icon: Brain, duration: 1000 },
  { id: 'score', label: 'Calculando sua pontuação...', icon: Calculator, duration: 800 },
  { id: 'script', label: 'Gerando script personalizado...', icon: FileText, duration: 1200 },
  { id: 'voice', label: 'Preparando voz da Sofia...', icon: Mic, duration: 1000 },
  { id: 'call', label: 'Iniciando chamada...', icon: Phone, duration: 600 },
];

interface DiagnosticProcessingScreenProps {
  onComplete: () => void;
  duration?: number;
}

export function DiagnosticProcessingScreen({ 
  onComplete, 
  duration = 4600 
}: DiagnosticProcessingScreenProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    let totalElapsed = 0;
    const timers: NodeJS.Timeout[] = [];
    
    // Agenda a conclusão de cada etapa
    PROCESSING_STEPS.forEach((step, index) => {
      const timer = setTimeout(() => {
        setCurrentStepIndex(index + 1);
        setCompletedSteps(prev => new Set([...prev, step.id]));
      }, totalElapsed + step.duration);
      
      timers.push(timer);
      totalElapsed += step.duration;
    });
    
    // Callback final
    const finalTimer = setTimeout(() => {
      onComplete();
    }, totalElapsed + 300);
    timers.push(finalTimer);
    
    return () => timers.forEach(t => clearTimeout(t));
  }, [onComplete]);

  const totalDuration = PROCESSING_STEPS.reduce((sum, s) => sum + s.duration, 0);
  const elapsedDuration = PROCESSING_STEPS.slice(0, currentStepIndex).reduce((sum, s) => sum + s.duration, 0);
  const progress = (elapsedDuration / totalDuration) * 100;

  return (
    <div className="w-full max-w-lg mx-auto text-center py-8 animate-fade-in">
      {/* Ícone central animado */}
      <div className="relative inline-flex items-center justify-center mb-8">
        <div className="absolute w-28 h-28 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute w-20 h-20 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '1.5s' }} />
        
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg shadow-primary/30">
          {currentStepIndex < PROCESSING_STEPS.length ? (
            (() => {
              const CurrentIcon = PROCESSING_STEPS[currentStepIndex]?.icon || Brain;
              return <CurrentIcon className="w-8 h-8 text-white animate-pulse" />;
            })()
          ) : (
            <Check className="w-8 h-8 text-white animate-scale-in" />
          )}
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
        Processando seu diagnóstico...
      </h2>
      
      <p className="text-muted-foreground text-sm mb-8">
        Identificando oportunidades para seu negócio
      </p>

      {/* Lista de etapas */}
      <div className="space-y-3 mb-8 text-left max-w-sm mx-auto">
        {PROCESSING_STEPS.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = index === currentStepIndex && !isCompleted;
          const isPending = index > currentStepIndex;
          const StepIcon = step.icon;

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                isCompleted && "bg-emerald-500/10",
                isCurrent && "bg-primary/10",
                isPending && "opacity-50"
              )}
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300",
                isCompleted && "bg-emerald-500/20",
                isCurrent && "bg-primary/20",
                isPending && "bg-muted"
              )}>
                {isCompleted ? (
                  <Check className="w-4 h-4 text-emerald-500 animate-scale-in" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                ) : (
                  <StepIcon className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              
              <span className={cn(
                "text-sm font-medium transition-colors duration-300",
                isCompleted && "text-emerald-600 dark:text-emerald-400",
                isCurrent && "text-foreground animate-pulse",
                isPending && "text-muted-foreground"
              )}>
                {step.label}
              </span>
              
              {isCompleted && (
                <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-scale-in" />
              )}
            </div>
          );
        })}
      </div>

      {/* Barra de progresso */}
      <div className="w-full max-w-xs mx-auto">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-primary mt-6">
        <Sparkles className="w-4 h-4 animate-pulse" />
        <span className="text-xs font-medium">Aguarde um momento</span>
        <Sparkles className="w-4 h-4 animate-pulse" />
      </div>
    </div>
  );
}
