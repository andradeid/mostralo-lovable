import { usePageSEO } from '@/hooks/useSEO';
import { ErrorLayout } from '@/components/ErrorLayout';
import { Clock, Package } from 'lucide-react';

const Maintenance = () => {
  usePageSEO({
    title: '503 - Em Manutenção | Mostralo',
    description: 'Estamos em manutenção preparando melhorias. Voltamos em breve com novidades!',
    keywords: '503, manutenção, mostralo'
  });

  return (
    <ErrorLayout
      code="503"
      icon={
        <div className="relative">
          <Package className="h-16 w-16 text-primary" />
          <Clock className="h-8 w-8 text-primary/60 absolute -bottom-2 -right-2 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
      }
      title="Estamos preparando algo especial! 🍕"
      description="Voltamos em alguns minutinhos com novidades quentinhas..."
      subtitle="Previsão: em breve 🕐"
      showHomeButton={false}
    />
  );
};

export default Maintenance;
