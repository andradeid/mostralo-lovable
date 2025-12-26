import { Search } from 'lucide-react';
import { CheckoutAuthAnimatedStep } from './CheckoutAuthAnimatedStep';

export function CheckoutAuthIdentifyingStep() {
  return (
    <CheckoutAuthAnimatedStep
      icon={Search}
      title="Identificando cliente..."
      subtitle="Aguarde um momento"
      status="loading"
    />
  );
}
