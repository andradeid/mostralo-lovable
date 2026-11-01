// Criar, editar e excluir fatura; abrir diálogos.
// Código movido da SubscriptionPaymentsManagementPage sem mudança de comportamento.
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { normalizePhone } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Invoice } from "@/lib/subscriptionPayments/types";

export type UseInvoiceFormsDeps = { [K in 'selectedInvoice' | 'setSelectedInvoice' | 'setShowCreateDialog' | 'setShowEditDialog' | 'setShowDeleteDialog' | 'stores' | 'formData' | 'setFormData' | 'setUseCustomPrice' | 'setOriginalPlanPrice' | 'setSelectedStoreData' | 'markAsPaid' | 'setMarkAsPaid' | 'paymentDate' | 'setPaymentDate' | 'paymentMethod' | 'setPaymentMethod' | 'pixTransactionId' | 'setPixTransactionId' | 'extendSubscription' | 'setExtendSubscription' | 'monthsToExtend' | 'setMonthsToExtend' | 'setCreatingInvoice' | 'sendWhatsApp' | 'setSendWhatsApp' | 'whatsappPhone' | 'setWhatsappPhone' | 'setSendingWhatsApp' | 'fetchInvoices']: any };

export function useInvoiceForms(deps: UseInvoiceFormsDeps) {
  const { selectedInvoice, setSelectedInvoice, setShowCreateDialog, setShowEditDialog, setShowDeleteDialog, stores, formData, setFormData, setUseCustomPrice, setOriginalPlanPrice, setSelectedStoreData, markAsPaid, setMarkAsPaid, paymentDate, setPaymentDate, paymentMethod, setPaymentMethod, pixTransactionId, setPixTransactionId, extendSubscription, setExtendSubscription, monthsToExtend, setMonthsToExtend, setCreatingInvoice, sendWhatsApp, setSendWhatsApp, whatsappPhone, setWhatsappPhone, setSendingWhatsApp, fetchInvoices } = deps;
  const handleCreateInvoice = async () => {
    if (!formData.store_id || !formData.plan_id || !formData.amount || !formData.due_date) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setCreatingInvoice(true);
    
    try {
      // Preparar dados base da fatura
      const invoiceData: any = {
        store_id: formData.store_id,
        plan_id: formData.plan_id,
        amount: Number(formData.amount),
        due_date: formData.due_date,
        notes: formData.notes || null,
        payment_status: markAsPaid ? 'paid' : 'pending'
      };

      // Se marcado como pago, adicionar informações de pagamento
      if (markAsPaid) {
        invoiceData.paid_at = new Date(paymentDate).toISOString();
        invoiceData.approved_at = new Date().toISOString();
        invoiceData.payment_method = paymentMethod;
        
        // Adicionar ID da transação PIX nas notas
        if (pixTransactionId) {
          const existingNotes = formData.notes || '';
          invoiceData.notes = `${existingNotes}${existingNotes ? ' | ' : ''}PIX ID: ${pixTransactionId}`.trim();
        }
      }

      const { data: createdInvoice, error } = await supabase
        .from('subscription_invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (error || !createdInvoice) {
        toast.error("Erro ao criar fatura");
        console.error(error);
        return;
      }

      const invoiceId = createdInvoice.id;

      // Se marcado como pago E opção de estender assinatura ativa
      if (markAsPaid && extendSubscription && monthsToExtend > 0) {
        // Buscar data atual de expiração da loja
        const { data: store, error: storeError } = await supabase
          .from('stores')
          .select('subscription_expires_at')
          .eq('id', formData.store_id)
          .single();

        if (!storeError && store) {
          // Calcular nova data de expiração
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

          // Adicionar meses
          newExpirationDate.setMonth(newExpirationDate.getMonth() + monthsToExtend);

          // Atualizar loja com nova data de expiração
          const { error: updateStoreError } = await supabase
            .from('stores')
            .update({
              subscription_expires_at: newExpirationDate.toISOString(),
              status: 'active'
            })
            .eq('id', formData.store_id);

          if (updateStoreError) {
            console.error("Erro ao estender assinatura:", updateStoreError);
            toast.warning("Fatura criada, mas erro ao estender assinatura");
          } else {
            toast.success(`Fatura paga criada! Assinatura estendida até ${format(newExpirationDate, "dd/MM/yyyy", { locale: ptBR })}`);
          }
        }
      } else if (markAsPaid) {
        toast.success("Fatura criada como PAGA com sucesso!");
      } else {
        toast.success("Fatura criada com sucesso!");
      }

      // Enviar link por WhatsApp se solicitado (apenas para faturas pendentes)
      if (sendWhatsApp && whatsappPhone && !markAsPaid) {
        setSendingWhatsApp(true);
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            const response = await supabase.functions.invoke('send-invoice-whatsapp', {
              body: {
                invoice_id: invoiceId,
                phone_number: normalizePhone(whatsappPhone)
              }
            });

            if (response.error) {
              console.error('Erro ao enviar WhatsApp:', response.error);
              toast.error('Fatura criada, mas erro ao enviar WhatsApp');
            } else {
              toast.success('📱 Link de pagamento enviado por WhatsApp!');
            }
          }
        } catch (whatsappError) {
          console.error('Erro ao enviar WhatsApp:', whatsappError);
          toast.error('Fatura criada, mas erro ao enviar WhatsApp');
        } finally {
          setSendingWhatsApp(false);
        }
      }
      
      setShowCreateDialog(false);
      resetForm();
      fetchInvoices();
    } catch (error) {
      toast.error("Erro ao criar fatura");
      console.error(error);
    } finally {
      setCreatingInvoice(false);
    }
  };

  const handleEditInvoice = async () => {
    if (!selectedInvoice || !formData.amount || !formData.due_date) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const { error } = await supabase
      .from('subscription_invoices')
      .update({
        amount: Number(formData.amount),
        due_date: formData.due_date,
        notes: formData.notes || null
      })
      .eq('id', selectedInvoice.id);

    if (error) {
      toast.error("Erro ao editar fatura");
      console.error(error);
    } else {
      toast.success("Fatura editada com sucesso!");
      setShowEditDialog(false);
      resetForm();
      fetchInvoices();
    }
  };

  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return;

    const { error } = await supabase
      .from('subscription_invoices')
      .delete()
      .eq('id', selectedInvoice.id);

    if (error) {
      toast.error("Erro ao excluir fatura");
      console.error(error);
    } else {
      toast.success("Fatura excluída com sucesso!");
      setShowDeleteDialog(false);
      setSelectedInvoice(null);
      fetchInvoices();
    }
  };

  const resetForm = () => {
    setFormData({
      store_id: "",
      plan_id: "",
      amount: "",
      due_date: "",
      notes: "",
      discount_reason: ""
    });
    setUseCustomPrice(false);
    setOriginalPlanPrice(0);
    setSelectedStoreData(null);
    // Reset estados de pagamento direto
    setMarkAsPaid(false);
    setPaymentDate(format(new Date(), "yyyy-MM-dd"));
    setPaymentMethod("pix");
    setPixTransactionId("");
    setExtendSubscription(true);
    setMonthsToExtend(1);
    // Reset estados de WhatsApp
    setSendWhatsApp(false);
    setWhatsappPhone("");
  };

  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };

  const openEditDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      store_id: invoice.store_id,
      plan_id: invoice.plan_id,
      amount: invoice.amount.toString(),
      due_date: invoice.due_date?.slice(0, 10) || "",
      notes: invoice.notes || "",
      discount_reason: ""
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDeleteDialog(true);
  };


  return {
    handleCreateInvoice,
    handleEditInvoice,
    handleDeleteInvoice,
    resetForm,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
  };
}
