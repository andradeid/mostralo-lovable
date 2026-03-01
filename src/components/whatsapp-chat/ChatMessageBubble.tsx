import { cn } from '@/lib/utils';
import { Bot } from 'lucide-react';
import { format } from 'date-fns';
import type { ChatMessage } from '@/pages/admin/WhatsAppChatPage';

interface ChatMessageBubbleProps {
  message: ChatMessage;
}

export function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isOutgoing = message.direction === 'outgoing';
  const time = format(new Date(message.timestamp), 'HH:mm');

  return (
    <div className={cn('flex mb-1', isOutgoing ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[75%] rounded-lg px-3 py-2 text-sm relative',
          isOutgoing
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-card border border-border rounded-bl-sm'
        )}
      >
        {/* Indicador de bot */}
        {message.is_from_bot && isOutgoing && (
          <div className="flex items-center gap-1 text-[10px] opacity-70 mb-1">
            <Bot className="w-3 h-3" /> Bot
          </div>
        )}

        {/* Mídia */}
        {message.message_type === 'image' && message.media_url && (
          <img
            src={message.media_url}
            alt="Imagem"
            className="rounded max-w-full mb-1 cursor-pointer"
            onClick={() => window.open(message.media_url!, '_blank')}
          />
        )}

        {message.message_type === 'audio' && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs">🎵 Mensagem de áudio</span>
          </div>
        )}

        {/* Conteúdo de texto */}
        {message.content && (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}

        {/* Hora */}
        <span
          className={cn(
            'text-[10px] float-right mt-1 ml-2',
            isOutgoing ? 'opacity-70' : 'text-muted-foreground'
          )}
        >
          {time}
        </span>
      </div>
    </div>
  );
}
