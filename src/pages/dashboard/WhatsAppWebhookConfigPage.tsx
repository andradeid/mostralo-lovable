import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Info,
  RefreshCw,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface StoreWebhookConfig {
  storeId: string;
  storeName: string;
  instanceName: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'unknown';
  aiVisionEnabled: boolean;
  webhookUrl: string;
}

const SUPABASE_URL = "https://noshwvwpjtnvndokbfjx.supabase.co";

export default function WhatsAppWebhookConfigPage() {
  const [stores, setStores] = useState<StoreWebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedStore, setExpandedStore] = useState<string | null>(null);
  const [syncingStoreId, setSyncingStoreId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchStoresWithWebhookConfig();
  }, []);

  const fetchStoresWithWebhookConfig = async () => {
    try {
      // Buscar lojas com configuração de bot e módulos
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select(`
          id,
          name,
          store_bot_config!left (
            instance_name,
            is_active,
            bot_mode
          ),
          store_modules!left (
            module_id,
            modules:module_id (
              key
            )
          )
        `)
        .eq('status', 'active')
        .order('name');

      if (storesError) throw storesError;

      const configs: StoreWebhookConfig[] = (storesData || []).map((store: any) => {
        const botConfig = store.store_bot_config?.[0];
        const instanceName = botConfig?.instance_name || null;
        
        // Verificar se tem módulo AI Vision ativo
        const aiVisionModule = store.store_modules?.find(
          (m: any) => m.modules?.key === 'ai_vision'
        );

        return {
          storeId: store.id,
          storeName: store.name || 'Loja sem nome',
          instanceName,
          connectionStatus: botConfig?.is_active ? 'connected' : 'disconnected',
          aiVisionEnabled: !!aiVisionModule,
          webhookUrl: `${SUPABASE_URL}/functions/v1/whatsapp-media-webhook?instance=${instanceName || 'SEM_INSTANCIA'}`,
        };
      });

      setStores(configs);
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
      toast({
        title: "Erro ao carregar lojas",
        description: "Não foi possível carregar as configurações de webhook.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, storeId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(storeId);
      toast({
        title: "URL copiada!",
        description: "Cole na configuração de webhook da Evolution API.",
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar a URL.",
        variant: "destructive",
      });
    }
  };

  const syncBot = async (storeId: string, storeName: string) => {
    setSyncingStoreId(storeId);
    try {
      const { data, error } = await supabase.functions.invoke('openai-bot-sync', {
        body: { storeId, forceSync: true }
      });

      if (error) throw error;

      toast({
        title: "Bot sincronizado!",
        description: `O assistente da loja "${storeName}" foi atualizado com as novas tools de visão.`,
      });
    } catch (error: any) {
      console.error('Erro ao sincronizar bot:', error);
      toast({
        title: "Erro na sincronização",
        description: error.message || "Não foi possível sincronizar o bot.",
        variant: "destructive",
      });
    } finally {
      setSyncingStoreId(null);
    }
  };

  const getStatusBadge = (status: string, aiVisionEnabled: boolean) => {
    if (!aiVisionEnabled) {
      return <Badge variant="outline" className="bg-muted">Visão IA desabilitada</Badge>;
    }
    
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">Conectada</Badge>;
      case 'disconnected':
        return <Badge variant="destructive">Desconectada</Badge>;
      default:
        return <Badge variant="secondary">Desconhecido</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ImageIcon className="h-6 w-6 text-primary" />
          Webhooks de Imagens WhatsApp
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure os webhooks para receber e processar imagens enviadas pelos clientes via WhatsApp.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Configuração na Evolution API</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>Para cada instância, configure na Evolution API:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Acesse <strong>Settings → Webhook</strong></li>
            <li>Habilite <strong>WEBHOOK_BASE64 = true</strong></li>
            <li>Cole a URL do webhook abaixo no campo de URL</li>
            <li>Selecione o evento: <strong>messages.upsert</strong></li>
          </ol>
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        {stores.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma loja encontrada com configuração de WhatsApp.
            </CardContent>
          </Card>
        ) : (
          stores.map((store) => (
            <Card key={store.storeId} className={!store.aiVisionEnabled ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {store.connectionStatus === 'connected' ? (
                      <Wifi className="h-5 w-5 text-green-500" />
                    ) : (
                      <WifiOff className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{store.storeName}</CardTitle>
                      <CardDescription>
                        Instância: {store.instanceName || 'Não configurada'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(store.connectionStatus, store.aiVisionEnabled)}
                    {store.aiVisionEnabled && (
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/30">
                        <Eye className="h-3 w-3 mr-1" />
                        Visão IA
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {!store.instanceName ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Esta loja não possui instância WhatsApp configurada. Configure primeiro na página de Bot IA.
                    </AlertDescription>
                  </Alert>
                ) : !store.aiVisionEnabled ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      O módulo <strong>Visão por IA (Plus)</strong> não está habilitado para esta loja. 
                      Habilite em <strong>Gerenciar Acesso a Módulos</strong> para ativar o processamento de imagens.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>URL do Webhook</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={store.webhookUrl} 
                          readOnly 
                          className="font-mono text-xs"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(store.webhookUrl, store.storeId)}
                        >
                          {copiedId === store.storeId ? (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => syncBot(store.storeId, store.storeName)}
                        disabled={syncingStoreId === store.storeId}
                        className="flex-1"
                      >
                        {syncingStoreId === store.storeId ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Sincronizando...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Sincronizar Bot
                          </>
                        )}
                      </Button>
                    </div>

                    <Collapsible 
                      open={expandedStore === store.storeId}
                      onOpenChange={() => setExpandedStore(
                        expandedStore === store.storeId ? null : store.storeId
                      )}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full justify-between">
                          <span>Ver instruções detalhadas</span>
                          {expandedStore === store.storeId ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3">
                        <div className="rounded-lg border bg-muted/50 p-4 space-y-3 text-sm">
                          <div className="space-y-2">
                            <h4 className="font-medium">1. Acesse o painel da Evolution API</h4>
                            <p className="text-muted-foreground">
                              Vá em <strong>Manager → {store.instanceName} → Settings → Webhook</strong>
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-medium">2. Configure as opções</h4>
                            <ul className="list-disc list-inside text-muted-foreground space-y-1">
                              <li><strong>Webhook URL:</strong> Cole a URL acima</li>
                              <li><strong>Webhook By Events:</strong> Habilitado</li>
                              <li><strong>Webhook Base64:</strong> Habilitado (CRÍTICO!)</li>
                            </ul>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-medium">3. Selecione os eventos</h4>
                            <p className="text-muted-foreground">
                              Marque apenas: <code className="bg-background px-1 rounded">messages.upsert</code>
                            </p>
                          </div>

                          <div className="space-y-2">
                            <h4 className="font-medium">4. Salve as configurações</h4>
                            <p className="text-muted-foreground">
                              Clique em "Save" para aplicar as mudanças.
                            </p>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
