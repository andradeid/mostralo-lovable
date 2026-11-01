import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { formatCurrency } from "@/utils/driverEarnings";
import { RECEIPT_BUCKETS, storagePathFrom } from "@/lib/privateFiles";
import { downloadPrivateFile } from "@/hooks/useSignedUrl";
import { PrivateFilePreview } from "@/components/shared/PrivateFile";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PaymentReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  earningId: string;
}

interface EarningDetail {
  id: string;
  order_id: string;
  delivery_fee: number;
  earnings_amount: number;
  delivered_at: string;
  order_number?: string;
}

interface PaymentDetails {
  driver_name: string;
  payment_reference: string;
  paid_at: string;
  payment_receipt_url: string;
  total_amount: number;
  earnings: EarningDetail[];
}

export function PaymentReceiptDialog({
  open,
  onOpenChange,
  earningId,
}: PaymentReceiptDialogProps) {
  const [loading, setLoading] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);

  useEffect(() => {
    if (open && earningId) {
      fetchPaymentDetails();
    }
  }, [open, earningId]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);

      // Buscar o earning base para pegar payment_reference e paid_at
      const { data: baseEarning, error: baseError } = await supabase
        .from("driver_earnings")
        .select("payment_reference, paid_at, driver_id, payment_receipt_url")
        .eq("id", earningId)
        .single();

      if (baseError) throw baseError;

      if (!baseEarning.payment_reference || !baseEarning.paid_at) {
        toast.error("Pagamento sem referência ou data");
        return;
      }

      // Buscar todos os earnings com mesma referência e data
      const { data: earnings, error: earningsError } = await supabase
        .from("driver_earnings")
        .select(`
          id,
          order_id,
          delivery_fee,
          earnings_amount,
          delivered_at
        `)
        .eq("payment_reference", baseEarning.payment_reference)
        .eq("paid_at", baseEarning.paid_at)
        .eq("driver_id", baseEarning.driver_id)
        .eq("payment_status", "paid")
        .order("delivered_at", { ascending: false });

      if (earningsError) throw earningsError;

      // Buscar os números dos pedidos
      const orderIds = earnings.map((e) => e.order_id);
      const { data: orders } = await supabase
        .from("orders")
        .select("id, order_number")
        .in("id", orderIds);

      const orderMap = new Map(orders?.map((o) => [o.id, o.order_number]) || []);

      // Buscar nome do motorista
      const { data: driver } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", baseEarning.driver_id)
        .single();

      const earningsWithOrderNumber = earnings.map((e) => ({
        ...e,
        order_number: orderMap.get(e.order_id),
      }));

      const totalAmount = earnings.reduce((sum, e) => sum + Number(e.earnings_amount), 0);

      setPaymentDetails({
        driver_name: driver?.full_name || "Motorista",
        payment_reference: baseEarning.payment_reference,
        paid_at: baseEarning.paid_at,
        payment_receipt_url: baseEarning.payment_receipt_url,
        total_amount: totalAmount,
        earnings: earningsWithOrderNumber,
      });
    } catch (error) {
      console.error("Erro ao buscar detalhes do pagamento:", error);
      toast.error("Erro ao carregar detalhes do pagamento");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!paymentDetails?.payment_receipt_url) return;

    try {
      const value = paymentDetails.payment_receipt_url;
      const ext = (storagePathFrom(value, RECEIPT_BUCKETS.payment) || value).split(/[?#]/)[0].split('.').pop() || 'pdf';
      const ok = await downloadPrivateFile(value, RECEIPT_BUCKETS.payment, `comprovante_${paymentDetails.payment_reference}.${ext}`);
      if (!ok) throw new Error('download failed');
      toast.success("Comprovante baixado com sucesso!");
    } catch (error) {
      console.error('Erro ao baixar comprovante:', error);
      toast.error("Erro ao baixar o arquivo");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">🧾 Comprovante de Pagamento</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : paymentDetails ? (
          <div className="space-y-6">
            {/* Informações do Pagamento */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Entregador</p>
                  <p className="font-medium">{paymentDetails.driver_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data do Pagamento</p>
                  <p className="font-medium">
                    {format(new Date(paymentDetails.paid_at), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Referência</p>
                  <p className="font-medium">{paymentDetails.payment_reference}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="font-bold text-lg text-primary">
                    {formatCurrency(paymentDetails.total_amount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Comprovante */}
            {paymentDetails.payment_receipt_url && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Comprovante</h3>
                  <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Baixar Comprovante
                  </Button>
                </div>

                <div className="border rounded-lg overflow-hidden bg-muted/30">
                  <PrivateFilePreview
                    value={paymentDetails.payment_receipt_url}
                    bucket={RECEIPT_BUCKETS.payment}
                    alt="Comprovante de pagamento"
                    imageClassName="w-full h-auto max-h-96 object-contain"
                    documentLabel="Arquivo PDF"
                  />
                </div>
              </div>
            )}

            {/* Lista de Entregas */}
            <div className="space-y-3">
              <h3 className="font-semibold">
                📦 Entregas Pagas ({paymentDetails.earnings.length})
              </h3>

              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Pedido</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Data de Entrega</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Taxa de Entrega</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Ganho</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paymentDetails.earnings.map((earning) => (
                        <tr key={earning.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 text-sm font-medium">
                            #{earning.order_number || "..."}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {format(new Date(earning.delivered_at), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {formatCurrency(Number(earning.delivery_fee))}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-medium">
                            {formatCurrency(Number(earning.earnings_amount))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted font-bold">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-sm text-right">
                          Total:
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-primary">
                          {formatCurrency(paymentDetails.total_amount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
