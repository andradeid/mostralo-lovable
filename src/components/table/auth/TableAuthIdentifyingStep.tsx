import { Search, Loader2 } from 'lucide-react';
import { TableAuthAnimatedStep } from './TableAuthAnimatedStep';

interface TableAuthIdentifyingStepProps {
  phone: string;
}

export function TableAuthIdentifyingStep({ phone }: TableAuthIdentifyingStepProps) {
  return (
    <div className="relative">
      <TableAuthAnimatedStep
        icon={Search}
        title="Identificando cliente..."
        subtitle={`Verificando ${phone}`}
        status="loading"
        iconClassName="animate-[pulse_1.5s_ease-in-out_infinite]"
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-24 h-24 rounded-full border-2 border-amber-500/30 animate-ping" style={{ animationDuration: '1.5s' }} />
      </div>
    </div>
  );
}
