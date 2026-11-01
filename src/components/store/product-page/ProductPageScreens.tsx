// Telas da página do produto fora do conteúdo: carregando e produto não encontrado.
import { Button } from '@/components/ui/button';

export function ProductLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Carregando produto...</p>
      </div>
    </div>
  );
}

export function ProductNotFoundScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Produto não encontrado</h1>
        <Button onClick={onBack}>Voltar ao início</Button>
      </div>
    </div>
  );
}
