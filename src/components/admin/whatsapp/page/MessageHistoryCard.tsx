// Histórico de mensagens avulsas.
// JSX movido da WhatsAppInstancePage sem mudança.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  MessageSquare,
  Phone,
  History,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { WhatsAppInstancePageCtx } from "@/hooks/whatsappInstance/useWhatsAppInstancePage";

export function MessageHistoryCard({ ctx }: { ctx: WhatsAppInstancePageCtx & { isConnected?: boolean } }) {
  const { getFriendlyLogErrorMessage, instance, messageLogs, logsLoading, showAllLogs, setShowAllLogs, fetchMessageLogs } = ctx;

  return (
    <>
      {instance?.status === 'connected' && (
        <Card>
          <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4 flex flex-row items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <History className="h-4 w-4 sm:h-5 sm:w-5" />
                Histórico
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm truncate">
                Últimas mensagens enviadas
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchMessageLogs} disabled={logsLoading} className="shrink-0">
              <RefreshCw className={`h-4 w-4 ${logsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {logsLoading && messageLogs.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : messageLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma mensagem de teste enviada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messageLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className={`p-4 rounded-lg border ${
                      log.status === 'failed' 
                        ? 'bg-destructive/10 border-destructive/20' 
                        : 'bg-green-500/10 border-green-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {log.status === 'failed' ? (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" /> Falhou
                          </Badge>
                        ) : (
                          <Badge className="bg-green-500 gap-1">
                            <CheckCircle className="h-3 w-3" /> Enviada
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(log.sent_at || log.failed_at || log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3" />
                        <span className="font-mono text-xs">{log.phone_number}</span>
                      </div>
                    </div>
                    
                    {(log.customer?.name || log.template?.name) && (
                      <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                        {log.customer?.name && <span>👤 {log.customer.name}</span>}
                        {log.template?.name && <span>• 📄 {log.template.name}</span>}
                      </div>
                    )}
                    
                    <p className="text-sm line-clamp-2 text-muted-foreground">
                      {log.status === 'failed' && log.error_message 
                        ? <span className="text-destructive">Erro: {getFriendlyLogErrorMessage(log)}</span>
                        : log.content}
                    </p>
                  </div>
                ))}
                
                {!showAllLogs && messageLogs.length >= 10 && (
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => setShowAllLogs(true)}
                  >
                    Ver mais mensagens
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
