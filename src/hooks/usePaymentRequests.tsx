import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentRequest {
  id: string;
  driver_id: string;
  store_id: string;
  earning_ids: string[];
  total_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  requested_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
}

interface UsePaymentRequestsOptions {
  storeId?: string;
  driverId?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'all';
}

export function usePaymentRequests(options: UsePaymentRequestsOptions = {}) {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchRequests = async () => {
    try {
      let query = supabase
        .from('payment_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (options.storeId) {
        query = query.eq('store_id', options.storeId);
      }

      if (options.driverId) {
        query = query.eq('driver_id', options.driverId);
      }

      if (options.status && options.status !== 'all') {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      const typedData = (data || []).map(item => ({
        ...item,
        status: item.status as 'pending' | 'approved' | 'rejected'
      }));
      
      setRequests(typedData);
      setPendingCount(typedData.filter(r => r.status === 'pending').length);
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
      toast.error('Erro ao carregar solicitações de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const createRequest = async (
    earningIds: string[],
    totalAmount: number,
    notes?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar store_id do primeiro earning
      const { data: earning } = await supabase
        .from('driver_earnings')
        .select('store_id')
        .eq('id', earningIds[0])
        .single();

      if (!earning) throw new Error('Ganho não encontrado');

      const { data, error } = await supabase
        .from('payment_requests')
        .insert({
          driver_id: user.id,
          store_id: earning.store_id,
          earning_ids: earningIds,
          total_amount: totalAmount,
          notes,
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar driver_earnings - incrementar contador
      for (const earningId of earningIds) {
        const { data: earning } = await supabase
          .from('driver_earnings')
          .select('payment_request_count')
          .eq('id', earningId)
          .single();
        
        await supabase
          .from('driver_earnings')
          .update({
            payment_requested_at: new Date().toISOString(),
            payment_request_count: (earning?.payment_request_count || 0) + 1,
          })
          .eq('id', earningId);
      }

      toast.success('Solicitação de pagamento enviada com sucesso!');
      fetchRequests();
      return data;
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      toast.error('Erro ao enviar solicitação de pagamento');
      throw error;
    }
  };

  const approveRequest = async (requestId: string, paymentData: {
    reference: string;
    notes?: string;
    receiptUrl?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const request = requests.find(r => r.id === requestId);
      if (!request) throw new Error('Solicitação não encontrada');

      // Atualizar status da solicitação
      const { error: requestError } = await supabase
        .from('payment_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
        })
        .eq('id', requestId);

      if (requestError) throw requestError;

      // Marcar earnings como pagos
      const { error: earningsError } = await supabase
        .from('driver_earnings')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          payment_reference: paymentData.reference,
          payment_receipt_url: paymentData.receiptUrl,
        })
        .in('id', request.earning_ids);

      if (earningsError) throw earningsError;

      toast.success('Pagamento confirmado com sucesso!');
      fetchRequests();
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
      toast.error('Erro ao confirmar pagamento');
      throw error;
    }
  };

  const rejectRequest = async (requestId: string, reason?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('payment_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          notes: reason || 'Solicitação rejeitada',
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.info('Solicitação rejeitada');
      fetchRequests();
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      toast.error('Erro ao rejeitar solicitação');
      throw error;
    }
  };

  useEffect(() => {
    fetchRequests();

    // Subscribe para notificações em tempo real
    const channel = supabase
      .channel('payment-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_requests',
          filter: options.storeId ? `store_id=eq.${options.storeId}` : undefined,
        },
        (payload) => {
          console.log('Mudança em payment_requests:', payload);
          
          if (payload.eventType === 'INSERT') {
            toast.info('Nova solicitação de pagamento recebida!', {
              description: 'Um entregador solicitou pagamento',
            });
          }
          
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [options.storeId, options.driverId, options.status]);

  return {
    requests,
    loading,
    pendingCount,
    createRequest,
    approveRequest,
    rejectRequest,
    refetch: fetchRequests,
  };
}
