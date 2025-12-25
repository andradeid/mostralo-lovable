import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, Bell, ClipboardList, UtensilsCrossed, Truck, ShoppingCart, Package, Users, BarChart3 } from 'lucide-react';
import { 
  useAttendantPermissions, 
  ATTENDANT_PERMISSIONS, 
  ATTENDANT_NOTIFICATIONS,
  type PermissionKey,
  type NotificationKey
} from '@/hooks/useAttendantPermissions';
import { toast } from 'sonner';

interface AttendantPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendant: {
    id: string;
    full_name: string | null;
    email: string;
    store_id: string;
  };
}

// Mapeamento de ícones
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ClipboardList,
  UtensilsCrossed,
  Truck,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
};

export function AttendantPermissionsDialog({ 
  open, 
  onOpenChange, 
  attendant 
}: AttendantPermissionsDialogProps) {
  const [activeTab, setActiveTab] = useState('permissions');
  
  const {
    loading,
    saving,
    hasPermission,
    hasNotification,
    updatePermission,
    updateNotification,
  } = useAttendantPermissions({
    userId: attendant.id,
    storeId: attendant.store_id,
  });

  const handlePermissionChange = async (key: PermissionKey, enabled: boolean) => {
    const success = await updatePermission(key, enabled);
    if (success) {
      toast.success(enabled ? 'Permissão liberada' : 'Permissão bloqueada');
    } else {
      toast.error('Erro ao atualizar permissão');
    }
  };

  const handleNotificationChange = async (key: NotificationKey, enabled: boolean) => {
    const success = await updateNotification(key, enabled);
    if (success) {
      toast.success(enabled ? 'Notificação ativada' : 'Notificação desativada');
    } else {
      toast.error('Erro ao atualizar notificação');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Configurar Atendente
          </DialogTitle>
          <DialogDescription>
            {attendant.full_name || attendant.email}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="permissions" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Permissões
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notificações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="permissions" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Defina quais áreas do sistema o atendente pode acessar.
              </p>
              
              <div className="space-y-3">
                {ATTENDANT_PERMISSIONS.map((perm) => {
                  const Icon = iconMap[perm.icon];
                  const isEnabled = hasPermission(perm.key);
                  
                  return (
                    <div 
                      key={perm.key}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
                        <div>
                          <div className="flex items-center gap-2">
                            <Label className="font-medium">{perm.label}</Label>
                            {isEnabled ? (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50">
                                Liberado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-red-600 border-red-300 bg-red-50">
                                Bloqueado
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {perm.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handlePermissionChange(perm.key, checked)}
                        disabled={saving}
                      />
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Configure quais alertas o atendente deve receber.
              </p>
              
              <div className="space-y-3">
                {ATTENDANT_NOTIFICATIONS.map((notif) => {
                  const isEnabled = hasNotification(notif.key);
                  
                  return (
                    <div 
                      key={notif.key}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Bell className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <Label className="font-medium">{notif.label}</Label>
                            {isEnabled ? (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-300 bg-green-50">
                                Ativo
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                Desativado
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {notif.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleNotificationChange(notif.key, checked)}
                        disabled={saving}
                      />
                    </div>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
