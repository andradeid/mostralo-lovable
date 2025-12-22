import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PasswordCall {
  id: string;
  store_id: string;
  call_number: string;
  call_type: 'password' | 'order' | 'table';
  created_at: string;
}

interface UsePasswordCallsOptions {
  storeId: string | null;
  limit?: number;
  realtime?: boolean;
}

export function usePasswordCalls({ storeId, limit = 7, realtime = false }: UsePasswordCallsOptions) {
  const [calls, setCalls] = useState<PasswordCall[]>([]);
  const [latestCall, setLatestCall] = useState<PasswordCall | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isFirstLoad = useRef(true);

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
      setCalls((data as PasswordCall[]) || []);
    }
    setLoading(false);
    isFirstLoad.current = false;
  }, [storeId, limit]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  // Realtime subscription
  useEffect(() => {
    if (!storeId || !realtime) return;

    const channel = supabase
      .channel(`password_calls_${storeId}`)
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
          console.log('Nova chamada recebida:', newCall);
          
          // Adiciona no início e limita
          setCalls(prev => [newCall, ...prev].slice(0, limit));
          
          // Seta como última chamada (para animação)
          if (!isFirstLoad.current) {
            setLatestCall(newCall);
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
          // Recarrega lista após delete
          fetchCalls();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, realtime, limit, fetchCalls]);

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
    clearHistory, 
    clearLatestCall,
    refetch: fetchCalls 
  };
}
