import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Store, Calendar, Receipt, Shield } from "lucide-react";

interface ReceiptCardProps {
  invoice: {
    id: string;
    amount: number;
    paid_at: string | null;
    due_date: string;
    stores: { name: string } | null;
    plans: { name: string } | null;
  };
}

export function ReceiptCard({ invoice }: ReceiptCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const receiptNumber = invoice.id.slice(0, 8).toUpperCase();

  return (
    <div className="bg-card border rounded-xl shadow-lg overflow-hidden print:shadow-none">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
        </div>
        <h1 className="text-xl font-bold">MOSTRALO</h1>
        <p className="text-sm text-primary-foreground/80">Plataforma de Vendas Online</p>
      </div>

      {/* Title */}
      <div className="bg-green-50 dark:bg-green-900/20 border-b p-4 text-center">
        <div className="inline-flex items-center gap-2 text-green-600 dark:text-green-400">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold text-lg">RECIBO DE PAGAMENTO</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Receipt Number */}
        <div className="text-center pb-4 border-b border-dashed">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Nº do Recibo</p>
          <p className="font-mono text-lg font-bold text-foreground">{receiptNumber}</p>
        </div>

        {/* Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Store className="w-4 h-4" />
              <span className="text-sm">Loja</span>
            </div>
            <span className="font-medium text-foreground">{invoice.stores?.name || 'N/A'}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Receipt className="w-4 h-4" />
              <span className="text-sm">Plano</span>
            </div>
            <span className="font-medium text-foreground">{invoice.plans?.name || 'N/A'}</span>
          </div>

          {invoice.paid_at && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Data do Pagamento</span>
              </div>
              <span className="font-medium text-foreground">
                {format(new Date(invoice.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Vencimento Original</span>
            </div>
            <span className="font-medium text-foreground">
              {format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </div>
        </div>

        {/* Amount */}
        <div className="pt-4 border-t">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Valor Pago</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(invoice.amount)}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center pt-2">
          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-full">
            <CheckCircle className="w-4 h-4" />
            <span className="font-semibold text-sm uppercase">Pagamento Confirmado</span>
          </div>
        </div>
      </div>

      {/* Footer - Authenticity Seal */}
      <div className="bg-muted/50 border-t p-4">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Shield className="w-4 h-4" />
          <span className="text-xs">
            Documento gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-1">
          Este recibo é válido como comprovante de pagamento
        </p>
      </div>
    </div>
  );
}
