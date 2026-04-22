import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PasswordCallConfig } from './usePasswordCallConfig';
import { usePageVisibility } from '@/hooks/usePageVisibility';

export interface PasswordCall {
  id: string;
  store_id: string;
  call_number: string;
  call_type: 'password' | 'order' | 'table';
  created_at: string;
  order_id?: string | null;
  customer_name?: string | null;
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
  const previousFirstIdRef = useRef<string | null>(null);
  const popupTimeoutRef = useRef<number | null>(null);
  const isPageVisible = usePageVisibility();
  const limit = config?.history_count || 7;

  // Buscar chamadas recentes (usa função RPC que limpa registros > 24h automaticamente)
  const fetchCalls = useCallback(async () => {
    if (!storeId) return;

    // Usa função que faz limpeza automática de registros > 24h
    const { data, error } = await supabase
      .rpc('get_password_calls_with_cleanup', {
        p_store_id: storeId,
        p_limit: limit
      });

    if (error) {
      console.error('Erro ao buscar chamadas:', error);
      // Fallback para query direta se a função não existir
      const { data: fallbackData } = await supabase
        .from('password_calls')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(limit);
      const nextCalls = (fallbackData as PasswordCall[]) || [];
      if (!isFirstLoad.current && nextCalls.length > 0 && previousFirstIdRef.current !== nextCalls[0].id) {
        setLatestCall(nextCalls[0]);
        setShowPopup(true);

        if (popupTimeoutRef.current) {
          window.clearTimeout(popupTimeoutRef.current);
        }

        popupTimeoutRef.current = window.setTimeout(() => {
          setShowPopup(false);
        }, config?.highlight_duration_ms || 5000);
      }

      previousFirstIdRef.current = nextCalls[0]?.id || null;
      setCalls(nextCalls);
    } else {
      const nextCalls = (data as PasswordCall[]) || [];
      if (!isFirstLoad.current && nextCalls.length > 0 && previousFirstIdRef.current !== nextCalls[0].id) {
        setLatestCall(nextCalls[0]);
        setShowPopup(true);

        if (popupTimeoutRef.current) {
          window.clearTimeout(popupTimeoutRef.current);
        }

        popupTimeoutRef.current = window.setTimeout(() => {
          setShowPopup(false);
        }, config?.highlight_duration_ms || 5000);
      }

      previousFirstIdRef.current = nextCalls[0]?.id || null;
      setCalls(nextCalls);
    }
    isFirstLoad.current = false;
  }, [storeId, limit, config?.highlight_duration_ms]);

  useEffect(() => {
    if (storeId && config?.is_enabled) {
      fetchCalls();
    }
  }, [storeId, config?.is_enabled, fetchCalls]);

  useEffect(() => {
    if (!storeId || !config?.is_enabled) return;

    const interval = window.setInterval(() => {
      fetchCalls();
    }, isPageVisible ? 2500 : 10000);

    return () => {
      window.clearInterval(interval);
      if (popupTimeoutRef.current) {
        window.clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = null;
      }
    };
  }, [storeId, config?.is_enabled, fetchCalls, isPageVisible]);

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
