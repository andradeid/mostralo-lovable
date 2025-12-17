import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Eye, 
  EyeOff, 
  Upload, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  RefreshCw,
  Key,
  FileText,
  Zap,
  AlertTriangle,
  Clock,
  FlaskConical,
  Factory
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EfiSetupGuide } from "@/components/admin/gateway/EfiSetupGuide";

interface EfiConfig {
  efi_client_id: string | null;
  efi_client_secret: string | null;
  efi_certificate_pem: string | null;
  efi_certificate_pem_production: string | null;
  efi_pix_key: string | null;
  efi_environment: string | null;
  efi_is_configured: boolean | null;
  efi_last_test_at: string | null;
  efi_last_test_status: string | null;
}

export default function GatewayConfigPage() {
  const { toast } = useToast();
  const sandboxFileInputRef = useRef<HTMLInputElement>(null);
  const productionFileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);
  
  // Form state
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [certificatePemSandbox, setCertificatePemSandbox] = useState("");
  const [certificatePemProduction, setCertificatePemProduction] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [environment, setEnvironment] = useState<"sandbox" | "production">("sandbox");
  const [isConfigured, setIsConfigured] = useState(false);
  const [lastTestAt, setLastTestAt] = useState<string | null>(null);
  const [lastTestStatus, setLastTestStatus] = useState<string | null>(null);
  
  // Visibility toggles
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showCertificateSandbox, setShowCertificateSandbox] = useState(false);
  const [showCertificateProduction, setShowCertificateProduction] = useState(false);
  
  // Certificate file info
  const [sandboxFileName, setSandboxFileName] = useState<string | null>(null);
  const [productionFileName, setProductionFileName] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("subscription_payment_config")
        .select("*")
        .eq("is_active", true)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setConfigId(data.id);
        setClientId(data.efi_client_id || "");
        setClientSecret(data.efi_client_secret || "");
        setCertificatePemSandbox(data.efi_certificate_pem || "");
        setCertificatePemProduction((data as any).efi_certificate_pem_production || "");
        setPixKey(data.efi_pix_key || "");
        setEnvironment((data.efi_environment as "sandbox" | "production") || "sandbox");
        setIsConfigured(data.efi_is_configured || false);
        setLastTestAt(data.efi_last_test_at);
        setLastTestStatus(data.efi_last_test_status);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações do gateway.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>, 
    type: "sandbox" | "production"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (type === "sandbox") {
        setCertificatePemSandbox(content);
        setSandboxFileName(file.name);
      } else {
        setCertificatePemProduction(content);
        setProductionFileName(file.name);
      }
      toast({
        title: "Certificado carregado",
        description: `Arquivo ${file.name} carregado para ${type === "sandbox" ? "Sandbox" : "Produção"}.`,
      });
    };
    reader.onerror = () => {
      toast({
        title: "Erro",
        description: "Não foi possível ler o arquivo.",
        variant: "destructive",
      });
    };
    reader.readAsText(file);
  };

  const validateCertificate = (pem: string): boolean => {
    return pem.includes("-----BEGIN") && pem.includes("-----END");
  };

  const validatePixKey = (key: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(key);
  };

  // Retorna o certificado ativo baseado no ambiente selecionado
  const getActiveCertificate = () => {
    return environment === "production" ? certificatePemProduction : certificatePemSandbox;
  };

  const handleSave = async () => {
    // Validações
    if (!clientId.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Preencha o Client ID.",
        variant: "destructive",
      });
      return;
    }

    if (!clientSecret.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Preencha o Client Secret.",
        variant: "destructive",
      });
      return;
    }

    // Validar que pelo menos um certificado está preenchido
    if (!certificatePemSandbox.trim() && !certificatePemProduction.trim()) {
      toast({
        title: "Certificado obrigatório",
        description: "Envie pelo menos um certificado (Sandbox ou Produção).",
        variant: "destructive",
      });
      return;
    }

    // Validar certificado do ambiente selecionado
    const activeCert = getActiveCertificate();
    if (!activeCert.trim()) {
      toast({
        title: "Certificado não configurado",
        description: `Configure o certificado de ${environment === "production" ? "Produção" : "Sandbox"} para usar este ambiente.`,
        variant: "destructive",
      });
      return;
    }

    if (!validateCertificate(activeCert)) {
      toast({
        title: "Certificado inválido",
        description: `O certificado de ${environment === "production" ? "Produção" : "Sandbox"} não está no formato PEM válido.`,
        variant: "destructive",
      });
      return;
    }

    if (!pixKey.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Preencha a Chave PIX.",
        variant: "destructive",
      });
      return;
    }

    if (!validatePixKey(pixKey)) {
      toast({
        title: "Chave PIX inválida",
        description: "A chave PIX deve estar no formato UUID (EVP).",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        efi_client_id: clientId,
        efi_client_secret: clientSecret,
        efi_certificate_pem: certificatePemSandbox || null,
        efi_certificate_pem_production: certificatePemProduction || null,
        efi_pix_key: pixKey,
        efi_environment: environment,
        efi_is_configured: true,
      };

      if (configId) {
        const { error } = await supabase
          .from("subscription_payment_config")
          .update(updateData)
          .eq("id", configId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("subscription_payment_config")
          .insert({
            ...updateData,
            pix_key: pixKey,
            pix_key_type: "evp",
            account_holder_name: "Mostralo",
          });

        if (error) throw error;
      }

      setIsConfigured(true);
      toast({
        title: "Configurações salvas",
        description: "As credenciais do gateway EFI foram salvas com sucesso.",
      });
      
      fetchConfig();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    const activeCert = getActiveCertificate();
    
    if (!clientId || !clientSecret || !activeCert) {
      toast({
        title: "Configure primeiro",
        description: `Preencha todas as credenciais e o certificado de ${environment === "production" ? "Produção" : "Sandbox"}.`,
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('efi-test-connection', {
        body: {
          client_id: clientId,
          client_secret: clientSecret,
          certificate_pem: activeCert,
          pix_key: pixKey,
          environment: environment,
        },
      });

      if (error) throw error;

      if (data.success) {
        setLastTestAt(new Date().toISOString());
        setLastTestStatus("success");
        setIsConfigured(true);

        toast({
          title: "Conexão bem-sucedida!",
          description: `Autenticação OK no ambiente de ${environment === 'production' ? 'produção' : 'sandbox'}.`,
        });
      } else {
        throw new Error(data.error || "Falha na conexão");
      }
    } catch (error) {
      console.error("Erro ao testar:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      
      setLastTestAt(new Date().toISOString());
      setLastTestStatus(errorMessage);

      toast({
        title: "Falha na conexão",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
      fetchConfig();
    }
  };

  const maskValue = (value: string, showLast = 4): string => {
    if (value.length <= showLast) return value;
    return "•".repeat(value.length - showLast) + value.slice(-showLast);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          Gateway de Pagamento EFI
        </h1>
        <p className="text-muted-foreground">
          Configure as credenciais para receber pagamentos PIX automaticamente
        </p>
      </div>

      {/* Guia de Configuração */}
      <EfiSetupGuide />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card de Credenciais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Credenciais de API
            </CardTitle>
            <CardDescription>
              Client ID e Secret da aplicação EFI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                placeholder="Client_Id_xxxxxxxx..."
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientSecret">Client Secret</Label>
              <div className="relative">
                <Input
                  id="clientSecret"
                  type={showClientSecret ? "text" : "password"}
                  placeholder="Client_Secret_xxxxxxxx..."
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowClientSecret(!showClientSecret)}
                >
                  {showClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {isConfigured && clientId && clientSecret && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Configurado
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Card de Ambiente */}
        <Card>
          <CardHeader>
            <CardTitle>Ambiente</CardTitle>
            <CardDescription>
              Selecione o ambiente de operação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-1">
                <p className="font-medium">
                  {environment === "production" ? "Produção" : "Sandbox"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {environment === "production" 
                    ? "Cobranças reais serão geradas" 
                    : "Ambiente de testes sem cobranças reais"}
                </p>
              </div>
              <Switch
                checked={environment === "production"}
                onCheckedChange={(checked) => 
                  setEnvironment(checked ? "production" : "sandbox")
                }
              />
            </div>

            {environment === "production" && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Atenção!</p>
                  <p className="text-sm text-destructive/80">
                    No ambiente de produção, cobranças reais serão geradas.
                  </p>
                </div>
              </div>
            )}

            {/* Indicador de certificado ativo */}
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Certificado ativo:</span>{" "}
                {environment === "production" ? (
                  certificatePemProduction ? (
                    <span className="text-green-600">Produção ✓</span>
                  ) : (
                    <span className="text-destructive">Não configurado</span>
                  )
                ) : (
                  certificatePemSandbox ? (
                    <span className="text-green-600">Sandbox ✓</span>
                  ) : (
                    <span className="text-destructive">Não configurado</span>
                  )
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card de Certificado Sandbox */}
        <Card className={environment === "sandbox" ? "ring-2 ring-primary" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-yellow-500" />
              Certificado Sandbox
              {environment === "sandbox" && (
                <Badge variant="default" className="ml-auto">ATIVO</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Certificado para ambiente de homologação/testes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => sandboxFileInputRef.current?.click()}
            >
              <input
                ref={sandboxFileInputRef}
                type="file"
                accept=".pem,.p12"
                onChange={(e) => handleFileUpload(e, "sandbox")}
                className="hidden"
              />
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Enviar certificado Sandbox</p>
              <p className="text-xs text-muted-foreground">.pem ou .p12</p>
            </div>

            {sandboxFileName && (
              <Badge variant="secondary" className="text-sm">
                <FileText className="h-3 w-3 mr-1" />
                {sandboxFileName}
              </Badge>
            )}

            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="certificateSandbox" className="text-sm">Ou cole o conteúdo</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCertificateSandbox(!showCertificateSandbox)}
                >
                  {showCertificateSandbox ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Textarea
                id="certificateSandbox"
                placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                value={showCertificateSandbox ? certificatePemSandbox : (certificatePemSandbox ? maskValue(certificatePemSandbox, 20) : "")}
                onChange={(e) => {
                  if (showCertificateSandbox) {
                    setCertificatePemSandbox(e.target.value);
                  }
                }}
                readOnly={!showCertificateSandbox}
                rows={4}
                className="font-mono text-xs"
              />
            </div>

            {certificatePemSandbox && validateCertificate(certificatePemSandbox) && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Certificado válido
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Card de Certificado Produção */}
        <Card className={environment === "production" ? "ring-2 ring-primary" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-blue-500" />
              Certificado Produção
              {environment === "production" && (
                <Badge variant="default" className="ml-auto">ATIVO</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Certificado para cobranças reais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => productionFileInputRef.current?.click()}
            >
              <input
                ref={productionFileInputRef}
                type="file"
                accept=".pem,.p12"
                onChange={(e) => handleFileUpload(e, "production")}
                className="hidden"
              />
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Enviar certificado Produção</p>
              <p className="text-xs text-muted-foreground">.pem ou .p12</p>
            </div>

            {productionFileName && (
              <Badge variant="secondary" className="text-sm">
                <FileText className="h-3 w-3 mr-1" />
                {productionFileName}
              </Badge>
            )}

            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="certificateProduction" className="text-sm">Ou cole o conteúdo</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCertificateProduction(!showCertificateProduction)}
                >
                  {showCertificateProduction ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Textarea
                id="certificateProduction"
                placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                value={showCertificateProduction ? certificatePemProduction : (certificatePemProduction ? maskValue(certificatePemProduction, 20) : "")}
                onChange={(e) => {
                  if (showCertificateProduction) {
                    setCertificatePemProduction(e.target.value);
                  }
                }}
                readOnly={!showCertificateProduction}
                rows={4}
                className="font-mono text-xs"
              />
            </div>

            {certificatePemProduction && validateCertificate(certificatePemProduction) && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Certificado válido
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Card de Chave PIX */}
        <Card>
          <CardHeader>
            <CardTitle>Chave PIX</CardTitle>
            <CardDescription>
              Chave aleatória (EVP) da sua conta EFI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pixKey">Chave PIX EVP</Label>
              <Input
                id="pixKey"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Formato UUID obtido no painel EFI
              </p>
            </div>

            {pixKey && validatePixKey(pixKey) && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Chave válida
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Card de Status da Conexão */}
        <Card>
          <CardHeader>
            <CardTitle>Status da Conexão</CardTitle>
            <CardDescription>
              Verifique se as credenciais estão funcionando
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                {lastTestStatus === "success" ? (
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                ) : lastTestStatus ? (
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {lastTestStatus === "success" 
                      ? "Conectado" 
                      : lastTestStatus 
                        ? "Erro na conexão" 
                        : "Não testado"}
                  </p>
                  {lastTestAt && (
                    <p className="text-sm text-muted-foreground">
                      Último teste: {format(new Date(lastTestAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {lastTestStatus && lastTestStatus !== "success" && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{lastTestStatus}</p>
              </div>
            )}

            <Button
              onClick={handleTestConnection}
              disabled={testing || !clientId || !clientSecret || !getActiveCertificate()}
              variant="outline"
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Testar Conexão ({environment === "production" ? "Produção" : "Sandbox"})
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Configurações"
          )}
        </Button>
      </div>
    </div>
  );
}
