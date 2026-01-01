import { Phone, Camera, User, Check, X, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepStatus = 'pending' | 'loading' | 'success' | 'error' | 'warning';

export interface ValidationStep {
  id: string;
  label: string;
  status: StepStatus;
  result?: string;
}

interface WhatsAppValidationStepsProps {
  steps: ValidationStep[];
  className?: string;
}

const STEP_ICONS: Record<string, React.ElementType> = {
  validate: Phone,
  photo: Camera,
  name: User,
};

export function WhatsAppValidationSteps({ steps, className }: WhatsAppValidationStepsProps) {
  const getStatusIcon = (status: StepStatus, stepId: string) => {
    const IconComponent = STEP_ICONS[stepId] || Phone;
    
    switch (status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case 'success':
        return <Check className="w-4 h-4 text-emerald-500" />;
      case 'error':
        return <X className="w-4 h-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default:
        return <IconComponent className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusClasses = (status: StepStatus) => {
    switch (status) {
      case 'loading':
        return 'border-primary bg-primary/10';
      case 'success':
        return 'border-emerald-500 bg-emerald-500/10';
      case 'error':
        return 'border-destructive bg-destructive/10';
      case 'warning':
        return 'border-amber-500 bg-amber-500/10';
      default:
        return 'border-border bg-muted/30';
    }
  };

  const getTextClasses = (status: StepStatus) => {
    switch (status) {
      case 'loading':
        return 'text-foreground animate-pulse';
      case 'success':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'error':
        return 'text-destructive';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border transition-all duration-300",
            getStatusClasses(step.status),
            step.status !== 'pending' && 'animate-fade-in'
          )}
          style={{
            animationDelay: `${index * 100}ms`
          }}
        >
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300",
            step.status === 'loading' && 'bg-primary/20',
            step.status === 'success' && 'bg-emerald-500/20',
            step.status === 'error' && 'bg-destructive/20',
            step.status === 'warning' && 'bg-amber-500/20',
            step.status === 'pending' && 'bg-muted'
          )}>
            {getStatusIcon(step.status, step.id)}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm font-medium transition-colors duration-300",
              getTextClasses(step.status)
            )}>
              {step.label}
            </p>
            {step.result && step.status !== 'loading' && (
              <p className={cn(
                "text-xs mt-0.5 truncate animate-fade-in",
                step.status === 'success' && 'text-emerald-600/80 dark:text-emerald-400/80',
                step.status === 'warning' && 'text-amber-600/80 dark:text-amber-400/80',
                step.status === 'error' && 'text-destructive/80'
              )}>
                {step.result}
              </p>
            )}
          </div>
          
          {step.status === 'success' && (
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-scale-in" />
          )}
        </div>
      ))}
    </div>
  );
}

export const INITIAL_VALIDATION_STEPS: ValidationStep[] = [
  { id: 'validate', label: 'Validando número...', status: 'pending' },
];
