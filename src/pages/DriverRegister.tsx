import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Bike, CheckCircle2 } from 'lucide-react';

export default function DriverRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteStoreName, setInviteStoreName] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('invite');
    if (token) {
      setInviteToken(token);
      // Buscar informações da loja do convite
      const fetchStoreInfo = async () => {
        const { data } = await supabase
          .from('store_invite_links')
          .select('stores(name)')
          .eq('token', token)
          .single();
        
        if (data) {
          setInviteStoreName((data.stores as any)?.name);
        }
      };
      fetchStoreInfo();
    }
  }, [searchParams]);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    pix_key_type: '',
    pix_key: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('driver-self-register', {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          pix_key_type: formData.pix_key_type || null,
          pix_key: formData.pix_key || null,
          invite_token: inviteToken || null,
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setSuccess(true);
      toast.success(data.message || 'Cadastro realizado com sucesso!');
      
      setTimeout(() => {
        navigate('/auth');
      }, 3000);

    } catch (error: any) {
      console.error('Error registering driver:', error);
      toast.error(error.message || 'Erro ao realizar cadastro');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">Cadastro Realizado!</CardTitle>
            <CardDescription>
              Seu cadastro foi realizado com sucesso. Aguarde convites de lojas para começar a trabalhar.
              Você será redirecionado para a página de login em alguns segundos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full"
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Bike className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Cadastro de Entregador</CardTitle>
          <CardDescription>
            {inviteStoreName 
              ? `Você foi convidado para ser entregador de ${inviteStoreName}` 
              : 'Preencha seus dados para se cadastrar como entregador e receber convites de lojas'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo *</Label>
              <Input
                id="full_name"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Digite a senha novamente"
              />
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-medium mb-3">Informações de Pagamento (Opcional)</h3>
              
              <div className="space-y-2">
                <Label htmlFor="pix_key_type">Tipo de Chave PIX</Label>
                <Select 
                  value={formData.pix_key_type} 
                  onValueChange={(value) => setFormData({ ...formData, pix_key_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de chave" />
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

              <div className="space-y-2 mt-3">
                <Label htmlFor="pix_key">Chave PIX</Label>
                <Input
                  id="pix_key"
                  value={formData.pix_key}
                  onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                  placeholder="Digite sua chave PIX"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                'Cadastrar como Entregador'
              )}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Já tem cadastro?{' '}
              <Button 
                variant="link" 
                className="p-0 h-auto font-normal"
                onClick={() => navigate('/auth')}
              >
                Fazer login
              </Button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
