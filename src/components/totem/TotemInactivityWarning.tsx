import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

interface TotemInactivityWarningProps {
  secondsRemaining: number;
  onContinue: () => void;
  onCancel: () => void;
}

export function TotemInactivityWarning({
  secondsRemaining,
  onContinue,
  onCancel,
}: TotemInactivityWarningProps) {
  const [countdown, setCountdown] = useState(secondsRemaining);

  useEffect(() => {
    if (countdown <= 0) {
      onCancel();
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-8">
      <div className="bg-background rounded-2xl p-8 max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-6">
          <Clock className="h-10 w-10 text-orange-500" />
        </div>

        <h2 className="text-2xl font-bold mb-2">Você ainda está aí?</h2>
        <p className="text-muted-foreground mb-6">
          Por inatividade, seu pedido será cancelado em
        </p>

        <div className="text-5xl font-bold text-orange-500 mb-8">
          {countdown}s
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={onContinue}
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
