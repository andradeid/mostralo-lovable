// Som de novo pedido na tela de pedidos: ligar/desligar, som escolhido,
// desbloqueio do áudio do navegador e teste. Código movido da OrdersPage sem mudança.
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { playNewOrderSound, getSelectedSound, NotificationSound } from '@/utils/soundPlayer';

export function useOrderSoundAlerts() {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('orderSoundEnabled');
    return saved !== 'false'; // padrão é true
  });
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(() => {
    // Verificar se já foi desbloqueado nesta sessão
    return sessionStorage.getItem('audioUnlocked') === 'true';
  });
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [selectedSound, setSelectedSound] = useState<NotificationSound>(getSelectedSound());

  useEffect(() => {
    localStorage.setItem('orderSoundEnabled', String(soundEnabled));
  }, [soundEnabled]);

  // Listener para mudanças no som selecionado (sem setInterval — usa eventos)
  useEffect(() => {
    const handleSoundChange = () => setSelectedSound(getSelectedSound());
    window.addEventListener('storage', handleSoundChange);
    window.addEventListener('orderSoundChanged', handleSoundChange);
    return () => {
      window.removeEventListener('storage', handleSoundChange);
      window.removeEventListener('orderSoundChanged', handleSoundChange);
    };
  }, []);

  // Verificar contexto de áudio ao carregar
  useEffect(() => {
    const checkAudioContext = async () => {
      if (sessionStorage.getItem('audioUnlocked') === 'true') {
        // Tentar tocar um som silencioso para verificar
        try {
          const audio = new Audio('/sounds/bell-1.mp3');
          audio.volume = 0.01; // Volume quase inaudível
          await audio.play();
          audio.pause();
          audio.currentTime = 0;
          setAudioUnlocked(true);
          setAudioBlocked(false);
        } catch {
          // Áudio bloqueado, precisa de interação
          sessionStorage.removeItem('audioUnlocked');
          setAudioUnlocked(false);
        }
      }
    };

    checkAudioContext();
  }, []);

  // Auto-desbloquear com qualquer interação do usuário
  useEffect(() => {
    if (audioUnlocked || !soundEnabled) return;

    const handleInteraction = async () => {
      try {
        const audio = new Audio('/sounds/bell-1.mp3');
        audio.volume = 0.01;
        await audio.play();
        audio.pause();
        setAudioUnlocked(true);
        sessionStorage.setItem('audioUnlocked', 'true');
        setAudioBlocked(false);

        // Remover listeners após sucesso
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('keydown', handleInteraction);
      } catch {
        // Ignorar falhas silenciosas
      }
    };

    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [audioUnlocked, soundEnabled]);

  const handleTestSound = async () => {
    const success = await playNewOrderSound(selectedSound);
    if (success) {
      setAudioUnlocked(true);
      setAudioBlocked(false);
      toast.success('Som de notificação tocado! 🔊');
    } else {
      toast.error('Não foi possível tocar o som', {
        description: 'Verifique as permissões do navegador'
      });
    }
  };

  const handleToggleSound = (checked: boolean) => {
    setSoundEnabled(checked);
    if (checked) {
      toast.success('Som de notificação ativado! 🔊', {
        description: 'Você receberá alertas sonoros de novos pedidos'
      });
    } else {
      toast.info('Som de notificação desativado', {
        description: 'Você não receberá alertas sonoros de novos pedidos'
      });
    }
  };

  const unlockAudio = async () => {
    const success = await playNewOrderSound(selectedSound);
    if (success) {
      setAudioUnlocked(true);
      sessionStorage.setItem('audioUnlocked', 'true'); // Persistir estado
      setAudioBlocked(false);
      toast.success('Som desbloqueado! 🔊', {
        description: 'Agora você receberá alertas sonoros'
      });

    }
  };

  return {
    soundEnabled,
    audioUnlocked,
    audioBlocked,
    setAudioBlocked,
    selectedSound,
    handleTestSound,
    handleToggleSound,
    unlockAudio,
  };
}
