import { UserCheck, Hand, Store } from 'lucide-react';
import { TableAuthAnimatedStep } from './TableAuthAnimatedStep';

interface TableAuthIdentifiedStepProps {
  isNewCustomer: boolean;
  customerName?: string;
  previousStores?: { name: string; slug: string }[];
  isNewToThisStore?: boolean;
}

export function TableAuthIdentifiedStep({ 
  isNewCustomer, 
  customerName,
  previousStores = [],
  isNewToThisStore = false
}: TableAuthIdentifiedStepProps) {
  // Cliente totalmente novo (nunca comprou em nenhuma loja)
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

  // Cliente existe mas é a primeira vez nesta loja específica
  if (isNewToThisStore && previousStores.length > 0) {
    const storeNames = previousStores.slice(0, 2).map(s => s.name).join(', ');
    const moreStores = previousStores.length > 2 ? ` e mais ${previousStores.length - 2}` : '';
    
    return (
      <TableAuthAnimatedStep
        icon={Store}
        title={`Olá, ${customerName || 'Cliente'}!`}
        subtitle={`Você já tem cadastro no Mostralo! Compraste antes na ${storeNames}${moreStores}. Use a mesma senha.`}
        status="success"
      />
    );
  }

  // Cliente já comprou nesta loja
  return (
    <TableAuthAnimatedStep
      icon={UserCheck}
      title={`Olá, ${customerName || 'Cliente'}!`}
      subtitle="Cliente identificado com sucesso"
      status="success"
    />
  );
}
