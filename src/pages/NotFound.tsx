import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePageSEO } from '@/hooks/useSEO';
import { ErrorLayout } from '@/components/ErrorLayout';
import { Button } from '@/components/ui/button';
import { MapPin, Bike, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  usePageSEO({
    title: '404 - Página Não Encontrada | Mostralo',
    description: 'A página que você procura não foi encontrada. Volte para a página inicial da Mostralo e continue navegando.',
    keywords: '404, página não encontrada, erro, mostralo'
  });

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <ErrorLayout
      code="404"
      icon={
        <div className="relative">
          <MapPin className="h-16 w-16 text-primary animate-bounce" />
          <Bike className="h-8 w-8 text-primary/60 absolute -bottom-2 -right-2" />
        </div>
      }
      title="Opa! Parece que o entregador se perdeu..."
      description="Essa página não existe ou foi movida para outro endereço 🗺️"
      subtitle="Não se preocupe, vamos te levar de volta ao caminho certo!"
      showHomeButton={true}
    >
      <Button
        onClick={() => navigate(-1)}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>
    </ErrorLayout>
  );
};

export default NotFound;
