// Capa da loja (celular e computador) e cartão de cabeçalho do celular: logo, nome, descrição,
// status de funcionamento, aviso de agendamento/encomenda e botão de instalar o app.
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Store as StoreIcon, Clock, Calendar } from 'lucide-react';
import type { StorePageStore } from '@/hooks/store/storePageTypes';

interface Props {
  store: StorePageStore;
  searchTerm: string;
  storeStatus: any;
  scheduledOnly: boolean;
  deliveryConfig: any;
  deferredPrompt: any;
  // Mantidos como funções (comportamento atual do botão de instalação)
  isIOS: () => boolean;
  isStandalone: () => any;
  installPWA: () => void;
}

export function StoreHeaderMobile({
  store, searchTerm, storeStatus, scheduledOnly, deliveryConfig, deferredPrompt, isIOS, isStandalone, installPWA,
}: Props) {
  return (
    <>
      {/* Imagem de Capa - Somente Mobile */}
      {!searchTerm && store?.cover_url && (
        <div className="lg:hidden relative">
          <img
            src={store.cover_url}
            alt={`Capa da ${store.name}`}
            className="w-full h-32 object-cover"
          />
          {/* Logo sobreposta - 50% sobre a capa */}
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 z-10">
            {store?.logo_url ? (
              <img
                src={store.logo_url}
                alt={store.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-4 border-white shadow-lg">
                <StoreIcon className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Imagem de Capa - Computador */}
      {!searchTerm && store?.cover_url && (
        <div className="hidden lg:block px-4 pt-4">
          <img
            src={store.cover_url}
            alt={`Capa da ${store.name}`}
            className="w-full max-w-[1080px] mx-auto h-48 xl:h-56 object-cover rounded-xl"
          />
        </div>
      )}

      {/* Header Principal - Mobile */}
      {!searchTerm && (
        <div className={`lg:hidden px-4 ${store?.cover_url ? 'pt-12 pb-4' : 'py-4'}`}>
          <Card className="shadow-lg">
            <CardContent className="p-4">
              {/* Logo Centralizada - apenas quando não há capa */}
              {!store?.cover_url && (
                <div className="text-center mb-3">
                  {store?.logo_url ? (
                    <img
                      src={store.logo_url}
                      alt={store.name}
                      className="w-16 h-16 rounded-full object-cover mx-auto"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <StoreIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
              )}

              {/* Nome e Descrição */}
              <div className="text-center mb-3">
                <h1 className="text-lg font-bold text-foreground mb-2">{store?.name}</h1>
                {store?.description && (
                  <p className="text-sm text-muted-foreground px-4">
                    {store.description}
                  </p>
                )}
              </div>

              {/* Status Dinâmico da Loja */}
              <div className={`mb-3 flex flex-col items-center justify-center gap-2 py-3 px-4 rounded-lg ${
                storeStatus.isOpenForBusiness
                  ? 'bg-green-50'
                  : storeStatus.isPaused
                    ? 'bg-amber-50'
                    : 'bg-gray-100'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    {storeStatus.isOpenForBusiness && (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                      </>
                    )}
                    {storeStatus.isPaused && (
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    )}
                    {storeStatus.isClosed && !storeStatus.isPaused && (
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-500"></span>
                    )}
                  </span>
                  <span className={`text-sm font-medium ${
                    storeStatus.isOpenForBusiness
                      ? 'text-green-700'
                      : storeStatus.isPaused
                        ? 'text-amber-700'
                        : 'text-gray-700'
                  }`}>
                    {storeStatus.isPaused && '⏸️ Serviço Pausado'}
                    {storeStatus.isClosed && !storeStatus.isPaused && (scheduledOnly ? '📦 Aceitando encomendas' : '🕒 Estabelecimento Fechado')}
                    {storeStatus.isOpenForBusiness && '✅ Aberto para Pedidos'}
                  </span>
                </div>

                {/* Próximo horário de abertura */}
                {storeStatus.nextOpeningMessage && (
                  <div className="text-xs text-gray-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {storeStatus.nextOpeningMessage}
                  </div>
                )}
              </div>

                {/* Informação sobre agendamentos - Sempre que habilitado */}
                {storeStatus.showSchedulingInfo && (
                  <div className={`mb-3 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border ${
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
                    <span className={`text-xs font-medium ${
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
                )}

              {/* Botão de Instalação Unificado */}
              {(deferredPrompt || isIOS) && !isStandalone && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs mb-3"
                  onClick={installPWA}
                >
                  📱 Instalar Aplicativo
                </Button>
              )}


            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
