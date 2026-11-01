// Aprovar comprovante, marcar como paga e rejeitar fatura.
// Código movido da SubscriptionPaymentsManagementPage sem mudança de comportamento.
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Invoice } from "@/lib/subscriptionPayments/types";

export type UseInvoiceStatusActionsDeps = { [K in 'setShowDetailDialog' | 'stores' | 'plans' | 'setShowMarkPaidDialog' | 'markPaidInvoice' | 'setMarkPaidInvoice' | 'markPaidMethod' | 'setMarkPaidMethod' | 'markPaidNotes' | 'setMarkPaidNotes' | 'markPaidExtendSub' | 'setMarkPaidExtendSub' | 'setProcessingMarkPaid' | 'fetchInvoices']: any };

export function useInvoiceStatusActions(deps: UseInvoiceStatusActionsDeps) {
  const { setShowDetailDialog, stores, plans, setShowMarkPaidDialog, markPaidInvoice, setMarkPaidInvoice, markPaidMethod, setMarkPaidMethod, markPaidNotes, setMarkPaidNotes, markPaidExtendSub, setMarkPaidExtendSub, setProcessingMarkPaid, fetchInvoices } = deps;
  const handleApproveInvoice = async (invoiceId: string) => {
    try {
      // 1. Buscar informações da fatura e plano
      const { data: invoice, error: invoiceError } = await supabase
        .from('subscription_invoices')
        .select('store_id, plans(billing_cycle)')
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        toast.error("Erro ao buscar informações da fatura");
        console.error(invoiceError);
        return;
      }

      // 2. Buscar data atual de expiração da loja
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('subscription_expires_at')
        .eq('id', invoice.store_id)
        .single();

      if (storeError) {
        toast.error("Erro ao buscar informações da loja");
        console.error(storeError);
        return;
      }

      // 3. Calcular nova data de expiração
      let newExpirationDate: Date;
      const currentExpiration = store.subscription_expires_at 
        ? new Date(store.subscription_expires_at) 
        : null;

      // Se ainda não expirou, adicionar período à data existente
      // Se já expirou ou não existe, começar de hoje
      if (currentExpiration && currentExpiration > new Date()) {
        newExpirationDate = new Date(currentExpiration);
      } else {
        newExpirationDate = new Date();
      }

      // Adicionar período baseado no billing_cycle
      const billingCycle = invoice.plans?.billing_cycle || 'monthly';
      if (billingCycle === 'monthly') {
        newExpirationDate.setMonth(newExpirationDate.getMonth() + 1);
      } else if (billingCycle === 'annual') {
        newExpirationDate.setFullYear(newExpirationDate.getFullYear() + 1);
      } else if (billingCycle === 'quarterly') {
        newExpirationDate.setMonth(newExpirationDate.getMonth() + 3);
      } else if (billingCycle === 'biannual') {
        newExpirationDate.setMonth(newExpirationDate.getMonth() + 6);
      }

      // 4. Atualizar fatura
      const { error: updateInvoiceError } = await supabase
        .from('subscription_invoices')
        .update({
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
          approved_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (updateInvoiceError) {
        toast.error("Erro ao aprovar pagamento");
        console.error(updateInvoiceError);
        return;
      }

      // 5. Atualizar loja com nova data de expiração
      const { error: updateStoreError } = await supabase
        .from('stores')
        .update({
          subscription_expires_at: newExpirationDate.toISOString(),
          status: 'active'
        })
        .eq('id', invoice.store_id);

      if (updateStoreError) {
        toast.error("Erro ao atualizar data de expiração da loja");
        console.error(updateStoreError);
        return;
      }

      toast.success(
        `Pagamento aprovado! Nova data de expiração: ${format(newExpirationDate, "dd/MM/yyyy", { locale: ptBR })}`
      );
      fetchInvoices();
      setShowDetailDialog(false);
    } catch (error) {
      toast.error("Erro ao processar aprovação");
      console.error(error);
    }
  };

  // Marcar fatura pendente como paga manualmente
  const handleMarkInvoiceAsPaid = async () => {
    if (!markPaidInvoice) return;
    setProcessingMarkPaid(true);
    try {
      const invoiceId = markPaidInvoice.id;
      // Mapeamento: valor do select → valor aceito no DB (CHECK constraint: pix, card, boleto, bank_transfer, other)
      const dbMethodMap: Record<string, string> = {
        pix: 'pix',
        card: 'card',
        boleto: 'boleto',
        bank_transfer: 'bank_transfer',
        other: 'other',
      };
      const paymentMethodLabels: Record<string, string> = {
        pix: 'PIX Manual',
        bank_transfer: 'Transferência Bancária',
        card: 'Cartão',
        boleto: 'Boleto',
        other: 'Outro',
      };
      const dbMethod = dbMethodMap[markPaidMethod] || 'other';
      const methodLabel = paymentMethodLabels[markPaidMethod] || markPaidMethod;
      const notesText = `Marcado como pago pelo admin - ${methodLabel}${markPaidNotes ? ` | ${markPaidNotes}` : ''}`;

      // 1. Atualizar fatura
      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from('subscription_invoices')
        .update({
          payment_status: 'paid' as string,
          paid_at: now,
          approved_at: now,
          payment_method: dbMethod,
          notes: notesText,
          updated_at: now,
        })
        .eq('id', invoiceId);

      if (updateError) {
        console.error("Erro ao atualizar fatura:", updateError.message, updateError.details, updateError.hint);
        toast.error(`Erro ao marcar fatura como paga: ${updateError.message}`);
        return;
      }

      // 2. Estender assinatura se selecionado
      if (markPaidExtendSub) {
        const storeId = markPaidInvoice.store_id;
        const { data: store } = await supabase
          .from('stores')
          .select('subscription_expires_at, plan_id, plans(billing_cycle)')
          .eq('id', storeId)
          .single();

        if (store) {
          let newExpDate: Date;
          const curExp = store?.subscription_expires_at ? new Date(store.subscription_expires_at) : null;
          if (curExp && curExp > new Date()) {
            newExpDate = new Date(curExp);
          } else {
            newExpDate = new Date();
          }

          const cycle = (store.plans as any)?.billing_cycle || 'monthly';
          if (cycle === 'monthly') newExpDate.setMonth(newExpDate.getMonth() + 1);
          else if (cycle === 'annual') newExpDate.setFullYear(newExpDate.getFullYear() + 1);
          else if (cycle === 'quarterly') newExpDate.setMonth(newExpDate.getMonth() + 3);
          else if (cycle === 'biannual') newExpDate.setMonth(newExpDate.getMonth() + 6);
          else newExpDate.setMonth(newExpDate.getMonth() + 1);

          const { error: storeError } = await supabase
            .from('stores')
            .update({ subscription_expires_at: newExpDate.toISOString(), status: 'active' })
            .eq('id', storeId);

          if (storeError) {
            console.error("Erro ao estender assinatura:", storeError);
            toast.success("Fatura marcada como paga! (Erro ao estender assinatura)");
          } else {
            toast.success(`Fatura marcada como paga! Assinatura estendida até ${format(newExpDate, "dd/MM/yyyy", { locale: ptBR })}`);
          }
        } else {
          toast.success("Fatura marcada como paga!");
        }
      } else {
        toast.success("Fatura marcada como paga!");
      }

      fetchInvoices();
      setShowMarkPaidDialog(false);
      setMarkPaidInvoice(null);
      setMarkPaidMethod("pix");
      setMarkPaidNotes("");
      setMarkPaidExtendSub(true);
    } catch (error) {
      toast.error("Erro ao processar pagamento");
      console.error(error);
    } finally {
      setProcessingMarkPaid(false);
    }
  };

  const openMarkPaidDialog = (invoice: Invoice) => {
    setMarkPaidInvoice(invoice);
    setMarkPaidMethod("pix");
    setMarkPaidNotes("");
    setMarkPaidExtendSub(true);
    setShowMarkPaidDialog(true);
  };

  const handleRejectInvoice = async (invoiceId: string) => {
    const { error } = await supabase
      .from('subscription_invoices')
      .update({
        payment_status: 'pending',
        payment_proof_url: null,
      })
      .eq('id', invoiceId);

    if (error) {
      toast.error("Erro ao rejeitar pagamento");
      console.error(error);
    } else {
      toast.success("Pagamento rejeitado. Lojista pode enviar novo comprovante.");
      fetchInvoices();
      setShowDetailDialog(false);
    }
  };


  return {
    handleApproveInvoice,
    handleMarkInvoiceAsPaid,
    openMarkPaidDialog,
    handleRejectInvoice,
  };
}
