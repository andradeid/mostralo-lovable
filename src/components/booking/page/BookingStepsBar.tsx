// Barra de passos (Serviço → Profissional → Data/Hora → Confirmar). Passos já feitos são clicáveis.
import { Calendar as CalendarIcon, Check, Scissors, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Step } from '@/lib/bookingPage/types';

interface Props {
  visibleSteps: Step[];
  currentStep: Step;
  goToStep: (step: Step) => void;
}

export function BookingStepsBar({ visibleSteps, currentStep, goToStep }: Props) {
  const stepLabels: Record<Step, string> = {
    service: 'Serviço',
    professional: 'Profissional',
    datetime: 'Data/Hora',
    confirm: 'Confirmar'
  };

  const stepIcons: Record<Step, React.ReactNode> = {
    service: <Scissors className="w-3.5 h-3.5" />,
    professional: <User className="w-3.5 h-3.5" />,
    datetime: <CalendarIcon className="w-3.5 h-3.5" />,
    confirm: <Check className="w-3.5 h-3.5" />,
  };

  return (
    <div className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          {visibleSteps.map((step, index) => {
            const isActive = currentStep === step;
            const isPast = visibleSteps.indexOf(currentStep) > index;

            return (
              <div key={step} className="flex items-center">
                {index > 0 && (
                  <div className={cn(
                    "w-6 sm:w-10 h-0.5 mx-0.5 sm:mx-1 rounded-full transition-colors duration-300",
                    isPast ? "bg-primary" : "bg-border"
                  )} />
                )}
                <button
                  onClick={() => isPast && goToStep(step)}
                  disabled={!isPast}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300",
                    isActive && "bg-primary text-primary-foreground shadow-md shadow-primary/25",
                    isPast && "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20",
                    !isActive && !isPast && "bg-muted text-muted-foreground"
                  )}
                >
                  {isPast ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    stepIcons[step]
                  )}
                  <span className="hidden sm:inline">{stepLabels[step]}</span>
                  <span className="sm:hidden">{index + 1}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
