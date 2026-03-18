import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NeedsHumanAlert {
  conversationId: string;
  contactName: string | null;
  phoneNumber: string;
  reason: string | null;
}

// Som de notificação simples usando Web Audio API
function playAlertSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Nota 1
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.frequency.value = 587; // D5
    osc1.type = 'sine';
    gain1.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc1.start(audioCtx.currentTime);
    osc1.stop(audioCtx.currentTime + 0.3);

    // Nota 2 (mais aguda, 200ms depois)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.frequency.value = 784; // G5
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0.3, audioCtx.currentTime + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc2.start(audioCtx.currentTime + 0.2);
    osc2.stop(audioCtx.currentTime + 0.5);

    // Nota 3 (mais aguda ainda, 400ms depois)
    const osc3 = audioCtx.createOscillator();
    const gain3 = audioCtx.createGain();
    osc3.connect(gain3);
    gain3.connect(audioCtx.destination);
    osc3.frequency.value = 988; // B5
    osc3.type = 'sine';
    gain3.gain.setValueAtTime(0.3, audioCtx.currentTime + 0.4);
    gain3.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
    osc3.start(audioCtx.currentTime + 0.4);
    osc3.stop(audioCtx.currentTime + 0.8);

    // Limpar contexto após som
    setTimeout(() => audioCtx.close(), 1000);
  } catch (err) {
    console.warn('[NeedsHumanAlert] Erro ao tocar som:', err);
  }
}

const SOUND_KEY = 'whatsapp_alert_sound_enabled';

/**
 * Hook para monitorar conversas que precisam de atendente humano.
 * Toca som e mostra toast quando needs_human muda para true.
 */
export function useNeedsHumanAlert(storeId: string | null) {
  // Carregar preferência de som do localStorage
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(SOUND_KEY);
      return saved !== null ? saved === 'true' : true; // Habilitado por padrão
    } catch {
      return true;
    }
  });

  // IDs de conversas que já alertamos (evitar duplicatas)
  const alertedIds = useRef<Set<string>>(new Set());

  // Persistir preferência
  const toggleSound = useCallback((enabled: boolean) => {
    setSoundEnabled(enabled);
    try {
      localStorage.setItem(SOUND_KEY, String(enabled));
    } catch {}
  }, []);

  // Escutar mudanças em whatsapp_conversations via Realtime
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

            // Evitar alertar duas vezes a mesma conversa
            if (alertedIds.current.has(convId)) return;
            alertedIds.current.add(convId);

            // Limpar da lista após 60s para permitir re-alertar se necessário
            setTimeout(() => alertedIds.current.delete(convId), 60000);

            const contactName = newRow.contact_name || newRow.phone_number;
            const reason = newRow.needs_human_reason || 'Precisa de atendimento';

            // Tocar som se habilitado
            if (soundEnabled) {
              playAlertSound();
            }

            // Mostrar toast
            toast.info(`🔔 ${contactName}`, {
              description: reason,
              duration: 8000,
            });

            console.log(`[NeedsHumanAlert] 🔔 Alerta: ${contactName} - ${reason}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, soundEnabled]);

  // Limpar needs_human quando atendente abre a conversa
  const clearNeedsHuman = useCallback(async (conversationId: string) => {
    await supabase
      .from('whatsapp_conversations')
      .update({ needs_human: false, needs_human_reason: null } as any)
      .eq('id', conversationId);
  }, []);

  return { soundEnabled, toggleSound, clearNeedsHuman };
}
