import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  QrCode,
  Barcode,
  Download,
  ExternalLink,
  Store,
  Receipt,
  Shield
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
  boleto_codigo_barras: string | null;
  boleto_linha_digitavel: string | null;
  boleto_pdf_url: string | null;
  boleto_view_url: string | null;
  boleto_expires_at: string | null;
  client: {
    name: string;
    email: string | null;
    phone: string | null;
    document: string | null;
    address_street: string | null;
    address_number: string | null;
    address_neighborhood: string | null;
    address_city: string | null;
    address_state: string | null;
    address_zipcode: string | null;
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

interface BoletoData {
  codigo_barras: string;
  linha_digitavel: string;
  view_url: string; // billet_link - página de visualização (visualizacao.gerencianet.com.br)
  pdf_url: string;  // link direto do PDF (download.sejaefi.com.br)
  expires_at: string;
}

export default function ExternalInvoicePage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<ExternalInvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chargeData, setChargeData] = useState<PixChargeData | null>(null);
  const [boletoData, setBoletoData] = useState<BoletoData | null>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [isGeneratingBoleto, setIsGeneratingBoleto] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "paid" | "expired">("pending");
  const [copied, setCopied] = useState(false);
  const [copiedBoleto, setCopiedBoleto] = useState(false);
  const [activeTab, setActiveTab] = useState<"pix" | "boleto">("pix");

  // Buscar dados da fatura
  const fetchInvoice = useCallback(async () => {
    if (!invoiceId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Usar edge function para buscar dados completos (inclui cliente via service_role)
      const { data, error: fetchError } = await supabase.functions.invoke('get-external-invoice', {
        body: { invoice_id: invoiceId }
      });

      if (fetchError || !data?.invoice) {
        console.error("Erro ao buscar fatura:", fetchError);
        setError("Fatura não encontrada");
        return;
      }

      const invoiceData = data.invoice as ExternalInvoiceData;
      setInvoice(invoiceData);
      
      // Se já tem PIX ativo e não expirado, restaurar
      if (invoiceData.pix_txid && invoiceData.pix_copia_cola && invoiceData.pix_expires_at) {
        const expiresAt = new Date(invoiceData.pix_expires_at).getTime();
        const now = Date.now();
        const remaining = Math.floor((expiresAt - now) / 1000);
        
        if (remaining > 0) {
          setChargeData({
            txid: invoiceData.pix_txid,
            pixCopiaECola: invoiceData.pix_copia_cola,
            qrCodeBase64: invoiceData.pix_qrcode_base64,
            expiracao: remaining,
          });
          setTimeRemaining(remaining);
        }
      }

      // Se já tem Boleto gerado, restaurar (com validação para evitar dados incorretos)
      // Verificar se a linha digitável não é um código PIX
      const isValidBoleto = invoiceData.boleto_linha_digitavel && 
        !invoiceData.boleto_linha_digitavel.includes('BR.GOV.BCB.PIX') &&
        !invoiceData.boleto_linha_digitavel.startsWith('000201') &&
        (invoiceData.boleto_view_url || invoiceData.boleto_pdf_url);
      
      if (isValidBoleto) {
        setBoletoData({
          codigo_barras: invoiceData.boleto_codigo_barras || '',
          linha_digitavel: invoiceData.boleto_linha_digitavel,
          view_url: invoiceData.boleto_view_url || invoiceData.boleto_pdf_url || '',
          pdf_url: invoiceData.boleto_pdf_url || invoiceData.boleto_view_url || '',
          expires_at: invoiceData.boleto_expires_at || invoiceData.due_date,
        });
      }
      
      // Se já está pago
      if (invoiceData.payment_status === "paid") {
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
  const createPixCharge = async () => {
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
        throw new Error(data?.error || error?.message || "Erro ao criar cobrança PIX");
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

  // Criar cobrança Boleto (ou segunda via)
  const createBoletoCharge = async () => {
    if (!invoice) return;
    
    setIsGeneratingBoleto(true);
    // Limpar boleto antigo antes de gerar novo (segunda via)
    setBoletoData(null);
    try {
      const clienteData: any = {
        nome: invoice.client?.name || "Cliente",
      };

      // Documento (CPF/CNPJ)
      if (invoice.client?.document) {
        const doc = invoice.client.document.replace(/\D/g, '');
        if (doc.length === 11) {
          clienteData.cpf = doc;
        } else if (doc.length === 14) {
          clienteData.cnpj = doc;
        }
      }

      // Endereço
      if (invoice.client?.address_street) {
        clienteData.endereco = {
          logradouro: invoice.client.address_street,
          numero: invoice.client.address_number || 'S/N',
          bairro: invoice.client.address_neighborhood || 'Centro',
          cidade: invoice.client.address_city || 'São Paulo',
          uf: invoice.client.address_state || 'SP',
          cep: invoice.client.address_zipcode?.replace(/\D/g, '') || '01310100',
        };
      }

      const { data, error } = await supabase.functions.invoke("efi-create-external-invoice-boleto", {
        body: {
          invoice_id: invoice.id,
          valor: invoice.amount.toFixed(2),
          descricao: `Fatura ${invoice.invoice_number || invoice.id.slice(0, 8)} - ${invoice.description}`,
          vencimento: invoice.due_date,
          cliente: clienteData,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || "Erro ao criar boleto");
      }

      setBoletoData({
        codigo_barras: data.codigo_barras,
        linha_digitavel: data.linha_digitavel,
        view_url: data.view_url || data.billet_link || '',
        pdf_url: data.pdf_url || '',
        expires_at: data.expires_at,
      });
      
      // Atualizar invoice local
      setInvoice(prev => prev ? {
        ...prev,
        boleto_codigo_barras: data.codigo_barras,
        boleto_linha_digitavel: data.linha_digitavel,
        boleto_pdf_url: data.pdf_url,
        boleto_view_url: data.view_url || data.billet_link,
        boleto_expires_at: data.expires_at,
      } : null);

      toast.success("Boleto gerado com sucesso!");
    } catch (err) {
      console.error("Erro ao criar boleto:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao gerar boleto");
    } finally {
      setIsGeneratingBoleto(false);
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
        // Atualizar fatura como paga via edge function (bypassa RLS)
        const { error: updateError } = await supabase.functions.invoke("update-external-invoice-status", {
          body: {
            invoice_id: invoiceId,
            payment_status: "paid",
            payment_method: "pix",
          },
        });

        if (updateError) {
          console.error("Erro ao atualizar status:", updateError);
        }
          
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

  const handleCopyPix = async () => {
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

  const handleCopyBoleto = async () => {
    if (!boletoData?.linha_digitavel) return;
    
    try {
      await navigator.clipboard.writeText(boletoData.linha_digitavel);
      setCopiedBoleto(true);
      toast.success("Linha digitável copiada!");
      setTimeout(() => setCopiedBoleto(false), 3000);
    } catch {
      toast.error("Erro ao copiar linha digitável");
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-card border rounded-xl shadow-lg overflow-hidden w-full max-w-md">
          <div className="bg-primary text-primary-foreground p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
            </div>
            <h1 className="text-xl font-bold">MOSTRALO</h1>
            <p className="text-sm text-primary-foreground/80">Plataforma de Vendas Online</p>
          </div>
          <div className="flex flex-col items-center gap-4 py-12 px-6">
            <AlertCircle className="w-16 h-16 text-destructive" />
            <h2 className="text-xl font-semibold">Fatura não encontrada</h2>
            <p className="text-muted-foreground text-center">
              O link pode estar incorreto ou a fatura não existe mais.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isPaid = paymentStatus === "paid" || invoice.payment_status === "paid";
  const isCancelled = invoice.payment_status === "cancelled";

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Card Principal com identidade visual do recibo */}
        <div className="bg-card border rounded-xl shadow-lg overflow-hidden">
          {/* Header Laranja MOSTRALO */}
          <div className="bg-primary text-primary-foreground p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
            </div>
            <h1 className="text-xl font-bold">MOSTRALO</h1>
            <p className="text-sm text-primary-foreground/80">Plataforma de Vendas Online</p>
          </div>

          {/* Título da Fatura */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border-b p-4 text-center">
            <div className="inline-flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <FileText className="w-5 h-5" />
              <span className="font-semibold text-lg">FATURA</span>
            </div>
            {invoice.invoice_number && (
              <p className="text-sm text-muted-foreground mt-1">#{invoice.invoice_number}</p>
            )}
          </div>

          {/* Conteúdo - Detalhes */}
          <div className="p-6 space-y-4">
            {/* Número da Fatura */}
            <div className="text-center pb-4 border-b border-dashed">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Nº da Fatura</p>
              <p className="font-mono text-lg font-bold text-foreground">
                {invoice.invoice_number || invoice.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            {/* Detalhes em duas colunas */}
            <div className="space-y-3">
              {/* Cliente */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span className="text-sm">Cliente</span>
                </div>
                <span className="font-medium text-foreground">{invoice.client?.name || 'N/A'}</span>
              </div>

              {/* Serviço */}
              {invoice.service && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Receipt className="w-4 h-4" />
                    <span className="text-sm">Serviço</span>
                  </div>
                  <span className="font-medium text-foreground">{invoice.service.name}</span>
                </div>
              )}

              {/* Descrição */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">Descrição</span>
                </div>
                <span className="font-medium text-foreground text-right max-w-[60%]">{invoice.description}</span>
              </div>

              {/* Vencimento */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Vencimento</span>
                </div>
                <span className="font-medium text-foreground">
                  {format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>

            {/* Valor em destaque */}
            <div className="pt-4 border-t">
              <div className="bg-primary/10 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Valor</p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(invoice.amount)}
                </p>
              </div>
            </div>
          </div>

          {/* Seção de Pagamento */}
          <div className="border-t p-6">
            <div className="flex flex-col items-center gap-4">
              {/* Já pago */}
              {isPaid && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <p className="text-lg font-semibold text-green-600">Pagamento Confirmado!</p>
                  {invoice.paid_at && (
                    <p className="text-sm text-muted-foreground">
                      Pago em {format(new Date(invoice.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
              )}

              {/* Cancelado */}
              {isCancelled && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-destructive" />
                  </div>
                  <p className="text-lg font-semibold text-destructive">Fatura Cancelada</p>
                </div>
              )}

              {/* Pendente - Tabs PIX/Boleto */}
              {!isPaid && !isCancelled && (
                <div className="w-full">
                  <p className="text-center font-medium mb-4">Escolha a forma de pagamento</p>
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "pix" | "boleto")} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="pix" className="flex items-center gap-2">
                        <QrCode className="w-4 h-4" />
                        PIX
                      </TabsTrigger>
                      <TabsTrigger value="boleto" className="flex items-center gap-2">
                        <Barcode className="w-4 h-4" />
                        Boleto
                      </TabsTrigger>
                    </TabsList>

                    {/* Aba PIX */}
                    <TabsContent value="pix" className="flex flex-col items-center gap-4 mt-4">
                      {/* PIX não gerado */}
                      {!chargeData && (
                        <Button
                          onClick={createPixCharge}
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
                              <QrCode className="w-4 h-4 mr-2" />
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
                          <Button onClick={createPixCharge} disabled={isGeneratingPix}>
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
                                onClick={handleCopyPix}
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
                    </TabsContent>

                    {/* Aba Boleto */}
                    <TabsContent value="boleto" className="flex flex-col items-center gap-4 mt-4">
                      {/* Verificar se boleto está vencido */}
                      {(() => {
                        const isBoletoExpired = boletoData && new Date(boletoData.expires_at) < new Date();
                        const showGenerateButton = !boletoData || isBoletoExpired;
                        
                        return (
                          <>
                            {/* Boleto vencido - Mostrar aviso */}
                            {isBoletoExpired && (
                              <div className="w-full p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                  <span className="text-sm">
                                    Este boleto venceu em {format(new Date(boletoData.expires_at), "dd/MM/yyyy", { locale: ptBR })}. Gere uma segunda via.
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Boleto não gerado ou vencido */}
                            {showGenerateButton && (
                              <Button
                                onClick={createBoletoCharge}
                                disabled={isGeneratingBoleto}
                                className="w-full"
                                size="lg"
                              >
                                {isGeneratingBoleto ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {isBoletoExpired ? "Gerando Segunda Via..." : "Gerando Boleto..."}
                                  </>
                                ) : (
                                  <>
                                    <Barcode className="w-4 h-4 mr-2" />
                                    {isBoletoExpired ? "Gerar Segunda Via" : "Gerar Boleto"}
                                  </>
                                )}
                              </Button>
                            )}

                            {/* Boleto gerado e válido */}
                            {boletoData && !isBoletoExpired && (
                              <>
                                {/* Vencimento */}
                                <div className="flex items-center gap-2 text-muted-foreground bg-muted px-4 py-2 rounded-full">
                                  <Calendar className="w-4 h-4" />
                                  <span className="text-sm">
                                    Vencimento: {format(new Date(boletoData.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                                  </span>
                                </div>

                                {/* Ícone de sucesso */}
                                <div className="p-6 bg-muted/50 rounded-lg border">
                                  <Barcode className="w-24 h-24 text-muted-foreground" />
                                </div>

                                {/* Linha Digitável */}
                                <div className="w-full space-y-2">
                                  <p className="text-sm font-medium text-center">Linha Digitável</p>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      readOnly
                                      value={boletoData.linha_digitavel}
                                      className="flex-1 px-3 py-2 text-xs bg-muted rounded-lg truncate border font-mono"
                                    />
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={handleCopyBoleto}
                                      className={copiedBoleto ? "text-green-600 border-green-600" : ""}
                                    >
                                      {copiedBoleto ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                  </div>
                                </div>

                                {/* Botão de ação */}
                                <Button
                                  className="w-full"
                                  onClick={() => window.open(boletoData.view_url, '_blank')}
                                  disabled={!boletoData.view_url}
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Ver Boleto e Baixar PDF
                                </Button>

                                {/* Instrução */}
                                <p className="text-xs text-muted-foreground text-center">
                                  Após o pagamento, a confirmação pode levar até 3 dias úteis.
                                </p>
                              </>
                            )}
                          </>
                        );
                      })()}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </div>
          </div>

          {/* Notas */}
          {invoice.notes && (
            <div className="border-t p-4 bg-muted/30">
              <p className="text-sm text-muted-foreground">{invoice.notes}</p>
            </div>
          )}

          {/* Footer - Authenticity Seal */}
          <div className="bg-muted/50 border-t p-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span className="text-xs">
                Documento gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-1">
              Mostralo - Plataforma de Vendas Online
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
