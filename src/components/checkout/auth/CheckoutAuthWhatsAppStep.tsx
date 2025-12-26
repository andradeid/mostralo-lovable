import { Smartphone, CheckCircle2, AlertCircle } from 'lucide-react';
import { CheckoutAuthAnimatedStep } from './CheckoutAuthAnimatedStep';

interface CheckoutAuthWhatsAppStepProps {
  status: 'validating' | 'valid' | 'invalid';
  phone?: string;
}

export function CheckoutAuthWhatsAppStep({ status, phone }: CheckoutAuthWhatsAppStepProps) {
  if (status === 'validating') {
    return (
      <CheckoutAuthAnimatedStep
        icon={Smartphone}
        title="Verificando WhatsApp..."
        subtitle="Quase lá"
        status="loading"
      />
    );
  }

  if (status === 'valid') {
    return (
      <CheckoutAuthAnimatedStep
        icon={CheckCircle2}
        title="WhatsApp verificado!"
        subtitle={phone || 'Número válido'}
        status="success"
      />
    );
  }

  return (
    <CheckoutAuthAnimatedStep
      icon={AlertCircle}
      title="WhatsApp não encontrado"
      subtitle="Você ainda pode continuar"
      status="info"
    />
  );
}
