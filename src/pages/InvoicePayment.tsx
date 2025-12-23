import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, CheckCircle, Clock, Loader2, RefreshCw, AlertCircle, Receipt, Store, Calendar, Building2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InvoiceData {
  id: string;
  store_id: string;
  plan_id: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  payment_status: string;
  notes: string | null;
  pix_txid: string | null;
  pix_copia_cola: string | null;
  pix_qrcode_base64: string | null;
  pix_expires_at: string | null;
  stores: {
    name: string;
  } | null;
  plans: {
    name: string;
  } | null;
}

export default function InvoicePayment() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPix, setGeneratingPix] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar fatura
  const fetchInvoice = useCallback(async () => {
    if (!invoiceId) return;

    try {
      const { data, error } = await supabase
        .from('subscription_invoices')
        .select(`
          *,
          stores:store_id(name),
          plans:plan_id(name)
        `)
        .eq('id', invoiceId)
        .single();

      if (error) throw error;
      setInvoice(data as InvoiceData);
    } catch (err) {
      console.error('Erro ao buscar fatura:', err);
      setError('Fatura não encontrada');
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  // Gerar cobrança PIX
  const generatePixCharge = useCallback(async () => {
    if (!invoice) return;

    setGeneratingPix(true);
    try {
      const { data, error } = await supabase.functions.invoke('efi-create-pix-charge', {
        body: {
          valor: invoice.amount.toFixed(2),
          descricao: `Fatura ${invoice.stores?.name || 'Mostralo'} - ${invoice.plans?.name || 'Assinatura'}`,
          expiracao_segundos: 1800, // 30 minutos
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Erro ao gerar PIX');
      }

      // Atualizar fatura com dados do PIX
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + (data.expiracao || 1800));

      const { error: updateError } = await supabase
        .from('subscription_invoices')
        .update({
          pix_txid: data.txid,
          pix_copia_cola: data.pixCopiaECola,
          pix_qrcode_base64: data.qrCodeBase64,
          pix_expires_at: expiresAt.toISOString(),
        })
        .eq('id', invoice.id);

      if (updateError) {
        console.error('Erro ao salvar dados PIX:', updateError);
      }

      // Atualizar estado local
      setInvoice(prev => prev ? {
        ...prev,
        pix_txid: data.txid,
        pix_copia_cola: data.pixCopiaECola,
        pix_qrcode_base64: data.qrCodeBase64,
        pix_expires_at: expiresAt.toISOString(),
      } : null);

      setTimeRemaining(data.expiracao || 1800);
      toast.success('QR Code PIX gerado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar PIX:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar QR Code PIX');
    } finally {
      setGeneratingPix(false);
    }
  }, [invoice]);

  // Verificar status do pagamento
  const checkPaymentStatus = useCallback(async () => {
    if (!invoice?.pix_txid || invoice.payment_status === 'paid') return;

    setCheckingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('efi-check-pix-status', {
        body: { txid: invoice.pix_txid },
      });

      if (error) {
        console.error('Erro ao verificar status:', error);
        return;
      }

      if (data?.systemStatus === 'paid') {
        // Atualizar fatura como paga
        await supabase
          .from('subscription_invoices')
          .update({
            payment_status: 'paid',
            paid_at: new Date().toISOString(),
            payment_method: 'pix',
          })
          .eq('id', invoice.id);

        setInvoice(prev => prev ? {
          ...prev,
          payment_status: 'paid',
          paid_at: new Date().toISOString(),
        } : null);

        toast.success('Pagamento confirmado!');
      }
    } catch (err) {
      console.error('Erro na verificação:', err);
    } finally {
      setCheckingPayment(false);
    }
  }, [invoice?.pix_txid, invoice?.payment_status, invoice?.id]);

  // Carregar fatura ao montar
  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  // Timer de expiração
  useEffect(() => {
    if (!invoice?.pix_expires_at || invoice.payment_status === 'paid') return;

    const calculateRemaining = () => {
      const expiresAt = new Date(invoice.pix_expires_at!).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeRemaining(remaining);
      return remaining;
    };

    const remaining = calculateRemaining();
    if (remaining <= 0) return;

    const timer = setInterval(() => {
      const rem = calculateRemaining();
      if (rem <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [invoice?.pix_expires_at, invoice?.payment_status]);

  // Polling para verificar pagamento
  useEffect(() => {
    if (!invoice?.pix_txid || invoice.payment_status === 'paid' || timeRemaining <= 0) return;

    const pollInterval = setInterval(checkPaymentStatus, 5000);
    return () => clearInterval(pollInterval);
  }, [invoice?.pix_txid, invoice?.payment_status, timeRemaining, checkPaymentStatus]);

  const handleCopy = async () => {
    if (!invoice?.pix_copia_cola) return;

    try {
      await navigator.clipboard.writeText(invoice.pix_copia_cola);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Erro ao copiar código');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const isExpired = invoice?.pix_expires_at && new Date(invoice.pix_expires_at) < new Date() && invoice.payment_status !== 'paid';
  const hasPix = invoice?.pix_txid && invoice?.pix_copia_cola && !isExpired;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-muted-foreground">Carregando fatura...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <AlertCircle className="w-16 h-16 text-red-500" />
            <h2 className="text-xl font-semibold">Fatura não encontrada</h2>
            <p className="text-muted-foreground text-center">
              O link pode estar incorreto ou a fatura foi removida.
            </p>
            <Link to="/">
              <Button variant="outline">Voltar ao início</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fatura já paga
  if (invoice.payment_status === 'paid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-6 py-12">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-green-600 mb-2">Pagamento Confirmado!</h2>
              <p className="text-muted-foreground">
                Obrigado! Seu pagamento de {formatCurrency(invoice.amount)} foi recebido.
              </p>
            </div>
            {invoice.paid_at && (
              <p className="text-sm text-muted-foreground">
                Pago em {format(new Date(invoice.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6 pt-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500 text-white mb-4">
            <Receipt className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Fatura de Assinatura</h1>
          <p className="text-muted-foreground">Mostralo Plataforma</p>
        </div>

        {/* Dados da Fatura */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5 text-orange-500" />
              Detalhes da Fatura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Store className="w-4 h-4" />
                <span>Loja</span>
              </div>
              <span className="font-medium">{invoice.stores?.name || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Receipt className="w-4 h-4" />
                <span>Plano</span>
              </div>
              <span className="font-medium">{invoice.plans?.name || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Vencimento</span>
              </div>
              <span className="font-medium">
                {format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
            <div className="pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Valor a Pagar</p>
                <p className="text-4xl font-bold text-orange-500">
                  {formatCurrency(invoice.amount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção PIX */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-center">Pagar com PIX</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {/* Gerar QR Code */}
            {!hasPix && !generatingPix && (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Clique no botão abaixo para gerar o QR Code PIX
                </p>
                <Button 
                  onClick={generatePixCharge} 
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Gerar QR Code PIX
                </Button>
              </div>
            )}

            {/* Loading */}
            {generatingPix && (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
              </div>
            )}

            {/* PIX Expirado */}
            {isExpired && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <AlertCircle className="w-12 h-12 text-orange-500" />
                <p className="text-lg font-semibold text-orange-600">QR Code Expirado</p>
                <p className="text-sm text-muted-foreground">
                  O tempo para pagamento expirou. Gere um novo código.
                </p>
                <Button
                  onClick={generatePixCharge}
                  disabled={generatingPix}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Gerar Novo QR Code
                </Button>
              </div>
            )}

            {/* QR Code Ativo */}
            {hasPix && timeRemaining > 0 && (
              <>
                {/* Timer */}
                <div className="flex items-center gap-2 text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-4 py-2 rounded-full">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
                </div>

                {/* QR Code */}
                {invoice.pix_qrcode_base64 && (
                  <div className="p-4 bg-white rounded-lg border shadow-sm">
                    <img
                      src={invoice.pix_qrcode_base64}
                      alt="QR Code PIX"
                      className="w-56 h-56 object-contain"
                    />
                  </div>
                )}

                {/* Instruções */}
                <div className="text-center text-sm text-muted-foreground">
                  <p>Escaneie o QR Code ou copie o código abaixo</p>
                </div>

                {/* Código Copia-Cola */}
                <div className="w-full">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={invoice.pix_copia_cola || ''}
                      className="flex-1 px-3 py-2 text-xs bg-muted rounded-lg truncate"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopy}
                      className={copied ? "text-green-600 border-green-600" : ""}
                    >
                      {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Botão Copiar Grande */}
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copied ? 'Código Copiado!' : 'Copiar Código PIX'}
                </Button>

                {/* Status */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {checkingPayment ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span>Aguardando pagamento...</span>
                </div>

                {/* Verificar Manualmente */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={checkPaymentStatus}
                  disabled={checkingPayment}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${checkingPayment ? 'animate-spin' : ''}`} />
                  Verificar Pagamento
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6 pb-8">
          Pagamento processado por EFI Pay (Gerencianet)
        </p>
      </div>
    </div>
  );
}
