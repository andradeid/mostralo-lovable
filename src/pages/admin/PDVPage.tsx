import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePDV } from '@/hooks/usePDV';
import { useComandas, Comanda } from '@/hooks/useComandas';
import { useCheckSalesChannel } from '@/hooks/useCheckSalesChannel';
import { PDVProductGrid } from '@/components/pdv/PDVProductGrid';
import { PDVCart } from '@/components/pdv/PDVCart';
import { PDVPaymentModal } from '@/components/pdv/PDVPaymentModal';
import { PDVHistory } from '@/components/pdv/PDVHistory';
import { ComandaCard } from '@/components/comandas/ComandaCard';
import { CloseComandaModal } from '@/components/comandas/CloseComandaModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package, History, ClipboardList, Minimize2, Maximize2 } from 'lucide-react';
import { ModuleGate } from '@/components/admin/ModuleGate';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { printComanda } from '@/utils/printComanda';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { SalesChannelPausedBanner } from '@/components/shared/SalesChannelPausedBanner';
import { useSidebar } from '@/components/ui/sidebar';

export default function PDVPage() {
  const navigate = useNavigate();
  const { storeId } = useStoreAccess();
  const { cart, subtotal, addToCart, updateCartItemQuantity, removeFromCart, clearCart, finalizeSale, isProcessing } = usePDV();
  const { openComandas, closeComanda, isClosing, pendingApprovalsByComanda } = useComandas();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState<Comanda | null>(null);
  const isMobile = useIsMobile();
  
  // Estado e controle de tela cheia (similar à página de pedidos)
  const { setOpen: setSidebarOpen } = useSidebar();
  const [isFullscreen, setIsFullscreen] = useState<boolean>(true);

  // Função para alternar modo tela cheia
  const toggleFullscreen = useCallback(() => {
    const newState = !isFullscreen;
    setIsFullscreen(newState);
    
    // Dispara evento para AdminLayout ocultar/mostrar header
    window.dispatchEvent(new CustomEvent('kanbanFullscreenChange', { 
      detail: { isFullscreen: newState } 
    }));
    
    // Colapsa ou expande sidebar
    setSidebarOpen(!newState);
  }, [isFullscreen, setSidebarOpen]);

  // Sincronizar ao montar - inicia em modo tela cheia
  useEffect(() => {
    // Aplica o estado inicial de fullscreen
    window.dispatchEvent(new CustomEvent('kanbanFullscreenChange', { 
      detail: { isFullscreen: true } 
    }));
    setSidebarOpen(false);
    
    // Cleanup ao desmontar - restaura header e sidebar
    return () => {
      window.dispatchEvent(new CustomEvent('kanbanFullscreenChange', { 
        detail: { isFullscreen: false } 
      }));
    };
  }, [setSidebarOpen]);

  // Atalho Escape para sair do modo tela cheia
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, toggleFullscreen]);

  // Query para nome da loja (impressão)
  const { data: storeData } = useQuery({
    queryKey: ['store-name', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const { data } = await supabase
        .from('stores')
        .select('name')
        .eq('id', storeId)
        .single();
      return data;
    },
    enabled: !!storeId,
  });

  // Verificar se o canal PDV está ativo
  const { isEnabled: isPdvEnabled, message: channelMessage } = useCheckSalesChannel(storeId, 'pdv_enabled');
  const salesPaused = !isPdvEnabled;

  const handleFinalize = async (paymentMethod: string, discount: number, paymentDetails?: Record<string, any>) => {
    await finalizeSale(paymentMethod, discount, paymentDetails);
    setPaymentModalOpen(false);
  };

  const handleCloseComanda = (comanda: Comanda) => {
    setSelectedComanda(comanda);
    setCloseModalOpen(true);
  };

  const handleConfirmClose = async (paymentMethod: string, discount: number, serviceFee: number, paymentDetails?: Record<string, any>) => {
    if (!selectedComanda) return;
    
    await closeComanda({
      comanda_id: selectedComanda.id,
      payment_method: paymentMethod,
      discount,
      service_fee: serviceFee,
      payment_details: paymentDetails,
    });
    
    setCloseModalOpen(false);
    setSelectedComanda(null);
  };

  const handlePrintComanda = async (comanda: Comanda) => {
    const { data: items } = await supabase
      .from('comanda_items')
      .select('*')
      .eq('comanda_id', comanda.id);
    
    printComanda(comanda, (items || []) as any, storeData?.name || 'Estabelecimento');
  };

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const openComandasCount = openComandas?.length || 0;

  // Layout Mobile com Tabs (Grid 2x2)
  if (isMobile) {
    return (
      <ModuleGate moduleKey="pdv_comandas" storeId={storeId}>
        <div className="flex flex-col flex-1 min-h-0 relative">
          {/* Botão flutuante para sair do modo tela cheia - Mobile */}
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant={isFullscreen ? "default" : "outline"}
              size="sm"
              onClick={toggleFullscreen}
              className="gap-1 shadow-md"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span className="sr-only">
                {isFullscreen ? "Sair da tela cheia" : "Modo tela cheia"}
              </span>
            </Button>
          </div>
          
          {salesPaused && (
            <SalesChannelPausedBanner message={channelMessage} className="mx-2 mt-2" />
          )}
          <Tabs defaultValue="products" className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-2 gap-2 h-auto mx-2 mb-2 p-2">
              <TabsTrigger value="products" className="h-12 text-sm gap-1.5">
                <Package className="h-5 w-5" />
                Produtos
              </TabsTrigger>
              <TabsTrigger value="cart" className="h-12 text-sm gap-1.5 relative">
                <ShoppingCart className="h-5 w-5" />
                Carrinho
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="comandas" className="h-12 text-sm gap-1.5 relative">
                <ClipboardList className="h-5 w-5" />
                Comandas
                {openComandasCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {openComandasCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="h-12 text-sm gap-1.5">
                <History className="h-5 w-5" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="flex-1 overflow-auto px-2 pb-2 mt-0">
              <PDVProductGrid onAddProduct={addToCart} />
            </TabsContent>

            <TabsContent value="cart" className="flex-1 overflow-hidden px-2 pb-2 mt-0">
              <PDVCart
                items={cart}
                subtotal={subtotal}
                onUpdateQuantity={updateCartItemQuantity}
                onRemoveItem={removeFromCart}
                onClearCart={clearCart}
                onFinalize={() => setPaymentModalOpen(true)}
                isProcessing={isProcessing}
                salesPaused={salesPaused}
              />
            </TabsContent>

            <TabsContent value="comandas" className="flex-1 overflow-hidden px-2 pb-2 mt-0">
              <ScrollArea className="h-full">
                {openComandasCount === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <ClipboardList className="h-12 w-12 mb-2 opacity-50" />
                    <p>Nenhuma comanda aberta</p>
                  </div>
                ) : (
                  <div className="space-y-3 pb-4">
                    {openComandas?.map(comanda => (
                      <ComandaCard
                        key={comanda.id}
                        comanda={comanda}
                        pendingApprovalCount={pendingApprovalsByComanda?.[comanda.id] || 0}
                        onClick={() => navigate(`/dashboard/comandas/${comanda.id}`)}
                        onClose={() => handleCloseComanda(comanda)}
                        onPrint={() => handlePrintComanda(comanda)}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-hidden px-2 pb-2 mt-0">
              <PDVHistory />
            </TabsContent>
          </Tabs>

          {/* Modal de pagamento PDV */}
          <PDVPaymentModal
            open={paymentModalOpen}
            onOpenChange={setPaymentModalOpen}
            subtotal={subtotal}
            onConfirm={handleFinalize}
            isProcessing={isProcessing}
          />

          {/* Modal de fechamento de comanda */}
          <CloseComandaModal
            open={closeModalOpen}
            onOpenChange={setCloseModalOpen}
            subtotal={selectedComanda?.subtotal || 0}
            onConfirm={handleConfirmClose}
            isProcessing={isClosing}
            onPrint={() => selectedComanda && handlePrintComanda(selectedComanda)}
          />
        </div>
      </ModuleGate>
    );
  }

  // Layout Desktop com Tabs
  return (
    <ModuleGate moduleKey="pdv_comandas" storeId={storeId}>
      <div className="flex flex-col flex-1 min-h-0">
        {salesPaused && (
          <SalesChannelPausedBanner message={channelMessage} className="mb-4" />
        )}
        <Tabs defaultValue="pdv" className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="w-fit">
              <TabsTrigger value="pdv" className="gap-2">
                <Package className="h-4 w-4" />
                PDV
              </TabsTrigger>
              <TabsTrigger value="comandas" className="gap-2 relative">
                <ClipboardList className="h-4 w-4" />
                Comandas
                {openComandasCount > 0 && (
                  <span className="ml-1 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {openComandasCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                Histórico
              </TabsTrigger>
            </TabsList>
            
            {/* Botão para alternar modo tela cheia - Desktop */}
            <Button
              variant={isFullscreen ? "default" : "outline"}
              size="sm"
              onClick={toggleFullscreen}
              title={isFullscreen ? "Sair da tela cheia (Esc)" : "Modo tela cheia"}
              className="gap-1"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-4 w-4" />
                  <span>Sair</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  <span>Tela Cheia</span>
                </>
              )}
            </Button>
          </div>

          <TabsContent value="pdv" className="flex-1 overflow-hidden mt-0">
            <div className="h-full flex gap-4">
              {/* Grid de produtos */}
              <div className="flex-1 overflow-auto">
                <PDVProductGrid onAddProduct={addToCart} />
              </div>

              {/* Carrinho lateral */}
              <div className="w-80 lg:w-96 flex-shrink-0">
                <PDVCart
                  items={cart}
                  subtotal={subtotal}
                  onUpdateQuantity={updateCartItemQuantity}
                  onRemoveItem={removeFromCart}
                  onClearCart={clearCart}
                  onFinalize={() => setPaymentModalOpen(true)}
                  isProcessing={isProcessing}
                  salesPaused={salesPaused}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comandas" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full">
              {openComandasCount === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <ClipboardList className="h-12 w-12 mb-2 opacity-50" />
                  <p>Nenhuma comanda aberta</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                  {openComandas?.map(comanda => (
                    <ComandaCard
                      key={comanda.id}
                      comanda={comanda}
                      pendingApprovalCount={pendingApprovalsByComanda?.[comanda.id] || 0}
                      onClick={() => navigate(`/dashboard/comandas/${comanda.id}`)}
                      onClose={() => handleCloseComanda(comanda)}
                      onPrint={() => handlePrintComanda(comanda)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-hidden mt-0">
            <PDVHistory />
          </TabsContent>
        </Tabs>

        {/* Modal de pagamento PDV */}
        <PDVPaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          subtotal={subtotal}
          onConfirm={handleFinalize}
          isProcessing={isProcessing}
        />

        {/* Modal de fechamento de comanda */}
        <CloseComandaModal
          open={closeModalOpen}
          onOpenChange={setCloseModalOpen}
          subtotal={selectedComanda?.subtotal || 0}
          onConfirm={handleConfirmClose}
          isProcessing={isClosing}
          onPrint={() => selectedComanda && handlePrintComanda(selectedComanda)}
        />
      </div>
    </ModuleGate>
  );
}
