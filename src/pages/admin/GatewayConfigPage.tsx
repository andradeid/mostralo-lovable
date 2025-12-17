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
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EfiConfig {
  efi_client_id: string | null;
  efi_client_secret: string | null;
  efi_certificate_pem: string | null;
  efi_pix_key: string | null;
  efi_environment: string | null;
  efi_is_configured: boolean | null;
  efi_last_test_at: string | null;
  efi_last_test_status: string | null;
}

export default function GatewayConfigPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configId, setConfigId] = useState<string | null>(null);
  
  // Form state
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [certificatePem, setCertificatePem] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [environment, setEnvironment] = useState<"sandbox" | "production">("sandbox");
  const [isConfigured, setIsConfigured] = useState(false);
  const [lastTestAt, setLastTestAt] = useState<string | null>(null);
  const [lastTestStatus, setLastTestStatus] = useState<string | null>(null);
  
  // Visibility toggles
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  
  // Certificate file info
  const [certificateFileName, setCertificateFileName] = useState<string | null>(null);

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
        setCertificatePem(data.efi_certificate_pem || "");
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCertificatePem(content);
      setCertificateFileName(file.name);
      toast({
        title: "Certificado carregado",
        description: `Arquivo ${file.name} carregado com sucesso.`,
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
    // Formato UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(key);
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

    if (!certificatePem.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Envie ou cole o Certificado PEM.",
        variant: "destructive",
      });
      return;
    }

    if (!validateCertificate(certificatePem)) {
      toast({
        title: "Certificado inválido",
        description: "O certificado não parece estar no formato PEM válido.",
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
        efi_certificate_pem: certificatePem,
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
        // Se não existe registro ativo, criar um novo com campos mínimos obrigatórios
        const { error } = await supabase
          .from("subscription_payment_config")
          .insert({
            ...updateData,
            pix_key: pixKey, // Usar a chave PIX também como pix_key padrão
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
      
      // Recarregar para obter o ID se foi criado
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
    if (!clientId || !clientSecret || !certificatePem) {
      toast({
        title: "Configure primeiro",
        description: "Preencha todas as credenciais antes de testar a conexão.",
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
          certificate_pem: certificatePem,
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
      fetchConfig(); // Recarregar para atualizar status do banco
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
          </CardContent>
        </Card>

        {/* Card de Certificado */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Certificado PEM
            </CardTitle>
            <CardDescription>
              Certificado para autenticação mTLS na API PIX
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload Area */}
            <div
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pem,.p12"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="font-medium">Clique para enviar ou arraste o arquivo</p>
              <p className="text-sm text-muted-foreground">
                Formatos aceitos: .pem, .p12 (arquivos .p12 devem ser convertidos)
              </p>
            </div>

            {certificateFileName && (
              <Badge variant="secondary" className="text-sm">
                <FileText className="h-3 w-3 mr-1" />
                {certificateFileName}
              </Badge>
            )}

            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="certificate">Ou cole o conteúdo do certificado</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCertificate(!showCertificate)}
                >
                  {showCertificate ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Textarea
                id="certificate"
                placeholder="-----BEGIN CERTIFICATE-----&#10;MIIEpDCCAowCCQDU+pQ4P...&#10;-----END CERTIFICATE-----"
                value={showCertificate ? certificatePem : (certificatePem ? maskValue(certificatePem, 20) : "")}
                onChange={(e) => {
                  if (showCertificate) {
                    setCertificatePem(e.target.value);
                  }
                }}
                readOnly={!showCertificate}
                rows={6}
                className="font-mono text-xs"
              />
            </div>

            {certificatePem && validateCertificate(certificatePem) && (
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
              disabled={testing || !isConfigured}
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
                  Testar Conexão
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
