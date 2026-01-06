import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, Play, Square, AlertTriangle, User, Phone, Calendar, Clock, Scissors, MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface Booking {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  professional_name?: string;
  service_name?: string;
  confirmation_sent?: boolean;
  reminder_sent?: boolean;
  review_sent?: boolean;
}

interface NotificationLog {
  id: string;
  notification_type: 'confirmation' | 'reminder' | 'review';
  send_method: 'automatic' | 'manual';
  sent_at: string;
  status: 'sent' | 'failed' | 'delivered';
  error_message?: string;
}

interface BookingActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  onSuccess?: () => void;
}

type BookingStatus = Booking['status'];

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-500', icon: AlertTriangle },
  confirmed: { label: 'Confirmado', color: 'bg-green-500', icon: Check },
  in_progress: { label: 'Em Atendimento', color: 'bg-blue-500', icon: Play },
  completed: { label: 'Concluído', color: 'bg-gray-500', icon: Square },
  cancelled: { label: 'Cancelado', color: 'bg-red-500', icon: X },
  no_show: { label: 'Não Compareceu', color: 'bg-orange-500', icon: AlertTriangle }
};

const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  confirmation: 'Confirmação',
  reminder: 'Lembrete',
  review: 'Avaliação'
};

export function BookingActionsDialog({
  open,
  onOpenChange,
  booking,
  onSuccess
}: BookingActionsDialogProps) {
  const [updating, setUpdating] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [sendingConfirmation, setSendingConfirmation] = useState(false);
  const queryClient = useQueryClient();

  // Buscar histórico de notificações
  const { data: notificationLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['booking-notification-logs', booking?.id],
    queryFn: async () => {
      if (!booking?.id) return [];
      const { data, error } = await supabase
        .from('booking_notification_logs')
        .select('*')
        .eq('booking_id', booking.id)
        .order('sent_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching notification logs:', error);
        return [];
      }
      return (data || []) as NotificationLog[];
    },
    enabled: !!booking?.id && open
  });

  if (!booking) return null;

  const statusConfig = STATUS_CONFIG[booking.status];

  const updateStatus = async (newStatus: BookingStatus, reason?: string) => {
    setUpdating(true);
    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      
      if (newStatus === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
        updateData.cancellation_reason = reason || null;
      }

      const { error } = await (supabase as any)
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id);

      if (error) throw error;

      toast.success(`Agendamento ${STATUS_CONFIG[newStatus].label.toLowerCase()}!`);
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Erro ao atualizar agendamento');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    if (showCancelForm) {
      updateStatus('cancelled', cancellationReason);
    } else {
      setShowCancelForm(true);
    }
  };

  const handleSendConfirmation = async () => {
    setSendingConfirmation(true);
    try {
      const { data, error } = await supabase.functions.invoke('booking-confirmation', {
        body: { booking_id: booking.id, manual: true }
      });
      
      if (error) throw error;
      
      toast.success('Confirmação enviada pelo WhatsApp!');
      queryClient.invalidateQueries({ queryKey: ['booking-notification-logs', booking.id] });
    } catch (err) {
      console.error('Error sending confirmation:', err);
      toast.error('Erro ao enviar confirmação');
    } finally {
      setSendingConfirmation(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM HH:mm", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const getAvailableActions = (): { status: BookingStatus; label: string; variant: 'default' | 'outline' | 'destructive' }[] => {
    switch (booking.status) {
      case 'pending':
        return [
          { status: 'confirmed', label: 'Confirmar', variant: 'default' }
        ];
      case 'confirmed':
        return [
          { status: 'in_progress', label: 'Iniciar Atendimento', variant: 'default' }
        ];
      case 'in_progress':
        return [
          { status: 'completed', label: 'Finalizar Atendimento', variant: 'default' },
          { status: 'no_show', label: 'Não Compareceu', variant: 'outline' }
        ];
      default:
        return [];
    }
  };

  const availableActions = getAvailableActions();
  const canCancel = ['pending', 'confirmed'].includes(booking.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Agendamento</DialogTitle>
          <DialogDescription>
            Visualize e gerencie este agendamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge className={cn("text-white", statusConfig.color)}>
              <statusConfig.icon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Customer Info */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{booking.customer_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{booking.customer_phone}</span>
            </div>
          </div>

          {/* Booking Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize">{formatDate(booking.booking_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</span>
            </div>
            {booking.service_name && (
              <div className="flex items-center gap-2">
                <Scissors className="h-4 w-4 text-muted-foreground" />
                <span>{booking.service_name}</span>
              </div>
            )}
            {booking.professional_name && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{booking.professional_name}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-sm text-muted-foreground">{booking.notes}</p>
            </div>
          )}

          {/* Histórico de Notificações */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Notificações WhatsApp
            </h4>
            
            {/* Botão Enviar Confirmação */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendConfirmation}
              disabled={sendingConfirmation}
              className="w-full mb-3 gap-2"
            >
              {sendingConfirmation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4 text-green-500" />
              )}
              Enviar Confirmação WhatsApp
            </Button>

            {logsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : notificationLogs && notificationLogs.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {notificationLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between text-sm bg-muted/30 rounded p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={log.send_method === 'automatic' ? 'secondary' : 'default'}
                        className="text-xs"
                      >
                        {log.send_method === 'automatic' ? 'Auto' : 'Manual'}
                      </Badge>
                      <span className="text-muted-foreground">
                        {NOTIFICATION_TYPE_LABELS[log.notification_type] || log.notification_type}
                      </span>
                      {log.status === 'failed' && (
                        <Badge variant="destructive" className="text-xs">Falhou</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(log.sent_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                Nenhuma notificação enviada
              </p>
            )}
          </div>

          {/* Cancel Form */}
          {showCancelForm && (
            <div className="border border-destructive/30 rounded-lg p-4 space-y-3">
              <Label>Motivo do cancelamento (opcional)</Label>
              <Textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Ex: Cliente solicitou, reagendamento..."
                rows={2}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {/* Available Actions */}
          {availableActions.map((action) => (
            <Button
              key={action.status}
              variant={action.variant}
              onClick={() => updateStatus(action.status)}
              disabled={updating}
              className="w-full sm:w-auto"
            >
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {action.label}
            </Button>
          ))}
          
          {/* Cancel Button */}
          {canCancel && (
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={updating}
              className="w-full sm:w-auto"
            >
              {updating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <X className="h-4 w-4 mr-2" />
              {showCancelForm ? 'Confirmar Cancelamento' : 'Cancelar'}
            </Button>
          )}

          {/* Close */}
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}