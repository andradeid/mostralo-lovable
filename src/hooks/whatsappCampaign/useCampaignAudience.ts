// Público: prévia, validação em lote, contatos manuais e busca de clientes.
// Código movido da WhatsAppCampaignNewPage; a prévia reaproveita o rascunho já criado.
import { supabase } from "@/integrations/supabase/client";

export type UseCampaignAudienceDeps = { [K in 'toast' | 'storeId' | 'setPreviewing' | 'previewData' | 'setPreviewData' | 'setValidatingBatch' | 'setValidationStage' | 'setValidationProgress' | 'manualContactsInput' | 'setManualContactsInput' | 'manualContacts' | 'setManualContacts' | 'setValidatingManual' | 'setCustomerSearchQuery' | 'setCustomerSearchResults' | 'setSearchingCustomers' | 'form']: any };

export function useCampaignAudience(deps: UseCampaignAudienceDeps) {
  const { toast, storeId, setPreviewing, previewData, setPreviewData, setValidatingBatch, setValidationStage, setValidationProgress, manualContactsInput, setManualContactsInput, manualContacts, setManualContacts, setValidatingManual, setCustomerSearchQuery, setCustomerSearchResults, setSearchingCustomers, form } = deps;
  const validateBatchNumbers = async () => {
    if (!previewData?.sampleRecipients) return;
    
    const pendingIds = previewData.sampleRecipients
      .filter((r: any) => r.whatsapp_valid === null)
      .map((r: any) => r.id);
    
    if (pendingIds.length === 0) {
      toast({
        title: "Todos validados",
        description: "Todos os números já foram validados",
      });
      return;
    }

    setValidatingBatch(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-whatsapp-batch', {
        body: { customerIds: pendingIds, storeId }
      });

      if (error) throw error;

      toast({
        title: "Validação concluída!",
        description: `${data.valid} válidos, ${data.invalid} inválidos`,
      });

      // Recarregar preview para atualizar status
      await previewCampaign();
    } catch (error: any) {
      toast({
        title: "Erro na validação",
        description: error.message || "Não foi possível validar",
        variant: "destructive",
      });
    } finally {
      setValidatingBatch(false);
    }
  };

  const previewCampaign = async () => {
    // Validação baseada no tipo
    if (form.interaction_type === 'poll') {
      if (!form.poll_question.trim()) {
        toast({ title: "Erro", description: "Digite a pergunta da enquete", variant: "destructive" });
        return;
      }
      const validOptions = form.poll_options.filter(o => o.trim());
      if (validOptions.length < 2) {
        toast({ title: "Erro", description: "Adicione pelo menos 2 opções na enquete", variant: "destructive" });
        return;
      }
    } else {
      if (!form.custom_message.trim()) {
        toast({ title: "Erro", description: "Escreva uma mensagem primeiro", variant: "destructive" });
        return;
      }
    }

    setPreviewing(true);
    setValidationProgress(0);
    
    try {
      // Etapa 1: Buscando clientes
      setValidationStage('Buscando clientes...');
      setValidationProgress(15);
      await new Promise(r => setTimeout(r, 400));
      // Rascunho da prévia: reaproveita o já criado (antes cada clique criava um rascunho novo)
      const draftFields = {
          name: form.name || 'Campanha Preview',
          description: form.description,
          template_id: form.template_id || null,
          custom_message: form.custom_message,
          media_url: form.media_url || null,
          media_type: form.media_type || null,
          filter_days_inactive: form.filter_days_inactive || null,
          filter_min_orders: form.filter_min_orders || null,
          filter_max_orders: form.filter_max_orders || null,
          filter_min_spent: form.filter_min_spent || null,
          filter_max_spent: form.filter_max_spent || null,
          message_interval_seconds: form.message_interval_seconds,
          daily_limit: form.daily_limit,
          start_hour: form.start_hour,
          end_hour: form.end_hour,
          pause_after_messages: form.pause_enabled ? form.pause_after_messages : 0,
          pause_duration_seconds: form.pause_duration_seconds,
          status: 'draft',
          // Campos de enquete
          interaction_type: form.interaction_type,
          poll_question: form.poll_question || null,
          poll_options: form.poll_options.filter(o => o.trim()).length > 0 ? form.poll_options.filter(o => o.trim()) : null,
          poll_selectable_count: form.poll_selectable_count,
      };
      const existingId: string | undefined = previewData?.campaignId;
      const { data: campaign, error: createError } = existingId
        ? await supabase.from('whatsapp_campaigns' as any).update(draftFields).eq('id', existingId).select().single()
        : await supabase.from('whatsapp_campaigns' as any).insert({ store_id: storeId, ...draftFields }).select().single();

      if (createError || !campaign) throw createError;
      
      const campaignData = campaign as any;

      // Etapa 2: Aplicando filtros
      setValidationStage('Aplicando filtros de segmentação...');
      setValidationProgress(40);
      await new Promise(r => setTimeout(r, 300));

      // Etapa 3: Verificando números
      setValidationStage('Verificando números WhatsApp...');
      setValidationProgress(60);

      // Fazer preview
      const response = await supabase.functions.invoke('whatsapp-campaign', {
        body: { action: 'preview', campaignId: campaignData.id, storeId },
      });

      if (response.error) throw response.error;

      // Etapa 4: Finalizando
      setValidationStage('Finalizando...');
      setValidationProgress(90);
      await new Promise(r => setTimeout(r, 200));

      setPreviewData({
        ...response.data,
        campaignId: campaignData.id,
      });
      
      setValidationProgress(100);
      setValidationStage('Concluído!');
      await new Promise(r => setTimeout(r, 300));

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer preview",
        variant: "destructive",
      });
    } finally {
      setPreviewing(false);
      setTimeout(() => {
        setValidationStage('');
        setValidationProgress(0);
      }, 500);
    }
  };

  // Parsear e adicionar contatos manuais
  const parseManualContacts = () => {
    const lines = manualContactsInput.trim().split('\n').filter(l => l.trim());
    const parsed: typeof manualContacts = [];
    
    for (const line of lines) {
      // Suporta: "Nome, Telefone" ou "Nome | Telefone" ou "Nome - Telefone" ou "Nome;Telefone"
      const parts = line.split(/[,|;\-]/).map(p => p.trim());
      if (parts.length >= 2) {
        const name = parts[0];
        const phone = parts[1].replace(/\D/g, '');
        if (phone.length >= 10) {
          // Verificar se já existe
          if (!parsed.some(c => c.phone === phone) && 
              !manualContacts.some(c => c.phone === phone)) {
            parsed.push({ name, phone, valid: null, selected: true });
          }
        }
      }
    }
    
    if (parsed.length === 0) {
      toast({
        title: "Nenhum contato válido",
        description: "Use o formato: Nome, Telefone (um por linha)",
        variant: "destructive",
      });
      return;
    }
    
    setManualContacts(prev => [...prev, ...parsed]);
    setManualContactsInput('');
    toast({
      title: `${parsed.length} contatos adicionados!`,
      description: "Valide os números antes de enviar",
    });
  };

  // Validar contatos manuais
  const validateManualContacts = async () => {
    const pending = manualContacts.filter(c => c.valid === null);
    if (pending.length === 0) {
      toast({ title: "Todos já validados" });
      return;
    }
    
    setValidatingManual(true);
    try {
      let validCount = 0;
      let invalidCount = 0;
      
      for (let i = 0; i < pending.length; i++) {
        const contact = pending[i];
        const fullPhone = contact.phone.startsWith('55') ? contact.phone : `55${contact.phone}`;
        
        try {
          const { data } = await supabase.functions.invoke('validate-whatsapp-number', {
            body: { phone: fullPhone, sendWelcome: false }
          });
          
          setManualContacts(prev => prev.map(c => 
            c.phone === contact.phone 
              ? { ...c, valid: data?.valid === true }
              : c
          ));
          
          if (data?.valid) validCount++;
          else invalidCount++;
        } catch {
          setManualContacts(prev => prev.map(c => 
            c.phone === contact.phone ? { ...c, valid: false } : c
          ));
          invalidCount++;
        }
        
        // Pequeno delay entre validações
        if (i < pending.length - 1) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
      
      toast({
        title: "Validação concluída!",
        description: `${validCount} válidos, ${invalidCount} inválidos`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao validar",
        variant: "destructive",
      });
    } finally {
      setValidatingManual(false);
    }
  };

  // Remover contato manual
  const removeManualContact = (phone: string) => {
    setManualContacts(prev => prev.filter(c => c.phone !== phone));
  };

  // Toggle seleção de contato manual
  const toggleManualContact = (phone: string) => {
    setManualContacts(prev => prev.map(c => 
      c.phone === phone ? { ...c, selected: !c.selected } : c
    ));
  };

  // Buscar clientes da base
  const searchCustomers = async (query: string) => {
    if (!query || query.length < 2) {
      setCustomerSearchResults([]);
      return;
    }
    
    setSearchingCustomers(true);
    try {
      // Buscar clientes que batem com nome ou telefone
      const { data } = await supabase
        .from('customer_stores')
        .select(`
          customer:customers(id, name, phone, whatsapp_valid)
        `)
        .eq('store_id', storeId)
        .limit(10);
      
      if (data) {
        // Filtrar por nome ou telefone no frontend (mais flexível)
        const results = data
          .map((cs: any) => cs.customer)
          .filter(Boolean)
          .filter((c: any) => {
            const nameMatch = c.name?.toLowerCase().includes(query.toLowerCase());
            const phoneMatch = c.phone?.replace(/\D/g, '').includes(query.replace(/\D/g, ''));
            return nameMatch || phoneMatch;
          })
          .slice(0, 5);
        
        setCustomerSearchResults(results);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setSearchingCustomers(false);
    }
  };

  // Adicionar cliente da busca à lista manual
  const addCustomerFromSearch = (customer: any) => {
    const phone = customer.phone?.replace(/\D/g, '') || '';
    
    // Verificar se já existe
    if (manualContacts.some(c => c.phone === phone)) {
      toast({
        title: "Cliente já adicionado",
        description: `${customer.name} já está na lista`,
      });
      return;
    }
    
    setManualContacts(prev => [...prev, {
      name: customer.name,
      phone: phone,
      valid: customer.whatsapp_valid,
      selected: true,
    }]);
    
    setCustomerSearchQuery('');
    setCustomerSearchResults([]);
    
    toast({
      title: "Cliente adicionado!",
      description: `${customer.name} foi adicionado à lista`,
    });
  };


  return {
    validateBatchNumbers,
    previewCampaign,
    parseManualContacts,
    validateManualContacts,
    removeManualContact,
    toggleManualContact,
    searchCustomers,
    addCustomerFromSearch,
  };
}
