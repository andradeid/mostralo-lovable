import { useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';

interface DiagnosticProcessingScreenProps {
  onComplete: () => void;
  duration?: number;
}

export function DiagnosticProcessingScreen({ 
  onComplete, 
  duration = 3000 
}: DiagnosticProcessingScreenProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  return (
    <div className="w-full max-w-lg mx-auto text-center py-16 animate-fade-in">
      <div className="relative inline-flex items-center justify-center mb-8">
        {/* Círculos pulsantes de fundo */}
        <div className="absolute w-32 h-32 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute w-24 h-24 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '1.5s' }} />
        
        {/* Ícone central */}
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-lg shadow-primary/30">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      </div>

      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
        Processando seu diagnóstico...
      </h2>
      
      <p className="text-muted-foreground text-lg mb-6">
        Analisando suas respostas e identificando oportunidades
      </p>

      <div className="flex items-center justify-center gap-2 text-primary">
        <Sparkles className="w-5 h-5 animate-pulse" />
        <span className="text-sm font-medium">Aguarde um momento</span>
        <Sparkles className="w-5 h-5 animate-pulse" />
      </div>

      {/* Barra de progresso animada */}
      <div className="mt-8 w-full max-w-xs mx-auto h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full animate-progress-bar"
          style={{ 
            animation: `progress-bar ${duration}ms ease-out forwards`
          }}
        />
      </div>
    </div>
  );
}
