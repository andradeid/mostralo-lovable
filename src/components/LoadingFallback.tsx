import { Loader2 } from 'lucide-react';

interface LoadingFallbackProps {
  message?: string;
  className?: string;
}

export function LoadingFallback({ 
  message = 'Carregando...', 
  className = '' 
}: LoadingFallbackProps) {
  return (
    <div className={`min-h-[400px] flex flex-col items-center justify-center p-8 ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
