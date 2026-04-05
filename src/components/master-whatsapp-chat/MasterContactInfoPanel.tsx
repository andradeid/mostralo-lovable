import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Phone, Bot, BotOff, Clock, MessageSquare, Tag, Play,
  Calendar, Loader2, StickyNote, Save, X, Pencil
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import type { MasterConversation } from '@/pages/admin/MasterWhatsAppChatPage';

interface MasterContactInfoPanelProps {
  conversation: MasterConversation;
  configId: string;
}

function getBotTypeLabel(type: string | null) {
  switch (type) {
    case 'sales': return '💰 Vendas';
    case 'recruitment': return '👥 Recrutamento';
    case 'support': return '❓ Suporte';
    default: return '🤖 Bot';
  }
}

function getBotTypeBadgeColor(type: string | null) {
  switch (type) {
    case 'sales': return 'border-amber-400 text-amber-600';
    case 'recruitment': return 'border-blue-400 text-blue-600';
    case 'support': return 'border-purple-400 text-purple-600';
    default: return '';
  }
}

export function MasterContactInfoPanel({ conversation, configId }: MasterContactInfoPanelProps) {
  const [messageCount, setMessageCount] = useState(0);
  const [conversationAge, setConversationAge] = useState<string>('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(conversation.internal_notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [togglingBot, setTogglingBot] = useState(false);
  const [fetchingPic, setFetchingPic] = useState(false);
  const [profilePic, setProfilePic] = useState(conversation.profile_picture_url);

  const displayName = conversation.contact_name || conversation.phone_number;
  const initials = displayName.slice(0, 2).toUpperCase();

  // Buscar contagem de mensagens
  useEffect(() => {
    const fetchStats = async () => {
      const { count } = await supabase
        .from('master_whatsapp_chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('config_id', configId)
        .eq('remote_jid', conversation.remote_jid);

      setMessageCount(count || 0);
    };
    fetchStats();
  }, [configId, conversation.remote_jid]);

  // Calcular idade da conversa
  useEffect(() => {
    if (conversation.created_at) {
      setConversationAge(
        formatDistanceToNow(new Date(conversation.created_at), { addSuffix: true, locale: ptBR })
      );
    }
  }, [conversation.created_at]);

  // Atualizar notas quando conversa muda
  useEffect(() => {
    setNotes(conversation.internal_notes || '');
    setSavedNotes(conversation.internal_notes || null);
    setEditingNotes(false);
    setProfilePic(conversation.profile_picture_url);
  }, [conversation.id]);

  // Auto-fetch foto de perfil se não tiver
  useEffect(() => {
    if (!conversation.profile_picture_url && conversation.phone_number) {
      const autoFetch = async () => {
        setFetchingPic(true);
        try {
          const { data } = await supabase.functions.invoke('fetch-profile-picture', {
            body: { phone: conversation.phone_number },
          });
          if (data?.pictureUrl) {
            setProfilePic(data.pictureUrl);
            await supabase
              .from('master_whatsapp_conversations')
              .update({ profile_picture_url: data.pictureUrl })
              .eq('id', conversation.id);
          }
        } catch {
          // silencioso no auto-fetch
        } finally {
          setFetchingPic(false);
        }
      };
      autoFetch();
    }
  }, [conversation.id, conversation.phone_number, conversation.profile_picture_url]);

  // Buscar foto de perfil
  const handleFetchProfilePic = useCallback(async () => {
    setFetchingPic(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-profile-picture', {
        body: { phone: conversation.phone_number },
      });

      if (error) throw error;

      if (data?.pictureUrl) {
        setProfilePic(data.pictureUrl);
        // Salvar na conversa
        await supabase
          .from('master_whatsapp_conversations')
          .update({ profile_picture_url: data.pictureUrl })
          .eq('id', conversation.id);
        toast.success('Foto de perfil atualizada');
      } else {
        toast.info('Nenhuma foto de perfil encontrada');
      }
    } catch {
      toast.error('Erro ao buscar foto de perfil');
    } finally {
      setFetchingPic(false);
    }
  }, [conversation]);

  // Salvar notas internas
  const [savedNotes, setSavedNotes] = useState<string | null>(conversation.internal_notes || null);
  
  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const trimmed = notes.trim() || null;
      const { error } = await supabase
        .from('master_whatsapp_conversations')
        .update({ internal_notes: trimmed })
        .eq('id', conversation.id);

      if (error) throw error;
      setSavedNotes(trimmed);
      toast.success('Notas salvas');
      setEditingNotes(false);
    } catch {
      toast.error('Erro ao salvar notas');
    } finally {
      setSavingNotes(false);
    }
  };

  // Reativar bot
  const handleReactivateBot = async () => {
    setTogglingBot(true);
    try {
      await supabase
        .from('master_whatsapp_sessions')
        .update({ bot_paused: false, paused_at: null, paused_reason: null })
        .eq('config_id', configId)
        .eq('phone_number', conversation.phone_number);

      await supabase
        .from('master_whatsapp_conversations')
        .update({ is_bot_active: true })
        .eq('id', conversation.id);

      toast.success('Bot reativado para este contato');
    } catch {
      toast.error('Erro ao reativar bot');
    } finally {
      setTogglingBot(false);
    }
  };

  // Pausar bot
  const handlePauseBot = async () => {
    setTogglingBot(true);
    try {
      await supabase
        .from('master_whatsapp_sessions')
        .update({ bot_paused: true, paused_at: new Date().toISOString(), paused_reason: 'manual_dashboard' })
        .eq('config_id', configId)
        .eq('phone_number', conversation.phone_number);

      await supabase
        .from('master_whatsapp_conversations')
        .update({ is_bot_active: false })
        .eq('id', conversation.id);

      toast.success('Bot pausado para este contato');
    } catch {
      toast.error('Erro ao pausar bot');
    } finally {
      setTogglingBot(false);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Avatar e nome */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="relative group">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profilePic || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="secondary"
              size="icon"
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleFetchProfilePic}
              disabled={fetchingPic}
              title="Buscar foto de perfil"
            >
              {fetchingPic ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Pencil className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
          <div>
            <h3 className="font-semibold text-base">{displayName}</h3>
            <p className="text-xs text-muted-foreground">{formatPhone(conversation.phone_number)}</p>
          </div>

          {/* Status do bot */}
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${getBotTypeBadgeColor(conversation.active_bot_type)}`}>
                {getBotTypeLabel(conversation.active_bot_type)}
              </Badge>
              {conversation.is_bot_active ? (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Bot className="w-3 h-3" /> IA ativa
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-xs border-orange-400 text-orange-600">
                  <BotOff className="w-3 h-3" /> IA pausada
                </Badge>
              )}
            </div>

            {/* Status da conversa */}
            <Badge
              variant={conversation.status === 'closed' ? 'destructive' : 'default'}
              className="text-xs"
            >
              {conversation.status === 'closed' ? 'Finalizada' : conversation.status === 'active' ? 'Ativa' : conversation.status}
            </Badge>

            {conversation.needs_human && (
              <Badge variant="outline" className="text-xs border-red-400 text-red-600 gap-1">
                ⚠️ Solicitou atendente
                {conversation.needs_human_reason && (
                  <span className="font-normal">— {conversation.needs_human_reason}</span>
                )}
              </Badge>
            )}

            {/* Botão toggle bot */}
            {conversation.status !== 'closed' && (
              <Button
                variant={conversation.is_bot_active ? 'destructive' : 'default'}
                size="sm"
                className="gap-1 w-full text-xs"
                onClick={conversation.is_bot_active ? handlePauseBot : handleReactivateBot}
                disabled={togglingBot}
              >
                {togglingBot ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : conversation.is_bot_active ? (
                  <>
                    <BotOff className="w-3.5 h-3.5" />
                    Pausar IA
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Reativar IA
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <Separator />

        {/* Informações de contato */}
        <Section title="Contato">
          <InfoRow icon={Phone} label="Telefone" value={formatPhone(conversation.phone_number)} />
          {conversation.contact_name && (
            <InfoRow icon={MessageSquare} label="Nome" value={conversation.contact_name} />
          )}
        </Section>

        <Separator />

        {/* Estatísticas */}
        <Section title="Estatísticas">
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={MessageSquare} label="Mensagens" value={String(messageCount)} />
            <StatCard
              icon={Clock}
              label="Última msg"
              value={conversation.last_message_at
                ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true, locale: ptBR })
                : 'N/A'
              }
            />
          </div>
          {conversation.created_at && (
            <p className="text-xs text-muted-foreground mt-2">
              <Calendar className="w-3 h-3 inline mr-1" />
              Conversa iniciada {conversationAge}
            </p>
          )}
        </Section>

        {/* Tags */}
        {conversation.tags && conversation.tags.length > 0 && (
          <>
            <Separator />
            <Section title="Tags">
              <div className="flex flex-wrap gap-1.5">
                {conversation.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs gap-1">
                    <Tag className="w-3 h-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </Section>
          </>
        )}

        <Separator />

        {/* Notas internas */}
        <Section title="Notas internas">
          {editingNotes ? (
            <div className="space-y-2">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione notas sobre este contato..."
                className="text-xs min-h-[80px] resize-none"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="gap-1 text-xs flex-1"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                >
                  {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-xs"
                  onClick={() => { setEditingNotes(false); setNotes(conversation.internal_notes || ''); }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ) : (
             <div>
               {savedNotes ? (
                 <p className="text-xs text-muted-foreground whitespace-pre-wrap mb-2">{savedNotes}</p>
               ) : (
                 <p className="text-xs text-muted-foreground italic mb-2">Nenhuma nota adicionada</p>
               )}
               <Button
                 variant="outline"
                 size="sm"
                 className="gap-1 text-xs w-full"
                 onClick={() => setEditingNotes(true)}
               >
                 <StickyNote className="w-3.5 h-3.5" />
                 {savedNotes ? 'Editar notas' : 'Adicionar nota'}
               </Button>
             </div>
          )}
        </Section>

        {/* Info da origem da última mensagem */}
        {conversation.last_message_source && (
          <>
            <Separator />
            <Section title="Última mensagem">
              <p className="text-xs text-muted-foreground">
                Origem: {conversation.last_message_source === 'cellphone' ? '📱 Celular' : '💻 Sistema'}
              </p>
              {conversation.last_message_direction && (
                <p className="text-xs text-muted-foreground">
                  Direção: {conversation.last_message_direction === 'incoming' ? '📥 Recebida' : '📤 Enviada'}
                </p>
              )}
            </Section>
          </>
        )}
      </div>
    </ScrollArea>
  );
}

// --- Sub-componentes ---

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-center space-y-0.5">
      <Icon className="w-4 h-4 mx-auto text-muted-foreground" />
      <p className="text-sm font-semibold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
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
