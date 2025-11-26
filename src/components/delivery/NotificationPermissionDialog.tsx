import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRequestPermission: () => Promise<boolean>;
}

export function NotificationPermissionDialog({ open, onOpenChange, onRequestPermission }: Props) {
  const handleAllow = async () => {
    const granted = await onRequestPermission();
    if (granted) {
      onOpenChange(false);
    }
  };

  const handleDeny = () => {
    localStorage.setItem('notification-permission-asked', 'true');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary animate-pulse" />
            Ativar Notificações de Pedidos
          </DialogTitle>
          <DialogDescription className="space-y-4 pt-4">
            <div className="bg-primary/10 p-4 rounded-lg space-y-2">
              <p className="font-semibold text-foreground">🚴 Por que ativar?</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Receba alertas instantâneos de novos pedidos</li>
                <li>Som de notificação mesmo com app minimizado</li>
                <li>Vibração para não perder nenhuma entrega</li>
                <li>Aumente seus ganhos sendo o primeiro a aceitar</li>
              </ul>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAllow} className="flex-1">
                <Bell className="h-4 w-4 mr-2" />
                Permitir Notificações
              </Button>
              <Button variant="outline" onClick={handleDeny}>
                Agora Não
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Você pode alterar isso depois nas configurações do navegador
            </p>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
