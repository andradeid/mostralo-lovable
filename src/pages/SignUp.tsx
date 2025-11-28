import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import { usePageSEO } from '@/hooks/useSEO';
import { Loader2, Store, ArrowLeft, Check, Info, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface SignUpFormData {
  // Dados de Login
  email: string;
  password: string;
  confirmPassword: string;
  
  // Dados Pessoais
  fullName: string;
  phone: string;
  
  // Dados da Empresa
  companyName: string;
  companyDocument: string; // CNPJ ou CPF
  
  // Endereço
  street: string;
  number: string;
  complement?: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Plano
  planId: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  billing_cycle: string;
  description: string | null;
}

const SignUp = () => {
  usePageSEO({
    title: 'Criar Conta - Mostralo | Comece Agora',
    description: 'Crie sua conta no Mostralo e comece a transformar seu negócio com cardápios digitais.',
    keywords: 'criar conta mostralo, cadastro restaurante, cardápio digital',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [referredBySalespersonId, setReferredBySalespersonId] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [salespersonName, setSalespersonName] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    companyName: '',
    companyDocument: '',
    street: '',
    number: '',
    complement: '',
    city: '',
    state: '',
    zipCode: '',
    planId: '',
  });

  // 🎯 Validar código de referência
  useEffect(() => {
    const validateReferral = async () => {
      // Prioridade: URL > localStorage
      const params = new URLSearchParams(window.location.search);
      let code = params.get('ref');
      
      if (!code) {
        code = localStorage.getItem('mostralo_referral_code');
      }
      
      if (code) {
        setReferralCode(code);
        
        try {
          const { data, error } = await supabase
            .from('salespeople')
            .select('id, full_name')
            .eq('referral_code', code)
            .eq('status', 'active')
            .single();
          
          if (data && !error) {
            setReferredBySalespersonId(data.id);
            setSalespersonName(data.full_name);
            console.log('✅ Vendedor encontrado:', data.full_name);
          } else {
            console.warn('⚠️ Código de referência inválido ou vendedor inativo');
          }
        } catch (error) {
          console.error('Erro ao validar código de referência:', error);
        }
      }
    };
    
    validateReferral();
  }, []);

  useEffect(() => {
    fetchPlans();
  }, []);

  // Função para formatar telefone
  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limited = numbers.slice(0, 11);
    
    // Aplica a máscara conforme o tamanho
    if (limited.length <= 10) {
      // Formato: (00) 0000-0000
      return limited
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      // Formato: (00) 00000-0000
      return limited
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
  };

  // Função para gerar slug a partir do nome
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .replace(/^-|-$/g, '') // Remove hífens do início e fim
      .substring(0, 50); // Limita a 50 caracteres
  };

  // Função para formatar CEP
  const formatCEP = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 8 dígitos
    const limited = numbers.slice(0, 8);
    
    // Aplica máscara: 00000-000
    return limited.replace(/^(\d{5})(\d)/, '$1-$2');
  };

  // Função para formatar CPF ou CNPJ
  const formatDocument = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 14 dígitos (máximo para CNPJ)
    const limited = numbers.slice(0, 14);
    
    // Aplica máscara conforme o tamanho
    if (limited.length <= 11) {
      // Formato CPF: 000.000.000-00
      return limited
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1-$2');
    } else {
      // Formato CNPJ: 00.000.000/0000-00
      return limited
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
  };

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('status', 'active')
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar planos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoadingPlans(false);
    }
  };

  const updateFormData = (field: keyof SignUpFormData, value: string) => {
    // Aplica máscara de telefone se o campo for phone
    if (field === 'phone') {
      const formatted = formatPhone(value);
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } 
    // Aplica máscara de CPF/CNPJ se o campo for companyDocument
    else if (field === 'companyDocument') {
      const formatted = formatDocument(value);
      setFormData(prev => ({ ...prev, [field]: formatted }));
    }
    // Aplica máscara de CEP se o campo for zipCode
    else if (field === 'zipCode') {
      const formatted = formatCEP(value);
      setFormData(prev => ({ ...prev, [field]: formatted }));
    }
    else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Função para validar CPF
  const validateCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '');
    
    if (numbers.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(numbers)) return false;
    
    // Valida primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(numbers.charAt(9))) return false;
    
    // Valida segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(numbers.charAt(10))) return false;
    
    return true;
  };

  // Função para validar CNPJ
  const validateCNPJ = (cnpj: string) => {
    const numbers = cnpj.replace(/\D/g, '');
    
    if (numbers.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(numbers)) return false;
    
    // Valida primeiro dígito verificador
    let size = numbers.length - 2;
    let digits = numbers.substring(0, size);
    const digit1 = numbers.substring(size);
    let sum = 0;
    let pos = size - 7;
    
    for (let i = size; i >= 1; i--) {
      sum += parseInt(digits.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digit1.charAt(0))) return false;
    
    // Valida segundo dígito verificador
    size = size + 1;
    digits = numbers.substring(0, size);
    sum = 0;
    pos = size - 7;
    
    for (let i = size; i >= 1; i--) {
      sum += parseInt(digits.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digit1.charAt(1))) return false;
    
    return true;
  };

  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos de login.',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter no mínimo 6 caracteres.',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Senhas não conferem',
        description: 'As senhas digitadas não são iguais.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    if (!formData.fullName || !formData.phone || !formData.companyName || !formData.companyDocument) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos pessoais e da empresa.',
        variant: 'destructive',
      });
      return false;
    }

    // Valida telefone (mínimo 10 dígitos)
    const phoneNumbers = formData.phone.replace(/\D/g, '');
    if (phoneNumbers.length < 10) {
      toast({
        title: 'Telefone inválido',
        description: 'Digite um telefone válido com DDD. Ex: (00) 0000-0000 ou (00) 00000-0000',
        variant: 'destructive',
      });
      return false;
    }

    // Valida CPF ou CNPJ
    const documentNumbers = formData.companyDocument.replace(/\D/g, '');
    
    if (documentNumbers.length === 11) {
      // Validar CPF
      if (!validateCPF(formData.companyDocument)) {
        toast({
          title: 'CPF inválido',
          description: 'Digite um CPF válido. Ex: 000.000.000-00',
          variant: 'destructive',
        });
        return false;
      }
    } else if (documentNumbers.length === 14) {
      // Validar CNPJ
      if (!validateCNPJ(formData.companyDocument)) {
        toast({
          title: 'CNPJ inválido',
          description: 'Digite um CNPJ válido. Ex: 00.000.000/0000-00',
          variant: 'destructive',
        });
        return false;
      }
    } else {
      // Documento incompleto
      toast({
        title: 'Documento inválido',
        description: 'Digite um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const validateStep3 = () => {
    if (!formData.street || !formData.number || !formData.city || !formData.state || !formData.zipCode) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos de endereço.',
        variant: 'destructive',
      });
      return false;
    }

    // Valida CEP (deve ter 8 dígitos)
    const cepNumbers = formData.zipCode.replace(/\D/g, '');
    if (cepNumbers.length !== 8) {
      toast({
        title: 'CEP inválido',
        description: 'Digite um CEP válido com 8 dígitos. Ex: 00000-000',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const validateStep4 = () => {
    if (!formData.planId) {
      toast({
        title: 'Plano não selecionado',
        description: 'Selecione um plano para continuar.',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 4 && !validateStep4()) return;

    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Erro ao criar usuário');

      const userId = authData.user.id;

      // 2. Fazer login imediato para ter auth.uid() nas próximas operações
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) throw signInError;

      // 3. Aguardar trigger criar o profile automaticamente (com user_type e approval_status corretos)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 4. Atualizar apenas phone no profile (o resto já foi definido pelo trigger)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: formData.phone,
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // 5. Criar loja
      let storeSlug = generateSlug(formData.companyName);
      
      // Verificar se slug já existe e adicionar número se necessário
      const { data: existingStore } = await supabase
        .from('stores')
        .select('slug')
        .eq('slug', storeSlug)
        .single();
      
      if (existingStore) {
        // Adiciona timestamp para garantir unicidade
        storeSlug = `${storeSlug}-${Date.now().toString().slice(-6)}`;
      }
      
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .insert({
          name: formData.companyName,
          slug: storeSlug,
          owner_id: userId,
          status: 'inactive',
          plan_id: formData.planId,
        })
        .select()
        .single();

      if (storeError) throw storeError;

      // 6. Buscar dados do plano
      const selectedPlan = plans.find(p => p.id === formData.planId);

      // 7. Criar registro de aprovação de pagamento
      const { error: approvalError } = await (supabase as any)
        .from('payment_approvals')
        .insert({
          user_id: userId,
          store_id: storeData.id,
          plan_id: formData.planId,
          status: 'pending',
          payment_amount: selectedPlan?.price || 0,
          payment_method: 'pix',
          company_name: formData.companyName,
          company_document: formData.companyDocument,
          phone: formData.phone,
          address: {
            street: formData.street,
            number: formData.number,
            complement: formData.complement,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
          },
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
          referred_by_salesperson_id: referredBySalespersonId, // 🎯 Salvar referência do vendedor
        });

      if (approvalError) throw approvalError;

      // 8. Redirecionar para página de comprovante
      // 🧹 Limpar código de referência após cadastro bem-sucedido
      localStorage.removeItem('mostralo_referral_code');
      localStorage.removeItem('mostralo_referral_timestamp');
      
      toast({
        title: 'Conta criada com sucesso! 🎉',
        description: 'Agora faça o upload do comprovante de pagamento.',
      });

      navigate('/payment-proof');

    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
      
      // Tratamento específico para usuário já registrado
      if (error.message?.includes('User already registered') || error.message?.includes('already registered')) {
        toast({
          title: 'Email já cadastrado',
          description: 'Este email já possui uma conta no sistema. Faça login na página de autenticação ou use outro email.',
          variant: 'destructive',
        });
        
        // Redirecionar para login após 2 segundos
        setTimeout(() => {
          navigate('/auth');
        }, 2000);
      } else {
        // Outros erros
        toast({
          title: 'Erro ao criar conta',
          description: error.message || 'Tente novamente mais tarde.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-300">
                Se você já possui uma conta, por favor{' '}
                <Link to="/auth" className="font-semibold underline hover:text-blue-600">
                  faça login aqui
                </Link>
                {' '}ao invés de criar uma nova conta.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData('email', e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => updateFormData('password', e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                placeholder="Digite a senha novamente"
                required
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => updateFormData('fullName', e.target.value)}
                placeholder="Seu nome completo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormData('phone', e.target.value)}
                placeholder="(00) 00000-0000"
                maxLength={15}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa *</Label>
              <Input
                id="companyName"
                value={formData.companyName}
                onChange={(e) => updateFormData('companyName', e.target.value)}
                placeholder="Nome do seu restaurante"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyDocument">CNPJ ou CPF *</Label>
              <Input
                id="companyDocument"
                value={formData.companyDocument}
                onChange={(e) => updateFormData('companyDocument', e.target.value)}
                placeholder="CPF: 000.000.000-00 ou CNPJ: 00.000.000/0000-00"
                maxLength={18}
                required
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="street">Rua *</Label>
                <Input
                  id="street"
                  value={formData.street}
                  onChange={(e) => updateFormData('street', e.target.value)}
                  placeholder="Nome da rua"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="number">Número *</Label>
                <Input
                  id="number"
                  value={formData.number}
                  onChange={(e) => updateFormData('number', e.target.value)}
                  placeholder="123"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={formData.complement}
                onChange={(e) => updateFormData('complement', e.target.value)}
                placeholder="Apto, sala, etc (opcional)"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateFormData('city', e.target.value)}
                  placeholder="Sua cidade"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => updateFormData('state', e.target.value)}
                  placeholder="UF"
                  maxLength={2}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP *</Label>
              <Input
                id="zipCode"
                type="tel"
                value={formData.zipCode}
                onChange={(e) => updateFormData('zipCode', e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                required
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Selecione seu Plano *</Label>
              {loadingPlans ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid gap-4">
                  {plans.map((plan) => (
                    <Card
                      key={plan.id}
                      className={`cursor-pointer transition-all ${
                        formData.planId === plan.id
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => updateFormData('planId', plan.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{plan.name}</h3>
                            {plan.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {plan.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Cobrança: {plan.billing_cycle === 'monthly' ? 'Mensal' : plan.billing_cycle === 'yearly' ? 'Anual' : 'Personalizado'}
                            </p>
                          </div>
                          <div className="flex flex-col items-end">
                            <p className="text-2xl font-bold text-primary">
                              R$ {plan.price.toFixed(2)}
                            </p>
                            {formData.planId === plan.id && (
                              <Check className="w-6 h-6 text-primary mt-2" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const stepTitles = [
    'Dados de Login',
    'Dados Pessoais e Empresa',
    'Endereço',
    'Escolha seu Plano'
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 px-4 py-8">
      {/* 🎁 Feedback Visual de Indicação */}
      {referralCode && referredBySalespersonId && salespersonName && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4">
          <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
            <Gift className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-300">
              ✨ Você foi indicado por <strong>{salespersonName}</strong>! Seu cadastro está vinculado a um parceiro Mostralo.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <div className="w-full max-w-2xl space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Store className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">Mostralo</h1>
          </div>
          <p className="text-muted-foreground">
            Crie sua conta e comece a transformar seu negócio
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step <= currentStep
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step < currentStep ? <Check className="w-5 h-5" /> : step}
              </div>
              {step < 4 && (
                <div
                  className={`h-1 w-16 mx-2 ${
                    step < currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {stepTitles[currentStep - 1]}
            </CardTitle>
            <CardDescription>
              Passo {currentStep} de 4
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {renderStep()}

            <div className="flex space-x-2 pt-4">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={isLoading || (currentStep === 4 && loadingPlans)}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : currentStep === 4 ? (
                  'Criar Conta'
                ) : (
                  'Próximo'
                )}
              </Button>
            </div>

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Já possui uma conta?{' '}
                <Link to="/auth" className="text-primary font-medium hover:underline">
                  Fazer login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignUp;

