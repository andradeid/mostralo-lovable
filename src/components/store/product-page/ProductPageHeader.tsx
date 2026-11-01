// Cabeçalho simplificado da página do produto (voltar para a loja + logo e nome).
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { Store } from '@/lib/productPage/types';

export function ProductPageHeader({ store, onBack }: { store: Store; onBack: () => void }) {
  return (
    <header className="sticky top-0 z-40 bg-card border-b">
      <div className="max-w-[1080px] mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {store?.logo_url && (
                <img
                  src={store.logo_url}
                  alt={store.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <span className="font-semibold text-sm truncate">{store.name}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
