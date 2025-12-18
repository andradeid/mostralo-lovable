import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Unplug, 
  ExternalLink,
  Info,
  Clock,
  Package
} from 'lucide-react';
import { useIFoodIntegration } from '@/hooks/useIFoodIntegration';
import { useStoreAccess } from '@/hooks/useStoreAccess';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    isConnected
  } = useIFoodIntegration(storeId);

  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  const handleSaveCredentials = async () => {
    const success = await saveCredentials(clientId, clientSecret);
    if (success) {
      setClientId('');
      setClientSecret('');
    }
  };

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
          <TabsTrigger value="events">Eventos ({events.length})</TabsTrigger>
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
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Log de Eventos</CardTitle>
                <CardDescription>
                  Últimos eventos recebidos do iFood
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={pollEvents} disabled={saving || !connected}>
                <RefreshCw className={`h-4 w-4 mr-2 ${saving ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum evento registrado ainda</p>
                  <p className="text-sm">Os eventos aparecerão aqui quando você receber pedidos</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Pedido</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="text-sm">
                            {format(new Date(event.created_at), "dd/MM HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{event.event_type}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {event.order_id?.slice(0, 8) || '-'}
                          </TableCell>
                          <TableCell>
                            {event.processed ? (
                              <Badge className="bg-green-500">Processado</Badge>
                            ) : event.error_message ? (
                              <Badge variant="destructive">Erro</Badge>
                            ) : (
                              <Badge variant="secondary">Pendente</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
