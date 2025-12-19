import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMasterWhatsAppConfig } from "@/hooks/useMasterWhatsAppConfig";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Loader2, 
  MessageSquare, 
  Users, 
  HelpCircle,
  Pause,
  Play,
  Phone,
  Clock,
  Hash
} from "lucide-react";

export function MasterSessionsTab() {
  const { sessions, loading, toggleSessionPause } = useMasterWhatsAppConfig();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const getBotIcon = (botType: string | null) => {
    switch (botType) {
      case 'sales':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'recruitment':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'support':
        return <HelpCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getBotLabel = (botType: string | null) => {
    switch (botType) {
      case 'sales':
        return 'Vendas';
      case 'recruitment':
        return 'Recrutamento';
      case 'support':
        return 'Suporte';
      default:
        return 'Desconhecido';
    }
  };

  const getBotColor = (botType: string | null) => {
    switch (botType) {
      case 'sales':
        return 'bg-green-500/10 text-green-500';
      case 'recruitment':
        return 'bg-blue-500/10 text-blue-500';
      case 'support':
        return 'bg-purple-500/10 text-purple-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const activeSessions = sessions.filter(s => !s.bot_paused);
  const pausedSessions = sessions.filter(s => s.bot_paused);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Sessões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-green-500" />
              Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => s.active_bot_type === 'sales').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Recrutamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => s.active_bot_type === 'recruitment').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-500" />
              Suporte
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter(s => s.active_bot_type === 'support').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Sessões Ativas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-green-500" />
            Sessões Ativas ({activeSessions.length})
          </CardTitle>
          <CardDescription>
            Conversas em andamento com os bots
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma sessão ativa no momento
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${getBotColor(session.active_bot_type)}`}>
                        {getBotIcon(session.active_bot_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {session.contact_name || 'Contato'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getBotLabel(session.active_bot_type)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {session.phone_number}
                          </span>
                          <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {session.messages_count} msgs
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(session.last_message_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSessionPause(session.id, true, 'Pausado manualmente')}
                    >
                      <Pause className="w-4 h-4 mr-1" />
                      Pausar
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Lista de Sessões Pausadas */}
      {pausedSessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pause className="w-5 h-5 text-yellow-500" />
              Sessões Pausadas ({pausedSessions.length})
            </CardTitle>
            <CardDescription>
              Conversas que foram pausadas manualmente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {pausedSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-yellow-500/10">
                        <Pause className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {session.contact_name || 'Contato'}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {getBotLabel(session.active_bot_type)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{session.phone_number}</span>
                          {session.paused_reason && (
                            <span className="text-yellow-600">• {session.paused_reason}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSessionPause(session.id, false)}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Retomar
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
