// Cabeçalho da tela de cupons: título e botão Novo Cupom.
import { Button } from '@/components/ui/button';
import { Ticket, Plus } from 'lucide-react';

interface Props {
  onNew: () => void;
}

export function CouponsPageHeader({ onNew: handleNew }: Props) {
  return (
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Ticket className="h-6 w-6 text-primary" />
            Gerenciar Cupons
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Crie e gerencie cupons promocionais com limites e rastreamento
          </p>
        </div>
        <Button onClick={handleNew} className="h-10">
          <Plus className="w-4 h-4 mr-2" />
          Novo Cupom
        </Button>
      </div>
  );
}
