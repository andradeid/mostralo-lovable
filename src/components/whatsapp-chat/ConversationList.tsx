import { useState, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Search, MessageCircle, CheckCircle2, Plus, Volume2, VolumeX, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ConversationItem } from './ConversationItem';
import { AddContactModal } from './AddContactModal';
import { supabase } from '@/integrations/supabase/client';
import type { Conversation } from '@/pages/admin/WhatsAppChatPage';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  storeId?: string;
  onConversationCreated?: (conversation: Conversation) => void;
  isAiConfigured?: boolean;
  attendantTypingConvId?: string | null;
  clientTypingConvIds?: Set<string>;
  clientPresenceMap?: Map<string, string>;
  soundEnabled?: boolean;
  onSoundToggle?: (enabled: boolean) => void;
}

export function ConversationList({ conversations, selectedId, onSelect, storeId, onConversationCreated, isAiConfigured = false, attendantTypingConvId, clientTypingConvIds, clientPresenceMap, soundEnabled = true, onSoundToggle }: ConversationListProps) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'open' | 'closed'>('open');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [permanentlyPausedJids, setPermanentlyPausedJids] = useState<Set<string>>(new Set());
  const [closingInactive, setClosingInactive] = useState(false);

  const cutoff24h = Date.now() - 24 * 60 * 60 * 1000;
  const inactiveCount = conversations.filter(c => 
    c.status !== 'closed' && 
    new Date(c.updated_at || c.last_message_at || c.created_at).getTime() < cutoff24h
  ).length;

  const handleCloseInactive = async () => {
    if (!storeId) return;
    setClosingInactive(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-close-inactive', {
        body: { storeId },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`${data.closedCount} conversa(s) finalizada(s) com sucesso`);
      } else {
        toast.error(data?.error || 'Erro ao finalizar conversas');
      }
    } catch (err: unknown) {
      console.error('Erro ao finalizar conversas inativas:', err);
      toast.error('Erro ao finalizar conversas inativas');
    } finally {
      setClosingInactive(false);
    }
  };

  // Buscar contatos com bloqueio permanente
  useEffect(() => {
    if (!storeId) return;
    const fetchPermanent = async () => {
      const { data } = await supabase
        .from('whatsapp_paused_contacts')
        .select('remote_jid')
        .eq('store_id', storeId)
        .eq('status', 'permanently_paused');
      if (data) {
        setPermanentlyPausedJids(new Set(data.map(d => d.remote_jid)));
      }
    };
    fetchPermanent();
    const interval = setInterval(fetchPermanent, 15000);
    return () => clearInterval(interval);
  }, [storeId]);
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
  }).sort((a, b) => {
    if (tab === 'closed') {
      // Finalizadas: ordenar por updated_at (quando foi fechada) mais recente primeiro
      const dateA = new Date(a.updated_at || a.last_message_at || a.created_at).getTime();
      const dateB = new Date(b.updated_at || b.last_message_at || b.created_at).getTime();
      return dateB - dateA;
    }
    // Abertas: manter ordem original (last_message_at desc)
    return 0;
  });

  const openCount = conversations.filter(c => c.status !== 'closed').length;
  const closedCount = conversations.filter(c => c.status === 'closed').length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toggle online/offline + som */}
      <div className="px-3 pt-3 pb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="h-7 w-7 shrink-0 border border-border rounded-md hover:bg-muted" />
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
          <span className="text-xs font-medium text-foreground">
            {loadingStatus ? '...' : isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Botão de som de alerta */}
          {onSoundToggle && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onSoundToggle(!soundEnabled)}
                >
                  {soundEnabled ? (
                    <Volume2 className="h-4 w-4 text-primary" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {soundEnabled ? 'Som de alerta ligado' : 'Som de alerta desligado'}
              </TooltipContent>
            </Tooltip>
          )}
          <Switch
            checked={isOnline}
            onCheckedChange={toggleOnline}
            disabled={loadingStatus}
            className="scale-90"
          />
        </div>
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

        {/* Botão fechar inativas > 24h */}
        {tab === 'open' && inactiveCount > 0 && storeId && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5 h-8 text-muted-foreground hover:text-foreground"
                disabled={closingInactive}
              >
                {closingInactive ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                Finalizar {inactiveCount} inativa(s) +24h
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Finalizar conversas inativas</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso vai finalizar {inactiveCount} conversa(s) que não têm atividade há mais de 24 horas. Deseja continuar?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleCloseInactive}>
                  Finalizar todas
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Lista */}
      <ScrollArea className="flex-1 overflow-x-hidden [&>div>div]:!block">
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
              isAiConfigured={isAiConfigured}
              isAttendantTyping={attendantTypingConvId === conv.id}
              isClientTyping={clientTypingConvIds?.has(conv.id) || false}
              clientPresenceType={clientPresenceMap?.get(conv.id)}
              isPermanentlyPaused={permanentlyPausedJids.has(conv.remote_jid)}
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
