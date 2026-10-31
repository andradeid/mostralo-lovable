// Barras do topo da loja: celular (menu, busca, conta), aviso de busca ativa e barra do computador
// (pedido mínimo, saudação e status de funcionamento).
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, User, MapPin, Clock } from 'lucide-react';
import type { StorePageStore } from '@/hooks/store/storePageTypes';

interface Props {
  store: StorePageStore;
  primaryColor: string;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  isSearching: boolean;
  customerName: string | null;
  businessHours: any;
  storeStatus: any;
  storeStatusMessage: string;
  scheduledOnly: boolean;
  onOpenStoreInfo: () => void;
  onOpenRegister: () => void;
  onGoToCustomerArea: () => void;
}

export function StoreTopBars({
  store, primaryColor, searchTerm, setSearchTerm, isSearching, customerName, businessHours,
  storeStatus, storeStatusMessage, scheduledOnly, onOpenStoreInfo, onOpenRegister, onGoToCustomerArea,
}: Props) {
  return (
    <>
      {/* Barra Superior - Mobile */}
      <div
        className="lg:hidden text-white px-4 py-3"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Menu Hambúrguer */}
          <button
            onClick={() => onOpenStoreInfo()}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors active:scale-95 mr-2"
            aria-label="Abrir menu da loja"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Campo de Busca */}
          <div className="flex-1 relative">
            {isSearching ? (
              <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            )}
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 text-sm bg-white text-foreground"
            />
          </div>

          {/* Ícones de usuário e carrinho */}
            <div className="flex items-center gap-2">
              {!customerName ? (
                <button
                  type="button"
                  onClick={() => onOpenRegister()}
                  aria-label="Cadastrar-se"
                  className="relative flex items-center"
                >
                  <User className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onGoToCustomerArea}
                  aria-label="Abrir painel do cliente"
                  className="relative flex items-center"
                >
                  <User className="w-5 h-5" />
                </button>
              )}
           </div>
        </div>
      </div>

      {/* Indicador de Busca Ativa */}
      {searchTerm && (
        <div className="lg:hidden px-4 py-3 bg-muted/30 border-b">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Buscando por: <strong>{searchTerm}</strong>
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="h-7 text-xs"
            >
              Limpar
            </Button>
          </div>
        </div>
      )}

      {/* Barra Superior - Desktop */}
      <div
        className="hidden lg:block text-white px-4 py-2"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center justify-between text-sm max-w-[1080px] mx-auto">
          <div className="flex items-center gap-4">
            {Number(store.min_order_value) > 0 && <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>Pedido mínimo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(store.min_order_value))}</span>
            </div>}
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{customerName ? `Olá, ${customerName}` : 'Olá Visitante'}</span>
            </div>
          </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {!businessHours ? (
                <span className="text-white/80">Carregando status...</span>
              ) : (
                <>
                  <span className={`bg-white px-2 py-0.5 rounded-full text-xs font-semibold ${!storeStatus.isOpenForBusiness ? 'text-orange-600' : 'text-green-700'}`}>
                    {storeStatusMessage}
                  </span>
                  {!storeStatus.isOpenForBusiness && (
                    <Badge
                      variant={storeStatus.scheduledOrdersEnabled ? "default" : "destructive"}
                      className={storeStatus.scheduledOrdersEnabled ? "" : "animate-pulse"}
                    >
                      {storeStatus.isPaused && '⏸ Pausado'}
                      {storeStatus.isClosed && !storeStatus.isPaused && (scheduledOnly ? '📦 Aceitando encomendas' : '🕒 Fechado')}
                    </Badge>
                  )}
                </>
              )}
            </div>
        </div>
      </div>
    </>
  );
}
