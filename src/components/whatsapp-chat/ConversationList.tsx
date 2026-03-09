import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Search, MessageCircle, CheckCircle2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversationItem } from './ConversationItem';
import { AddContactModal } from './AddContactModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Conversation } from '@/pages/admin/WhatsAppChatPage';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  storeId?: string;
  onConversationCreated?: (conversation: Conversation) => void;
}

export function ConversationList({ conversations, selectedId, onSelect, storeId, onConversationCreated }: ConversationListProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'open' | 'closed'>('open');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Carregar status atual do perfil
  useEffect(() => {
    const loadStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('is_chat_online')
        .eq('id', user.id)
        .single();
      if (data) setIsOnline(!!(data as any).is_chat_online);
      setLoadingStatus(false);
    };
    loadStatus();
  }, []);

  const toggleOnline = async (checked: boolean) => {
    setIsOnline(checked);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ is_chat_online: checked } as any)
      .eq('id', user.id);
    if (error) {
      toast.error('Erro ao atualizar status');
      setIsOnline(!checked);
    }
  };

  const filtered = conversations.filter(c => {
    const term = search.toLowerCase();
    const matchesSearch =
      (c.contact_name || '').toLowerCase().includes(term) ||
      c.phone_number.includes(term);
    const matchesTab = tab === 'open'
      ? c.status !== 'closed'
      : c.status === 'closed';
    return matchesSearch && matchesTab;
  });

  const openCount = conversations.filter(c => c.status !== 'closed').length;
  const closedCount = conversations.filter(c => c.status === 'closed').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header com busca */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar conversa..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          {storeId && (
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9 flex-shrink-0"
              onClick={() => setAddModalOpen(true)}
              title="Nova conversa"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Tabs */}
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
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            {search
              ? 'Nenhuma conversa encontrada'
              : tab === 'open'
                ? 'Nenhuma conversa aberta'
                : 'Nenhuma conversa finalizada'}
          </div>
        ) : (
          filtered.map(conv => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isSelected={conv.id === selectedId}
              onSelect={() => onSelect(conv)}
            />
          ))
        )}
      </ScrollArea>

      {/* Modal de adicionar contato */}
      {storeId && (
        <AddContactModal
          open={addModalOpen}
          onOpenChange={setAddModalOpen}
          storeId={storeId}
          onConversationReady={(conv) => {
            onConversationCreated?.(conv);
            onSelect(conv);
          }}
        />
      )}
    </div>
  );
}
