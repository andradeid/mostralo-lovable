import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { usePageSEO } from '@/hooks/useSEO';
import { Loader2, Copy, QrCode, Store, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentConfig {
  efi_client_id?: string;
  efi_client_secret?: string;
  efi_certificate_pem?: string;
  efi_pix_key?: string;
  efi_environment?: string;
}

interface PaymentApproval {
  id: string;
  payment_amount: number;
  plan_id: string;
  status: string;
  pix_txid?: string;
  pix_qrcode_base64?: string;
  pix_copia_cola?: string;
  pix_expires_at?: string;
}

const PaymentProof = () => {
  usePageSEO({
    title: 'Pagamento PIX - Mostralo',
    description: 'Efetue o pagamento via PIX para ativar sua conta.',
    keywords: 'pagamento mostralo, pix, qrcode',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isEfiConfigured, setIsEfiConfigured] = useState(false);
  const [approval, setApproval] = useState<PaymentApproval | null>(null);
  const [generatingPix, setGeneratingPix] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [pixStatus, setPixStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriedAutoGenerate = useRef(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  // 🔒 Bloquear clientes de acessar esta página
  useEffect(() => {
    if (userRole === 'customer') {
      console.error('🚨 SECURITY: Customer blocked from PaymentProof page');
      navigate('/');
      return;
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (user && userRole !== 'customer') {
      loadData();
    }
  }, [user]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Auto-gerar PIX quando pronto (ou reparar PIX incompleto)
  useEffect(() => {
    const needsPix =
      isEfiConfigured &&
      approval &&
      (!approval.pix_txid || (!approval.pix_qrcode_base64 && !approval.pix_copia_cola));

    if (!hasTriedAutoGenerate.current && needsPix && !generatingPix) {
      hasTriedAutoGenerate.current = true;
      generatePixCharge();
    }
  }, [isEfiConfigured, approval, generatingPix]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch payment config
      const { data: configData, error: configError } = await supabase
        .from('subscription_payment_config')
        .select('*')
        .single();

      if (configError && configError.code !== 'PGRST116') throw configError;
      
      const efiConfigured = !!(
        configData?.efi_client_id && 
        configData?.efi_client_secret && 
        configData?.efi_certificate_pem &&
        configData?.efi_pix_key
      );
      setIsEfiConfigured(efiConfigured);
      console.log('🔧 EFI configurado:', efiConfigured);

      // Fetch approval
      const { data: approvalData, error: approvalError } = await (supabase as any)
        .from('payment_approvals')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'pending')
        .maybeSingle() as { data: PaymentApproval | null; error: any };

      if (approvalError && approvalError.code !== 'PGRST116') throw approvalError;
      
      if (approvalData) {
        setApproval(approvalData as PaymentApproval);
        // Se já tem PIX gerado, iniciar polling
        if ((approvalData as any).pix_txid) {
          startPolling((approvalData as any).pix_txid);
        }
      } else {
        toast({
          title: 'Nenhuma pendência encontrada',
          description: 'Você será redirecionado.',
        });
        navigate('/dashboard/subscription');
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePixCharge = async () => {
    if (!approval || !isEfiConfigured) return;

    setGeneratingPix(true);
    setError(null);
    try {
      console.log('🚀 Gerando cobrança PIX EFI...');
      
      const { data, error } = await supabase.functions.invoke('efi-create-pix-charge', {
        body: {
          valor: approval.payment_amount.toString(),
          descricao: `Assinatura Mostralo - ID: ${approval.id.slice(0, 8)}`,
          expiracao_segundos: 3600,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Erro ao gerar PIX');
      }

      console.log('✅ PIX gerado:', data);

      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + 3600);

      await (supabase as any)
        .from('payment_approvals')
        .update({
          pix_txid: data.txid,
          pix_location: data.location,
          pix_qrcode_base64: data.qrCodeBase64,
          pix_copia_cola: data.pixCopiaECola,
          pix_expires_at: expiresAt.toISOString(),
        })
        .eq('id', approval.id);

      setApproval({
        ...approval,
        pix_txid: data.txid,
        pix_qrcode_base64: data.qrCodeBase64,
        pix_copia_cola: data.pixCopiaECola,
        pix_expires_at: expiresAt.toISOString(),
      });

      toast({
        title: 'QR Code PIX gerado!',
        description: 'Escaneie o código ou copie o código PIX para pagar.',
      });

      startPolling(data.txid);
    } catch (error: any) {
      console.error('Erro ao gerar PIX:', error);
      setError(error.message);
      toast({
        title: 'Erro ao gerar PIX',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setGeneratingPix(false);
    }
  };

  const checkPixStatus = useCallback(async (txid: string) => {
    try {
      setCheckingStatus(true);
      
      const { data, error } = await supabase.functions.invoke('efi-check-pix-status', {
        body: { txid },
      });

      if (error) throw error;

      console.log('📊 Status PIX:', data);
      setPixStatus(data.status);

      if (data.systemStatus === 'paid') {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }

        toast({
          title: '🎉 Pagamento Confirmado!',
          description: 'Seu pagamento foi recebido. Redirecionando...',
        });

        setTimeout(() => {
          navigate('/dashboard/subscription');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setCheckingStatus(false);
    }
  }, [navigate, toast]);

  const startPolling = useCallback((txid: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    checkPixStatus(txid);

    pollingRef.current = setInterval(() => {
      checkPixStatus(txid);
    }, 5000);
  }, [checkPixStatus]);

  const copyPixCode = () => {
    if (approval?.pix_copia_cola) {
      navigator.clipboard.writeText(approval.pix_copia_cola);
      toast({
        title: 'Código PIX copiado!',
        description: 'Cole no app do seu banco.',
      });
    }
  };

  const qrCodeSrc = approval?.pix_qrcode_base64
    ? (approval.pix_qrcode_base64.startsWith('data:') || approval.pix_qrcode_base64.startsWith('http')
      ? approval.pix_qrcode_base64
      : `data:image/png;base64,${approval.pix_qrcode_base64}`)
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Store className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-primary">Mostralo</h1>
          </div>
          <p className="text-muted-foreground">
            Complete seu pagamento para ativar sua conta
          </p>
        </div>

        {/* Status Alert */}
        {pixStatus === 'CONCLUIDA' ? (
          <Alert className="border-green-500/50 bg-green-500/5">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription>
              <p className="font-medium">Pagamento Confirmado! 🎉</p>
              <p className="text-sm mt-1">
                Seu pagamento foi recebido. Redirecionando para o painel...
              </p>
            </AlertDescription>
          </Alert>
        ) : approval?.pix_txid ? (
          <Alert className="border-blue-500/50 bg-blue-500/5">
            <RefreshCw className={`h-4 w-4 text-blue-500 ${checkingStatus ? 'animate-spin' : ''}`} />
            <AlertDescription>
              <p className="font-medium">Aguardando Pagamento</p>
              <p className="text-sm mt-1">
                Escaneie o QR Code ou copie o código PIX. Verificando automaticamente...
              </p>
            </AlertDescription>
          </Alert>
        ) : generatingPix ? (
          <Alert className="border-blue-500/50 bg-blue-500/5">
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
            <AlertDescription>
              <p className="font-medium">Gerando QR Code PIX...</p>
              <p className="text-sm mt-1">
                Aguarde enquanto preparamos seu pagamento.
              </p>
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Payment Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <QrCode className="w-5 h-5" />
              <span>Pagamento PIX</span>
            </CardTitle>
            <CardDescription>
              Pague instantaneamente via PIX
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Valor */}
            {approval && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Valor a Pagar</p>
                <p className="text-3xl font-bold text-primary">
                  R$ {approval.payment_amount.toFixed(2)}
                </p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">Erro ao gerar PIX</p>
                  <p className="text-sm mt-1">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      hasTriedAutoGenerate.current = false;
                      setError(null);
                      generatePixCharge();
                    }}
                  >
                    Tentar novamente
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* EFI Not Configured */}
            {!isEfiConfigured && !error && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">Gateway de pagamento não configurado</p>
                  <p className="text-sm mt-1">
                    Entre em contato com o administrador para obter instruções de pagamento.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {/* Loading State */}
            {generatingPix && (
              <div className="flex flex-col items-center py-8 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Gerando QR Code PIX...</p>
              </div>
            )}

            {/* QR Code / Copia e Cola */}
            {isEfiConfigured && approval && (approval.pix_qrcode_base64 || approval.pix_copia_cola) && !generatingPix && (
              <div className="space-y-4">
                {/* QR Code */}
                {qrCodeSrc ? (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="p-4 bg-white rounded-lg shadow-md">
                      <img
                        src={qrCodeSrc}
                        alt="QR Code PIX"
                        className="w-48 h-48"
                        loading="lazy"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Escaneie com o app do seu banco
                    </p>
                  </div>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium">QR Code indisponível</p>
                      <p className="text-sm mt-1">Use o código PIX (Copia e Cola) abaixo.</p>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Pix Copia e Cola */}
                {approval.pix_copia_cola && (
                  <div className="space-y-2">
                    <Label>Código PIX (Copia e Cola)</Label>
                    <div className="flex space-x-2">
                      <div className="flex-1 p-3 rounded-md bg-muted font-mono text-xs break-all max-h-20 overflow-y-auto">
                        {approval.pix_copia_cola}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copyPixCode}
                        aria-label="Copiar código PIX"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Expiration Warning */}
                {approval.pix_expires_at && (
                  <p className="text-xs text-muted-foreground text-center">
                    Válido até: {new Date(approval.pix_expires_at).toLocaleString('pt-BR')}
                  </p>
                )}

                {/* Manual Check Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => approval.pix_txid && checkPixStatus(approval.pix_txid)}
                  disabled={checkingStatus}
                >
                  {checkingStatus ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Verificar Pagamento
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Go to Panel Button (after payment confirmed) */}
            {pixStatus === 'CONCLUIDA' && (
              <Button
                onClick={() => navigate('/dashboard/subscription')}
                className="w-full"
              >
                Ir para Painel
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentProof;
