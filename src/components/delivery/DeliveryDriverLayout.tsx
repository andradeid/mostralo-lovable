import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useDriverInvitations } from '@/hooks/useDriverInvitations';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { InvitationsDialog } from '@/components/delivery/InvitationsDialog';
import { DeliveryDriverSidebar } from '@/components/delivery/DeliveryDriverSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

interface DeliveryDriverLayoutProps {
  children: ReactNode;
  onOnlineStatusChange?: (isOnline: boolean) => void;
}

export function DeliveryDriverLayout({ children, onOnlineStatusChange }: DeliveryDriverLayoutProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { pendingCount } = useDriverInvitations();
  const isMobile = useIsMobile();
  const [showInvitationsDialog, setShowInvitationsDialog] = useState(false);
  const [isOnline, setIsOnline] = useState(() => {
    const saved = localStorage.getItem('delivery_driver_online');
    return saved === null ? true : saved === 'true';
  });

  // Salvar estado online/offline no localStorage
  useEffect(() => {
    console.log('📱 DeliveryDriverLayout: isOnline changed', isOnline);
    localStorage.setItem('delivery_driver_online', String(isOnline));
    onOnlineStatusChange?.(isOnline);
  }, [isOnline, onOnlineStatusChange]);

  // Gerenciar presença no Supabase Realtime
  useEffect(() => {
    if (!profile?.id || !isOnline) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupPresence = async () => {
      // Buscar store_id do entregador
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('store_id')
        .eq('user_id', profile.id)
        .eq('role', 'delivery_driver')
        .single();

      if (userRole?.store_id) {
        // Criar canal de presença
        channel = supabase.channel('delivery-presence', {
          config: {
            presence: {
              key: profile.id,
            },
          },
        });

        channel
          .on('presence', { event: 'sync' }, () => {
            console.log('Presença do entregador sincronizada');
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await channel?.track({
                user_id: profile.id,
                store_id: userRole.store_id,
                online: true,
                online_at: new Date().toISOString(),
                status: 'available',
              });
            }
          });
      }
    };

    setupPresence();

    return () => {
      if (channel) {
        channel.untrack();
        supabase.removeChannel(channel);
      }
    };
  }, [profile, isOnline]);

  // Escutar evento global de mudança de status
  useEffect(() => {
    const handleOnlineStatusChange = (event: CustomEvent<{ isOnline: boolean }>) => {
      console.log('📱 DeliveryDriverLayout: received global online status change', event.detail);
      setIsOnline(event.detail.isOnline);
    };

    window.addEventListener('onlineStatusChange', handleOnlineStatusChange as EventListener);

    return () => {
      window.removeEventListener('onlineStatusChange', handleOnlineStatusChange as EventListener);
    };
  }, []);

  // Escutar evento global de mudança de status
  useEffect(() => {
    const handleOnlineStatusChange = (event: CustomEvent<{ isOnline: boolean }>) => {
      console.log('📱 DeliveryDriverLayout: received global online status change', event.detail);
      setIsOnline(event.detail.isOnline);
    };

    window.addEventListener('onlineStatusChange', handleOnlineStatusChange as EventListener);

    return () => {
      window.removeEventListener('onlineStatusChange', handleOnlineStatusChange as EventListener);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleOnlineToggle = (checked: boolean) => {
    setIsOnline(checked);
    
    // Disparar evento global
    const event = new CustomEvent('onlineStatusChange', {
      detail: { isOnline: checked }
    });
    window.dispatchEvent(event);
    
    toast.success(
      checked ? 'Você está online' : 'Você está offline',
      {
        description: checked 
          ? 'Você começará a receber pedidos'
          : 'Você não receberá novos pedidos'
      }
    );
  };

  return (
    <SidebarProvider 
      defaultOpen={!isMobile}
    >
      <div className="min-h-screen flex w-full bg-background">
        <DeliveryDriverSidebar 
          onSignOut={handleSignOut}
          pendingInvitations={pendingCount}
        />

        <div className="flex-1 flex flex-col">
          {/* Header com menu hamburguer e notificações */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-4 gap-2">
              {/* Trigger sempre visível */}
              <SidebarTrigger />
              
              {/* Espaço flexível no centro */}
              <div className="flex-1" />

              {/* Botão de convites */}
              {pendingCount > 0 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowInvitationsDialog(true)}
                  className="relative flex-shrink-0"
                >
                  <Bell className="h-5 w-5" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {pendingCount}
                  </Badge>
                </Button>
              )}
            </div>
          </header>

          {/* Alertas */}
          {!isOnline && (
            <Alert variant="destructive" className="mx-2 sm:mx-4 mb-0 mt-4">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <AlertDescription className="text-sm">
                Você está offline. Ative o status online nas configurações para receber pedidos.
              </AlertDescription>
            </Alert>
          )}

          {pendingCount > 0 && (
            <Alert className="mx-2 sm:mx-4 mb-0 mt-4 border-orange-500 bg-orange-50 dark:bg-orange-950">
              <Bell className="h-4 w-4 text-orange-600 flex-shrink-0" />
              <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
                <span className="text-sm">Você tem {pendingCount} convite(s) pendente(s)</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInvitationsDialog(true)}
                  className="w-full sm:w-auto whitespace-nowrap"
                >
                  Ver Convites
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Conteúdo principal */}
          <main className="flex-1 overflow-y-auto pt-20">
            {children}
          </main>
        </div>

        {/* Dialog de convites */}
        <InvitationsDialog
          open={showInvitationsDialog}
          onOpenChange={setShowInvitationsDialog}
        />
      </div>
    </SidebarProvider>
  );
}
