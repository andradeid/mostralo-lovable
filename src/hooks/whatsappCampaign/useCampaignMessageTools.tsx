// Teste de envio, prévia da mensagem e formatação de telefone.
// Código movido da WhatsAppCampaignNewPage sem mudança de comportamento.
import { supabase } from "@/integrations/supabase/client";

export type UseCampaignMessageToolsDeps = { [K in 'toast' | 'storeId' | 'storeName' | 'storeSlug' | 'testNumber' | 'setTestNumber' | 'setSendingTest' | 'setValidatingTestNumber' | 'testNumberValid' | 'setTestNumberValid' | 'setValidationStep' | 'form']: any };

export function useCampaignMessageTools(deps: UseCampaignMessageToolsDeps) {
  const { toast, storeId, storeName, storeSlug, testNumber, setTestNumber, setSendingTest, setValidatingTestNumber, testNumberValid, setTestNumberValid, setValidationStep, form } = deps;
  // Validar número de teste
  const validateTestNumber = async () => {
    const cleanNumber = testNumber.replace(/\D/g, '');
    
    if (!cleanNumber || cleanNumber.length < 10) {
      toast({
        title: "Número inválido",
        description: "Digite um número válido com DDD",
        variant: "destructive",
      });
      return;
    }

    setValidatingTestNumber(true);
    setTestNumberValid(null);

    try {
      setValidationStep('Aguarde um momento...');
      await new Promise(r => setTimeout(r, 600));
      
      setValidationStep('Verificando WhatsApp...');
      await new Promise(r => setTimeout(r, 500));
      
      setValidationStep('Validando número...');

      const fullPhone = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;

      const { data, error } = await supabase.functions.invoke('validate-whatsapp-number', {
        body: { phone: fullPhone, sendWelcome: false }
      });

      if (error) throw error;

      await new Promise(r => setTimeout(r, 300));

      if (data?.valid) {
        setTestNumberValid(true);
        setValidationStep('Número validado!');
        toast({
          title: "Número validado!",
          description: "Agora você pode enviar o teste",
        });
      } else {
        setTestNumberValid(false);
        setValidationStep('WhatsApp não encontrado');
        toast({
          title: "Número inválido",
          description: "Este número não possui WhatsApp ativo",
          variant: "destructive",
        });
        setTestNumber('');
      }
    } catch (error) {
      console.error('Erro ao validar:', error);
      setTestNumberValid(false);
      setValidationStep('Erro na validação');
      toast({
        title: "Erro",
        description: "Não foi possível validar o número",
        variant: "destructive",
      });
    } finally {
      setValidatingTestNumber(false);
      setTimeout(() => setValidationStep(''), 3000);
    }
  };

  // Testar envio
  const sendTestMessage = async () => {
    if (!testNumberValid) {
      toast({
        title: "Número não validado",
        description: "Valide o número antes de enviar",
        variant: "destructive",
      });
      return;
    }

    // Validação baseada no tipo
    if (form.interaction_type === 'poll') {
      if (!form.poll_question.trim()) {
        toast({ title: "Erro", description: "Digite a pergunta da enquete", variant: "destructive" });
        return;
      }
      const validOptions = form.poll_options.filter(o => o.trim());
      if (validOptions.length < 2) {
        toast({ title: "Erro", description: "Adicione pelo menos 2 opções", variant: "destructive" });
        return;
      }
    } else {
      if (!form.custom_message.trim()) {
        toast({ title: "Mensagem obrigatória", description: "Escreva uma mensagem para enviar", variant: "destructive" });
        return;
      }
    }

    setSendingTest(true);
    try {
      const testContent = renderMessagePreview(form.custom_message);
      
      const payload: any = {
        storeId,
        phoneNumber: testNumber.replace(/\D/g, ''),
      };

      // Configurar payload baseado no tipo de interação
      if (form.interaction_type === 'poll') {
        payload.messageType = 'poll';
        payload.pollQuestion = form.poll_question;
        payload.pollOptions = form.poll_options.filter(o => o.trim());
        payload.pollSelectableCount = form.poll_selectable_count;
        payload.content = form.poll_question; // Fallback
      } else if (form.media_url && form.media_type) {
        payload.messageType = form.media_type;
        payload.mediaUrl = form.media_url;
        payload.content = testContent;
      } else {
        payload.messageType = 'text';
        payload.content = testContent;
      }

      const { error } = await supabase.functions.invoke('whatsapp-send', {
        body: payload
      });

      if (error) throw error;

      toast({
        title: "Teste enviado!",
        description: "Verifique seu WhatsApp",
      });
    } catch (error: any) {
      toast({
        title: "Erro no envio",
        description: error.message || "Não foi possível enviar o teste",
        variant: "destructive",
      });
    } finally {
      setSendingTest(false);
    }
  };

  // Função para substituir variáveis por exemplos
  const renderMessagePreview = (content: string) => {
    const domain = window.location.origin;
    const linkLoja = `${domain}/loja/${storeSlug}`;
    
    return content
      .replace(/\{primeiro_nome\}/g, 'Maria')
      .replace(/\{nome\}/g, 'Maria Silva')
      .replace(/\{loja\}/g, storeName || 'Sua Loja')
      .replace(/\{link_loja\}/g, linkLoja)
      .replace(/\{dias_inativo\}/g, String(form.filter_days_inactive))
      .replace(/\{total_pedidos\}/g, '5')
      .replace(/\{total_gasto\}/g, 'R$ 150,00')
      .replace(/\{ultimo_pedido\}/g, '25/11/2024');
  };

  // Detectar variáveis no template
  const detectVariables = (content: string): string[] => {
    const regex = /\{(\w+)\}/g;
    const matches = content.match(regex) || [];
    return [...new Set(matches)];
  };

  const variableDescriptions: Record<string, string> = {
    '{primeiro_nome}': 'Primeiro nome do cliente',
    '{nome}': 'Nome completo do cliente',
    '{loja}': 'Nome da sua loja',
    '{link_loja}': 'Link do cardápio digital',
    '{dias_inativo}': 'Dias desde o último pedido',
    '{total_pedidos}': 'Total de pedidos do cliente',
    '{total_gasto}': 'Valor total gasto pelo cliente',
    '{ultimo_pedido}': 'Data do último pedido',
  };

  // Função para formatar telefone
  const formatPhone = (phone: string) => {
    const cleaned = phone?.replace(/\D/g, '') || '';
    if (cleaned.length === 13) {
      return `(${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    if (cleaned.length === 12) {
      return `(${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
    }
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Função para validar números em lote

  return {
    validateTestNumber,
    sendTestMessage,
    renderMessagePreview,
    detectVariables,
    variableDescriptions,
    formatPhone,
  };
}
