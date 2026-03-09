import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bot, BotOff, Phone, CheckCircle2, RotateCcw, User, ArrowRightLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Conversation } from '@/pages/admin/WhatsAppChatPage';
import { TransferAttendantModal } from './TransferAttendantModal';

interface ChatHeaderProps {
  conversation: Conversation;
  onBack?: () => void;
  onStatusChange?: (action: 'closed' | 'reopened') => void;
}

export function ChatHeader({ conversation, onBack, onStatusChange }: ChatHeaderProps) {
  const [transferOpen, setTransferOpen] = useState(false);
  const displayName = conversation.contact_name || conversation.phone_number;
  const initials = displayName.slice(0, 2).toUpperCase();
  const isClosed = conversation.status === 'closed';
  const attendantName = conversation.assigned_profile?.full_name;

  const handleToggleStatus = async () => {
    const newStatus = isClosed ? 'active' : 'closed';
    try {
      // Ao finalizar: resetar is_bot_active para true (próxima conversa inicia com IA)
      // Ao reabrir: manter is_bot_active como true
      const updateData: any = { status: newStatus };
      if (!isClosed) {
        // Finalizando conversa → resetar IA para próxima conversa
        updateData.is_bot_active = true;
      }

      const { error } = await supabase
        .from('whatsapp_conversations')
        .update(updateData)
        .eq('id', conversation.id)
        .select();

      if (error) {
        console.error('Erro ao atualizar conversa:', error);
        toast.error(`Erro ao atualizar: ${error.message}`);
        return;
      }

      // Ao finalizar, limpar pausa do bot para este contato
      if (!isClosed) {
        await supabase
          .from('whatsapp_paused_contacts')
          .update({ status: 'reactivated' })
          .eq('store_id', conversation.store_id)
          .eq('remote_jid', conversation.remote_jid)
          .eq('status', 'paused');
      }

      toast.success(isClosed ? 'Conversa reaberta' : 'Conversa finalizada');
      onStatusChange?.(isClosed ? 'reopened' : 'closed');
    } catch (err) {
      console.error('Exceção ao atualizar conversa:', err);
      toast.error('Erro inesperado ao atualizar conversa');
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background">
      {onBack && (
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
      )}

      <Avatar className="w-9 h-9">
        <AvatarImage src={conversation.profile_picture_url || undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{displayName}</p>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1 flex-wrap">
          <Phone className="w-3 h-3" />
          {conversation.phone_number}
          {conversation.is_bot_active ? (
            <span className="flex items-center gap-0.5 ml-2 text-primary">
              <Bot className="w-3 h-3" /> IA ativa
            </span>
          ) : (
            <span className="flex items-center gap-0.5 ml-2 text-orange-500">
              <BotOff className="w-3 h-3" /> IA pausada
            </span>
          )}
          {attendantName && (
            <span className="flex items-center gap-0.5 ml-2 text-primary/70">
              <User className="w-3 h-3" /> {attendantName}
            </span>
          )}
        </p>
      </div>

      {!isClosed && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTransferOpen(true)}
          className="gap-1.5 text-xs h-8 shrink-0"
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Transferir</span>
        </Button>
      )}

      <Button
        variant={isClosed ? 'outline' : 'destructive'}
        size="sm"
        onClick={handleToggleStatus}
        className="gap-1.5 text-xs h-8 shrink-0"
      >
        {isClosed ? (
          <>
            <RotateCcw className="w-3.5 h-3.5" />
            Reabrir
          </>
        ) : (
          <>
            <CheckCircle2 className="w-3.5 h-3.5" />
            Finalizar
          </>
        )}
      </Button>

      <TransferAttendantModal
        open={transferOpen}
        onOpenChange={setTransferOpen}
        conversationId={conversation.id}
        storeId={conversation.store_id}
        currentAssignedTo={conversation.assigned_to}
      />
    </div>
  );
}
