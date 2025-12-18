import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, Clock, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PixPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  orderId: string | null;
  amount: number;
  description: string;
  onPaymentConfirmed: () => void;
  onPaymentExpired: () => void;
  primaryColor?: string;
}

interface PixChargeData {
  txid: string;
  pixCopiaECola: string;
  qrCodeBase64: string | null;
  expiracao: number;
}

export function PixPaymentModal({
  open,
  onOpenChange,
  storeId,
  orderId,
  amount,
  description,
  onPaymentConfirmed,
  onPaymentExpired,
  primaryColor = "#8B5CF6",
}: PixPaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [chargeData, setChargeData] = useState<PixChargeData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "expired">("pending");
  const [copied, setCopied] = useState(false);

  // Criar cobrança PIX
  const createCharge = useCallback(async () => {
    if (!orderId) return;
    
    setIsLoading(true);
    setPaymentStatus("pending");
    
    try {
      const { data, error } = await supabase.functions.invoke("efi-create-pix-charge", {
        body: {
          valor: amount.toFixed(2),
          descricao: description,
          expiracao_segundos: 300, // 5 minutos
          store_id: storeId,
          order_id: orderId, // Passa orderId para a Edge Function salvar o txid
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || "Erro ao criar cobrança");
      }

      // TXID é salvo no pedido pela Edge Function (bypass RLS)

      setChargeData({
        txid: data.txid,
        pixCopiaECola: data.pixCopiaECola,
        qrCodeBase64: data.qrCodeBase64,
        expiracao: data.expiracao || 300,
      });
      setTimeRemaining(data.expiracao || 300);
    } catch (error) {
      console.error("Erro ao criar cobrança PIX:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao gerar QR Code PIX");
    } finally {
      setIsLoading(false);
    }
  }, [amount, description, storeId, orderId]);

  // Verificar status do pagamento
  const checkPaymentStatus = useCallback(async () => {
    if (!chargeData?.txid || paymentStatus !== "pending" || !orderId) return;

    try {
      const { data, error } = await supabase.functions.invoke("efi-check-pix-status", {
        body: { txid: chargeData.txid },
      });

      if (error) {
        console.error("Erro ao verificar status:", error);
        return;
      }

      if (data?.systemStatus === "paid") {
        console.log("[PixPaymentModal] Pagamento detectado como pago, chamando confirm-pix-payment...");
        
        // Chamar Edge Function para confirmar e atualizar pedido (bypass RLS)
        const { data: confirmData, error: confirmError } = await supabase.functions.invoke("confirm-pix-payment", {
          body: { orderId, txid: chargeData.txid },
        });

        if (confirmError || !confirmData?.success) {
          console.error("Erro ao confirmar pagamento:", confirmError || confirmData?.error);
          // Mesmo com erro, se EFI confirmou, mostramos sucesso para o cliente
        }

        console.log("[PixPaymentModal] Pedido atualizado com sucesso!");
        setPaymentStatus("paid");
        toast.success("Pagamento confirmado!");
        onPaymentConfirmed();
      }
    } catch (error) {
      console.error("Erro na verificação de status:", error);
    }
  }, [chargeData?.txid, paymentStatus, orderId, onPaymentConfirmed]);

  // Criar cobrança ao abrir modal
  useEffect(() => {
    if (open && orderId && !chargeData && !isLoading) {
      createCharge();
    }
  }, [open, orderId, chargeData, isLoading, createCharge]);

  // Countdown timer
  useEffect(() => {
    if (!open || paymentStatus !== "pending" || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setPaymentStatus("expired");
          onPaymentExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, paymentStatus, timeRemaining, onPaymentExpired]);

  // Polling para verificar pagamento
  useEffect(() => {
    if (!open || paymentStatus !== "pending" || !chargeData?.txid) return;

    const pollInterval = setInterval(checkPaymentStatus, 5000);
    return () => clearInterval(pollInterval);
  }, [open, paymentStatus, chargeData?.txid, checkPaymentStatus]);

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      setChargeData(null);
      setTimeRemaining(0);
      setPaymentStatus("pending");
      setCopied(false);
    }
  }, [open]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Pagamento via PIX</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {/* Valor */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Valor a pagar</p>
            <p className="text-2xl font-bold" style={{ color: primaryColor }}>
              {formatCurrency(amount)}
            </p>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
              <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
            </div>
          )}

          {/* Pagamento Confirmado */}
          {paymentStatus === "paid" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <p className="text-lg font-semibold text-green-600">Pagamento Confirmado!</p>
              <p className="text-sm text-muted-foreground">Seu pedido está sendo processado</p>
            </div>
          )}

          {/* Pagamento Expirado */}
          {paymentStatus === "expired" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <AlertCircle className="w-12 h-12 text-orange-500" />
              <p className="text-lg font-semibold text-orange-600">QR Code Expirado</p>
              <p className="text-sm text-muted-foreground text-center">
                O tempo para pagamento expirou. Gere um novo código.
              </p>
              <Button
                onClick={createCharge}
                disabled={isLoading}
                style={{ backgroundColor: primaryColor }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Gerar Novo QR Code
              </Button>
            </div>
          )}

          {/* QR Code e Copia-Cola */}
          {!isLoading && paymentStatus === "pending" && chargeData && (
            <>
              {/* Timer */}
              <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-2 rounded-full">
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

              {/* Status */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Aguardando pagamento...</span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
