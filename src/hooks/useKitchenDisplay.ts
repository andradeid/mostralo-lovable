import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useToast } from '@/hooks/use-toast';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { useModuleEnabled } from '@/hooks/useModuleEnabled';

export interface KitchenItem {
  id: string;
  source: 'comanda' | 'order';
  source_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  addons: Record<string, any> | null;
  notes: string | null;
  added_by: string | null;
  added_at: string;
  preparation_status: 'pending' | 'preparing' | 'ready';
  preparation_started_at: string | null;
  prepared_at: string | null;
  order_number: string;
  order_type: 'mesa' | 'balcao' | 'delivery' | 'pickup';
  table_number: string | null;
  customer_name: string | null;
}

export function useKitchenDisplay() {
  const { storeId } = useStoreAccess();
  const kdsEnabled = useModuleEnabled('kds');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Buscar itens pendentes e em preparo de AMBAS as tabelas
  const { data: kitchenItems = [], isLoading, refetch } = useQuery({
    queryKey: ['kitchen-items', storeId],
    queryFn: async () => {
      if (!storeId) return [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: comandaItems, error: comandaError } = await supabase
        .from('comanda_items')
        .select(`
          *,
          comandas!inner (
            number,
            type,
            table_number,
            customer_name,
            store_id,
            status,
            created_at
          )
        `)
        .eq('comandas.store_id', storeId)
        .in('preparation_status', ['pending', 'preparing'])
        .order('added_at', { ascending: true });

      if (comandaError) {
        console.error('Erro ao buscar itens de comandas:', comandaError);
      }

      const { data: orderItems, error: orderError } = await supabase
        .from('order_items')
        .select(`
          *,
          orders!inner (
            order_number,
            delivery_type,
            customer_name,
            store_id,
            status
          )
        `)
        .eq('orders.store_id', storeId)
        .eq('orders.status', 'em_preparo')
        .in('preparation_status', ['pending', 'preparing'])
        .order('created_at', { ascending: true });

      if (orderError) {
        console.error('Erro ao buscar itens de pedidos:', orderError);
      }

      const mappedComandaItems: KitchenItem[] = (comandaItems || []).map((item: any) => ({
        id: item.id,
        source: 'comanda' as const,
        source_id: item.comanda_id,
        product_id: item.product_id,
        product_name: item.product_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        total_price: item.total_price,
        addons: item.addons,
        notes: item.notes,
        added_by: item.added_by,
        added_at: item.added_at,
        preparation_status: item.preparation_status || 'pending',
        preparation_started_at: item.preparation_started_at,
        prepared_at: item.prepared_at,
        order_number: item.comandas.number,
        order_type: item.comandas.type === 'mesa' ? 'mesa' : 'balcao',
        table_number: item.comandas.table_number,
        customer_name: item.comandas.customer_name,
      }));

      const mappedOrderItems: KitchenItem[] = (orderItems || []).map((item: any) => ({
        id: item.id,
        source: 'order' as const,
        source_id: item.order_id,
        product_id: item.product_id,
        product_name: item.product_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        total_price: item.total_price,
        addons: item.addons,
        notes: item.notes,
        added_by: null,
        added_at: item.created_at,
        preparation_status: item.preparation_status || 'pending',
        preparation_started_at: item.preparation_started_at,
        prepared_at: item.prepared_at,
        order_number: item.orders.order_number,
        order_type: item.orders.delivery_type === 'delivery' ? 'delivery' : 'pickup',
        table_number: null,
        customer_name: item.orders.customer_name,
      }));

      const allItems = [...mappedComandaItems, ...mappedOrderItems].sort((a, b) => 
        new Date(a.added_at).getTime() - new Date(b.added_at).getTime()
      );

      return allItems;
    },
    enabled: !!storeId && kdsEnabled,
    refetchInterval: kdsEnabled ? 120000 : false, // Polling backup a cada 2min (realtime é primário)
    staleTime: 30000, // Dados válidos por 30s - evita refetches redundantes
  });

  // Debounce do refetch do realtime - coalesce múltiplos eventos em 1 query
  const debouncedRefetch = useDebouncedCallback(() => {
    console.log('🔄 KDS: Debounced refetch executado');
    refetch();
  }, 3000); // 3s de debounce - agrupa rajadas de eventos

  // Som de alerta
  const playAlertSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/notification.mp3');
        audioRef.current.volume = 0.5;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    } catch (error) {
      console.error('Erro ao tocar som:', error);
    }
  }, [soundEnabled]);

  // Realtime subscription - com debounce para não bombardear o DB
  useEffect(() => {
    if (!storeId || !kdsEnabled) return;

    console.log('🔔 KDS: Configurando realtime para store:', storeId);

    const comandaChannel = supabase
      .channel('kitchen-comanda-items-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comanda_items',
        },
        (payload) => {
          console.log('🔔 KDS: Mudança em comanda_items:', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as any;
            if (newItem.preparation_status === 'pending') {
              playAlertSound();
              toast({
                title: '🍽️ Novo item de comanda!',
                description: `${newItem.product_name} (${newItem.quantity}x)`,
              });
            }
          }
          
          // Debounced - múltiplos eventos viram 1 refetch
          debouncedRefetch();
        }
      )
      .subscribe();

    const orderChannel = supabase
      .channel('kitchen-order-items-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
        },
        (payload) => {
          console.log('🔔 KDS: Mudança em order_items:', payload.eventType);
          
          if (payload.eventType === 'UPDATE') {
            const updatedItem = payload.new as any;
            if (updatedItem.preparation_status === 'pending' && 
                (!payload.old || (payload.old as any).preparation_status !== 'pending')) {
              playAlertSound();
              toast({
                title: '📦 Novo pedido na cozinha!',
                description: `${updatedItem.product_name} (${updatedItem.quantity}x)`,
              });
            }
          }
          
          debouncedRefetch();
        }
      )
      .subscribe();

    return () => {
      console.log('🔔 KDS: Removendo subscriptions realtime');
      supabase.removeChannel(comandaChannel);
      supabase.removeChannel(orderChannel);
    };
  }, [storeId, playAlertSound, toast, debouncedRefetch]);

  // Atualização otimista: atualiza a UI imediatamente sem esperar o DB
  const optimisticUpdate = useCallback((itemId: string, newStatus: 'preparing' | 'ready') => {
    queryClient.setQueryData<KitchenItem[]>(['kitchen-items', storeId], (old) => {
      if (!old) return old;
      if (newStatus === 'ready') {
        // Remove do cache de itens ativos
        return old.filter(item => item.id !== itemId);
      }
      return old.map(item =>
        item.id === itemId
          ? { ...item, preparation_status: newStatus, preparation_started_at: new Date().toISOString() }
          : item
      );
    });
  }, [queryClient, storeId]);

  // Marcar como "Preparando" - com update otimista, SEM invalidação no onSuccess
  const startPreparingMutation = useMutation({
    mutationFn: async ({ itemId, source }: { itemId: string; source: 'comanda' | 'order' }) => {
      const table = source === 'comanda' ? 'comanda_items' : 'order_items';
      console.log(`🍳 KDS: Iniciando preparo - ${table} id=${itemId}`);
      
      const { data, error } = await supabase
        .from(table)
        .update({
          preparation_status: 'preparing',
          preparation_started_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .select();

      if (error) {
        console.error('❌ KDS: Erro ao iniciar preparo:', error);
        throw error;
      }
      
      console.log('✅ KDS: Preparo iniciado com sucesso:', data);
      return data;
    },
    // Sem onSuccess com invalidateQueries - o realtime debounced cuida da sincronização
    onError: (error) => {
      console.error('❌ KDS: Erro mutation startPreparing:', error);
      // Rollback: refetch para restaurar estado correto
      refetch();
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Marcar como "Pronto" - com update otimista
  const markReadyMutation = useMutation({
    mutationFn: async ({ itemId, source }: { itemId: string; source: 'comanda' | 'order' }) => {
      const table = source === 'comanda' ? 'comanda_items' : 'order_items';
      console.log(`✅ KDS: Marcando como pronto - ${table} id=${itemId}`);
      
      const { data, error } = await supabase
        .from(table)
        .update({
          preparation_status: 'ready',
          prepared_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .select();

      if (error) {
        console.error('❌ KDS: Erro ao marcar pronto:', error);
        throw error;
      }
      
      console.log('✅ KDS: Marcado como pronto:', data);
      return data;
    },
    onSuccess: () => {
      // Só invalida ready-items (histórico) - itens ativos já saíram via otimista
      queryClient.invalidateQueries({ queryKey: ['kitchen-ready-items', storeId] });
      toast({
        title: 'Item pronto!',
        description: 'O garçom/entregador foi notificado.',
      });
    },
    onError: (error) => {
      console.error('❌ KDS: Erro mutation markReady:', error);
      refetch();
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // Calcular tempo de espera
  const getWaitingTime = (addedAt: string): number => {
    const added = new Date(addedAt).getTime();
    const now = Date.now();
    return Math.floor((now - added) / 60000);
  };

  // Cor baseada no tempo de espera
  const getWaitingColor = (minutes: number): string => {
    if (minutes < 5) return 'bg-green-500/20 border-green-500';
    if (minutes < 10) return 'bg-yellow-500/20 border-yellow-500';
    if (minutes < 15) return 'bg-orange-500/20 border-orange-500';
    return 'bg-red-500/20 border-red-500';
  };

  // Agrupar itens por pedido/comanda
  const groupedByOrder = kitchenItems.reduce((acc, item) => {
    const key = `${item.source}-${item.source_id}`;
    if (!acc[key]) {
      acc[key] = {
        order_number: item.order_number,
        order_type: item.order_type,
        table_number: item.table_number,
        customer_name: item.customer_name,
        source: item.source,
        items: [],
      };
    }
    acc[key].items.push(item);
    return acc;
  }, {} as Record<string, { order_number: string; order_type: string; table_number: string | null; customer_name: string | null; source: string; items: KitchenItem[] }>);

  // Separar pendentes e em preparo
  const pendingItems = kitchenItems.filter(i => i.preparation_status === 'pending');
  const preparingItems = kitchenItems.filter(i => i.preparation_status === 'preparing');

  // Buscar itens prontos do dia (histórico)
  const { data: readyItems = [] } = useQuery({
    queryKey: ['kitchen-ready-items', storeId],
    queryFn: async () => {
      if (!storeId) return [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const { data: comandaItems } = await supabase
        .from('comanda_items')
        .select(`
          *,
          comandas!inner (
            number,
            type,
            table_number,
            customer_name,
            store_id
          )
        `)
        .eq('comandas.store_id', storeId)
        .eq('preparation_status', 'ready')
        .gte('prepared_at', todayISO)
        .order('prepared_at', { ascending: false })
        .limit(50); // Reduzido de 100

      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          *,
          orders!inner (
            order_number,
            delivery_type,
            customer_name,
            store_id
          )
        `)
        .eq('orders.store_id', storeId)
        .eq('preparation_status', 'ready')
        .gte('prepared_at', todayISO)
        .order('prepared_at', { ascending: false })
        .limit(50); // Reduzido de 100

      const mappedComandaItems: KitchenItem[] = (comandaItems || []).map((item: any) => ({
        id: item.id,
        source: 'comanda' as const,
        source_id: item.comanda_id,
        product_id: item.product_id,
        product_name: item.product_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        total_price: item.total_price,
        addons: item.addons,
        notes: item.notes,
        added_by: item.added_by,
        added_at: item.added_at,
        preparation_status: 'ready' as const,
        preparation_started_at: item.preparation_started_at,
        prepared_at: item.prepared_at,
        order_number: item.comandas.number,
        order_type: item.comandas.type === 'mesa' ? 'mesa' : 'balcao',
        table_number: item.comandas.table_number,
        customer_name: item.comandas.customer_name,
      }));

      const mappedOrderItems: KitchenItem[] = (orderItems || []).map((item: any) => ({
        id: item.id,
        source: 'order' as const,
        source_id: item.order_id,
        product_id: item.product_id,
        product_name: item.product_name,
        unit_price: item.unit_price,
        quantity: item.quantity,
        total_price: item.total_price,
        addons: item.addons,
        notes: item.notes,
        added_by: null,
        added_at: item.created_at,
        preparation_status: 'ready' as const,
        preparation_started_at: item.preparation_started_at,
        prepared_at: item.prepared_at,
        order_number: item.orders.order_number,
        order_type: item.orders.delivery_type === 'delivery' ? 'delivery' : 'pickup',
        table_number: null,
        customer_name: item.orders.customer_name,
      }));

      return [...mappedComandaItems, ...mappedOrderItems].sort((a, b) => 
        new Date(b.prepared_at!).getTime() - new Date(a.prepared_at!).getTime()
      );
    },
    enabled: !!storeId,
    refetchInterval: 300000, // 5min - dados históricos não precisam ser frequentes
    staleTime: 120000, // Válido por 2min
  });

  // Calcular tempo de preparo
  const getPreparationTime = (addedAt: string, preparedAt: string | null): number => {
    if (!preparedAt) return 0;
    const added = new Date(addedAt).getTime();
    const prepared = new Date(preparedAt).getTime();
    return Math.floor((prepared - added) / 60000);
  };

  // Desfazer pronto - voltar para preparando
  const undoReadyMutation = useMutation({
    mutationFn: async ({ itemId, source }: { itemId: string; source: 'comanda' | 'order' }) => {
      const table = source === 'comanda' ? 'comanda_items' : 'order_items';
      
      const { error } = await supabase
        .from(table)
        .update({
          preparation_status: 'preparing',
          prepared_at: null,
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      // Precisa invalidar ambos pois o item muda de lista
      queryClient.invalidateQueries({ queryKey: ['kitchen-items', storeId] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-ready-items', storeId] });
      toast({
        title: '↩️ Item retornado',
        description: 'O item voltou para preparo.',
      });
    },
    onError: (error) => {
      console.error('Erro ao desfazer pronto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível desfazer.',
        variant: 'destructive',
      });
    },
  });

  // Wrappers com update otimista
  const startPreparing = async (itemId: string) => {
    const item = kitchenItems.find(i => i.id === itemId);
    if (item) {
      console.log(`🍳 KDS: startPreparing chamado para item=${itemId}, source=${item.source}`);
      // Update otimista imediato
      optimisticUpdate(itemId, 'preparing');
      startPreparingMutation.mutate({ itemId, source: item.source });
    } else {
      console.warn(`⚠️ KDS: Item ${itemId} não encontrado em kitchenItems (${kitchenItems.length} itens)`);
    }
  };

  const markReady = async (itemId: string) => {
    const item = kitchenItems.find(i => i.id === itemId);
    if (item) {
      console.log(`✅ KDS: markReady chamado para item=${itemId}, source=${item.source}`);
      // Update otimista imediato - remove da lista ativa
      optimisticUpdate(itemId, 'ready');
      markReadyMutation.mutate({ itemId, source: item.source });
    } else {
      console.warn(`⚠️ KDS: Item ${itemId} não encontrado em kitchenItems (${kitchenItems.length} itens)`);
    }
  };

  const undoReady = async (itemId: string, source: 'comanda' | 'order') => {
    await undoReadyMutation.mutateAsync({ itemId, source });
  };

  return {
    kitchenItems,
    pendingItems,
    preparingItems,
    readyItems,
    groupedByOrder,
    isLoading,
    refetch,
    startPreparing,
    isStartingPreparing: startPreparingMutation.isPending,
    markReady,
    isMarkingReady: markReadyMutation.isPending,
    undoReady,
    isUndoingReady: undoReadyMutation.isPending,
    getWaitingTime,
    getWaitingColor,
    getPreparationTime,
    soundEnabled,
    setSoundEnabled,
  };
}
