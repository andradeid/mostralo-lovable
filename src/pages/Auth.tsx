import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePageSEO } from '@/hooks/useSEO';
import { Loader2, Store, Info, KeyRound, AlertTriangle, Mail, MessageCircle, CheckCircle2 } from 'lucide-react';
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
  const [recoveryMethod, setRecoveryMethod] = useState<'email' | 'whatsapp'>('email');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [hasPhone, setHasPhone] = useState<boolean | null>(null);
  const [recoverySent, setRecoverySent] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);
  const [isCleaningSession, setIsCleaningSession] = useState(false);
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

    // Se for cliente tentando acessar /auth, fazer logout automático para permitir login como admin
    if (userRole === 'customer' && session) {
      console.log('🧹 Sessão de cliente detectada em /auth, limpando automaticamente...');
      setIsCleaningSession(true);
      
      (async () => {
        try {
          await supabase.auth.signOut();
          
          // Limpar localStorage de dados de cliente
          const keysToRemove: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('customer_') || key.startsWith('sb-'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
          
          toast({
            title: 'Sessão anterior encerrada',
            description: 'Agora você pode fazer login como administrador.',
          });
        } catch (error) {
          console.error('Erro ao limpar sessão:', error);
        } finally {
          setIsCleaningSession(false);
        }
      })();
      return;
    }

    if (userRole === 'delivery_driver') {
      navigate('/delivery-panel');
      return;
    }

    // Profissionais vão para painel do profissional
    if (userRole === 'professional') {
      navigate('/profissional');
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

  // Verificar telefone quando email muda
  const checkUserPhone = async (emailToCheck: string) => {
    if (!emailToCheck || !emailToCheck.includes('@')) {
      setHasPhone(null);
      return;
    }

    setIsCheckingPhone(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('email', emailToCheck.toLowerCase().trim())
        .single();

      setHasPhone(!!profile?.phone);
    } catch {
      setHasPhone(null);
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);

    if (recoveryMethod === 'email') {
      // Enviar por email (método existente)
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
        setRecoverySent(true);
        toast({
          title: 'Email enviado!',
          description: 'Verifique sua caixa de entrada para redefinir sua senha.',
        });
      }
    } else {
      // Enviar por WhatsApp
      try {
        const { data, error } = await supabase.functions.invoke('send-user-recovery-link', {
          body: { email: resetEmail }
        });

        if (error || !data?.success) {
          const errorMessage = data?.error || 'Erro ao enviar link';
          
          if (data?.noPhone) {
            toast({
              title: 'Telefone não cadastrado',
              description: 'Use a opção de recuperação por email.',
              variant: 'destructive'
            });
            setRecoveryMethod('email');
          } else {
            toast({
              title: 'Erro ao enviar',
              description: errorMessage,
              variant: 'destructive'
            });
          }
        } else {
          setRecoverySent(true);
          toast({
            title: 'Link enviado!',
            description: 'Verifique seu WhatsApp para redefinir sua senha.',
          });
        }
      } catch (err) {
        console.error('Erro ao enviar link por WhatsApp:', err);
        toast({
          title: 'Erro',
          description: 'Não foi possível enviar o link. Tente por email.',
          variant: 'destructive'
        });
      }
    }

    setIsResetLoading(false);
  };

  const handleResetDialogClose = (open: boolean) => {
    setShowResetDialog(open);
    if (!open) {
      // Reset states when closing
      setResetEmail('');
      setRecoveryMethod('email');
      setHasPhone(null);
      setRecoverySent(false);
    }
  };

  // Tela de loading enquanto limpa sessão anterior
  if (isCleaningSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Preparando login...</p>
        </div>
      </div>
    );
  }

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
                  <Dialog open={showResetDialog} onOpenChange={handleResetDialogClose}>
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
                          {recoverySent 
                            ? 'Link de recuperação enviado com sucesso!' 
                            : 'Digite seu email e escolha como deseja receber o link.'}
                        </DialogDescription>
                      </DialogHeader>
                      
                      {recoverySent ? (
                        <div className="text-center space-y-4 py-4">
                          <div className="flex justify-center">
                            <div className="rounded-full bg-emerald-100 dark:bg-emerald-900 p-3">
                              <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium text-foreground">
                              {recoveryMethod === 'email' 
                                ? 'Verifique sua caixa de entrada!' 
                                : 'Verifique seu WhatsApp!'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Clique no link que enviamos para criar uma nova senha.
                            </p>
                          </div>
                          <Button 
                            onClick={() => handleResetDialogClose(false)} 
                            className="w-full"
                          >
                            Fechar
                          </Button>
                        </div>
                      ) : (
                        <form onSubmit={handlePasswordReset} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email">Email</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              value={resetEmail}
                              onChange={(e) => {
                                setResetEmail(e.target.value);
                                checkUserPhone(e.target.value);
                              }}
                              placeholder="seu@email.com"
                              required
                            />
                          </div>

                          <div className="space-y-3">
                            <Label>Como deseja receber o link?</Label>
                            <RadioGroup 
                              value={recoveryMethod} 
                              onValueChange={(v) => setRecoveryMethod(v as 'email' | 'whatsapp')}
                              className="space-y-2"
                            >
                              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer">
                                <RadioGroupItem value="email" id="method-email" />
                                <Label htmlFor="method-email" className="flex items-center gap-2 cursor-pointer flex-1">
                                  <Mail className="w-4 h-4 text-primary" />
                                  <div>
                                    <p className="font-medium">Por Email</p>
                                    <p className="text-xs text-muted-foreground">Receba o link no seu email</p>
                                  </div>
                                </Label>
                              </div>
                              
                              <div className={`flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer ${hasPhone === false ? 'opacity-50' : ''}`}>
                                <RadioGroupItem 
                                  value="whatsapp" 
                                  id="method-whatsapp" 
                                  disabled={hasPhone === false}
                                />
                                <Label htmlFor="method-whatsapp" className="flex items-center gap-2 cursor-pointer flex-1">
                                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                                  <div>
                                    <p className="font-medium">Por WhatsApp</p>
                                    <p className="text-xs text-muted-foreground">
                                      {isCheckingPhone 
                                        ? 'Verificando...' 
                                        : hasPhone === false 
                                          ? 'Telefone não cadastrado' 
                                          : 'Receba o link no seu WhatsApp'}
                                    </p>
                                  </div>
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <div className="flex space-x-2 pt-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleResetDialogClose(false)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="submit"
                              className="flex-1"
                              disabled={isResetLoading || isCheckingPhone}
                            >
                              {isResetLoading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Enviando...
                                </>
                              ) : (
                                <>
                                  {recoveryMethod === 'email' ? (
                                    <Mail className="mr-2 h-4 w-4" />
                                  ) : (
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                  )}
                                  Enviar Link
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      )}
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
