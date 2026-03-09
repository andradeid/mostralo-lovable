import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bot, User, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Conversation } from '@/pages/admin/WhatsAppChatPage';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
}

export function ConversationItem({ conversation, isSelected, onSelect }: ConversationItemProps) {
  const displayName = conversation.contact_name || formatPhone(conversation.phone_number);
  const initials = displayName.slice(0, 2).toUpperCase();
  const timeAgo = conversation.last_message_at
    ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true, locale: ptBR })
    : '';

  const attendantName = conversation.assigned_profile?.full_name;

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 overflow-hidden',
        isSelected && 'bg-muted'
      )}
    >
      <Avatar className="w-10 h-10 flex-shrink-0">
        <AvatarImage src={conversation.profile_picture_url || undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{displayName}</span>
          <span className="text-[11px] text-muted-foreground flex-shrink-0">{timeAgo}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-xs text-muted-foreground truncate">
              {conversation.last_message_direction === 'outgoing' && (
                <span className="text-primary">✓✓ </span>
              )}
              {conversation.last_message || 'Sem mensagens'}
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {conversation.is_bot_active && (
              <Bot className="w-3 h-3 text-muted-foreground" />
            )}
            {conversation.unread_count > 0 && (
              <Badge variant="default" className="h-5 min-w-[20px] px-1.5 text-[10px] rounded-full">
                {conversation.unread_count}
              </Badge>
            )}
          </div>
        </div>
        {attendantName ? (
          <div className="flex items-center gap-1 mt-0.5">
            <User className="w-3 h-3 text-primary/70 flex-shrink-0" />
            <span className="text-[10px] text-primary/70 truncate">{attendantName}</span>
          </div>
        ) : conversation.is_bot_active ? (
          <div className="flex items-center gap-1 mt-0.5">
            <Bot className="w-3 h-3 text-primary/70 flex-shrink-0" />
            <span className="text-[10px] text-primary/70 truncate">IA atendendo</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 mt-0.5">
            <AlertCircle className="w-3 h-3 text-destructive/70 flex-shrink-0" />
            <span className="text-[10px] text-destructive/70 truncate">Sem atendimento</span>
          </div>
        )}
      </div>
    </button>
  );
}

function formatPhone(phone: string): string {
  if (phone.length === 13 && phone.startsWith('55')) {
    return `(${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
  }
  if (phone.length === 12 && phone.startsWith('55')) {
    return `(${phone.slice(2, 4)}) ${phone.slice(4, 8)}-${phone.slice(8)}`;
  }
  return phone;
}
