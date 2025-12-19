import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Unplug, 
  ExternalLink,
  Info,
  Clock,
  Package,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle
} from 'lucide-react';
import { useIFoodIntegration, IFoodEvent } from '@/hooks/useIFoodIntegration';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

// Mapeamento de tipos de evento para labels amigáveis
const EVENT_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  'PLACED': { label: 'Novo Pedido', color: 'bg-blue-500' },
  'PLC': { label: 'Novo Pedido', color: 'bg-blue-500' },
  'CONFIRMED': { label: 'Confirmado', color: 'bg-green-500' },
  'CFM': { label: 'Confirmado', color: 'bg-green-500' },
  'PREPARATION_STARTED': { label: 'Em Preparo', color: 'bg-yellow-500' },
  'PRS': { label: 'Em Preparo', color: 'bg-yellow-500' },
  'READY_TO_PICKUP': { label: 'Pronto', color: 'bg-purple-500' },
  'RTP': { label: 'Pronto', color: 'bg-purple-500' },
  'DISPATCHED': { label: 'Despachado', color: 'bg-orange-500' },
  'DSP': { label: 'Despachado', color: 'bg-orange-500' },
  'CONCLUDED': { label: 'Concluído', color: 'bg-emerald-500' },
  'CON': { label: 'Concluído', color: 'bg-emerald-500' },
  'CANCELLED': { label: 'Cancelado', color: 'bg-red-500' },
  'CAN': { label: 'Cancelado', color: 'bg-red-500' },
  'STATUS_SYNC_OUT': { label: 'Sincronizado', color: 'bg-indigo-500' },
};

export default function IFoodIntegrationPage() {
  const { storeId } = useStoreAccess();
  const {
    integration,
    events,
    loading,
    saving,
    saveCredentials,
    getToken,
    testConnection,
    disconnect,
    pollEvents,
    isConnected,
    refetchEvents
  } = useIFoodIntegration(storeId);

  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [eventFilter, setEventFilter] = useState<string>('all');

  // Subscription em tempo real para eventos
  useEffect(() => {
    if (!storeId) return;

    const channel = supabase
      .channel(`ifood_events_${storeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ifood_events_log',
          filter: `store_id=eq.${storeId}`
        },
        (payload) => {
          console.log('📥 Novo evento iFood:', payload);
          refetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, refetchEvents]);

  const handleSaveCredentials = async () => {
    const success = await saveCredentials(clientId, clientSecret);
    if (success) {
      setClientId('');
      setClientSecret('');
    }
  };

  const toggleEventExpand = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const getEventTypeInfo = (event: IFoodEvent) => {
    const code = event.event_code || event.event_type;
    return EVENT_TYPE_LABELS[code] || { label: code, color: 'bg-gray-500' };
  };

  const isOutgoingSync = (event: IFoodEvent) => {
    return event.event_type === 'STATUS_SYNC_OUT' || 
           (event.payload && event.payload.direction === 'mostralo_to_ifood');
  };

  const filteredEvents = events.filter(event => {
    if (eventFilter === 'all') return true;
    if (eventFilter === 'incoming') return !isOutgoingSync(event);
    if (eventFilter === 'outgoing') return isOutgoingSync(event);
    if (eventFilter === 'errors') return !!event.error_message;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const connected = isConnected();

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-red-500">🍔</span> Integração iFood
          </h1>
          <p className="text-muted-foreground">
            Receba pedidos do iFood diretamente no Mostralo
          </p>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <Badge className="bg-green-500 hover:bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Conectado
            </Badge>
          ) : integration?.client_id ? (
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              Credenciais Salvas
            </Badge>
          ) : (
            <Badge variant="outline">
              <XCircle className="h-3 w-3 mr-1" />
              Não Configurado
            </Badge>
          )}
        </div>
      </div>

      {/* Alerta informativo */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Para usar esta integração, você precisa ter uma conta no{' '}
          <a 
            href="https://developer.ifood.com.br" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            iFood Developer Portal
          </a>
          . Após criar sua aplicação, copie o Client ID e Client Secret para cá.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            Eventos 
            {events.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {events.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Aba Configuração */}
        <TabsContent value="config" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Card de Credenciais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Credenciais OAuth</CardTitle>
                <CardDescription>
                  Insira as credenciais da sua aplicação iFood
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    placeholder="Seu Client ID do iFood"
                    value={clientId || integration?.client_id || ''}
                    onChange={(e) => setClientId(e.target.value)}
                    disabled={saving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <div className="flex gap-2">
                    <Input
                      id="clientSecret"
                      type={showSecret ? 'text' : 'password'}
                      placeholder="Seu Client Secret do iFood"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      disabled={saving}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSecret(!showSecret)}
                    >
                      {showSecret ? 'Ocultar' : 'Mostrar'}
                    </Button>
                  </div>
                  {integration?.client_secret && !clientSecret && (
                    <p className="text-xs text-muted-foreground">
                      ••••••••••• (salvo anteriormente)
                    </p>
                  )}
                </div>

                <Button 
                  onClick={handleSaveCredentials}
                  disabled={saving || (!clientId && !clientSecret)}
                  className="w-full"
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Salvar Credenciais
                </Button>
              </CardContent>
            </Card>

            {/* Card de Conexão */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status da Conexão</CardTitle>
                <CardDescription>
                  {connected 
                    ? 'Sua loja está recebendo pedidos do iFood' 
                    : 'Conecte-se ao iFood para começar a receber pedidos'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {integration?.token_expires_at && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Token expira em: </span>
                    <span className="font-medium">
                      {format(new Date(integration.token_expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                )}

                {integration?.last_sync_at && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Última sincronização: </span>
                    <span className="font-medium">
                      {format(new Date(integration.last_sync_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {!connected && integration?.client_id && (
                    <Button onClick={getToken} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Conectar ao iFood
                    </Button>
                  )}

                  {connected && (
                    <>
                      <Button onClick={testConnection} variant="outline" disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                        Testar Conexão
                      </Button>

                      <Button onClick={pollEvents} variant="outline" disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                        Buscar Novos Pedidos
                      </Button>

                      <Button onClick={disconnect} variant="destructive" disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Unplug className="h-4 w-4 mr-2" />}
                        Desconectar
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info sobre sincronização bidirecional */}
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
            <ArrowUpRight className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              <strong>Sincronização Bidirecional:</strong> Quando você muda o status de um pedido do iFood no Mostralo, 
              a mudança é automaticamente enviada para o iFood. Da mesma forma, atualizações do iFood são refletidas aqui.
            </AlertDescription>
          </Alert>

          {/* Guia de Configuração */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Como configurar</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>
                  Acesse o{' '}
                  <a 
                    href="https://developer.ifood.com.br" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary underline inline-flex items-center gap-1"
                  >
                    iFood Developer Portal <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Crie uma conta de desenvolvedor (é necessário ter CNPJ)</li>
                <li>Crie uma nova aplicação no portal</li>
                <li>Copie o <strong>Client ID</strong> e <strong>Client Secret</strong> gerados</li>
                <li>Cole as credenciais nos campos acima e clique em "Salvar"</li>
                <li>Clique em "Conectar ao iFood" para autenticar</li>
                <li>Após a homologação, você receberá pedidos automaticamente!</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Eventos */}
        <TabsContent value="events">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Log de Eventos</CardTitle>
                <CardDescription>
                  Histórico de comunicação com o iFood
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={eventFilter} onValueChange={setEventFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="incoming">
                      <span className="flex items-center gap-1">
                        <ArrowDownLeft className="h-3 w-3" /> Recebidos
                      </span>
                    </SelectItem>
                    <SelectItem value="outgoing">
                      <span className="flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3" /> Enviados
                      </span>
                    </SelectItem>
                    <SelectItem value="errors">
                      <span className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Erros
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={pollEvents} disabled={saving || !connected}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum evento registrado ainda</p>
                  <p className="text-sm">Os eventos aparecerão aqui quando você receber pedidos</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {filteredEvents.map((event) => {
                      const isExpanded = expandedEvents.has(event.id);
                      const typeInfo = getEventTypeInfo(event);
                      const isOutgoing = isOutgoingSync(event);

                      return (
                        <Collapsible key={event.id} open={isExpanded} onOpenChange={() => toggleEventExpand(event.id)}>
                          <div className={`border rounded-lg ${event.error_message ? 'border-destructive/50 bg-destructive/5' : 'border-border'}`}>
                            <CollapsibleTrigger className="w-full">
                              <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3">
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  
                                  {/* Direção do evento */}
                                  {isOutgoing ? (
                                    <ArrowUpRight className="h-4 w-4 text-blue-500" />
                                  ) : (
                                    <ArrowDownLeft className="h-4 w-4 text-green-500" />
                                  )}
                                  
                                  <Badge className={typeInfo.color}>
                                    {typeInfo.label}
                                  </Badge>
                                  
                                  {event.order_id && (
                                    <span className="font-mono text-sm text-muted-foreground">
                                      {event.order_id.slice(0, 8)}...
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  {event.error_message && (
                                    <Badge variant="destructive" className="gap-1">
                                      <AlertCircle className="h-3 w-3" />
                                      Erro
                                    </Badge>
                                  )}
                                  
                                  {event.processed ? (
                                    <Badge variant="outline" className="text-green-600 border-green-300">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      OK
                                    </Badge>
                                  ) : !event.error_message && (
                                    <Badge variant="secondary">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Pendente
                                    </Badge>
                                  )}
                                  
                                  <span className="text-sm text-muted-foreground">
                                    {format(new Date(event.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                                  </span>
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent>
                              <div className="px-3 pb-3 pt-0 space-y-3 border-t">
                                {/* Erro, se houver */}
                                {event.error_message && (
                                  <div className="mt-3 p-2 bg-destructive/10 rounded text-sm text-destructive">
                                    <strong>Erro:</strong> {event.error_message}
                                  </div>
                                )}
                                
                                {/* Detalhes do evento */}
                                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">ID do Evento:</span>
                                    <span className="ml-2 font-mono">{event.event_id}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Tipo:</span>
                                    <span className="ml-2">{event.event_type}</span>
                                  </div>
                                  {event.event_code && (
                                    <div>
                                      <span className="text-muted-foreground">Código:</span>
                                      <span className="ml-2 font-mono">{event.event_code}</span>
                                    </div>
                                  )}
                                  {event.processed_at && (
                                    <div>
                                      <span className="text-muted-foreground">Processado em:</span>
                                      <span className="ml-2">
                                        {format(new Date(event.processed_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Payload JSON */}
                                {event.payload && (
                                  <div className="mt-3">
                                    <p className="text-sm font-medium mb-1">Payload:</p>
                                    <pre className="p-2 bg-muted rounded text-xs overflow-x-auto max-h-[200px]">
                                      {JSON.stringify(event.payload, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
