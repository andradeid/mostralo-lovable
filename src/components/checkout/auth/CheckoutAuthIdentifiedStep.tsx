import { CheckCircle2, Hand, XCircle } from 'lucide-react';
import { CheckoutAuthAnimatedStep } from './CheckoutAuthAnimatedStep';

interface CheckoutAuthIdentifiedStepProps {
  isNewCustomer: boolean;
  customerName?: string;
  error?: string;
}

export function CheckoutAuthIdentifiedStep({ 
  isNewCustomer, 
  customerName,
  error 
}: CheckoutAuthIdentifiedStepProps) {
  if (error) {
    return (
      <CheckoutAuthAnimatedStep
        icon={XCircle}
        title="Credenciais inválidas"
        subtitle={error}
        status="error"
      />
    );
  }

  if (isNewCustomer) {
    return (
      <CheckoutAuthAnimatedStep
        icon={Hand}
        title="Novo por aqui?"
        subtitle="Vamos fazer seu cadastro rapidinho!"
        status="info"
        iconClassName="animate-wave"
      />
    );
  }

  return (
    <CheckoutAuthAnimatedStep
      icon={CheckCircle2}
      title={`Olá, ${customerName || 'Cliente'}!`}
      subtitle="Cliente identificado com sucesso"
      status="success"
    />
  );
}
