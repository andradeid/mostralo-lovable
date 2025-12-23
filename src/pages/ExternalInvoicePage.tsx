import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Copy, 
  CheckCircle, 
  Clock, 
  Loader2, 
  RefreshCw, 
  AlertCircle,
  User,
  Calendar,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExternalInvoiceData {
  id: string;
  invoice_number: string | null;
  amount: number;
  description: string;
  due_date: string;
  payment_status: string | null;
  paid_at: string | null;
  notes: string | null;
  pix_txid: string | null;
  pix_copia_cola: string | null;
  pix_qrcode_base64: string | null;
  pix_expires_at: string | null;
  client: {
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  service: {
    name: string;
  } | null;
}

interface PixChargeData {
  txid: string;
  pixCopiaECola: string;
  qrCodeBase64: string | null;
  expiracao: number;
}

export default function ExternalInvoicePage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<ExternalInvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chargeData, setChargeData] = useState<PixChargeData | null>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "expired">("pending");
  const [copied, setCopied] = useState(false);

  // Buscar dados da fatura
  const fetchInvoice = useCallback(async () => {
    if (!invoiceId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from("external_invoices")
        .select(`
          id,
          invoice_number,
          amount,
          description,
          due_date,
          payment_status,
          paid_at,
          notes,
          pix_txid,
          pix_copia_cola,
          pix_qrcode_base64,
          pix_expires_at,
          client:external_clients(name, email, phone),
          service:external_services(name)
        `)
        .eq("id", invoiceId)
        .single();

      if (fetchError || !data) {
        setError("Fatura não encontrada");
        return;
      }

      setInvoice(data as unknown as ExternalInvoiceData);
      
      // Se já tem PIX ativo e não expirado, restaurar
      if (data.pix_txid && data.pix_copia_cola && data.pix_expires_at) {
        const expiresAt = new Date(data.pix_expires_at).getTime();
        const now = Date.now();
        const remaining = Math.floor((expiresAt - now) / 1000);
        
        if (remaining > 0) {
          setChargeData({
            txid: data.pix_txid,
            pixCopiaECola: data.pix_copia_cola,
            qrCodeBase64: data.pix_qrcode_base64,
            expiracao: remaining,
          });
          setTimeRemaining(remaining);
        }
      }
      
      // Se já está pago
      if (data.payment_status === "paid") {
        setPaymentStatus("paid");
      }
    } catch (err) {
      console.error("Erro ao buscar fatura:", err);
      setError("Erro ao carregar fatura");
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  // Criar cobrança PIX
  const createCharge = async () => {
    if (!invoice) return;
    
    setIsGeneratingPix(true);
    setPaymentStatus("pending");
    
    try {
      const { data, error } = await supabase.functions.invoke("efi-create-external-invoice-pix", {
        body: {
          invoice_id: invoice.id,
          valor: invoice.amount.toFixed(2),
          descricao: `Fatura ${invoice.invoice_number || invoice.id.slice(0, 8)} - ${invoice.description}`,
          expiracao_segundos: 300,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || "Erro ao criar cobrança");
      }

      setChargeData({
        txid: data.txid,
        pixCopiaECola: data.pixCopiaECola,
        qrCodeBase64: data.qrCodeBase64,
        expiracao: data.expiracao || 300,
      });
      setTimeRemaining(data.expiracao || 300);
      
      // Atualizar invoice local
      setInvoice(prev => prev ? {
        ...prev,
        pix_txid: data.txid,
        pix_copia_cola: data.pixCopiaECola,
        pix_qrcode_base64: data.qrCodeBase64,
      } : null);
    } catch (err) {
      console.error("Erro ao criar cobrança PIX:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao gerar QR Code PIX");
    } finally {
      setIsGeneratingPix(false);
    }
  };

  // Verificar status do pagamento
  const checkPaymentStatus = useCallback(async () => {
    if (!chargeData?.txid || paymentStatus !== "pending") return;

    try {
      const { data, error } = await supabase.functions.invoke("efi-check-pix-status", {
        body: { txid: chargeData.txid },
      });

      if (error) {
        console.error("Erro ao verificar status:", error);
        return;
      }

      if (data?.systemStatus === "paid") {
        // Atualizar fatura como paga
        await supabase
          .from("external_invoices")
          .update({ 
            payment_status: "paid", 
            paid_at: new Date().toISOString(),
            payment_method: "pix"
          })
          .eq("id", invoiceId);
          
        setPaymentStatus("paid");
        toast.success("Pagamento confirmado!");
        
        // Atualizar dados locais
        setInvoice(prev => prev ? { ...prev, payment_status: "paid", paid_at: new Date().toISOString() } : null);
      }
    } catch (err) {
      console.error("Erro na verificação de status:", err);
    }
  }, [chargeData?.txid, paymentStatus, invoiceId]);

  // Countdown timer
  useEffect(() => {
    if (paymentStatus !== "pending" || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setPaymentStatus("expired");
          setChargeData(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentStatus, timeRemaining]);

  // Polling para verificar pagamento
  useEffect(() => {
    if (paymentStatus !== "pending" || !chargeData?.txid) return;

    const pollInterval = setInterval(checkPaymentStatus, 5000);
    return () => clearInterval(pollInterval);
  }, [paymentStatus, chargeData?.txid, checkPaymentStatus]);

  const handleCopy = async () => {
    if (!chargeData?.pixCopiaECola) return;
    
    try {
      await navigator.clipboard.writeText(chargeData.pixCopiaECola);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Erro ao copiar código");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando fatura...</p>
        </div>
      </div>
    );
  }

  // Erro
  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <AlertCircle className="w-16 h-16 text-destructive" />
            <h2 className="text-xl font-semibold">Fatura não encontrada</h2>
            <p className="text-muted-foreground text-center">
              O link pode estar incorreto ou a fatura não existe mais.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Fatura</h1>
          {invoice.invoice_number && (
            <p className="text-muted-foreground">#{invoice.invoice_number}</p>
          )}
        </div>

        {/* Detalhes da Fatura */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cliente */}
            {invoice.client && (
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{invoice.client.name}</p>
                  {invoice.client.email && (
                    <p className="text-sm text-muted-foreground">{invoice.client.email}</p>
                  )}
                </div>
              </div>
            )}

            {/* Serviço/Descrição */}
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                {invoice.service && (
                  <p className="font-medium">{invoice.service.name}</p>
                )}
                <p className="text-sm text-muted-foreground">{invoice.description}</p>
              </div>
            </div>

            {/* Vencimento */}
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Vencimento</p>
                <p className="font-medium">
                  {format(new Date(invoice.due_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            {/* Valor */}
            <div className="flex items-center gap-3 pt-2 border-t">
              <DollarSign className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(invoice.amount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção de Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pagamento PIX</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            {/* Já pago */}
            {(paymentStatus === "paid" || invoice.payment_status === "paid") && (
              <div className="flex flex-col items-center gap-3 py-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <p className="text-lg font-semibold text-green-600">Pagamento Confirmado!</p>
                {invoice.paid_at && (
                  <p className="text-sm text-muted-foreground">
                    Pago em {format(new Date(invoice.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            )}

            {/* Cancelado */}
            {invoice.payment_status === "cancelled" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <p className="text-lg font-semibold text-destructive">Fatura Cancelada</p>
              </div>
            )}

            {/* Pendente - sem PIX gerado */}
            {invoice.payment_status !== "paid" && 
             invoice.payment_status !== "cancelled" && 
             !chargeData && (
              <Button
                onClick={createCharge}
                disabled={isGeneratingPix}
                className="w-full"
                size="lg"
              >
                {isGeneratingPix ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando QR Code...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Gerar QR Code PIX
                  </>
                )}
              </Button>
            )}

            {/* QR Code expirado */}
            {paymentStatus === "expired" && (
              <div className="flex flex-col items-center gap-3 py-4">
                <AlertCircle className="w-12 h-12 text-orange-500" />
                <p className="text-lg font-semibold text-orange-600">QR Code Expirado</p>
                <p className="text-sm text-muted-foreground text-center">
                  O tempo para pagamento expirou. Gere um novo código.
                </p>
                <Button onClick={createCharge} disabled={isGeneratingPix}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Gerar Novo QR Code
                </Button>
              </div>
            )}

            {/* QR Code ativo */}
            {paymentStatus === "pending" && chargeData && (
              <>
                {/* Timer */}
                <div className="flex items-center gap-2 text-orange-600 bg-orange-50 dark:bg-orange-950/50 px-4 py-2 rounded-full">
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
                </div>

                {/* QR Code */}
                {chargeData.qrCodeBase64 && (
                  <div className="p-4 bg-white rounded-lg border">
                    <img
                      src={chargeData.qrCodeBase64}
                      alt="QR Code PIX"
                      className="w-48 h-48 object-contain"
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
                      value={chargeData.pixCopiaECola}
                      className="flex-1 px-3 py-2 text-xs bg-muted rounded-lg truncate border"
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

                {/* Status */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Aguardando pagamento...</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Notas */}
        {invoice.notes && (
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
