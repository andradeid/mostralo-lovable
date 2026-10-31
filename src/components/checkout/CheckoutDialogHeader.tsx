import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface CheckoutDialogStep {
  id: string;
  title: string;
  label: string;
}

interface Props {
  steps: CheckoutDialogStep[];
  currentStep: number;
  primaryColor: string;
  onBack: () => void;
}

/** Título da etapa, botão voltar e barra de progresso do checkout da loja. */
export function CheckoutDialogHeader({ steps, currentStep, primaryColor, onBack }: Props) {
  return (
    <div className="p-6 border-b">
      <div className="flex items-center justify-between mb-4">
        {currentStep > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}
        <h2 className="text-lg font-semibold flex-1 text-center">{steps[currentStep].title}</h2>
        <div className="w-8" />
      </div>

      <div className="flex items-center gap-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={cn('h-1 w-full rounded-full transition-colors', index <= currentStep ? '' : 'bg-muted')}
              style={{ backgroundColor: index <= currentStep ? primaryColor : undefined }}
            />
            <span
              className={cn('text-xs transition-colors hidden sm:block', index <= currentStep ? 'font-medium' : 'text-muted-foreground')}
              style={{ color: index <= currentStep ? primaryColor : undefined }}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
