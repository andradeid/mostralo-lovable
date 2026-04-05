import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Search, MessageCircle, CheckCircle2, Bot, BotOff, Image, Mic, Video, FileText, Sticker, MapPin, Smartphone, Bell, Plus, RefreshCw } from 'lucide-react';

import { MasterAddContactModal } from './MasterAddContactModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { MasterConversation } from '@/pages/admin/MasterWhatsAppChatPage';

interface MasterConversationListProps {
  conversations: MasterConversation[];
  selectedId: string | null;
  onSelect: (conversation: MasterConversation) => void;
  configId: string | null;
  onRefresh?: () => void;
  allBotsDisabled?: boolean;
}

function getBotTypeLabel(type: string | null) {
  switch (type) {
    case 'sales': return { label: '💰 Vendas', color: 'bg-emerald-500/10 text-emerald-600' };
    case 'recruitment': return { label: '👥 Recrutamento', color: 'bg-blue-500/10 text-blue-600' };
    case 'support': return { label: '❓ Suporte', color: 'bg-amber-500/10 text-amber-600' };
    default: return { label: '🤖 Bot', color: 'bg-muted text-muted-foreground' };
  }
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

// Detectar tipo de mídia na última mensagem
function getMediaDisplay(msg: string) {
  if (msg === '[mídia]' || msg === '📷 Mídia') return { icon: <Image className="w-3.5 h-3.5 flex-shrink-0" />, text: 'Foto' };
  if (msg === '📷 Imagem') return { icon: <Image className="w-3.5 h-3.5 flex-shrink-0" />, text: 'Foto' };
  if (msg === '🎵 Áudio' || msg === '🎤 Áudio') return { icon: <Mic className="w-3.5 h-3.5 flex-shrink-0" />, text: 'Áudio' };
  if (msg === '🎥 Vídeo') return { icon: <Video className="w-3.5 h-3.5 flex-shrink-0" />, text: 'Vídeo' };
  if (msg === '📄 Documento') return { icon: <FileText className="w-3.5 h-3.5 flex-shrink-0" />, text: 'Documento' };
  if (msg === '🏷️ Figurinha') return { icon: <Sticker className="w-3.5 h-3.5 flex-shrink-0" />, text: 'Figurinha' };
  if (msg === '📍 Localização') return { icon: <MapPin className="w-3.5 h-3.5 flex-shrink-0" />, text: 'Localização' };
  return null;
}

export function MasterConversationList({ conversations, selectedId, onSelect, configId, onRefresh }: MasterConversationListProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'open' | 'closed'>('open');
  const [addModalOpen, setAddModalOpen] = useState(false);

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
    if (tab === 'closed') {
      const dateA = new Date(a.updated_at || a.last_message_at || a.created_at || '').getTime();
      const dateB = new Date(b.updated_at || b.last_message_at || b.created_at || '').getTime();
      return dateB - dateA;
    }
    return new Date(b.last_message_at || '').getTime() - new Date(a.last_message_at || '').getTime();
  });

  const openCount = conversations.filter(c => c.status !== 'closed').length;
  const closedCount = conversations.filter(c => c.status === 'closed').length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Modal Nova Conversa */}
      {configId && (
        <MasterAddContactModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          configId={configId}
          onConversationReady={(conv) => {
            onSelect(conv);
            setAddModalOpen(false);
          }}
        />
      )}

      {/* Header */}
      <div className="px-3 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="h-7 w-7 shrink-0 border border-border rounded-md hover:bg-muted" />
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            Chat Master
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onRefresh}
              title="Atualizar conversas"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setAddModalOpen(true)}
            title="Nova conversa"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
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
            const displayName = conv.contact_name || formatPhone(conv.phone_number);
            const initials = displayName.slice(0, 2).toUpperCase();
            const timeAgo = conv.last_message_at
              ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true, locale: ptBR })
              : '';
            const botInfo = getBotTypeLabel(conv.active_bot_type);
            const lastMsg = conv.last_message || 'Sem mensagens';
            const mediaDisplay = getMediaDisplay(lastMsg);

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all duration-200 border-b border-border/30 overflow-hidden max-w-full relative',
                  'hover:bg-muted/40',
                  conv.id === selectedId
                    ? 'bg-primary/5 dark:bg-primary/10 border-l-[3px] border-l-primary'
                    : 'border-l-[3px] border-l-transparent'
                )}
              >
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={conv.profile_picture_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-sm truncate max-w-[60%]">{displayName}</span>
                    <span className="text-[10px] text-muted-foreground/70 flex-shrink-0 whitespace-nowrap max-w-[40%] truncate">{timeAgo}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <div className="flex-1 min-w-0 w-0 overflow-hidden">
                      {mediaDisplay ? (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                          {conv.last_message_direction === 'outgoing' && (
                            <span className="text-primary flex-shrink-0">✓✓</span>
                          )}
                          {mediaDisplay.icon}
                          <span className="truncate">{mediaDisplay.text}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 min-w-0">
                          {conv.last_message_direction === 'outgoing' && (
                            <span className="text-primary flex-shrink-0">✓✓</span>
                          )}
                          <span className="truncate">{lastMsg}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {conv.needs_human && (
                        <span className="relative flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                          <Bell className="relative h-4 w-4 text-orange-500" />
                        </span>
                      )}
                      {conv.is_bot_active && (
                        <Bot className="w-3 h-3 text-muted-foreground" />
                      )}
                      {conv.unread_count > 0 && (
                        <Badge variant="default" className="h-5 min-w-[20px] px-1.5 text-[10px] rounded-full">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {/* Status row - same pattern as store chat */}
                  {conv.last_message_source === 'phone' && conv.last_message_direction === 'outgoing' ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Smartphone className="w-3 h-3 text-orange-500 flex-shrink-0" />
                      <span className="text-[10px] text-orange-500 truncate">Celular</span>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full ml-1', botInfo.color)}>
                        {botInfo.label}
                      </span>
                    </div>
                  ) : conv.is_bot_active ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Bot className="w-3 h-3 text-primary/70 flex-shrink-0" />
                      <span className="text-[10px] text-primary/70 truncate">IA atendendo</span>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full ml-1', botInfo.color)}>
                        {botInfo.label}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 mt-0.5">
                      <BotOff className="w-3 h-3 text-destructive/70 flex-shrink-0" />
                      <span className="text-[10px] text-destructive/70 truncate">Bot pausado</span>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full ml-1', botInfo.color)}>
                        {botInfo.label}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </ScrollArea>
    </div>
  );
}
