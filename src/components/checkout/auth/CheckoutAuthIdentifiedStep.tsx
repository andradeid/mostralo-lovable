import { CheckCircle2, Hand, XCircle, Store } from 'lucide-react';
import { CheckoutAuthAnimatedStep } from './CheckoutAuthAnimatedStep';

interface CheckoutAuthIdentifiedStepProps {
  isNewCustomer: boolean;
  customerName?: string;
  error?: string;
  previousStores?: { name: string; slug: string }[];
  isNewToThisStore?: boolean;
}

export function CheckoutAuthIdentifiedStep({ 
  isNewCustomer, 
  customerName,
  error,
  previousStores = [],
  isNewToThisStore = false
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

  // Cliente totalmente novo
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

  // Cliente existe mas é a primeira vez nesta loja específica
  if (isNewToThisStore) {
    return (
      <CheckoutAuthAnimatedStep
        icon={Store}
        title={`Olá, ${customerName || 'Cliente'}!`}
        subtitle="Você já tem cadastro no Mostralo. Use sua senha."
        status="success"
      />
    );
  }

  // Cliente já comprou nesta loja
  return (
    <CheckoutAuthAnimatedStep
      icon={CheckCircle2}
      title={`Olá, ${customerName || 'Cliente'}!`}
      subtitle="Cliente identificado com sucesso"
      status="success"
    />
  );
}
