import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PasswordCallConfig } from './usePasswordCallConfig';

export interface PasswordCall {
  id: string;
  store_id: string;
  call_number: string;
  call_type: 'password' | 'order' | 'table';
  created_at: string;
}

interface UsePublicPasswordCallsOptions {
  storeId: string | null;
  config: PasswordCallConfig | null;
}

export function usePublicPasswordCalls({ storeId, config }: UsePublicPasswordCallsOptions) {
  const [calls, setCalls] = useState<PasswordCall[]>([]);
  const [latestCall, setLatestCall] = useState<PasswordCall | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const isFirstLoad = useRef(true);
  const limit = config?.history_count || 7;

  // Buscar chamadas recentes
  const fetchCalls = useCallback(async () => {
    if (!storeId) return;

    const { data, error } = await supabase
      .from('password_calls')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar chamadas:', error);
    } else {
      setCalls((data as PasswordCall[]) || []);
    }
    isFirstLoad.current = false;
  }, [storeId, limit]);

  useEffect(() => {
    if (storeId && config?.is_enabled) {
      fetchCalls();
    }
  }, [storeId, config?.is_enabled, fetchCalls]);

  // Realtime subscription
  useEffect(() => {
    if (!storeId || !config?.is_enabled) return;

    const channel = supabase
      .channel(`public_password_calls_${storeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'password_calls',
          filter: `store_id=eq.${storeId}`
        },
        (payload) => {
          const newCall = payload.new as PasswordCall;
          console.log('Nova chamada recebida (público):', newCall);
          
          // Adiciona no início e limita
          setCalls(prev => [newCall, ...prev].slice(0, limit));
          
          // Mostra popup apenas se não for primeiro load
          if (!isFirstLoad.current) {
            setLatestCall(newCall);
            setShowPopup(true);

            // Auto-hide popup após duração configurada
            const duration = config?.highlight_duration_ms || 5000;
            setTimeout(() => {
              setShowPopup(false);
            }, duration);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'password_calls',
          filter: `store_id=eq.${storeId}`
        },
        () => {
          fetchCalls();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, config?.is_enabled, config?.highlight_duration_ms, limit, fetchCalls]);

  // Fechar popup manualmente
  const closePopup = useCallback(() => {
    setShowPopup(false);
  }, []);

  return { 
    calls, 
    latestCall, 
    showPopup,
    closePopup
  };
}
