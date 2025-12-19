import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, AlertTriangle } from "lucide-react";

// Motivos de cancelamento oficiais do iFood
const IFOOD_CANCEL_REASONS = [
  { code: '501', label: 'A loja está sem entregadores disponíveis' },
  { code: '502', label: 'A loja está passando por dificuldades internas' },
  { code: '503', label: 'A entrega é em uma área de risco' },
  { code: '504', label: 'O endereço está incompleto e o cliente não atende' },
  { code: '505', label: 'Problema com pagamento do cliente' },
];

// Motivos de cancelamento padronizados do Mostralo
const MOSTRALO_CANCEL_REASONS = [
  { code: 'M01', label: 'Cliente solicitou cancelamento' },
  { code: 'M02', label: 'Produto indisponível' },
  { code: 'M03', label: 'Endereço fora da área de entrega' },
  { code: 'M04', label: 'Cliente não encontrado/não atende' },
  { code: 'M05', label: 'Problema com forma de pagamento' },
  { code: 'M06', label: 'Pedido duplicado' },
  { code: 'M07', label: 'Erro no pedido (item errado)' },
  { code: 'M08', label: 'Tempo de espera muito longo' },
  { code: 'M09', label: 'Outro motivo' },
];

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, cancellationCode?: string) => void;
  isLoading?: boolean;
  isIfoodOrder?: boolean;
}

export const CancelOrderDialog = ({ open, onOpenChange, onConfirm, isLoading, isIfoodOrder }: CancelOrderDialogProps) => {
  const [reason, setReason] = useState("");
  const [selectedCode, setSelectedCode] = useState<string>("");

  const handleConfirm = () => {
    if (isIfoodOrder) {
      // Para pedidos iFood, usar o motivo selecionado
      if (selectedCode) {
        const selectedReason = IFOOD_CANCEL_REASONS.find(r => r.code === selectedCode);
        onConfirm(selectedReason?.label || reason, selectedCode);
        setSelectedCode("");
        setReason("");
      }
    } else {
      // Para pedidos Mostralo, usar as opções padronizadas
      if (selectedCode) {
        const selectedReason = MOSTRALO_CANCEL_REASONS.find(r => r.code === selectedCode);
        // Se for "Outro motivo", usar texto personalizado
        const finalReason = selectedCode === 'M09' && reason.trim() 
          ? reason.trim() 
          : selectedReason?.label;
        onConfirm(finalReason || '', selectedCode);
        setSelectedCode("");
        setReason("");
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setReason("");
      setSelectedCode("");
    }
    onOpenChange(open);
  };

  // Validação: para iFood precisa de código, para Mostralo precisa de código e texto se for M09
  const isConfirmDisabled = isIfoodOrder 
    ? !selectedCode 
    : !selectedCode || (selectedCode === 'M09' && !reason.trim());

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Cancelar Pedido
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. {isIfoodOrder ? 'Selecione o motivo do cancelamento.' : 'Por favor, informe o motivo do cancelamento.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isIfoodOrder ? (
            <>
              {/* Aviso iFood */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium">Atenção</p>
                    <p className="text-xs mt-1">Aguarde alguns minutos após a solicitação para receber a confirmação do cancelamento. Cancelar pedidos pode afetar o desempenho da sua loja no iFood.</p>
                  </div>
                </div>
              </div>

              {/* Opções de cancelamento iFood */}
              <div className="space-y-2">
                <Label>Motivo do cancelamento *</Label>
                <RadioGroup value={selectedCode} onValueChange={setSelectedCode} className="space-y-2">
                  {IFOOD_CANCEL_REASONS.map((item) => (
                    <div key={item.code} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
                      <RadioGroupItem value={item.code} id={`reason-${item.code}`} />
                      <Label htmlFor={`reason-${item.code}`} className="flex-1 cursor-pointer text-sm">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Opções de cancelamento Mostralo */}
              <div className="space-y-2">
                <Label>Motivo do cancelamento *</Label>
                <RadioGroup value={selectedCode} onValueChange={setSelectedCode} className="space-y-2">
                  {MOSTRALO_CANCEL_REASONS.map((item) => (
                    <div key={item.code} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors">
                      <RadioGroupItem value={item.code} id={`reason-${item.code}`} />
                      <Label htmlFor={`reason-${item.code}`} className="flex-1 cursor-pointer text-sm">
                        {item.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Campo de texto adicional para "Outro motivo" */}
              {selectedCode === 'M09' && (
                <div className="space-y-2">
                  <Label htmlFor="custom-reason">Descreva o motivo *</Label>
                  <Textarea
                    id="custom-reason"
                    placeholder="Digite o motivo do cancelamento..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            Voltar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm} 
            disabled={isConfirmDisabled || isLoading}
          >
            {isLoading ? "Cancelando..." : "Confirmar Cancelamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};