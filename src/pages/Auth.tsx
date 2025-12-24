import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePageSEO } from '@/hooks/useSEO';
import { Loader2, Store, Info, KeyRound, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  usePageSEO({
    title: 'Login - Mostralo | Acesse Sua Conta',
    description: 'Faça login na sua conta Mostralo e gerencie seus cardápios digitais. Cadastre-se gratuitamente e transforme seu restaurante.',
    keywords: 'login mostralo, entrar conta, cadastro restaurante, cardápio digital login',
    image: '/favicon.png'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  
  const { signIn, user, session, userRole, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Cleanup do countdown ao desmontar
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // Countdown do rate limit
  useEffect(() => {
    if (rateLimitSeconds > 0) {
      countdownRef.current = setInterval(() => {
        setRateLimitSeconds(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [rateLimitSeconds > 0]);

  useEffect(() => {
    // Esperar final do carregamento de auth
    if (authLoading) return;
    if (!user) return;

    // Só redireciona quando tivermos role ou profile definido
    const resolvedRole = userRole || profile?.user_type;
    if (!resolvedRole) return;

    if (userRole === 'customer' && session) {
      toast({
        title: 'Acesso Incorreto',
        description: 'Como cliente, acesse o painel da loja específica',
        variant: 'default',
      });
      navigate('/');
      return;
    }

    if (userRole === 'delivery_driver') {
      navigate('/delivery-panel');
      return;
    }

    // Atendentes vão direto para pedidos
    if (userRole === 'attendant') {
      navigate('/dashboard/orders');
      return;
    }

    // Vendedores vão para painel do vendedor
    if (userRole === 'salesperson') {
      navigate('/vendedor');
      return;
    }

    // Admins: master_admin ou store_admin
    navigate('/dashboard');
  }, [user, userRole, profile, authLoading, navigate, toast]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Bloquear se estiver em rate limit
    if (rateLimitSeconds > 0) return;
    
    setIsLoading(true);

    try {
      const result = await signIn(formData.email, formData.password);
      
      if (result.error) {
        // Verificar se é rate limit
        if (result.rateLimitSeconds && result.rateLimitSeconds > 0) {
          setRateLimitSeconds(result.rateLimitSeconds);
          toast({
            title: 'Muitas tentativas',
            description: `Aguarde ${result.rateLimitSeconds} segundos para tentar novamente.`,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Erro no login',
            description: result.error.message,
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: 'Login realizado com sucesso!',
          description: 'Redirecionando...'
        });
        // O redirecionamento acontecerá automaticamente pelo useEffect
      }
    } catch (error) {
      console.error('Erro inesperado no login:', error);
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao tentar fazer login. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      toast({
        title: 'Erro ao enviar email',
        description: error.message,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
      setShowResetDialog(false);
      setResetEmail('');
    }

    setIsResetLoading(false);
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 px-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Store className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">Mostralo</h1>
          </div>
          <p className="text-muted-foreground">
            Plataforma de cardápios digitais
          </p>
        </div>

        {/* Banner informativo para clientes */}
        <Alert className="border-primary/50 bg-primary/5">
          <Info className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            <p className="font-medium mb-1">Esta área é para Administradores e Entregadores.</p>
            <p>
              Se você é <strong>cliente</strong> e quer acessar seus pedidos, 
              entre pela loja específica onde você compra.
            </p>
          </AlertDescription>
        </Alert>

        {/* Alerta de Rate Limit */}
        {rateLimitSeconds > 0 && (
          <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">Muitas tentativas de login</p>
              <p className="text-sm">
                Aguarde <strong>{rateLimitSeconds}</strong> segundos para tentar novamente.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Acesso ao Sistema</CardTitle>
            <CardDescription className="text-center">
              Entre com suas credenciais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="seu@email.com"
                  required
                  disabled={rateLimitSeconds > 0}
                  className={rateLimitSeconds > 0 ? 'opacity-50' : ''}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                    <DialogTrigger asChild>
                      <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground hover:text-primary">
                        Esqueceu a senha?
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          <KeyRound className="w-5 h-5 text-primary" />
                          <span>Recuperar Senha</span>
                        </DialogTitle>
                        <DialogDescription>
                          Digite seu email para receber instruções de recuperação de senha.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handlePasswordReset} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="reset-email">Email</Label>
                          <Input
                            id="reset-email"
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setShowResetDialog(false)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="submit"
                            className="flex-1"
                            disabled={isResetLoading}
                          >
                            {isResetLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              'Enviar Email'
                            )}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Sua senha"
                  required
                  disabled={rateLimitSeconds > 0}
                  className={rateLimitSeconds > 0 ? 'opacity-50' : ''}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || rateLimitSeconds > 0}
                variant={rateLimitSeconds > 0 ? 'outline' : 'default'}
              >
                {rateLimitSeconds > 0 ? (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Aguarde {rateLimitSeconds}s
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Não possui uma conta?{' '}
                <Link to="/signup" className="text-primary font-medium hover:underline">
                  Criar conta agora
                </Link>
              </p>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
