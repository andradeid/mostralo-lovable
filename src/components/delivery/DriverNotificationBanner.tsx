import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';

interface DriverNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  store_name: string | null;
  read_at: string | null;
  created_at: string;
}

export function DriverNotificationBanner() {
  const { profile } = useAuth();
  const [notification, setNotification] = useState<DriverNotification | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchUnreadNotifications();
    }
  }, [profile]);

  const fetchUnreadNotifications = async () => {
    if (!profile?.id) return;

    const { data } = await supabase
      .from('driver_notifications')
      .select('*')
      .eq('driver_id', profile.id)
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setNotification(data);
      setIsOpen(true);
    }
  };

  const markAsRead = async () => {
    if (!notification) return;

    await supabase
      .from('driver_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notification.id);

    setIsOpen(false);
    setNotification(null);
  };

  if (!notification) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg text-foreground">
            {notification.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p className="text-foreground">
              Seu vínculo com <strong className="text-foreground">{notification.store_name}</strong> foi encerrado.
            </p>
            <p className="text-muted-foreground text-sm">
              {notification.message}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={markAsRead} className="w-full">
            Entendi
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
