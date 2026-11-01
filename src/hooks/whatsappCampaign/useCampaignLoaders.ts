// Carrega templates, loja e etiquetas; aplica o template escolhido.
// Código movido da WhatsAppCampaignNewPage sem mudança de comportamento.
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UseCampaignLoadersDeps = { [K in 'storeId' | 'templates' | 'setTemplates' | 'setLabels' | 'setSelectedTemplate' | 'setStoreName' | 'setStoreSlug' | 'form' | 'setForm']: any };

export function useCampaignLoaders(deps: UseCampaignLoadersDeps) {
  const { storeId, templates, setTemplates, setLabels, setSelectedTemplate, setStoreName, setStoreSlug, form, setForm } = deps;
  useEffect(() => {
    if (storeId) {
      fetchTemplates();
      fetchStoreInfo();
      fetchLabels();
    }
  }, [storeId]);

  const fetchLabels = async () => {
    const { data } = await supabase
      .from('whatsapp_contact_labels' as any)
      .select('*')
      .eq('store_id', storeId)
      .order('name');
    setLabels(data || []);
  };

  // Buscar template quando o ID mudar
  useEffect(() => {
    if (form.template_id) {
      const template = templates.find(t => t.id === form.template_id);
      if (template) {
        setSelectedTemplate({
          id: template.id,
          name: template.name,
          content: template.content,
          category: template.category,
        });
        // Preencher mensagem customizada com conteúdo do template se estiver vazia
        if (!form.custom_message) {
          setForm(prev => ({ ...prev, custom_message: template.content }));
        }
      }
    } else {
      setSelectedTemplate(null);
    }
  }, [form.template_id, templates]);

  const fetchStoreInfo = async () => {
    const { data } = await supabase
      .from('stores')
      .select('name, slug')
      .eq('id', storeId)
      .single();
    
    if (data) {
      setStoreName(data.name);
      setStoreSlug(data.slug);
    }
  };

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from('whatsapp_templates' as any)
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('name');

    setTemplates(data || []);
  };

  return {
    fetchLabels,
    fetchStoreInfo,
    fetchTemplates,
  };
}
