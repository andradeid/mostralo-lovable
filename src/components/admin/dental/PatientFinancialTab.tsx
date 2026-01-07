import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Receipt, Plus, CreditCard, Calendar, Clock } from "lucide-react";
import { useDentalQuotes, DentalQuote } from "@/hooks/dental/useDentalQuotes";
import { usePatientPayments, DentalPayment, PAYMENT_METHODS } from "@/hooks/dental/useDentalPayments";
import { PaymentFormDialog } from "./PaymentFormDialog";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PatientFinancialTabProps {
  patientId: string;
  storeId: string;
}

export function PatientFinancialTab({ patientId, storeId }: PatientFinancialTabProps) {
  const { quotes, isLoading: quotesLoading } = useDentalQuotes(patientId);
  const { payments, isLoading: paymentsLoading } = usePatientPayments(patientId);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const isLoading = quotesLoading || paymentsLoading;

  // Calcular totais
  const totalQuoted = quotes.reduce((sum, q) => sum + Number(q.total_value || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const balance = totalQuoted - totalPaid;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-muted text-muted-foreground",
      sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      viewed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      expired: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    };
    const labels: Record<string, string> = {
      draft: "Rascunho",
      sent: "Enviado",
      viewed: "Visualizado",
      accepted: "Aceito",
      rejected: "Rejeitado",
      expired: "Expirado",
    };
    return <Badge className={styles[status] || styles.draft}>{labels[status] || status}</Badge>;
  };

  const getQuotePayments = (quoteId: string) => {
    return payments.filter(p => p.quote_id === quoteId);
  };

  const getQuotePaidAmount = (quoteId: string) => {
    return getQuotePayments(quoteId).reduce((sum, p) => sum + Number(p.amount), 0);
  };

  const getPaymentProgress = (quote: DentalQuote) => {
    const paid = getQuotePaidAmount(quote.id);
    const total = Number(quote.total_value || 0);
    if (total === 0) return 0;
    return Math.min((paid / total) * 100, 100);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <h3 className="text-base sm:text-lg font-semibold">Financeiro</h3>
        <Button size="sm" className="gap-2 w-full sm:w-auto" onClick={() => setIsPaymentDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Registrar Pagamento
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Receipt className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Orçado</p>
                <p className="text-lg font-bold">
                  R$ {totalQuoted.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Pago</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${balance > 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                <CreditCard className={`h-5 w-5 ${balance > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo Devedor</p>
                <p className={`text-lg font-bold ${balance > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                  R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quotes Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Orçamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {quotes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum orçamento encontrado
            </p>
          ) : (
            quotes.map((quote) => {
              const paidAmount = getQuotePaidAmount(quote.id);
              const progress = getPaymentProgress(quote);
              const total = Number(quote.total_value || 0);

              return (
                <div key={quote.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">#{quote.quote_number}</span>
                      {getStatusBadge(quote.status)}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(quote.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </div>

                  {/* Payment Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Pago</span>
                      <span className={progress === 100 ? "text-green-600" : ""}>
                        R$ {paidAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({progress.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${progress === 100 ? 'bg-green-500' : 'bg-primary'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Histórico de Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum pagamento registrado
            </p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => {
                const quote = quotes.find(q => q.id === payment.quote_id);
                return (
                  <div key={payment.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          R$ {Number(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {PAYMENT_METHODS[payment.payment_method as keyof typeof PAYMENT_METHODS] || payment.payment_method}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        {format(parseISO(payment.payment_date), "dd/MM/yyyy", { locale: ptBR })}
                        {quote && (
                          <>
                            <span>•</span>
                            <span>#{quote.quote_number}</span>
                          </>
                        )}
                        {payment.total_installments > 1 && (
                          <>
                            <span>•</span>
                            <span>Parcela {payment.installment_number}/{payment.total_installments}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <PaymentFormDialog
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        patientId={patientId}
        storeId={storeId}
        quotes={quotes}
      />
    </div>
  );
}
