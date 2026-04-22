import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

interface UsePasswordCallsOptions {
  storeId: string | null;
  limit?: number;
}

export function usePasswordCalls({ storeId, limit = 7 }: UsePasswordCallsOptions) {
  const [calls, setCalls] = useState<PasswordCall[]>([]);
  const [latestCall, setLatestCall] = useState<PasswordCall | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isFirstLoad = useRef(true);
  const previousFirstIdRef = useRef<string | null>(null);
  const isPageVisible = usePageVisibility();

  // Buscar chamadas recentes
  const fetchCalls = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('password_calls')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar chamadas:', error);
    } else {
      const nextCalls = (data as PasswordCall[]) || [];

      if (!isFirstLoad.current && nextCalls.length > 0 && previousFirstIdRef.current !== nextCalls[0].id) {
        setLatestCall(nextCalls[0]);
      }

      previousFirstIdRef.current = nextCalls[0]?.id || null;
      setCalls(nextCalls);
    }
    setLoading(false);
    isFirstLoad.current = false;
  }, [storeId, limit]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  useEffect(() => {
    if (!storeId) return;

    const interval = window.setInterval(() => {
      fetchCalls();
    }, isPageVisible ? 3000 : 10000);

    return () => {
      window.clearInterval(interval);
    };
  }, [storeId, fetchCalls, isPageVisible]);

  // Criar nova chamada
  const createCall = useCallback(async (callNumber: string, callType: 'password' | 'order' | 'table') => {
    if (!storeId) return false;

    try {
      const { error } = await supabase
        .from('password_calls')
        .insert({
          store_id: storeId,
          call_number: callNumber,
          call_type: callType
        });

      if (error) throw error;
      
      toast({ 
        title: `${callType === 'password' ? 'Senha' : callType === 'order' ? 'Pedido' : 'Mesa'} ${callNumber} chamada!` 
      });
      return true;
    } catch (error) {
      console.error('Erro ao criar chamada:', error);
      toast({ title: 'Erro ao chamar', variant: 'destructive' });
      return false;
    }
  }, [storeId, toast]);

  // Criar chamada a partir de pedido real
  const createCallFromOrder = useCallback(async (
    orderId: string, 
    orderNumber: string, 
    customerName: string
  ) => {
    if (!storeId) return false;

    try {
      const { error } = await supabase
        .from('password_calls')
        .insert({
          store_id: storeId,
          call_number: orderNumber,
          call_type: 'order',
          order_id: orderId,
          customer_name: customerName
        });

      if (error) throw error;
      
      toast({ 
        title: `Pedido ${orderNumber} - ${customerName} chamado!` 
      });
      return true;
    } catch (error) {
      console.error('Erro ao criar chamada:', error);
      toast({ title: 'Erro ao chamar', variant: 'destructive' });
      return false;
    }
  }, [storeId, toast]);

  // Limpar histórico
  const clearHistory = useCallback(async () => {
    if (!storeId) return false;

    try {
      const { error } = await supabase
        .from('password_calls')
        .delete()
        .eq('store_id', storeId);

      if (error) throw error;
      
      setCalls([]);
      setLatestCall(null);
      toast({ title: 'Histórico limpo!' });
      return true;
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      toast({ title: 'Erro ao limpar', variant: 'destructive' });
      return false;
    }
  }, [storeId, toast]);

  // Limpar estado de "latest" (após animação)
  const clearLatestCall = useCallback(() => {
    setLatestCall(null);
  }, []);

  return { 
    calls, 
    latestCall, 
    loading, 
    createCall,
    createCallFromOrder,
    clearHistory, 
    clearLatestCall,
    refetch: fetchCalls 
  };
}
