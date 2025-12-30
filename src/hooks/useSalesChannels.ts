import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SalesChannels {
  id?: string;
  store_id: string;
  delivery_enabled: boolean;
  ifood_enabled: boolean;
  totem_enabled: boolean;
  mesa_enabled: boolean;
  pdv_enabled: boolean;
  booking_enabled: boolean;
}

const DEFAULT_CHANNELS: Omit<SalesChannels, 'store_id'> = {
  delivery_enabled: true,
  ifood_enabled: true,
  totem_enabled: true,
  mesa_enabled: true,
  pdv_enabled: true,
  booking_enabled: true,
};

export function useSalesChannels(storeId: string | null) {
  const [channels, setChannels] = useState<SalesChannels | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const fetchChannels = async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('store_sales_channels')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setChannels(data as SalesChannels);
      } else {
        // Retornar valores padrão se não existir registro
        setChannels({
          store_id: storeId,
          ...DEFAULT_CHANNELS,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar canais de vendas:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateChannel = async (
    channelKey: keyof Omit<SalesChannels, 'id' | 'store_id'>,
    value: boolean
  ) => {
    if (!storeId) return;

    setUpdating(true);
    try {
      const updatedChannels = {
        store_id: storeId,
        ...(channels || DEFAULT_CHANNELS),
        [channelKey]: value,
      };

      const { data, error } = await supabase
        .from('store_sales_channels')
        .upsert(
          {
            store_id: storeId,
            ...updatedChannels,
          },
          { onConflict: 'store_id' }
        )
        .select()
        .single();

      if (error) throw error;

      setChannels(data as SalesChannels);

      const channelNames: Record<string, string> = {
        delivery_enabled: 'Delivery',
        ifood_enabled: 'iFood',
        totem_enabled: 'Totem',
        mesa_enabled: 'Mesa',
        pdv_enabled: 'PDV/Balcão',
        booking_enabled: 'Agendamento Online',
      };

      toast({
        title: value ? '✅ Canal ativado' : '⏸️ Canal desativado',
        description: `${channelNames[channelKey]} foi ${value ? 'ativado' : 'desativado'} com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao atualizar canal:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o canal de vendas',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, [storeId]);

  return {
    channels,
    loading,
    updating,
    updateChannel,
    refetch: fetchChannels,
  };
}
