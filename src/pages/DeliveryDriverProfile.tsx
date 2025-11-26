import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, User, Mail, Phone, Award, Package, TrendingUp, Camera, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentInfoDisplay } from '@/components/delivery/PaymentInfoDisplay';
import { validatePixKey, formatPixKey, getPixKeyTypeName, type PixKeyType } from '@/utils/pixValidation';
import { formatPhone } from '@/lib/utils';

interface DriverStats {
  totalDeliveries: number;
  completionRate: number;
  avgRating: number;
}

export default function DeliveryDriverProfile() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DriverStats>({
    totalDeliveries: 0,
    completionRate: 0,
    avgRating: 0
  });
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Payment info state
  const [paymentInfo, setPaymentInfo] = useState<{
    pix_key_type: PixKeyType;
    pix_key: string;
    account_holder_name: string;
  } | null>(null);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    pix_key_type: 'cpf' as PixKeyType,
    pix_key: '',
    account_holder_name: ''
  });

  useEffect(() => {
    if (profile) {
      fetchStats();
      fetchPaymentInfo();
      fetchProfileData();
    }
  }, [profile]);

  const fetchProfileData = async () => {
    if (!profile) return;
    
    setFullName(profile.full_name || '');
    setEmail(profile.email || '');
    
    // Buscar telefone do profile
    const { data } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', profile.id)
      .single();
    
    if (data?.phone) {
      setPhone(formatPhone(data.phone));
    }
  };

  const fetchStats = async () => {
    if (!profile) return;

    try {
      setLoading(true);

      // Total de entregas (all time)
      const { count: total } = await supabase
        .from('delivery_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('delivery_driver_id', profile.id);

      // Entregas concluídas
      const { count: completed } = await supabase
        .from('delivery_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('delivery_driver_id', profile.id)
        .eq('status', 'delivered');

      const totalDeliveries = total || 0;
      const completedDeliveries = completed || 0;
      const completionRate = totalDeliveries > 0 
        ? (completedDeliveries / totalDeliveries) * 100 
        : 0;

      setStats({
        totalDeliveries,
        completionRate: Math.round(completionRate),
        avgRating: 4.8 // Placeholder - implementar sistema de avaliações futuramente
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!profile) return;

    try {
      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/avatar.${fileExt}`;

      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${profile.id}/${oldPath}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast.success('Foto atualizada com sucesso!');
      window.location.reload();
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast.error('Não foi possível atualizar a foto');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;

    if (!fullName.trim()) {
      toast.error('O nome não pode estar vazio');
      return;
    }

    // Validar email se foi alterado
    if (email !== profile.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error('Formato de email inválido');
        return;
      }
    }

    // Validar telefone se fornecido
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        toast.error('Formato de telefone inválido. Use (XX) XXXXX-XXXX');
        return;
      }
    }

    try {
      const { data, error } = await supabase.functions.invoke('update-driver-profile', {
        body: {
          full_name: fullName,
          email: email !== profile.email ? email : undefined,
          phone: phone || undefined
        }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success(data.message || 'Perfil atualizado com sucesso!');
      setIsEditingProfile(false);
      
      if (email !== profile.email) {
        // Se mudou email, fazer logout
        setTimeout(() => {
          supabase.auth.signOut();
          window.location.href = '/auth';
        }, 2000);
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Não foi possível atualizar o perfil');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.new !== passwords.confirm) {
      toast.error('As senhas não conferem');
      return;
    }

    if (passwords.new.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;

      toast.success('Senha alterada com sucesso');
      setIsEditingPassword(false);
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao alterar senha');
    }
  };

  const fetchPaymentInfo = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('driver_payment_info')
        .select('*')
        .eq('driver_id', profile.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const paymentData = {
          pix_key_type: data.pix_key_type as PixKeyType,
          pix_key: data.pix_key,
          account_holder_name: data.account_holder_name
        };
        setPaymentInfo(paymentData);
        setPaymentForm(paymentData);
      }
    } catch (error) {
      console.error('Error fetching payment info:', error);
    }
  };

  const handleSavePaymentInfo = async () => {
    if (!profile) return;

    if (!paymentForm.pix_key.trim() || !paymentForm.account_holder_name.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (!validatePixKey(paymentForm.pix_key, paymentForm.pix_key_type)) {
      toast.error(`Chave PIX inválida para o tipo ${getPixKeyTypeName(paymentForm.pix_key_type)}`);
      return;
    }

    try {
      const { error } = await supabase
        .from('driver_payment_info')
        .upsert({
          driver_id: profile.id,
          pix_key_type: paymentForm.pix_key_type,
          pix_key: paymentForm.pix_key,
          account_holder_name: paymentForm.account_holder_name,
          is_active: true
        });

      if (error) throw error;

      toast.success('Dados de pagamento salvos com sucesso!');
      setIsEditingPayment(false);
      fetchPaymentInfo();
    } catch (error: any) {
      console.error('Error saving payment info:', error);
      toast.error('Erro ao salvar dados de pagamento');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Meu Perfil</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card de Perfil */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {profile?.full_name?.charAt(0) || 'E'}
                  </AvatarFallback>
                </Avatar>
                
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleAvatarUpload(file);
                    };
                    input.click();
                  }}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{profile?.full_name || 'Entregador'}</h3>
                <p className="text-muted-foreground">Entregador Ativo</p>
                {!isEditingProfile && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-primary"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    Editar Perfil
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {!isEditingProfile ? (
                <>
                  <div>
                    <Label className="flex items-center gap-2 text-muted-foreground mb-2">
                      <User className="w-4 h-4" />
                      Nome Completo
                    </Label>
                    <Input value={profile?.full_name || ''} disabled />
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input value={profile?.email || ''} disabled />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label className="flex items-center gap-2 text-muted-foreground mb-2">
                      <User className="w-4 h-4" />
                      Nome Completo
                    </Label>
                    <Input 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Digite seu nome completo"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input 
                      type="email"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Digite seu email"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      ⚠️ Ao alterar o email, você precisará fazer login novamente
                    </p>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Phone className="w-4 h-4" />
                      Telefone
                    </Label>
                    <Input 
                      value={phone} 
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="(XX) XXXXX-XXXX"
                      maxLength={15}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleUpdateProfile} size="sm">
                      Salvar Alterações
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setIsEditingProfile(false);
                        fetchProfileData();
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Alterar Senha */}
            <div className="pt-4 border-t">
              {!isEditingPassword ? (
                <Button onClick={() => setIsEditingPassword(true)} variant="outline">
                  Alterar Senha
                </Button>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <Label>Nova Senha</Label>
                    <Input
                      type="password"
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      placeholder="Digite a nova senha"
                      minLength={6}
                      required
                    />
                  </div>
                  <div>
                    <Label>Confirmar Nova Senha</Label>
                    <Input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      placeholder="Confirme a nova senha"
                      minLength={6}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">Salvar</Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setIsEditingPassword(false);
                        setPasswords({ current: '', new: '', confirm: '' });
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card de Dados de Pagamento */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Dados de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!paymentInfo && !isEditingPayment ? (
              <div className="text-center py-6">
                <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground mb-4">
                  Cadastre sua chave PIX para receber os pagamentos das entregas
                </p>
                <Button onClick={() => setIsEditingPayment(true)}>
                  Cadastrar Chave PIX
                </Button>
              </div>
            ) : !isEditingPayment && paymentInfo ? (
              <div className="space-y-4">
                <PaymentInfoDisplay
                  pixKeyType={paymentInfo.pix_key_type as PixKeyType}
                  pixKey={paymentInfo.pix_key}
                  accountHolderName={paymentInfo.account_holder_name}
                  variant="card"
                />
                <Button variant="outline" onClick={() => setIsEditingPayment(true)}>
                  Editar Dados
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Chave PIX</Label>
                  <Select
                    value={paymentForm.pix_key_type}
                    onValueChange={(value) => setPaymentForm({ ...paymentForm, pix_key_type: value as PixKeyType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="cnpj">CNPJ</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="phone">Telefone</SelectItem>
                      <SelectItem value="random">Chave Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Chave PIX</Label>
                  <Input
                    value={paymentForm.pix_key}
                    onChange={(e) => setPaymentForm({ ...paymentForm, pix_key: e.target.value })}
                    placeholder={
                      paymentForm.pix_key_type === 'cpf' ? 'Digite seu CPF' :
                      paymentForm.pix_key_type === 'cnpj' ? 'Digite seu CNPJ' :
                      paymentForm.pix_key_type === 'email' ? 'Digite seu e-mail' :
                      paymentForm.pix_key_type === 'phone' ? 'Digite seu telefone' :
                      'Digite sua chave aleatória'
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {paymentForm.pix_key_type === 'cpf' && 'Formato: 000.000.000-00 ou apenas números'}
                    {paymentForm.pix_key_type === 'cnpj' && 'Formato: 00.000.000/0000-00 ou apenas números'}
                    {paymentForm.pix_key_type === 'email' && 'Digite um e-mail válido'}
                    {paymentForm.pix_key_type === 'phone' && 'Formato: (00) 00000-0000 ou apenas números'}
                    {paymentForm.pix_key_type === 'random' && 'Chave aleatória gerada pelo seu banco'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Nome do Titular</Label>
                  <Input
                    value={paymentForm.account_holder_name}
                    onChange={(e) => setPaymentForm({ ...paymentForm, account_holder_name: e.target.value })}
                    placeholder="Digite o nome completo do titular"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSavePaymentInfo}>
                    Salvar Dados de Pagamento
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditingPayment(false);
                      if (paymentInfo) {
                        setPaymentForm({
                          pix_key_type: paymentInfo.pix_key_type as PixKeyType,
                          pix_key: paymentInfo.pix_key,
                          account_holder_name: paymentInfo.account_holder_name
                        });
                      }
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cards de Estatísticas */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="w-4 h-4" />
                Total de Entregas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalDeliveries}</div>
              <p className="text-xs text-muted-foreground mt-1">Desde o início</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Taxa de Conclusão
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.completionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Entregas concluídas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="w-4 h-4" />
                Avaliação Média
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {stats.avgRating.toFixed(1)} ⭐
              </div>
              <p className="text-xs text-muted-foreground mt-1">Avaliação dos clientes</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
