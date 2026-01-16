import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Calendar, User, Scissors, DollarSign, Receipt, CheckCircle, Clock, FileImage } from "lucide-react";
import { toast } from "sonner";

interface CommissionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commission: {
    id: string;
    service_price: number;
    commission_type: string;
    commission_value: number;
    commission_amount: number;
    status: string;
    paid_at?: string | null;
    payment_reference?: string | null;
    payment_receipt_url?: string | null;
    payment_method?: string | null;
    payment_notes?: string | null;
    created_at: string;
    bookings?: {
      booking_date: string;
      customer_name: string;
      booking_services?: {
        name: string;
      };
    };
  } | null;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: "PIX",
  transfer: "Transferência",
  cash: "Dinheiro",
  other: "Outro",
};

export function CommissionDetailsDialog({
  open,
  onOpenChange,
  commission,
}: CommissionDetailsDialogProps) {
  if (!commission) return null;

  const isImage = (url: string) => {
    return url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  };

  const handleDownload = async () => {
    if (!commission.payment_receipt_url) return;
    
    try {
      const response = await fetch(commission.payment_receipt_url);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprovante_${commission.id}.${isImage(commission.payment_receipt_url) ? 'jpg' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Comprovante baixado com sucesso!");
    } catch (error) {
      console.error('Erro ao baixar comprovante:', error);
      toast.error("Erro ao baixar o arquivo");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Detalhes da Comissão
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex justify-center">
            {commission.status === "paid" ? (
              <Badge className="bg-green-600 text-white px-4 py-2 text-sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                Pagamento Confirmado
              </Badge>
            ) : (
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Clock className="w-4 h-4 mr-2" />
                Pendente
              </Badge>
            )}
          </div>

          {/* Informações do Serviço */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Scissors className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Serviço:</span>
              <span className="font-medium">{commission.bookings?.booking_services?.name || "Serviço"}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium">{commission.bookings?.customer_name || "Cliente"}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Data do Agendamento:</span>
              <span className="font-medium">
                {commission.bookings?.booking_date 
                  ? format(parseISO(commission.bookings.booking_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : "-"
                }
              </span>
            </div>
          </div>

          {/* Valores */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valor do Serviço:</span>
              <span className="font-medium">R$ {Number(commission.service_price).toFixed(2)}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tipo de Comissão:</span>
              <span className="font-medium">
                {commission.commission_type === "percentage" 
                  ? `${commission.commission_value}%`
                  : `R$ ${Number(commission.commission_value).toFixed(2)} (Fixo)`
                }
              </span>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Sua Comissão:</span>
              <span className="font-bold text-xl text-primary">
                R$ {Number(commission.commission_amount).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Informações de Pagamento (se pago) */}
          {commission.status === "paid" && commission.paid_at && (
            <>
              <Separator />
              
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Informações do Pagamento
                </h4>
                
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Data do Pagamento:</span>
                    <span className="font-medium">
                      {format(parseISO(commission.paid_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  
                  {commission.payment_method && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Método:</span>
                      <span className="font-medium">
                        {PAYMENT_METHOD_LABELS[commission.payment_method] || commission.payment_method}
                      </span>
                    </div>
                  )}
                  
                  {commission.payment_reference && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Referência:</span>
                      <span className="font-medium">{commission.payment_reference}</span>
                    </div>
                  )}
                  
                  {commission.payment_notes && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Observações:</span>
                      <p className="mt-1 text-foreground">{commission.payment_notes}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Comprovante */}
              {commission.payment_receipt_url && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold flex items-center gap-2">
                      <FileImage className="w-4 h-4" />
                      Comprovante
                    </h4>
                    <Button onClick={handleDownload} variant="outline" size="sm" className="gap-2">
                      <Download className="w-4 h-4" />
                      Baixar
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden bg-muted/30">
                    {isImage(commission.payment_receipt_url) ? (
                      <img
                        src={commission.payment_receipt_url}
                        alt="Comprovante de pagamento"
                        className="w-full h-auto max-h-64 object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 gap-2">
                        <svg
                          className="w-12 h-12 text-muted-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="text-sm text-muted-foreground">
                          Arquivo PDF
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
