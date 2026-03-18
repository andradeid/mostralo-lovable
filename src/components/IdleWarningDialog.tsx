import { useState, useEffect, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle } from 'lucide-react';

/**
 * Modal de aviso de inatividade.
 * Escuta o evento global 'idleWarning' disparado pelo useIdleTimeout.
 * Ao clicar "Continuar", reseta o timer (qualquer interação reseta).
 */
export function IdleWarningDialog() {
  const [open, setOpen] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 min em segundos

  useEffect(() => {
    const handleWarning = () => {
      setOpen(true);
      setCountdown(300);
    };

    window.addEventListener('idleWarning', handleWarning);
    return () => window.removeEventListener('idleWarning', handleWarning);
  }, []);

  // Countdown visual
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  const handleContinue = useCallback(() => {
    setOpen(false);
    // Qualquer clique já reseta o timer do useIdleTimeout via eventos de mouse/teclado
  }, []);

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <AlertDialogTitle className="text-lg">
              Sessão prestes a expirar
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm leading-relaxed">
            Você está inativo há quase 4 horas. Para economizar recursos, sua sessão será 
            encerrada automaticamente em{' '}
            <span className="font-bold text-foreground">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
            .
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={handleContinue} className="w-full sm:w-auto">
            <Clock className="h-4 w-4 mr-2" />
            Continuar conectado
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
