import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Pause, 
  Square, 
  Users,
  Info,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from "lucide-react";
import { BotActiveSessionsCard } from "./BotActiveSessionsCard";
import { useBotSessions } from "@/hooks/useBotSessions";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface ConversationsTabProps {
  storeId: string | null;
  isConnected: boolean;
}

export function ConversationsTab({ storeId, isConnected }: ConversationsTabProps) {
  const { sessions } = useBotSessions(storeId);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  // Calcular contadores
  const openedCount = sessions.filter(s => s.status === 'opened').length;
  const pausedCount = sessions.filter(s => s.status === 'paused').length;
  const closedCount = sessions.filter(s => s.status === 'closed').length;
  const customersCount = sessions.filter(s => s.customerName).length;

  if (!isConnected) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">WhatsApp não conectado</p>
              <p className="text-sm text-muted-foreground">
                Conecte seu WhatsApp na aba "Conexão" para visualizar as conversas ativas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardContent className="pt-4 pb-3 px-3 sm:px-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 rounded-full bg-green-500/10">
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">{openedCount}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-4 pb-3 px-3 sm:px-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 rounded-full bg-yellow-500/10">
                <Pause className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pausedCount}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Pausadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted-foreground/30 bg-muted/30">
          <CardContent className="pt-4 pb-3 px-3 sm:px-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 rounded-full bg-muted">
                <Square className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{closedCount}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Fechadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="pt-4 pb-3 px-3 sm:px-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 rounded-full bg-blue-500/10">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">{customersCount}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card de Instruções Colapsável */}
      <Collapsible open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <Card className="border-primary/20 bg-primary/5">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-primary/10 transition-colors rounded-t-lg pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm sm:text-base">O que significam os status?</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {instructionsOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <Badge className="bg-green-500 shrink-0">Aberta</Badge>
                  <p className="text-xs text-muted-foreground">
                    Bot está respondendo automaticamente ao cliente
                  </p>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <Badge className="bg-yellow-500 text-yellow-950 shrink-0">Pausada</Badge>
                  <p className="text-xs text-muted-foreground">
                    Você assumiu a conversa manualmente
                  </p>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted border border-border">
                  <Badge variant="secondary" className="shrink-0">Fechada</Badge>
                  <p className="text-xs text-muted-foreground">
                    Conversa encerrada, bot responde novamente se cliente enviar mensagem
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Dica:</strong> Clique em "Pausar" quando quiser responder pessoalmente ao cliente. 
                  O bot não interferirá enquanto a conversa estiver pausada.
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Card de Avisos Importantes */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-sm">Avisos Importantes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 shrink-0">•</span>
              <span>Pausar uma conversa <strong className="text-foreground">NÃO</strong> desativa o bot para outros clientes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 shrink-0">•</span>
              <span>Ao pausar, só você pode responder àquele cliente específico</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 shrink-0">•</span>
              <span>O bot pode reativar automaticamente conforme configurado na aba "Assistente IA"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 shrink-0">•</span>
              <span>"Excluir" remove o histórico de sessão do bot (não apaga mensagens do WhatsApp)</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Sessões Ativas */}
      <BotActiveSessionsCard storeId={storeId} />
    </div>
  );
}
