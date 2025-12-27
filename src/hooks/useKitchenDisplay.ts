import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useToast } from '@/hooks/use-toast';

export interface KitchenItem {
  id: string;
  source: 'comanda' | 'order'; // Origem do item
  source_id: string; // comanda_id ou order_id
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
  // Dados do pedido/comanda
  order_number: string;
  order_type: 'mesa' | 'balcao' | 'delivery' | 'pickup';
  table_number: string | null;
  customer_name: string | null;
}

export function useKitchenDisplay() {
  const { storeId } = useStoreAccess();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const previousItemsRef = useRef<string[]>([]);

  // Buscar itens pendentes e em preparo de AMBAS as tabelas
  const { data: kitchenItems = [], isLoading, refetch } = useQuery({
    queryKey: ['kitchen-items', storeId],
    queryFn: async () => {
      if (!storeId) return [];

      // Data de início do dia atual
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Buscar itens de comandas (abertas OU fechadas recentemente com itens pendentes)
      // Removido filtro de status para permitir itens de PDV/balcão que fecham a comanda imediatamente
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

      // Buscar itens de pedidos (orders) em preparo
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

      // Mapear itens de comandas
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

      // Mapear itens de pedidos
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

      // Combinar e ordenar por data de adição
      const allItems = [...mappedComandaItems, ...mappedOrderItems].sort((a, b) => 
        new Date(a.added_at).getTime() - new Date(b.added_at).getTime()
      );

      return allItems;
    },
    enabled: !!storeId,
    refetchInterval: 30000, // Fallback: refetch a cada 30s
  });

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

  // Realtime subscription para AMBAS as tabelas
  useEffect(() => {
    if (!storeId) return;

    console.log('🔔 KDS: Configurando realtime para store:', storeId);

    // Canal para comanda_items
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
          
          refetch();
        }
      )
      .subscribe();

    // Canal para order_items
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
            // Se mudou para pending (pedido aceito), tocar som
            if (updatedItem.preparation_status === 'pending' && 
                (!payload.old || (payload.old as any).preparation_status !== 'pending')) {
              playAlertSound();
              toast({
                title: '📦 Novo pedido na cozinha!',
                description: `${updatedItem.product_name} (${updatedItem.quantity}x)`,
              });
            }
          }
          
          refetch();
        }
      )
      .subscribe();

    return () => {
      console.log('🔔 KDS: Removendo subscriptions realtime');
      supabase.removeChannel(comandaChannel);
      supabase.removeChannel(orderChannel);
    };
  }, [storeId, refetch, playAlertSound, toast]);

  // Marcar como "Preparando"
  const startPreparingMutation = useMutation({
    mutationFn: async ({ itemId, source }: { itemId: string; source: 'comanda' | 'order' }) => {
      const table = source === 'comanda' ? 'comanda_items' : 'order_items';
      
      const { error } = await supabase
        .from(table)
        .update({
          preparation_status: 'preparing',
          preparation_started_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-items', storeId] });
      refetch(); // Forçar refetch imediato
    },
    onError: (error) => {
      console.error('Erro ao iniciar preparo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    },
  });

  // Marcar como "Pronto"
  const markReadyMutation = useMutation({
    mutationFn: async ({ itemId, source }: { itemId: string; source: 'comanda' | 'order' }) => {
      const table = source === 'comanda' ? 'comanda_items' : 'order_items';
      
      const { error } = await supabase
        .from(table)
        .update({
          preparation_status: 'ready',
          prepared_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-items', storeId] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-ready-items', storeId] });
      refetch(); // Forçar refetch imediato
      toast({
        title: 'Item pronto!',
        description: 'O garçom/entregador foi notificado.',
      });
    },
    onError: (error) => {
      console.error('Erro ao marcar como pronto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    },
  });

  // Calcular tempo de espera
  const getWaitingTime = (addedAt: string): number => {
    const added = new Date(addedAt).getTime();
    const now = Date.now();
    return Math.floor((now - added) / 60000); // minutos
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

      // Buscar itens prontos de comandas
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
        .limit(100);

      // Buscar itens prontos de orders
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
        .limit(100);

      // Mapear itens de comandas
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

      // Mapear itens de orders
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

      // Combinar e ordenar por prepared_at (mais recente primeiro)
      return [...mappedComandaItems, ...mappedOrderItems].sort((a, b) => 
        new Date(b.prepared_at!).getTime() - new Date(a.prepared_at!).getTime()
      );
    },
    enabled: !!storeId,
    refetchInterval: 60000, // Atualiza a cada minuto
  });

  // Calcular tempo de preparo (de added_at até prepared_at)
  const getPreparationTime = (addedAt: string, preparedAt: string | null): number => {
    if (!preparedAt) return 0;
    const added = new Date(addedAt).getTime();
    const prepared = new Date(preparedAt).getTime();
    return Math.floor((prepared - added) / 60000); // minutos
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

  // Wrappers para manter compatibilidade
  const startPreparing = async (itemId: string) => {
    const item = kitchenItems.find(i => i.id === itemId);
    if (item) {
      await startPreparingMutation.mutateAsync({ itemId, source: item.source });
    }
  };

  const markReady = async (itemId: string) => {
    const item = kitchenItems.find(i => i.id === itemId);
    if (item) {
      await markReadyMutation.mutateAsync({ itemId, source: item.source });
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
