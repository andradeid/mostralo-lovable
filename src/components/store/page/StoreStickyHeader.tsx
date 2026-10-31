// Cabeçalho fixo com logo e nome da loja, que aparece ao rolar a página.
import { Store as StoreIcon } from 'lucide-react';
import type { StorePageStore } from '@/hooks/store/storePageTypes';

interface Props {
  store: StorePageStore;
  primaryColor: string;
  customerName: string | null;
  onGoToCustomerArea: () => void;
  onOpenRegister: () => void;
}

export function StoreStickyHeader({ store, primaryColor, customerName, onGoToCustomerArea, onOpenRegister }: Props) {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 text-white shadow-lg transition-all duration-300"
      style={{ backgroundColor: primaryColor }}
    >
      <div className="max-w-[1080px] mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {store?.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.name}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <StoreIcon className="w-4 h-4 text-white" />
            </div>
          )}
          <span className="font-semibold text-sm">{store?.name}</span>
        </div>
        {customerName ? (
          <button
            type="button"
            onClick={onGoToCustomerArea}
            aria-label="Abrir painel do cliente"
            className="text-xs underline underline-offset-2"
          >
            Minha conta
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOpenRegister()}
            aria-label="Cadastrar-se"
            className="text-xs underline underline-offset-2"
          >
            Cadastrar
          </button>
        )}
      </div>
    </div>
  );
}
