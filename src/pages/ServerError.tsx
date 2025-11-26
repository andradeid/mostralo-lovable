import { usePageSEO } from '@/hooks/useSEO';
import { ErrorLayout } from '@/components/ErrorLayout';
import { Button } from '@/components/ui/button';
import { ChefHat, Flame, RotateCw } from 'lucide-react';

const ServerError = () => {
  usePageSEO({
    title: '500 - Erro no Servidor | Mostralo',
    description: 'Ocorreu um erro no servidor. Nossa equipe já está trabalhando para resolver o problema.',
    keywords: '500, erro no servidor, mostralo'
  });

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <ErrorLayout
      code="500"
      icon={
        <div className="relative">
          <ChefHat className="h-16 w-16 text-destructive" />
          <Flame className="h-8 w-8 text-orange-500 absolute -top-2 -right-2 animate-pulse" />
        </div>
      }
      title="Eita! Algo pegou fogo na cozinha! 🔥"
      description="Nossa equipe já está apagando o incêndio e voltamos em breve."
      subtitle="Desculpe o transtorno, estamos trabalhando nisso!"
      showHomeButton={true}
    >
      <Button
        onClick={handleRetry}
        className="gap-2"
      >
        <RotateCw className="h-4 w-4" />
        Tentar novamente
      </Button>
    </ErrorLayout>
  );
};

export default ServerError;
