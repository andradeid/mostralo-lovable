import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, Store, Calendar, Receipt, Shield, User, FileText, CreditCard, RefreshCw } from "lucide-react";

interface ExternalReceiptCardProps {
  invoice: {
    id: string;
    invoice_number: string | null;
    description: string;
    amount: number;
    due_date: string;
    paid_at: string | null;
    payment_method: string | null;
    is_recurring: boolean | null;
    recurrence_type: string | null;
    recurrence_current: number | null;
    recurrence_count: number | null;
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
  };
}

export function ExternalReceiptCard({ invoice }: ExternalReceiptCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const receiptNumber = invoice.invoice_number || invoice.id.slice(0, 8).toUpperCase();

  const getPaymentMethodLabel = (method: string | null) => {
    switch (method) {
      case 'pix': return 'PIX';
      case 'boleto': return 'Boleto Bancário';
      default: return 'N/A';
    }
  };

  const getRecurrenceLabel = () => {
    if (!invoice.is_recurring) return 'Pagamento Único';
    
    const types: Record<string, string> = {
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      yearly: 'Anual',
    };
    
    const type = invoice.recurrence_type ? types[invoice.recurrence_type] || invoice.recurrence_type : 'Recorrente';
    
    if (invoice.recurrence_current && invoice.recurrence_count) {
      return `${type} (${invoice.recurrence_current}/${invoice.recurrence_count})`;
    }
    
    return type;
  };

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
          {/* Cliente */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-4 h-4" />
              <span className="text-sm">Cliente</span>
            </div>
            <span className="font-medium text-foreground">{invoice.external_clients?.name || 'N/A'}</span>
          </div>

          {/* Serviço */}
          {invoice.external_services && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Receipt className="w-4 h-4" />
                <span className="text-sm">Serviço</span>
              </div>
              <span className="font-medium text-foreground">{invoice.external_services.name}</span>
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

          {/* Data do Pagamento */}
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

          {/* Vencimento Original */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Vencimento Original</span>
            </div>
            <span className="font-medium text-foreground">
              {format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </div>

          {/* Método de Pagamento */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm">Forma de Pagamento</span>
            </div>
            <span className="font-medium text-foreground">{getPaymentMethodLabel(invoice.payment_method)}</span>
          </div>

          {/* Recorrência */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm">Tipo</span>
            </div>
            <span className="font-medium text-foreground">{getRecurrenceLabel()}</span>
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
