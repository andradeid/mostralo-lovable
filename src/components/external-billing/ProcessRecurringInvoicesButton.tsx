import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProcessResult {
  total_processed: number;
  invoices_created: Array<{
    id: string;
    invoice_number: string;
    client_name: string;
    amount: number;
    due_date: string;
    whatsapp_sent: boolean;
  }>;
  errors: string[];
  whatsapp_sent_count: number;
}

export function ProcessRecurringInvoicesButton() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const queryClient = useQueryClient();

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "process-recurring-external-invoices"
      );

      if (error) {
        console.error("Error processing recurring invoices:", error);
        toast.error("Erro ao processar faturas recorrentes");
        return;
      }

      if (data?.success) {
        setResult(data.result);
        setShowResultDialog(true);
        
        // Invalidate queries to refresh the list
        queryClient.invalidateQueries({ queryKey: ["external-invoices"] });
        
        if (data.result.total_processed > 0) {
          toast.success(`${data.result.total_processed} fatura(s) gerada(s)!`);
        } else {
          toast.info("Nenhuma fatura recorrente pendente de processamento");
        }
      } else {
        toast.error(data?.error || "Erro ao processar");
      }
    } catch (err) {
      console.error("Process error:", err);
      toast.error("Erro inesperado ao processar faturas");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <>
      <Button
        variant="outline"
        onClick={handleProcess}
        disabled={isProcessing}
        className="gap-2"
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {isProcessing ? "Processando..." : "Processar Recorrências"}
      </Button>

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {result?.errors.length === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              Resultado do Processamento
            </DialogTitle>
            <DialogDescription>
              {result?.total_processed === 0
                ? "Nenhuma fatura foi gerada neste processamento."
                : `${result?.total_processed} fatura(s) gerada(s) automaticamente.`}
            </DialogDescription>
          </DialogHeader>

          {result && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{result.total_processed}</p>
                  <p className="text-xs text-muted-foreground">Faturas Criadas</p>
                </div>
                <div className="text-center p-3 bg-green-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {result.whatsapp_sent_count}
                  </p>
                  <p className="text-xs text-muted-foreground">WhatsApp Enviados</p>
                </div>
                <div className="text-center p-3 bg-red-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {result.errors.length}
                  </p>
                  <p className="text-xs text-muted-foreground">Erros</p>
                </div>
              </div>

              {/* Created invoices */}
              {result.invoices_created.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Faturas Geradas:</h4>
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                      {result.invoices_created.map((invoice) => (
                        <div
                          key={invoice.id}
                          className="p-3 border rounded-lg text-sm flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium">{invoice.invoice_number}</p>
                            <p className="text-muted-foreground text-xs">
                              {invoice.client_name} • {invoice.due_date}
                            </p>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <span className="font-mono">
                              {formatCurrency(invoice.amount)}
                            </span>
                            {invoice.whatsapp_sent && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                📱 Enviado
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-red-600">Erros:</h4>
                  <ScrollArea className="h-[100px]">
                    <div className="space-y-1">
                      {result.errors.map((error, index) => (
                        <p key={index} className="text-sm text-red-600">
                          • {error}
                        </p>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
