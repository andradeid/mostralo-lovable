// Botões "Voltar" e "Confirmar" abaixo dos passos.
import { Button } from '@/components/ui/button';
import { Check, ChevronLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Step } from '@/lib/bookingPage/types';

interface Props {
  currentStep: Step;
  prevStep: () => void;
  handleSubmit: () => void;
  canProceed: boolean;
  submitting: boolean;
  showConfirmationAnimation: boolean;
}

export function BookingStepNavigation({
  currentStep,
  prevStep,
  handleSubmit,
  canProceed,
  submitting,
  showConfirmationAnimation,
}: Props) {
  return (
    <div className="flex justify-between mt-6 gap-3">
      <Button
        variant="outline"
        onClick={prevStep}
        disabled={currentStep === 'service'}
        className={cn(
          "rounded-xl h-12 px-5 border-foreground/25 text-foreground bg-transparent hover:bg-foreground/10",
          currentStep === 'service' && "invisible"
        )}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Voltar
      </Button>

      {currentStep === 'confirm' && (
        <Button
          onClick={handleSubmit}
          disabled={!canProceed || submitting || showConfirmationAnimation}
          className="rounded-xl h-12 px-5 flex-1 max-w-xs font-semibold shadow-lg shadow-primary/20"
        >
          {showConfirmationAnimation ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Finalizando...
            </>
          ) : submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Confirmando...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-1" />
              Confirmar
            </>
          )}
        </Button>
      )}
    </div>
  );
}
