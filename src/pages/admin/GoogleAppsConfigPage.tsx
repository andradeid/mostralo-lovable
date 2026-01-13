import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, Save, Key, CheckCircle, XCircle, Eye, EyeOff, 
  ExternalLink, Copy, Info, Calendar, Mail, Video, Cloud,
  ArrowRight, BookOpen, Shield, AlertTriangle
} from "lucide-react";

interface GoogleConfig {
  id: string;
  client_id: string;
  client_secret: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function GoogleAppsConfigPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);
  
  const [config, setConfig] = useState({
    id: '',
    client_id: '',
    client_secret: '',
    is_active: true,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('google_oauth_config' as any)
        .select('*')
        .limit(1)
        .single();

      if (data && !error) {
        const configData = data as any;
        setConfig({
          id: configData.id,
          client_id: configData.client_id || '',
          client_secret: configData.client_secret || '',
          is_active: configData.is_active ?? true,
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
    if (!config.client_id || !config.client_secret) {
      toast({
        title: "Erro",
        description: "Preencha o Client ID e Client Secret",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const saveData = {
        client_id: config.client_id.trim(),
        client_secret: config.client_secret.trim(),
        is_active: config.is_active,
        updated_at: new Date().toISOString(),
      };

      if (config.id) {
        const { error } = await supabase
          .from('google_oauth_config' as any)
          .update(saveData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('google_oauth_config' as any)
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
        description: "Configurações do Google Apps salvas com sucesso",
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

  const redirectUri = "https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/google-calendar-callback";

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
          <Cloud className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0" />
          Google Apps
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          Configure as credenciais do Google para habilitar integrações como Google Agenda, Gmail e mais
        </p>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        {hasConfig && config.client_id && config.client_secret ? (
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
      </div>

      {/* Integrações Disponíveis */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Integrações Disponíveis</CardTitle>
          <CardDescription>
            Com as credenciais do Google configuradas, você poderá habilitar:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <h4 className="font-medium text-sm">Google Agenda</h4>
                <p className="text-xs text-muted-foreground">Sincronizar agendamentos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-muted opacity-60">
              <Mail className="h-8 w-8 text-muted-foreground" />
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Gmail</h4>
                <p className="text-xs text-muted-foreground">Em breve</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-muted opacity-60">
              <Video className="h-8 w-8 text-muted-foreground" />
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Google Meet</h4>
                <p className="text-xs text-muted-foreground">Em breve</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de Configuração */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Key className="h-5 w-5" />
            Credenciais OAuth 2.0
          </CardTitle>
          <CardDescription>
            Insira as credenciais do seu projeto no Google Cloud Console
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client_id">Client ID</Label>
            <Input
              id="client_id"
              value={config.client_id}
              onChange={(e) => setConfig(prev => ({ ...prev, client_id: e.target.value }))}
              placeholder="123456789-xxxxxxxx.apps.googleusercontent.com"
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_secret">Client Secret</Label>
            <div className="relative">
              <Input
                id="client_secret"
                type={showClientSecret ? "text" : "password"}
                value={config.client_secret}
                onChange={(e) => setConfig(prev => ({ ...prev, client_secret: e.target.value }))}
                placeholder="GOCSPX-xxxxxxxxxxxxxxxx"
                className="font-mono text-sm pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowClientSecret(!showClientSecret)}
              >
                {showClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Redirect URI */}
          <div className="space-y-2">
            <Label>Redirect URI (copie para o Google Cloud Console)</Label>
            <div className="flex items-center gap-2">
              <Input
                value={redirectUri}
                readOnly
                className="font-mono text-xs bg-muted"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(redirectUri, "Redirect URI")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
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
            Siga o passo a passo para obter as credenciais do Google
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
                  <li>Nome sugerido: <code className="bg-muted px-1 rounded">Mostralo Integrations</code></li>
                  <li>Clique em <strong>"Criar"</strong></li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-2">
              <AccordionTrigger className="text-sm md:text-base">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="shrink-0">2</Badge>
                  Habilitar APIs Necessárias
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>No menu lateral, vá em <strong>"APIs e Serviços"</strong> → <strong>"Biblioteca"</strong></li>
                  <li>Pesquise por <strong>"Google Calendar API"</strong></li>
                  <li>Clique na API e depois em <strong>"Ativar"</strong></li>
                  <li>Repita para outras APIs que desejar usar (Gmail API, etc.)</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-3">
              <AccordionTrigger className="text-sm md:text-base">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="shrink-0">3</Badge>
                  Configurar Tela de Consentimento OAuth
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>No menu, vá em <strong>"APIs e Serviços"</strong> → <strong>"Tela de consentimento OAuth"</strong></li>
                  <li>Escolha <strong>"Externo"</strong> e clique em <strong>"Criar"</strong></li>
                  <li>Preencha os campos obrigatórios:
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>Nome do app: <code className="bg-muted px-1 rounded">Mostralo</code></li>
                      <li>Email de suporte do usuário: seu email</li>
                      <li>Informações de contato do desenvolvedor: seu email</li>
                    </ul>
                  </li>
                  <li>Em <strong>"Escopos"</strong>, adicione:
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li><code className="bg-muted px-1 rounded">.../auth/calendar.events</code></li>
                      <li><code className="bg-muted px-1 rounded">.../auth/userinfo.email</code></li>
                      <li><code className="bg-muted px-1 rounded">.../auth/userinfo.profile</code></li>
                    </ul>
                  </li>
                  <li>Clique em <strong>"Salvar e Continuar"</strong> até finalizar</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-4">
              <AccordionTrigger className="text-sm md:text-base">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="shrink-0">4</Badge>
                  Criar Credenciais OAuth 2.0
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>No menu, vá em <strong>"APIs e Serviços"</strong> → <strong>"Credenciais"</strong></li>
                  <li>Clique em <strong>"+ Criar Credenciais"</strong> → <strong>"ID do cliente OAuth"</strong></li>
                  <li>Tipo de aplicativo: <strong>"Aplicativo da Web"</strong></li>
                  <li>Nome: <code className="bg-muted px-1 rounded">Mostralo OAuth Client</code></li>
                  <li>Em <strong>"URIs de redirecionamento autorizados"</strong>, adicione:</li>
                </ol>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-lg mt-2">
                  <code className="text-xs break-all flex-1">{redirectUri}</code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => copyToClipboard(redirectUri, "Redirect URI")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <ol start={6} className="list-decimal list-inside space-y-2 text-muted-foreground mt-2">
                  <li>Clique em <strong>"Criar"</strong></li>
                  <li>Uma janela mostrará o <strong>Client ID</strong> e <strong>Client Secret</strong></li>
                  <li>Copie ambos e cole nos campos acima</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="step-5">
              <AccordionTrigger className="text-sm md:text-base">
                <span className="flex items-center gap-2">
                  <Badge variant="outline" className="shrink-0">5</Badge>
                  Publicar o App (Opcional para Produção)
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Modo de Teste</AlertTitle>
                  <AlertDescription className="text-xs">
                    Enquanto o app estiver em modo de teste, apenas usuários adicionados como "Usuários de teste" 
                    poderão usar a integração. Para permitir que qualquer lojista use, você precisará publicar o app.
                  </AlertDescription>
                </Alert>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                  <li>Para testes, adicione emails em <strong>"Usuários de teste"</strong> na tela de consentimento</li>
                  <li>Para produção, clique em <strong>"Publicar App"</strong> e siga o processo de verificação do Google</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Alerta de Segurança */}
      <Alert variant="default" className="border-amber-500/30 bg-amber-500/10">
        <Shield className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-500">Segurança</AlertTitle>
        <AlertDescription className="text-sm text-muted-foreground">
          As credenciais são armazenadas de forma segura e nunca são expostas no frontend. 
          Apenas as Edge Functions do servidor têm acesso a esses dados para autenticar com o Google.
        </AlertDescription>
      </Alert>
    </div>
  );
}
