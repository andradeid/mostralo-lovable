import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FlaskConical, Smartphone, Store, Bot, FileText, 
  QrCode, Wifi, WifiOff, Plus, Trash2, RefreshCw,
  Play, Pause, Save, Loader2, Check, X, Settings2, BookOpen
} from 'lucide-react';
import { HowItWorksCard, TestPromptPreviewCard, OpenAIConfigCard, OperationProgressCard, type OperationStep } from '@/components/admin/test-environment';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TestConfig {
  id: string;
  test_instance_name: string | null;
  test_instance_status: string;
  test_instance_qr_code: string | null;
  test_phone_number: string | null;
  sandbox_store_name: string;
  sandbox_store_description: string;
  sandbox_products: SandboxProduct[];
  sandbox_categories: SandboxCategory[];
  sandbox_whatsapp: string;
  sandbox_address: string;
  bot_enabled: boolean;
  bot_name: string;
  bot_delay_message: number;
  bot_stop_from_me: boolean;
  bot_expire_minutes: number;
  bot_keyword_finish: string;
  bot_trigger_type: string;
  bot_trigger_value: string;
  bot_evolution_id: string | null;
}

interface SandboxProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
}

interface SandboxCategory {
  id: string;
  name: string;
  description?: string;
}

export default function TestEnvironmentPage() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<TestConfig | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [operationSteps, setOperationSteps] = useState<OperationStep[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  
  // Form states
  const [storeName, setStoreName] = useState('Pizzaria Teste');
  const [storeDescription, setStoreDescription] = useState('Loja fictícia para testes');
  const [products, setProducts] = useState<SandboxProduct[]>([]);
  const [categories, setCategories] = useState<SandboxCategory[]>([]);
  
  // Bot config states
  const [botName, setBotName] = useState('Luna Teste');
  const [delayMessage, setDelayMessage] = useState(1500);
  const [stopBotFromMe, setStopBotFromMe] = useState(true);
  const [expireMinutes, setExpireMinutes] = useState(20);
  const [keywordFinish, setKeywordFinish] = useState('#SAIR');
  const [triggerType, setTriggerType] = useState('all');
  const [triggerValue, setTriggerValue] = useState('');

  const fetchConfig = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('master-test-instance', {
        body: { action: 'get_config' }
      });

      if (error) throw error;
      
      if (data?.config) {
        setConfig(data.config);
        setStoreName(data.config.sandbox_store_name || 'Pizzaria Teste');
        setStoreDescription(data.config.sandbox_store_description || 'Loja fictícia para testes');
        setProducts(data.config.sandbox_products || []);
        setCategories(data.config.sandbox_categories || []);
        setBotName(data.config.bot_name || 'Luna Teste');
        setDelayMessage(data.config.bot_delay_message || 1500);
        setStopBotFromMe(data.config.bot_stop_from_me ?? true);
        setExpireMinutes(data.config.bot_expire_minutes || 20);
        setKeywordFinish(data.config.bot_keyword_finish || '#SAIR');
        setTriggerType(data.config.bot_trigger_type || 'all');
        setTriggerValue(data.config.bot_trigger_value || '');
      }
    } catch (error) {
      console.error('Erro ao buscar config:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleInstanceAction = async (action: string) => {
    setActionLoading(action);
    try {
      const { data, error } = await supabase.functions.invoke('master-test-instance', {
        body: { action }
      });

      if (error) throw error;
      
      if (data?.success) {
        toast.success(data.message || 'Sucesso!');
        if (data.qrCode) {
          setConfig(prev => prev ? { ...prev, test_instance_qr_code: data.qrCode } : null);
        }
        await fetchConfig();
      } else {
        toast.error(data?.error || 'Erro na operação');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao executar ação');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveSandbox = async () => {
    setActionLoading('save_sandbox');
    try {
      const { data, error } = await supabase.functions.invoke('master-test-bot-sync', {
        body: { 
          action: 'save_sandbox',
          config: {
            storeName,
            storeDescription,
            products,
            categories,
            whatsapp: config?.sandbox_whatsapp || '5561999999999',
            address: config?.sandbox_address || 'Rua das Pizzas, 123',
          }
        }
      });

      if (error) throw error;
      toast.success('Loja sandbox salva!');
      await fetchConfig();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao salvar');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSyncBot = async () => {
    if (!config?.test_instance_name) {
      toast.error('Crie uma instância primeiro');
      return;
    }

    setActionLoading('sync_bot');
    setShowProgress(true);
    setOperationSteps([{ step: 'init', status: 'running', message: 'Iniciando sincronização...' }]);
    
    try {
      const { data, error } = await supabase.functions.invoke('master-test-bot-sync', {
        body: { 
          action: 'create',
          config: {
            storeName,
            storeDescription,
            botName,
            delayMessage,
            stopBotFromMe,
            expireMinutes,
            keywordFinish,
            triggerType,
            triggerValue,
          }
        }
      });

      if (error) throw error;
      
      // Atualizar steps com o resultado
      if (data?.steps) {
        setOperationSteps(data.steps);
      }
      
      if (data?.success) {
        toast.success('Bot de teste sincronizado!');
        await fetchConfig();
      } else {
        toast.error(data?.error || 'Erro ao sincronizar');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao sincronizar bot');
      setOperationSteps(prev => [...prev, { step: 'error', status: 'error', message: 'Erro inesperado', details: String(error) }]);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleBot = async () => {
    setActionLoading('toggle_bot');
    try {
      const { data, error } = await supabase.functions.invoke('master-test-bot-sync', {
        body: { 
          action: 'toggle',
          config: { enabled: !config?.bot_enabled }
        }
      });

      if (error) throw error;
      
      if (data?.success) {
        toast.success(data.message);
        await fetchConfig();
      } else {
        toast.error(data?.error || 'Erro');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao alternar bot');
    } finally {
      setActionLoading(null);
    }
  };

  const addProduct = () => {
    const newProduct: SandboxProduct = {
      id: Date.now().toString(),
      name: 'Novo Produto',
      price: 0,
      category: categories[0]?.name || 'Geral',
      description: '',
    };
    setProducts([...products, newProduct]);
  };

  const updateProduct = (id: string, field: keyof SandboxProduct, value: string | number) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const addCategory = () => {
    const newCategory: SandboxCategory = {
      id: Date.now().toString(),
      name: 'Nova Categoria',
      description: '',
    };
    setCategories([...categories, newCategory]);
  };

  const updateCategory = (id: string, field: keyof SandboxCategory, value: string) => {
    setCategories(categories.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isConnected = config?.test_instance_status === 'connected';
  const hasInstance = !!config?.test_instance_name;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <FlaskConical className="h-6 sm:h-8 w-6 sm:w-8 text-primary" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Ambiente de Testes</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Teste o Bot IA antes de liberar para lojistas
          </p>
        </div>
      </div>

      <Tabs defaultValue="docs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 h-auto gap-1">
          <TabsTrigger value="docs" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:px-3">
            <BookOpen className="h-4 w-4 shrink-0" />
            <span className="truncate">Docs</span>
          </TabsTrigger>
          <TabsTrigger value="instance" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:px-3">
            <Smartphone className="h-4 w-4 shrink-0" />
            <span className="truncate">Instância</span>
          </TabsTrigger>
          <TabsTrigger value="sandbox" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:px-3">
            <Store className="h-4 w-4 shrink-0" />
            <span className="truncate">Sandbox</span>
          </TabsTrigger>
          <TabsTrigger value="bot" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:px-3">
            <Bot className="h-4 w-4 shrink-0" />
            <span className="truncate">Bot IA</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-2 sm:px-3 col-span-2 sm:col-span-1">
            <FileText className="h-4 w-4 shrink-0" />
            <span className="truncate">Logs</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Documentação */}
        <TabsContent value="docs">
          <div className="grid gap-4 lg:grid-cols-2">
            <OpenAIConfigCard />
            <HowItWorksCard />
          </div>
          <div className="mt-4">
            <TestPromptPreviewCard
              storeName={storeName}
              storeDescription={storeDescription}
              products={products}
              categories={categories}
              whatsapp={config?.sandbox_whatsapp}
              address={config?.sandbox_address}
              onRefresh={fetchConfig}
              loading={loading}
            />
          </div>
        </TabsContent>

        {/* Tab: Instância de Teste */}
        <TabsContent value="instance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Instância de Teste
              </CardTitle>
              <CardDescription>
                Conecte seu WhatsApp pessoal para testar o bot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {isConnected ? (
                    <Wifi className="h-6 w-6 text-green-500" />
                  ) : (
                    <WifiOff className="h-6 w-6 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">
                      Status: {isConnected ? 'Conectado' : hasInstance ? 'Desconectado' : 'Não criado'}
                    </p>
                    {config?.test_phone_number && (
                      <p className="text-sm text-muted-foreground">
                        Número: {config.test_phone_number}
                      </p>
                    )}
                    {config?.test_instance_name && (
                      <p className="text-xs text-muted-foreground">
                        Instância: {config.test_instance_name}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={isConnected ? 'default' : 'secondary'}>
                  {isConnected ? '🟢 Online' : '⚪ Offline'}
                </Badge>
              </div>

              {/* QR Code */}
              {config?.test_instance_qr_code && !isConnected && (
                <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
                  <p className="text-sm font-medium">Escaneie o QR Code com seu WhatsApp:</p>
                  <img 
                    src={config.test_instance_qr_code} 
                    alt="QR Code" 
                    className="w-64 h-64 border rounded-lg"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Abra o WhatsApp {">"} Menu {">"} Dispositivos conectados {">"} Conectar dispositivo
                  </p>
                </div>
              )}

              {/* Ações */}
              <div className="flex flex-wrap gap-2">
                {!hasInstance && (
                  <Button 
                    onClick={() => handleInstanceAction('create')}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === 'create' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Criar Instância
                  </Button>
                )}
                
                {hasInstance && !isConnected && (
                  <Button 
                    onClick={() => handleInstanceAction('connect')}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === 'connect' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <QrCode className="h-4 w-4 mr-2" />
                    )}
                    Gerar QR Code
                  </Button>
                )}

                {hasInstance && (
                  <>
                    <Button 
                      variant="outline"
                      onClick={() => handleInstanceAction('status')}
                      disabled={!!actionLoading}
                    >
                      {actionLoading === 'status' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Verificar Status
                    </Button>
                    
                    {isConnected && (
                      <Button 
                        variant="outline"
                        onClick={() => handleInstanceAction('disconnect')}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === 'disconnect' ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <WifiOff className="h-4 w-4 mr-2" />
                        )}
                        Desconectar
                      </Button>
                    )}
                    
                    <Button 
                      variant="destructive"
                      onClick={() => handleInstanceAction('delete')}
                      disabled={!!actionLoading}
                    >
                      {actionLoading === 'delete' ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Deletar
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Loja Sandbox */}
        <TabsContent value="sandbox">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Informações da Loja */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Dados da Loja
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Loja</Label>
                  <Input 
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Ex: Pizzaria do João"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea 
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                    placeholder="Descreva a loja..."
                    rows={3}
                  />
                </div>
                <Button 
                  onClick={handleSaveSandbox}
                  disabled={!!actionLoading}
                  className="w-full"
                >
                  {actionLoading === 'save_sandbox' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Loja
                </Button>
              </CardContent>
            </Card>

            {/* Categorias */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Categorias ({categories.length})</CardTitle>
                  <Button size="sm" variant="outline" onClick={addCategory}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <div key={cat.id} className="flex items-center gap-2">
                        <Input 
                          value={cat.name}
                          onChange={(e) => updateCategory(cat.id, 'name', e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => removeCategory(cat.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Produtos */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Produtos ({products.length})</CardTitle>
                  <Button size="sm" variant="outline" onClick={addProduct}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {products.map((product) => (
                      <div key={product.id} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                          <Input 
                            value={product.name}
                            onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                            placeholder="Nome"
                          />
                          <Input 
                            type="number"
                            value={product.price}
                            onChange={(e) => updateProduct(product.id, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="Preço"
                          />
                          <Select 
                            value={product.category}
                            onValueChange={(v) => updateProduct(product.id, 'category', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Categoria" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.name}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input 
                            value={product.description || ''}
                            onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                            placeholder="Descrição"
                          />
                        </div>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => removeProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Bot IA */}
        <TabsContent value="bot">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Ativação */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Ativação do Bot
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Bot de Teste</p>
                    <p className="text-sm text-muted-foreground">
                      {config?.bot_enabled ? 'Ativo e respondendo' : 'Desativado'}
                    </p>
                  </div>
                  <Switch 
                    checked={config?.bot_enabled || false}
                    onCheckedChange={handleToggleBot}
                    disabled={!config?.bot_evolution_id || !!actionLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nome do Assistente</Label>
                  <Input 
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    placeholder="Ex: Luna, Max, etc."
                  />
                </div>

                <Button 
                  onClick={handleSyncBot}
                  disabled={!hasInstance || !!actionLoading}
                  className="w-full"
                >
                  {actionLoading === 'sync_bot' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : config?.bot_evolution_id ? (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {config?.bot_evolution_id ? 'Atualizar Bot' : 'Criar Bot'}
                </Button>

                {/* Progresso da Operação */}
                {showProgress && operationSteps.length > 0 && (
                  <OperationProgressCard 
                    title="Sincronização do Bot"
                    steps={operationSteps}
                    isRunning={actionLoading === 'sync_bot'}
                  />
                )}

                {!hasInstance && (
                  <p className="text-sm text-amber-600 text-center">
                    ⚠️ Crie uma instância de teste primeiro
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Comportamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Comportamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Pausar quando EU responder</p>
                    <p className="text-xs text-muted-foreground">
                      Bot para quando você digitar
                    </p>
                  </div>
                  <Switch 
                    checked={stopBotFromMe}
                    onCheckedChange={setStopBotFromMe}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Velocidade de Resposta</Label>
                    <span className="text-sm text-muted-foreground">
                      {(delayMessage / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <Slider
                    value={[delayMessage]}
                    onValueChange={([v]) => setDelayMessage(v)}
                    min={500}
                    max={5000}
                    step={100}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expirar após (min)</Label>
                    <Input 
                      type="number"
                      value={expireMinutes}
                      onChange={(e) => setExpireMinutes(parseInt(e.target.value) || 20)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Palavra encerrar</Label>
                    <Input 
                      value={keywordFinish}
                      onChange={(e) => setKeywordFinish(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Gatilho</Label>
                  <Select value={triggerType} onValueChange={setTriggerType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as mensagens</SelectItem>
                      <SelectItem value="keyword">Palavra-chave</SelectItem>
                      <SelectItem value="none">Desativado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {triggerType === 'keyword' && (
                  <div className="space-y-2">
                    <Label>Palavra-chave</Label>
                    <Input 
                      value={triggerValue}
                      onChange={(e) => setTriggerValue(e.target.value)}
                      placeholder="Ex: menu, cardapio, oi"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Logs */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Log de Testes
              </CardTitle>
              <CardDescription>
                Histórico de conversas com o bot de teste
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-50" />
                <p>Os logs de teste aparecerão aqui após você conversar com o bot.</p>
                <p className="text-sm mt-2">
                  Envie uma mensagem para o número conectado para testar.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
