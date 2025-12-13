import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { validatePixKey, formatPixKey, type PixKeyType } from "@/utils/pixValidation";
import { ContractViewer } from "@/components/contract/ContractViewer";
import { AffiliateTerms } from "@/components/salesperson/AffiliateTerms";
import { SalespersonTypeSelector } from "@/components/salesperson/SalespersonTypeSelector";
import { ProfilePhotoUpload } from "@/components/salesperson/ProfilePhotoUpload";
import { QualificationQuiz } from "@/components/salesperson/QualificationQuiz";
import {
  User,
  Building2,
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  FileText,
  CreditCard,
  Camera,
  ClipboardList,
} from "lucide-react";

type SalespersonType = 'affiliate' | 'partner' | null;
type Step = 0 | 1 | 2 | 3 | 4 | 5;

interface FormData {
  // Tipo de vendedor
  salesperson_type: SalespersonType;
  
  // Etapa 1: Dados Pessoais
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;

  // Etapa 2: Foto de Perfil
  profile_photo_url: string;

  // Etapa 3: Questionário de Qualificação
  qualification_answers: Record<string, string>;
  qualification_score: number;
  qualification_level: string;

  // Etapa 4 Afiliado: CPF
  cpf: string;
  
  // Etapa 4 Parceiro: CNPJ
  cnpj: string;
  company_name: string;
  company_trade_name: string;
  cnae_codes: string[];
  cnpj_validation_data: any;

  // Etapa 5: PIX e Termos
  pix_key: string;
  pix_key_type: string;
  acceptedTerms: boolean;
}

export default function CadastroVendedor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') as SalespersonType;
  
  const [step, setStep] = useState<Step>(initialType ? 1 : 0);
  const [loading, setLoading] = useState(false);
  const [validatingCNPJ, setValidatingCNPJ] = useState(false);
  const [validatingCPF, setValidatingCPF] = useState(false);
  const [cnpjValid, setCnpjValid] = useState<boolean | null>(null);
  const [cpfValid, setCpfValid] = useState<boolean | null>(null);
  const [contractTemplate, setContractTemplate] = useState<any>(null);
  const [loadingContract, setLoadingContract] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    salesperson_type: initialType,
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    profile_photo_url: "",
    qualification_answers: {},
    qualification_score: 0,
    qualification_level: "evaluation",
    cpf: "",
    cnpj: "",
    company_name: "",
    company_trade_name: "",
    cnae_codes: [],
    cnpj_validation_data: null,
    pix_key: "",
    pix_key_type: "cpf",
    acceptedTerms: false,
  });

  // Carregar template de contrato (apenas para Parceiro PJ)
  useEffect(() => {
    if (formData.salesperson_type === 'partner') {
      const loadContractTemplate = async () => {
        try {
          const { data, error } = await supabase
            .from('salesperson_contract_templates')
            .select('*')
            .eq('is_active', true)
            .maybeSingle();
          
          if (!error && data) {
            setContractTemplate(data);
          }
        } catch (err) {
          console.error('Erro ao carregar template de contrato:', err);
        } finally {
          setLoadingContract(false);
        }
      };
      
      loadContractTemplate();
    } else {
      setLoadingContract(false);
    }
  }, [formData.salesperson_type]);

  // Função para substituir placeholders no contrato
  const getFormattedContractText = () => {
    if (!contractTemplate) return '';
    
    let text = contractTemplate.contract_text || '';
    
    text = text.replace(/{empresa}/g, contractTemplate.company_name || '');
    text = text.replace(/{cnpj}/g, contractTemplate.company_cnpj || '');
    text = text.replace(/{cidade}/g, contractTemplate.company_city || '');
    text = text.replace(/{estado}/g, contractTemplate.company_state || '');
    text = text.replace(/{vendedor_nome}/g, formData.full_name || '[Seu Nome]');
    text = text.replace(/{vendedor_cnpj}/g, formData.cnpj || '[Seu CNPJ]');
    text = text.replace(/{vendedor_empresa}/g, formData.company_name || '[Sua Empresa]');
    text = text.replace(/{comissao_percentual}/g, '10');
    
    return text;
  };

  // Função para formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const limited = numbers.slice(0, 11);
    
    if (limited.length <= 10) {
      return limited
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      return limited
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
  };

  // Função para formatar CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const limited = numbers.slice(0, 11);
    return limited
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2');
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPixKey = () => {
    if (!formData.pix_key) return false;
    return validatePixKey(formData.pix_key, formData.pix_key_type as PixKeyType);
  };

  const handleValidateCPF = async () => {
    if (!formData.cpf) {
      toast.error("Digite um CPF");
      return;
    }

    setValidatingCPF(true);
    setCpfValid(null);

    try {
      const { data, error } = await supabase.functions.invoke("validate-cpf", {
        body: { cpf: formData.cpf },
      });

      if (error) throw error;

      if (data.valid) {
        setCpfValid(true);
        toast.success("CPF válido!");
      } else {
        setCpfValid(false);
        toast.error(data.error || "CPF inválido");
      }
    } catch (error: any) {
      console.error("Erro ao validar CPF:", error);
      toast.error("Erro ao validar CPF. Tente novamente.");
      setCpfValid(false);
    } finally {
      setValidatingCPF(false);
    }
  };

  const handleValidateCNPJ = async () => {
    if (!formData.cnpj) {
      toast.error("Digite um CNPJ");
      return;
    }

    setValidatingCNPJ(true);
    setCnpjValid(null);

    try {
      const { data, error } = await supabase.functions.invoke("validate-cnpj", {
        body: { cnpj: formData.cnpj },
      });

      if (error) throw error;

      if (data.valid) {
        setCnpjValid(true);
        setFormData({
          ...formData,
          company_name: data.data.razao_social,
          company_trade_name: data.data.nome_fantasia || "",
          cnae_codes: data.cnaes_encontrados || [],
          cnpj_validation_data: data.data,
        });
        toast.success("CNPJ validado com sucesso!");
      } else {
        setCnpjValid(false);
        toast.error(data.error || "CNPJ inválido");
      }
    } catch (error: any) {
      console.error("Erro ao validar CNPJ:", error);
      toast.error("Erro ao validar CNPJ. Tente novamente.");
      setCnpjValid(false);
    } finally {
      setValidatingCNPJ(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.acceptedTerms) {
      toast.error("Você deve aceitar os termos");
      return;
    }

    if (!formData.pix_key) {
      toast.error("Chave PIX é obrigatória");
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        salesperson_type: formData.salesperson_type,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        profile_photo_url: formData.profile_photo_url,
        qualification_answers: formData.qualification_answers,
        qualification_score: formData.qualification_score,
        qualification_level: formData.qualification_level,
        pix_key: formData.pix_key,
        pix_key_type: formData.pix_key_type,
      };

      if (formData.salesperson_type === 'partner') {
        payload.cnpj = formData.cnpj;
        payload.company_name = formData.company_name;
        payload.company_trade_name = formData.company_trade_name;
        payload.cnae_codes = formData.cnae_codes;
        payload.cnpj_validation_data = formData.cnpj_validation_data;
      } else {
        payload.cpf = formData.cpf.replace(/\D/g, '');
      }

      const { data, error } = await supabase.functions.invoke("salesperson-self-register", {
        body: payload,
      });

      if (error) {
        // Tentar extrair mensagem específica do body da resposta HTTP
        let errorMessage = "Erro ao realizar cadastro";
        
        if (error.context) {
          try {
            const errorBody = await error.context.json();
            if (errorBody?.error) {
              errorMessage = errorBody.error;
              
              // Mensagens mais amigáveis para erros de duplicidade
              if (errorMessage.includes('CPF já cadastrado')) {
                toast.error("Este CPF já está cadastrado. Se você já tem uma conta, tente fazer login.", {
                  duration: 6000,
                  action: {
                    label: "Fazer login",
                    onClick: () => navigate("/login"),
                  },
                });
                return;
              }
              if (errorMessage.includes('Email já cadastrado')) {
                toast.error("Este email já está cadastrado. Se você já tem uma conta, tente fazer login.", {
                  duration: 6000,
                  action: {
                    label: "Fazer login",
                    onClick: () => navigate("/login"),
                  },
                });
                return;
              }
              if (errorMessage.includes('CNPJ já cadastrado')) {
                toast.error("Este CNPJ já está cadastrado. Se você já tem uma conta, tente fazer login.", {
                  duration: 6000,
                  action: {
                    label: "Fazer login",
                    onClick: () => navigate("/login"),
                  },
                });
                return;
              }
            }
          } catch {
            // Se não conseguir parsear o body, usa mensagem do error
            if (error.message) {
              errorMessage = error.message;
            }
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        toast.error(errorMessage);
        return;
      }

      if (data?.success) {
        toast.success(data.message);
        navigate("/cadastro-vendedor/sucesso");
      } else {
        toast.error(data?.error || "Erro ao realizar cadastro");
      }
    } catch (error: any) {
      console.error("Erro no cadastro:", error);
      toast.error(error.message || "Erro ao realizar cadastro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const canProceedStep1 = () => {
    return (
      formData.full_name &&
      formData.email &&
      isValidEmail(formData.email) &&
      formData.phone &&
      formData.phone.replace(/\D/g, '').length >= 10 &&
      formData.password &&
      formData.password === formData.confirmPassword &&
      formData.password.length >= 6
    );
  };

  const canProceedStep2Photo = () => !!formData.profile_photo_url;
  const canProceedStep3Quiz = () => Object.keys(formData.qualification_answers).length === 6;
  const canProceedStep4Affiliate = () => cpfValid === true;
  const canProceedStep4Partner = () => cnpjValid === true && formData.company_name;

  // Número total de etapas baseado no tipo
  // Afiliado: 0 (tipo) -> 1 (pessoais) -> 2 (foto) -> 3 (quiz) -> 4 (CPF+PIX+termos) = 5 etapas
  // Parceiro: 0 (tipo) -> 1 (pessoais) -> 2 (foto) -> 3 (quiz) -> 4 (CNPJ) -> 5 (PIX+termos) = 6 etapas
  const totalSteps = formData.salesperson_type === 'affiliate' ? 5 : 6;
  
  // Calcular etapa de exibição
  const getDisplayStep = () => {
    if (step === 0) return 0;
    return step;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-8 px-4">
      <div className="container max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/seja-vendedor" className="inline-block mb-4">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Cadastro de Vendedor</h1>
          <p className="text-muted-foreground">
            {step === 0 
              ? "Escolha como deseja se cadastrar"
              : formData.salesperson_type === 'affiliate'
                ? "Complete as etapas para se tornar um Afiliado"
                : "Complete as etapas para se tornar um Parceiro PJ"
            }
          </p>
          {formData.salesperson_type && (
            <Badge className="mt-2" variant={formData.salesperson_type === 'partner' ? 'default' : 'secondary'}>
              {formData.salesperson_type === 'affiliate' ? 'Afiliado (CPF)' : 'Parceiro PJ (CNPJ)'}
            </Badge>
          )}
        </div>

        {/* Progress - só mostrar após escolher tipo */}
        {step > 0 && (
          <div className="flex justify-center mb-8 overflow-x-auto pb-2">
            <div className="flex items-center gap-1 sm:gap-2">
              {formData.salesperson_type === 'affiliate' ? (
                // Progress Afiliado: 4 etapas visuais
                <>
                  {[
                    { num: 1, label: "Dados", icon: User },
                    { num: 2, label: "Foto", icon: Camera },
                    { num: 3, label: "Perfil", icon: ClipboardList },
                    { num: 4, label: "Finalizar", icon: FileText },
                  ].map((s, i) => (
                    <div key={s.num} className="flex items-center">
                      <div className={`flex items-center gap-1 ${step >= s.num ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm ${step >= s.num ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          {s.num}
                        </div>
                        <span className="text-xs font-medium hidden md:inline">{s.label}</span>
                      </div>
                      {i < 3 && <div className="w-6 sm:w-10 h-0.5 bg-muted mx-1" />}
                    </div>
                  ))}
                </>
              ) : (
                // Progress Parceiro: 5 etapas visuais
                <>
                  {[
                    { num: 1, label: "Dados", icon: User },
                    { num: 2, label: "Foto", icon: Camera },
                    { num: 3, label: "Perfil", icon: ClipboardList },
                    { num: 4, label: "CNPJ", icon: Building2 },
                    { num: 5, label: "Finalizar", icon: FileText },
                  ].map((s, i) => (
                    <div key={s.num} className="flex items-center">
                      <div className={`flex items-center gap-1 ${step >= s.num ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-sm ${step >= s.num ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                          {s.num}
                        </div>
                        <span className="text-xs font-medium hidden md:inline">{s.label}</span>
                      </div>
                      {i < 4 && <div className="w-6 sm:w-10 h-0.5 bg-muted mx-1" />}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* Etapa 0: Seleção de Tipo */}
        {step === 0 && (
          <SalespersonTypeSelector
            selectedType={formData.salesperson_type}
            onSelectType={(type) => setFormData({ ...formData, salesperson_type: type })}
            onContinue={() => setStep(1)}
          />
        )}

        {/* Etapa 1: Dados Pessoais (ambos) */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Dados Pessoais
              </CardTitle>
              <CardDescription>
                Informe seus dados pessoais e crie uma senha
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="João da Silva"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="joao@email.com"
                    className={formData.email && !isValidEmail(formData.email) ? 'border-destructive' : ''}
                  />
                  {formData.email && !isValidEmail(formData.email) && (
                    <p className="text-sm text-destructive mt-1">Email inválido</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirme sua senha"
                  />
                </div>
              </div>

              {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>As senhas não coincidem</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1()}
                  className="flex-1"
                >
                  Próximo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Etapa 2: Foto de Perfil (ambos os tipos) */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Foto de Perfil
              </CardTitle>
              <CardDescription>
                Envie uma foto sua para que possamos conhecê-lo melhor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ProfilePhotoUpload
                value={formData.profile_photo_url}
                onChange={(url) => setFormData({ ...formData, profile_photo_url: url })}
              />

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2Photo()}
                  className="flex-1"
                >
                  Próximo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Etapa 3: Questionário de Qualificação (ambos os tipos) */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Conhecendo Seu Perfil
              </CardTitle>
              <CardDescription>
                Responda algumas perguntas para entendermos melhor seu perfil (não é eliminatório!)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <QualificationQuiz
                value={formData.qualification_answers}
                onChange={(answers, score, level) => setFormData({ 
                  ...formData, 
                  qualification_answers: answers,
                  qualification_score: score,
                  qualification_level: level
                })}
              />

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  disabled={!canProceedStep3Quiz()}
                  className="flex-1"
                >
                  Próximo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Etapa 4 Afiliado: CPF + PIX + Termos (tudo junto) */}
        {step === 4 && formData.salesperson_type === 'affiliate' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                CPF, PIX e Termos de Indicação
              </CardTitle>
              <CardDescription>
                Valide seu CPF, informe o PIX e aceite os termos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* CPF */}
              <div>
                <Label htmlFor="cpf">CPF *</Label>
                <div className="flex gap-2">
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => {
                      setFormData({ ...formData, cpf: formatCPF(e.target.value) });
                      setCpfValid(null);
                    }}
                    placeholder="000.000.000-00"
                    disabled={cpfValid === true}
                    maxLength={14}
                  />
                  <Button
                    onClick={handleValidateCPF}
                    disabled={validatingCPF || cpfValid === true || formData.cpf.replace(/\D/g, '').length !== 11}
                  >
                    {validatingCPF ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : cpfValid === true ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      "Validar"
                    )}
                  </Button>
                </div>
                {cpfValid === true && (
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> CPF válido
                  </p>
                )}
                {cpfValid === false && (
                  <p className="text-sm text-destructive mt-1">CPF inválido</p>
                )}
              </div>

              {/* PIX */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Dados de Pagamento
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="pix_key_type">Tipo de Chave PIX</Label>
                    <select
                      id="pix_key_type"
                      value={formData.pix_key_type}
                      onChange={(e) => setFormData({ ...formData, pix_key_type: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="cpf">CPF</option>
                      <option value="email">Email</option>
                      <option value="phone">Telefone</option>
                      <option value="random">Chave Aleatória</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="pix_key">Chave PIX *</Label>
                    <Input
                      id="pix_key"
                      value={formData.pix_key}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (['phone', 'cpf'].includes(formData.pix_key_type)) {
                          setFormData({ ...formData, pix_key: formatPixKey(value, formData.pix_key_type as PixKeyType) });
                        } else {
                          setFormData({ ...formData, pix_key: value });
                        }
                      }}
                      placeholder={
                        formData.pix_key_type === 'cpf' ? '000.000.000-00' :
                        formData.pix_key_type === 'email' ? 'seuemail@exemplo.com' :
                        formData.pix_key_type === 'phone' ? '(11) 99999-9999' :
                        'Chave aleatória UUID'
                      }
                    />
                    {formData.pix_key && isValidPixKey() && (
                      <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Chave PIX válida
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Termos de Indicação */}
              <div className="border-t pt-4">
                <div className="border rounded-lg">
                  <div className="p-4 border-b bg-muted/50">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Termos de Indicação - Afiliado
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Leia atentamente os termos antes de aceitar
                    </p>
                  </div>
                  
                  <ScrollArea className="h-[350px]">
                    <div className="p-4">
                      <AffiliateTerms
                        salespersonName={formData.full_name || undefined}
                        salespersonCpf={formData.cpf || undefined}
                        commissionPercentage={7}
                      />
                    </div>
                  </ScrollArea>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptedTerms}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, acceptedTerms: checked as boolean })
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor="terms" className="cursor-pointer">
                      Li e aceito os Termos de Indicação *
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Declaro que li e concordo com os termos acima. Confirmo que esta é uma 
                      relação de indicação eventual e voluntária, sem vínculo empregatício.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !formData.acceptedTerms || !formData.pix_key || !isValidPixKey() || !cpfValid}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Finalizar Cadastro"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Etapa 4 Parceiro: CNPJ */}
        {step === 4 && formData.salesperson_type === 'partner' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Validação de CNPJ
              </CardTitle>
              <CardDescription>
                Valide seu CNPJ e verifique se possui CNAE compatível
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cnpj">CNPJ *</Label>
                <div className="flex gap-2">
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => {
                      setFormData({ ...formData, cnpj: e.target.value });
                      setCnpjValid(null);
                    }}
                    placeholder="00.000.000/0000-00"
                    disabled={cnpjValid === true}
                  />
                  <Button
                    onClick={handleValidateCNPJ}
                    disabled={validatingCNPJ || cnpjValid === true}
                  >
                    {validatingCNPJ ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : cnpjValid === true ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      "Validar"
                    )}
                  </Button>
                </div>
              </div>

              {cnpjValid === true && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>CNPJ válido!</strong>
                    <div className="mt-2 space-y-1 text-sm">
                      <p><strong>Razão Social:</strong> {formData.company_name}</p>
                      {formData.company_trade_name && (
                        <p><strong>Nome Fantasia:</strong> {formData.company_trade_name}</p>
                      )}
                      <p><strong>CNAEs encontrados:</strong> {formData.cnae_codes.length} compatíveis</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {cnpjValid === false && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    CNPJ inválido ou sem CNAE compatível. Verifique o número e tente novamente.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button
                  onClick={() => setStep(5)}
                  disabled={!canProceedStep4Partner()}
                  className="flex-1"
                >
                  Próximo: Dados de Pagamento <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Etapa 5 Parceiro: PIX e Contrato */}
        {step === 5 && formData.salesperson_type === 'partner' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Dados de Pagamento
              </CardTitle>
              <CardDescription>
                Informe sua chave PIX para receber os pagamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="pix_key_type">Tipo de Chave PIX</Label>
                <select
                  id="pix_key_type"
                  value={formData.pix_key_type}
                  onChange={(e) => setFormData({ ...formData, pix_key_type: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">Email</option>
                  <option value="phone">Telefone</option>
                  <option value="random">Chave Aleatória</option>
                </select>
              </div>

              <div>
                <Label htmlFor="pix_key">Chave PIX *</Label>
                <Input
                  id="pix_key"
                  value={formData.pix_key}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (['phone', 'cpf', 'cnpj'].includes(formData.pix_key_type)) {
                      setFormData({ ...formData, pix_key: formatPixKey(value, formData.pix_key_type as PixKeyType) });
                    } else {
                      setFormData({ ...formData, pix_key: value });
                    }
                  }}
                  placeholder={
                    formData.pix_key_type === 'cpf' ? '000.000.000-00' :
                    formData.pix_key_type === 'cnpj' ? '00.000.000/0000-00' :
                    formData.pix_key_type === 'email' ? 'seuemail@exemplo.com' :
                    formData.pix_key_type === 'phone' ? '(11) 99999-9999' :
                    'Chave aleatória UUID'
                  }
                />
                {formData.pix_key && isValidPixKey() && (
                  <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Chave PIX válida
                  </p>
                )}
              </div>

              {/* Contrato PJ */}
              <div className="border rounded-lg">
                <div className="p-4 border-b bg-muted/50">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Contrato de Prestação de Serviços
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Leia atentamente o contrato antes de aceitar
                  </p>
                </div>
                
                {loadingContract ? (
                  <div className="p-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground mt-2">Carregando contrato...</p>
                  </div>
                ) : contractTemplate ? (
                  <ScrollArea className="h-[400px]">
                    <div className="p-4">
                      <ContractViewer
                        contractText={getFormattedContractText()}
                        companyName={contractTemplate.company_name || ''}
                        companyCnpj={contractTemplate.company_cnpj || ''}
                        companyCity={contractTemplate.company_city || ''}
                        companyState={contractTemplate.company_state || ''}
                        version={contractTemplate.version || '1.0'}
                        salespersonName={formData.full_name || undefined}
                        salespersonCnpj={formData.cnpj || undefined}
                      />
                    </div>
                  </ScrollArea>
                ) : (
                  <Alert variant="destructive" className="m-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Não foi possível carregar o contrato. Tente novamente mais tarde.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptedTerms}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, acceptedTerms: checked as boolean })
                    }
                    disabled={!contractTemplate}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="terms" className="cursor-pointer">
                      Li e aceito os termos do contrato *
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Declaro que li e concordo com todos os termos do contrato acima.
                      Confirmo que possuo CNPJ ativo com CNAE compatível e que esta relação é
                      estritamente comercial (B2B), sem vínculo empregatício.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(4)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !formData.acceptedTerms || !formData.pix_key || !isValidPixKey()}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Finalizar Cadastro"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
