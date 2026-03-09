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
    let userId: string | null = null;

    const loadStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;
      const { data } = await supabase
        .from('profiles')
        .select('is_chat_online')
        .eq('id', user.id)
        .single();
      if (data) setIsOnline(!!(data as any).is_chat_online);
      setLoadingStatus(false);
    };
    loadStatus();

    // Auto-offline ao fechar aba ou fazer logout
    const setOffline = () => {
      if (!userId) return;
      // Usar sendBeacon para garantir envio antes de fechar
      const url = `https://noshwvwpjtnvndokbfjx.supabase.co/rest/v1/profiles?id=eq.${userId}`;
      const body = JSON.stringify({ is_chat_online: false });
      const headers = {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA',
        'Prefer': 'return=minimal',
      };
      try {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(url + '&apikey=' + headers.apikey, blob);
      } catch {
        // fallback
        fetch(url, { method: 'PATCH', headers, body, keepalive: true });
      }
    };

    const handleBeforeUnload = () => setOffline();
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        // Não setar offline ao minimizar, apenas ao fechar
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Listener para logout do Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setOffline();
        setIsOnline(false);
      }
    });

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      subscription.unsubscribe();
    };
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
      {/* Toggle online/offline */}
      <div className="px-3 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="h-7 w-7 shrink-0" />
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
          <span className="text-xs font-medium text-foreground">
            {loadingStatus ? '...' : isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <Switch
          checked={isOnline}
          onCheckedChange={toggleOnline}
          disabled={loadingStatus}
          className="scale-90"
        />
      </div>

      {/* Header com busca */}
      <div className="px-3 pb-3 border-b border-border space-y-2">
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
