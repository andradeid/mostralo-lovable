import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

// Estado global compartilhado
let globalChannel: RealtimeChannel | null = null;
let subscriberCount = 0;
const onlineDrivers = new Set<string>();
const listeners = new Set<(driverId: string, isOnline: boolean) => void>();

const initGlobalChannel = () => {
  if (globalChannel) return globalChannel;

  globalChannel = supabase.channel('delivery-presence', {
    config: {
      presence: {
        key: 'shared',
      },
    },
  });

  globalChannel
    .on('presence', { event: 'sync' }, () => {
      const state = globalChannel!.presenceState();
      console.log('🔄 Presence Sync:', state);
      onlineDrivers.clear();
      
      Object.values(state).forEach((presences: any) => {
        presences.forEach((p: any) => {
          console.log('👤 Driver presence:', p);
          if (p.user_id) {
            onlineDrivers.add(p.user_id);
            listeners.forEach(cb => cb(p.user_id, true));
          }
        });
      });
    })
    .on('presence', { event: 'join' }, ({ newPresences }) => {
      newPresences.forEach((p: any) => {
        if (p.user_id) {
          onlineDrivers.add(p.user_id);
          listeners.forEach(cb => cb(p.user_id, true));
        }
      });
    })
    .on('presence', { event: 'leave' }, ({ leftPresences }) => {
      leftPresences.forEach((p: any) => {
        if (p.user_id) {
          onlineDrivers.delete(p.user_id);
          listeners.forEach(cb => cb(p.user_id, false));
        }
      });
    })
    .subscribe();

  return globalChannel;
};

export const useDriverPresence = (driverId: string | null) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!driverId) {
      setIsOnline(false);
      return;
    }

    // Inicializar canal global
    subscriberCount++;
    if (subscriberCount === 1) {
      const channel = initGlobalChannel();
      // Forçar sincronização inicial após 1s
      setTimeout(() => {
        const state = channel.presenceState();
        console.log('🔄 Forced sync on init:', state);
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.user_id) {
              onlineDrivers.add(p.user_id);
              listeners.forEach(cb => cb(p.user_id, true));
            }
          });
        });
      }, 1000);
    }

    // Verificar estado inicial
    setIsOnline(onlineDrivers.has(driverId));

    // Registrar listener
    const listener = (id: string, online: boolean) => {
      if (id === driverId) {
        setIsOnline(online);
      }
    };
    listeners.add(listener);

    // Polling periódico a cada 30s para garantir sincronização
    const syncInterval = setInterval(() => {
      if (globalChannel) {
        const state = globalChannel.presenceState();
        console.log('🔄 Periodic sync check:', state);
        
        // Atualizar set de drivers online
        const currentOnlineDrivers = new Set<string>();
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.user_id) {
              currentOnlineDrivers.add(p.user_id);
            }
          });
        });
        
        // Notificar mudanças
        currentOnlineDrivers.forEach(id => {
          if (!onlineDrivers.has(id)) {
            onlineDrivers.add(id);
            listeners.forEach(cb => cb(id, true));
          }
        });
        
        onlineDrivers.forEach(id => {
          if (!currentOnlineDrivers.has(id)) {
            onlineDrivers.delete(id);
            listeners.forEach(cb => cb(id, false));
          }
        });
      }
    }, 30000);

    return () => {
      // Limpar intervalo
      clearInterval(syncInterval);
      
      // Remover listener
      listeners.delete(listener);
      
      // Cleanup do canal se for o último subscriber
      subscriberCount--;
      if (subscriberCount === 0 && globalChannel) {
        supabase.removeChannel(globalChannel);
        globalChannel = null;
        onlineDrivers.clear();
      }
    };
  }, [driverId]);

  return isOnline;
};
