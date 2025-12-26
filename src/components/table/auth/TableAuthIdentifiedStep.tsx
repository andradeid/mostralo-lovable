import { UserCheck, UserPlus, Hand } from 'lucide-react';
import { TableAuthAnimatedStep } from './TableAuthAnimatedStep';

interface TableAuthIdentifiedStepProps {
  isNewCustomer: boolean;
  customerName?: string;
}

export function TableAuthIdentifiedStep({ isNewCustomer, customerName }: TableAuthIdentifiedStepProps) {
  if (isNewCustomer) {
    return (
      <TableAuthAnimatedStep
        icon={Hand}
        title="Novo por aqui?"
        subtitle="Vamos fazer seu cadastro rapidinho!"
        status="info"
        iconClassName="animate-[wave_1s_ease-in-out_2]"
      />
    );
  }

  return (
    <TableAuthAnimatedStep
      icon={UserCheck}
      title={`Olá, ${customerName || 'Cliente'}!`}
      subtitle="Cliente identificado com sucesso"
      status="success"
    />
  );
}
