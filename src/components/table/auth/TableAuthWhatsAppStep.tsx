import { Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';
import { TableAuthAnimatedStep } from './TableAuthAnimatedStep';

interface TableAuthWhatsAppStepProps {
  status: 'validating' | 'valid' | 'invalid';
  phone: string;
}

export function TableAuthWhatsAppStep({ status, phone }: TableAuthWhatsAppStepProps) {
  if (status === 'validating') {
    return (
      <div className="relative">
        <TableAuthAnimatedStep
          icon={Smartphone}
          title="Verificando WhatsApp..."
          subtitle="Quase lá!"
          status="loading"
          iconClassName="animate-bounce"
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-24 h-24 rounded-full border-2 border-amber-500/20 animate-ping" style={{ animationDuration: '1.2s' }} />
        </div>
      </div>
    );
  }

  if (status === 'valid') {
    return (
      <TableAuthAnimatedStep
        icon={CheckCircle2}
        title="WhatsApp verificado!"
        subtitle={phone}
        status="success"
      />
    );
  }

  return (
    <TableAuthAnimatedStep
      icon={AlertCircle}
      title="WhatsApp não encontrado"
      subtitle="Mas você pode continuar normalmente"
      status="info"
    />
  );
}
