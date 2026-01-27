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
    provider: 'google',
    api_key: '',
    search_engine_id: '',
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
          provider: configData.provider || 'google',
          api_key: configData.api_key || '',
          search_engine_id: configData.search_engine_id || '',
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

  const handleSave = async () => {
    if (!config.api_key || !config.search_engine_id) {
      toast({
        title: "Erro",
        description: "Preencha a API Key e o Search Engine ID",
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

    if (!config.api_key || !config.search_engine_id) {
      toast({
        title: "Erro",
        description: "Configure a API Key e o Search Engine ID primeiro",
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
          Configure a API do Google para buscar imagens automaticamente na importação de produtos
        </p>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        {hasConfig && config.api_key && config.search_engine_id ? (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Configurado
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
                <p className="text-xs text-muted-foreground">Pesquisa imagens no Google</p>
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
              O contador reseta automaticamente à meia-noite. As primeiras 100 buscas/dia são gratuitas no Google.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Área de Teste Manual */}
      {hasConfig && config.api_key && config.search_engine_id && (
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
                  <Alert className="border-green-500/30 bg-green-500/5">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-600">Sucesso!</AlertTitle>
                    <AlertDescription className="space-y-3">
                      <p className="text-sm">Imagem encontrada com sucesso.</p>
                      {testResult.imageUrl && (
                        <div className="mt-3 flex flex-col md:flex-row gap-4 items-start">
                          <img 
                            src={testResult.imageUrl} 
                            alt="Imagem encontrada"
                            className="w-32 h-32 object-contain rounded-lg border bg-white"
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
                        Verifique se a API Key está correta e se a Custom Search API está ativada no Google Cloud Console.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              ⚠️ Cada teste conta como uma busca no limite diário.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Formulário de Configuração */}
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
                Salvar Configurações
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Instruções Passo a Passo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Como Configurar
          </CardTitle>
          <CardDescription>
            Siga o passo a passo para obter as credenciais do Google Custom Search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="step-1">
              <AccordionTrigger className="text-sm md:text-base">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="shrink-0">1</Badge>
                  Criar Projeto no Google Cloud Console
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Acesse o <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Google Cloud Console <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Clique em <strong>"Selecionar projeto"</strong> no topo da página</li>
                  <li>Clique em <strong>"Novo Projeto"</strong></li>
                  <li>Nome sugerido: <code className="bg-muted px-1 rounded">Mostralo Image Search</code></li>
                  <li>Clique em <strong>"Criar"</strong></li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-2">
              <AccordionTrigger className="text-sm md:text-base">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="shrink-0">2</Badge>
                  Ativar a Custom Search API
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>No menu lateral, vá em <strong>"APIs e Serviços"</strong> → <strong>"Biblioteca"</strong></li>
                  <li>Pesquise por <strong>"Custom Search API"</strong></li>
                  <li>Clique na API e depois em <strong>"Ativar"</strong></li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-3">
              <AccordionTrigger className="text-sm md:text-base">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="shrink-0">3</Badge>
                  Criar Credenciais (API Key)
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>No menu, vá em <strong>"APIs e Serviços"</strong> → <strong>"Credenciais"</strong></li>
                  <li>Clique em <strong>"+ Criar Credenciais"</strong> → <strong>"Chave de API"</strong></li>
                  <li>Uma janela mostrará a chave gerada</li>
                  <li>Copie a chave e cole no campo <strong>"API Key"</strong> acima</li>
                  <li>(Opcional) Clique em <strong>"Editar chave de API"</strong> para restringir à Custom Search API</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-4">
              <AccordionTrigger className="text-sm md:text-base">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="shrink-0">4</Badge>
                  Criar Search Engine (Mecanismo de Pesquisa)
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Acesse <a href="https://programmablesearchengine.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Programmable Search Engine <ExternalLink className="h-3 w-3" /></a></li>
                  <li>Clique em <strong>"Novo mecanismo de pesquisa"</strong></li>
                  <li>Em "O que pesquisar", marque <strong>"Pesquisar toda a web"</strong></li>
                  <li>Nome do mecanismo: <code className="bg-muted px-1 rounded">Mostralo Product Images</code></li>
                  <li>Clique em <strong>"Criar"</strong></li>
                  <li>Vá em <strong>"Painel de controle"</strong> do mecanismo criado</li>
                  <li>Copie o <strong>"ID do mecanismo de pesquisa"</strong> (cx)</li>
                  <li>Cole no campo <strong>"Search Engine ID"</strong> acima</li>
                </ol>
                <Alert className="mt-3">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Importante</AlertTitle>
                  <AlertDescription className="text-xs">
                    No painel do Search Engine, certifique-se de que <strong>"Pesquisa de imagens"</strong> está ativada nas configurações.
                  </AlertDescription>
                </Alert>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-5">
              <AccordionTrigger className="text-sm md:text-base">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="shrink-0">5</Badge>
                  Testar e Usar na Importação
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Após salvar as configurações acima, vá para <strong>Produtos → Importar do Alquimia</strong></li>
                  <li>Faça upload do arquivo CSV normalmente</li>
                  <li>Na etapa de exportação, ative o toggle <strong>"Buscar imagens automaticamente"</strong></li>
                  <li>Clique em <strong>"Importar Produtos"</strong></li>
                  <li>O sistema buscará as imagens em lotes de 50 produtos</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Alerta de Custo */}
      <Alert variant="default" className="border-amber-500/30 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-700">Custos da API</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          O Google Custom Search oferece <strong>100 buscas gratuitas por dia</strong>. 
          Acima desse limite, o custo é de aproximadamente <strong>$5 por 1.000 buscas</strong>. 
          Para importar 1.000 produtos/dia além do limite gratuito, o custo seria de ~R$25/dia.
        </AlertDescription>
      </Alert>
    </div>
  );
}
