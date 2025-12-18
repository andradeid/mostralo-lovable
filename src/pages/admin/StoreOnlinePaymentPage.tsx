import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { 
  Smartphone, 
  Zap, 
  Check, 
  Info,
  Percent,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  RefreshCw,
  ChevronDown,
  ExternalLink,
  Copy,
  Link2,
  QrCode,
  TestTube2,
  Building2,
  User
} from 'lucide-react';

interface StoreEfiData {
  wants_online_payment: boolean;
  efi_account_status: string | null;
  efi_account_id: string | null;
  efi_account_number: string | null;
  efi_document_type: string | null;
  efi_document_number: string | null;
  company_name: string | null;
}

export default function StoreOnlinePaymentPage() {
  const { toast } = useToast();
  const { storeId, isLoading: storeLoading } = useStoreAccess();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeData, setStoreData] = useState<StoreEfiData | null>(null);
  const [guideOpen, setGuideOpen] = useState(true);
  const [togglingPayment, setTogglingPayment] = useState(false);
  
  // Form state
  const [efiAccountNumber, setEfiAccountNumber] = useState("");
  const [efiDocumentType, setEfiDocumentType] = useState<'cpf' | 'cnpj'>('cpf');
  const [efiDocumentNumber, setEfiDocumentNumber] = useState("");
  
  // PIX Test state
  const [testValue, setTestValue] = useState("1.00");
  const [testDescription, setTestDescription] = useState("Teste de cobrança PIX");
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    txid: string;
    status: string;
    valor: string;
    pixCopiaECola: string;
    qrcode: string;
    expiracao: string;
    splitApplied?: boolean;
    splitWarning?: string | null;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchStoreData = async () => {
    if (!storeId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          wants_online_payment,
          efi_account_status,
          efi_account_id,
          efi_account_number,
          efi_document_type,
          efi_document_number,
          name
        `)
        .eq('id', storeId)
        .single();

      if (error) throw error;

      setStoreData({
        wants_online_payment: data.wants_online_payment || false,
        efi_account_status: data.efi_account_status,
        efi_account_id: data.efi_account_id,
        efi_account_number: data.efi_account_number,
        efi_document_type: data.efi_document_type,
        efi_document_number: data.efi_document_number,
        company_name: data.name,
      });
      
      if (data.efi_account_number) {
        setEfiAccountNumber(data.efi_account_number);
      }
      if (data.efi_document_type) {
        setEfiDocumentType(data.efi_document_type as 'cpf' | 'cnpj');
      }
      if (data.efi_document_number) {
        setEfiDocumentNumber(data.efi_document_number);
      }
    } catch (error) {
      console.error('Erro ao buscar dados da loja:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da loja.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchStoreData();
    }
  }, [storeId]);

  const formatAccountNumber = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 10);
  };

  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    return cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatCNPJ = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 14);
    return cleaned
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  };

  const formatDocument = (value: string) => {
    return efiDocumentType === 'cpf' ? formatCPF(value) : formatCNPJ(value);
  };

  const handleLinkAccount = async () => {
    if (!storeId) return;
    
    const cleanAccountNumber = efiAccountNumber.replace(/\D/g, '');
    const cleanDocNumber = efiDocumentNumber.replace(/\D/g, '');
    
    if (cleanAccountNumber.length < 6) {
      toast({
        title: "Número da conta inválido",
        description: "O número da conta deve ter pelo menos 6 dígitos.",
        variant: "destructive",
      });
      return;
    }

    const expectedDocLength = efiDocumentType === 'cpf' ? 11 : 14;
    if (cleanDocNumber.length !== expectedDocLength) {
      toast({
        title: `${efiDocumentType.toUpperCase()} inválido`,
        description: `O ${efiDocumentType.toUpperCase()} deve ter ${expectedDocLength} dígitos.`,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-efi-account', {
        body: { 
          store_id: storeId,
          efi_account_number: cleanAccountNumber,
          efi_document_type: efiDocumentType,
          efi_document_number: cleanDocNumber
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Conta vinculada!",
          description: "Sua conta EFI foi vinculada com sucesso. Agora você pode receber pagamentos PIX.",
        });
        fetchStoreData();
      } else {
        throw new Error(data.error || 'Erro ao vincular conta');
      }
    } catch (error: any) {
      console.error('Erro ao vincular conta:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível vincular a conta.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleOnlinePayment = async (enabled: boolean) => {
    if (!storeId) return;
    
    setTogglingPayment(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({ wants_online_payment: enabled })
        .eq('id', storeId);

      if (error) throw error;

      setStoreData(prev => prev ? { ...prev, wants_online_payment: enabled } : null);
      
      toast({
        title: enabled ? "Pagamento online ativado!" : "Pagamento online desativado",
        description: enabled 
          ? "Seus clientes agora podem pagar via PIX no checkout."
          : "Seus clientes só podem pagar na entrega.",
      });
    } catch (error: any) {
      console.error('Erro ao alterar configuração:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a configuração.",
        variant: "destructive",
      });
    } finally {
      setTogglingPayment(false);
    }
  };

  const handleCreateTestCharge = async () => {
    if (!storeId) return;
    
    setTestLoading(true);
    setTestResult(null);
    
    try {
      // Converte para número e valida
      const valorNumerico = parseFloat(testValue.replace(',', '.'));
      
      if (isNaN(valorNumerico) || valorNumerico < 1) {
        toast({
          title: "Valor inválido",
          description: "O valor mínimo é R$ 1,00",
          variant: "destructive",
        });
        setTestLoading(false);
        return;
      }

      // Envia o valor em REAIS (string com 2 decimais), não centavos
      const valorReais = valorNumerico.toFixed(2);

      const { data, error } = await supabase.functions.invoke('efi-create-pix-charge', {
        body: {
          valor: valorReais, // Ex: "1.00" para R$ 1,00
          descricao: testDescription,
          store_id: storeId,
        },
      });

      if (error) throw error;

      if (data.success) {
        setTestResult({
          txid: data.txid,
          status: data.status,
          valor: data.valor,
          pixCopiaECola: data.pixCopiaECola,
          qrcode: data.qrCodeBase64,
          expiracao: data.expiracao,
          splitApplied: data.splitApplied,
          splitWarning: data.splitWarning,
        });
        
        if (data.splitWarning) {
          toast({
            title: "Cobrança criada com aviso",
            description: data.splitWarning,
            variant: "default",
          });
        } else {
          toast({
            title: "Cobrança criada!",
            description: data.splitApplied 
              ? "QR Code com split payment gerado com sucesso!" 
              : "QR Code gerado com sucesso.",
          });
        }
      } else {
        throw new Error(data.error || 'Erro ao criar cobrança');
      }
    } catch (error: any) {
      console.error('Erro ao criar cobrança:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a cobrança de teste.",
        variant: "destructive",
      });
    } finally {
      setTestLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value.replace(',', '.'));
    if (isNaN(num)) return 'R$ 0,00';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getStatusCard = () => {
    if (!storeData) return null;

    switch (storeData.efi_account_status) {
      case 'active':
        return (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-green-800 dark:text-green-300">
                  ✅ PIX Online Ativo!
                </p>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Sua conta EFI está configurada e pronta para receber pagamentos PIX.
                </p>
                {storeData.efi_account_number && (
                  <p className="text-xs text-muted-foreground">
                    Conta EFI: {storeData.efi_account_number}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        );
      
      case 'pending_authorization':
        return (
          <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900">
            <Clock className="h-5 w-5 text-yellow-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-yellow-800 dark:text-yellow-300">
                  ⏳ Aguardando Configuração
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  Complete a vinculação da sua conta EFI abaixo.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        );
      
      case 'rejected':
        return (
          <Alert className="bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900">
            <XCircle className="h-5 w-5 text-red-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-red-800 dark:text-red-300">
                  ❌ Conta Rejeitada
                </p>
                <p className="text-sm text-red-700 dark:text-red-400">
                  Houve um problema com a conta informada. Verifique os dados e tente novamente.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        );
      
      default:
        return null;
    }
  };

  if (storeLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se já tem conta ativa
  if (storeData?.efi_account_status === 'active' && storeData?.efi_account_number) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-primary" />
            Pagamento Online
          </h1>
          <p className="text-muted-foreground">
            Receba pagamentos PIX diretamente na plataforma
          </p>
        </div>

        {getStatusCard()}

        {/* Switch para ativar/desativar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium flex items-center gap-2">
                  {storeData.wants_online_payment ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                  Pagamento Online no Checkout
                </p>
                <p className="text-sm text-muted-foreground">
                  {storeData.wants_online_payment 
                    ? "Clientes podem pagar via PIX no checkout"
                    : "Clientes só podem pagar na entrega"}
                </p>
              </div>
              <Switch
                checked={storeData.wants_online_payment}
                onCheckedChange={handleToggleOnlinePayment}
                disabled={togglingPayment}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Informações da Conta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className="bg-green-500">Ativo</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taxa por Transação</p>
                <p className="font-semibold">8,19%</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Conta EFI</p>
                <p className="font-mono text-lg">{storeData.efi_account_number}</p>
              </div>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Os pagamentos PIX dos seus clientes serão depositados automaticamente 
                na sua conta EFI vinculada, já com a taxa descontada.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Card de Teste PIX */}
        <Card className="border-dashed border-2 border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TestTube2 className="h-5 w-5 text-primary" />
              Testar Cobrança PIX
            </CardTitle>
            <CardDescription>
              Gere uma cobrança de teste para validar que o split payment está funcionando
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="testValue">Valor (R$)</Label>
                <Input
                  id="testValue"
                  value={testValue}
                  onChange={(e) => setTestValue(e.target.value)}
                  placeholder="1.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testDesc">Descrição</Label>
                <Input
                  id="testDesc"
                  value={testDescription}
                  onChange={(e) => setTestDescription(e.target.value)}
                  placeholder="Descrição do teste"
                />
              </div>
            </div>

            <Button
              onClick={handleCreateTestCharge}
              disabled={testLoading}
              className="w-full"
            >
              {testLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <QrCode className="h-4 w-4 mr-2" />
                  Gerar PIX de Teste
                </>
              )}
            </Button>

            {testResult && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {testResult.status}
                    </Badge>
                    {testResult.splitApplied && (
                      <Badge className="bg-purple-500">Split ✓</Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    TXID: {testResult.txid?.slice(0, 12)}...
                  </span>
                </div>

                {testResult.splitWarning && (
                  <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-900">
                    <Info className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800 dark:text-yellow-300 text-sm">
                      <strong>Aviso:</strong> {testResult.splitWarning}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-center space-y-2">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(testResult.valor)}
                  </p>
                  {testResult.qrcode && (
                    <img 
                      src={testResult.qrcode.startsWith('data:') ? testResult.qrcode : `data:image/png;base64,${testResult.qrcode}`}
                      alt="QR Code PIX"
                      className="mx-auto w-48 h-48 rounded-lg border"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Código Copia e Cola</Label>
                  <div className="flex gap-2">
                    <Input
                      value={testResult.pixCopiaECola}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(testResult.pixCopiaECola, 'Código PIX')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {testResult.splitApplied ? (
                  <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-300 text-sm">
                      <strong>Split Payment Ativo:</strong> Ao pagar este PIX, você receberá 91,81% 
                      (R$ {(parseFloat(testResult.valor) * 0.9181).toFixed(2)}) e a plataforma 8,19%.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800 dark:text-amber-300 text-sm space-y-2">
                      <p><strong>⚠️ Split Payment não aplicado</strong></p>
                      <p>O valor total será creditado na conta principal. Para habilitar o split:</p>
                      <ol className="list-decimal list-inside text-xs space-y-1 mt-2">
                        <li>Acesse o <a href="https://app.gerencianet.com.br" target="_blank" rel="noopener" className="underline font-medium">Painel EFI</a></li>
                        <li>Vá em <strong>API → Minhas Aplicações</strong></li>
                        <li>Selecione sua aplicação</li>
                        <li>Em <strong>Escopos</strong>, ative <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">gn.split.write</code></li>
                        <li>Salve e teste novamente</li>
                      </ol>
                      <p className="text-xs mt-2 opacity-80">
                        Se o escopo não aparecer, entre em contato com o suporte EFI para solicitar a habilitação.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  Expira em: {testResult.expiracao ? new Date(testResult.expiracao).toLocaleString('pt-BR') : 'N/A'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={fetchStoreData}
              variant="outline" 
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar Status
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulário de vinculação
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Smartphone className="h-6 w-6 text-primary" />
          Pagamento Online
        </h1>
        <p className="text-muted-foreground">
          Ative o recebimento de pagamentos PIX diretamente na plataforma
        </p>
      </div>

      {getStatusCard()}

      {/* Card de benefícios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Benefícios do PIX Online
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              Recebimento instantâneo na sua conta EFI
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              Confirmação automática de pagamentos
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              Maior conversão de vendas
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              Menos inadimplência e cancelamentos
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Taxa */}
      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
        <Percent className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-300">
          <div className="space-y-1">
            <p className="font-semibold">Taxa por transação: 8,19%</p>
            <p className="text-xs">7% Mostralo + 1,19% processamento EFI</p>
            <p className="text-xs flex items-center gap-1">
              <Zap className="w-3 h-3" /> Recebimento instantâneo na sua conta
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Guia passo a passo */}
      <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
        <Card>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  📱 PASSO 1: Criar sua Conta EFI (gratuita)
                </span>
                <ChevronDown className={`h-5 w-5 transition-transform ${guideOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                  <div>
                    <p className="font-medium">Baixe o app "Efí" no seu celular</p>
                    <p className="text-sm text-muted-foreground">Disponível na Play Store (Android) e App Store (iPhone)</p>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://play.google.com/store/apps/details?id=br.com.gerencianet.app" target="_blank" rel="noopener">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Play Store
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://apps.apple.com/br/app/efi-banco-digital/id1443363678" target="_blank" rel="noopener">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          App Store
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                  <div>
                    <p className="font-medium">Crie sua conta com CPF ou CNPJ</p>
                    <p className="text-sm text-muted-foreground">A criação é gratuita e leva poucos minutos. Basta seguir as instruções do app.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                  <div>
                    <p className="font-medium">Encontre o número da sua conta</p>
                    <p className="text-sm text-muted-foreground">
                      No app Efí, vá em <strong>Menu → Minha Conta</strong>. O número da conta aparece no topo.
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  A conta EFI é 100% gratuita para criar e manter. Você só paga a taxa de 8,19% quando receber um pagamento.
                </AlertDescription>
              </Alert>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Formulário de vinculação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            PASSO 2: Vincular sua Conta
          </CardTitle>
          <CardDescription>
            Informe o número da sua conta EFI para começar a receber pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tipo de documento */}
          <div className="space-y-3">
            <Label>Tipo de Documento do Titular *</Label>
            <RadioGroup 
              value={efiDocumentType} 
              onValueChange={(v) => {
                setEfiDocumentType(v as 'cpf' | 'cnpj');
                setEfiDocumentNumber('');
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cpf" id="cpf" />
                <Label htmlFor="cpf" className="flex items-center gap-1 cursor-pointer font-normal">
                  <User className="h-4 w-4" /> CPF (Pessoa Física)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cnpj" id="cnpj" />
                <Label htmlFor="cnpj" className="flex items-center gap-1 cursor-pointer font-normal">
                  <Building2 className="h-4 w-4" /> CNPJ (Empresa)
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              Use o mesmo tipo de documento que você cadastrou na conta EFI
            </p>
          </div>

          {/* Número do documento */}
          <div className="space-y-2">
            <Label htmlFor="efiDocument">{efiDocumentType.toUpperCase()} do Titular *</Label>
            <Input
              id="efiDocument"
              value={efiDocumentNumber}
              onChange={(e) => setEfiDocumentNumber(formatDocument(e.target.value))}
              placeholder={efiDocumentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
              maxLength={efiDocumentType === 'cpf' ? 14 : 18}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              O documento deve ser o mesmo cadastrado como titular da conta EFI
            </p>
          </div>

          {/* Número da conta */}
          <div className="space-y-2">
            <Label htmlFor="efiAccount">Número da Conta EFI *</Label>
            <Input
              id="efiAccount"
              value={efiAccountNumber}
              onChange={(e) => setEfiAccountNumber(formatAccountNumber(e.target.value))}
              placeholder="Ex: 1234567"
              maxLength={10}
              className="font-mono text-lg"
            />
            <p className="text-xs text-muted-foreground">
              O número está no app Efí → Menu → Minha Conta
            </p>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Importante:</strong> O CPF ou CNPJ informado deve ser exatamente o mesmo cadastrado 
              na sua conta EFI. Isso garante que o split de pagamento funcione corretamente.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleLinkAccount}
            disabled={saving || efiAccountNumber.length < 6 || efiDocumentNumber.replace(/\D/g, '').length < (efiDocumentType === 'cpf' ? 11 : 14)}
            className="w-full"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Vinculando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Vincular e Ativar Pagamento Online
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Ao vincular, você concorda com os termos de uso do serviço de pagamentos.
            Os valores recebidos serão depositados diretamente na sua conta EFI.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
