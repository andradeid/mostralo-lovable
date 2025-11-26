import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Edit, Plus, X } from 'lucide-react';
import { useUserManagement } from '@/hooks/useUserManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    full_name: string;
    email: string;
    user_type: string;
    roles?: any[];
  } | null;
  onSuccess: () => void;
}

interface Store {
  id: string;
  name: string;
}

export function UserEditDialog({ open, onOpenChange, user, onSuccess }: UserEditDialogProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [newRole, setNewRole] = useState('');
  const { updateUser, addRole, removeRole, loading } = useUserManagement();
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setUserType(user.user_type || '');
      loadStores();
    }
  }, [open, user]);

  const loadStores = async () => {
    const { data } = await supabase
      .from('stores')
      .select('id, name')
      .order('name');
    
    if (data) setStores(data);
  };

  const handleSubmit = async () => {
    if (!user || !fullName || !email) return;

    try {
      await updateUser(user.id, {
        full_name: fullName,
        email,
        user_type: userType,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleAddRole = async () => {
    if (!user || !newRole) return;

    const storeId = ['delivery_driver', 'customer'].includes(newRole) ? selectedStore : undefined;

    if (['delivery_driver', 'customer'].includes(newRole) && !storeId) {
      toast.error('Selecione uma loja para este tipo de role');
      return;
    }

    setLocalLoading(true);
    try {
      await addRole(user.id, newRole, storeId || undefined);
      setNewRole('');
      setSelectedStore('');
      onSuccess();
    } finally {
      setLocalLoading(false);
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!user) return;

    setLocalLoading(true);
    try {
      await removeRole(roleId, user.id);
      onSuccess();
    } finally {
      setLocalLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Usuário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="userType">Tipo de Usuário</Label>
            <Select value={userType} onValueChange={setUserType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="master_admin">Master Admin</SelectItem>
                <SelectItem value="store_admin">Dono de Loja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 border-t pt-4">
            <Label>Roles Atuais</Label>
            <div className="flex flex-wrap gap-2">
              {user.roles && user.roles.length > 0 ? (
                user.roles.map((role: any, index: number) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-2">
                    {role.role}
                    {role.store_name && <span className="text-xs">({role.store_name})</span>}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-4 w-4 p-0"
                      onClick={() => handleRemoveRole(role.id || '')}
                      disabled={localLoading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Nenhuma role adicional</span>
              )}
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <Label>Adicionar Nova Role</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delivery_driver">Entregador</SelectItem>
                  <SelectItem value="customer">Cliente</SelectItem>
                </SelectContent>
              </Select>

              {['delivery_driver', 'customer'].includes(newRole) && (
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button
                onClick={handleAddRole}
                disabled={!newRole || localLoading}
                size="sm"
              >
                {localLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !fullName || !email}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
