import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageSquare, 
  Pause, 
  Square, 
  Users, 
  AlertCircle,
  Info,
  AlertTriangle,
  Lightbulb
} from "lucide-react";
import { useBotSessions } from "@/hooks/useBotSessions";
import { BotActiveSessionsCard } from "@/components/admin/bot";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const WhatsAppConversationsPage = () => {
  const { storeId } = useStoreAccess();
  const [isConnected, setIsConnected] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  const { sessions } = useBotSessions(storeId);

  // Check WhatsApp connection status
  useEffect(() => {
    const checkConnection = async () => {
      if (!storeId) return;
      
      try {
        const response = await supabase.functions.invoke('whatsapp-instance', {
          body: { action: 'status', storeId },
        });
        
        if (response.data?.success && response.data?.status === 'connected') {
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    };

    checkConnection();
  }, [storeId]);

  // Calculate session counts
  const openedCount = sessions.filter(s => s.status === 'opened').length;
  const pausedCount = sessions.filter(s => s.status === 'paused').length;
  const closedCount = sessions.filter(s => s.status === 'closed').length;
  const customersCount = sessions.filter(s => s.customerName).length;

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Conversas</h1>
          <p className="text-muted-foreground">
            Gerencie as conversas ativas do seu WhatsApp
          </p>
        </div>

        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="h-5 w-5" />
              WhatsApp Não Conectado
            </CardTitle>
            <CardDescription>
              Conecte seu WhatsApp para visualizar e gerenciar as conversas ativas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard/whatsapp'}>
              Ir para Conexão WhatsApp
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Conversas</h1>
        <p className="text-muted-foreground">
          Gerencie as conversas ativas do seu WhatsApp
        </p>
      </div>

      {/* PRIMEIRO: Card de Sessões Ativas */}
      <BotActiveSessionsCard storeId={storeId} />

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col items-center gap-1">
              <MessageSquare className="h-6 w-6 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{openedCount}</span>
              <span className="text-xs text-muted-foreground">Abertas</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col items-center gap-1">
              <Pause className="h-6 w-6 text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-600">{pausedCount}</span>
              <span className="text-xs text-muted-foreground">Pausadas</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50 border-muted">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col items-center gap-1">
              <Square className="h-6 w-6 text-muted-foreground" />
              <span className="text-2xl font-bold">{closedCount}</span>
              <span className="text-xs text-muted-foreground">Fechadas</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col items-center gap-1">
              <Users className="h-6 w-6 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">{customersCount}</span>
              <span className="text-xs text-muted-foreground">Clientes</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card de Instruções Colapsável */}
      <Collapsible open={instructionsOpen} onOpenChange={setInstructionsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-5 w-5 text-primary" />
                O que significam os status?
                <span className="ml-auto text-muted-foreground text-sm">
                  {instructionsOpen ? '▲' : '▼'}
                </span>
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 p-3 bg-green-500/10 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-700">Aberta</p>
                    <p className="text-muted-foreground">O bot está respondendo automaticamente nesta conversa</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-yellow-500/10 rounded-lg">
                  <Pause className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-700">Pausada</p>
                    <p className="text-muted-foreground">Você assumiu a conversa manualmente. O bot não interfere.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Square className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Fechada</p>
                    <p className="text-muted-foreground">Conversa encerrada. Se o cliente enviar nova mensagem, o bot responde novamente.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <Lightbulb className="h-4 w-4 text-primary mt-0.5" />
                  <p className="text-sm">
                    <strong>Dica:</strong> Clique em "Pausar" quando quiser responder pessoalmente ao cliente. 
                    O bot não interferirá até você reativar.
                  </p>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Card de Avisos Importantes */}
      <Card className="border-orange-500/30 bg-orange-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-orange-700">
            <AlertTriangle className="h-5 w-5" />
            Avisos Importantes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-orange-500">•</span>
              Pausar uma conversa <strong>NÃO</strong> desativa o bot para outros clientes
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500">•</span>
              Ao pausar, só você pode responder àquele cliente específico
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500">•</span>
              O bot reativa automaticamente conforme o tempo configurado no Assistente IA
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500">•</span>
              Excluir remove o histórico de sessão do bot (mas não as mensagens do WhatsApp)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppConversationsPage;
