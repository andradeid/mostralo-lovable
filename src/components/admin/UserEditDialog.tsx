import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Edit, Plus, X, Phone, MessageCircle, Check, AlertCircle } from 'lucide-react';
import { useUserManagement } from '@/hooks/useUserManagement';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { formatPhone } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { CountryCodeSelect } from '@/components/ui/country-code-select';

interface UserEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    full_name: string;
    email: string;
    user_type: string;
    phone?: string | null;
    whatsapp_valid?: boolean | null;
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
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+55');
  const [isWhatsAppValid, setIsWhatsAppValid] = useState<boolean | null>(null);
  const [validatingWhatsApp, setValidatingWhatsApp] = useState(false);
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
      setPhone(user.phone ? formatPhone(user.phone) : '');
      setIsWhatsAppValid(user.whatsapp_valid ?? null);
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

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhone(value);
    setPhone(formatted);
    // Resetar validação quando telefone muda
    if (formatted !== formatPhone(user?.phone || '')) {
      setIsWhatsAppValid(null);
    }
  };

  const validateWhatsApp = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Número de telefone inválido');
      return;
    }

    setValidatingWhatsApp(true);
    try {
      const fullPhone = countryCode.replace('+', '') + cleanPhone;
      const { data, error } = await supabase.functions.invoke('validate-whatsapp-number', {
        body: { phone: fullPhone }
      });

      if (error) throw error;

      if (data?.valid) {
        setIsWhatsAppValid(true);
        toast.success('WhatsApp válido!');
      } else {
        setIsWhatsAppValid(false);
        toast.error('Número não possui WhatsApp');
      }
    } catch (error: any) {
      console.error('Erro ao validar WhatsApp:', error);
      toast.error('Erro ao validar: ' + (error.message || 'Tente novamente'));
      setIsWhatsAppValid(false);
    } finally {
      setValidatingWhatsApp(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !fullName || !email) return;

    const cleanPhone = phone.replace(/\D/g, '');
    
    try {
      await updateUser(user.id, {
        full_name: fullName,
        email,
        user_type: userType,
        phone: cleanPhone || null,
        whatsapp_valid: isWhatsAppValid,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleAddRole = async () => {
    if (!user || !newRole) return;

    const rolesRequiringStore = ['professional', 'store_admin', 'delivery_driver', 'customer'];
    const storeId = rolesRequiringStore.includes(newRole) ? selectedStore : undefined;

    if (rolesRequiringStore.includes(newRole) && !storeId) {
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
            <Edit className="h-4 w-4 md:h-5 md:w-5" />
            Editar Usuário
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="fullName" className="text-xs md:text-sm">Nome Completo *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-9 md:h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="email" className="text-xs md:text-sm">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-9 md:h-10 text-sm"
              />
            </div>
          </div>

          {/* Campo Telefone com Validação WhatsApp */}
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="phone" className="text-xs md:text-sm flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              Telefone (WhatsApp)
            </Label>
            <div className="flex gap-2">
              <CountryCodeSelect value={countryCode} onChange={setCountryCode} />
              <div className="relative flex-1">
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className="h-9 md:h-10 text-sm pr-8"
                />
                {isWhatsAppValid !== null && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {isWhatsAppValid ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={validateWhatsApp}
                      disabled={validatingWhatsApp || phone.replace(/\D/g, '').length < 10}
                      className="h-9 md:h-10 px-3"
                    >
                      {validatingWhatsApp ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MessageCircle className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Validar WhatsApp</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {isWhatsAppValid === true && (
              <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 border-green-200">
                <Check className="h-3 w-3 mr-1" /> WhatsApp válido
              </Badge>
            )}
            {isWhatsAppValid === false && (
              <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200">
                <AlertCircle className="h-3 w-3 mr-1" /> Não possui WhatsApp
              </Badge>
            )}
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="userType" className="text-xs md:text-sm">Tipo de Usuário</Label>
            <Select value={userType} onValueChange={setUserType}>
              <SelectTrigger className="h-9 md:h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="master_admin">Master Admin</SelectItem>
                <SelectItem value="store_admin">Dono de Loja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:space-y-3 border-t pt-3 md:pt-4">
            <Label className="text-xs md:text-sm">Roles Atuais</Label>
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {user.roles && user.roles.length > 0 ? (
                user.roles.map((role: any, index: number) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1.5 text-[10px] md:text-xs py-1">
                    <span>{role.role}</span>
                    {role.store_name && <span className="text-[10px] opacity-75">({role.store_name})</span>}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 w-5 p-0 ml-0.5 hover:bg-destructive/20"
                      onClick={() => handleRemoveRole(role.id || '')}
                      disabled={localLoading}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </Badge>
                ))
              ) : (
                <span className="text-xs md:text-sm text-muted-foreground">Nenhuma role adicional</span>
              )}
            </div>
          </div>

          <div className="space-y-2 md:space-y-3 border-t pt-3 md:pt-4">
            <Label className="text-xs md:text-sm">Adicionar Nova Role</Label>
            <div className="grid gap-2 md:gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Selecione a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Profissional</SelectItem>
                    <SelectItem value="store_admin">Admin da Loja</SelectItem>
                    <SelectItem value="delivery_driver">Entregador</SelectItem>
                    <SelectItem value="customer">Cliente</SelectItem>
                  </SelectContent>
                </Select>

                {['professional', 'store_admin', 'delivery_driver', 'customer'].includes(newRole) && (
                  <Select value={selectedStore} onValueChange={setSelectedStore}>
                    <SelectTrigger className="h-9 text-sm">
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
              </div>
              
              <Button
                onClick={handleAddRole}
                disabled={!newRole || localLoading}
                size="sm"
                className="w-full sm:w-auto h-9"
              >
                {localLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Adicionar Role
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            size="sm"
            className="h-9"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !fullName || !email}
            size="sm"
            className="h-9"
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
