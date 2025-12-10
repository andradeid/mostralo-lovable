import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Save, Server, Key, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

export default function EvolutionConfigPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  
  const [config, setConfig] = useState({
    id: '',
    api_url: '',
    api_key: '',
    is_active: true,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('evolution_config' as any)
        .select('*')
        .limit(1)
        .single();

      if (data && !error) {
        const configData = data as any;
        setConfig({
          id: configData.id,
          api_url: configData.api_url,
          api_key: configData.api_key,
          is_active: configData.is_active,
        });
      }
    } catch (error) {
      console.log('Nenhuma configuração encontrada, será criada ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config.api_url || !config.api_key) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const saveData = {
        api_url: config.api_url.replace(/\/$/, ''), // Remove trailing slash
        api_key: config.api_key,
        is_active: config.is_active,
      };

      if (config.id) {
        // Atualizar
        const { error } = await supabase
          .from('evolution_config' as any)
          .update(saveData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        // Criar
        const { data, error } = await supabase
          .from('evolution_config' as any)
          .insert(saveData)
          .select()
          .single();

        if (error) throw error;
        if (data) setConfig(prev => ({ ...prev, id: (data as any).id }));
      }

      toast({
        title: "Sucesso",
        description: "Configuração salva com sucesso",
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

  const testConnection = async () => {
    if (!config.api_url || !config.api_key) {
      toast({
        title: "Erro",
        description: "Configure a URL e API Key primeiro",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setConnectionStatus('unknown');

    try {
      const response = await fetch(`${config.api_url.replace(/\/$/, '')}/instance/fetchInstances`, {
        method: 'GET',
        headers: {
          'apikey': config.api_key,
        },
      });

      if (response.ok) {
        setConnectionStatus('connected');
        const data = await response.json();
        toast({
          title: "Conexão OK",
          description: `Evolution API conectada. ${Array.isArray(data) ? data.length : 0} instância(s) encontrada(s).`,
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "Erro de Conexão",
          description: `Status: ${response.status} - ${response.statusText}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setConnectionStatus('error');
      toast({
        title: "Erro de Conexão",
        description: error.message || "Não foi possível conectar à Evolution API",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuração Evolution API</h1>
        <p className="text-muted-foreground">
          Configure a conexão com o servidor Evolution API para o módulo WhatsApp Recuperação
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Servidor Evolution API
          </CardTitle>
          <CardDescription>
            Insira as credenciais do seu servidor Evolution API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="api_url">URL do Servidor *</Label>
            <Input
              id="api_url"
              placeholder="https://seu-servidor.com"
              value={config.api_url}
              onChange={(e) => setConfig(prev => ({ ...prev, api_url: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              URL completa do seu servidor Evolution API (sem barra no final)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_key" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Key (Global Token) *
            </Label>
            <div className="relative">
              <Input
                id="api_key"
                type={showApiKey ? "text" : "password"}
                placeholder="Sua chave de API"
                value={config.api_key}
                onChange={(e) => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Token de autenticação global configurado no servidor Evolution
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Status da Integração</Label>
              <p className="text-xs text-muted-foreground">
                Ativar ou desativar a integração com WhatsApp
              </p>
            </div>
            <Switch
              checked={config.is_active}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, is_active: checked }))}
            />
          </div>

          {connectionStatus !== 'unknown' && (
            <div className={`p-4 rounded-lg flex items-center gap-2 ${
              connectionStatus === 'connected' 
                ? 'bg-green-500/10 text-green-500' 
                : 'bg-red-500/10 text-red-500'
            }`}>
              {connectionStatus === 'connected' ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Conexão estabelecida com sucesso!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5" />
                  <span>Erro ao conectar. Verifique as credenciais.</span>
                </>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={testConnection} variant="outline" disabled={testing}>
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                "Testar Conexão"
              )}
            </Button>
            
            <Button onClick={handleSave} disabled={saving}>
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Para usar o módulo WhatsApp Recuperação, você precisa de um servidor Evolution API configurado.
          </p>
          <div className="space-y-2">
            <p className="font-medium text-foreground">Requisitos:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Servidor Evolution API v2.x rodando</li>
              <li>Token de autenticação global configurado</li>
              <li>Acesso à porta do servidor liberado</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">Links úteis:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <a 
                  href="https://doc.evolution-api.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Documentação Evolution API
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/EvolutionAPI/evolution-api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  GitHub Evolution API
                </a>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
