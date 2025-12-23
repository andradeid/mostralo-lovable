import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { ExternalReceiptCard } from "@/components/external-invoice/ExternalReceiptCard";
import { ExternalReceiptActions } from "@/components/external-invoice/ExternalReceiptActions";

interface ExternalInvoiceData {
  id: string;
  invoice_number: string | null;
  description: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  payment_status: string;
  payment_method: string | null;
  is_recurring: boolean | null;
  recurrence_type: string | null;
  recurrence_current: number | null;
  recurrence_count: number | null;
  pix_copia_cola: string | null;
  boleto_linha_digitavel: string | null;
  external_clients: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    document: string | null;
  } | null;
  external_services: {
    id: string;
    name: string;
  } | null;
}

export default function ExternalInvoiceReceipt() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<ExternalInvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) return;

      try {
        const { data, error } = await supabase.functions.invoke('get-external-invoice-receipt', {
          body: { invoice_id: invoiceId },
        });

        if (error) throw error;

        const receiptInvoice = (data as { invoice?: ExternalInvoiceData })?.invoice;

        if (!receiptInvoice) {
          setError('Fatura não encontrada');
          return;
        }

        // Se por algum motivo não vier paga, redireciona para pagamento
        if (receiptInvoice.payment_status !== 'paid') {
          navigate(`/external-invoice/${invoiceId}`);
          return;
        }

        setInvoice(receiptInvoice);
      } catch (err) {
        console.error('Erro ao buscar recibo:', err);
        setError('Recibo não encontrado');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <p className="text-muted-foreground">Carregando recibo...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <AlertCircle className="w-16 h-16 text-red-500" />
            <h2 className="text-xl font-semibold">Recibo não encontrado</h2>
            <p className="text-muted-foreground text-center">
              O link pode estar incorreto ou a fatura não está disponível.
            </p>
            <Link to="/">
              <Button variant="outline">Voltar ao início</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-md mx-auto pt-4 pb-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {/* Receipt Card */}
        <div ref={receiptRef}>
          <ExternalReceiptCard invoice={invoice} />
        </div>

        {/* Actions */}
        <div className="mt-6">
          <ExternalReceiptActions receiptRef={receiptRef} invoice={invoice} />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Mostralo - Plataforma de Vendas Online
        </p>
      </div>
    </div>
  );
}
