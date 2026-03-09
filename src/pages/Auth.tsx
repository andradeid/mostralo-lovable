import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { usePageSEO } from '@/hooks/useSEO';
import { 
  Loader2, 
  Store, 
  Info, 
  KeyRound, 
  AlertTriangle, 
  Mail, 
  MessageCircle, 
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Truck,
  User,
  Building2,
  Scissors
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

type UserType = 'lojista' | 'profissional' | 'entregador';

const userTypeConfig = {
  lojista: {
    icon: Building2,
    label: 'Lojista',
    description: 'Proprietários e gestores',
    gradient: 'from-primary/20 to-primary/5'
  },
  profissional: {
    icon: Scissors,
    label: 'Profissional',
    description: 'Prestadores de serviço',
    gradient: 'from-emerald-500/20 to-emerald-500/5'
  },
  entregador: {
    icon: Truck,
    label: 'Entregador',
    description: 'Equipe de entrega',
    gradient: 'from-blue-500/20 to-blue-500/5'
  }
};

const Auth = () => {
  usePageSEO({
    title: 'Login - Mostralo | Acesse Sua Conta',
    description: 'Faça login na sua conta Mostralo. Plataforma completa para gestão do seu negócio.',
    keywords: 'login mostralo, entrar conta, sistema gestão, loja digital',
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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<UserType>('lojista');
  const [isPageLoaded, setIsPageLoaded] = useState(false);
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

  // Animação de entrada
  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

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

    // Atendentes vão para o dashboard do atendente
    if (userRole === 'attendant') {
      navigate('/dashboard/atendente');
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Preparando login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/10">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative z-10">
        <div 
          className={cn(
            "w-full max-w-md space-y-6 transition-all duration-700 ease-out",
            isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          {/* Logo e título */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl transform scale-110" />
                <div className="relative bg-gradient-to-br from-primary to-primary/80 p-4 rounded-2xl shadow-lg">
                  <Store className="w-12 h-12 text-primary-foreground" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Mostralo
            </h1>
            <p className="text-muted-foreground text-lg">
              Sistema de gestão para sua loja
            </p>
            <p className="text-sm text-muted-foreground/80">
              Área exclusiva para proprietários, gestores, profissionais e equipe de entrega
            </p>
          </div>

          {/* Segmentação de Acesso */}
          <div className="flex gap-2 justify-center">
            {(Object.keys(userTypeConfig) as UserType[]).map((type) => {
              const config = userTypeConfig[type];
              const Icon = config.icon;
              const isSelected = selectedUserType === type;
              
              return (
                <button
                  key={type}
                  onClick={() => setSelectedUserType(type)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-300",
                    "border-2",
                    isSelected 
                      ? "border-primary bg-primary/10 shadow-md" 
                      : "border-border hover:border-primary/50 hover:bg-accent/50"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 transition-colors",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-xs font-medium transition-colors",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )}>
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Alerta de Rate Limit */}
          {rateLimitSeconds > 0 && (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">Muitas tentativas de login</p>
                <p className="text-sm">
                  Aguarde <strong>{rateLimitSeconds}</strong> segundos para tentar novamente.
                </p>
              </AlertDescription>
            </Alert>
          )}

          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-xl">Acesso ao Sistema</CardTitle>
              <CardDescription className="text-center">
                Entre com suas credenciais de {userTypeConfig[selectedUserType].label.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="seu@email.com"
                      required
                      disabled={rateLimitSeconds > 0}
                      className={cn(
                        "pl-10 h-11",
                        rateLimitSeconds > 0 && 'opacity-50'
                      )}
                    />
                  </div>
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
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                                  className="pl-10"
                                />
                              </div>
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
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Sua senha"
                      required
                      disabled={rateLimitSeconds > 0}
                      className={cn(
                        "pl-10 pr-10 h-11",
                        rateLimitSeconds > 0 && 'opacity-50'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Lembrar-me checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-muted-foreground cursor-pointer select-none"
                  >
                    Lembrar-me neste dispositivo
                  </label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium" 
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

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Não possui uma conta?{' '}
                  <Link to="/signup" className="text-primary font-medium hover:underline">
                    Criar conta agora
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Banner informativo para clientes */}
          <div className="bg-accent/30 border border-border rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Você é cliente?</p>
                <p className="text-muted-foreground">
                  Para acessar seus pedidos, entre pela loja específica onde você compra.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="container max-w-md mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link to="/gestao-360" className="hover:text-foreground transition-colors">
                Página Inicial
              </Link>
              <Link to="/termos" className="hover:text-foreground transition-colors">
                Termos
              </Link>
              <Link to="/privacidade" className="hover:text-foreground transition-colors">
                Privacidade
              </Link>
              <a 
                href="https://wa.me/5511999999999" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Suporte
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              © 2026 Mostralo
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Auth;
