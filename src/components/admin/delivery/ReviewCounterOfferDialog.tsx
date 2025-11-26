import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, ArrowRight, MessageSquare } from 'lucide-react';
import { formatCurrency } from '@/utils/driverEarnings';

interface ReviewCounterOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invitation: {
    id: string;
    token: string;
    driver_id: string;
    proposed_payment_type: 'fixed' | 'commission';
    proposed_fixed_amount?: number;
    proposed_commission_percentage?: number;
    counter_offer_payment_type?: 'fixed' | 'commission';
    counter_offer_fixed_amount?: number;
    counter_offer_commission_percentage?: number;
    counter_offer_message?: string;
  };
  driverName: string;
  onSuccess: () => void;
}

export function ReviewCounterOfferDialog({
  open,
  onOpenChange,
  invitation,
  driverName,
  onSuccess,
}: ReviewCounterOfferDialogProps) {
  const [processing, setProcessing] = useState(false);

  const handleAcceptCounterOffer = async () => {
    setProcessing(true);
    try {
      console.log('🔄 Aceitando contra-proposta via edge function:', {
        token: invitation.token,
        driver_id: invitation.driver_id,
        counter_offer_type: invitation.counter_offer_payment_type,
      });

      const { data, error } = await supabase.functions.invoke('accept-driver-invitation', {
        body: {
          token: invitation.token,
          action: 'accept',
          accept_counter_offer: true,
        }
      });

      if (error) {
        console.error('❌ Erro na função:', error);
        throw error;
      }

      if (data?.error) {
        console.error('❌ Erro retornado:', data.error);
        toast.error(data.error);
        return;
      }

      console.log('✅ Contra-proposta aceita com sucesso:', data);
      toast.success('Contra-proposta aceita com sucesso!');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('❌ Erro ao aceitar contra-proposta:', error);
      toast.error(error.message || 'Erro ao aceitar contra-proposta');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectCounterOffer = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('driver_invitations')
        .update({ status: 'declined' })
        .eq('id', invitation.id);

      if (error) throw error;

      toast.info('Contra-proposta recusada');
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error rejecting counter-offer:', error);
      toast.error('Erro ao recusar contra-proposta');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Revisar Contra-proposta</DialogTitle>
          <DialogDescription>
            {driverName} fez uma contra-proposta aos seus termos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Comparação */}
          <div className="grid gap-4">
            <div>
              <Badge variant="outline" className="mb-2">Sua Proposta</Badge>
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {invitation.proposed_payment_type === 'fixed' ? 'Taxa Fixa' : 'Comissão'}
                  </span>
                  <span className="text-2xl font-bold">
                    {invitation.proposed_payment_type === 'fixed'
                      ? formatCurrency(invitation.proposed_fixed_amount || 0)
                      : `${invitation.proposed_commission_percentage}%`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>

            <div>
              <Badge className="mb-2">Contra-proposta do Entregador</Badge>
              <div className="rounded-lg border-2 border-primary p-4 bg-primary/5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {invitation.counter_offer_payment_type === 'fixed' ? 'Taxa Fixa' : 'Comissão'}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {invitation.counter_offer_payment_type === 'fixed'
                      ? formatCurrency(invitation.counter_offer_fixed_amount || 0)
                      : `${invitation.counter_offer_commission_percentage}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mensagem do Entregador */}
          {invitation.counter_offer_message && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="h-4 w-4" />
                Mensagem do entregador:
              </div>
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm">{invitation.counter_offer_message}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleRejectCounterOffer}
            disabled={processing}
          >
            Recusar
          </Button>
          <Button
            onClick={handleAcceptCounterOffer}
            disabled={processing}
          >
            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Aceitar Contra-proposta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
