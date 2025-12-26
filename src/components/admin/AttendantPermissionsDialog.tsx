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
  PERMISSION_MODULE_MAP,
  type PermissionKey,
  type NotificationKey
} from '@/hooks/useAttendantPermissions';
import { useStoreModules } from '@/hooks/useStoreModules';
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

  // Buscar módulos da loja para filtrar permissões disponíveis
  const { hasModule, loading: modulesLoading } = useStoreModules(attendant.store_id);

  // Filtrar permissões para mostrar apenas as que a loja tem módulo liberado
  const availablePermissions = ATTENDANT_PERMISSIONS.filter(perm => {
    const requiredModule = PERMISSION_MODULE_MAP[perm.key];
    // Se não depende de módulo, sempre mostrar
    if (!requiredModule) return true;
    // Se depende de módulo, verificar se a loja tem acesso
    return hasModule(requiredModule);
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
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4 text-primary" />
            Configurar Atendente
          </DialogTitle>
          <DialogDescription className="text-sm truncate">
            {attendant.full_name || attendant.email}
          </DialogDescription>
        </DialogHeader>

        {(loading || modulesLoading) ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2 flex-shrink-0 h-9">
              <TabsTrigger value="permissions" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Shield className="w-3.5 h-3.5" />
                Permissões
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Bell className="w-3.5 h-3.5" />
                Notificações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="permissions" className="flex-1 overflow-y-auto mt-3 pr-1">
              <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                Defina quais áreas do sistema o atendente pode acessar.
              </p>
              
              <div className="space-y-2">
                {availablePermissions.map((perm) => {
                  const Icon = iconMap[perm.icon];
                  const isEnabled = hasPermission(perm.key);
                  
                  return (
                    <div 
                      key={perm.key}
                      className="flex items-center justify-between p-2.5 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-2"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        {Icon && <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Label className="font-medium text-sm">{perm.label}</Label>
                            {isEnabled ? (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-600 border-green-300 bg-green-50">
                                Liberado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-red-600 border-red-300 bg-red-50">
                                Bloqueado
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {perm.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handlePermissionChange(perm.key, checked)}
                        disabled={saving}
                        className="flex-shrink-0"
                      />
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="flex-1 overflow-y-auto mt-3 pr-1">
              <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                Configure quais alertas o atendente deve receber.
              </p>
              
              <div className="space-y-2">
                {ATTENDANT_NOTIFICATIONS.map((notif) => {
                  const isEnabled = hasNotification(notif.key);
                  
                  return (
                    <div 
                      key={notif.key}
                      className="flex items-center justify-between p-2.5 sm:p-3 border rounded-lg hover:bg-muted/50 transition-colors gap-2"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <Bell className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Label className="font-medium text-sm">{notif.label}</Label>
                            {isEnabled ? (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-600 border-green-300 bg-green-50">
                                Ativo
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                                Desativado
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notif.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleNotificationChange(notif.key, checked)}
                        disabled={saving}
                        className="flex-shrink-0"
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
