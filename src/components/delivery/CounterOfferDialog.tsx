import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/driverEarnings';

interface CounterOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  currentProposal: {
    payment_type: 'fixed' | 'commission';
    fixed_amount?: number;
    commission_percentage?: number;
  };
  onSuccess: () => void;
}

export function CounterOfferDialog({
  open,
  onOpenChange,
  token,
  currentProposal,
  onSuccess,
}: CounterOfferDialogProps) {
  const [paymentType, setPaymentType] = useState<'fixed' | 'commission'>(currentProposal.payment_type);
  const [fixedAmount, setFixedAmount] = useState('');
  const [commissionPercentage, setCommissionPercentage] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (paymentType === 'fixed' && !fixedAmount) {
      toast.error('Informe o valor fixo');
      return;
    }
    if (paymentType === 'commission' && !commissionPercentage) {
      toast.error('Informe a porcentagem de comissão');
      return;
    }
    if (!message.trim()) {
      toast.error('Explique sua contra-proposta');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('accept-driver-invitation', {
        body: {
          token,
          action: 'counter-offer',
          counter_offer: {
            payment_type: paymentType,
            fixed_amount: paymentType === 'fixed' ? parseFloat(fixedAmount) : null,
            commission_percentage: paymentType === 'commission' ? parseFloat(commissionPercentage) : null,
            message: message.trim(),
          },
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success('Contra-proposta enviada!');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting counter-offer:', error);
      toast.error(error.message || 'Erro ao enviar contra-proposta');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fazer Contra-proposta</DialogTitle>
          <DialogDescription>
            Proposta atual: {currentProposal.payment_type === 'fixed'
              ? formatCurrency(currentProposal.fixed_amount || 0)
              : `${currentProposal.commission_percentage}%`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de Pagamento</Label>
            <RadioGroup value={paymentType} onValueChange={(v) => setPaymentType(v as 'fixed' | 'commission')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed" className="font-normal cursor-pointer">
                  Taxa Fixa por Entrega
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="commission" id="commission" />
                <Label htmlFor="commission" className="font-normal cursor-pointer">
                  Comissão Percentual
                </Label>
              </div>
            </RadioGroup>
          </div>

          {paymentType === 'fixed' ? (
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
              <p className="text-xs text-muted-foreground">
                Quanto você deseja receber por entrega
              </p>
            </div>
          ) : (
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
              <p className="text-xs text-muted-foreground">
                Porcentagem da taxa de entrega que você deseja receber
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem (obrigatório)</Label>
            <Textarea
              id="message"
              placeholder="Explique por que está fazendo esta contra-proposta..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Contra-proposta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
