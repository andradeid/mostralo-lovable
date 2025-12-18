import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { 
  Smartphone, 
  Building2, 
  User, 
  Zap, 
  Shield, 
  Check, 
  Info,
  CreditCard,
  Percent,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface StoreEfiData {
  wants_online_payment: boolean;
  efi_account_status: string | null;
  efi_account_id: string | null;
  company_name: string | null;
}

export default function StoreOnlinePaymentPage() {
  const { toast } = useToast();
  const { storeId, isLoading: storeLoading } = useStoreAccess();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeData, setStoreData] = useState<StoreEfiData | null>(null);
  
  // Form state
  const [wantsOnlinePayment, setWantsOnlinePayment] = useState<boolean | null>(null);
  const [personType, setPersonType] = useState<'pf' | 'pj' | null>(null);
  const [birthDate, setBirthDate] = useState("");
  const [motherName, setMotherName] = useState("");

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
          name
        `)
        .eq('id', storeId)
        .single();

      if (error) throw error;

      setStoreData({
        wants_online_payment: data.wants_online_payment || false,
        efi_account_status: data.efi_account_status,
        efi_account_id: data.efi_account_id,
        company_name: data.name,
      });
      
      setWantsOnlinePayment(data.wants_online_payment || false);
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

  const formatBirthDate = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const limited = numbers.slice(0, 8);
    
    if (limited.length <= 2) return limited;
    if (limited.length <= 4) return `${limited.slice(0, 2)}/${limited.slice(2)}`;
    return `${limited.slice(0, 2)}/${limited.slice(2, 4)}/${limited.slice(4)}`;
  };

  const handleActivateOnlinePayment = async () => {
    if (!storeId) return;
    
    // Validações para PF
    if (personType === 'pf') {
      if (!birthDate || birthDate.length < 10) {
        toast({
          title: "Data de nascimento obrigatória",
          description: "Por favor, informe sua data de nascimento.",
          variant: "destructive",
        });
        return;
      }
      if (!motherName || motherName.length < 3) {
        toast({
          title: "Nome da mãe obrigatório",
          description: "Por favor, informe o nome completo da sua mãe.",
          variant: "destructive",
        });
        return;
      }
    }

    setSaving(true);
    try {
      // Primeiro, atualizar a loja
      const { error: updateError } = await supabase
        .from('stores')
        .update({ 
          wants_online_payment: true,
          efi_account_status: 'pending_creation'
        })
        .eq('id', storeId);

      if (updateError) throw updateError;

      // Chamar Edge Function para criar conta simplificada
      const { data, error } = await supabase.functions.invoke('create-efi-simplified-account', {
        body: { 
          store_id: storeId,
          person_type: personType,
          birth_date: personType === 'pf' ? birthDate : null,
          mother_name: personType === 'pf' ? motherName : null,
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Solicitação enviada!",
          description: "Você receberá um link por SMS/WhatsApp para autorizar a criação da conta.",
        });
        fetchStoreData();
      } else {
        throw new Error(data.error || 'Erro ao criar conta');
      }
    } catch (error: any) {
      console.error('Erro ao ativar pagamento online:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível ativar o pagamento online.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
                {storeData.efi_account_id && (
                  <p className="text-xs text-muted-foreground">
                    ID da Conta: {storeData.efi_account_id}
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
                  ⏳ Aguardando sua Autorização
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-400">
                  Enviamos um link de autorização por SMS/WhatsApp. 
                  Clique no link para autorizar a criação da sua conta EFI.
                </p>
                <p className="text-xs text-muted-foreground">
                  Não recebeu? Verifique sua caixa de SMS ou solicite um novo link.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        );
      
      case 'pending_creation':
        return (
          <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-blue-800 dark:text-blue-300">
                  🔄 Processando...
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Estamos criando sua conta EFI. Isso pode levar alguns segundos.
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
                  ❌ Solicitação Rejeitada
                </p>
                <p className="text-sm text-red-700 dark:text-red-400">
                  Infelizmente sua solicitação foi rejeitada pela EFI. 
                  Isso pode acontecer por inconsistências nos dados cadastrais.
                </p>
                <p className="text-xs text-muted-foreground">
                  Entre em contato com o suporte para mais informações.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        );
      
      default:
        return null;
    }
  };

  // Default to PJ since we don't have company_document in stores table
  const isPJ = false;

  if (storeLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se já tem conta ativa ou pendente de autorização
  if (storeData?.efi_account_status === 'active' || storeData?.efi_account_status === 'pending_authorization') {
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

        {storeData?.efi_account_status === 'pending_authorization' && (
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={fetchStoreData}
                variant="outline" 
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Verificar Status
              </Button>
            </CardContent>
          </Card>
        )}

        {storeData?.efi_account_status === 'active' && (
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
              </div>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Os pagamentos PIX dos seus clientes serão depositados automaticamente 
                  na sua conta EFI vinculada.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Formulário de ativação
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
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Recebimento instantâneo na sua conta
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Confirmação automática de pagamentos
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Maior conversão de vendas
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Menos inadimplência
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

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Ativar Pagamento Online</CardTitle>
          <CardDescription>
            Preencha os dados para criar sua conta de recebimento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Se for CPF, precisa escolher tipo de conta */}
          {!isPJ && (
            <div className="space-y-3">
              <Label>Tipo de conta para recebimento:</Label>
              <RadioGroup
                value={personType || ''}
                onValueChange={(value) => setPersonType(value as 'pf' | 'pj')}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="pf" id="pf" className="peer sr-only" />
                  <Label
                    htmlFor="pf"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <User className="mb-3 h-6 w-6" />
                    <span className="text-sm font-medium">Pessoa Física</span>
                    <span className="text-xs text-muted-foreground">CPF</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="pj" id="pj" className="peer sr-only" />
                  <Label
                    htmlFor="pj"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Building2 className="mb-3 h-6 w-6" />
                    <span className="text-sm font-medium">Pessoa Jurídica</span>
                    <span className="text-xs text-muted-foreground">CNPJ</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Formulário para PF */}
          {personType === 'pf' && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Shield className="w-4 h-4 text-primary" />
                Dados para verificação de identidade
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de Nascimento *</Label>
                <Input
                  id="birthDate"
                  value={birthDate}
                  onChange={(e) => setBirthDate(formatBirthDate(e.target.value))}
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motherName">Nome Completo da Mãe *</Label>
                <Input
                  id="motherName"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  placeholder="Nome completo da mãe"
                />
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Dados protegidos pela LGPD, usados apenas para verificação na EFI Pay
              </p>
            </div>
          )}

          {/* Confirmação para PJ */}
          {personType === 'pj' && (
            <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900">
              <Building2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                <div className="font-semibold mb-2">Dados da empresa:</div>
                <div className="text-sm space-y-1">
                  <p>🏢 Loja: {storeData?.company_name}</p>
                </div>
                <p className="text-xs mt-2 opacity-70">
                  ⚠️ A EFI validará os dados automaticamente com a Receita Federal
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Botão de ativação */}
          <Button
            onClick={handleActivateOnlinePayment}
            disabled={saving || (!isPJ && !personType) || (personType === 'pf' && (!birthDate || !motherName))}
            className="w-full"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ativando...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Ativar Pagamento Online
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Ao ativar, você receberá um link por SMS/WhatsApp para autorizar a criação da conta
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
