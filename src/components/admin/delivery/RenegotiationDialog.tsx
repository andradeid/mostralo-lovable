import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, DollarSign, Percent, Shield } from 'lucide-react';
import { formatCurrency, PaymentType } from '@/utils/driverEarnings';

interface RenegotiationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driverId: string;
  driverName: string;
  storeId: string;
  currentConfig?: {
    payment_type: PaymentType;
    fixed_amount?: number;
    commission_percentage?: number;
    minimum_amount?: number;
  };
  onSuccess: () => void;
}

export function RenegotiationDialog({
  open,
  onOpenChange,
  driverId,
  driverName,
  storeId,
  currentConfig,
  onSuccess,
}: RenegotiationDialogProps) {
  const [paymentType, setPaymentType] = useState<PaymentType>(currentConfig?.payment_type || 'fixed');
  const [fixedAmount, setFixedAmount] = useState('');
  const [commissionPercentage, setCommissionPercentage] = useState('');
  const [minimumAmount, setMinimumAmount] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (currentConfig) {
      setPaymentType(currentConfig.payment_type);
      if (currentConfig.payment_type === 'fixed' && currentConfig.fixed_amount) {
        setFixedAmount(String(currentConfig.fixed_amount));
      } else if (currentConfig.payment_type === 'commission' && currentConfig.commission_percentage) {
        setCommissionPercentage(String(currentConfig.commission_percentage));
      } else if (currentConfig.payment_type === 'minimum_guaranteed' && currentConfig.minimum_amount) {
        setMinimumAmount(String(currentConfig.minimum_amount));
      }
    }
  }, [currentConfig]);

  const handleSubmit = async () => {
    if (paymentType === 'fixed' && !fixedAmount) {
      toast.error('Informe o valor fixo');
      return;
    }
    if (paymentType === 'commission' && !commissionPercentage) {
      toast.error('Informe a porcentagem de comissão');
      return;
    }
    if (paymentType === 'minimum_guaranteed' && !minimumAmount) {
      toast.error('Informe o valor mínimo garantido');
      return;
    }

    setSubmitting(true);
    try {
      // Criar novo convite com os novos valores
      const { error } = await supabase.functions.invoke('create-driver-invitation', {
        body: {
          store_id: storeId,
          driver_id: driverId,
          proposed_payment_type: paymentType,
          proposed_fixed_amount: paymentType === 'fixed' ? parseFloat(fixedAmount) : null,
          proposed_commission_percentage: paymentType === 'commission' ? parseFloat(commissionPercentage) : null,
          proposed_minimum_amount: paymentType === 'minimum_guaranteed' ? parseFloat(minimumAmount) : null,
          invitation_message: message.trim() || 'Proposta de renegociação de valores',
        },
      });

      if (error) throw error;

      toast.success('Proposta de renegociação enviada!');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error sending renegotiation:', error);
      toast.error(error.message || 'Erro ao enviar proposta');
    } finally {
      setSubmitting(false);
    }
  };

  const getCurrentConfigLabel = () => {
    if (!currentConfig) return null;
    switch (currentConfig.payment_type) {
      case 'fixed':
        return formatCurrency(currentConfig.fixed_amount || 0);
      case 'commission':
        return `${currentConfig.commission_percentage}%`;
      case 'minimum_guaranteed':
        return `Mín. ${formatCurrency(currentConfig.minimum_amount || 0)}`;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Renegociar Valores</DialogTitle>
          <DialogDescription>
            Propor novos valores de pagamento para {driverName}
          </DialogDescription>
        </DialogHeader>

        {currentConfig && (
          <div className="rounded-lg border bg-muted/50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Valores atuais:</span>
              <Badge variant="outline">
                {getCurrentConfigLabel()}
              </Badge>
            </div>
          </div>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de Pagamento</Label>
            <RadioGroup value={paymentType} onValueChange={(v) => setPaymentType(v as PaymentType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed" className="font-normal cursor-pointer flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  Taxa Fixa por Entrega
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="minimum_guaranteed" id="minimum_guaranteed" />
                <Label htmlFor="minimum_guaranteed" className="font-normal cursor-pointer flex items-center gap-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  Mínimo Garantido
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="commission" id="commission" />
                <Label htmlFor="commission" className="font-normal cursor-pointer flex items-center gap-2">
                  <Percent className="w-4 h-4 text-muted-foreground" />
                  Comissão Percentual
                </Label>
              </div>
            </RadioGroup>
          </div>

          {paymentType === 'fixed' && (
            <div className="space-y-2">
              <Label htmlFor="fixed-amount">Valor Fixo (R$)</Label>
              <Input
                id="fixed-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 15.00"
                value={fixedAmount}
                onChange={(e) => setFixedAmount(e.target.value)}
              />
            </div>
          )}

          {paymentType === 'minimum_guaranteed' && (
            <div className="space-y-2">
              <Label htmlFor="minimum-amount">Valor Mínimo Garantido (R$)</Label>
              <Input
                id="minimum-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 7.00"
                value={minimumAmount}
                onChange={(e) => setMinimumAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                O entregador recebe o maior valor entre a taxa e o mínimo
              </p>
            </div>
          )}

          {paymentType === 'commission' && (
            <div className="space-y-2">
              <Label htmlFor="commission">Porcentagem (%)</Label>
              <Input
                id="commission"
                type="number"
                step="1"
                min="0"
                max="100"
                placeholder="Ex: 70"
                value={commissionPercentage}
                onChange={(e) => setCommissionPercentage(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem (opcional)</Label>
            <Textarea
              id="message"
              placeholder="Explique o motivo da renegociação..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Proposta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
