export type NotificationSound = 'bell1' | 'bell2' | 'bell4' | 'bell5' | 'siren_police';

// Sons de notificação disponíveis
const soundFiles: Record<NotificationSound, string> = {
  bell1: '/sounds/bell-1.mp3',
  bell2: '/sounds/bell-2.mp3',
  bell4: '/sounds/bell-4.mp3',
  bell5: '/sounds/bell-5.mp3',
  siren_police: '/sounds/siren-police.mp3',
};

// Nomes descritivos dos sons
export const soundNames: Record<NotificationSound, string> = {
  bell1: 'Sino Clássico',
  bell2: 'Campainha de Mesa',
  bell4: 'Ding Duplo',
  bell5: 'Sino Agudo',
  siren_police: 'Sirene da Polícia',
};

// Obter som selecionado do localStorage
export const getSelectedSound = (): NotificationSound => {
  const saved = localStorage.getItem('orderNotificationSound');
  return (saved as NotificationSound) || 'bell1';
};

// Salvar som selecionado
export const setSelectedSound = (sound: NotificationSound): void => {
  localStorage.setItem('orderNotificationSound', sound);
};

// Função para tocar o som de notificação com proteção anti-loop
let lastPlayAt = 0;
let currentAudio: HTMLAudioElement | null = null;
let loopingAudio: HTMLAudioElement | null = null;

export const playNewOrderSound = async (soundType?: NotificationSound): Promise<boolean> => {
  try {
    if (typeof Audio === 'undefined') return false;

    const now = Date.now();
    if (now - lastPlayAt < 1500) {
      // Evita tocar sons múltiplos em sequência muito rápida
      return true;
    }

    const sound = soundType || getSelectedSound();
    const soundPath = soundFiles[sound];

    // Parar áudio anterior, se houver
    if (currentAudio) {
      try { currentAudio.pause(); currentAudio.currentTime = 0; } catch {}
    }

    const audio = new Audio(soundPath);
    audio.loop = false;
    audio.volume = 0.9;
    currentAudio = audio;

    await audio.play();
    lastPlayAt = now;
    return true;
  } catch (err) {
    console.warn('Erro ao tocar som de notificação:', err);
    if ('vibrate' in navigator) {
      try { navigator.vibrate([200, 100, 200]); } catch {}
    }
    return false;
  }
};

// Função para tocar som em loop (para alertas urgentes)
export const playOrderAlertLoop = async (soundType?: NotificationSound): Promise<boolean> => {
  try {
    if (typeof Audio === 'undefined') return false;

    // Parar loop anterior se existir
    stopOrderAlertLoop();

    const sound = soundType || getSelectedSound();
    const soundPath = soundFiles[sound];

    const audio = new Audio(soundPath);
    audio.loop = true;
    audio.volume = 0.8;
    loopingAudio = audio;

    try {
      await audio.play();
      console.log('✅ Som de alerta iniciado em loop');
      return true;
    } catch (playError: any) {
      if (playError.name === 'NotAllowedError') {
        console.warn('⚠️ Autoplay bloqueado pelo navegador. Aguardando interação do usuário.');
        
        // Vibrar se possível
        if ('vibrate' in navigator) {
          try { 
            const vibratePattern = [200, 200, 200, 200, 200, 200];
            navigator.vibrate(vibratePattern);
          } catch {}
        }
        
        return false;
      }
      throw playError;
    }
  } catch (err) {
    console.warn('❌ Erro ao tocar loop de alerta:', err);
    
    // Fallback para vibração
    if ('vibrate' in navigator) {
      try { navigator.vibrate([500, 200, 500, 200, 500]); } catch {}
    }
    
    return false;
  }
};

// Função para parar o loop de som
export const stopOrderAlertLoop = (): void => {
  if (loopingAudio) {
    try {
      loopingAudio.pause();
      loopingAudio.currentTime = 0;
      loopingAudio = null;
    } catch (err) {
      console.warn('Erro ao parar loop de alerta:', err);
    }
  }
};
