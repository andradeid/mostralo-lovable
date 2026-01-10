import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type SalesChannelKey = 'totem_enabled' | 'mesa_enabled' | 'pdv_enabled' | 'ifood_enabled' | 'delivery_enabled' | 'booking_enabled';

interface SalesChannelStatus {
  isEnabled: boolean;
  isLoading: boolean;
  message: string;
}

const CHANNEL_MESSAGES: Record<SalesChannelKey, string> = {
  totem_enabled: 'Autoatendimento pausado. Navegue pela loja!',
  mesa_enabled: 'Pedidos pela mesa pausados. Confira nossa loja!',
  pdv_enabled: 'Vendas no balcão temporariamente pausadas.',
  ifood_enabled: 'Integração iFood pausada.',
  delivery_enabled: 'Delivery temporariamente pausado.',
  booking_enabled: 'Agendamentos online temporariamente pausados.',
};

export function useCheckSalesChannel(
  storeId: string | null | undefined,
  channelKey: SalesChannelKey
): SalesChannelStatus {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkChannel = async () => {
      if (!storeId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('store_sales_channels')
          .select(channelKey)
          .eq('store_id', storeId)
          .maybeSingle();

        if (error) {
          console.error('Erro ao verificar canal de vendas:', error);
          setIsEnabled(true); // Default para ativo em caso de erro
        } else if (data) {
          setIsEnabled(data[channelKey] !== false);
        } else {
          // Se não existe registro, considerar ativo (default)
          setIsEnabled(true);
        }
      } catch (err) {
        console.error('Erro ao verificar canal:', err);
        setIsEnabled(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkChannel();
  }, [storeId, channelKey]);

  return {
    isEnabled,
    isLoading,
    message: CHANNEL_MESSAGES[channelKey],
  };
}
