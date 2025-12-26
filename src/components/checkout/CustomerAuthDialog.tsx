import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Eye, EyeOff, Loader2, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CustomerLocationPicker } from './CustomerLocationPicker';
import { z } from 'zod';
import { formatPhone, normalizePhone } from '@/lib/utils';
import { useStoreModules } from '@/hooks/useStoreModules';

// Componentes de animação
import { CheckoutAuthIdentifyingStep } from './auth/CheckoutAuthIdentifyingStep';
import { CheckoutAuthIdentifiedStep } from './auth/CheckoutAuthIdentifiedStep';
import { CheckoutAuthWhatsAppStep } from './auth/CheckoutAuthWhatsAppStep';

// Schemas de validação
const registerSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(120, 'Nome deve ter no máximo 120 caracteres'),
  phone: z.string().regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
  email: z.string().trim().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
  address: z.string().trim().min(1, 'Endereço é obrigatório').max(500, 'Endereço deve ter no máximo 500 caracteres'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
});

const loginSchema = z.object({
  phone: z.string().regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type LoginStep = 'form' | 'identifying' | 'identified' | 'validating_whatsapp' | 'whatsapp_result' | 'success';
type RegisterStep = 'form' | 'registering' | 'registered' | 'validating_whatsapp' | 'whatsapp_result' | 'success';

interface CustomerAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  storeSlug: string;
  onAuthSuccess: (customerData: any) => void;
}

export function CustomerAuthDialog({ 
  open, 
  onOpenChange, 
  storeId, 
  storeSlug,
  onAuthSuccess 
}: CustomerAuthDialogProps) {
  // Hook de módulos da loja
  const { hasModule } = useStoreModules(storeId);
  const hasWhatsAppModule = hasModule('whatsapp');

  // Estados de Steps Animados
  const [loginStep, setLoginStep] = useState<LoginStep>('form');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('form');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [whatsappStatus, setWhatsappStatus] = useState<'validating' | 'valid' | 'invalid'>('validating');
  const [pendingCustomerData, setPendingCustomerData] = useState<any>(null);

  // Estados de Login
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Estados de Cadastro
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerAddress, setRegisterAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Estados de Rate Limiting
  const [loginRemainingSeconds, setLoginRemainingSeconds] = useState(0);
  const [registerRemainingSeconds, setRegisterRemainingSeconds] = useState(0);
  const [loginAttempts, setLoginAttempts] = useState(0);

  // Reset steps quando o dialog fecha
  useEffect(() => {
    if (!open) {
      setLoginStep('form');
      setRegisterStep('form');
      setLoginError(null);
      setPendingCustomerData(null);
    }
  }, [open]);

  // Countdown timer para login
  useEffect(() => {
    if (loginRemainingSeconds <= 0) return;
    
    const timer = setInterval(() => {
      setLoginRemainingSeconds(prev => {
        if (prev <= 1) {
          setLoginAttempts(0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loginRemainingSeconds]);

  // Countdown timer para registro
  useEffect(() => {
    if (registerRemainingSeconds <= 0) return;
    
    const timer = setInterval(() => {
      setRegisterRemainingSeconds(prev => prev <= 1 ? 0 : prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [registerRemainingSeconds]);

  // Auto-avanço do step "identifying" para "identified"
  useEffect(() => {
    if (loginStep === 'identifying') {
      const timer = setTimeout(() => {
        setLoginStep('identified');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loginStep]);

  // Auto-avanço do step "identified" para WhatsApp ou sucesso
  useEffect(() => {
    if (loginStep === 'identified' && !loginError) {
      const timer = setTimeout(async () => {
        if (hasWhatsAppModule && pendingCustomerData?.phone) {
          setLoginStep('validating_whatsapp');
          await validateWhatsApp(pendingCustomerData.phone);
        } else {
          finishLogin();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loginStep, loginError, hasWhatsAppModule, pendingCustomerData]);

  // Auto-avanço do step "whatsapp_result" para sucesso (login)
  useEffect(() => {
    if (loginStep === 'whatsapp_result') {
      const timer = setTimeout(() => {
        finishLogin();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loginStep]);

  // Auto-avanço do step "registering" para "registered"
  useEffect(() => {
    if (registerStep === 'registering') {
      const timer = setTimeout(() => {
        setRegisterStep('registered');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [registerStep]);

  // Auto-avanço do step "registered" para WhatsApp ou sucesso
  useEffect(() => {
    if (registerStep === 'registered') {
      const timer = setTimeout(async () => {
        if (hasWhatsAppModule && pendingCustomerData?.phone) {
          setRegisterStep('validating_whatsapp');
          await validateWhatsApp(pendingCustomerData.phone);
        } else {
          finishRegister();
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [registerStep, hasWhatsAppModule, pendingCustomerData]);

  // Auto-avanço do step "whatsapp_result" para sucesso (register)
  useEffect(() => {
    if (registerStep === 'whatsapp_result') {
      const timer = setTimeout(() => {
        finishRegister();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [registerStep]);

  const validateWhatsApp = async (phone: string) => {
    try {
      setWhatsappStatus('validating');
      const { data, error } = await supabase.functions.invoke('validate-whatsapp-number', {
        body: { phone, storeId }
      });

      if (error || !data?.isValid) {
        setWhatsappStatus('invalid');
      } else {
        setWhatsappStatus('valid');
      }
    } catch {
      setWhatsappStatus('invalid');
    } finally {
      // Avançar para o resultado
      if (loginStep === 'validating_whatsapp') {
        setLoginStep('whatsapp_result');
      } else if (registerStep === 'validating_whatsapp') {
        setRegisterStep('whatsapp_result');
      }
    }
  };

  const finishLogin = () => {
    if (pendingCustomerData) {
      localStorage.setItem(`customer_${storeId}`, JSON.stringify(pendingCustomerData));
      toast.success(`Bem-vindo(a), ${pendingCustomerData.name}! 🎉`);
      window.dispatchEvent(new CustomEvent('customerProfileUpdated', { detail: pendingCustomerData }));
      onOpenChange(false);
      onAuthSuccess(pendingCustomerData);
    }
  };

  const finishRegister = () => {
    if (pendingCustomerData) {
      localStorage.setItem(`customer_${storeId}`, JSON.stringify(pendingCustomerData));
      toast.success(`Cadastro realizado com sucesso! Bem-vindo(a), ${pendingCustomerData.name}! 🎉`);
      window.dispatchEvent(new CustomEvent('customerProfileUpdated', { detail: pendingCustomerData }));
      onOpenChange(false);
      onAuthSuccess(pendingCustomerData);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loginRemainingSeconds > 0) {
      toast.error(`Aguarde ${loginRemainingSeconds} segundos para tentar novamente`);
      return;
    }

    const normalizedPhone = normalizePhone(loginPhone);
    
    const validation = loginSchema.safeParse({
      phone: normalizedPhone,
      password: loginPassword,
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    setIsLoggingIn(true);
    setLoginError(null);
    setLoginStep('identifying');

    try {
      console.log('🔐 Tentando login:', { phone: normalizedPhone.substring(0, 4) + '***', phoneLength: normalizedPhone.length });
      
      const response = await supabase.functions.invoke('customer-auth', {
        body: { 
          action: 'login',
          phone: normalizedPhone, 
          password: loginPassword 
        }
      });

      const { data, error } = response;

      console.log('🔐 Resposta da Edge Function:', { hasError: !!error, hasData: !!data, data });

      // Detectar rate limiting (429)
      if (error?.message?.includes('429') || data?.retryAfterSeconds || data?.error?.includes('Muitas tentativas')) {
        const retryAfter = data?.retryAfterSeconds || 60;
        setLoginRemainingSeconds(retryAfter);
        setLoginAttempts(prev => prev + 1);
        setLoginError('Muitas tentativas. Aguarde e tente novamente.');
        setLoginStep('identified');
        return;
      }

      // Incrementar tentativas em caso de erro de credenciais
      if (data?.error?.includes('Credenciais') || data?.error?.includes('incorret')) {
        setLoginAttempts(prev => {
          const newAttempts = prev + 1;
          if (newAttempts >= 3) {
            toast.warning('Você está com dificuldades? Verifique seu telefone e senha.');
          }
          return newAttempts;
        });
      }

      if (data?.error) {
        console.error('❌ Erro retornado pela Edge Function:', data.error);
        setLoginError(data.error);
        setLoginStep('identified');
        setTimeout(() => {
          setLoginStep('form');
          setLoginError(null);
        }, 2500);
        return;
      }

      if (error) {
        console.error('❌ Erro HTTP da Edge Function:', error);
        const errorMessage = error.message || 'Erro ao fazer login. Verifique suas credenciais.';
        setLoginError(errorMessage);
        setLoginStep('identified');
        setTimeout(() => {
          setLoginStep('form');
          setLoginError(null);
        }, 2500);
        return;
      }

      if (!data || !data.customer) {
        console.error('❌ Resposta inválida:', data);
        setLoginError('Resposta inválida do servidor');
        setLoginStep('identified');
        setTimeout(() => {
          setLoginStep('form');
          setLoginError(null);
        }, 2500);
        return;
      }

      setLoginAttempts(0);

      // Salvar sessão
      if (data.session) {
        await supabase.auth.setSession(data.session);
      }

      // Preparar dados do cliente
      const customerData = {
        id: data.customer.id,
        name: data.customer.name,
        phone: data.customer.phone,
        email: data.customer.email,
        address: data.customer.address,
        latitude: data.customer.latitude,
        longitude: data.customer.longitude,
        auth_user_id: data.customer.auth_user_id
      };

      setPendingCustomerData(customerData);
      console.log('✅ Login bem-sucedido:', customerData.name);

    } catch (error: any) {
      console.error('❌ Exceção no login:', error);
      setLoginError('Erro inesperado ao fazer login. Tente novamente.');
      setLoginStep('identified');
      setTimeout(() => {
        setLoginStep('form');
        setLoginError(null);
      }, 2500);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerRemainingSeconds > 0) {
      toast.error(`Aguarde ${registerRemainingSeconds} segundos para tentar novamente`);
      return;
    }

    const normalizedPhone = normalizePhone(registerPhone);
    
    const validation = registerSchema.safeParse({
      name: registerName.trim(),
      phone: normalizedPhone,
      password: registerPassword,
      confirmPassword: registerConfirmPassword,
      email: registerEmail.trim(),
      address: registerAddress.trim(),
      latitude,
      longitude,
    });

    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    if (!latitude || !longitude) {
      toast.error('Selecione sua localização no mapa');
      return;
    }

    setIsRegistering(true);
    setRegisterStep('registering');

    try {
      const response = await supabase.functions.invoke('customer-auth', {
        body: { 
          action: 'register',
          name: registerName.trim(),
          phone: normalizedPhone,
          password: registerPassword,
          email: registerEmail.trim() || null,
          address: registerAddress.trim(),
          latitude,
          longitude,
          notes: notes.trim() || null,
          storeId
        }
      });

      const { data, error } = response;

      // Detectar rate limiting (429)
      if (error?.message?.includes('429') || data?.retryAfterSeconds || data?.error?.includes('Muitas tentativas')) {
        const retryAfter = data?.retryAfterSeconds || 3600;
        setRegisterRemainingSeconds(retryAfter);
        toast.error(`Muitas tentativas de cadastro. Aguarde ${Math.ceil(retryAfter / 60)} minuto(s).`);
        setRegisterStep('form');
        return;
      }

      if (error) {
        toast.error('Erro ao criar cadastro. Tente novamente.');
        setRegisterStep('form');
        return;
      }

      if (data.error) {
        toast.error(data.error);
        setRegisterStep('form');
        return;
      }

      // Salvar sessão
      if (data.session) {
        await supabase.auth.setSession(data.session);
      }

      // Preparar dados do cliente
      const customerData = {
        id: data.customer.id,
        name: data.customer.name,
        phone: data.customer.phone,
        email: data.customer.email,
        address: data.customer.address,
        latitude: data.customer.latitude,
        longitude: data.customer.longitude,
        auth_user_id: data.customer.auth_user_id
      };

      setPendingCustomerData(customerData);

    } catch (error: any) {
      console.error('Erro no cadastro:', error);
      toast.error('Erro ao criar cadastro. Tente novamente.');
      setRegisterStep('form');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLocationSelect = (data: { address: string; latitude: number; longitude: number }) => {
    setRegisterAddress(data.address);
    setLatitude(data.latitude);
    setLongitude(data.longitude);
    setShowMapPicker(false);
    toast.success('Localização selecionada!');
  };

  // Renderizar step animado de login
  const renderLoginAnimatedStep = () => {
    switch (loginStep) {
      case 'identifying':
        return <CheckoutAuthIdentifyingStep />;
      case 'identified':
        return (
          <CheckoutAuthIdentifiedStep 
            isNewCustomer={false} 
            customerName={pendingCustomerData?.name}
            error={loginError || undefined}
          />
        );
      case 'validating_whatsapp':
        return <CheckoutAuthWhatsAppStep status="validating" />;
      case 'whatsapp_result':
        return (
          <CheckoutAuthWhatsAppStep 
            status={whatsappStatus} 
            phone={formatPhone(pendingCustomerData?.phone || '')}
          />
        );
      default:
        return null;
    }
  };

  // Renderizar step animado de cadastro
  const renderRegisterAnimatedStep = () => {
    switch (registerStep) {
      case 'registering':
        return <CheckoutAuthIdentifyingStep />;
      case 'registered':
        return (
          <CheckoutAuthIdentifiedStep 
            isNewCustomer={true} 
            customerName={pendingCustomerData?.name}
          />
        );
      case 'validating_whatsapp':
        return <CheckoutAuthWhatsAppStep status="validating" />;
      case 'whatsapp_result':
        return (
          <CheckoutAuthWhatsAppStep 
            status={whatsappStatus} 
            phone={formatPhone(pendingCustomerData?.phone || '')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Faça login ou cadastre-se</DialogTitle>
            <DialogDescription>
              Para finalizar seu pedido, precisamos que você se identifique.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" disabled={loginStep !== 'form'}>Já tenho conta</TabsTrigger>
              <TabsTrigger value="register" disabled={registerStep !== 'form'}>Criar conta</TabsTrigger>
            </TabsList>

            {/* ABA DE LOGIN */}
            <TabsContent value="login">
              {loginStep !== 'form' ? (
                renderLoginAnimatedStep()
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Alerta de Rate Limiting */}
                  {loginRemainingSeconds > 0 && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3 animate-pulse">
                      <div className="bg-destructive/20 rounded-full p-2 shrink-0">
                        <Clock className="h-5 w-5 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-destructive text-sm">Muitas tentativas de login</p>
                        <p className="text-xs text-muted-foreground">
                          Por segurança, aguarde{' '}
                          <span className="font-bold text-destructive">{loginRemainingSeconds}s</span>
                          {' '}para tentar novamente
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Aviso de tentativas */}
                  {loginAttempts >= 2 && loginRemainingSeconds === 0 && (
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        {loginAttempts} tentativa{loginAttempts > 1 ? 's' : ''} incorreta{loginAttempts > 1 ? 's' : ''}. 
                        Verifique seu telefone e senha.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="login-phone">Telefone *</Label>
                    <Input
                      id="login-phone"
                      placeholder="(00) 00000-0000"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(formatPhone(e.target.value))}
                      maxLength={15}
                      required
                      disabled={loginRemainingSeconds > 0}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha *</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        placeholder="Sua senha"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        disabled={loginRemainingSeconds > 0}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        disabled={loginRemainingSeconds > 0}
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoggingIn || loginRemainingSeconds > 0}
                  >
                    {loginRemainingSeconds > 0 ? (
                      <>
                        <Clock className="mr-2 h-4 w-4" />
                        Aguarde {loginRemainingSeconds}s
                      </>
                    ) : isLoggingIn ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : 'Entrar'}
                  </Button>
                </form>
              )}
            </TabsContent>

            {/* ABA DE CADASTRO */}
            <TabsContent value="register">
              {registerStep !== 'form' ? (
                renderRegisterAnimatedStep()
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  {/* Alerta de Rate Limiting */}
                  {registerRemainingSeconds > 0 && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3 animate-pulse">
                      <div className="bg-destructive/20 rounded-full p-2 shrink-0">
                        <Clock className="h-5 w-5 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-destructive text-sm">Muitas tentativas de cadastro</p>
                        <p className="text-xs text-muted-foreground">
                          Por segurança, aguarde{' '}
                          <span className="font-bold text-destructive">
                            {Math.floor(registerRemainingSeconds / 60)}:{(registerRemainingSeconds % 60).toString().padStart(2, '0')}
                          </span>
                          {' '}para tentar novamente
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nome Completo *</Label>
                    <Input
                      id="register-name"
                      placeholder="Seu nome"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      maxLength={120}
                      required
                      disabled={registerRemainingSeconds > 0}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-phone">Telefone / WhatsApp *</Label>
                    <Input
                      id="register-phone"
                      placeholder="(00) 00000-0000"
                      value={registerPhone}
                      onChange={(e) => setRegisterPhone(formatPhone(e.target.value))}
                      maxLength={15}
                      required
                      disabled={registerRemainingSeconds > 0}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Senha * (mínimo 6 caracteres)</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showRegisterPassword ? "text" : "password"}
                        placeholder="Escolha uma senha"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                        disabled={registerRemainingSeconds > 0}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        disabled={registerRemainingSeconds > 0}
                      >
                        {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirmar Senha *</Label>
                    <div className="relative">
                      <Input
                        id="register-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repita sua senha"
                        value={registerConfirmPassword}
                        onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                        required
                        disabled={registerRemainingSeconds > 0}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={registerRemainingSeconds > 0}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">E-mail *</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      maxLength={255}
                      required
                      disabled={registerRemainingSeconds > 0}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-address">Endereço de Entrega *</Label>
                    <Textarea
                      id="register-address"
                      placeholder="Rua, número, bairro, cidade..."
                      value={registerAddress}
                      onChange={(e) => setRegisterAddress(e.target.value)}
                      rows={3}
                      required
                      disabled={registerRemainingSeconds > 0}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMapPicker(true)}
                      className="w-full"
                      disabled={registerRemainingSeconds > 0}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      {latitude && longitude ? 'Localização Selecionada ✓' : 'Selecionar Localização no Mapa *'}
                    </Button>
                    {latitude && longitude && (
                      <p className="text-xs text-muted-foreground">
                        Coordenadas: {latitude.toFixed(6)}, {longitude.toFixed(6)}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-notes">Observações</Label>
                    <Textarea
                      id="register-notes"
                      placeholder="Ex: Perto do mercado, portão azul..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      disabled={registerRemainingSeconds > 0}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isRegistering || registerRemainingSeconds > 0}
                  >
                    {registerRemainingSeconds > 0 ? (
                      <>
                        <Clock className="mr-2 h-4 w-4" />
                        Aguarde {Math.floor(registerRemainingSeconds / 60)}:{(registerRemainingSeconds % 60).toString().padStart(2, '0')}
                      </>
                    ) : isRegistering ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cadastrando...
                      </>
                    ) : 'Cadastrar'}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <CustomerLocationPicker
        open={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={handleLocationSelect}
        initialCoords={latitude && longitude ? { latitude, longitude } : undefined}
        storeId={storeId}
      />
    </>
  );
}
