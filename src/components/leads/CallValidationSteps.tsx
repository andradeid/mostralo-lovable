import { Phone, Camera, User, FileText, Mic, Check, X, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CallStepStatus = 'pending' | 'loading' | 'success' | 'error' | 'warning';

export interface CallStep {
  id: string;
  label: string;
  status: CallStepStatus;
  result?: string;
}

interface CallValidationStepsProps {
  steps: CallStep[];
  className?: string;
}

const STEP_ICONS: Record<string, React.ElementType> = {
  validate: Phone,
  photo: Camera,
  name: User,
  script: FileText,
  voice: Mic,
};

export function CallValidationSteps({ steps, className }: CallValidationStepsProps) {
  const getStatusIcon = (status: CallStepStatus, stepId: string) => {
    const IconComponent = STEP_ICONS[stepId] || Phone;
    
    switch (status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-[#25D366]" />;
      case 'success':
        return <Check className="w-4 h-4 text-[#25D366]" />;
      case 'error':
        return <X className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <IconComponent className="w-4 h-4 text-white/30" />;
    }
  };

  const getStatusClasses = (status: CallStepStatus) => {
    switch (status) {
      case 'loading':
        return 'border-[#25D366]/50 bg-[#25D366]/10';
      case 'success':
        return 'border-[#25D366]/70 bg-[#25D366]/15';
      case 'error':
        return 'border-red-500/50 bg-red-500/10';
      case 'warning':
        return 'border-amber-500/50 bg-amber-500/10';
      default:
        return 'border-white/10 bg-white/5';
    }
  };

  const getTextClasses = (status: CallStepStatus) => {
    switch (status) {
      case 'loading':
        return 'text-white animate-pulse';
      case 'success':
        return 'text-[#25D366]';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-amber-400';
      default:
        return 'text-white/40';
    }
  };

  return (
    <div className={cn("space-y-2 w-full max-w-sm mx-auto", className)}>
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-500",
            getStatusClasses(step.status),
            step.status !== 'pending' && 'animate-fade-in'
          )}
          style={{
            animationDelay: `${index * 100}ms`
          }}
        >
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500",
            step.status === 'loading' && 'bg-[#25D366]/20',
            step.status === 'success' && 'bg-[#25D366]/25',
            step.status === 'error' && 'bg-red-500/20',
            step.status === 'warning' && 'bg-amber-500/20',
            step.status === 'pending' && 'bg-white/5'
          )}>
            {getStatusIcon(step.status, step.id)}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm font-medium transition-colors duration-500",
              getTextClasses(step.status)
            )}>
              {step.label}
            </p>
            {step.result && step.status !== 'loading' && (
              <p className={cn(
                "text-xs mt-0.5 truncate animate-fade-in",
                step.status === 'success' && 'text-[#25D366]/80',
                step.status === 'warning' && 'text-amber-400/80',
                step.status === 'error' && 'text-red-400/80'
              )}>
                {step.result}
              </p>
            )}
          </div>
          
          {step.status === 'success' && (
            <div className="w-2 h-2 rounded-full bg-[#25D366] animate-scale-in" />
          )}
        </div>
      ))}
    </div>
  );
}

export const INITIAL_CALL_STEPS: CallStep[] = [
  { id: 'validate', label: 'Validando número...', status: 'pending' },
  { id: 'photo', label: 'Buscando foto do perfil...', status: 'pending' },
  { id: 'name', label: 'Buscando nome do contato...', status: 'pending' },
  { id: 'script', label: 'Gerando script personalizado...', status: 'pending' },
  { id: 'voice', label: 'Preparando voz da Sofia...', status: 'pending' },
];
