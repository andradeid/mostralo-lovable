// Teste rápido de conexão, busca de cliente e envio de mensagem com template.
// Código movido da WhatsAppInstancePage sem mudança de comportamento.
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Customer } from "@/lib/whatsappInstance/types";
import { calculateDaysInactive } from "@/lib/whatsappInstance/messageLogs";

export type UseWhatsAppTestToolsDeps = { [K in 'storeId' | 'toast' | 'storeName' | 'storeSlug' | 'templates' | 'fetchMessageLogs' | 'isUazapiInstance']: any };

export function useWhatsAppTestTools(deps: UseWhatsAppTestToolsDeps) {
  const { storeId, toast, storeName, storeSlug, templates, fetchMessageLogs, isUazapiInstance } = deps;
  // Estados para teste de conexão
  const [testPhone, setTestPhone] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  // Estados para envio de mensagem de teste
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [sendTestLoading, setSendTestLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const searchCustomers = async (query: string) => {
    if (!query || query.length < 2) {
      setCustomers([]);
      return;
    }

    setSearchLoading(true);
    try {
      const { data } = await supabase
        .from('customer_stores')
        .select(`
          customer_id,
          total_orders,
          total_spent,
          last_order_at,
          customers!inner(id, name, phone)
        `)
        .eq('store_id', storeId)
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%`, { referencedTable: 'customers' })
        .limit(10);

      if (data) {
        const formattedCustomers: Customer[] = data.map((item: any) => ({
          id: item.customers.id,
          name: item.customers.name,
          phone: item.customers.phone,
          total_orders: item.total_orders || 0,
          total_spent: item.total_spent || 0,
          last_order_at: item.last_order_at,
        }));
        setCustomers(formattedCustomers);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const testConnection = async () => {
    if (!testPhone) {
      toast({
        title: "Número obrigatório",
        description: "Digite um número para testar a conexão",
        variant: "destructive",
      });
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      let response;
      
      if (isUazapiInstance) {
        // Enviar via UaZapi
        response = await supabase.functions.invoke('uazapi-manage', {
          body: {
            action: 'send_text',
            store_id: storeId,
            phone_number: testPhone,
            text: `✅ Teste de conexão do Mostralo!\n\nSua conexão WhatsApp (UaZapi) está funcionando corretamente.\n\n🕐 ${new Date().toLocaleString('pt-BR')}`,
          },
        });
      } else {
        // Enviar via Evolution API
        response = await supabase.functions.invoke('whatsapp-send', {
          body: {
            storeId,
            phoneNumber: testPhone,
            messageType: 'text',
            content: `✅ Teste de conexão do Mostralo!\n\nSua conexão WhatsApp está funcionando corretamente.\n\n🕐 ${new Date().toLocaleString('pt-BR')}`,
          },
        });
      }

      // Em erros HTTP (ex: 400), o Supabase retorna error genérico.
      // Aqui tentamos extrair a mensagem real do body (error.context.json()).
      if (response.error) {
        let errorMessage = response.error.message || 'Falha ao enviar mensagem de teste';

        const errAny = response.error as unknown as { context?: { json?: () => Promise<any> } };
        if (errAny?.context?.json) {
          try {
            const errorBody = await errAny.context.json();
            if (errorBody?.error) errorMessage = errorBody.error;
          } catch {
            // ignora falha ao ler body
          }
        }

        setTestResult({ success: false, message: errorMessage });
        toast({
          title: 'Erro no teste',
          description: errorMessage,
          variant: 'destructive',
          duration: 8000,
        });
        return;
      }

      if (response.data?.success) {
        setTestResult({ success: true, message: 'Conexão funcionando! Mensagem enviada com sucesso.' });
        toast({
          title: "Teste bem-sucedido!",
          description: "Mensagem de teste enviada com sucesso",
        });

        // Registrar no histórico de mensagens avulsas
        const messageContent = isUazapiInstance
          ? `✅ Teste de conexão do Mostralo!\n\nSua conexão WhatsApp (UaZapi) está funcionando corretamente.\n\n🕐 ${new Date().toLocaleString('pt-BR')}`
          : `✅ Teste de conexão do Mostralo!\n\nSua conexão WhatsApp está funcionando corretamente.\n\n🕐 ${new Date().toLocaleString('pt-BR')}`;

        try {
          await supabase
            .from('whatsapp_messages' as any)
            .insert({
              store_id: storeId,
              phone_number: testPhone,
              content: messageContent,
              status: 'sent',
              sent_at: new Date().toISOString(),
              campaign_id: null,
            } as any);
        } catch (logError) {
          console.error('Erro ao registrar mensagem no histórico:', logError);
        }

        // Atualizar histórico
        fetchMessageLogs();
      } else {
        // Mostrar erro amigável da API
        const errorMessage = response.data?.error || 'Falha no envio';
        setTestResult({ success: false, message: errorMessage });
        toast({
          title: "Erro no teste",
          description: errorMessage,
          variant: "destructive",
          duration: 8000, // Mais tempo para ler
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao enviar mensagem de teste';
      setTestResult({ success: false, message: errorMessage });
      toast({
        title: "Erro no teste",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setTestLoading(false);
    }
  };


  const renderMessagePreview = (content: string, customer: Customer): string => {
    const storeLink = `${window.location.origin}/loja/${storeSlug}`;
    
    return content
      .replace(/{nome}/g, customer.name)
      .replace(/{primeiro_nome}/g, customer.name?.split(' ')[0] || '')
      .replace(/{telefone}/g, customer.phone)
      .replace(/{total_pedidos}/g, customer.total_orders?.toString() || '0')
      .replace(/{total_gasto}/g, `R$ ${customer.total_spent?.toFixed(2) || '0,00'}`)
      .replace(/{dias_inativo}/g, calculateDaysInactive(customer.last_order_at))
      .replace(/{ultimo_pedido}/g, customer.last_order_at ? format(new Date(customer.last_order_at), "dd/MM/yyyy", { locale: ptBR }) : '—')
      .replace(/{loja}/g, storeName)
      .replace(/{link_loja}/g, storeLink);
  };

  const sendTestMessage = async () => {
    if (!selectedCustomer || !selectedTemplateId) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um cliente e um template",
        variant: "destructive",
      });
      return;
    }

    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;

    setSendTestLoading(true);

    try {
      const messageContent = renderMessagePreview(template.content, selectedCustomer);

      const response = await supabase.functions.invoke('whatsapp-send', {
        body: {
          storeId,
          phoneNumber: selectedCustomer.phone,
          messageType: template.message_type,
          content: messageContent,
          mediaUrl: template.media_url,
          customerId: selectedCustomer.id,
          templateId: template.id,
        },
      });

      if (response.error) throw response.error;

      if (response.data?.success) {
        toast({
          title: "Mensagem enviada!",
          description: `Mensagem enviada com sucesso para ${selectedCustomer.name}`,
        });
        // Reset
        setSelectedCustomer(null);
        setSelectedTemplateId('');
        setCustomerSearch('');
        setCustomers([]);
      } else {
        throw new Error(response.data?.error || 'Falha no envio');
      }
    } catch (error: any) {
      toast({
        title: "Erro no envio",
        description: error.message || "Falha ao enviar mensagem",
        variant: "destructive",
      });
    } finally {
      setSendTestLoading(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return {
    testPhone,
    setTestPhone,
    testLoading,
    setTestLoading,
    testResult,
    setTestResult,
    selectedTemplateId,
    setSelectedTemplateId,
    customerSearch,
    setCustomerSearch,
    customers,
    setCustomers,
    selectedCustomer,
    setSelectedCustomer,
    sendTestLoading,
    setSendTestLoading,
    searchLoading,
    setSearchLoading,
    searchCustomers,
    testConnection,
    renderMessagePreview,
    sendTestMessage,
    selectedTemplate,
  };
}
