import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bot, BotOff, Phone, CheckCircle2, RotateCcw, Play, UserCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { MasterContactInfoPanel } from './MasterContactInfoPanel';
import type { MasterConversation } from '@/pages/admin/MasterWhatsAppChatPage';

interface MasterChatHeaderProps {
  conversation: MasterConversation;
  configId: string;
  onBack?: () => void;
  onStatusChange?: (action: 'closed' | 'reopened') => void;
}

function getBotTypeLabel(type: string | null) {
  switch (type) {
    case 'sales': return '💰 Vendas';
    case 'recruitment': return '👥 Recrutamento';
    case 'support': return '❓ Suporte';
    default: return '🤖 Bot';
  }
}

export function MasterChatHeader({ conversation, configId, onBack, onStatusChange }: MasterChatHeaderProps) {
  const [contactSheetOpen, setContactSheetOpen] = useState(false);
  const displayName = conversation.contact_name || conversation.phone_number;
  const initials = displayName.slice(0, 2).toUpperCase();
  const isClosed = conversation.status === 'closed';

  const handleToggleStatus = async () => {
    const newStatus = isClosed ? 'active' : 'closed';
    try {
      const updateData: Record<string, unknown> = { status: newStatus };
      if (!isClosed) {
        updateData.is_bot_active = true;
      }

      const { error } = await supabase
        .from('master_whatsapp_conversations')
        .update(updateData)
        .eq('id', conversation.id);

      if (error) {
        toast.error(`Erro ao atualizar: ${error.message}`);
        return;
      }

      toast.success(isClosed ? 'Conversa reaberta' : 'Conversa finalizada');
      onStatusChange?.(isClosed ? 'reopened' : 'closed');
    } catch {
      toast.error('Erro inesperado ao atualizar conversa');
    }
  };

  const handleReactivateBot = async () => {
    try {
      // Reativar bot na sessão
      await supabase
        .from('master_whatsapp_sessions')
        .update({ bot_paused: false, paused_at: null, paused_reason: null })
        .eq('config_id', conversation.config_id)
        .eq('phone_number', conversation.phone_number);

      // Atualizar is_bot_active na conversa
      await supabase
        .from('master_whatsapp_conversations')
        .update({ is_bot_active: true })
        .eq('id', conversation.id);

      toast.success('Bot reativado para este contato');
    } catch {
      toast.error('Erro ao reativar bot');
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
          <span className="ml-2">{getBotTypeLabel(conversation.active_bot_type)}</span>
          {conversation.is_bot_active ? (
            <span className="flex items-center gap-0.5 ml-1 text-primary">
              <Bot className="w-3 h-3" /> IA ativa
            </span>
          ) : (
            <span className="flex items-center gap-0.5 ml-1 text-destructive">
              <BotOff className="w-3 h-3" /> IA pausada
            </span>
          )}
        </p>
      </div>

      {/* Botão reativar bot quando pausado */}
      {!isClosed && !conversation.is_bot_active && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleReactivateBot}
          className="gap-1.5 text-xs h-8 shrink-0"
        >
          <Play className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reativar IA</span>
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
    </div>
  );
}
