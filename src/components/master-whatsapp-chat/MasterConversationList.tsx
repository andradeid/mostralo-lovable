import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageCircle, CheckCircle2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { MasterConversation } from '@/pages/admin/MasterWhatsAppChatPage';

interface MasterConversationListProps {
  conversations: MasterConversation[];
  selectedId: string | null;
  onSelect: (conversation: MasterConversation) => void;
}

function getBotTypeLabel(type: string | null) {
  switch (type) {
    case 'sales': return { label: '💰 Vendas', color: 'bg-emerald-500/10 text-emerald-600' };
    case 'recruitment': return { label: '👥 Recrutamento', color: 'bg-blue-500/10 text-blue-600' };
    case 'support': return { label: '❓ Suporte', color: 'bg-amber-500/10 text-amber-600' };
    default: return { label: '🤖 Bot', color: 'bg-muted text-muted-foreground' };
  }
}

export function MasterConversationList({ conversations, selectedId, onSelect }: MasterConversationListProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'open' | 'closed'>('open');

  const filtered = conversations.filter(c => {
    const term = search.toLowerCase();
    const matchesSearch =
      (c.contact_name || '').toLowerCase().includes(term) ||
      c.phone_number.includes(term);
    const matchesTab = tab === 'open'
      ? c.status !== 'closed'
      : c.status === 'closed';
    return matchesSearch && matchesTab;
  }).sort((a, b) => {
    return new Date(b.last_message_at || '').getTime() - new Date(a.last_message_at || '').getTime();
  });

  const openCount = conversations.filter(c => c.status !== 'closed').length;
  const closedCount = conversations.filter(c => c.status === 'closed').length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 pt-3 pb-1">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          Chat Master
        </h2>
      </div>

      {/* Busca + tabs */}
      <div className="px-3 pb-3 border-b border-border space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
          <button
            onClick={() => setTab('open')}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-colors ${
              tab === 'open'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Abertas
            {openCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {openCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('closed')}
            className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-colors ${
              tab === 'closed'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Finalizadas
            {closedCount > 0 && (
              <span className="bg-muted-foreground/20 text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {closedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Lista */}
      <ScrollArea className="flex-1 overflow-x-hidden [&>div>div]:!block">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            {search ? 'Nenhuma conversa encontrada' : tab === 'open' ? 'Nenhuma conversa aberta' : 'Nenhuma conversa finalizada'}
          </div>
        ) : (
          filtered.map(conv => {
            const displayName = conv.contact_name || conv.phone_number;
            const initials = displayName.slice(0, 2).toUpperCase();
            const timeAgo = conv.last_message_at
              ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true, locale: ptBR })
              : '';
            const botInfo = getBotTypeLabel(conv.active_bot_type);

            return (
              <div
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/50',
                  conv.id === selectedId && 'bg-primary/5 border-l-2 border-l-primary'
                )}
              >
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={conv.profile_picture_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-medium text-sm truncate">{displayName}</span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs text-muted-foreground truncate flex-1">
                      {conv.last_message || 'Sem mensagens'}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full', botInfo.color)}>
                      {botInfo.label}
                    </span>
                    {!conv.is_bot_active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">
                        ⏸ Bot pausado
                      </span>
                    )}
                    {conv.needs_human && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                        🔔 Atendimento
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </ScrollArea>
    </div>
  );
}
