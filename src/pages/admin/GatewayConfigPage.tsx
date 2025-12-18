import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { PixChargeTestCard } from "@/components/admin/gateway/PixChargeTestCard";
import { WebhookConfigCard } from "@/components/admin/gateway/WebhookConfigCard";
import { AccountWebhookConfigCard } from "@/components/admin/gateway/AccountWebhookConfigCard";

interface EfiConfig {
  efi_client_id: string | null;
  efi_client_secret: string | null;
  efi_client_id_production: string | null;
  efi_client_secret_production: string | null;
  efi_certificate_pem: string | null;
  efi_certificate_pem_production: string | null;
  efi_pix_key: string | null;
  efi_environment: string | null;
  efi_is_configured: boolean | null;
  efi_last_test_at: string | null;
  efi_last_test_status: string | null;
  efi_webhook_configured: boolean | null;
  efi_webhook_url: string | null;
  efi_webhook_configured_at: string | null;
}

export default function GatewayConfigPage() {
  const { toast } = useToast();
  const sandboxFileInputRef = useRef<HTMLInputElement>(null);
  const productionFileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);
  
  // Form state - Sandbox
  const [clientIdSandbox, setClientIdSandbox] = useState("");
  const [clientSecretSandbox, setClientSecretSandbox] = useState("");
  const [certificatePemSandbox, setCertificatePemSandbox] = useState("");
  
  // Form state - Production
  const [clientIdProduction, setClientIdProduction] = useState("");
  const [clientSecretProduction, setClientSecretProduction] = useState("");
  const [certificatePemProduction, setCertificatePemProduction] = useState("");
  
  // Common
  const [pixKey, setPixKey] = useState("");
  const [environment, setEnvironment] = useState<"sandbox" | "production">("sandbox");
  const [isConfigured, setIsConfigured] = useState(false);
  const [lastTestAt, setLastTestAt] = useState<string | null>(null);
  const [lastTestStatus, setLastTestStatus] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  const [webhookConfiguredAt, setWebhookConfiguredAt] = useState<string | null>(null);
  
  // Visibility toggles
  const [showSecretSandbox, setShowSecretSandbox] = useState(false);
  const [showSecretProduction, setShowSecretProduction] = useState(false);
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
        // Sandbox credentials
        setClientIdSandbox(data.efi_client_id || "");
        setClientSecretSandbox(data.efi_client_secret || "");
        setCertificatePemSandbox(data.efi_certificate_pem || "");
        // Production credentials
        setClientIdProduction((data as any).efi_client_id_production || "");
        setClientSecretProduction((data as any).efi_client_secret_production || "");
        setCertificatePemProduction((data as any).efi_certificate_pem_production || "");
        // Common
        setPixKey(data.efi_pix_key || "");
        setEnvironment((data.efi_environment as "sandbox" | "production") || "sandbox");
        setIsConfigured(data.efi_is_configured || false);
        setLastTestAt(data.efi_last_test_at);
        setLastTestStatus(data.efi_last_test_status);
        setWebhookUrl((data as any).efi_webhook_url || null);
        setWebhookConfiguredAt((data as any).efi_webhook_configured_at || null);
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

  // Retorna credenciais do ambiente selecionado
  const getActiveCredentials = () => {
    if (environment === "production") {
      return {
        clientId: clientIdProduction,
        clientSecret: clientSecretProduction,
        certificate: certificatePemProduction,
      };
    }
    return {
      clientId: clientIdSandbox,
      clientSecret: clientSecretSandbox,
      certificate: certificatePemSandbox,
    };
  };

  // Verifica se ambiente está completo
  const isEnvironmentConfigured = (env: "sandbox" | "production") => {
    if (env === "sandbox") {
      return !!(clientIdSandbox && clientSecretSandbox && certificatePemSandbox && validateCertificate(certificatePemSandbox));
    }
    return !!(clientIdProduction && clientSecretProduction && certificatePemProduction && validateCertificate(certificatePemProduction));
  };

  const handleSave = async () => {
    // Validar que pelo menos um ambiente está configurado
    const sandboxOk = isEnvironmentConfigured("sandbox");
    const productionOk = isEnvironmentConfigured("production");

    if (!sandboxOk && !productionOk) {
      toast({
        title: "Configuração incompleta",
        description: "Configure pelo menos um ambiente completo (Sandbox ou Produção).",
        variant: "destructive",
      });
      return;
    }

    // Validar ambiente ativo
    if (!isEnvironmentConfigured(environment)) {
      toast({
        title: "Ambiente ativo não configurado",
        description: `O ambiente ${environment === "production" ? "Produção" : "Sandbox"} está selecionado mas não está completo.`,
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
        // Sandbox
        efi_client_id: clientIdSandbox || null,
        efi_client_secret: clientSecretSandbox || null,
        efi_certificate_pem: certificatePemSandbox || null,
        // Production
        efi_client_id_production: clientIdProduction || null,
        efi_client_secret_production: clientSecretProduction || null,
        efi_certificate_pem_production: certificatePemProduction || null,
        // Common
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
    const creds = getActiveCredentials();
    
    if (!creds.clientId || !creds.clientSecret || !creds.certificate) {
      toast({
        title: "Configure primeiro",
        description: `Preencha todas as credenciais do ambiente ${environment === "production" ? "Produção" : "Sandbox"}.`,
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('efi-test-connection', {
        body: {
          client_id: creds.clientId,
          client_secret: creds.clientSecret,
          certificate_pem: creds.certificate,
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

      {/* Seletor de Ambiente Visual */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Ambiente Ativo</CardTitle>
          <CardDescription>
            Selecione qual ambiente será usado para processar pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card Sandbox */}
            <button
              onClick={() => setEnvironment("sandbox")}
              className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                environment === "sandbox"
                  ? "border-yellow-500 bg-yellow-500/10"
                  : "border-border hover:border-yellow-500/50"
              }`}
            >
              {environment === "sandbox" && (
                <Badge className="absolute top-2 right-2 bg-yellow-500">ATIVO</Badge>
              )}
              <div className="flex items-center gap-3 mb-2">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  environment === "sandbox" ? "bg-yellow-500/20" : "bg-muted"
                }`}>
                  <FlaskConical className={`h-5 w-5 ${
                    environment === "sandbox" ? "text-yellow-500" : "text-muted-foreground"
                  }`} />
                </div>
                <div>
                  <p className="font-semibold">🧪 SANDBOX</p>
                  <p className="text-xs text-muted-foreground">Homologação</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Ambiente de testes sem cobranças reais
              </p>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                pix-h.api.efipay.com.br
              </code>
              <div className="mt-3">
                {isEnvironmentConfigured("sandbox") ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Configurado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Incompleto
                  </Badge>
                )}
              </div>
            </button>

            {/* Card Produção */}
            <button
              onClick={() => setEnvironment("production")}
              className={`relative p-4 rounded-lg border-2 text-left transition-all ${
                environment === "production"
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-border hover:border-blue-500/50"
              }`}
            >
              {environment === "production" && (
                <Badge className="absolute top-2 right-2 bg-blue-500">ATIVO</Badge>
              )}
              <div className="flex items-center gap-3 mb-2">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                  environment === "production" ? "bg-blue-500/20" : "bg-muted"
                }`}>
                  <Factory className={`h-5 w-5 ${
                    environment === "production" ? "text-blue-500" : "text-muted-foreground"
                  }`} />
                </div>
                <div>
                  <p className="font-semibold">🏭 PRODUÇÃO</p>
                  <p className="text-xs text-muted-foreground">Cobranças Reais</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Ambiente de produção com cobranças reais
              </p>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                pix.api.efipay.com.br
              </code>
              <div className="mt-3">
                {isEnvironmentConfigured("production") ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Configurado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Incompleto
                  </Badge>
                )}
              </div>
            </button>
          </div>

          {environment === "production" && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 mt-4">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">⚠️ PRODUÇÃO ATIVA</p>
                <p className="text-sm text-destructive/80">
                  Cobranças PIX reais serão geradas! Certifique-se de que as credenciais estão corretas.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cards de Configuração lado a lado */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* ==================== SANDBOX CONFIG ==================== */}
        <Card className={environment === "sandbox" ? "ring-2 ring-yellow-500" : ""}>
          <CardHeader className="bg-yellow-500/5 border-b">
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-yellow-500" />
              Configuração Sandbox
              {environment === "sandbox" && (
                <Badge className="ml-auto bg-yellow-500">ATIVO</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Credenciais e certificado para homologação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {/* Client ID Sandbox */}
            <div className="space-y-2">
              <Label htmlFor="clientIdSandbox" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Client ID Sandbox
              </Label>
              <Input
                id="clientIdSandbox"
                placeholder="Client_Id_xxxxxxxx..."
                value={clientIdSandbox}
                onChange={(e) => setClientIdSandbox(e.target.value)}
              />
            </div>

            {/* Client Secret Sandbox */}
            <div className="space-y-2">
              <Label htmlFor="clientSecretSandbox">Client Secret Sandbox</Label>
              <div className="relative">
                <Input
                  id="clientSecretSandbox"
                  type={showSecretSandbox ? "text" : "password"}
                  placeholder="Client_Secret_xxxxxxxx..."
                  value={clientSecretSandbox}
                  onChange={(e) => setClientSecretSandbox(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowSecretSandbox(!showSecretSandbox)}
                >
                  {showSecretSandbox ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Certificado Sandbox */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Certificado Sandbox (.pem)
              </Label>
              <div
                className="border-2 border-dashed rounded-lg p-3 text-center cursor-pointer hover:border-yellow-500/50 transition-colors"
                onClick={() => sandboxFileInputRef.current?.click()}
              >
                <input
                  ref={sandboxFileInputRef}
                  type="file"
                  accept=".pem,.p12"
                  onChange={(e) => handleFileUpload(e, "sandbox")}
                  className="hidden"
                />
                <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs font-medium">Upload .pem</p>
              </div>

              {sandboxFileName && (
                <Badge variant="secondary" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  {sandboxFileName}
                </Badge>
              )}

              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Ou cole o conteúdo:</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => setShowCertificateSandbox(!showCertificateSandbox)}
                  >
                    {showCertificateSandbox ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
                <Textarea
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  value={showCertificateSandbox ? certificatePemSandbox : (certificatePemSandbox ? maskValue(certificatePemSandbox, 20) : "")}
                  onChange={(e) => {
                    if (showCertificateSandbox) {
                      setCertificatePemSandbox(e.target.value);
                    }
                  }}
                  readOnly={!showCertificateSandbox}
                  rows={3}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            {/* Status Sandbox */}
            <div className="pt-2 border-t">
              {isEnvironmentConfigured("sandbox") ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Configuração completa
                </Badge>
              ) : (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Preencha todos os campos
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ==================== PRODUCTION CONFIG ==================== */}
        <Card className={environment === "production" ? "ring-2 ring-blue-500" : ""}>
          <CardHeader className="bg-blue-500/5 border-b">
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-blue-500" />
              Configuração Produção
              {environment === "production" && (
                <Badge className="ml-auto bg-blue-500">ATIVO</Badge>
              )}
            </CardTitle>
            <CardDescription>
              Credenciais e certificado para cobranças reais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {/* Client ID Production */}
            <div className="space-y-2">
              <Label htmlFor="clientIdProduction" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Client ID Produção
              </Label>
              <Input
                id="clientIdProduction"
                placeholder="Client_Id_xxxxxxxx..."
                value={clientIdProduction}
                onChange={(e) => setClientIdProduction(e.target.value)}
              />
            </div>

            {/* Client Secret Production */}
            <div className="space-y-2">
              <Label htmlFor="clientSecretProduction">Client Secret Produção</Label>
              <div className="relative">
                <Input
                  id="clientSecretProduction"
                  type={showSecretProduction ? "text" : "password"}
                  placeholder="Client_Secret_xxxxxxxx..."
                  value={clientSecretProduction}
                  onChange={(e) => setClientSecretProduction(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowSecretProduction(!showSecretProduction)}
                >
                  {showSecretProduction ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Certificado Production */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Certificado Produção (.pem)
              </Label>
              <div
                className="border-2 border-dashed rounded-lg p-3 text-center cursor-pointer hover:border-blue-500/50 transition-colors"
                onClick={() => productionFileInputRef.current?.click()}
              >
                <input
                  ref={productionFileInputRef}
                  type="file"
                  accept=".pem,.p12"
                  onChange={(e) => handleFileUpload(e, "production")}
                  className="hidden"
                />
                <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs font-medium">Upload .pem</p>
              </div>

              {productionFileName && (
                <Badge variant="secondary" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  {productionFileName}
                </Badge>
              )}

              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Ou cole o conteúdo:</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2"
                    onClick={() => setShowCertificateProduction(!showCertificateProduction)}
                  >
                    {showCertificateProduction ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
                <Textarea
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                  value={showCertificateProduction ? certificatePemProduction : (certificatePemProduction ? maskValue(certificatePemProduction, 20) : "")}
                  onChange={(e) => {
                    if (showCertificateProduction) {
                      setCertificatePemProduction(e.target.value);
                    }
                  }}
                  readOnly={!showCertificateProduction}
                  rows={3}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            {/* Status Production */}
            <div className="pt-2 border-t">
              {isEnvironmentConfigured("production") ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Configuração completa
                </Badge>
              ) : (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Preencha todos os campos
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chave PIX e Status */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card de Chave PIX */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Chave PIX EVP
            </CardTitle>
            <CardDescription>
              Chave aleatória comum para ambos ambientes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pixKey">Chave PIX (UUID)</Label>
              <Input
                id="pixKey"
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Formato UUID obtido no painel EFI (API &gt; Minhas chaves Pix)
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
            <CardTitle>📡 Status da Conexão</CardTitle>
            <CardDescription>
              Teste a conexão com o ambiente selecionado
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
                      {format(new Date(lastTestAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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
              disabled={testing || !isEnvironmentConfigured(environment)}
              variant="outline"
              className={`w-full ${
                environment === "production" 
                  ? "border-blue-500 text-blue-600 hover:bg-blue-500/10" 
                  : "border-yellow-500 text-yellow-600 hover:bg-yellow-500/10"
              }`}
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {environment === "production" ? "🏭 Testar Produção" : "🧪 Testar Sandbox"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Card de Teste de Cobrança PIX */}
        <PixChargeTestCard 
          isConfigured={isConfigured && lastTestStatus === "success"} 
          environment={environment} 
        />

        {/* Card de Webhook PIX */}
        <WebhookConfigCard
          isConfigured={isConfigured && lastTestStatus === "success"}
          environment={environment}
          webhookUrl={webhookUrl}
          webhookConfiguredAt={webhookConfiguredAt}
          onConfigured={fetchConfig}
        />

        {/* Card de Webhook de Contas Simplificadas */}
        <AccountWebhookConfigCard
          isConfigured={isConfigured && lastTestStatus === "success"}
          environment={environment}
          onConfigured={fetchConfig}
        />
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

      {/* Guia de Configuração */}
      <EfiSetupGuide />
    </div>
  );
}
