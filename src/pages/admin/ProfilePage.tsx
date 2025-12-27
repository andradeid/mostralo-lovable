import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { usePageSEO } from '@/hooks/useSEO';
import { 
  User, 
  Mail, 
  Calendar,
  Shield,
  Edit,
  Save,
  X,
  Loader2,
  Phone,
  MessageCircle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  whatsapp_valid: boolean | null;
  user_type: 'master_admin' | 'store_admin';
  created_at: string;
  updated_at: string;
}

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
};

const ProfilePage = () => {
  usePageSEO({
    title: 'Perfil - Mostralo | Configurações da Conta',
    description: 'Gerencie as informações do seu perfil pessoal na plataforma Mostralo. Atualize dados pessoais e configurações da conta.',
    keywords: 'perfil usuário, configurações conta, dados pessoais, atualizar perfil'
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validatingWhatsApp, setValidatingWhatsApp] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    whatsapp_valid: false
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      setProfile(data as Profile);
      setFormData({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone ? formatPhone(data.phone) : '',
        whatsapp_valid: (data as any).whatsapp_valid || false
      });
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o perfil.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleValidateWhatsApp = async () => {
    const phoneNumbers = formData.phone.replace(/\D/g, '');
    if (phoneNumbers.length < 10) {
      toast({ title: "Erro", description: "Telefone inválido", variant: "destructive" });
      return;
    }

    setValidatingWhatsApp(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-whatsapp-number', {
        body: { phone: phoneNumbers }
      });

      if (error) throw error;

      if (data.exists) {
        setFormData(prev => ({ ...prev, whatsapp_valid: true }));
        toast({ title: "Sucesso", description: "Número de WhatsApp válido!" });
      } else {
        setFormData(prev => ({ ...prev, whatsapp_valid: false }));
        toast({ title: "Aviso", description: "Este número não possui WhatsApp", variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Erro", description: "Erro ao validar WhatsApp", variant: "destructive" });
    } finally {
      setValidatingWhatsApp(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const phoneNumbers = formData.phone.replace(/\D/g, '');
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: phoneNumbers || null,
          whatsapp_valid: formData.whatsapp_valid,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      await fetchProfile();
      setEditing(false);
      
      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso.'
      });
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o perfil.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || '',
      email: profile?.email || '',
      phone: profile?.phone ? formatPhone(profile.phone) : '',
      whatsapp_valid: profile?.whatsapp_valid || false
    });
    setEditing(false);
  };

  const getUserTypeInfo = (userType: string) => {
    switch (userType) {
      case 'master_admin':
        return {
          label: 'Super Administrador',
          description: 'Acesso total ao sistema',
          variant: 'destructive' as const,
          icon: Shield
        };
      case 'store_admin':
        return {
          label: 'Administrador da Loja',
          description: 'Gerencia lojas e produtos',
          variant: 'default' as const,
          icon: User
        };
      default:
        return {
          label: 'Usuário',
          description: 'Acesso básico',
          variant: 'secondary' as const,
          icon: User
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Perfil não encontrado</h3>
        <p className="text-muted-foreground">Não foi possível carregar as informações do perfil.</p>
      </div>
    );
  }

  const userTypeInfo = getUserTypeInfo(profile.user_type);
  const TypeIcon = userTypeInfo.icon;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e configurações da conta
          </p>
        </div>
        <div className="flex space-x-2">
          {editing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Salvar
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Editar Perfil
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Informações Pessoais</span>
            </CardTitle>
            <CardDescription>
              Suas informações básicas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                {editing ? (
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Digite seu nome completo"
                  />
                ) : (
                  <p className="text-sm py-2 px-3 bg-muted rounded-md">
                    {profile.full_name || 'Não informado'}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm py-2 px-3 bg-muted rounded-md flex-1">
                    {profile.email}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  O email não pode ser alterado
                </p>
              </div>
            </div>
            
            {/* Telefone/WhatsApp */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (WhatsApp)</Label>
              {editing ? (
                <div className="flex gap-2">
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      phone: formatPhone(e.target.value),
                      whatsapp_valid: false 
                    })}
                    placeholder="(00) 00000-0000"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={handleValidateWhatsApp}
                    disabled={validatingWhatsApp || formData.phone.replace(/\D/g, '').length < 10}
                    title="Validar WhatsApp"
                  >
                    {validatingWhatsApp ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MessageCircle className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm py-2 px-3 bg-muted rounded-md flex-1">
                    {profile.phone ? formatPhone(profile.phone) : 'Não informado'}
                  </p>
                  {profile.whatsapp_valid && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
              )}
              {editing && formData.whatsapp_valid && (
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  WhatsApp válido
                </Badge>
              )}
            </div>
            
            <Separator />
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de Usuário</Label>
                <div className="flex items-center space-x-2">
                  <TypeIcon className="w-4 h-4" />
                  <Badge variant={userTypeInfo.variant}>
                    {userTypeInfo.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {userTypeInfo.description}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>ID do Usuário</Label>
                <p className="text-xs font-mono py-2 px-3 bg-muted rounded-md">
                  {profile.id}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Detalhes da Conta</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Criado em</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(profile.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
            
            <Separator />
            
            <div>
              <Label className="text-sm font-medium">Última atualização</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(profile.updated_at).toLocaleString('pt-BR')}
              </p>
            </div>
            
            <Separator />
            
            <div>
              <Label className="text-sm font-medium">Status da Conta</Label>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600">Ativa</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Segurança</span>
          </CardTitle>
          <CardDescription>
            Configurações de segurança da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="text-sm font-medium">Alterar Senha</h4>
                <p className="text-sm text-muted-foreground">
                  Atualize sua senha para manter sua conta segura
                </p>
              </div>
              <Button variant="outline" size="sm">
                Alterar Senha
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h4 className="text-sm font-medium">Autenticação de Dois Fatores</h4>
                <p className="text-sm text-muted-foreground">
                  Adicione uma camada extra de segurança à sua conta
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Em Breve
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;