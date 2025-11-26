import { useState, useEffect } from "react";
import { DragDropContext, Draggable, DropResult } from "react-beautiful-dnd";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { KanbanColumn } from "@/components/admin/orders/KanbanColumn";
import { OrderCard } from "@/components/admin/orders/OrderCard";
import { OrderDetailDialog } from "@/components/admin/orders/OrderDetailDialog";
import { OrderFilters } from "@/components/admin/orders/OrderFilters";
import { CreateOrderDialog } from "@/components/admin/orders/CreateOrderDialog";
import { NewOrderAlertDialog } from "@/components/admin/orders/NewOrderAlertDialog";
import { toast } from "sonner";
import { Inbox, ChefHat, Package, Truck, DollarSign, ShoppingBag, TrendingUp, Bell, Volume2, VolumeX, Plus, AlertCircle, CheckCircle2, Printer, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { mockOrders } from "@/utils/mockOrders";
import { playNewOrderSound, playOrderAlertLoop, stopOrderAlertLoop, getSelectedSound, NotificationSound } from "@/utils/soundPlayer";
import { SoundSelector } from "@/components/admin/orders/SoundSelector";
import { printOrder } from "@/utils/printOrder";
import { MarketplaceSavingsCard } from "@/components/admin/MarketplaceSavingsCard";
import { useStoreAccess } from "@/hooks/useStoreAccess";

type Order = Database['public']['Tables']['orders']['Row'];
type OrderStatus = Database['public']['Enums']['order_status'];
type PaymentStatus = Database['public']['Enums']['payment_status'];
type DeliveryType = Database['public']['Enums']['delivery_type'];

const OrdersPage = () => {
  // Hook de segurança - valida acesso à loja
  const { storeId, isLoading: storeAccessLoading, hasAccess } = useStoreAccess();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [createOrderDialogOpen, setCreateOrderDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<DeliveryType | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('orderSoundEnabled');
    return saved !== 'false'; // padrão é true
  });
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [alertOrder, setAlertOrder] = useState<Order | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  
  const [shownAlertIds, setShownAlertIds] = useState<Set<string>>(new Set());
  const [viewedOrderIds, setViewedOrderIds] = useState<Set<string>>(new Set());
  const [selectedSound, setSelectedSound] = useState<NotificationSound>(getSelectedSound());
  
  // Estados para paginação da coluna "Finalizados"
  const [finishedOrdersVisible, setFinishedOrdersVisible] = useState(5);
  const [isLoadingMoreFinished, setIsLoadingMoreFinished] = useState(false);

  // Estados para impressão em lote
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [isPrintingBatch, setIsPrintingBatch] = useState(false);

  useEffect(() => {
    localStorage.setItem('orderSoundEnabled', String(soundEnabled));
  }, [soundEnabled]);

  // Listener para mudanças no som selecionado
  useEffect(() => {
    const handleStorageChange = () => {
      setSelectedSound(getSelectedSound());
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Também verificar a cada segundo (para mudanças na mesma aba)
    const interval = setInterval(() => {
      const currentSound = getSelectedSound();
      if (currentSound !== selectedSound) {
        setSelectedSound(currentSound);
      }
    }, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [selectedSound]);

  useEffect(() => {
    if (storeId && !storeAccessLoading && hasAccess) {
      fetchOrders();
      const cleanup = setupRealtimeSubscription();
      return () => {
        try { cleanup && cleanup(); } catch {}
      };
    }
  }, [storeId, storeAccessLoading, hasAccess]);

  // Effect para gerenciar som em loop sem duplicação
  useEffect(() => {
    if (pendingOrders.length > 0 && soundEnabled) {
      playOrderAlertLoop(selectedSound);
    } else {
      stopOrderAlertLoop();
    }
  }, [pendingOrders.length, soundEnabled, selectedSound]);

  const fetchOrders = async () => {
    // Aguardar validação de acesso
    if (!storeId || storeAccessLoading) {
      return;
    }

    setIsLoading(true);

    // SEGURANÇA: Filtrar pedidos pela loja validada
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast.error('Erro ao carregar pedidos. Tente recarregar a página.');
      setOrders([]);
    } else {
      setOrders(data || []);
      
      // Identificar pedidos na entrada
      const entranceOrders = (data || []).filter(o => o.status === 'entrada');
      if (entranceOrders.length > 0) {
        setPendingOrders(entranceOrders);
        
        // Mostrar popup apenas para pedidos não visualizados ainda
        const unshownOrders = entranceOrders.filter(o => !shownAlertIds.has(o.id));
        if (unshownOrders.length > 0) {
          setAlertOrder(unshownOrders[0]);
          setShownAlertIds(prev => new Set(prev).add(unshownOrders[0].id));
        }
        
        if (soundEnabled) {
          playOrderAlertLoop(selectedSound);
        }
      }
    }
    setIsLoading(false);
  };

  const setupRealtimeSubscription = () => {
    if (!storeId) return;

    const ordersChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}` // SEGURANÇA: Filtrar por loja
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order;
            setOrders((prev) => [newOrder, ...prev]);
            
            // Se for pedido na entrada, adicionar à fila de alertas
            if (newOrder.status === 'entrada' && !shownAlertIds.has(newOrder.id)) {
              setPendingOrders((prev) => [...prev, newOrder]);
              setAlertOrder(newOrder);
              setShownAlertIds(prev => new Set(prev).add(newOrder.id));
              
              // Tocar som em loop se som estiver ativado
        if (soundEnabled) {
          playOrderAlertLoop(selectedSound);
        }
              
              toast.success('Novo pedido recebido!', {
                description: `Pedido ${newOrder.order_number} - ${newOrder.customer_name}`
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedOrder = payload.new as Order;
            const oldOrder = payload.old as Order;
            
            setOrders((prev) =>
              prev.map((order) =>
                order.id === updatedOrder.id ? updatedOrder : order
              )
            );
            
            // Se o pedido VOLTOU para status "entrada" (mudou de outro status para entrada)
            if (updatedOrder.status === 'entrada' && oldOrder.status !== 'entrada') {
              // Adicionar à fila de alertas
              setPendingOrders((prev) => {
                // Verificar se já não está na fila
                if (prev.some(o => o.id === updatedOrder.id)) {
                  return prev;
                }
                return [...prev, updatedOrder];
              });
              
              // Se não há alerta ativo, definir este como o alerta
              setAlertOrder((current) => {
                if (!current) {
                  setShownAlertIds(prev => new Set(prev).add(updatedOrder.id));
                  return updatedOrder;
                }
                return current;
              });
              
              // Tocar som em loop se som estiver ativado
              if (soundEnabled) {
                playOrderAlertLoop(selectedSound);
              }
              
              toast.info('Pedido voltou para Entrada!', {
                description: `Pedido ${updatedOrder.order_number} - ${updatedOrder.customer_name}`
              });
            }
            // Se o pedido saiu do status "entrada", remover da fila de alertas
            else if (updatedOrder.status !== 'entrada') {
              setPendingOrders((prev) => prev.filter(o => o.id !== updatedOrder.id));
              
              // Se era o pedido atual do alerta, passar para o próximo ou fechar
              if (alertOrder?.id === updatedOrder.id) {
                const remaining = pendingOrders.filter(o => o.id !== updatedOrder.id);
                if (remaining.length > 0) {
                  setAlertOrder(remaining[0]);
                } else {
                  setAlertOrder(null);
                  stopOrderAlertLoop();
                }
              }
            }
          }
        }
      )
      .subscribe();

    // Subscription para delivery_assignments (notificar quando entregador aceitar)
    const assignmentsChannel = supabase
      .channel('assignments-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'delivery_assignments'
        },
        async (payload) => {
          const assignment = payload.new;
          
          // Buscar dados do entregador
          const { data: driver } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', assignment.delivery_driver_id)
            .single();
          
          // Buscar dados do pedido
          const { data: order } = await supabase
            .from('orders')
            .select('order_number')
            .eq('id', assignment.order_id)
            .single();
          
          toast.success(`🚴 Entregador aceitou pedido!`, {
            description: `${driver?.full_name || 'Entregador'} aceitou o pedido ${order?.order_number || ''}`
          });
          
          // Atualizar lista de pedidos
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(assignmentsChannel);
      stopOrderAlertLoop();
    };
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || destination.droppableId === source.droppableId) {
      return;
    }

    const newStatus = destination.droppableId as OrderStatus;
    const order = orders.find(o => o.id === draggableId);

    if (!order) return;

    // Atualizar localmente primeiro
    setOrders((prev) =>
      prev.map((o) =>
        o.id === draggableId ? { ...o, status: newStatus } : o
      )
    );

    // Atualizar fila de alertas imediatamente para evitar loop persistente
    if (order.status === 'entrada' && newStatus !== 'entrada') {
      setPendingOrders((prev) => prev.filter((o) => o.id !== order.id));
      if (alertOrder?.id === order.id) {
        const remaining = pendingOrders.filter((o) => o.id !== order.id);
        setAlertOrder(remaining.length > 0 ? remaining[0] : null);
      }
    } else if (order.status !== 'entrada' && newStatus === 'entrada') {
      setPendingOrders((prev) => (prev.some((o) => o.id === order.id) ? prev : [...prev, { ...order, status: newStatus } as Order]));
      if (!alertOrder) {
        setAlertOrder({ ...order, status: newStatus } as Order);
      }
    }

    // Atualizar no banco
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (newStatus === 'concluido') {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', draggableId);

    if (error) {
      toast.error('Erro ao atualizar status');
      console.error(error);
      // Reverter mudança local
      setOrders((prev) =>
        prev.map((o) =>
          o.id === draggableId ? { ...o, status: order.status } : o
        )
      );
    } else {
      toast.success('Status atualizado!');
    }
  };

  const handleTestSound = async () => {
    const success = await playNewOrderSound(selectedSound);
    if (success) {
      toast.success('Som de notificação tocado! 🔊');
    } else {
      toast.error('Não foi possível tocar o som', {
        description: 'Verifique as permissões do navegador'
      });
    }
  };

  const handleToggleSound = (checked: boolean) => {
    setSoundEnabled(checked);
    if (checked) {
      toast.success('Som de notificação ativado! 🔊', {
        description: 'Você receberá alertas sonoros de novos pedidos'
      });
    } else {
      toast.info('Som de notificação desativado', {
        description: 'Você não receberá alertas sonoros de novos pedidos'
      });
      stopOrderAlertLoop();
    }
  };

  const unlockAudio = async () => {
    const success = await playNewOrderSound(selectedSound);
    if (success) {
      setAudioUnlocked(true);
      toast.success('Som desbloqueado! 🔊', {
        description: 'Agora você receberá alertas sonoros'
      });
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    const updateData: any = {
      status: 'em_preparo',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      toast.error('Erro ao aceitar pedido');
      console.error(error);
      return;
    }

    toast.success('Pedido aceito e movido para Em Preparo!');
    
    // Remover da fila e passar para o próximo
    const remaining = pendingOrders.filter(o => o.id !== orderId);
    setPendingOrders(remaining);
    
    if (remaining.length > 0) {
      setAlertOrder(remaining[0]);
    } else {
      setAlertOrder(null);
      stopOrderAlertLoop();
    }
    
    // Verificar se deve imprimir automaticamente
    const order = orders.find(o => o.id === orderId);
    if (order) {
      // Buscar configuração de impressão
      const { data: config } = await supabase
        .from('print_configurations')
        .select('auto_print_on_accept')
        .eq('store_id', order.store_id)
        .eq('document_type', 'complete')
        .eq('is_active', true)
        .single();

      if (config?.auto_print_on_accept) {
        // Buscar nome da loja
        const { data: storeData } = await supabase
          .from('stores')
          .select('name')
          .eq('id', order.store_id)
          .single();

        toast.info('Abrindo impressão...');
        await printOrder(order as any, storeData?.name || 'Loja');
      }
    }
    
    fetchOrders();
  };

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
    setViewedOrderIds(prev => new Set(prev).add(order.id));
    
    // Remover da fila de alertas
    setPendingOrders((prev) => prev.filter(o => o.id !== order.id));
    
    // Passar para o próximo alerta
    const remaining = pendingOrders.filter(o => o.id !== order.id);
    if (remaining.length > 0) {
      setAlertOrder(remaining[0]);
    } else {
      setAlertOrder(null);
      stopOrderAlertLoop();
    }
  };

  const getFilteredOrders = () => {
    return orders.filter((order) => {
      const matchesSearch =
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone.includes(searchTerm);

      const matchesPayment = paymentStatusFilter === 'all' || order.payment_status === paymentStatusFilter;
      const matchesDelivery = deliveryTypeFilter === 'all' || order.delivery_type === deliveryTypeFilter;

      return matchesSearch && matchesPayment && matchesDelivery;
    });
  };

  const getOrdersByStatus = (status: OrderStatus, limit?: number) => {
    const filtered = getFilteredOrders().filter((order) => order.status === status);
    
    // Se for status "concluido", ordenar por data de conclusão (mais recentes primeiro)
    if (status === 'concluido') {
      const sorted = filtered.sort((a, b) => {
        const dateA = new Date(a.completed_at || a.updated_at).getTime();
        const dateB = new Date(b.completed_at || b.updated_at).getTime();
        return dateB - dateA;
      });
      return limit ? sorted.slice(0, limit) : sorted;
    }
    
    return filtered;
  };

  const loadMoreFinishedOrders = () => {
    setIsLoadingMoreFinished(true);
    // Simular pequeno delay para UX
    setTimeout(() => {
      setFinishedOrdersVisible(prev => prev + 5);
      setIsLoadingMoreFinished(false);
    }, 300);
  };

  const handleBatchPrint = async () => {
    if (selectedOrderIds.size === 0) {
      toast.error('Selecione pelo menos um pedido para imprimir');
      return;
    }

    setIsPrintingBatch(true);

    try {
      const ordersToprint = orders.filter(o => selectedOrderIds.has(o.id));
      
      // Buscar nome da loja
      const firstOrder = ordersToprint[0];
      const { data: storeData } = await supabase
        .from('stores')
        .select('name')
        .eq('id', firstOrder.store_id)
        .single();

      const storeName = storeData?.name || 'Loja';

      toast.info(`Imprimindo ${ordersToprint.length} pedido(s)...`);

      // Imprimir cada pedido sequencialmente com pequeno delay
      for (let i = 0; i < ordersToprint.length; i++) {
        await printOrder(ordersToprint[i] as any, storeName);
        
        // Pequeno delay entre impressões para evitar conflitos
        if (i < ordersToprint.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      toast.success(`${ordersToprint.length} pedido(s) enviado(s) para impressão!`);
      setSelectedOrderIds(new Set());
    } catch (error) {
      console.error('Erro na impressão em lote:', error);
      toast.error('Erro ao imprimir pedidos');
    } finally {
      setIsPrintingBatch(false);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = (status: OrderStatus) => {
    const statusOrders = getOrdersByStatus(status);
    const allSelected = statusOrders.every(o => selectedOrderIds.has(o.id));
    
    setSelectedOrderIds(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        // Desmarcar todos desta coluna
        statusOrders.forEach(o => newSet.delete(o.id));
      } else {
        // Marcar todos desta coluna
        statusOrders.forEach(o => newSet.add(o.id));
      }
      return newSet;
    });
  };

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
  const todayOrders = filteredOrders.filter(
    (order) => new Date(order.created_at).toDateString() === new Date().toDateString()
  );
  const todayRevenue = todayOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const averageTicket = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0;

  return (
    <div className={`p-6 space-y-6 ${pendingOrders.length > 0 ? 'animate-screen-flash' : ''}`}>
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold">Pedidos</h1>
              <p className="text-muted-foreground">Gerencie seus pedidos em tempo real</p>
            </div>
            {pendingOrders.length > 0 && (
              <Badge 
                variant="destructive" 
                className="animate-pulse text-lg px-3 py-1"
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                {pendingOrders.length} {pendingOrders.length === 1 ? 'Novo' : 'Novos'}
              </Badge>
            )}
          </div>
        
        {/* Controles de Som e Criar Pedido */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={() => setCreateOrderDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Pedido
          </Button>
          
          {!audioUnlocked && soundEnabled && (
            <Button
              variant="default"
              size="sm"
              onClick={unlockAudio}
              className="gap-2 bg-orange-500 hover:bg-orange-600 animate-pulse"
            >
              <Bell className="h-4 w-4" />
              <span>Ativar Som</span>
            </Button>
          )}
          
          <SoundSelector />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestSound}
            className="gap-2"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Testar Som</span>
          </Button>
          
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-primary" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
            <Label htmlFor="sound-toggle" className="text-sm cursor-pointer">
              Som
            </Label>
            <Switch
              id="sound-toggle"
              checked={soundEnabled}
              onCheckedChange={handleToggleSound}
            />
          </div>
          </div>
        </div>
        
        {/* Impressão em Lote */}
        {selectedOrderIds.size > 0 && (
          <div className="flex items-center justify-between p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-3">
              <Printer className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {selectedOrderIds.size} pedido(s) selecionado(s)
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const allVisibleOrders = [
                    ...getOrdersByStatus('entrada'),
                    ...getOrdersByStatus('concluido', finishedOrdersVisible)
                  ];
                  const allSelected = allVisibleOrders.every(o => selectedOrderIds.has(o.id));
                  
                  if (allSelected) {
                    setSelectedOrderIds(new Set());
                  } else {
                    setSelectedOrderIds(new Set(allVisibleOrders.map(o => o.id)));
                  }
                }}
              >
                Selecionar Todos
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrderIds(new Set())}
              >
                Limpar
              </Button>
              <Button
                size="sm"
                onClick={handleBatchPrint}
                disabled={isPrintingBatch}
              >
                <Printer className="h-4 w-4 mr-2" />
                {isPrintingBatch ? 'Imprimindo...' : 'Imprimir Selecionados'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pedidos Hoje</p>
              <p className="text-3xl font-bold">{todayOrders.length}</p>
            </div>
            <ShoppingBag className="h-12 w-12 text-primary opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Receita do Dia</p>
              <p className="text-3xl font-bold">R$ {todayRevenue.toFixed(2)}</p>
            </div>
            <DollarSign className="h-12 w-12 text-green-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
              <p className="text-3xl font-bold">R$ {averageTicket.toFixed(2)}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-blue-500 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Card de Economia de Marketplace */}
      <div className="mb-6">
        <MarketplaceSavingsCard variant="compact" />
      </div>

      {/* Filters */}
      <OrderFilters
        searchTerm={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setFinishedOrdersVisible(5); // Reset ao filtrar
        }}
        paymentStatusFilter={paymentStatusFilter}
        onPaymentStatusChange={(value) => {
          setPaymentStatusFilter(value);
          setFinishedOrdersVisible(5); // Reset ao filtrar
        }}
        deliveryTypeFilter={deliveryTypeFilter}
        onDeliveryTypeChange={(value) => {
          setDeliveryTypeFilter(value);
          setFinishedOrdersVisible(5); // Reset ao filtrar
        }}
        onClearFilters={() => {
          setSearchTerm("");
          setPaymentStatusFilter('all');
          setDeliveryTypeFilter('all');
          setFinishedOrdersVisible(5); // Reset ao limpar filtros
        }}
      />

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

      {/* Kanban Board */}
      {orders.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
          <KanbanColumn
            id="entrada"
            title="Entrada"
            icon={Inbox}
            count={getOrdersByStatus('entrada').length}
            color="bg-blue-500"
          >
            {getOrdersByStatus('entrada').map((order, index) => (
              <Draggable key={order.id} draggableId={order.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <OrderCard
                      order={order}
                      onClick={() => {
                        setSelectedOrder(order);
                        setDetailDialogOpen(true);
                        setViewedOrderIds(prev => new Set(prev).add(order.id));
                      }}
                      isDragging={snapshot.isDragging}
                      isViewed={viewedOrderIds.has(order.id)}
                      isSelected={selectedOrderIds.has(order.id)}
                      onSelectChange={(selected) => toggleOrderSelection(order.id)}
                      onPrint={() => toast.success('Impressão iniciada!')}
                    />
                  </div>
                )}
              </Draggable>
            ))}
          </KanbanColumn>

          <KanbanColumn
            id="em_preparo"
            title="Em Preparo"
            icon={ChefHat}
            count={getOrdersByStatus('em_preparo').length}
            color="bg-orange-500"
          >
            {getOrdersByStatus('em_preparo').map((order, index) => (
              <Draggable key={order.id} draggableId={order.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <OrderCard
                      order={order}
                      onClick={() => {
                        setSelectedOrder(order);
                        setDetailDialogOpen(true);
                        setViewedOrderIds(prev => new Set(prev).add(order.id));
                      }}
                      isDragging={snapshot.isDragging}
                      isViewed={viewedOrderIds.has(order.id)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
          </KanbanColumn>

          <KanbanColumn
            id="aguarda_retirada"
            title="Aguarda Retirada"
            icon={Package}
            count={getOrdersByStatus('aguarda_retirada').length}
            color="bg-purple-500"
          >
            {getOrdersByStatus('aguarda_retirada').map((order, index) => (
              <Draggable key={order.id} draggableId={order.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <OrderCard
                      order={order}
                      onClick={() => {
                        setSelectedOrder(order);
                        setDetailDialogOpen(true);
                        setViewedOrderIds(prev => new Set(prev).add(order.id));
                      }}
                      isDragging={snapshot.isDragging}
                      isViewed={viewedOrderIds.has(order.id)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
          </KanbanColumn>

            <KanbanColumn
              id="em_transito"
              title="Em Trânsito"
              icon={Truck}
              count={getOrdersByStatus('em_transito').length}
              color="bg-green-500"
            >
              {getOrdersByStatus('em_transito').map((order, index) => (
                <Draggable key={order.id} draggableId={order.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <OrderCard
                        order={order}
                        onClick={() => {
                          setSelectedOrder(order);
                          setDetailDialogOpen(true);
                          setViewedOrderIds(prev => new Set(prev).add(order.id));
                        }}
                        isDragging={snapshot.isDragging}
                        isViewed={viewedOrderIds.has(order.id)}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
            </KanbanColumn>

            <KanbanColumn
              id="concluido"
              title="Finalizados"
              icon={CheckCircle2}
              count={getOrdersByStatus('concluido').length}
              color="bg-emerald-500"
              collapsible={true}
              defaultCollapsed={false}
              onLoadMore={loadMoreFinishedOrders}
              hasMore={getOrdersByStatus('concluido').length > finishedOrdersVisible}
              isLoadingMore={isLoadingMoreFinished}
            >
              {getOrdersByStatus('concluido', finishedOrdersVisible).map((order, index) => (
                <Draggable key={order.id} draggableId={order.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <OrderCard
                        order={order}
                        onClick={() => {
                          setSelectedOrder(order);
                          setDetailDialogOpen(true);
                          setViewedOrderIds(prev => new Set(prev).add(order.id));
                        }}
                        isDragging={snapshot.isDragging}
                        isViewed={viewedOrderIds.has(order.id)}
                        isSelected={selectedOrderIds.has(order.id)}
                        onSelectChange={(selected) => toggleOrderSelection(order.id)}
                        onPrint={() => toast.success('Impressão iniciada!')}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
            </KanbanColumn>
          </div>
        </DragDropContext>
      )}

      {/* Order Detail Dialog */}
      <OrderDetailDialog
        order={selectedOrder}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onStatusChange={fetchOrders}
      />
      
      {/* Create Order Dialog */}
      <CreateOrderDialog
        open={createOrderDialogOpen}
        onOpenChange={setCreateOrderDialogOpen}
        onSuccess={fetchOrders}
      />

      {/* New Order Alert Dialog */}
      <NewOrderAlertDialog
        order={alertOrder}
        open={!!alertOrder}
        onAccept={handleAcceptOrder}
        onViewDetails={handleViewOrderDetails}
      />
    </div>
  );
};

export default OrdersPage;
