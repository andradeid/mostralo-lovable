import { useEffect, useState } from 'react';
import { Loader2, Sparkles, Award, Search, TrendingUp, Target, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiagnosticLoadingScreenProps {
  questionId: string;
  duration: number;
  onComplete: () => void;
}

const LOADING_CONTENT: Record<string, { 
  icon: React.ElementType;
  primary: string; 
  secondary: string;
  color: string;
}> = {
  q1: {
    icon: Search,
    primary: 'Analisando sua presença digital...',
    secondary: 'Verificando posicionamento no mercado',
    color: 'text-blue-500'
  },
  q2: {
    icon: TrendingUp,
    primary: 'Avaliando seu funil de vendas...',
    secondary: 'Calculando potencial de conversão',
    color: 'text-green-500'
  },
  q3: {
    icon: Target,
    primary: 'Mapeando oportunidades de crescimento...',
    secondary: 'Identificando pontos de melhoria',
    color: 'text-purple-500'
  },
  q4: {
    icon: Award,
    primary: 'Gerando seu certificado personalizado...',
    secondary: 'Preparando diagnóstico exclusivo',
    color: 'text-primary'
  }
};

export function DiagnosticLoadingScreen({ questionId, duration, onComplete }: DiagnosticLoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [showSparkles, setShowSparkles] = useState(false);
  
  const content = LOADING_CONTENT[questionId] || LOADING_CONTENT.q1;
  const IconComponent = content.icon;
  const isFinalQuestion = questionId === 'q4';
  
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
      
      // Mostrar sparkles na última tela quando progresso > 70%
      if (isFinalQuestion && newProgress > 70) {
        setShowSparkles(true);
      }
      
      if (newProgress >= 100) {
        clearInterval(interval);
        setTimeout(onComplete, 200);
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [duration, onComplete, isFinalQuestion]);

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      <div className={cn(
        "relative p-8 md:p-12 rounded-2xl border-2 border-border bg-card",
        "flex flex-col items-center justify-center text-center",
        "min-h-[300px] overflow-hidden"
      )}>
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
        
        {/* Sparkles animados (apenas na última tela) */}
        {isFinalQuestion && showSparkles && (
          <>
            <Sparkles className="absolute top-6 left-8 w-5 h-5 text-yellow-500 animate-pulse" />
            <Sparkles className="absolute top-10 right-12 w-4 h-4 text-yellow-400 animate-pulse delay-100" />
            <Sparkles className="absolute bottom-16 left-12 w-4 h-4 text-yellow-500 animate-pulse delay-200" />
            <Sparkles className="absolute bottom-10 right-8 w-5 h-5 text-yellow-400 animate-pulse delay-300" />
          </>
        )}
        
        {/* Ícone principal com animação */}
        <div className="relative mb-6">
          {/* Ring animado de fundo */}
          <div className={cn(
            "absolute inset-0 rounded-full border-4 border-primary/20",
            "animate-ping-slow"
          )} style={{ width: '80px', height: '80px', left: '-8px', top: '-8px' }} />
          
          {/* Container do ícone */}
          <div className={cn(
            "relative w-16 h-16 rounded-full flex items-center justify-center",
            "bg-primary/10 border-2 border-primary/30",
            "animate-pulse-gentle"
          )}>
            {isFinalQuestion ? (
              <IconComponent className={cn("w-8 h-8", content.color)} />
            ) : (
              <Loader2 className={cn("w-8 h-8 animate-spin", content.color)} />
            )}
          </div>
        </div>
        
        {/* Textos */}
        <div className="relative z-10 mb-8">
          <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2 animate-fade-in-up">
            {content.primary}
          </h3>
          <p className="text-muted-foreground text-sm md:text-base animate-fade-in-up delay-100">
            {content.secondary}
          </p>
        </div>
        
        {/* Barra de progresso */}
        <div className="relative z-10 w-full max-w-md">
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-100 ease-out",
                isFinalQuestion 
                  ? "bg-gradient-to-r from-primary via-primary to-green-500" 
                  : "bg-primary"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>Processando</span>
            <span className="font-medium text-foreground">{Math.round(progress)}%</span>
          </div>
        </div>
        
        {/* Ícone extra na última tela quando completo */}
        {isFinalQuestion && progress > 90 && (
          <div className="absolute bottom-4 right-4 animate-scale-in">
            <FileCheck className="w-6 h-6 text-green-500" />
          </div>
        )}
      </div>
    </div>
  );
}
