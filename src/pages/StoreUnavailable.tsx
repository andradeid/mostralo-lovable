import { StoreIcon, Clock } from 'lucide-react';
import { ErrorLayout } from '@/components/ErrorLayout';

export default function StoreUnavailable() {
  return (
    <ErrorLayout
      icon={
        <div className="relative">
          <StoreIcon className="h-24 w-24 text-muted-foreground" />
          <Clock className="h-10 w-10 text-primary absolute -bottom-1 -right-1 animate-pulse" />
        </div>
      }
      title="Esta loja não está disponível no momento"
      description="A loja está passando por ajustes e voltará em breve. Agradecemos sua compreensão!"
      subtitle="Entre em contato com o estabelecimento para mais informações."
      showHomeButton={false}
    />
  );
}
