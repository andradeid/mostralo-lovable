// Cabeçalho do computador: logo e nome, busca, conta do cliente (cadastrar ou menu) e carrinho;
// e, abaixo, o aviso de agendamento/encomenda.
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Store as StoreIcon, Loader2, Search, User, Package, LogOut, ShoppingCart, Calendar } from 'lucide-react';
import type { StorePageStore } from '@/hooks/store/storePageTypes';

interface Props {
  store: StorePageStore;
  primaryColor: string;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  isSearching: boolean;
  customerName: string | null;
  storeStatus: any;
  deliveryConfig: any;
  totalPrice: number;
  totalItems: number;
  onOpenRegister: () => void;
  onMyOrders: () => void;
  onSignOut: () => void;
  onOpenCart: () => void;
}

export function StoreHeaderDesktop({
  store, primaryColor, searchTerm, setSearchTerm, isSearching, customerName, storeStatus, deliveryConfig,
  totalPrice, totalItems, onOpenRegister, onMyOrders, onSignOut, onOpenCart,
}: Props) {
  return (
    <>
      {/* Header Principal - Desktop */}
      <div className="hidden lg:block bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between max-w-[1080px] mx-auto">
          {/* Logo e Informações da Loja */}
          <div className="flex items-center gap-4">
            {store?.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <StoreIcon className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-foreground">{store?.name}</h1>
              <p className="text-sm text-muted-foreground">{store?.description || 'Descrição da Loja'}</p>
            </div>
          </div>

          {/* Barra de Busca e Carrinho */}
          <div className="flex items-center gap-4">
            {/* Barra de Busca */}
            <div className="relative">
              {isSearching ? (
                <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
              ) : (
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              )}
              <Input
                placeholder="Digite sua busca..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80 bg-background border border-muted rounded-lg"
              />
            </div>

            {/* Botões de cadastro e carrinho */}
            <div className="flex items-center gap-3">
              {!customerName ? (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => onOpenRegister()}
                    aria-label="Cadastrar-se"
                    className="font-medium"
                    style={{ backgroundColor: primaryColor, color: 'white' }}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Cadastrar
                  </Button>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      aria-label="Menu da conta"
                      className="font-medium"
                    >
                      <User className="w-4 h-4 mr-2" />
                      {customerName.split(' ')[0]}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onMyOrders()}>
                      <Package className="w-4 h-4 mr-2" />
                      Meus Pedidos
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onSignOut()}
                      className="text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button
                variant="outline"
                size="sm"
                className="relative text-white hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: primaryColor, borderColor: primaryColor }}
                onClick={() => onOpenCart()}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs bg-red-500 text-white flex items-center justify-center animate-scale-in">
                    {totalItems}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Informação sobre agendamento/encomenda - Desktop */}
      {storeStatus.showSchedulingInfo && (
        <div className="hidden lg:block px-4 py-2 bg-background">
          <div className="max-w-[1080px] mx-auto">
            <div className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg border ${
              deliveryConfig?.scheduled_orders?.hide_asap
                ? 'bg-amber-50 border-amber-200'
                : storeStatus.isOpenForBusiness
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-blue-100 border-blue-300'
            }`}>
              <Calendar className={`h-4 w-4 ${
                deliveryConfig?.scheduled_orders?.hide_asap
                  ? 'text-amber-600'
                  : storeStatus.isOpenForBusiness ? 'text-blue-600' : 'text-blue-700'
              }`} />
              <span className={`text-sm font-medium ${
                deliveryConfig?.scheduled_orders?.hide_asap
                  ? 'text-amber-800'
                  : storeStatus.isOpenForBusiness ? 'text-blue-700' : 'text-blue-800'
              }`}>
                {deliveryConfig?.scheduled_orders?.hide_asap
                  ? '📦 Somente por encomenda — escolha a data ao finalizar'
                  : storeStatus.isOpenForBusiness
                    ? '📅 Também aceita pedidos com agendamento'
                    : '✅ Aceita pedidos com agendamento'
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
