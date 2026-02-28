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
  never_say_unavailable: boolean;
  unavailable_phrases: string[];
  upsell_enabled: boolean;
  upsell_product_id: string | null;
  upsell_custom_price: number | null;
  upsell_message: string;
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
  never_say_unavailable: true,
  unavailable_phrases: [
    'Vou verificar no nosso estoque, um momento por favor! 🔍',
    'No momento não localizei, mas posso encomendar pra você! Deseja?',
    'Deixa eu confirmar com nosso estoque. Pode aguardar um instante? 😊',
  ],
  upsell_enabled: false,
  upsell_product_id: null,
  upsell_custom_price: null,
  upsell_message: 'Estamos com uma promoção especial! Quer aproveitar e levar também?',
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
          never_say_unavailable: data.never_say_unavailable ?? DEFAULT_SETTINGS.never_say_unavailable,
          unavailable_phrases: Array.isArray(data.unavailable_phrases) ? data.unavailable_phrases as string[] : DEFAULT_SETTINGS.unavailable_phrases,
          upsell_enabled: data.upsell_enabled ?? DEFAULT_SETTINGS.upsell_enabled,
          upsell_product_id: (data as any).upsell_product_id ?? DEFAULT_SETTINGS.upsell_product_id,
          upsell_custom_price: (data as any).upsell_custom_price ?? DEFAULT_SETTINGS.upsell_custom_price,
          upsell_message: (data as any).upsell_message ?? DEFAULT_SETTINGS.upsell_message,
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
      const payload: Record<string, any> = {
        store_id: storeId,
        recommend_generics: newSettings.recommend_generics,
        never_send_links: newSettings.never_send_links,
        send_product_photos: newSettings.send_product_photos,
        informal_tone: newSettings.informal_tone,
        closing_message: newSettings.closing_message,
        generic_phrases: newSettings.generic_phrases,
        never_say_unavailable: newSettings.never_say_unavailable,
        unavailable_phrases: newSettings.unavailable_phrases,
        upsell_enabled: newSettings.upsell_enabled,
        upsell_product_id: newSettings.upsell_product_id,
        upsell_custom_price: newSettings.upsell_custom_price,
        upsell_message: newSettings.upsell_message,
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
