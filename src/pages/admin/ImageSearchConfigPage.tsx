import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, Save, Key, CheckCircle, Eye, EyeOff, 
  ExternalLink, Copy, Info, Search, Image,
  BookOpen, Shield, AlertTriangle, FlaskConical, XCircle
} from "lucide-react";

interface ImageSearchConfig {
  id: string;
  provider: string;
  api_key: string;
  search_engine_id: string;
  serpapi_key: string;
  is_active: boolean;
  daily_limit: number;
  searches_today: number;
  last_reset_date: string;
}

export default function ImageSearchConfigPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSerpApiKey, setShowSerpApiKey] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);
  
  // Test section state
  const [testProductName, setTestProductName] = useState('');
  const [testLaboratory, setTestLaboratory] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    imageUrl?: string;
    error?: string;
  } | null>(null);
  
  const [config, setConfig] = useState<ImageSearchConfig>({
    id: '',
    provider: 'serpapi',
    api_key: '',
    search_engine_id: '',
    serpapi_key: '',
    is_active: true,
    daily_limit: 100,
    searches_today: 0,
    last_reset_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('image_search_config' as any)
        .select('*')
        .limit(1)
        .single();

      if (data && !error) {
        const configData = data as any;
        setConfig({
          id: configData.id,
          provider: configData.provider || 'serpapi',
          api_key: configData.api_key || '',
          search_engine_id: configData.search_engine_id || '',
          serpapi_key: configData.serpapi_key || '',
          is_active: configData.is_active ?? true,
          daily_limit: configData.daily_limit || 100,
          searches_today: configData.searches_today || 0,
          last_reset_date: configData.last_reset_date || new Date().toISOString().split('T')[0],
        });
        setHasConfig(true);
      }
    } catch (error) {
      console.log('Nenhuma configuração encontrada, será criada ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const isConfigValid = () => {
    if (config.provider === 'serpapi') {
      return !!config.serpapi_key;
    }
    return !!config.api_key && !!config.search_engine_id;
  };

  const handleSave = async () => {
    if (!isConfigValid()) {
      toast({
        title: "Erro",
        description: config.provider === 'serpapi' 
          ? "Preencha a SerpAPI Key" 
          : "Preencha a API Key e o Search Engine ID",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const saveData = {
        provider: config.provider,
        api_key: config.api_key.trim(),
        search_engine_id: config.search_engine_id.trim(),
        serpapi_key: config.serpapi_key.trim(),
        is_active: config.is_active,
        daily_limit: config.daily_limit,
        updated_at: new Date().toISOString(),
      };

      if (config.id) {
        const { error } = await supabase
          .from('image_search_config' as any)
          .update(saveData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('image_search_config' as any)
          .insert(saveData)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setConfig(prev => ({ ...prev, id: (data as any).id }));
          setHasConfig(true);
        }
      }

      toast({
        title: "Sucesso",
        description: "Configurações de busca de imagens salvas com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar configuração",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: `${label} copiado para a área de transferência` });
  };

  const handleTestSearch = async () => {
    if (!testProductName.trim()) {
      toast({
        title: "Erro",
        description: "Digite o nome do produto para testar",
        variant: "destructive",
      });
      return;
    }

    if (!isConfigValid()) {
      toast({
        title: "Erro",
        description: "Configure as credenciais primeiro",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('search-product-image', {
        body: {
          productName: testProductName.trim(),
          laboratory: testLaboratory.trim() || undefined,
          storeId: 'test-config',
        },
      });

      if (error) {
        setTestResult({
          success: false,
          error: error.message || 'Erro ao chamar a função',
        });
        return;
      }

      if (data?.success) {
        setTestResult({
          success: true,
          imageUrl: data.imageUrl,
        });
        // Refresh config to update counter
        fetchConfig();
      } else {
        setTestResult({
          success: false,
          error: data?.error || 'Nenhuma imagem encontrada',
        });
      }
    } catch (err: any) {
      console.error('Erro no teste:', err);
      setTestResult({
        success: false,
        error: err.message || 'Erro desconhecido',
      });
    } finally {
      setTesting(false);
    }
  };

  const usagePercentage = config.daily_limit > 0 
    ? Math.min(100, (config.searches_today / config.daily_limit) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Search className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0" />
          Busca de Imagens de Produtos
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Configure a API para buscar imagens automaticamente na importação de produtos
        </p>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        {hasConfig && isConfigValid() ? (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Configurado ({config.provider === 'serpapi' ? 'SerpAPI' : 'Google'})
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Não Configurado
          </Badge>
        )}
        {config.is_active && hasConfig && (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
            <Image className="h-3 w-3 mr-1" />
            Busca Ativa
          </Badge>
        )}
      </div>

      {/* Funcionalidade */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">O que essa funcionalidade faz?</CardTitle>
          <CardDescription>
            Busca automática de imagens durante a importação de produtos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Search className="h-8 w-8 text-primary" />
              <div>
                <h4 className="font-medium text-sm">Busca Automática</h4>
                <p className="text-xs text-muted-foreground">Pesquisa imagens via API</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Image className="h-8 w-8 text-primary" />
              <div>
                <h4 className="font-medium text-sm">Armazenamento Local</h4>
                <p className="text-xs text-muted-foreground">Salva no nosso Storage</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h4 className="font-medium text-sm">URL Permanente</h4>
                <p className="text-xs text-muted-foreground">Nunca perde a imagem</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uso Diário */}
      {hasConfig && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Info className="h-5 w-5" />
              Uso Diário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Buscas realizadas hoje:</span>
              <span className="font-medium">{config.searches_today} de {config.daily_limit}</span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {config.provider === 'serpapi' 
                ? 'O contador reseta automaticamente à meia-noite. SerpAPI: 100 buscas/mês grátis.'
                : 'O contador reseta automaticamente à meia-noite. Google: 100 buscas/dia grátis.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Área de Teste Manual */}
      {hasConfig && isConfigValid() && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              Testar Configuração
            </CardTitle>
            <CardDescription>
              Teste a busca de imagens com um nome de produto para verificar se a API está funcionando
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="test_product">Nome do Produto *</Label>
                <Input
                  id="test_product"
                  value={testProductName}
                  onChange={(e) => setTestProductName(e.target.value)}
                  placeholder="Ex: Dipirona 500mg"
                  disabled={testing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test_lab">Laboratório (opcional)</Label>
                <Input
                  id="test_lab"
                  value={testLaboratory}
                  onChange={(e) => setTestLaboratory(e.target.value)}
                  placeholder="Ex: EMS"
                  disabled={testing}
                />
              </div>
            </div>

            <Button 
              onClick={handleTestSearch} 
              disabled={testing || !testProductName.trim()}
              className="w-full md:w-auto"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Testar Busca
                </>
              )}
            </Button>

            {/* Resultado do teste */}
            {testResult && (
              <div className="mt-4">
                {testResult.success ? (
                  <Alert className="border-primary/30 bg-primary/5">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <AlertTitle>Sucesso!</AlertTitle>
                    <AlertDescription className="space-y-3">
                      <p className="text-sm">Imagem encontrada com sucesso.</p>
                      {testResult.imageUrl && (
                        <div className="mt-3 flex flex-col md:flex-row gap-4 items-start">
                          <img 
                            src={testResult.imageUrl} 
                            alt="Imagem encontrada"
                            className="w-32 h-32 object-contain rounded-lg border bg-background"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                          <div className="flex-1 space-y-2">
                            <p className="text-xs text-muted-foreground break-all">
                              <strong>URL:</strong> {testResult.imageUrl}
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => copyToClipboard(testResult.imageUrl!, 'URL da imagem')}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copiar URL
                            </Button>
                          </div>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Erro na Busca</AlertTitle>
                    <AlertDescription>
                      <p className="text-sm">{testResult.error}</p>
                      <p className="text-xs mt-2 opacity-80">
                        {config.provider === 'serpapi' 
                          ? 'Verifique se a SerpAPI Key está correta e se você ainda tem buscas disponíveis.'
                          : 'Se persistir, verifique se a API está ativada e considere trocar para SerpAPI.'}
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              ⚠️ Cada teste conta como uma busca no limite.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Seleção de Provedor */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Key className="h-5 w-5" />
            Provedor de Busca
          </CardTitle>
          <CardDescription>
            Escolha o provedor de busca de imagens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={config.provider}
            onValueChange={(value) => setConfig(prev => ({ ...prev, provider: value }))}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors ${
              config.provider === 'serpapi' ? 'border-primary bg-primary/5' : 'border-muted'
            }`}>
              <RadioGroupItem value="serpapi" id="serpapi" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="serpapi" className="font-medium cursor-pointer">
                  SerpAPI
                  <Badge variant="outline" className="ml-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                    Recomendado
                  </Badge>
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  100 buscas/mês grátis. Fácil configuração. Funciona sem bloqueios.
                </p>
              </div>
            </div>
            
            <div className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-colors ${
              config.provider === 'google' ? 'border-primary bg-primary/5' : 'border-muted'
            }`}>
              <RadioGroupItem value="google" id="google" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="google" className="font-medium cursor-pointer">
                  Google Custom Search
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  100 buscas/dia grátis. Configuração complexa. Pode bloquear novos projetos.
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Formulário SerpAPI */}
      {config.provider === 'serpapi' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Key className="h-5 w-5" />
              Credenciais SerpAPI
            </CardTitle>
            <CardDescription>
              Insira sua API Key da SerpAPI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serpapi_key">SerpAPI Key</Label>
              <div className="relative">
                <Input
                  id="serpapi_key"
                  type={showSerpApiKey ? "text" : "password"}
                  value={config.serpapi_key}
                  onChange={(e) => setConfig(prev => ({ ...prev, serpapi_key: e.target.value }))}
                  placeholder="Sua API Key da SerpAPI"
                  className="font-mono text-sm pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowSerpApiKey(!showSerpApiKey)}
                >
                  {showSerpApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="daily_limit">Limite Diário de Buscas</Label>
              <Input
                id="daily_limit"
                type="number"
                min={1}
                max={10000}
                value={config.daily_limit}
                onChange={(e) => setConfig(prev => ({ ...prev, daily_limit: parseInt(e.target.value) || 100 }))}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Plano gratuito: 100 buscas/mês. Plano pago: a partir de $50/mês.
              </p>
            </div>

            <Separator />

            <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configuração
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Formulário Google */}
      {config.provider === 'google' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <Key className="h-5 w-5" />
              Credenciais Google Custom Search
            </CardTitle>
            <CardDescription>
              Insira as credenciais da API do Google Custom Search
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <div className="relative">
                <Input
                  id="api_key"
                  type={showApiKey ? "text" : "password"}
                  value={config.api_key}
                  onChange={(e) => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
                  placeholder="AIzaSy..."
                  className="font-mono text-sm pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search_engine_id">Search Engine ID (cx)</Label>
              <Input
                id="search_engine_id"
                value={config.search_engine_id}
                onChange={(e) => setConfig(prev => ({ ...prev, search_engine_id: e.target.value }))}
                placeholder="a1b2c3d4e5f6g7h8i"
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="daily_limit_google">Limite Diário de Buscas</Label>
              <Input
                id="daily_limit_google"
                type="number"
                min={1}
                max={10000}
                value={config.daily_limit}
                onChange={(e) => setConfig(prev => ({ ...prev, daily_limit: parseInt(e.target.value) || 100 }))}
                className="w-32"
              />
              <p className="text-xs text-muted-foreground">
                Primeiras 100/dia são gratuitas. Acima disso: ~$5 por 1.000 buscas.
              </p>
            </div>

            <Separator />

            <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configuração
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instruções SerpAPI */}
      {config.provider === 'serpapi' && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="instructions">
            <AccordionTrigger className="text-base">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Como configurar a SerpAPI
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-semibold mb-2">1. Criar conta na SerpAPI</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Acesse serpapi.com e crie uma conta gratuita. Não precisa de cartão de crédito.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://serpapi.com/users/sign_up" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Criar Conta
                    </a>
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">2. Copiar a API Key</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Após criar a conta, vá no Dashboard e copie sua API Key.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://serpapi.com/dashboard" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Acessar Dashboard
                    </a>
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">3. Colar a API Key aqui</h4>
                  <p className="text-sm text-muted-foreground">
                    Cole a API Key no campo acima e clique em "Salvar Configuração".
                  </p>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Limites do plano gratuito</AlertTitle>
                <AlertDescription>
                  O plano gratuito inclui 100 buscas por mês. Para mais buscas, 
                  considere um plano pago a partir de $50/mês (5.000 buscas).
                </AlertDescription>
              </Alert>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Instruções Google */}
      {config.provider === 'google' && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="instructions">
            <AccordionTrigger className="text-base">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Como configurar o Google Custom Search
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Aviso</AlertTitle>
                <AlertDescription>
                  O Google pode bloquear o acesso à Custom Search API para novos projetos. 
                  Se você encontrar erros 403, considere usar a SerpAPI como alternativa.
                </AlertDescription>
              </Alert>

              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-semibold mb-2">1. Acessar Google Cloud Console</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Entre no Google Cloud Console e selecione ou crie um projeto.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir Google Cloud Console
                    </a>
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">2. Ativar Custom Search API</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Vá em "APIs e Serviços" &gt; "Biblioteca" e ative a "Custom Search API".
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://console.cloud.google.com/apis/library/customsearch.googleapis.com" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ativar Custom Search API
                    </a>
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">3. Criar API Key</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Vá em "APIs e Serviços" &gt; "Credenciais" &gt; "Criar Credenciais" &gt; "Chave de API".
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Criar API Key
                    </a>
                  </Button>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">4. Criar Programmable Search Engine</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Crie um mecanismo de busca personalizado e obtenha o Search Engine ID.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://programmablesearchengine.google.com/controlpanel/create" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Criar Search Engine
                    </a>
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
