import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, Copy, RefreshCw, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface InvoiceData {
  status: string;
  invoice_id: string;
  amount: number;
  pix_copia_cola?: string;
  pix_qrcode_base64?: string;
  pix_expires_at?: string;
  description?: string;
  contact_name?: string;
  due_date?: string;
  paid?: boolean;
}

export default function SubscriptionPaymentPage() {
  const { token } = useParams<{ token: string }>();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isPaid, setIsPaid] = useState(false);

  // Gerar/buscar PIX
  const fetchOrGeneratePix = useCallback(async () => {
    if (!token) return;
    setGenerating(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'generate-subscription-invoice-pix',
        { body: { token } }
      );

      if (fnError) throw fnError;

      if (data?.paid || data?.status === 'paid') {
        setIsPaid(true);
        setInvoice(data);
      } else {
        setInvoice(data);
      }
    } catch (err: any) {
      console.error('Erro ao gerar PIX:', err);
      setError(err?.message || 'Erro ao carregar dados de pagamento');
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  }, [token]);

  // Polling de status a cada 5s
  useEffect(() => {
    if (!token || isPaid) return;

    const interval = setInterval(async () => {
      try {
        const { data } = await supabase.functions.invoke(
          'check-subscription-invoice-status',
          { body: { token } }
        );
        if (data?.paid) {
          setIsPaid(true);
          clearInterval(interval);
        }
      } catch {
        // Silencioso
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [token, isPaid]);

  // Timer de expiração
  useEffect(() => {
    if (!invoice?.pix_expires_at || isPaid) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expires = new Date(invoice.pix_expires_at!).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft("Expirado");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [invoice?.pix_expires_at, isPaid]);

  // Carregar na montagem
  useEffect(() => {
    fetchOrGeneratePix();
  }, [fetchOrGeneratePix]);

  const copyPixCode = () => {
    if (invoice?.pix_copia_cola) {
      navigator.clipboard.writeText(invoice.pix_copia_cola);
      toast.success("Código PIX copiado!");
    }
  };

  const formattedAmount = invoice?.amount
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(invoice.amount)
    : '';

  // Tela de sucesso
  if (isPaid) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center shadow-xl border-green-200">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-800">Pagamento Confirmado!</h1>
            <p className="text-green-600 text-lg">{formattedAmount}</p>
            <p className="text-muted-foreground text-sm">
              Sua assinatura foi renovada com sucesso. Obrigado!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 to-white">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto" />
          <p className="text-muted-foreground">Preparando seu pagamento...</p>
        </div>
      </div>
    );
  }

  // Erro
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-red-50 to-white">
        <Card className="max-w-md w-full text-center shadow-xl">
          <CardContent className="pt-8 pb-8 space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h1 className="text-xl font-bold text-red-800">Erro</h1>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchOrGeneratePix} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = timeLeft === "Expirado";

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-2">
            <span className="text-2xl">🧡</span>
          </div>
          <CardTitle className="text-xl">Pagamento de Assinatura</CardTitle>
          {invoice?.description && (
            <p className="text-sm text-muted-foreground mt-1">{invoice.description}</p>
          )}
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Valor */}
          <div className="text-center">
            <p className="text-3xl font-bold text-orange-600">{formattedAmount}</p>
            {invoice?.contact_name && (
              <p className="text-sm text-muted-foreground mt-1">{invoice.contact_name}</p>
            )}
          </div>

          {/* Timer */}
          {!isExpired && invoice?.pix_expires_at && (
            <div className="flex items-center justify-center gap-2 text-sm bg-orange-50 rounded-lg py-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-orange-700">Expira em <strong>{timeLeft}</strong></span>
            </div>
          )}

          {/* QR Code */}
          {!isExpired && invoice?.pix_qrcode_base64 && (
            <div className="flex justify-center">
              <img
                src={invoice.pix_qrcode_base64}
                alt="QR Code PIX"
                className="w-56 h-56 rounded-lg border"
              />
            </div>
          )}

          {/* Botão copiar */}
          {!isExpired && invoice?.pix_copia_cola && (
            <Button
              onClick={copyPixCode}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 text-base"
            >
              <Copy className="w-5 h-5 mr-2" />
              Copiar código PIX
            </Button>
          )}

          {/* Expirado - regenerar */}
          {isExpired && (
            <div className="text-center space-y-3">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-medium">Código PIX expirado</p>
                <p className="text-yellow-600 text-sm mt-1">Clique abaixo para gerar um novo código</p>
              </div>
              <Button
                onClick={fetchOrGeneratePix}
                disabled={generating}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12"
              >
                {generating ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5 mr-2" />
                )}
                Gerar novo código PIX
              </Button>
            </div>
          )}

          {/* Instruções */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium">Como pagar:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Copie o código PIX acima</li>
              <li>Abra o app do seu banco</li>
              <li>Vá em <strong>Pix → Copia e Cola</strong></li>
              <li>Cole o código e confirme</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-2">
              ✅ O pagamento é confirmado automaticamente
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
