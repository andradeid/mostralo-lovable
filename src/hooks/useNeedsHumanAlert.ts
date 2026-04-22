import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useModuleEnabled } from '@/hooks/useModuleEnabled';
import { usePageVisibility } from '@/hooks/usePageVisibility';

interface NeedsHumanAlert {
  conversationId: string;
  contactName: string | null;
  phoneNumber: string;
  reason: string | null;
}

// Som de notificação usando Web Audio API
function playAlertSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.frequency.value = 587;
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.3);

    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.frequency.value = 784;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.3, audioCtx.currentTime + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc2.start(audioCtx.currentTime + 0.2);
    osc2.stop(audioCtx.currentTime + 0.5);

    const osc3 = audioCtx.createOscillator();
    const gain3 = audioCtx.createGain();
    osc3.connect(gain3);
    gain3.connect(audioCtx.destination);
    osc3.frequency.value = 988;
    osc3.type = 'sine';
    gain3.gain.setValueAtTime(0.3, audioCtx.currentTime + 0.4);
    gain3.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
    osc3.start(audioCtx.currentTime + 0.4);
    osc3.stop(audioCtx.currentTime + 0.8);

    setTimeout(() => audioCtx.close(), 1000);
  } catch (err) {
    console.warn('[NeedsHumanAlert] Erro ao tocar som:', err);
  }
}

const SOUND_KEY = 'whatsapp_alert_sound_enabled';
const LOOP_INTERVAL_MS = 5000; // Tocar a cada 5 segundos
const POLLING_VISIBLE_MS = 5000;
const POLLING_HIDDEN_MS = 20000;

/**
 * Hook para monitorar conversas que precisam de atendente humano.
 * Toca som em loop até o atendente abrir a conversa.
 */
export function useNeedsHumanAlert(storeId: string | null) {
  const whatsappChatEnabled = useModuleEnabled('whatsapp_chat');
  const isPageVisible = usePageVisibility();
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(SOUND_KEY);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  // Ref para soundEnabled — usado dentro do callback Realtime (evita recriar channel)
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  // IDs de conversas pendentes que ainda não foram abertas pelo atendente
  const [pendingConvIds, setPendingConvIds] = useState<Set<string>>(new Set());
  // Dados das conversas pendentes para uso externo (prefill)
  const pendingDataRef = useRef<Map<string, { contactName: string; reason: string }>>(new Map());
  // IDs que já mostraram toast (evitar spam)
  const toastedIds = useRef<Set<string>>(new Set());

  const applyPendingConversations = useCallback((conversations: NeedsHumanAlert[]) => {
    const nextIds = new Set<string>();
    const nextPendingMap = new Map<string, { contactName: string; reason: string }>();

    conversations.forEach((conv) => {
      const contactName = conv.contactName || conv.phoneNumber;
      const reason = conv.reason || 'Precisa de atendimento';

      nextIds.add(conv.conversationId);
      nextPendingMap.set(conv.conversationId, { contactName, reason });

      if (!pendingDataRef.current.has(conv.conversationId)) {
        if (soundEnabledRef.current) {
          playAlertSound();
        }

        if (!toastedIds.current.has(conv.conversationId)) {
          toastedIds.current.add(conv.conversationId);
          toast.info(`🔔 ${contactName}`, {
            description: reason,
            duration: 10000,
          });
          setTimeout(() => toastedIds.current.delete(conv.conversationId), 60000);
        }

        console.log(`[NeedsHumanAlert] 🔔 Alerta detectado via polling: ${contactName} - ${reason}`);
      }
    });

    pendingDataRef.current = nextPendingMap;
    setPendingConvIds(nextIds);
  }, []);

  const fetchPendingConversations = useCallback(async () => {
    if (!storeId || !whatsappChatEnabled) return;

    const { data, error } = await supabase
      .from('whatsapp_conversations')
      .select('id, contact_name, phone_number, needs_human_reason')
      .eq('store_id', storeId)
      .eq('needs_human', true);

    if (error) {
      console.error('[NeedsHumanAlert] Erro ao buscar conversas pendentes:', error);
      return;
    }

    const normalized = (data || []).map((conv) => ({
      conversationId: conv.id,
      contactName: conv.contact_name,
      phoneNumber: conv.phone_number,
      reason: conv.needs_human_reason,
    })) satisfies NeedsHumanAlert[];

    applyPendingConversations(normalized);
  }, [applyPendingConversations, storeId, whatsappChatEnabled]);

  const toggleSound = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled);
    try {
      localStorage.setItem(SOUND_KEY, String(enabled));
    } catch {}
  }, []);

  // Loop de som: toca enquanto houver conversas pendentes E módulo ativo
  useEffect(() => {
    if (!whatsappChatEnabled || !soundEnabled || pendingConvIds.size === 0) return;

    const interval = setInterval(() => {
      if (pendingConvIds.size > 0) {
        playAlertSound();
      }
    }, LOOP_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [whatsappChatEnabled, soundEnabled, pendingConvIds.size]);

  useEffect(() => {
    if (!storeId || !whatsappChatEnabled) return;

    fetchPendingConversations();
  }, [fetchPendingConversations, storeId, whatsappChatEnabled]);

  useEffect(() => {
    if (!storeId || !whatsappChatEnabled) return;

    const interval = window.setInterval(() => {
      fetchPendingConversations();
    }, isPageVisible ? POLLING_VISIBLE_MS : POLLING_HIDDEN_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, [fetchPendingConversations, isPageVisible, storeId, whatsappChatEnabled]);

  // Limpar needs_human quando atendente abre a conversa
  const clearNeedsHuman = useCallback(async (conversationId: string) => {
    // Remover dos pendentes localmente (para parar o som imediatamente)
    setPendingConvIds(prev => {
      const next = new Set(prev);
      next.delete(conversationId);
      return next;
    });

    // Pegar a razão antes de limpar (para prefill)
    const data = pendingDataRef.current.get(conversationId);
    pendingDataRef.current.delete(conversationId);

    // Atualizar no banco
    await supabase
      .from('whatsapp_conversations')
      .update({ needs_human: false, needs_human_reason: null } as any)
      .eq('id', conversationId);

    return data?.reason || null;
  }, []);

  return { soundEnabled, toggleSound, clearNeedsHuman, pendingConvIds };
}
