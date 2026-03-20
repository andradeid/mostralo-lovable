import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bot, User, AlertCircle, Image, Mic, Video, FileText, Sticker, MapPin, Smartphone, ShieldBan, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Conversation } from '@/pages/admin/WhatsAppChatPage';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
  isAiConfigured?: boolean;
  isAttendantTyping?: boolean;
  isClientTyping?: boolean;
  clientPresenceType?: string;
  isPermanentlyPaused?: boolean;
}

export function ConversationItem({ conversation, isSelected, onSelect, isAiConfigured = false, isAttendantTyping = false, isClientTyping = false, clientPresenceType, isPermanentlyPaused = false }: ConversationItemProps) {
  const displayName = conversation.contact_name || formatPhone(conversation.phone_number);
  const initials = displayName.slice(0, 2).toUpperCase();
  const timeAgo = conversation.last_message_at
    ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true, locale: ptBR })
    : '';

  const attendantName = conversation.assigned_profile?.full_name;

  const lastMsg = conversation.last_message || 'Sem mensagens';

  // Detectar tipo de mídia e renderizar com ícone
  const getMediaDisplay = (msg: string) => {
    if (msg === '[mídia]' || msg === '📷 Mídia') return { icon: <Image className="w-3.5 h-3.5 flex-shrink-0" />, text: 'Foto' };
    if (msg === '📷 Imagem') return { icon: <Image className="w-3.5 h-3.5 flex-shrink-0" />, text: 'Foto' };
    if (msg === '🎵 Áudio' || msg === '🎤 Áudio') return { icon: <Mic className="w-3.5 h-3.5 flex-shrink-0" />, text: 'Áudio' };
    if (msg === '🎥 Vídeo') return { icon: <Video className="w-3.5 h-3.5 flex-shrink-0" />, text: 'Vídeo' };
    if (msg === '📄 Documento') return { icon: <FileText className="w-3.5 h-3.5 flex-shrink-0" />, text: 'Documento' };
    if (msg === '🏷️ Figurinha') return { icon: <Sticker className="w-3.5 h-3.5 flex-shrink-0" />, text: 'Figurinha' };
    if (msg === '📍 Localização') return { icon: <MapPin className="w-3.5 h-3.5 flex-shrink-0" />, text: 'Localização' };
    if (msg.startsWith('💰 Cobrança')) return { icon: <span className="text-xs">💰</span>, text: msg.replace('💰 ', '') };
    return null;
  };

  const mediaDisplay = getMediaDisplay(lastMsg);

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-200 border-b border-border/30 overflow-hidden max-w-full relative',
        'hover:bg-muted/40',
        isSelected
          ? 'bg-primary/5 dark:bg-primary/10 border-l-[3px] border-l-primary'
          : 'border-l-[3px] border-l-transparent'
      )}
    >
      <Avatar className="w-10 h-10 flex-shrink-0">
        <AvatarImage src={conversation.profile_picture_url || undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-1">
          <span className="font-medium text-sm truncate max-w-[60%]">{displayName}</span>
          <span className="text-[11px] text-muted-foreground flex-shrink-0 whitespace-nowrap max-w-[40%] truncate">{timeAgo}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="flex-1 min-w-0 w-0 overflow-hidden">
            {isClientTyping ? (
              <div className="flex items-center gap-1.5 text-xs text-primary">
                {clientPresenceType === 'recording' ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                    <span className="font-medium text-destructive">Gravando áudio...</span>
                  </>
                ) : (
                  <>
                    <div className="flex gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="font-medium">Digitando...</span>
                  </>
                )}
              </div>
            ) : isAttendantTyping ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Você está digitando...</span>
              </div>
            ) : mediaDisplay ? (
              <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                {conversation.last_message_direction === 'outgoing' && (
                  <span className="text-primary flex-shrink-0">✓✓</span>
                )}
                {mediaDisplay.icon}
                <span className="truncate">{mediaDisplay.text}</span>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                {conversation.last_message_direction === 'outgoing' && (
                  <span className="text-primary flex-shrink-0">✓✓</span>
                )}
                <span className="truncate">{lastMsg}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Badge de "precisa de atendente" */}
            {(conversation as any).needs_human && (
              <span className="relative flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <Bell className="relative h-4 w-4 text-orange-500" />
              </span>
            )}
            {isAiConfigured && conversation.is_bot_active && (
              <Bot className="w-3 h-3 text-muted-foreground" />
            )}
            {conversation.unread_count > 0 && (
              <Badge variant="default" className="h-5 min-w-[20px] px-1.5 text-[10px] rounded-full">
                {conversation.unread_count}
              </Badge>
            )}
          </div>
        </div>
        {isPermanentlyPaused ? (
          <div className="flex items-center gap-1 mt-0.5">
            <ShieldBan className="w-3 h-3 text-destructive flex-shrink-0" />
            <span className="text-[10px] text-destructive font-medium truncate">IA bloqueada</span>
          </div>
        ) : conversation.last_message_source === 'cellphone' && conversation.last_message_direction === 'outgoing' ? (
          <div className="flex items-center gap-1 mt-0.5">
            <Smartphone className="w-3 h-3 text-orange-500 flex-shrink-0" />
            <span className="text-[10px] text-orange-500 truncate">Celular</span>
          </div>
        ) : attendantName ? (
          <div className="flex items-center gap-1 mt-0.5">
            <User className="w-3 h-3 text-primary/70 flex-shrink-0" />
            <span className="text-[10px] text-primary/70 truncate">{attendantName}</span>
          </div>
        ) : isAiConfigured && conversation.is_bot_active ? (
          <div className="flex items-center gap-1 mt-0.5">
            <Bot className="w-3 h-3 text-primary/70 flex-shrink-0" />
            <span className="text-[10px] text-primary/70 truncate">IA atendendo</span>
          </div>
        ) : !isAiConfigured ? (
          <div className="flex items-center gap-1 mt-0.5">
            <AlertCircle className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-[10px] text-muted-foreground truncate">Sem IA configurada</span>
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
