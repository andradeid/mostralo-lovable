import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DragDropContext, Draggable, DropResult } from "react-beautiful-dnd";
import { supabase } from "@/integrations/supabase/client";
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { NotificationPermissionDialog } from '@/components/delivery/NotificationPermissionDialog';
import { Database } from "@/integrations/supabase/types";
import { KanbanColumn } from "@/components/admin/orders/KanbanColumn";
import { KanbanCombinedColumn } from "@/components/admin/orders/KanbanCombinedColumn";
import { OrderCard } from "@/components/admin/orders/OrderCard";
import { OrderDetailDialog } from "@/components/admin/orders/OrderDetailDialog";
import { OrderFilters } from "@/components/admin/orders/OrderFilters";
import { CreateOrderDialog } from "@/components/admin/orders/CreateOrderDialog";
import { toast } from "sonner";
import { Inbox, ChefHat, Package, Truck, DollarSign, ShoppingBag, TrendingUp, Bell, Volume2, VolumeX, Plus, AlertCircle, CheckCircle2, Printer, Loader2, Settings, ChevronDown, ChevronUp, Maximize2, Minimize2, HelpCircle } from "lucide-react";
import { OrdersPageTutorial } from "@/components/admin/orders/OrdersPageTutorial";
import { useSidebar } from "@/components/ui/sidebar";
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
import { SystemBanner } from "@/components/admin/SystemBanner";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePasswordCallConfig } from "@/hooks/usePasswordCallConfig";
import { FloatingPasswordKeypad } from "@/components/signage/FloatingPasswordKeypad";

type Order = Database['public']['Tables']['orders']['Row'];
type OrderStatus = Database['public']['Enums']['order_status'];
type PaymentStatus = Database['public']['Enums']['payment_status'];
type DeliveryType = Database['public']['Enums']['delivery_type'];

const OrdersPage = () => {
  // Hook de segurança - valida acesso à loja
  const { storeId, isLoading: storeAccessLoading, hasAccess } = useStoreAccess();
  const { config: passwordCallConfig } = usePasswordCallConfig(storeId);
  const [searchParams, setSearchParams] = useSearchParams();

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
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(() => {
    // Verificar se já foi desbloqueado nesta sessão
    return sessionStorage.getItem('audioUnlocked') === 'true';
  });
  const [audioBlocked, setAudioBlocked] = useState(false);
  
  const [viewedOrderIds, setViewedOrderIds] = useState<Set<string>>(new Set());
  const [selectedSound, setSelectedSound] = useState<NotificationSound>(getSelectedSound());
  
  // Estados para paginação da coluna "Finalizados"
  const [finishedOrdersVisible, setFinishedOrdersVisible] = useState(5);
  const [isLoadingMoreFinished, setIsLoadingMoreFinished] = useState(false);

  // Estados para impressão em lote
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [isPrintingBatch, setIsPrintingBatch] = useState(false);

  // Estado para seção de configurações colapsável
  const [configExpanded, setConfigExpanded] = useState<boolean>(() => {
    const saved = localStorage.getItem('ordersConfigExpanded');
    return saved === 'true'; // Padrão: fechado
  });

  // Estado para modo tela cheia do Kanban
  const [isFullscreen, setIsFullscreen] = useState<boolean>(true);

  // Estado para tutorial de onboarding
  const [showTutorial, setShowTutorial] = useState<boolean>(() => {
    return localStorage.getItem('ordersPageTutorialHidden') !== 'true';
  });
  const [tutorialStep, setTutorialStep] = useState(0);

  // Classe de destaque para botões durante tutorial
  const getHighlightClass = (buttonType: 'exit' | 'config' | 'help') => {
    if (!showTutorial) return '';
    const stepMap = { exit: 0, config: 1, help: 2 };
    if (tutorialStep === stepMap[buttonType]) {
      return 'ring-2 ring-primary ring-offset-2 relative z-[60] animate-pulse bg-white';
    }
    return '';
  };

  // Hook do sidebar para controlar colapso
  const { setOpen: setSidebarOpen } = useSidebar();

  // Hook para detectar tela grande (lg+)
  const isLargeScreen = useMediaQuery('(min-width: 1024px)');

  // Hook para browser notifications
  const { 
    showPermissionDialog, 
    setShowPermissionDialog,
    requestPermission,
    sendNotification,
    permission
  } = useNotificationPermission();

  useEffect(() => {
    localStorage.setItem('orderSoundEnabled', String(soundEnabled));
  }, [soundEnabled]);

  // Persistir estado da seção colapsável
  useEffect(() => {
    localStorage.setItem('ordersConfigExpanded', String(configExpanded));
  }, [configExpanded]);

  // Toggle e persistência do modo tela cheia
  const toggleFullscreen = () => {
    const newState = !isFullscreen;
    setIsFullscreen(newState);
    localStorage.setItem('kanbanFullscreen', String(newState));
    
    // Dispara evento para AdminLayout ocultar/mostrar header
    window.dispatchEvent(new CustomEvent('kanbanFullscreenChange', { 
      detail: { isFullscreen: newState } 
    }));
    
    // Colapsa ou expande sidebar
    setSidebarOpen(!newState);
  };

  // Atalho Escape para sair do modo tela cheia
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Sincronizar estado do fullscreen ao montar (caso venha do localStorage)
  useEffect(() => {
    if (isFullscreen) {
      window.dispatchEvent(new CustomEvent('kanbanFullscreenChange', { 
        detail: { isFullscreen: true } 
      }));
      setSidebarOpen(false);
    }
    
    // Cleanup: restaurar ao desmontar
    return () => {
      if (isFullscreen) {
        window.dispatchEvent(new CustomEvent('kanbanFullscreenChange', { 
          detail: { isFullscreen: false } 
        }));
      }
    };
  }, []);

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

  // Polling automático iFood a cada 30 segundos
  useEffect(() => {
    if (!storeId || storeAccessLoading || !hasAccess) return;

    const pollIFoodEvents = async () => {
      try {
        // Verificar se existe integração iFood ativa
        const { data: integration } = await supabase
          .from('ifood_integrations')
          .select('is_active, access_token, token_expires_at')
          .eq('store_id', storeId)
          .maybeSingle();

        if (!integration?.is_active || !integration?.access_token) {
          return;
        }

        // Verificar se token não está expirado
        if (integration.token_expires_at && new Date(integration.token_expires_at) < new Date()) {
          return;
        }

        console.log('[iFood] Polling automático de pedidos...');
        
        const { data, error } = await supabase.functions.invoke('ifood-webhook', {
          body: {
            action: 'poll_events',
            store_id: storeId
          }
        });

        if (error) {
          console.error('[iFood] Erro no polling:', error);
          return;
        }

        if (data?.events_count > 0) {
          console.log(`[iFood] ${data.events_count} evento(s) recebido(s)`);
          toast.success(`iFood: ${data.events_count} novo(s) evento(s)`);
          // Os pedidos serão atualizados via realtime subscription
        }
      } catch (err) {
        console.error('[iFood] Erro no polling:', err);
      }
    };

    // Executar imediatamente e depois a cada 30 segundos
    pollIFoodEvents();
    const interval = setInterval(pollIFoodEvents, 30000);

    return () => clearInterval(interval);
  }, [storeId, storeAccessLoading, hasAccess]);

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

  // Verificar contexto de áudio ao carregar
  useEffect(() => {
    const checkAudioContext = async () => {
      if (sessionStorage.getItem('audioUnlocked') === 'true') {
        // Tentar tocar um som silencioso para verificar
        try {
          const audio = new Audio('/sounds/bell-1.mp3');
          audio.volume = 0.01; // Volume quase inaudível
          await audio.play();
          audio.pause();
          audio.currentTime = 0;
          setAudioUnlocked(true);
          setAudioBlocked(false);
        } catch {
          // Áudio bloqueado, precisa de interação
          sessionStorage.removeItem('audioUnlocked');
          setAudioUnlocked(false);
        }
      }
    };
    
    checkAudioContext();
  }, []);

  // Auto-desbloquear com qualquer interação do usuário
  useEffect(() => {
    if (audioUnlocked || !soundEnabled) return;

    const handleInteraction = async () => {
      try {
        const audio = new Audio('/sounds/bell-1.mp3');
        audio.volume = 0.01;
        await audio.play();
        audio.pause();
        setAudioUnlocked(true);
        sessionStorage.setItem('audioUnlocked', 'true');
        setAudioBlocked(false);
        
        // Remover listeners após sucesso
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('keydown', handleInteraction);
      } catch {
        // Ignorar falhas silenciosas
      }
    };

    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [audioUnlocked, soundEnabled]);

  // Effect para gerenciar som em loop sem duplicação
  useEffect(() => {
    if (pendingOrders.length > 0 && soundEnabled) {
      playOrderAlertLoop(selectedSound).then(success => {
        if (!success) {
          setAudioBlocked(true);
          toast.error('🔇 Som bloqueado pelo navegador!', {
            description: 'Clique no botão "Ativar Som" para receber alertas sonoros',
            duration: 10000,
          });
        } else {
          setAudioBlocked(false);
        }
      });
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
            if (newOrder.status === 'entrada') {
              setPendingOrders((prev) => [...prev, newOrder]);
              
              // Tocar som em loop se som estiver ativado
              if (soundEnabled) {
                playOrderAlertLoop(selectedSound).then(success => {
                  if (!success) {
                    setAudioBlocked(true);
                  }
                });
              }
              
              // Enviar browser notification (funciona em segundo plano!)
              sendNotification('🔔 Novo Pedido!', {
                body: `Pedido ${newOrder.order_number} - ${newOrder.customer_name}`,
                icon: '/favicon.png',
                badge: '/favicon.png'
              });
              
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
              
              // Tocar som em loop se som estiver ativado
              if (soundEnabled) {
                playOrderAlertLoop(selectedSound).then(success => {
                  if (!success) {
                    setAudioBlocked(true);
                  }
                });
              }
              
              toast.info('Pedido voltou para Entrada!', {
                description: `Pedido ${updatedOrder.order_number} - ${updatedOrder.customer_name}`
              });
            }
            // Se o pedido saiu do status "entrada", remover da fila de alertas
            else if (updatedOrder.status !== 'entrada') {
              setPendingOrders((prev) => prev.filter(o => o.id !== updatedOrder.id));
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
    } else if (order.status !== 'entrada' && newStatus === 'entrada') {
      setPendingOrders((prev) => (prev.some((o) => o.id === order.id) ? prev : [...prev, { ...order, status: newStatus } as Order]));
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
      setAudioUnlocked(true);
      setAudioBlocked(false);
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
      sessionStorage.setItem('audioUnlocked', 'true'); // Persistir estado
      setAudioBlocked(false);
      toast.success('Som desbloqueado! 🔊', {
        description: 'Agora você receberá alertas sonoros'
      });
      
      // Reativar loop se houver pedidos pendentes
      if (pendingOrders.length > 0 && soundEnabled) {
        playOrderAlertLoop(selectedSound);
      }
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
    
    // Remover da fila
    const remaining = pendingOrders.filter(o => o.id !== orderId);
    setPendingOrders(remaining);
    
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
    const filtered = getFilteredOrders().filter((order) => {
      // Para "concluido", incluir também pedidos "cancelado"
      if (status === 'concluido') {
        return order.status === 'concluido' || order.status === 'cancelado';
      }
      return order.status === status;
    });
    
    // Se for status "concluido", ordenar por data de conclusão (mais recentes primeiro)
    if (status === 'concluido') {
      const sorted = filtered.sort((a, b) => {
        const dateA = new Date(a.completed_at || a.cancelled_at || a.updated_at).getTime();
        const dateB = new Date(b.completed_at || b.cancelled_at || b.updated_at).getTime();
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
    <div className={`p-2 sm:p-3 lg:p-4 space-y-2 sm:space-y-3 ${pendingOrders.length > 0 ? 'animate-screen-flash' : ''}`}>
      {/* Header - Grid de 3 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-[20%_60%_20%] gap-4 items-start">
        {/* Coluna Esquerda - Título e Configurações */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-2xl font-bold truncate">Pedidos</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Gerencie seus pedidos em tempo real</p>
            </div>
            {pendingOrders.length > 0 && (
              <Badge 
                variant="destructive" 
                className="animate-pulse text-sm px-2 py-0.5 flex-shrink-0"
              >
                <AlertCircle className="h-3 w-3 mr-1" />
                {pendingOrders.length} {pendingOrders.length === 1 ? 'Novo' : 'Novos'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfigExpanded(!configExpanded)}
              className={`gap-1 ${getHighlightClass('config')}`}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
              {configExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant={isFullscreen ? "default" : "outline"}
              size="sm"
              onClick={toggleFullscreen}
              className={`gap-1 ${getHighlightClass('exit')}`}
              title={isFullscreen ? "Sair da tela cheia (Esc)" : "Modo tela cheia"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Tela Cheia</span>
                </>
              )}
            </Button>
            
            {/* Botão de Ajuda */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTutorial(true)}
              title="Ver instruções"
              className={`px-2 ${getHighlightClass('help')}`}
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Coluna Central - Banner */}
        <div className="flex items-center justify-center order-first lg:order-none">
          <div className="w-full">
            <SystemBanner position="orders_page" />
          </div>
        </div>

        {/* Coluna Direita - Criar Pedido e Stats */}
        <div className="flex flex-col items-start lg:items-end gap-2">
          <Button 
            onClick={() => setCreateOrderDialogOpen(true)} 
            size="sm"
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="sm:hidden">Novo</span>
            <span className="hidden sm:inline">Criar Pedido</span>
          </Button>
          {!configExpanded && (
            <div className="flex items-center gap-2 flex-wrap justify-start lg:justify-end">
              <Badge variant="secondary" className="text-xs">
                📊 {todayOrders.length} pedidos • R$ {todayRevenue.toFixed(2)}
              </Badge>
              {soundEnabled && (
                <Badge variant="outline" className="text-xs">
                  🔊 Som ativo
                </Badge>
              )}
              {permission === 'granted' && (
                <Badge variant="outline" className="text-xs">
                  🔔 Notificações
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-col gap-0">
        
        {/* Impressão em Lote - sempre visível */}
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

      {/* Seção Colapsável de Configurações */}
      {configExpanded && (
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
          {/* Controles de Som */}
          <div className="flex items-center gap-2 flex-wrap p-3 bg-muted/30 rounded-lg border">
            {!audioUnlocked && soundEnabled && (
              <Button
                variant="default"
                size="sm"
                onClick={unlockAudio}
                className="gap-1 sm:gap-2 bg-orange-500 hover:bg-orange-600 animate-pulse text-xs sm:text-sm h-8 sm:h-9"
              >
                <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Ativar Som</span>
              </Button>
            )}
            
            {permission !== 'granted' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPermissionDialog(true)}
                className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9"
              >
                <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Ativar Notificações</span>
                <span className="sm:hidden">Notif.</span>
              </Button>
            )}
            
            <SoundSelector />
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestSound}
              className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9"
            >
              <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Testar</span>
            </Button>
            
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border bg-card">
              {soundEnabled ? (
                <Volume2 className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
              ) : (
                <VolumeX className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              )}
              <Label htmlFor="sound-toggle" className="text-xs sm:text-sm cursor-pointer hidden sm:block">
                Som
              </Label>
              <Switch
                id="sound-toggle"
                checked={soundEnabled}
                onCheckedChange={handleToggleSound}
                className="scale-90 sm:scale-100"
              />
            </div>
          </div>

          {/* Banner de Alerta de Som Bloqueado */}
          {soundEnabled && audioBlocked && (
            <Card className="bg-orange-500/10 border-orange-500/50">
              <div className="p-4 flex items-center justify-between gap-4 flex-col sm:flex-row">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <AlertCircle className="h-6 w-6 text-orange-500 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-orange-700 dark:text-orange-400">
                      ⚠️ Som de Notificação Bloqueado
                    </h3>
                    <p className="text-sm text-orange-600 dark:text-orange-300">
                      Clique no botão ao lado para ativar o som e receber alertas de novos pedidos
                    </p>
                  </div>
                </div>
                <Button
                  onClick={unlockAudio}
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0 w-full sm:w-auto"
                >
                  <Volume2 className="h-5 w-5 mr-2" />
                  Ativar Som
                </Button>
              </div>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 min-w-[320px]">
              <MarketplaceSavingsCard variant="inline" />
              
              <Card className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Pedidos Hoje</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{todayOrders.length}</p>
                  </div>
                  <ShoppingBag className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-primary opacity-20 flex-shrink-0" />
                </div>
              </Card>

              <Card className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Receita do Dia</p>
                    <p className="text-lg sm:text-xl lg:text-3xl font-bold truncate">R$ {todayRevenue.toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-green-500 opacity-20 flex-shrink-0" />
                </div>
              </Card>

              <Card className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Ticket Médio</p>
                    <p className="text-lg sm:text-xl lg:text-3xl font-bold truncate">R$ {averageTicket.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-blue-500 opacity-20 flex-shrink-0" />
                </div>
              </Card>
            </div>
          </div>

          {/* Filters */}
          <OrderFilters
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
        </div>
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
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="relative">
            {/* Indicador de scroll - gradiente nas bordas */}
            <div className="absolute left-0 top-0 bottom-4 w-4 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none sm:hidden" />
            <div className="absolute right-0 top-0 bottom-4 w-4 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none sm:hidden" />
            
            <div className="flex gap-2 sm:gap-3 lg:gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)] scroll-smooth snap-x snap-mandatory sm:snap-none -mx-3 sm:mx-0 px-3 sm:px-0">
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

          {/* Em Preparo + Aguarda Retirada - Responsivo */}
          {isLargeScreen ? (
            // Desktop: 2 colunas separadas
            <>
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
            </>
          ) : (
            // Mobile/Tablet: colunas combinadas (empilhadas)
            <KanbanCombinedColumn
              sections={[
                {
                  id: "em_preparo",
                  title: "Em Preparo",
                  icon: ChefHat,
                  count: getOrdersByStatus('em_preparo').length,
                  color: "bg-orange-500",
                  children: getOrdersByStatus('em_preparo').map((order, index) => (
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
                  ))
                },
                {
                  id: "aguarda_retirada",
                  title: "Aguarda Retirada",
                  icon: Package,
                  count: getOrdersByStatus('aguarda_retirada').length,
                  color: "bg-purple-500",
                  children: getOrdersByStatus('aguarda_retirada').map((order, index) => (
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
                  ))
                }
              ]}
            />
          )}

          {isLargeScreen ? (
            <>
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
            </>
          ) : (
            <KanbanCombinedColumn
              sections={[
                {
                  id: "em_transito",
                  title: "Em Trânsito",
                  icon: Truck,
                  count: getOrdersByStatus('em_transito').length,
                  color: "bg-green-500",
                  children: getOrdersByStatus('em_transito').map((order, index) => (
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
                  ))
                },
                {
                  id: "concluido",
                  title: "Finalizados",
                  icon: CheckCircle2,
                  count: getOrdersByStatus('concluido').length,
                  color: "bg-emerald-500",
                  onLoadMore: loadMoreFinishedOrders,
                  hasMore: getOrdersByStatus('concluido').length > finishedOrdersVisible,
                  isLoadingMore: isLoadingMoreFinished,
                  children: getOrdersByStatus('concluido', finishedOrdersVisible).map((order, index) => (
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
                  ))
                }
              ]}
            />
          )}
            </div>
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

      {/* Notification Permission Dialog */}
      <NotificationPermissionDialog
        open={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
        onRequestPermission={requestPermission}
      />

      {/* Tutorial de Onboarding */}
      <OrdersPageTutorial
        open={showTutorial}
        onComplete={(dontShowAgain) => {
          if (dontShowAgain) {
            localStorage.setItem('ordersPageTutorialHidden', 'true');
          }
          setShowTutorial(false);
          setTutorialStep(0);
        }}
        onStepChange={setTutorialStep}
      />

      {/* Teclado flutuante de chamada de senhas */}
      {storeId && passwordCallConfig?.is_enabled && passwordCallConfig?.show_in_orders_page && (
        <FloatingPasswordKeypad storeId={storeId} config={passwordCallConfig} />
      )}
    </div>
  );
};

export default OrdersPage;
