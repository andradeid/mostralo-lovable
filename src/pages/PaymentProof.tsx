import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { usePageSEO } from '@/hooks/useSEO';
import { Loader2, Upload, FileCheck, Copy, QrCode, Store, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentConfig {
  pix_key?: string;
  pix_key_type?: string;
  pix_name?: string;
  payment_instructions?: string;
}

interface PaymentApproval {
  id: string;
  payment_amount: number;
  plan_id: string;
  status: string;
  payment_proof_url?: string;
}

const PaymentProof = () => {
  usePageSEO({
    title: 'Comprovante de Pagamento - Mostralo',
    description: 'Envie seu comprovante de pagamento para ativar sua conta.',
    keywords: 'pagamento mostralo, comprovante pix',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [approval, setApproval] = useState<PaymentApproval | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
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
      fetchPaymentConfig();
      fetchApproval();
    }
  }, [user]);

  const fetchPaymentConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_payment_config')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setPaymentConfig(data);
    } catch (error: any) {
      console.error('Erro ao buscar configuração:', error);
    }
  };

  const fetchApproval = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await (supabase as any)
        .from('payment_approvals')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'pending')
        .maybeSingle() as { data: PaymentApproval | null; error: any };

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setApproval(data as PaymentApproval);
        // Se já tem comprovante, mostrar preview
        if ((data as any).payment_proof_url) {
          setPreviewUrl((data as any).payment_proof_url);
        }
      } else {
        // Se não tem aprovação pendente, redirecionar
        toast({
          title: 'Nenhuma pendência encontrada',
          description: 'Você será redirecionado.',
        });
        navigate('/dashboard/subscription');
      }
    } catch (error: any) {
      console.error('Erro ao buscar aprovação:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Tipo de arquivo inválido',
        description: 'Envie apenas imagens (JPG, PNG, WEBP) ou PDF.',
        variant: 'destructive',
      });
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O arquivo deve ter no máximo 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);

    // Criar preview para imagens
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !approval || !user) return;

    setUploading(true);

    try {
      // 1. Upload para o Storage (usando bucket público subscription-receipts)
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('subscription-receipts')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // 2. Obter URL pública
      const { data: urlData } = supabase.storage
        .from('subscription-receipts')
        .getPublicUrl(fileName);

      // 3. Atualizar registro de aprovação
      const { error: updateError } = await (supabase as any)
        .from('payment_approvals')
        .update({
          payment_proof_url: urlData.publicUrl,
          pix_key: paymentConfig?.pix_key || null,
        })
        .eq('id', approval.id);

      if (updateError) throw updateError;

      // 4. Atualizar estado local para remover campo de upload imediatamente
      setApproval({
        ...approval,
        payment_proof_url: urlData.publicUrl,
      });
      setSelectedFile(null);

      toast({
        title: 'Comprovante enviado! ✅',
        description: 'Aguarde a aprovação do pagamento. Você será notificado.',
      });

      // Redirecionar para página de assinatura
      setTimeout(() => {
        navigate('/dashboard/subscription');
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro ao enviar comprovante',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const copyPixKey = () => {
    if (paymentConfig?.pix_key) {
      navigator.clipboard.writeText(paymentConfig.pix_key);
      toast({
        title: 'Chave PIX copiada!',
        description: 'Cole no app do seu banco.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-background to-secondary/20 px-4 py-8">
      <div className="w-full max-w-4xl space-y-6">
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
        {!approval?.payment_proof_url ? (
          <Alert className="border-yellow-500/50 bg-yellow-500/5">
            <Clock className="h-4 w-4 text-yellow-500" />
            <AlertDescription>
              <p className="font-medium">Pagamento Pendente</p>
              <p className="text-sm mt-1">
                Faça o pagamento via PIX e envie o comprovante para continuar.
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-blue-500/50 bg-blue-500/5">
            <CheckCircle className="h-4 w-4 text-blue-500" />
            <AlertDescription>
              <p className="font-medium">Comprovante Enviado</p>
              <p className="text-sm mt-1">
                Aguarde a análise do administrador. Você será notificado assim que for aprovado.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Dados de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="w-5 h-5" />
                <span>Dados para Pagamento</span>
              </CardTitle>
              <CardDescription>
                Use os dados abaixo para fazer o pagamento via PIX
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {approval && (
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Valor a Pagar</p>
                  <p className="text-3xl font-bold text-primary">
                    R$ {approval.payment_amount.toFixed(2)}
                  </p>
                </div>
              )}

              {paymentConfig?.pix_key ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Chave PIX ({paymentConfig.pix_key_type?.toUpperCase()})</Label>
                    <div className="flex space-x-2">
                      <div className="flex-1 p-3 rounded-md bg-muted font-mono text-sm">
                        {paymentConfig.pix_key}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copyPixKey}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {paymentConfig.pix_name && (
                    <div className="space-y-2">
                      <Label>Nome do Beneficiário</Label>
                      <div className="p-3 rounded-md bg-muted">
                        {paymentConfig.pix_name}
                      </div>
                    </div>
                  )}

                  {paymentConfig.payment_instructions && (
                    <div className="space-y-2">
                      <Label>Instruções</Label>
                      <div className="p-3 rounded-md bg-muted text-sm whitespace-pre-wrap">
                        {paymentConfig.payment_instructions}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    Os dados de pagamento ainda não foram configurados pelo administrador.
                    Entre em contato para obter as informações.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Upload do Comprovante */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Comprovante de Pagamento</span>
              </CardTitle>
              <CardDescription>
                Envie uma foto ou PDF do comprovante
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {previewUrl && (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview do comprovante"
                    className="w-full h-64 object-cover rounded-lg border"
                  />
                  {approval?.payment_proof_url && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                      <FileCheck className="w-4 h-4" />
                      <span>Enviado</span>
                    </div>
                  )}
                </div>
              )}

              {!approval?.payment_proof_url && (
                <div className="space-y-4">
                  <Label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">Clique para selecionar</span> ou arraste
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG, WEBP ou PDF (max. 5MB)
                      </p>
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      onChange={handleFileSelect}
                    />
                  </Label>

                  {selectedFile && (
                    <div className="flex items-center justify-between p-3 rounded-md bg-muted">
                      <div className="flex items-center space-x-2">
                        <FileCheck className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{selectedFile.name}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                        variant="ghost"
                      >
                        Remover
                      </Button>
                    </div>
                  )}

                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Enviar Comprovante
                      </>
                    )}
                  </Button>
                </div>
              )}

              {approval?.payment_proof_url && (
                <Button
                  onClick={() => navigate('/dashboard/subscription')}
                  className="w-full"
                  variant="outline"
                >
                  Ir para Painel
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentProof;

