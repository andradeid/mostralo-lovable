import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { useToast } from '@/hooks/use-toast';

export interface KitchenItem {
  id: string;
  comanda_id: string;
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
  // Dados da comanda
  comanda_number: string;
  comanda_type: string;
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

  // Buscar itens pendentes e em preparo
  const { data: kitchenItems = [], isLoading, refetch } = useQuery({
    queryKey: ['kitchen-items', storeId],
    queryFn: async () => {
      if (!storeId) return [];

      const { data, error } = await supabase
        .from('comanda_items')
        .select(`
          *,
          comandas!inner (
            number,
            type,
            table_number,
            customer_name,
            store_id,
            status
          )
        `)
        .eq('comandas.store_id', storeId)
        .eq('comandas.status', 'open')
        .in('preparation_status', ['pending', 'preparing'])
        .order('added_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        id: item.id,
        comanda_id: item.comanda_id,
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
        comanda_number: item.comandas.number,
        comanda_type: item.comandas.type,
        table_number: item.comandas.table_number,
        customer_name: item.comandas.customer_name,
      })) as KitchenItem[];
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

  // Realtime subscription
  useEffect(() => {
    if (!storeId) return;

    console.log('🔔 KDS: Configurando realtime para store:', storeId);

    const channel = supabase
      .channel('kitchen-items-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comanda_items',
        },
        (payload) => {
          console.log('🔔 KDS: Mudança detectada:', payload.eventType);
          
          // Se for INSERT, tocar som de alerta
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as any;
            if (newItem.preparation_status === 'pending') {
              playAlertSound();
              toast({
                title: '🍳 Novo pedido!',
                description: `${newItem.product_name} (${newItem.quantity}x)`,
              });
            }
          }
          
          // Refetch para atualizar lista
          refetch();
        }
      )
      .subscribe();

    return () => {
      console.log('🔔 KDS: Removendo subscription realtime');
      supabase.removeChannel(channel);
    };
  }, [storeId, refetch, playAlertSound, toast]);

  // Marcar como "Preparando"
  const startPreparingMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('comanda_items')
        .update({
          preparation_status: 'preparing',
          preparation_started_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-items', storeId] });
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
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('comanda_items')
        .update({
          preparation_status: 'ready',
          prepared_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-items', storeId] });
      toast({
        title: 'Item pronto!',
        description: 'O garçom foi notificado.',
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

  // Agrupar itens por comanda
  const groupedByComanda = kitchenItems.reduce((acc, item) => {
    const key = item.comanda_id;
    if (!acc[key]) {
      acc[key] = {
        comanda_number: item.comanda_number,
        comanda_type: item.comanda_type,
        table_number: item.table_number,
        customer_name: item.customer_name,
        items: [],
      };
    }
    acc[key].items.push(item);
    return acc;
  }, {} as Record<string, { comanda_number: string; comanda_type: string; table_number: string | null; customer_name: string | null; items: KitchenItem[] }>);

  // Separar pendentes e em preparo
  const pendingItems = kitchenItems.filter(i => i.preparation_status === 'pending');
  const preparingItems = kitchenItems.filter(i => i.preparation_status === 'preparing');

  return {
    kitchenItems,
    pendingItems,
    preparingItems,
    groupedByComanda,
    isLoading,
    refetch,
    startPreparing: startPreparingMutation.mutateAsync,
    isStartingPreparing: startPreparingMutation.isPending,
    markReady: markReadyMutation.mutateAsync,
    isMarkingReady: markReadyMutation.isPending,
    getWaitingTime,
    getWaitingColor,
    soundEnabled,
    setSoundEnabled,
  };
}
