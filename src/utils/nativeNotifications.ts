// Utilitário para notificações nativas em todas as plataformas

interface NotificationOptions {
  title: string;
  body: string;
  sound?: boolean;
}

// Detectar plataforma
export const isElectron = () => {
  return typeof window !== 'undefined' && (window as any).electron?.isElectron === true;
};

export const isCapacitor = () => {
  return typeof window !== 'undefined' && (window as any).Capacitor !== undefined;
};

// Enviar notificação nativa
export const sendNativeNotification = async (options: NotificationOptions): Promise<void> => {
  try {
    // ELECTRON: Usar API nativa sem bloqueio de autoplay
    if (isElectron()) {
      const electron = (window as any).electron;
      electron.showNotification(options.title, options.body, options.sound);
      return;
    }

    // CAPACITOR (Android/iOS): Usar plugin de notificações locais
    if (isCapacitor()) {
      // @ts-ignore - Capacitor será instalado quando usuário compilar
      const { LocalNotifications } = window.Capacitor?.Plugins || {};
      
      if (LocalNotifications) {
        try {
          // Solicitar permissão
          const permission = await LocalNotifications.requestPermissions();
          
          if (permission.display === 'granted') {
            await LocalNotifications.schedule({
              notifications: [{
                title: options.title,
                body: options.body,
                id: Date.now(),
                schedule: { at: new Date(Date.now() + 100) }, // Imediato
                sound: options.sound ? 'beep.wav' : undefined,
                smallIcon: 'ic_stat_icon_config_sample',
                iconColor: '#FF6D00',
              }]
            });
          }
        } catch (e) {
          console.warn('Erro ao enviar notificação Capacitor:', e);
        }
      }
      return;
    }

    // WEB: Usar Notification API padrão
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(options.title, {
        body: options.body,
        icon: '/favicon.png',
        badge: '/favicon.png',
      });
    }
  } catch (error) {
    console.warn('Erro ao enviar notificação nativa:', error);
  }
};

// Tocar som sem bloqueio de autoplay (apenas Electron)
export const playNativeSound = (soundPath: string): void => {
  if (isElectron()) {
    const electron = (window as any).electron;
    electron.playSound(soundPath);
  }
};

// Vibrar dispositivo (apenas mobile)
export const vibrateDevice = async (pattern: number[]): Promise<void> => {
  if (isCapacitor()) {
    // @ts-ignore - Capacitor será instalado quando usuário compilar
    const { Haptics } = window.Capacitor?.Plugins || {};
    
    if (Haptics) {
      try {
        await Haptics.impact({ style: 'Heavy' });
      } catch (error) {
        console.warn('Erro ao vibrar dispositivo:', error);
      }
    }
  } else if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Erro ao vibrar:', error);
    }
  }
};
