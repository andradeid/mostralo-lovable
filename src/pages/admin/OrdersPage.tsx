import { useStoreTimezone } from '@/hooks/useStoreTimezone';
import { useStoreDayMetrics } from '@/hooks/useStoreDayMetrics';
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { NotificationPermissionDialog } from '@/components/delivery/NotificationPermissionDialog';
import { Database } from "@/integrations/supabase/types";
import { OrderDetailDialog } from "@/components/admin/orders/OrderDetailDialog";
import { CreateOrderDialog } from "@/components/admin/orders/CreateOrderDialog";
import { ShoppingBag, Plus, AlertCircle, Loader2 } from "lucide-react";
import { OrdersPageTutorial } from "@/components/admin/orders/OrdersPageTutorial";
import { Button } from "@/components/ui/button";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePasswordCallConfig } from "@/hooks/usePasswordCallConfig";
import { FloatingPasswordKeypad } from "@/components/signage/FloatingPasswordKeypad";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOrderSoundAlerts } from "@/hooks/orders/useOrderSoundAlerts";
import { useOrdersPageLayout } from "@/hooks/orders/useOrdersPageLayout";
import { useOrdersFeed } from "@/hooks/orders/useOrdersFeed";
import { useOrderActions } from "@/hooks/orders/useOrderActions";
import { filterKanbanOrders, kanbanOrdersByStatus } from "@/lib/orders/kanbanFilters";
import { OrdersMobileView } from "@/components/admin/orders/page/OrdersMobileView";
import { OrdersPageHeader } from "@/components/admin/orders/page/OrdersPageHeader";
import { BatchPrintBar } from "@/components/admin/orders/page/BatchPrintBar";
import { OrdersConfigPanel } from "@/components/admin/orders/page/OrdersConfigPanel";
import { OrdersKanbanBoard } from "@/components/admin/orders/page/OrdersKanbanBoard";

type Order = Database['public']['Tables']['orders']['Row'];
type OrderStatus = Database['public']['Enums']['order_status'];
type PaymentStatus = Database['public']['Enums']['payment_status'];
type DeliveryType = Database['public']['Enums']['delivery_type'];

// Tela de pedidos do painel. Só orquestra: lógica em src/hooks/orders/ e
// telas em src/components/admin/orders/page/.
const OrdersPage = () => {
  // Hook de segurança - valida acesso à loja
  const { storeId, isLoading: storeAccessLoading, hasAccess } = useStoreAccess();
  // [iFood DESATIVADO] Módulo não utilizado — polling removido para evitar carga no DB
  const { data: timezone, isPending: timezoneLoading } = useStoreTimezone(storeId);
  const { data: dayMetrics, refetch: refreshMetrics } = useStoreDayMetrics(storeId);
  const { config: passwordCallConfig } = usePasswordCallConfig(storeId);
  const [searchParams, setSearchParams] = useSearchParams();

  const [createOrderDialogOpen, setCreateOrderDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<DeliveryType | 'all'>('all');

  const layout = useOrdersPageLayout();
  const sound = useOrderSoundAlerts();

  // Hook para detectar tela grande (lg+) e mobile
  const isLargeScreen = useMediaQuery('(min-width: 1024px)');
  const isMobile = useIsMobile();

  // Estado para status ativo no mobile
  const [mobileActiveStatus, setMobileActiveStatus] = useState<OrderStatus>('entrada');

  // Hook para browser notifications
  const {
    showPermissionDialog,
    setShowPermissionDialog,
    requestPermission,
    sendNotification,
    permission
  } = useNotificationPermission();

  const { orders, setOrders, isLoading, pendingOrders, setPendingOrders, fetchOrders } = useOrdersFeed({
    storeId,
    storeAccessLoading,
    hasAccess,
    timezone,
    timezoneLoading,
    refreshMetrics,
    soundEnabled: sound.soundEnabled,
    selectedSound: sound.selectedSound,
    setAudioBlocked: sound.setAudioBlocked,
  });

  // [iFood DESATIVADO] Polling de eventos iFood removido — módulo não utilizado.
  // Quando reativar, restaurar bloco useEffect com guard ifoodEnabled.

  // OTIMIZAÇÃO: setupRealtimeSubscription removido
  // Notificações de novos pedidos são gerenciadas pelo NewOrdersContext (canal único)
  // Atualizações de status são capturadas pelo polling de 30s acima

  const getFilteredOrders = () =>
    filterKanbanOrders(orders, { searchTerm, paymentStatusFilter, deliveryTypeFilter });

  const getOrdersByStatus = (status: OrderStatus, limit?: number) =>
    kanbanOrdersByStatus(getFilteredOrders(), status, limit);

  const actions = useOrderActions({ orders, setOrders, pendingOrders, setPendingOrders, fetchOrders, getOrdersByStatus });
  const { setSelectedOrder, setDetailDialogOpen, setFinishedOrdersVisible } = actions;

  // Verificar query parameter e abrir modal automaticamente
  useEffect(() => {
    const orderId = searchParams.get('order');
    if (orderId && orders.length > 0) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setDetailDialogOpen(true);
        // Limpar query parameter
        setSearchParams({});
      }
    }
  }, [searchParams, orders, setSearchParams]);

  // Aguardar validação de acesso
  if (storeAccessLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Carregando pedidos...</p>
      </div>
    );
  }

  // Bloquear se não tem acesso
  if (!hasAccess || !storeId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-semibold">Acesso Negado</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Você não tem permissão para acessar os pedidos. Entre em contato com o administrador.
        </p>
      </div>
    );
  }

  const filteredOrders = getFilteredOrders();
  const localToday = new Date().toDateString();
  const localTodayOrders = filteredOrders.filter(order => order.status !== 'cancelado' && new Date(order.created_at).toDateString() === localToday);
  const todayOrderCount = dayMetrics?.orders ?? localTodayOrders.length;
  const todayRevenue = dayMetrics?.revenue ?? localTodayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const averageTicket = dayMetrics?.avg_ticket ?? (todayOrderCount > 0 ? todayRevenue / todayOrderCount : 0);

  // Calcular contagem por status para mobile
  const statusCounts: Record<OrderStatus, number> = {
    'entrada': getOrdersByStatus('entrada').length,
    'confirmado': getOrdersByStatus('confirmado').length,
    'em_preparo': getOrdersByStatus('em_preparo').length,
    'aguarda_retirada': getOrdersByStatus('aguarda_retirada').length,
    'aguardando_pagamento': getOrdersByStatus('aguardando_pagamento' as OrderStatus).length,
    'em_transito': getOrdersByStatus('em_transito').length,
    'concluido': getOrdersByStatus('concluido').length,
    'cancelado': 0,
  };

  // Renderização Mobile
  if (isMobile && orders.length > 0) {
    return (
      <OrdersMobileView
        pendingCount={pendingOrders.length}
        soundEnabled={sound.soundEnabled}
        onToggleSound={sound.handleToggleSound}
        onCreateOrder={() => setCreateOrderDialogOpen(true)}
        filteredOrders={filteredOrders}
        activeStatus={mobileActiveStatus}
        onStatusChange={setMobileActiveStatus}
        statusCounts={statusCounts}
        onOrderClick={actions.openOrderFromMobile}
        onAdvanceStatus={actions.handleMobileAdvanceStatus}
        onPrint={actions.handleMobilePrint}
        onCancel={actions.handleMobileCancel}
        onAssignDriver={actions.handleMobileAssignDriver}
        onRefresh={actions.handleMobileRefresh}
        isRefreshing={actions.isRefreshingMobile}
        viewedOrderIds={actions.viewedOrderIds}
        hasMore={mobileActiveStatus === 'concluido' && getOrdersByStatus('concluido').length > actions.finishedOrdersVisible}
        onLoadMore={actions.loadMoreFinishedOrders}
        isLoadingMore={actions.isLoadingMoreFinished}
        selectedOrder={actions.selectedOrder}
        detailDialogOpen={actions.detailDialogOpen}
        onDetailDialogOpenChange={setDetailDialogOpen}
        createOrderDialogOpen={createOrderDialogOpen}
        onCreateOrderDialogOpenChange={setCreateOrderDialogOpen}
        onOrdersChanged={fetchOrders}
      />
    );
  }

  return (
    <div className={`p-2 sm:p-3 lg:p-4 space-y-2 sm:space-y-3 ${pendingOrders.length > 0 ? 'animate-screen-flash' : ''}`}>
      {/* Header - Grid de 3 colunas */}
      <OrdersPageHeader
        pendingCount={pendingOrders.length}
        configExpanded={layout.configExpanded}
        onToggleConfig={() => layout.setConfigExpanded(!layout.configExpanded)}
        isFullscreen={layout.isFullscreen}
        onToggleFullscreen={layout.toggleFullscreen}
        onShowTutorial={() => layout.setShowTutorial(true)}
        isRefreshing={actions.isRefreshingDesktop}
        onRefresh={actions.handleDesktopRefresh}
        getHighlightClass={layout.getHighlightClass}
        onCreateOrder={() => setCreateOrderDialogOpen(true)}
        todayOrderCount={todayOrderCount}
        todayRevenue={todayRevenue}
        soundEnabled={sound.soundEnabled}
        notificationsGranted={permission === 'granted'}
      />

      <BatchPrintBar
        selectedCount={actions.selectedOrderIds.size}
        onToggleSelectAll={actions.toggleSelectAllVisible}
        onClear={() => actions.setSelectedOrderIds(new Set())}
        onPrint={actions.handleBatchPrint}
        isPrinting={actions.isPrintingBatch}
      />

      {/* Seção Colapsável de Configurações */}
      {layout.configExpanded && (
        <OrdersConfigPanel
          audioUnlocked={sound.audioUnlocked}
          audioBlocked={sound.audioBlocked}
          soundEnabled={sound.soundEnabled}
          onUnlockAudio={sound.unlockAudio}
          notificationsGranted={permission === 'granted'}
          onAskNotifications={() => setShowPermissionDialog(true)}
          onTestSound={sound.handleTestSound}
          onToggleSound={sound.handleToggleSound}
          todayOrderCount={todayOrderCount}
          todayRevenue={todayRevenue}
          averageTicket={averageTicket}
          searchTerm={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setFinishedOrdersVisible(5);
          }}
          paymentStatusFilter={paymentStatusFilter}
          onPaymentStatusChange={(value) => {
            setPaymentStatusFilter(value);
            setFinishedOrdersVisible(5);
          }}
          deliveryTypeFilter={deliveryTypeFilter}
          onDeliveryTypeChange={(value) => {
            setDeliveryTypeFilter(value);
            setFinishedOrdersVisible(5);
          }}
          onClearFilters={() => {
            setSearchTerm("");
            setPaymentStatusFilter('all');
            setDeliveryTypeFilter('all');
            setFinishedOrdersVisible(5);
          }}
        />
      )}

      {/* Banner removido do header - agora está no grid de 3 colunas */}

      {/* Mensagem quando não há pedidos */}
      {orders.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 mb-8">
          <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            Nenhum pedido ainda
          </p>
          <p className="text-sm text-muted-foreground/70 mt-2 mb-4">
            Os pedidos aparecerão aqui quando forem criados
          </p>
          <Button onClick={() => setCreateOrderDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Pedido
          </Button>
        </div>
      )}

      {/* Kanban Board - Com scroll horizontal e indicador */}
      {orders.length > 0 && (
        <OrdersKanbanBoard
          onDragEnd={actions.handleDragEnd}
          isLargeScreen={isLargeScreen}
          getOrdersByStatus={getOrdersByStatus}
          finishedOrdersVisible={actions.finishedOrdersVisible}
          onLoadMoreFinished={actions.loadMoreFinishedOrders}
          isLoadingMoreFinished={actions.isLoadingMoreFinished}
          onOpenOrder={actions.openOrderFromCard}
          viewedOrderIds={actions.viewedOrderIds}
          selectedOrderIds={actions.selectedOrderIds}
          onToggleOrderSelection={actions.toggleOrderSelection}
        />
      )}

      {/* Order Detail Dialog */}
      <OrderDetailDialog
        order={actions.selectedOrder}
        open={actions.detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onStatusChange={fetchOrders}
      />

      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={createOrderDialogOpen}
        onOpenChange={setCreateOrderDialogOpen}
        onSuccess={fetchOrders}
      />

      {/* Notification Permission Dialog */}
      <NotificationPermissionDialog
        open={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
        onRequestPermission={requestPermission}
      />

      {/* Tutorial de Onboarding */}
      <OrdersPageTutorial
        open={layout.showTutorial}
        onComplete={layout.completeTutorial}
        onStepChange={layout.setTutorialStep}
      />

      {/* Teclado flutuante de chamada de senhas */}
      {storeId && passwordCallConfig?.is_enabled && passwordCallConfig?.show_in_orders_page && (
        <FloatingPasswordKeypad storeId={storeId} config={passwordCallConfig} />
      )}
    </div>
  );
};

export default OrdersPage;
