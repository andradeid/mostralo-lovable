import { usePageSEO } from '@/hooks/useSEO';
import { ErrorLayout } from '@/components/ErrorLayout';
import { Button } from '@/components/ui/button';
import { WifiOff, CloudOff, RotateCw } from 'lucide-react';

const Offline = () => {
  usePageSEO({
    title: 'Sem Conexão | Mostralo',
    description: 'Você está offline. Verifique sua conexão com a internet e tente novamente.',
    keywords: 'offline, sem conexão, mostralo'
  });

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <ErrorLayout
      icon={
        <div className="relative">
          <WifiOff className="h-16 w-16 text-muted-foreground" />
          <CloudOff className="h-8 w-8 text-muted-foreground/60 absolute -bottom-2 -right-2" />
        </div>
      }
      title="Opa! Cadê o sinal? 📶"
      description="Parece que você está offline. Verifique sua conexão com a internet."
      subtitle="Quando voltar, recarregue a página para continuar"
      showHomeButton={false}
    >
      <Button
        onClick={handleRetry}
        className="gap-2"
      >
        <RotateCw className="h-4 w-4" />
        Tentar reconectar
      </Button>
    </ErrorLayout>
  );
};

export default Offline;
