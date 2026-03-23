import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useConversationMessages, getMessageSender } from "@/hooks/useConversationMessages";
import { AnalysisRecord } from "@/hooks/useConversationAnalysis";

interface ConversationDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: AnalysisRecord | null;
  storeId: string | undefined;
}

const SENDER_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  'cliente': { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', label: 'Cliente' },
  'ia': { bg: 'bg-green-50 border-green-200', text: 'text-green-800', label: 'IA' },
  'atendente': { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800', label: 'Atendente' }
};

export function ConversationDetailModal({ open, onOpenChange, analysis, storeId }: ConversationDetailModalProps) {
  const { data: messages, isLoading } = useConversationMessages(
    open ? storeId : undefined,
    open ? analysis?.remote_jid : undefined
  );

  if (!analysis) return null;

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
        <ScrollArea className="flex-1 max-h-[55vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2 pr-3">
              {(messages || []).map((msg) => {
                const sender = getMessageSender(msg);
                const style = SENDER_STYLES[sender];
                const time = new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const date = new Date(msg.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

                return (
                  <div
                    key={msg.id}
                    className={`p-2.5 rounded-lg border ${style.bg} ${sender === 'cliente' ? 'mr-8' : 'ml-8'}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-xs font-medium ${style.text}`}>{style.label}</span>
                      <span className="text-[10px] text-muted-foreground">{date} {time}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.content || `[${msg.message_type}]`}
                    </p>
                    {msg.media_url && (
                      <div className="mt-1">
                        <a href={msg.media_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                          Ver mídia
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
              {(!messages || messages.length === 0) && (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  Nenhuma mensagem encontrada
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
