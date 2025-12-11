import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Upload, FileText, AlertTriangle, CheckCircle } from "lucide-react";

interface Payout {
  id: string;
  cycle_month: number;
  cycle_year: number;
  grand_total: number;
  commission_total: number;
  bonus_total: number;
  total_sales: number;
}

interface Salesperson {
  id: string;
  salesperson_type: string;
  pix_key: string | null;
  pix_key_type: string | null;
  monthly_earnings_limit: number | null;
  current_month_earnings: number;
}

interface PayoutRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payout: Payout;
  salesperson: Salesperson;
  onSuccess: () => void;
}

export function PayoutRequestDialog({
  open,
  onOpenChange,
  payout,
  salesperson,
  onSuccess,
}: PayoutRequestDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");

  const isAffiliate = salesperson.salesperson_type === "affiliate";
  const isPJ = salesperson.salesperson_type === "pj_partner";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validar tipo de arquivo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Arquivo inválido",
          description: "Envie apenas PDF ou imagens (JPG, PNG)",
          variant: "destructive",
        });
        return;
      }
      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 5MB",
          variant: "destructive",
        });
        return;
      }
      setInvoiceFile(file);
    }
  };

  const handleSubmit = async () => {
    // Validações
    if (!salesperson.pix_key) {
      toast({
        title: "PIX não cadastrado",
        description: "Cadastre sua chave PIX no perfil antes de solicitar pagamento",
        variant: "destructive",
      });
      return;
    }

    if (isPJ && !invoiceFile) {
      toast({
        title: "Nota fiscal obrigatória",
        description: "Como Parceiro PJ, você precisa anexar a nota fiscal",
        variant: "destructive",
      });
      return;
    }

    if (isPJ && !invoiceNumber.trim()) {
      toast({
        title: "Número da NF obrigatório",
        description: "Informe o número da nota fiscal",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      let invoiceUrl = null;

      // Upload da NF se for PJ
      if (isPJ && invoiceFile) {
        const fileExt = invoiceFile.name.split('.').pop();
        const fileName = `${salesperson.id}/${payout.cycle_year}-${payout.cycle_month}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('salesperson-invoices')
          .upload(fileName, invoiceFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('salesperson-invoices')
          .getPublicUrl(fileName);

        invoiceUrl = urlData.publicUrl;
      }

      // Atualizar o payout
      const { error: updateError } = await supabase
        .from('salesperson_payouts')
        .update({
          status: 'requested',
          requested_at: new Date().toISOString(),
          invoice_url: invoiceUrl,
          invoice_number: isPJ ? invoiceNumber.trim() : null,
          pix_key: salesperson.pix_key,
          pix_key_type: salesperson.pix_key_type,
        })
        .eq('id', payout.id);

      if (updateError) throw updateError;

      toast({
        title: "Pagamento solicitado!",
        description: "Sua solicitação foi enviada para análise",
      });

      onSuccess();
    } catch (error) {
      console.error('Erro ao solicitar pagamento:', error);
      toast({
        title: "Erro ao solicitar",
        description: "Tente novamente em alguns instantes",
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Solicitar Pagamento</DialogTitle>
          <DialogDescription>
            Período: <strong className="capitalize">{periodName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Badge do tipo */}
          <div className="flex justify-center">
            {isAffiliate ? (
              <Badge variant="outline" className="border-blue-500 text-blue-600 text-sm px-3 py-1">
                👤 Afiliado (CPF) - Sem NF
              </Badge>
            ) : (
              <Badge variant="outline" className="border-orange-500 text-orange-600 text-sm px-3 py-1">
                🏢 Parceiro PJ - NF Obrigatória
              </Badge>
            )}
          </div>

          {/* Resumo do valor */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vendas no período:</span>
              <span>{payout.total_sales}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Comissão:</span>
              <span>R$ {Number(payout.commission_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            {Number(payout.bonus_total) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bônus:</span>
                <span className="text-green-600">R$ {Number(payout.bonus_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total a receber:</span>
              <span className="text-green-600">
                R$ {Number(payout.grand_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Chave PIX */}
          <div className="space-y-2">
            <Label>Chave PIX cadastrada</Label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-mono text-sm">{salesperson.pix_key}</span>
              <Badge variant="secondary" className="ml-auto">{salesperson.pix_key_type}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Para alterar, acesse seu <a href="/vendedor/perfil" className="underline">perfil</a>
            </p>
          </div>

          {/* Campos para Parceiro PJ */}
          {isPJ && (
            <>
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Número da Nota Fiscal *</Label>
                <Input
                  id="invoiceNumber"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Ex: 000001234"
                />
              </div>

              <div className="space-y-2">
                <Label>Anexar Nota Fiscal *</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  {invoiceFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-5 w-5 text-green-500" />
                      <span className="text-sm">{invoiceFile.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInvoiceFile(null)}
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
                        <span className="text-sm">Clique para enviar PDF ou imagem</span>
                        <span className="text-xs">Máximo 5MB</span>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Alerta para afiliado */}
          {isAffiliate && (
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-700 text-sm">
                Como afiliado, você não precisa anexar nota fiscal. O pagamento será processado diretamente via PIX.
              </AlertDescription>
            </Alert>
          )}

          {/* Alerta de prazo */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Pagamentos são processados em até 5 dias úteis após aprovação.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Enviando..." : "Confirmar Solicitação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
