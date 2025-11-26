import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      const askedBefore = localStorage.getItem('notification-permission-asked');
      if (Notification.permission === 'default' && !askedBefore) {
        setTimeout(() => {
          setShowPermissionDialog(true);
        }, 5000);
      }
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notificações não suportadas neste navegador');
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      localStorage.setItem('notification-permission-asked', 'true');
      
      if (result === 'granted') {
        toast.success('✅ Notificações ativadas!', {
          description: 'Você receberá alertas de novos pedidos'
        });
        
        new Notification('🔔 Notificações Ativadas', {
          body: 'Você receberá alertas quando novos pedidos chegarem!',
          icon: '/favicon.png',
          badge: '/favicon.png'
        });
        
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
        
        return true;
      } else {
        toast.error('Permissão negada', {
          description: 'Você não receberá notificações de pedidos'
        });
        return false;
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      new Notification(title, {
        ...options,
        icon: options?.icon || '/favicon.png',
        badge: '/favicon.png'
      });
    }
  };

  return {
    permission,
    showPermissionDialog,
    setShowPermissionDialog,
    requestPermission,
    sendNotification
  };
}
