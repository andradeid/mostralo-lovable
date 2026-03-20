import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useModuleEnabled } from '@/hooks/useModuleEnabled';

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

/**
 * Hook para monitorar conversas que precisam de atendente humano.
 * Toca som em loop até o atendente abrir a conversa.
 */
export function useNeedsHumanAlert(storeId: string | null) {
  const whatsappChatEnabled = useModuleEnabled('whatsapp_chat');
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

  const toggleSound = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled);
    try {
      localStorage.setItem(SOUND_KEY, String(enabled));
    } catch {}
  }, []);

  // Loop de som: toca enquanto houver conversas pendentes
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

  // Carregar conversas pendentes ao montar (para retomar após navegação)
  // Carregar conversas pendentes ao montar (guard por módulo)
  useEffect(() => {
    if (!storeId || !whatsappChatEnabled) return;

    supabase
      .from('whatsapp_conversations')
      .select('id, contact_name, phone_number, needs_human_reason')
      .eq('store_id', storeId)
      .eq('needs_human', true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const ids = new Set<string>();
          data.forEach((conv: any) => {
            ids.add(conv.id);
            pendingDataRef.current.set(conv.id, {
              contactName: conv.contact_name || conv.phone_number,
              reason: conv.needs_human_reason || 'Precisa de atendimento',
            });
          });
          setPendingConvIds(ids);
        }
      });
  }, [storeId]);

  // Escutar mudanças via Realtime
  useEffect(() => {
    if (!storeId) return;

    const channel = supabase
      .channel(`needs-human-alert:${storeId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_conversations',
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          const newRow = payload.new as any;
          const oldRow = payload.old as any;

          // Detectar mudança de needs_human para true
          if (newRow.needs_human === true && oldRow.needs_human !== true) {
            const convId = newRow.id;
            const contactName = newRow.contact_name || newRow.phone_number;
            const reason = newRow.needs_human_reason || 'Precisa de atendimento';

            // Adicionar aos pendentes
            setPendingConvIds(prev => new Set(prev).add(convId));
            pendingDataRef.current.set(convId, { contactName, reason });

            // Tocar som imediatamente (usar ref)
            if (soundEnabledRef.current) {
              playAlertSound();
            }

            // Mostrar toast (apenas uma vez por conversa)
            if (!toastedIds.current.has(convId)) {
              toastedIds.current.add(convId);
              toast.info(`🔔 ${contactName}`, {
                description: reason,
                duration: 10000,
              });
              setTimeout(() => toastedIds.current.delete(convId), 60000);
            }

            console.log(`[NeedsHumanAlert] 🔔 Alerta: ${contactName} - ${reason}`);
          }

          // Detectar mudança de needs_human para false (atendente abriu)
          if (newRow.needs_human === false && oldRow.needs_human === true) {
            const convId = newRow.id;
            setPendingConvIds(prev => {
              const next = new Set(prev);
              next.delete(convId);
              return next;
            });
            pendingDataRef.current.delete(convId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]); // Removido soundEnabled das deps

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
