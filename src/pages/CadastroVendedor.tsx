import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  User,
  Building2,
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

type Step = 1 | 2 | 3;

interface FormData {
  // Etapa 1: Dados Pessoais
  full_name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;

  // Etapa 2: CNPJ
  cnpj: string;
  company_name: string;
  company_trade_name: string;
  cnae_codes: string[];
  cnpj_validation_data: any;

  // Etapa 3: PIX e Termos
  pix_key: string;
  pix_key_type: string;
  acceptedTerms: boolean;
}

export default function CadastroVendedor() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [validatingCNPJ, setValidatingCNPJ] = useState(false);
  const [cnpjValid, setCnpjValid] = useState<boolean | null>(null);

  const [formData, setFormData] = useState<FormData>({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    cnpj: "",
    company_name: "",
    company_trade_name: "",
    cnae_codes: [],
    cnpj_validation_data: null,
    pix_key: "",
    pix_key_type: "cpf",
    acceptedTerms: false,
  });

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
    // Validações finais
    if (!formData.acceptedTerms) {
      toast.error("Você deve aceitar os termos de uso");
      return;
    }

    if (!formData.pix_key) {
      toast.error("Chave PIX é obrigatória");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("salesperson-self-register", {
        body: {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          cnpj: formData.cnpj,
          company_name: formData.company_name,
          company_trade_name: formData.company_trade_name,
          cnae_codes: formData.cnae_codes,
          cnpj_validation_data: formData.cnpj_validation_data,
          pix_key: formData.pix_key,
          pix_key_type: formData.pix_key_type,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(data.message);
        // Redirecionar para página de sucesso
        navigate("/cadastro-vendedor/sucesso");
      } else {
        toast.error(data.error || "Erro ao realizar cadastro");
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
      formData.phone &&
      formData.password &&
      formData.password === formData.confirmPassword &&
      formData.password.length >= 6
    );
  };

  const canProceedStep2 = () => {
    return cnpjValid === true && formData.company_name;
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
            Complete as etapas abaixo para se tornar um vendedor Mostralo
          </p>
        </div>

        {/* Progress */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                1
              </div>
              <span className="text-sm font-medium hidden sm:inline">Dados Pessoais</span>
            </div>
            <div className="w-12 h-0.5 bg-muted" />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                2
              </div>
              <span className="text-sm font-medium hidden sm:inline">CNPJ</span>
            </div>
            <div className="w-12 h-0.5 bg-muted" />
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                3
              </div>
              <span className="text-sm font-medium hidden sm:inline">PIX & Termos</span>
            </div>
          </div>
        </div>

        {/* Etapa 1: Dados Pessoais */}
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
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
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

              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1()}
                className="w-full"
              >
                Próximo: Validar CNPJ <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Etapa 2: CNPJ */}
        {step === 2 && (
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
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!canProceedStep2()}
                  className="flex-1"
                >
                  Próximo: Dados de Pagamento <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Etapa 3: PIX e Termos */}
        {step === 3 && (
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
                  onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                  placeholder="Digite sua chave PIX"
                />
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  Esta chave PIX será usada para enviar seus pagamentos mensais.
                  Certifique-se de que está correta.
                </AlertDescription>
              </Alert>

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
                      Aceito os termos de uso *
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Declaro que li e concordo com os termos do contrato de prestação de serviços.
                      Confirmo que possuo CNPJ ativo com CNAE compatível e que esta relação é
                      estritamente comercial (B2B), sem vínculo empregatício.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !formData.acceptedTerms || !formData.pix_key}
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
