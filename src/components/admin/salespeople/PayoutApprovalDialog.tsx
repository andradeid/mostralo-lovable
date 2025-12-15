import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Upload, FileText, User, Building2, CheckCircle, XCircle, AlertTriangle, Download } from "lucide-react";

interface PayoutWithSalesperson {
  id: string;
  cycle_month: number;
  cycle_year: number;
  total_sales: number;
  commission_total: number;
  bonus_total: number;
  grand_total: number;
  requested_at: string | null;
  invoice_url: string | null;
  invoice_number: string | null;
  pix_key: string | null;
  pix_key_type: string | null;
  status: string;
  salesperson: {
    id: string;
    full_name: string;
    email: string;
    salesperson_type: string;
    cpf: string | null;
    cnpj: string | null;
    company_name: string | null;
  };
}

interface PayoutApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payout: PayoutWithSalesperson;
  onSuccess: () => void;
}

export function PayoutApprovalDialog({
  open,
  onOpenChange,
  payout,
  onSuccess,
}: PayoutApprovalDialogProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | 'pay' | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);

  const isAffiliate = payout.salesperson?.salesperson_type === 'affiliate';
  const isPJ = payout.salesperson?.salesperson_type === 'partner_pj';

  // Detectar tipo de arquivo
  const getFileType = (url: string): 'image' | 'pdf' => {
    const extension = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return 'image';
    }
    return 'pdf';
  };

  // Download de arquivo
  const handleDownloadFile = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast({
        title: "Download iniciado",
        description: `Baixando ${fileName}`,
      });
    } catch (error) {
      console.error('Erro no download:', error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o arquivo",
        variant: "destructive",
      });
    }
  };

  const invoiceFileType = payout.invoice_url ? getFileType(payout.invoice_url) : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }
      setPaymentProofFile(file);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('salesperson_payouts')
        .update({
          status: 'approved',
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', payout.id);

      if (error) throw error;

      toast({
        title: "Pagamento aprovado!",
        description: "O vendedor será notificado",
      });
      onSuccess();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      toast({
        title: "Erro ao aprovar",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Informe o motivo da rejeição",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('salesperson_payouts')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason.trim(),
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', payout.id);

      if (error) throw error;

      toast({
        title: "Pagamento rejeitado",
        description: "O vendedor foi notificado",
      });
      onSuccess();
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      toast({
        title: "Erro ao rejeitar",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!paymentProofFile) {
      toast({
        title: "Comprovante obrigatório",
        description: "Anexe o comprovante de pagamento",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Upload do comprovante
      const fileExt = paymentProofFile.name.split('.').pop();
      const fileName = `proofs/${payout.salesperson.id}/${payout.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('salesperson-payment-proofs')
        .upload(fileName, paymentProofFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('salesperson-payment-proofs')
        .getPublicUrl(fileName);

      // Atualizar status
      const { error } = await supabase
        .from('salesperson_payouts')
        .update({
          status: 'paid',
          payment_proof_url: urlData.publicUrl,
          payment_reference: paymentReference.trim() || null,
          paid_at: new Date().toISOString(),
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', payout.id);

      if (error) throw error;

      toast({
        title: "Pagamento confirmado!",
        description: "O vendedor será notificado",
      });
      onSuccess();
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      toast({
        title: "Erro ao confirmar",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const periodName = format(
    new Date(payout.cycle_year, payout.cycle_month - 1),
    "MMMM 'de' yyyy",
    { locale: ptBR }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {payout.status === 'approved' ? 'Confirmar Pagamento' : 'Analisar Solicitação'}
          </DialogTitle>
          <DialogDescription>
            {payout.salesperson?.full_name} - <span className="capitalize">{periodName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tipo de vendedor */}
          <div className="flex items-center gap-3">
            {isAffiliate ? (
              <Badge variant="outline" className="border-blue-500 text-blue-600 text-sm px-3 py-1">
                <User className="w-4 h-4 mr-1" />
                Afiliado (CPF) - Sem NF
              </Badge>
            ) : (
              <Badge variant="outline" className="border-orange-500 text-orange-600 text-sm px-3 py-1">
                <Building2 className="w-4 h-4 mr-1" />
                Parceiro PJ - NF Obrigatória
              </Badge>
            )}
          </div>

          {/* Dados do vendedor */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium">Dados do Vendedor</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Nome:</span>
                <p>{payout.salesperson?.full_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <p>{payout.salesperson?.email}</p>
              </div>
              {isAffiliate ? (
                <div>
                  <span className="text-muted-foreground">CPF:</span>
                  <p>{payout.salesperson?.cpf || 'N/A'}</p>
                </div>
              ) : (
                <>
                  <div>
                    <span className="text-muted-foreground">CNPJ:</span>
                    <p>{payout.salesperson?.cnpj || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Razão Social:</span>
                    <p>{payout.salesperson?.company_name || 'N/A'}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Resumo financeiro */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium">Resumo do Pagamento</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendas:</span>
                <span>{payout.total_sales}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comissão:</span>
                <span>R$ {Number(payout.commission_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              {Number(payout.bonus_total) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bônus:</span>
                  <span className="text-green-600">R$ {Number(payout.bonus_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span className="text-green-600">R$ {Number(payout.grand_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* PIX */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Dados para Pagamento</h4>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Chave PIX:</span>
              <code className="bg-background px-2 py-1 rounded">{payout.pix_key}</code>
              <Badge variant="secondary">{payout.pix_key_type}</Badge>
            </div>
          </div>

          {/* NF para Parceiro PJ */}
          {isPJ && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Nota Fiscal</h4>
                {payout.invoice_url && (
                  <Badge className="bg-green-500">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Anexada
                  </Badge>
                )}
              </div>
              {payout.invoice_url ? (
                <div className="space-y-3">
                  {/* Preview para imagens */}
                  {invoiceFileType === 'image' && (
                    <div className="border rounded-lg overflow-hidden bg-muted/30">
                      <img 
                        src={payout.invoice_url} 
                        alt={`NF #${payout.invoice_number}`}
                        className="max-h-[300px] w-auto mx-auto object-contain"
                      />
                    </div>
                  )}
                  
                  {/* Card para PDF */}
                  {invoiceFileType === 'pdf' && (
                    <div className="flex items-center gap-3 border rounded-lg p-4 bg-muted/30">
                      <div className="bg-red-100 p-3 rounded-lg">
                        <FileText className="w-8 h-8 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">NF #{payout.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">Documento PDF</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Botão de download */}
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleDownloadFile(
                      payout.invoice_url!, 
                      `NF-${payout.invoice_number}.${invoiceFileType === 'image' ? 'jpg' : 'pdf'}`
                    )}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {invoiceFileType === 'image' ? 'Baixar Imagem' : 'Baixar PDF'}
                  </Button>
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>NF não anexada!</strong> Parceiro PJ deve anexar nota fiscal antes da aprovação.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Alerta para afiliado */}
          {isAffiliate && payout.status === 'requested' && (
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                Afiliados não precisam de NF. Verifique apenas os dados de PIX antes de aprovar.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Ações */}
          {payout.status === 'requested' && !action && (
            <div className="flex gap-3">
              <Button 
                className="flex-1" 
                onClick={() => setAction('approve')}
                disabled={isPJ && !payout.invoice_url}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprovar
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => setAction('reject')}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeitar
              </Button>
            </div>
          )}

          {payout.status === 'approved' && !action && (
            <Button className="w-full" onClick={() => setAction('pay')}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar como Pago
            </Button>
          )}

          {/* Formulário de rejeição */}
          {action === 'reject' && (
            <div className="space-y-4 border rounded-lg p-4 bg-red-50">
              <h4 className="font-medium text-red-700">Motivo da Rejeição</h4>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Informe o motivo da rejeição..."
                rows={3}
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAction(null)}>
                  Voltar
                </Button>
                <Button variant="destructive" onClick={handleReject} disabled={loading}>
                  {loading ? "Rejeitando..." : "Confirmar Rejeição"}
                </Button>
              </div>
            </div>
          )}

          {/* Formulário de pagamento */}
          {(action === 'approve' || action === 'pay') && (
            <div className="space-y-4 border rounded-lg p-4 bg-green-50">
              <h4 className="font-medium text-green-700">
                {action === 'approve' ? 'Aprovar Pagamento' : 'Confirmar Pagamento Realizado'}
              </h4>

              {action === 'pay' && (
                <>
                  <div className="space-y-2">
                    <Label>Referência do Pagamento (opcional)</Label>
                    <Input
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder="Ex: Transação PIX 123456"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Comprovante de Pagamento *</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center bg-white">
                      {paymentProofFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <FileText className="h-5 w-5 text-green-500" />
                          <span className="text-sm">{paymentProofFile.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPaymentProofFile(null)}
                          >
                            Remover
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Upload className="h-8 w-8" />
                            <span className="text-sm">Anexar comprovante</span>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAction(null)}>
                  Voltar
                </Button>
                {action === 'approve' ? (
                  <Button onClick={handleApprove} disabled={loading} className="bg-green-600 hover:bg-green-700">
                    {loading ? "Aprovando..." : "Confirmar Aprovação"}
                  </Button>
                ) : (
                  <Button onClick={handleMarkAsPaid} disabled={loading} className="bg-green-600 hover:bg-green-700">
                    {loading ? "Confirmando..." : "Confirmar Pagamento"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
