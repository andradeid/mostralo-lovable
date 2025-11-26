import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Save, Trash2, Lock, MapPin } from 'lucide-react';
import { CustomerLocationPicker } from '@/components/checkout/CustomerLocationPicker';
import BottomNavigation from '@/components/BottomNavigation';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export default function CustomerProfile() {
  const { storeSlug } = useParams();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [storeId, setStoreId] = useState<string>('');

  useEffect(() => {
    loadCustomerData();
  }, [user]);

  // Buscar storeId pelo slug
  useEffect(() => {
    const fetchStoreId = async () => {
      if (storeSlug) {
        const { data } = await supabase
          .from('stores')
          .select('id')
          .eq('slug', storeSlug)
          .single();
        
        if (data) {
          setStoreId(data.id);
        }
      }
    };
    fetchStoreId();
  }, [storeSlug]);

  const loadCustomerData = async () => {
    if (!user) {
      navigate(`/cliente/${storeSlug}`);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCustomer(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          address: data.address || '',
          latitude: data.latitude || undefined,
          longitude: data.longitude || undefined,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar seus dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!customer) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: formData.name,
          email: formData.email || null,
          address: formData.address || null,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
        })
        .eq('id', customer.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Seus dados foram atualizados',
      });

      await loadCustomerData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar suas alterações',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Sua senha foi alterada',
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar sua senha',
        variant: 'destructive',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!customer) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          deleted_at: new Date().toISOString(),
          name: 'Usuário Excluído',
          email: null,
          address: null,
          latitude: null,
          longitude: null,
        })
        .eq('id', customer.id);

      if (error) throw error;

      toast({
        title: 'Conta excluída',
        description: 'Sua conta foi excluída com sucesso',
      });

      await signOut(`/loja/${storeSlug}`);
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir sua conta',
        variant: 'destructive',
      });
      setDeleting(false);
    }
  };

  const handleLocationSelect = (location: { address: string; latitude: number; longitude: number }) => {
    setFormData({
      ...formData,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
    });
    setShowLocationPicker(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b">
        <div className="flex items-center gap-4 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/painel-cliente/${storeSlug}`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Meu Perfil</h1>
        </div>
      </header>

      <div className="container max-w-2xl mx-auto p-4 space-y-6">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
            <CardDescription>Atualize suas informações pessoais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={customer?.phone || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                O telefone não pode ser alterado
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
              />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço de Entrega</CardTitle>
            <CardDescription>Gerencie seu endereço padrão</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Endereço Atual</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">
                  {formData.address || 'Nenhum endereço cadastrado'}
                </p>
              </div>
            </div>

            <Button
              onClick={() => setShowLocationPicker(true)}
              variant="outline"
              className="w-full"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Alterar Endereço
            </Button>
          </CardContent>
        </Card>

        {/* Alterar Senha */}
        <Card>
          <CardHeader>
            <CardTitle>Alterar Senha</CardTitle>
            <CardDescription>Crie uma nova senha para sua conta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Digite a senha novamente"
              />
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={changingPassword || !passwordData.newPassword}
              variant="secondary"
              className="w-full"
            >
              {changingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Alterando...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Alterar Senha
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Excluir Conta */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
            <CardDescription>
              Ações irreversíveis com sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Minha Conta
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>Esta ação não pode ser desfeita. Ao excluir sua conta:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Seus dados pessoais serão removidos</li>
                      <li>Seu histórico de pedidos será mantido anonimizado</li>
                      <li>Você não poderá mais acessar esta conta</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Excluindo...
                      </>
                    ) : (
                      'Sim, excluir minha conta'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      {/* Location Picker Dialog */}
      <CustomerLocationPicker
        open={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={handleLocationSelect}
        initialCoords={
          formData.latitude && formData.longitude
            ? {
                latitude: formData.latitude,
                longitude: formData.longitude,
              }
            : undefined
        }
        storeId={storeId}
      />

      {/* Bottom Navigation */}
      <BottomNavigation 
        currentRoute="profile" 
        storeSlug={storeSlug}
      />
    </div>
  );
}
