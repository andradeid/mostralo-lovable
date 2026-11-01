// Histórico de mensagens de teste.
// JSX movido da MasterWhatsAppPage sem mudança.
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  MessageSquare,
  History,
  Phone,
  Clock,
} from "lucide-react";
import type { MasterWhatsAppPageApi } from "./types";

export function TestHistoryCard({ wa, tests, cfg }: MasterWhatsAppPageApi) {
  const { testMessages, loadingMessages, fetchTestMessages } = tests;

  return (
    <>
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Histórico de Testes
            </CardTitle>
            <CardDescription>
              Últimas mensagens de teste enviadas
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchTestMessages}
            disabled={loadingMessages}
          >
            <RefreshCw className={`w-4 h-4 ${loadingMessages ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {testMessages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma mensagem de teste enviada ainda</p>
          </div>
        ) : (
          <div className="space-y-3">
            {testMessages.map((msg) => (
              <div 
                key={msg.id} 
                className={`p-4 rounded-lg border ${
                  msg.status === 'failed' 
                    ? 'bg-destructive/10 border-destructive/20' 
                    : 'bg-green-500/10 border-green-500/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    {msg.status === 'failed' ? (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" /> Falhou
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500 gap-1">
                        <CheckCircle className="h-3 w-3" /> Enviada
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(msg.sent_at), "dd/MM/yyyy 'às' HH:mm")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3" />
                    <span className="font-mono text-xs">{msg.country_code} {msg.phone_number}</span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {msg.status === 'failed' && msg.error_message 
                    ? <span className="text-destructive">❌ Erro: {msg.error_message}</span>
                    : <span>✅ {msg.message}</span>
                  }
                </p>
                
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {format(new Date(msg.sent_at), "dd/MM/yyyy, HH:mm:ss")}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
