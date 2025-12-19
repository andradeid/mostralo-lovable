import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertTriangle, Copy, ChevronDown, Clock, Send, AlertCircle } from "lucide-react";
import { SyncErrorDetails } from "@/hooks/useMasterWhatsAppConfig";
import { toast } from "sonner";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SyncErrorModalProps {
  error: SyncErrorDetails | null;
  onClose: () => void;
}

export function SyncErrorModal({ error, onClose }: SyncErrorModalProps) {
  const [responseExpanded, setResponseExpanded] = useState(false);

  if (!error) return null;

  const handleCopyDetails = () => {
    const details = `
=== ERRO DE SINCRONIZAÇÃO ===
Data: ${format(new Date(error.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
Status: ${error.status || 'N/A'}

--- Payload Enviado ---
${JSON.stringify(error.payload, null, 2)}

--- Mensagem de Erro ---
${error.message}

--- Resposta Completa ---
${JSON.stringify(error.responseData, null, 2)}
    `.trim();

    navigator.clipboard.writeText(details);
    toast.success("Detalhes copiados!");
  };

  const getStatusBadgeVariant = (status: number | null) => {
    if (!status) return "secondary";
    if (status >= 500) return "destructive";
    if (status >= 400) return "warning";
    return "secondary";
  };

  return (
    <Dialog open={!!error} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Erro na Sincronização
          </DialogTitle>
          <DialogDescription>
            Detalhes técnicos do erro para debug
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Status e Timestamp */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant={getStatusBadgeVariant(error.status) as any}>
                  {error.status || 'N/A'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {format(new Date(error.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
              </div>
            </div>

            {/* Payload Enviado */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Send className="w-4 h-4 text-muted-foreground" />
                Payload Enviado
              </div>
              <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                {JSON.stringify(error.payload, null, 2)}
              </pre>
            </div>

            {/* Mensagem de Erro */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="w-4 h-4 text-destructive" />
                Mensagem de Erro
              </div>
              <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md text-sm">
                {error.message}
              </div>
            </div>

            {/* Resposta Completa (colapsável) */}
            <Collapsible open={responseExpanded} onOpenChange={setResponseExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-transparent">
                  <span className="text-sm font-medium">Resposta Completa</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${responseExpanded ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto max-h-48">
                  {JSON.stringify(error.responseData, null, 2)}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleCopyDetails}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar Detalhes
          </Button>
          <Button onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
