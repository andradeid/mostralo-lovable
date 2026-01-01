import { cn } from '@/lib/utils';
import { Check, Phone, Camera, User, FileText, Mic, Loader2 } from 'lucide-react';

export type StepStatus = 'pending' | 'loading' | 'success' | 'warning' | 'error';

export interface CallStep {
  id: string;
  label: string;
  icon: 'phone' | 'camera' | 'user' | 'file' | 'mic';
  status: StepStatus;
  message?: string;
}

interface CallStepCardProps {
  step: CallStep;
  isExiting?: boolean;
}

const ICON_MAP = {
  phone: Phone,
  camera: Camera,
  user: User,
  file: FileText,
  mic: Mic,
};

export function CallStepCard({ step, isExiting }: CallStepCardProps) {
  const Icon = ICON_MAP[step.icon];
  const isCompleted = step.status === 'success' || step.status === 'warning';

  return (
    <div
      className={cn(
        "relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20",
        "flex flex-col items-center gap-4 min-w-[280px]",
        isExiting ? "animate-card-exit" : "animate-card-enter"
      )}
    >
      {/* Ícone principal */}
      <div
        className={cn(
          "relative w-20 h-20 rounded-full flex items-center justify-center",
          "transition-all duration-500",
          isCompleted 
            ? "bg-[#25D366]" 
            : "bg-white/10"
        )}
      >
        {isCompleted ? (
          <Check className="w-10 h-10 text-white animate-check-bounce" />
        ) : step.status === 'loading' ? (
          <div className="relative">
            <Icon className="w-10 h-10 text-white/60" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-16 h-16 text-[#25D366] animate-spin" />
            </div>
          </div>
        ) : (
          <Icon className="w-10 h-10 text-white/40" />
        )}
      </div>

      {/* Label e mensagem */}
      <div className="text-center">
        <p className={cn(
          "text-lg font-medium transition-colors duration-300",
          isCompleted ? "text-[#25D366]" : "text-white"
        )}>
          {isCompleted ? (step.message || 'Concluído!') : step.label}
        </p>
      </div>

      <style>{`
        @keyframes card-enter {
          0% { 
            opacity: 0; 
            transform: translateY(30px) scale(0.9); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        
        @keyframes card-exit {
          0% { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
          100% { 
            opacity: 0; 
            transform: translateY(-30px) scale(0.9); 
          }
        }
        
        @keyframes check-bounce {
          0% { transform: scale(0); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        
        .animate-card-enter {
          animation: card-enter 0.4s ease-out forwards;
        }
        
        .animate-card-exit {
          animation: card-exit 0.3s ease-out forwards;
        }
        
        .animate-check-bounce {
          animation: check-bounce 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
