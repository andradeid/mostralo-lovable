import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Check, X, Play, Square, AlertTriangle, Loader2, 
  MessageCircle, Send, Link2, PhoneCall, Undo2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Booking } from '@/hooks/useBooking';

interface BookingInlineActionsProps {
  booking: Booking;
  onSuccess?: () => void;
  compact?: boolean;
}

type BookingStatus = Booking['status'];

export function BookingInlineActions({ booking, onSuccess, compact = false }: BookingInlineActionsProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [sendingWpp, setSendingWpp] = useState<string | null>(null);

  const updateStatus = async (newStatus: BookingStatus, reason?: string) => {
    setUpdating(newStatus);
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
      toast.success(getStatusMessage(newStatus));
      onSuccess?.();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Erro ao atualizar agendamento');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusMessage = (status: BookingStatus) => {
    const messages: Record<BookingStatus, string> = {
      pending: 'Agendamento pendente',
      confirmed: 'Agendamento confirmado!',
      in_progress: 'Atendimento iniciado!',
      completed: 'Atendimento concluído!',
      no_show: 'Marcado como não compareceu',
      cancelled: 'Agendamento cancelado',
    };
    return messages[status];
  };

  // WhatsApp actions
  const handleSendConfirmation = async () => {
    setSendingWpp('confirmation');
    try {
      const { error } = await supabase.functions.invoke('booking-confirmation', {
        body: { booking_id: booking.id, manual: true }
      });
      if (error) throw error;
      toast.success('Confirmação enviada pelo WhatsApp!');
    } catch (err) {
      console.error('Error sending confirmation:', err);
      toast.error('Erro ao enviar confirmação');
    } finally {
      setSendingWpp(null);
    }
  };

  const handleSendMagicLink = async () => {
    setSendingWpp('magic_link');
    try {
      const { data, error } = await supabase.functions.invoke('booking-magic-link', {
        body: { action: 'create', booking_id: booking.id }
      });
      if (error) throw error;
      if (data?.whatsapp_sent) {
        toast.success('Link mágico enviado pelo WhatsApp!');
      } else {
        toast.success('Link mágico gerado!');
      }
    } catch (err) {
      console.error('Error sending magic link:', err);
      toast.error('Erro ao enviar link mágico');
    } finally {
      setSendingWpp(null);
    }
  };

  const handleOpenChat = () => {
    const phone = booking.customer_phone?.replace(/\D/g, '');
    if (phone) {
      window.open(`https://wa.me/${phone}`, '_blank');
    }
  };

  // Determine contextual actions based on current status
  const getContextualActions = () => {
    switch (booking.status) {
      case 'pending':
        return [
          { status: 'confirmed' as BookingStatus, label: 'Confirmar', icon: Check, variant: 'default' as const },
          { status: 'cancelled' as BookingStatus, label: 'Cancelar', icon: X, variant: 'destructive' as const },
        ];
      case 'confirmed':
        return [
          { status: 'in_progress' as BookingStatus, label: 'Iniciar', icon: Play, variant: 'default' as const },
          { status: 'cancelled' as BookingStatus, label: 'Cancelar', icon: X, variant: 'destructive' as const },
        ];
      case 'in_progress':
        return [
          { status: 'completed' as BookingStatus, label: 'Finalizar', icon: Square, variant: 'default' as const },
          { status: 'no_show' as BookingStatus, label: 'Não veio', icon: AlertTriangle, variant: 'outline' as const },
        ];
      case 'completed':
        return [
          { status: 'in_progress' as BookingStatus, label: 'Reabrir', icon: Undo2, variant: 'outline' as const },
        ];
      case 'no_show':
        return [
          { status: 'in_progress' as BookingStatus, label: 'Reabrir', icon: Undo2, variant: 'outline' as const },
        ];
      default:
        return [];
    }
  };

  const actions = getContextualActions();

  if (compact) {
    return (
      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
        {actions.slice(0, 2).map((action) => (
          <Button
            key={action.status}
            variant={action.variant === 'destructive' ? 'ghost' : action.variant}
            size="sm"
            className={`h-7 px-2 text-[10px] gap-1 ${action.variant === 'destructive' ? 'text-destructive hover:text-destructive' : ''}`}
            onClick={(e) => { e.stopPropagation(); updateStatus(action.status); }}
            disabled={!!updating}
          >
            {updating === action.status ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <action.icon className="h-3 w-3" />
            )}
            {action.label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap" onClick={e => e.stopPropagation()}>
      {/* Status action buttons */}
      {actions.map((action) => (
        <Button
          key={action.status}
          variant={action.variant}
          size="sm"
          className="h-8 px-3 text-xs gap-1.5"
          onClick={(e) => { e.stopPropagation(); updateStatus(action.status); }}
          disabled={!!updating}
        >
          {updating === action.status ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <action.icon className="h-3.5 w-3.5" />
          )}
          {action.label}
        </Button>
      ))}

      {/* WhatsApp smart dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs gap-1.5 text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950/30"
            disabled={!!sendingWpp}
            onClick={(e) => e.stopPropagation()}
          >
            {sendingWpp ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <MessageCircle className="h-3.5 w-3.5" />
            )}
            WhatsApp
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={handleSendConfirmation} className="gap-2">
            <Send className="h-4 w-4 text-green-500" />
            Enviar confirmação
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSendMagicLink} className="gap-2">
            <Link2 className="h-4 w-4 text-blue-500" />
            Enviar link mágico
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleOpenChat} className="gap-2">
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
            Abrir conversa
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
