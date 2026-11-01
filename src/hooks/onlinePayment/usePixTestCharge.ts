// PIX de teste da tela Pagamento Online: gerar cobrança, consultar o pagamento a
// cada 5 s, contagem regressiva de 5 min, copiar código e guia do split.
// Código movido da StoreOnlinePaymentPage sem mudança.
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { useToast } from "@/hooks/use-toast";

interface Params {
  storeId: string | null;
  toast: ReturnType<typeof useToast>['toast'];
}

export function usePixTestCharge({ storeId, toast }: Params) {
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

  // Payment verification state
  const [testPaymentStatus, setTestPaymentStatus] = useState<"pending" | "paid" | "expired">("pending");
  const [testTimeRemaining, setTestTimeRemaining] = useState(0);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Split guide state - shows when split fails
  const [showSplitGuide, setShowSplitGuide] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência.`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Check payment status function
  const checkTestPaymentStatus = useCallback(async () => {
    if (!testResult?.txid || testPaymentStatus !== "pending") return;

    setCheckingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke("efi-check-pix-status", {
        body: { txid: testResult.txid },
      });

      if (error) throw error;

      if (data?.systemStatus === "paid") {
        setTestPaymentStatus("paid");
        toast({
          title: "✅ Pagamento Confirmado!",
          description: "O teste PIX foi pago com sucesso.",
        });
      }
    } catch (error) {
      console.error("Erro ao verificar status:", error);
    } finally {
      setCheckingStatus(false);
    }
  }, [testResult?.txid, testPaymentStatus, toast]);

  // Polling effect for payment status check (every 5 seconds)
  useEffect(() => {
    if (!testResult?.txid || testPaymentStatus !== "pending") return;

    const pollInterval = setInterval(checkTestPaymentStatus, 5000);
    return () => clearInterval(pollInterval);
  }, [testResult?.txid, testPaymentStatus, checkTestPaymentStatus]);

  // Countdown timer effect
  useEffect(() => {
    if (!testResult || testPaymentStatus !== "pending" || testTimeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTestTimeRemaining(prev => {
        if (prev <= 1) {
          setTestPaymentStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testResult, testPaymentStatus, testTimeRemaining]);

  const handleCreateTestCharge = async () => {
    if (!storeId) return;

    setTestLoading(true);
    setTestResult(null);
    setTestPaymentStatus("pending");
    setTestTimeRemaining(0);

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

        // Set timer (5 minutes = 300 seconds)
        setTestTimeRemaining(300);
        setTestPaymentStatus("pending");

        // Show split guide if split failed
        if (data.splitWarning || !data.splitApplied) {
          setShowSplitGuide(true);
          toast({
            title: "⚠️ Cobrança criada sem split",
            description: "O split de pagamento não foi aplicado. Veja o guia para configurar.",
            variant: "default",
          });
        } else {
          setShowSplitGuide(false);
          toast({
            title: "✅ Cobrança criada!",
            description: "QR Code com split payment gerado com sucesso!",
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

  return {
    testValue,
    setTestValue,
    testDescription,
    setTestDescription,
    testLoading,
    testResult,
    setTestResult,
    copied,
    testPaymentStatus,
    setTestPaymentStatus,
    testTimeRemaining,
    setTestTimeRemaining,
    checkingStatus,
    showSplitGuide,
    setShowSplitGuide,
    copyToClipboard,
    handleCreateTestCharge,
  };
}

export type PixTestCharge = ReturnType<typeof usePixTestCharge>;
