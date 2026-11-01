// Status do WhatsApp Master e aprovações de assinantes (aprovar, rejeitar, pago por fora).
// Código movido da SubscriptionPaymentsManagementPage sem mudança de comportamento.
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RECEIPT_BUCKETS, withBucket } from '@/lib/privateFiles';

export type UsePaymentApprovalsDeps = { [K in 'stores' | 'plans' | 'setMasterWhatsAppStatus' | 'setPendingApprovals' | 'setLoadingApprovals' | 'selectedApproval' | 'setSelectedApproval' | 'setShowApprovalDialog' | 'setShowRejectDialog' | 'rejectionReason' | 'setRejectionReason' | 'setProcessingApproval' | 'setShowPaidExternallyDialog' | 'paidExternallyAmount' | 'setPaidExternallyAmount' | 'paidExternallyNotes' | 'setPaidExternallyNotes' | 'user' | 'fetchInvoices']: any };

export function usePaymentApprovals(deps: UsePaymentApprovalsDeps) {
  const { stores, plans, setMasterWhatsAppStatus, setPendingApprovals, setLoadingApprovals, selectedApproval, setSelectedApproval, setShowApprovalDialog, setShowRejectDialog, rejectionReason, setRejectionReason, setProcessingApproval, setShowPaidExternallyDialog, paidExternallyAmount, setPaidExternallyAmount, paidExternallyNotes, setPaidExternallyNotes, user, fetchInvoices } = deps;
  const fetchMasterWhatsAppStatus = async () => {
    try {
      const { data } = await supabase
        .from('master_whatsapp_config')
        .select('instance_status')
        .limit(1)
        .single();
      
      setMasterWhatsAppStatus(data?.instance_status || null);
    } catch (err) {
      console.error('Erro ao buscar status WhatsApp Master:', err);
    }
  };
  const fetchPendingApprovals = async () => {
    setLoadingApprovals(true);
    try {
      // Query sem joins - buscar dados separadamente
      const { data, error } = await (supabase as any)
        .from('payment_approvals')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }) as { data: any[] | null; error: any };

      if (error) {
        console.error('❌ Erro na query de aprovações:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('✅ Query OK, mas nenhuma aprovação pendente');
        setPendingApprovals([]);
        setLoadingApprovals(false);
        return;
      }

      console.log('✅ Aprovações base carregadas:', data.length, 'registros');

      // Buscar dados relacionados manualmente
      const enrichedData = await Promise.all(
        data.map(async (approval: any) => {
          // Buscar profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', approval.user_id)
            .single();

          // Buscar store
          const { data: store } = await supabase
            .from('stores')
            .select('name')
            .eq('id', approval.store_id)
            .single();

          // Buscar plan
          const { data: plan } = await supabase
            .from('plans')
            .select('name')
            .eq('id', approval.plan_id)
            .single();

          // Buscar vendedor que indicou (se houver)
          let salesperson = null;
          if (approval.referred_by_salesperson_id) {
            const { data: sp } = await supabase
              .from('salespeople')
              .select('full_name, referral_code')
              .eq('id', approval.referred_by_salesperson_id)
              .single();
            salesperson = sp;
          }

          return {
            ...approval,
            profiles: profile,
            stores: store,
            plans: plan,
            salesperson,
          };
        })
      );

      console.log('✅ Dados enriquecidos:', enrichedData);
      setPendingApprovals(enrichedData as any);
    } catch (error: any) {
      console.error('❌ ERRO ao buscar aprovações:', error);
      toast.error('Erro ao carregar novos assinantes');
    } finally {
      setLoadingApprovals(false);
    }
  };

  const handleApprovePayment = async () => {
    if (!selectedApproval || !user) return;

    setProcessingApproval(true);
    try {
      // 1. Aprovar via RPC (atualiza approval_status, ativa loja, etc)
      const { data: approvalResult, error: approvalError } = await supabase.functions.invoke('mostralo-pricing', { body: { action: 'approve-selection', approvalId: selectedApproval.id } });

      if (approvalError) throw approvalError;
      if (!approvalResult?.success) throw new Error(approvalResult?.error || 'Não foi possível aprovar o pagamento');

      // 2. Criar invoice na tabela subscription_invoices
      const approvalType = (selectedApproval as any).notes?.startsWith('Upgrade de plano')
        ? 'Upgrade'
        : (selectedApproval as any).notes?.startsWith('Renovação de assinatura')
        ? 'Renovação'
        : 'Pagamento inicial';

      const invoiceNotes = approvalType === 'Upgrade'
        ? 'Upgrade aprovado pelo admin'
        : approvalType === 'Renovação'
        ? 'Renovação aprovada pelo admin'
        : 'Pagamento inicial aprovado pelo admin';

      const { error: invoiceError } = await supabase
        .from('subscription_invoices')
        .insert({
          store_id: selectedApproval.store_id,
          plan_id: selectedApproval.plan_id,
          amount: selectedApproval.payment_amount,
          due_date: new Date().toISOString(),
          paid_at: new Date().toISOString(),
          payment_status: 'paid',
          payment_method: (selectedApproval as any).payment_method || 'pix',
          // O comprovante da aprovação está no bucket payment-proofs; a fatura lê por padrão
          // subscription-receipts, então grava a referência com o bucket junto.
          payment_proof_url: withBucket((selectedApproval as any).payment_proof_url, RECEIPT_BUCKETS.paymentProofs),
          pix_key: (selectedApproval as any).pix_key,
          notes: invoiceNotes,
          approved_at: new Date().toISOString(),
        });

      if (invoiceError) {
        console.error('Erro ao criar invoice:', invoiceError);
        // Não falha a operação, apenas loga o erro
      }

      toast.success('✅ Pagamento aprovado! Loja ativada com sucesso!');
      setShowApprovalDialog(false);
      setSelectedApproval(null);
      
      // 3. Recarregar AMBAS as listas
      fetchPendingApprovals();
      fetchInvoices();
    } catch (error: any) {
      console.error('❌ Erro ao aprovar:', error);
      toast.error(error.message || 'Erro ao aprovar pagamento');
    } finally {
      setProcessingApproval(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedApproval || !user) return;

    // Validar se motivo foi informado
    if (!rejectionReason || rejectionReason.trim().length < 10) {
      toast.error('Por favor, informe um motivo detalhado para a rejeição (mínimo 10 caracteres)');
      return;
    }

    setProcessingApproval(true);
    try {
      const { error } = await (supabase as any).rpc('reject_payment', {
        approval_id: selectedApproval.id,
        admin_user_id: user.id,
        reason: rejectionReason.trim()
      });

      if (error) throw error;

      toast.success('❌ Pagamento rejeitado. O usuário foi notificado.');
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedApproval(null);
      fetchPendingApprovals();
    } catch (error: any) {
      console.error('❌ Erro ao rejeitar:', error);
      toast.error(error.message || 'Erro ao rejeitar pagamento');
    } finally {
      setProcessingApproval(false);
    }
  };

  // Função para aprovar como "Pago por Fora"
  const handlePaidExternally = async () => {
    if (!selectedApproval || !user) return;

    setProcessingApproval(true);
    try {
      const amount = paidExternallyAmount ? parseFloat(paidExternallyAmount) : selectedApproval.payment_amount;
      
      // 1. Aprovar via RPC (atualiza approval_status, ativa loja, etc)
      const { data: approvalResult, error: approvalError } = await supabase.functions.invoke('mostralo-pricing', { body: { action: 'approve-selection', approvalId: selectedApproval.id } });

      if (approvalError) throw approvalError;
      if (!approvalResult?.success) throw new Error(approvalResult?.error || 'Não foi possível aprovar o pagamento');

      // 2. Criar invoice na tabela subscription_invoices marcando como pago
      const { error: invoiceError } = await supabase
        .from('subscription_invoices')
        .insert({
          store_id: selectedApproval.store_id,
          plan_id: selectedApproval.plan_id,
          amount: amount,
          due_date: new Date().toISOString(),
          paid_at: new Date().toISOString(),
          payment_status: 'paid',
          payment_method: 'external',
          notes: paidExternallyNotes || 'Pagamento realizado por fora - aprovado manualmente pelo admin',
          approved_at: new Date().toISOString(),
        });

      if (invoiceError) {
        console.error('Erro ao criar invoice:', invoiceError);
      }

      toast.success('✅ Pagamento aprovado como "Pago por Fora"! Loja ativada com sucesso!');
      setShowPaidExternallyDialog(false);
      setSelectedApproval(null);
      setPaidExternallyAmount("");
      setPaidExternallyNotes("");
      
      // Recarregar as listas
      fetchPendingApprovals();
      fetchInvoices();
    } catch (error: any) {
      console.error('❌ Erro ao aprovar como pago por fora:', error);
      toast.error(error.message || 'Erro ao processar pagamento');
    } finally {
      setProcessingApproval(false);
    }
  };


  return {
    fetchMasterWhatsAppStatus,
    fetchPendingApprovals,
    handleApprovePayment,
    handleRejectPayment,
    handlePaidExternally,
  };
}
