import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Loader2, Clock, Package, CheckCircle, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { playNewOrderSound, playOrderAlertLoop, stopOrderAlertLoop } from '@/utils/soundPlayer';
import { AvailableOrderDetailDialog } from '@/components/delivery/AvailableOrderDetailDialog';
import { MyOrderDetailDialog } from '@/components/delivery/MyOrderDetailDialog';
import { DeliveryStatusHeader } from '@/components/delivery/DeliveryStatusHeader';
import { ActiveDeliveriesSection } from '@/components/delivery/ActiveDeliveriesSection';
import { AvailableOrdersSection } from '@/components/delivery/AvailableOrdersSection';
import { CompletedDeliveriesSection } from '@/components/delivery/CompletedDeliveriesSection';
import { NewDeliveryOrderAlertDialog } from '@/components/delivery/NewDeliveryOrderAlertDialog';
import { calculateDriverEarnings, type EarningsConfig } from '@/utils/driverEarnings';
import { PWAInstallPrompt } from '@/components/delivery/PWAInstallPrompt';
import { NotificationPermissionDialog } from '@/components/delivery/NotificationPermissionDialog';
import { useNotificationPermission } from '@/hooks/useNotificationPermission';
import { CollapsibleSection } from '@/components/delivery/CollapsibleSection';
import { Separator } from '@/components/ui/separator';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total: number;
  subtotal: number;
  delivery_fee: number;
  status: string;
  delivery_type: string;
  created_at: string;
  notes?: string;
  store_id: string;
  assigned_driver_id?: string | null;
}

interface Assignment {
  id: string;
  order_id: string;
  delivery_driver_id: string;
  status: string;
  assigned_at: string;
  accepted_at?: string;
  picked_up_at?: string;
  delivered_at?: string;
  orders: Order | null;
}

export default function DeliveryDriverPanel() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [myAssignments, setMyAssignments] = useState<Assignment[]>([]);
  const [completedAssignments, setCompletedAssignments] = useState<Assignment[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() => {
    const saved = localStorage.getItem('delivery_driver_online');
    return saved === null ? true : saved === 'true';
  });
  const [todayStats, setTodayStats] = useState({
    total: 0,
    completed: 0,
    totalEarned: 0
  });
  const [earningsConfig, setEarningsConfig] = useState<EarningsConfig | undefined>(undefined);
  const [selectedAvailableOrder, setSelectedAvailableOrder] = useState<Order | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('orderSoundEnabled');
    return saved !== 'false';
  });
  const [unviewedOrders, setUnviewedOrders] = useState<Set<string>>(new Set());
  const [alertOrder, setAlertOrder] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem('delivery_view_mode');
    return (saved as 'grid' | 'list') || 'grid';
  });
  
  const { 
    showPermissionDialog, 
    setShowPermissionDialog,
    requestPermission,
    sendNotification 
  } = useNotificationPermission();

  useEffect(() => {
    localStorage.setItem('delivery_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('orderSoundEnabled', String(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    if (alertOrder && soundEnabled && isOnline) {
      playOrderAlertLoop();
    } else {
      stopOrderAlertLoop();
    }
  }, [alertOrder, soundEnabled, isOnline]);

  useEffect(() => {
    if (profile?.id) {
      fetchStoreAndOrders();
    }
  }, [profile]);

  useEffect(() => {
    const handleOnlineStatusChange = (event: CustomEvent<{ isOnline: boolean }>) => {
      setIsOnline(event.detail.isOnline);
    };

    window.addEventListener('onlineStatusChange', handleOnlineStatusChange as EventListener);
    return () => {
      window.removeEventListener('onlineStatusChange', handleOnlineStatusChange as EventListener);
    };
  }, []);

  // 🔄 Subscription Realtime para novos pedidos e mudanças
  useEffect(() => {
    if (!storeId || !profile?.id) {
      console.log('⚠️ Subscription não configurada - faltando storeId ou profile.id', { storeId, profileId: profile?.id });
      return;
    }

    console.log('📡 Configurando subscription realtime para entregador:', {
      driverId: profile.id,
      storeId,
      isOnline,
      soundEnabled
    });

    // Canal único por entregador para evitar conflitos
    const channelName = `driver-orders-${profile.id}-${storeId}`;
    const ordersChannel = supabase.channel(channelName);

    // Handler para INSERT de novos pedidos
    ordersChannel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
        filter: `store_id=eq.${storeId}`,
      },
      async (payload) => {
        try {
          const newOrder = payload.new as Order;
          console.log('📦 [INSERT] Novo pedido criado:', {
            orderId: newOrder.id,
            orderNumber: newOrder.order_number,
            status: newOrder.status,
            deliveryType: newOrder.delivery_type,
            assignedDriverId: newOrder.assigned_driver_id
          });

          // Verificar se é um pedido disponível para este entregador
          if (
            newOrder.delivery_type === 'delivery' &&
            newOrder.status === 'em_preparo' &&
            !newOrder.assigned_driver_id
          ) {
            console.log('✅ Pedido disponível detectado no INSERT!', newOrder.order_number);
            
            setAvailableOrders(prev => {
              // Evitar duplicatas
              if (prev.some(o => o.id === newOrder.id)) {
                console.log('⚠️ Pedido já está na lista, atualizando...');
                return prev.map(o => o.id === newOrder.id ? newOrder : o);
              }
              console.log('➕ Adicionando novo pedido à lista disponível');
              return [newOrder, ...prev];
            });

            // Mostrar alerta e tocar som apenas se entregador está online
            // Ler do localStorage para evitar stale closure
            const currentIsOnline = localStorage.getItem('delivery_driver_online') !== 'false';
            const currentSoundEnabled = localStorage.getItem('orderSoundEnabled') !== 'false';
            
            console.log('🔔 Verificando se deve mostrar alerta (INSERT):', {
              isOnline: currentIsOnline,
              soundEnabled: currentSoundEnabled
            });
            
            if (currentIsOnline) {
              console.log('🔔 Entregador online - mostrando alerta e tocando som');
              setAlertOrder(newOrder);
              if (currentSoundEnabled) {
                playNewOrderSound();
              }
              sendNotification('Novo pedido disponível!', {
                body: `Pedido #${newOrder.order_number} - ${newOrder.customer_name}`
              });
            } else {
              console.log('⚠️ Entregador offline - não mostrando alerta');
            }
          } else {
            console.log('ℹ️ Pedido não disponível:', {
              deliveryType: newOrder.delivery_type,
              status: newOrder.status,
              hasDriver: !!newOrder.assigned_driver_id
            });
          }
        } catch (error) {
          console.error('❌ Erro ao processar INSERT:', error);
        }
      }
    );

    // Handler para UPDATE de pedidos existentes
    ordersChannel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `store_id=eq.${storeId}`,
      },
      async (payload) => {
        try {
          const updatedOrder = payload.new as Order;
          const oldOrder = payload.old as Order;
          console.log('🔄 [UPDATE] Pedido atualizado:', {
            orderId: updatedOrder.id,
            orderNumber: updatedOrder.order_number,
            oldStatus: oldOrder.status,
            newStatus: updatedOrder.status,
            oldDriver: oldOrder.assigned_driver_id,
            newDriver: updatedOrder.assigned_driver_id
          });

          // Se mudou para 'em_preparo' e não tem entregador, adicionar aos disponíveis
          if (
            updatedOrder.delivery_type === 'delivery' &&
            updatedOrder.status === 'em_preparo' &&
            !updatedOrder.assigned_driver_id
          ) {
            // Verificar se o status realmente mudou de algo diferente para 'em_preparo'
            if (oldOrder.status !== 'em_preparo') {
              console.log('✅ Pedido agora disponível após mudança de status!', updatedOrder.order_number);
              
              setAvailableOrders(prev => {
                const existingIndex = prev.findIndex(o => o.id === updatedOrder.id);
                if (existingIndex >= 0) {
                  // Atualizar pedido existente
                  console.log('🔄 Atualizando pedido existente na lista');
                  const updated = [...prev];
                  updated[existingIndex] = updatedOrder;
                  return updated;
                }
                // Adicionar novo pedido
                console.log('➕ Adicionando pedido atualizado à lista disponível');
                return [updatedOrder, ...prev];
              });

              // Mostrar alerta se entregador está online (ler do localStorage para evitar stale closure)
              const currentIsOnline = localStorage.getItem('delivery_driver_online') !== 'false';
              const currentSoundEnabled = localStorage.getItem('orderSoundEnabled') !== 'false';
              
              console.log('🔔 Verificando se deve mostrar alerta (UPDATE):', {
                isOnline: currentIsOnline,
                soundEnabled: currentSoundEnabled
              });
              
              if (currentIsOnline) {
                console.log('🔔 Entregador online - mostrando alerta e tocando som');
                setAlertOrder(updatedOrder);
                if (currentSoundEnabled) {
                  playNewOrderSound();
                }
                sendNotification('Novo pedido disponível!', {
                  body: `Pedido #${updatedOrder.order_number} - ${updatedOrder.customer_name}`
                });
              }
            }
          }

          // Se foi atribuído a outro entregador, remover dos disponíveis
          if (updatedOrder.assigned_driver_id && updatedOrder.assigned_driver_id !== profile.id) {
            console.log('🚫 Pedido atribuído a outro entregador, removendo da lista');
            setAvailableOrders(prev => prev.filter(o => o.id !== updatedOrder.id));
          }

               // Atualizar pedidos em minhas entregas se foi atribuído a mim
               if (updatedOrder.assigned_driver_id === profile.id && oldOrder.assigned_driver_id !== profile.id) {
                 console.log('✅ Pedido atribuído a mim, recarregando lista');
                 fetchStoreAndOrders(); // Recarregar para pegar assignment
               }

               // ✅ STATUS MESTRE: Atualizar assignments quando o lojista mudar o status do pedido
               if (updatedOrder.assigned_driver_id === profile.id) {
                 console.log('🔄 Status do pedido atualizado pelo lojista:', {
                   orderId: updatedOrder.id,
                   oldStatus: oldOrder.status,
                   newStatus: updatedOrder.status
                 });
                 
                 // Atualizar assignment local para refletir novo status do pedido
                 setMyAssignments(prev => prev.map(a => {
                   if (a.orders && a.orders.id === updatedOrder.id) {
                     return {
                       ...a,
                       orders: { ...a.orders, status: updatedOrder.status } as any
                     };
                   }
                   return a;
                 }));
                 
                 // Recarregar se necessário para garantir sincronização
                 if (updatedOrder.status === 'aguarda_retirada' || updatedOrder.status === 'em_transito') {
                   fetchStoreAndOrders();
                 }
               }
        } catch (error) {
          console.error('❌ Erro ao processar UPDATE:', error);
        }
      }
    );

    // Estado para controlar se deve fazer polling (evita loop)
    let needsPolling = false;

    // Subscribe e tratar status
    ordersChannel.subscribe((status) => {
      console.log('📡 Status da subscription:', status, 'Channel:', channelName);
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscription ativa para entregador!');
        needsPolling = false; // Não precisa de polling se subscription está ativa
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        console.error('❌ Erro na subscription:', status);
        console.log('🔄 Usando fallback de polling para garantir atualizações');
        needsPolling = true; // Precisa de polling se subscription falhou
      }
    });

    // 🔄 FALLBACK: Polling periódico APENAS quando necessário
    // Verifica a cada 30 segundos se a subscription falhou e precisa de polling
    const pollingInterval = setInterval(() => {
      if (needsPolling) {
        console.log('🔄 Polling backup: subscription não ativa, buscando pedidos...');
        fetchStoreAndOrders();
      }
      // Se subscription está ativa (needsPolling = false), não faz nada - evita loop
    }, 30000); // 30 segundos para reduzir carga e evitar loop desnecessário

    return () => {
      console.log('🔌 Removendo subscription realtime e polling:', channelName);
      clearInterval(pollingInterval);
      supabase.removeChannel(ordersChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, profile?.id]); // Apenas estas dependências - evitar recriações

  const fetchStoreAndOrders = async () => {
    if (!profile?.id) return;

    try {
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('store_id')
        .eq('user_id', profile.id)
        .eq('role', 'delivery_driver')
        .single();

      if (!userRole?.store_id) {
        toast.error('Loja não encontrada');
        setLoading(false);
        return;
      }

      setStoreId(userRole.store_id);

      const { data: config } = await supabase
        .from('driver_earnings_config')
        .select('*')
        .eq('driver_id', profile.id)
        .eq('store_id', userRole.store_id)
        .eq('is_active', true)
        .single();

      if (config) {
        setEarningsConfig({
          payment_type: config.payment_type,
          fixed_amount: config.fixed_amount,
          commission_percentage: config.commission_percentage
        });
      }

      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('store_id', userRole.store_id)
        .eq('status', 'em_preparo')
        .is('assigned_driver_id', null)
        .order('created_at', { ascending: false });

      setAvailableOrders(orders || []);

      // ✅ STATUS MESTRE: Buscar pedidos baseado em orders.status (mestre do lojista)
      // Buscar pedidos que foram atribuídos a este entregador e estão em andamento
      const { data: allAssignments } = await supabase
        .from('delivery_assignments')
        .select('*, orders(*)')
        .eq('delivery_driver_id', profile.id)
        .order('assigned_at', { ascending: false });
      
      // Filtrar apenas pedidos com status 'aguarda_retirada' ou 'em_transito' (status mestre)
      const assignments = (allAssignments || []).filter((a: any) => 
        a.orders && (a.orders.status === 'aguarda_retirada' || a.orders.status === 'em_transito')
      );

      setMyAssignments(assignments || []);

      // Buscar pedidos finalizados dos últimos 7 dias
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: completed, error: completedError } = await supabase
        .from('delivery_assignments')
        .select(`
          *,
          orders(*),
          driver_earnings:driver_earnings!driver_earnings_delivery_assignment_id_fkey(
            earnings_amount,
            payment_type
          )
        `)
        .eq('delivery_driver_id', profile.id)
        .eq('status', 'delivered')
        .gte('delivered_at', sevenDaysAgo.toISOString())
        .order('delivered_at', { ascending: false });
      
      if (completedError) throw completedError;
      setCompletedAssignments(completed || []);

      await fetchTodayStats(profile.id);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayStats = async (driverId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('driver_earnings')
      .select('*')
      .eq('driver_id', driverId)
      .gte('delivered_at', today.toISOString());

    if (data) {
      setTodayStats({
        total: data.length,
        completed: data.filter(e => e.payment_status === 'paid').length,
        totalEarned: data.reduce((sum, e) => sum + e.earnings_amount, 0)
      });
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!profile?.id || !storeId) return;

    try {
      const { data: assignment, error } = await supabase
        .from('delivery_assignments')
        .insert({
          order_id: orderId,
          delivery_driver_id: profile.id,
          store_id: storeId,
          status: 'assigned'
        })
        .select('*, orders(*)')
        .single();

      if (error) throw error;

      await supabase
        .from('orders')
        .update({ assigned_driver_id: profile.id })
        .eq('id', orderId);

      setMyAssignments(prev => [assignment, ...prev]);
      setAvailableOrders(prev => prev.filter(o => o.id !== orderId));
      setSelectedAvailableOrder(null);

      toast.success('Pedido aceito!');
    } catch (error) {
      console.error('Erro ao aceitar pedido:', error);
      toast.error('Erro ao aceitar pedido');
    }
  };

  // ✅ STATUS MESTRE: Atualizar orders.status para 'em_transito' quando entregador retirar
  const handleMarkAsPickedUp = async (assignmentId: string) => {
    try {
      // Buscar assignment para pegar order_id
      const assignment = myAssignments.find(a => a.id === assignmentId);
      if (!assignment?.orders) {
        toast.error('Pedido não encontrado');
        return;
      }

      // 1. Atualizar order.status para 'em_transito' (status mestre)
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'em_transito',
          updated_at: new Date().toISOString()
        })
        .eq('id', assignment.orders.id);

      if (orderError) throw orderError;

      // 2. Atualizar assignment.status para 'picked_up' (controle interno)
      const { error: assignmentError } = await supabase
        .from('delivery_assignments')
        .update({ 
          status: 'picked_up',
          picked_up_at: new Date().toISOString()
        })
        .eq('id', assignmentId);

      if (assignmentError) throw assignmentError;

      // 3. Atualizar estado local
      setMyAssignments(prev => 
        prev.map(a => {
          if (a.id === assignmentId) {
            return { 
              ...a, 
              status: 'picked_up',
              orders: { ...a.orders, status: 'em_transito' } as any
            };
          }
          return a;
        })
      );

      toast.success('Pedido marcado como retirado!');
      fetchStoreAndOrders(); // Recarregar para garantir sincronização
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  // ✅ STATUS MESTRE: Atualizar orders.status para 'concluido' quando entregador entregar
  const handleMarkAsDelivered = async (assignmentId: string, orderId: string) => {
    try {
      const now = new Date().toISOString();
      
      // 1. Atualizar order.status para 'concluido' (status mestre)
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'concluido',
          completed_at: now,
          updated_at: now
        })
        .eq('id', orderId);

      if (orderError) throw orderError;
      
      // 2. Atualizar assignment.status para 'delivered' (controle interno)
      const { data: updatedAssignment, error: updateError } = await supabase
        .from('delivery_assignments')
        .update({ 
          status: 'delivered',
          delivered_at: now
        })
        .eq('id', assignmentId)
        .select('*, orders(*)')
        .single();

      if (updateError) throw updateError;

      // Mover para finalizados
      setMyAssignments(prev => prev.filter(a => a.id !== assignmentId));
      if (updatedAssignment) {
        setCompletedAssignments(prev => [updatedAssignment as any, ...prev]);
      }
      
      await fetchTodayStats(profile!.id);

      toast.success('Pedido entregue!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleMarkOrderAsViewed = (orderId: string) => {
    setUnviewedOrders(prev => {
      const newSet = new Set(prev);
      newSet.delete(orderId);
      return newSet;
    });
  };

  const handleOnlineToggle = (checked: boolean) => {
    setIsOnline(checked);
    localStorage.setItem('delivery_driver_online', String(checked));
    
    const event = new CustomEvent('onlineStatusChange', {
      detail: { isOnline: checked }
    });
    window.dispatchEvent(event);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Carregando dados do entregador...</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl overflow-x-hidden">
      <PWAInstallPrompt />
      
      <NotificationPermissionDialog
        open={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
        onRequestPermission={requestPermission}
      />

      <DeliveryStatusHeader
        driverName={profile?.full_name || "Entregador"}
        isOnline={isOnline}
        onOnlineToggle={handleOnlineToggle}
        todayStats={todayStats}
      />

      <Separator className="my-6" />

      <div className="space-y-6">
        <CollapsibleSection
          title="Pedidos Disponíveis"
          icon={<Clock className="h-5 w-5" />}
          count={availableOrders.length}
          colorScheme="orange"
          defaultOpen={true}
          alwaysOpen={true}
          storageKey="section-available"
        >
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="flex items-center gap-2"
            >
              {viewMode === 'grid' ? (
                <>
                  <List className="w-4 h-4" />
                  <span className="hidden md:inline">Visualizar em Lista</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden md:inline">Visualizar em Grade</span>
                </>
              )}
            </Button>
          </div>
          <AvailableOrdersSection
            orders={availableOrders}
            onAccept={handleAcceptOrder}
            onViewDetails={(order) => {
              handleMarkOrderAsViewed(order.id);
              setSelectedAvailableOrder(order);
            }}
            driverEarningsConfig={earningsConfig}
            viewMode={viewMode}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Minhas Entregas em Andamento"
          icon={<Package className="h-5 w-5" />}
          count={myAssignments.filter((a) => 
            a.orders && 
            a.orders.status !== "concluido" && 
            (a.orders.status === 'aguarda_retirada' || a.orders.status === 'em_transito')
          ).length}
          colorScheme="blue"
          defaultOpen={true}
          storageKey="section-active"
        >
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="flex items-center gap-2"
            >
              {viewMode === 'grid' ? (
                <>
                  <List className="w-4 h-4" />
                  <span className="hidden md:inline">Visualizar em Lista</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden md:inline">Visualizar em Grade</span>
                </>
              )}
            </Button>
          </div>
          <ActiveDeliveriesSection
            assignments={myAssignments}
            onMarkAsPickedUp={handleMarkAsPickedUp}
            onMarkAsDelivered={handleMarkAsDelivered}
            onViewDetails={setSelectedAssignment}
            driverEarningsConfig={earningsConfig}
            viewMode={viewMode}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Pedidos Finalizados (últimos 7 dias)"
          icon={<CheckCircle className="h-5 w-5" />}
          count={completedAssignments.filter((a) => a.status === "delivered").length}
          colorScheme="green"
          defaultOpen={false}
          storageKey="section-completed"
        >
          <CompletedDeliveriesSection
            assignments={completedAssignments}
            onViewDetails={setSelectedAssignment}
            driverEarningsConfig={earningsConfig}
          />
        </CollapsibleSection>
      </div>

      {selectedAvailableOrder && (
        <AvailableOrderDetailDialog
          open={!!selectedAvailableOrder}
          order={selectedAvailableOrder}
          onClose={() => setSelectedAvailableOrder(null)}
          onAccept={handleAcceptOrder}
        />
      )}

      {selectedAssignment && (
        <MyOrderDetailDialog
          open={!!selectedAssignment}
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
        />
      )}
    </div>
  );
}
