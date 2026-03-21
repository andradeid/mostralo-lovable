import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Banknote, Smartphone, Globe, DollarSign, CheckCircle2, AlertTriangle, ExternalLink, Construction, Loader2, Shield, Eye, EyeOff, Trash2, TestTube2, Copy, Check, CircleDot } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentStepProps {
  formData: any;
  updateFormData: (data: any) => void;
  efiAccountStatus?: string;
  efiAccountNumber?: string;
}

export function PaymentStep({ formData, updateFormData, efiAccountStatus, efiAccountNumber }: PaymentStepProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estado do gateway Mercado Pago
  const [mpLoading, setMpLoading] = useState(false);
  const [mpSaving, setMpSaving] = useState(false);
  const [mpDeleting, setMpDeleting] = useState(false);
  const [mpGateway, setMpGateway] = useState<any>(null);
  const [mpAccessToken, setMpAccessToken] = useState("");
  const [mpPublicKey, setMpPublicKey] = useState("");
  const [mpEnvironment, setMpEnvironment] = useState<"sandbox" | "production">("sandbox");
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [showPublicKey, setShowPublicKey] = useState(false);
  
  // Estado do teste de pagamento
  const [mpTesting, setMpTesting] = useState(false);
  const [mpTestResult, setMpTestResult] = useState<{
    success: boolean;
    checkout_url?: string;
    qr_code?: string;
    error?: string;
  } | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  // Carregar config do gateway ao montar
  useEffect(() => {
    if (formData.store_id) {
      fetchGatewayConfig();
    }
  }, [formData.store_id]);

  const fetchGatewayConfig = async () => {
    if (!formData.store_id) return;
    setMpLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMpLoading(false);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(
        `${supabaseUrl}/functions/v1/manage-payment-gateway?store_id=${formData.store_id}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: supabaseKey,
          },
        }
      );

      if (res.ok) {
        const result = await res.json();
        if (result.data) {
          setMpGateway(result.data);
          setMpEnvironment(result.data.environment || "sandbox");
        }
      }
    } catch (error) {
      console.error("Erro ao buscar gateway:", error);
    } finally {
      setMpLoading(false);
    }
  };

  const handleSaveGateway = async () => {
    const trimmedAccessToken = mpAccessToken.trim();
    const trimmedPublicKey = mpPublicKey.trim();

    if (!trimmedAccessToken || !trimmedPublicKey) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o Access Token e a Public Key",
        variant: "destructive",
      });
      return;
    }

    if (!formData.store_id) {
      toast({
        title: "Loja não identificada",
        description: "Não foi possível identificar a loja para salvar as credenciais.",
        variant: "destructive",
      });
      return;
    }

    setMpSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Sessão expirada",
          description: "Faça login novamente para salvar as credenciais.",
          variant: "destructive",
        });
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/manage-payment-gateway`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: supabaseKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          store_id: formData.store_id,
          access_token: trimmedAccessToken,
          public_key: trimmedPublicKey,
          environment: mpEnvironment,
        }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast({
          title: "Erro ao salvar credenciais",
          description: result.error || result.details || "Não foi possível salvar as credenciais agora.",
          variant: "destructive",
        });
        return;
      }

      if (result.validated) {
        toast({
          title: "✅ Credenciais válidas!",
          description: "Mercado Pago configurado com sucesso.",
        });
        setMpAccessToken("");
        setMpPublicKey("");
        setMpTestResult(null);
      } else {
        toast({
          title: "❌ Credenciais inválidas",
          description: result.validation_error || result.error || "Verifique seus dados e tente novamente.",
          variant: "destructive",
        });
      }

      await fetchGatewayConfig();
    } catch (error) {
      console.error("Erro ao salvar gateway:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as credenciais",
        variant: "destructive",
      });
    } finally {
      setMpSaving(false);
    }
  };

  const handleDeleteGateway = async () => {
    if (!confirm("Tem certeza que deseja remover as credenciais do Mercado Pago?")) return;
    
    setMpDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(
        `${supabaseUrl}/functions/v1/manage-payment-gateway`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: supabaseKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ store_id: formData.store_id }),
        }
      );

      if (res.ok) {
        toast({ title: "Credenciais removidas", description: "Gateway Mercado Pago desconfigurado." });
        setMpGateway(null);
        setMpAccessToken("");
        setMpPublicKey("");
      }
    } catch (error) {
      console.error("Erro ao deletar gateway:", error);
      toast({ title: "Erro", description: "Não foi possível remover", variant: "destructive" });
    } finally {
      setMpDeleting(false);
    }
  };
  // Função de teste de pagamento real
  const handleTestPayment = async () => {
    setMpTesting(true);
    setMpTestResult(null);
    setCopiedPix(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(
        `${supabaseUrl}/functions/v1/create-mercadopago-payment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            apikey: supabaseKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            store_id: formData.store_id,
            module: "order",
            reference_id: `test_${Date.now()}`,
            amount: 0.01,
            description: "🧪 Teste de integração - R$0,01",
            payment_methods: ["pix"],
            payer: { email: session.user.email || "teste@loja.com" },
          }),
        }
      );

      const data = await res.json();

      if (res.ok && (data.checkout_url || data.qr_code)) {
        setMpTestResult({
          success: true,
          checkout_url: data.checkout_url,
          qr_code: data.qr_code,
        });
        toast({
          title: "✅ Teste criado com sucesso!",
          description: "O pagamento de teste (R$0,01) foi gerado.",
        });
      } else {
        setMpTestResult({
          success: false,
          error: data.error || "Erro desconhecido ao criar pagamento de teste",
        });
        toast({
          title: "Erro no teste",
          description: data.error || "Não foi possível criar o pagamento de teste",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro no teste:", error);
      setMpTestResult({
        success: false,
        error: "Erro de conexão ao criar pagamento de teste",
      });
    } finally {
      setMpTesting(false);
    }
  };

  const handleCopyPix = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedPix(true);
    toast({ title: "Código PIX copiado!" });
    setTimeout(() => setCopiedPix(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Valor Mínimo do Pedido */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-4 h-4 mr-2" />
            Qual valor de pedido mínimo?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
              Se não tiver um valor mínimo para pedidos, deixe "0", estabelecimento que trabalhem com agendamentos ou Orçamentos, Deixar 0,00.
            </p>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.min_order_value ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                updateFormData({ min_order_value: value === '' ? 0 : parseFloat(value) });
              }}
              placeholder="0,00"
            />
          </div>
        </CardContent>
      </Card>

      {/* Métodos de Pagamento Básicos */}
      <div className="space-y-4">
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Label className="text-base">O estabelecimento aceita dinheiro?</Label>
                </div>
                <RadioGroup 
                  value={formData.accepts_cash ? 'sim' : 'nao'} 
                  onValueChange={(value) => updateFormData({ accepts_cash: value === 'sim' })}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="cash-sim" />
                    <Label htmlFor="cash-sim">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="cash-nao" />
                    <Label htmlFor="cash-nao">Não</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Label className="text-base">O estabelecimento aceita cartão de débito?</Label>
                </div>
                <RadioGroup 
                  value={formData.accepts_debit_card ? 'sim' : 'nao'} 
                  onValueChange={(value) => updateFormData({ accepts_debit_card: value === 'sim' })}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="debit-sim" />
                    <Label htmlFor="debit-sim">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="debit-nao" />
                    <Label htmlFor="debit-nao">Não</Label>
                  </div>
                </RadioGroup>
                
                {formData.accepts_debit_card && (
                  <div className="space-y-2 border-l-4 border-primary pl-4">
                    <Label>Quais bandeiras de cartão de débito aceitas?:</Label>
                    <Input
                      value={formData.debit_card_brands || ''}
                      onChange={(e) => updateFormData({ debit_card_brands: e.target.value })}
                      placeholder="Mastercard, Visa, Elo, Hipercard"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Label className="text-base">O estabelecimento aceita cartão de crédito?</Label>
                </div>
                <RadioGroup 
                  value={formData.accepts_card ? 'sim' : 'nao'} 
                  onValueChange={(value) => updateFormData({ accepts_card: value === 'sim' })}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="credit-sim" />
                    <Label htmlFor="credit-sim">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="credit-nao" />
                    <Label htmlFor="credit-nao">Não</Label>
                  </div>
                </RadioGroup>
                
                {formData.accepts_card && (
                  <div className="space-y-2 border-l-4 border-primary pl-4">
                    <Label>Quais bandeiras de cartão de crédito aceitas?:</Label>
                    <Input
                      value={formData.credit_card_brands || ''}
                      onChange={(e) => updateFormData({ credit_card_brands: e.target.value })}
                      placeholder="Visa, Mastercard e Elo"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Label className="text-base">O estabelecimento aceita PIX?</Label>
                </div>
                <p className="text-sm text-muted-foreground border-l-4 border-muted pl-3">
                  Este formato se trata de PIX manual, a comprovação do pagamento é feita pelo estabelecimento.
                </p>
                <RadioGroup 
                  value={formData.accepts_pix ? 'sim' : 'nao'} 
                  onValueChange={(value) => updateFormData({ accepts_pix: value === 'sim' })}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="sim" id="pix-sim" />
                    <Label htmlFor="pix-sim">Sim</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="nao" id="pix-nao" />
                    <Label htmlFor="pix-nao">Não</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* PIX Online (EFI) */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-5 h-5 text-primary" />
                    <Label className="text-base font-semibold">PIX Online (QR Code automático)</Label>
                  </div>
                  {efiAccountStatus === 'active' ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Conta EFI Ativa
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Conta não configurada
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground border-l-4 border-primary pl-3">
                  O cliente gera QR Code PIX e paga instantaneamente. O pagamento é confirmado automaticamente e você recebe na sua conta EFI.
                  {efiAccountNumber && (
                    <span className="block mt-1 font-medium text-foreground">
                      Conta EFI: {efiAccountNumber}
                    </span>
                  )}
                </p>

                {efiAccountStatus === 'active' ? (
                  <RadioGroup 
                    value={formData.efi_pix_enabled ? 'sim' : 'nao'} 
                    onValueChange={(value) => updateFormData({ efi_pix_enabled: value === 'sim' })}
                    className="flex space-x-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sim" id="efi-pix-sim" />
                      <Label htmlFor="efi-pix-sim">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nao" id="efi-pix-nao" />
                      <Label htmlFor="efi-pix-nao">Não</Label>
                    </div>
                  </RadioGroup>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Configure sua conta EFI para aceitar PIX Online
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                        Vá em Conta → Pagamento Online para vincular sua conta
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate('/dashboard/online-payment')}
                      className="border-amber-300 text-amber-700 hover:bg-amber-100"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Configurar
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* ========== MERCADO PAGO GATEWAY ========== */}
      <Card className="border-2 border-blue-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Mercado Pago</CardTitle>
                <CardDescription>
                  Receba pagamentos online via PIX, cartão de crédito e boleto
                </CardDescription>
              </div>
            </div>
            {mpLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : mpGateway?.is_validated ? (
              <Badge className="bg-green-500 text-white">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Ativo
              </Badge>
            ) : mpGateway ? (
              <Badge variant="destructive">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Inválido
              </Badge>
            ) : (
              <Badge variant="secondary">Não configurado</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Info de segurança */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Suas credenciais são armazenadas de forma segura no servidor e <strong>nunca são expostas no frontend</strong>. 
              Apenas os metadados (status, ambiente) são visíveis.
            </p>
          </div>

          {/* Se já configurado, mostrar status */}
          {mpGateway && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ambiente:</span>
                <Badge variant={mpGateway.environment === "production" ? "default" : "secondary"}>
                  {mpGateway.environment === "production" ? "🟢 Produção" : "🔵 Sandbox (Teste)"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Access Token:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">{mpGateway.access_token || "****"}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Public Key:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">{mpGateway.public_key || "****"}</code>
              </div>
              {mpGateway.validated_at && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Validado em:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(mpGateway.validated_at).toLocaleString("pt-BR")}
                  </span>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteGateway}
                  disabled={mpDeleting}
                >
                  {mpDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}
                  Remover
                </Button>
              </div>

              {/* Botão de Teste */}
              {mpGateway.is_validated && (
                <div className="border-t pt-3 space-y-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestPayment}
                    disabled={mpTesting}
                    className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
                  >
                    {mpTesting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Criando pagamento de teste...
                      </>
                    ) : (
                      <>
                        <TestTube2 className="w-4 h-4 mr-2" />
                        🧪 Testar Pagamento (R$ 0,01)
                      </>
                    )}
                  </Button>

                  {/* Resultado do teste */}
                  {mpTestResult && (
                    <div className={`p-4 rounded-lg border space-y-3 ${
                      mpTestResult.success 
                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" 
                        : "bg-destructive/10 border-destructive/30"
                    }`}>
                      {mpTestResult.success ? (
                        <>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">Pagamento de teste criado!</span>
                          </div>

                          {/* QR Code PIX */}
                          {mpTestResult.qr_code && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Código PIX Copia e Cola:</p>
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-background p-2 rounded border flex-1 break-all max-h-20 overflow-y-auto">
                                  {mpTestResult.qr_code}
                                </code>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCopyPix(mpTestResult.qr_code!)}
                                  className="shrink-0"
                                >
                                  {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Link checkout */}
                          {mpTestResult.checkout_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(mpTestResult.checkout_url, "_blank")}
                              className="w-full"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Abrir Checkout de Teste
                            </Button>
                          )}

                          {/* Passo a passo */}
                          <div className="border-t border-emerald-200 dark:border-emerald-800 pt-3 space-y-2">
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">📋 Passo a passo para validar:</p>
                            <div className="space-y-1.5">
                              {[
                                "Copie o código PIX acima ou clique em \"Abrir Checkout\"",
                                mpGateway.environment === "sandbox" 
                                  ? "No sandbox, use o cartão de teste: 5031 4332 1540 6351 (qualquer CVV e data futura)"
                                  : "Cole o código PIX no app do seu banco e pague R$0,01",
                                "Aguarde alguns segundos — o status muda automaticamente",
                                "Verifique no painel do Mercado Pago se o pagamento aparece",
                                "Se tudo funcionar, sua integração está pronta! 🎉",
                              ].map((step, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                                  <CircleDot className="w-3 h-3 mt-0.5 shrink-0" />
                                  <span>{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                            <span className="font-semibold text-destructive">Erro no teste</span>
                          </div>
                          <p className="text-xs text-destructive/80">{mpTestResult.error}</p>
                          <p className="text-xs text-muted-foreground">
                            Verifique se as credenciais estão corretas e se o ambiente (Sandbox/Produção) corresponde às chaves inseridas.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Formulário para inserir/atualizar credenciais */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-semibold">
              {mpGateway ? "Atualizar credenciais" : "Configurar credenciais"}
            </h4>

            <div className="space-y-2">
              <Label>Ambiente</Label>
              <Select value={mpEnvironment} onValueChange={(v: "sandbox" | "production") => setMpEnvironment(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">🔵 Sandbox (Teste)</SelectItem>
                  <SelectItem value="production">🟢 Produção</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Use Sandbox para testes e Produção para pagamentos reais.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Public Key</Label>
              <div className="relative">
                <Input
                  type={showPublicKey ? "text" : "password"}
                  value={mpPublicKey}
                  onChange={(e) => setMpPublicKey(e.target.value)}
                  placeholder="APP_USR-XXXXXXXX..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPublicKey(!showPublicKey)}
                >
                  {showPublicKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Encontre em: <a href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Painel do Mercado Pago → Suas integrações → Credenciais</a>
              </p>
            </div>

            <div className="space-y-2">
              <Label>Access Token</Label>
              <div className="relative">
                <Input
                  type={showAccessToken ? "text" : "password"}
                  value={mpAccessToken}
                  onChange={(e) => setMpAccessToken(e.target.value)}
                  placeholder="APP_USR-XXXXXXXX..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowAccessToken(!showAccessToken)}
                >
                  {showAccessToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Button
              onClick={handleSaveGateway}
              disabled={mpSaving || !mpAccessToken || !mpPublicKey}
              className="w-full"
            >
              {mpSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Validando e salvando...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Validar e Salvar Credenciais
                </>
              )}
            </Button>
          </div>

          {/* Info sobre onde usar */}
          <div className="p-3 rounded-lg bg-muted/30 border border-muted">
            <p className="text-xs text-muted-foreground">
              <strong>Onde será usado:</strong> Checkout de pedidos online, pagamento antecipado de agendamentos 
              e pagamento PIX no totem de autoatendimento.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}