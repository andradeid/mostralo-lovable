import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ConversationalSettings {
  id?: string;
  store_id: string;
  recommend_generics: boolean;
  never_send_links: boolean;
  send_product_photos: boolean;
  informal_tone: boolean;
  closing_message: string;
  generic_phrases: string[];
}

const DEFAULT_SETTINGS: Omit<ConversationalSettings, 'store_id'> = {
  recommend_generics: true,
  never_send_links: true,
  send_product_photos: true,
  informal_tone: true,
  closing_message: 'Obrigada! Seu pedido será preparado 🙏',
  generic_phrases: [
    'Temos a versão genérica com o mesmo princípio ativo por um preço menor, deseja?',
    'Posso sugerir o genérico equivalente? O preço é bem mais acessível!',
    'Esse medicamento tem versão genérica disponível, quer que eu verifique?',
  ],
};

export function useBotConversationalSettings(storeId: string) {
  const [settings, setSettings] = useState<ConversationalSettings>({ ...DEFAULT_SETTINGS, store_id: storeId });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchSettings = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_bot_conversational_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings({
          id: data.id,
          store_id: data.store_id,
          recommend_generics: data.recommend_generics,
          never_send_links: data.never_send_links,
          send_product_photos: data.send_product_photos,
          informal_tone: data.informal_tone,
          closing_message: data.closing_message || DEFAULT_SETTINGS.closing_message,
          generic_phrases: Array.isArray(data.generic_phrases) ? data.generic_phrases as string[] : DEFAULT_SETTINGS.generic_phrases,
        });
      }
    } catch (err) {
      console.error('Erro ao carregar configurações conversacionais:', err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveSettings = useCallback(async (updates: Partial<ConversationalSettings>) => {
    if (!storeId) return;
    setSaving(true);
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);

    try {
      const payload = {
        store_id: storeId,
        recommend_generics: newSettings.recommend_generics,
        never_send_links: newSettings.never_send_links,
        send_product_photos: newSettings.send_product_photos,
        informal_tone: newSettings.informal_tone,
        closing_message: newSettings.closing_message,
        generic_phrases: newSettings.generic_phrases,
      };

      if (newSettings.id) {
        const { error } = await supabase
          .from('store_bot_conversational_settings')
          .update(payload)
          .eq('id', newSettings.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('store_bot_conversational_settings')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setSettings(prev => ({ ...prev, id: data.id }));
      }
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      toast({ title: 'Erro ao salvar configurações', variant: 'destructive' });
      await fetchSettings(); // Reverte
    } finally {
      setSaving(false);
    }
  }, [storeId, settings, fetchSettings, toast]);

  return { settings, loading, saving, saveSettings };
}
