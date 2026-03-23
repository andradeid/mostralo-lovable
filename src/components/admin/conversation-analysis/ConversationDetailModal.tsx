import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useConversationMessages, getMessageSender } from "@/hooks/useConversationMessages";
import { AnalysisRecord } from "@/hooks/useConversationAnalysis";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ConversationDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: AnalysisRecord | null;
  storeId: string | undefined;
}

const SENDER_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  'cliente': { bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800', text: 'text-blue-800 dark:text-blue-300', label: 'Cliente' },
  'ia': { bg: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800', text: 'text-green-800 dark:text-green-300', label: 'IA' },
  'atendente': { bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800', text: 'text-orange-800 dark:text-orange-300', label: 'Atendente' }
};

function isImageUrl(url: string, messageType?: string): boolean {
  if (messageType === 'image') return true;
  return /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url);
}

function isAudioUrl(url: string, messageType?: string): boolean {
  if (messageType === 'audio' || messageType === 'ptt') return true;
  return /\.(ogg|mp3|wav|m4a|opus)(\?|$)/i.test(url);
}

function isVideoUrl(url: string, messageType?: string): boolean {
  if (messageType === 'video') return true;
  return /\.(mp4|webm)(\?|$)/i.test(url);
}

interface ConversationCycle {
  opened_at: string;
  closed_at: string | null;
  cycle_number: number;
}

// Hook para buscar ciclos da conversa
function useConversationCycles(storeId: string | undefined, remoteJid: string | undefined) {
  return useQuery({
    queryKey: ['conversation-cycles', storeId, remoteJid],
    queryFn: async () => {
      if (!storeId || !remoteJid) return [];
      const { data, error } = await supabase
        .from('whatsapp_conversation_cycles' as any)
        .select('opened_at, closed_at, cycle_number')
        .eq('store_id', storeId)
        .eq('remote_jid', remoteJid)
        .order('opened_at', { ascending: true });
      if (error) {
        console.error('Erro ao buscar ciclos:', error);
        return [];
      }
      return (data || []) as unknown as ConversationCycle[];
    },
    enabled: !!storeId && !!remoteJid
  });
}

// Componente separador de sessão
function SessionSeparator({ label, type }: { label: string; type: 'start' | 'end' }) {
  return (
    <div className="flex items-center justify-center my-3">
      <span className={`text-[10px] px-3 py-1 rounded-full border ${
        type === 'start'
          ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
          : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
      }`}>
        {label}
      </span>
    </div>
  );
}

export function ConversationDetailModal({ open, onOpenChange, analysis, storeId }: ConversationDetailModalProps) {
  const { data: messages, isLoading } = useConversationMessages(
    open ? storeId : undefined,
    open ? analysis?.remote_jid : undefined
  );

  const { data: cycles } = useConversationCycles(
    open ? storeId : undefined,
    open ? analysis?.remote_jid : undefined
  );

  if (!analysis) return null;

  // Preparar eventos de ciclo para inserir como separadores
  const cycleEvents: { timestamp: Date; label: string; type: 'start' | 'end' }[] = [];
  if (cycles && cycles.length > 0) {
    cycles.forEach((cycle, index) => {
      const num = cycle.cycle_number || (index + 1);
      if (cycle.opened_at) {
        const d = new Date(cycle.opened_at);
        cycleEvents.push({
          timestamp: d,
          label: `Sessão ${num} iniciada em ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
          type: 'start'
        });
      }
      if (cycle.closed_at) {
        const d = new Date(cycle.closed_at);
        cycleEvents.push({
          timestamp: d,
          label: `Sessão ${num} finalizada em ${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
          type: 'end'
        });
      }
    });
    cycleEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span>{analysis.contact_name || analysis.phone_number}</span>
            {analysis.houve_fechamento && (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Fechamento</Badge>
            )}
            {analysis.houve_intencao_compra && !analysis.houve_fechamento && (
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Intenção</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Resumo */}
        {analysis.resumo_comercial && (
          <div className="px-1 py-2 bg-muted/50 rounded-md text-xs">
            <span className="font-medium">Resumo:</span> {analysis.resumo_comercial}
          </div>
        )}

        {/* Mensagens */}
        <ScrollArea className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2 pr-3">
              {(() => {
                const items: React.ReactNode[] = [];
                let cycleIdx = 0;
                const msgs = messages || [];

                for (let i = 0; i < msgs.length; i++) {
                  const msg = msgs[i];
                  const msgTime = new Date(msg.timestamp);

                  // Inserir separadores de ciclo antes desta mensagem
                  while (cycleIdx < cycleEvents.length && cycleEvents[cycleIdx].timestamp <= msgTime) {
                    const evt = cycleEvents[cycleIdx];
                    items.push(
                      <SessionSeparator
                        key={`cycle-${cycleIdx}`}
                        label={evt.label}
                        type={evt.type}
                      />
                    );
                    cycleIdx++;
                  }

                  const sender = getMessageSender(msg);
                  const style = SENDER_STYLES[sender];
                  const time = msgTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  const date = msgTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

                  items.push(
                    <div
                      key={msg.id}
                      className={`p-2.5 rounded-lg border ${style.bg} ${sender === 'cliente' ? 'mr-8' : 'ml-8'}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-xs font-medium ${style.text}`}>{style.label}</span>
                        <span className="text-[10px] text-muted-foreground">{date} {time}</span>
                      </div>
                      {msg.content && (
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      )}
                      {!msg.content && !msg.media_url && (
                        <p className="text-sm text-muted-foreground italic">[{msg.message_type}]</p>
                      )}
                      {msg.media_url && (
                        <div className="mt-2">
                          {isImageUrl(msg.media_url, msg.message_type) ? (
                            <img
                              src={msg.media_url}
                              alt="Mídia da conversa"
                              className="max-w-full max-h-64 rounded-md object-contain cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(msg.media_url, '_blank')}
                              loading="lazy"
                            />
                          ) : isAudioUrl(msg.media_url, msg.message_type) ? (
                            <audio controls className="max-w-full h-8" preload="none">
                              <source src={msg.media_url} />
                            </audio>
                          ) : isVideoUrl(msg.media_url, msg.message_type) ? (
                            <video controls className="max-w-full max-h-48 rounded-md" preload="none">
                              <source src={msg.media_url} />
                            </video>
                          ) : (
                            <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                              📎 Ver arquivo
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                // Separadores restantes após última mensagem
                while (cycleIdx < cycleEvents.length) {
                  const evt = cycleEvents[cycleIdx];
                  items.push(
                    <SessionSeparator
                      key={`cycle-${cycleIdx}`}
                      label={evt.label}
                      type={evt.type}
                    />
                  );
                  cycleIdx++;
                }

                if (items.length === 0) {
                  return (
                    <div className="text-center text-muted-foreground py-8 text-sm">
                      Nenhuma mensagem encontrada
                    </div>
                  );
                }

                return items;
              })()}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
