// Iniciar campanha, salvar rascunho e salvar mensagem.
// Código movido da WhatsAppCampaignNewPage sem mudança de comportamento.
import { supabase } from "@/integrations/supabase/client";
import { Upload, Image, Video, FileText } from "lucide-react";

export type UseCampaignSubmitDeps = { [K in 'navigate' | 'toast' | 'storeId' | 'setLoading' | 'previewData' | 'setPreviewData' | 'setSavingMessage' | 'manualContacts' | 'form']: any };

export function useCampaignSubmit(deps: UseCampaignSubmitDeps) {
  const { navigate, toast, storeId, setLoading, previewData, setPreviewData, setSavingMessage, manualContacts, form } = deps;
  const startCampaign = async () => {
    if (!previewData?.campaignId) {
      toast({
        title: "Erro",
        description: "Faça o preview primeiro",
        variant: "destructive",
      });
      return;
    }

    // Contatos manuais selecionados e válidos
    const selectedManualContacts = manualContacts
      .filter(c => c.selected && c.valid !== false)
      .map(c => ({ name: c.name, phone: c.phone }));

    if (previewData.totalRecipients === 0 && selectedManualContacts.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum destinatário selecionado",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Verificar se é agendamento
      const isScheduled = form.schedule_type === 'scheduled';
      let scheduledStartAt = null;
      
      if (isScheduled) {
        scheduledStartAt = new Date(form.scheduled_date + 'T' + form.scheduled_time).toISOString();
      }

      // Atualizar nome, descrição e configurações antes de iniciar
      await supabase
        .from('whatsapp_campaigns' as any)
        .update({
          name: form.name,
          description: form.description,
          custom_message: form.custom_message,
          media_url: form.media_url || null,
          media_type: form.media_type || null,
          pause_after_messages: form.pause_enabled ? form.pause_after_messages : 0,
          pause_duration_seconds: form.pause_duration_seconds,
          scheduled_start_at: scheduledStartAt,
          status: isScheduled ? 'scheduled' : 'draft',
        })
        .eq('id', previewData.campaignId);

      if (isScheduled) {
        // Apenas salvar como agendada
        toast({
          title: "Campanha Agendada!",
          description: `Será iniciada em ${new Date(scheduledStartAt!).toLocaleDateString('pt-BR')} às ${form.scheduled_time}`,
        });
        navigate('/dashboard/whatsapp/campaigns');
        return;
      }

      // Iniciar campanha imediatamente - incluir contatos manuais
      const response = await supabase.functions.invoke('whatsapp-campaign', {
        body: { 
          action: 'start', 
          campaignId: previewData.campaignId, 
          storeId,
          manualContacts: selectedManualContacts,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Campanha Iniciada!",
        description: `${response.data.totalMessages} mensagens serão enviadas`,
      });

      navigate('/dashboard/whatsapp/campaigns');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao iniciar campanha",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    if (!form.name || !form.custom_message.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o nome e a mensagem",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (previewData?.campaignId) {
        // Atualizar rascunho existente
        await supabase
          .from('whatsapp_campaigns' as any)
          .update({
            name: form.name,
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
            // Campos de enquete
            interaction_type: form.interaction_type,
            poll_question: form.poll_question || null,
            poll_options: form.poll_options.filter(o => o.trim()).length > 0 ? form.poll_options.filter(o => o.trim()) : null,
            poll_selectable_count: form.poll_selectable_count,
          })
          .eq('id', previewData.campaignId);
      } else {
        // Criar novo rascunho
        await supabase
          .from('whatsapp_campaigns' as any)
          .insert({
            store_id: storeId,
            name: form.name,
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
          });
      }

      toast({
        title: "Sucesso",
        description: "Rascunho salvo",
      });

      navigate('/dashboard/whatsapp/campaigns');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Salvar apenas mensagem e mídia
  const saveMessage = async () => {
    if (!form.custom_message.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem para salvar",
        variant: "destructive",
      });
      return;
    }

    setSavingMessage(true);
    try {
      if (previewData?.campaignId) {
        // Atualizar mensagem em campanha existente
        await supabase
          .from('whatsapp_campaigns' as any)
          .update({
            custom_message: form.custom_message,
            media_url: form.media_url || null,
            media_type: form.media_type || null,
          })
          .eq('id', previewData.campaignId);
      } else {
        // Criar rascunho apenas com mensagem
        const { data: campaign } = await supabase
          .from('whatsapp_campaigns' as any)
          .insert({
            store_id: storeId,
            name: form.name || 'Rascunho - ' + new Date().toLocaleDateString('pt-BR'),
            custom_message: form.custom_message,
            media_url: form.media_url || null,
            media_type: form.media_type || null,
            status: 'draft',
          })
          .select()
          .single();

        if (campaign) {
          setPreviewData((prev: any) => ({ ...prev, campaignId: (campaign as any).id }));
        }
      }

      toast({
        title: "Mensagem salva!",
        description: "Você pode continuar configurando a campanha",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar",
        variant: "destructive",
      });
    } finally {
      setSavingMessage(false);
    }
  };

  const getMediaIcon = () => {
    switch (form.media_type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      default: return <Upload className="h-4 w-4" />;
    }
  };

  return {
    startCampaign,
    saveDraft,
    saveMessage,
    getMediaIcon,
  };
}
