import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Server, Key, Eye, EyeOff, Save, Loader2, 
  CheckCircle, XCircle, MessageCircle, Info
} from "lucide-react";
import { toast } from "sonner";

export default function UaZapiConfigTab() {
  const [config, setConfig] = useState({
    api_url: '',
    api_token: '',
    is_active: false,
  });
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');

  const handleSave = async () => {
    if (!config.api_url || !config.api_token) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setSaving(true);
    try {
      // TODO: Implementar salvamento no Supabase (tabela uazapi_config)
      toast.success('Configuração salva com sucesso');
    } catch (error) {
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!config.api_url || !config.api_token) {
      toast.error('Configure a URL e Token primeiro');
      return;
    }
    setTesting(true);
    setConnectionStatus('unknown');
    try {
      // TODO: Implementar teste de conexão via Edge Function
      setTimeout(() => {
        setConnectionStatus('error');
        toast.info('Integração UaZapi ainda não implementada');
        setTesting(false);
      }, 1500);
    } catch (error) {
      setConnectionStatus('error');
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Banner informativo */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium">Integração em desenvolvimento</p>
            <p className="text-xs mt-1 text-blue-600 dark:text-blue-400">
              A UaZapi será uma alternativa à Evolution API. Configure as credenciais abaixo para preparar a integração.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configuração */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Server className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            Configuração UaZapi
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Configure as credenciais de acesso à API da UaZapi
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 space-y-4">
          {/* Status da conexão */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            {connectionStatus === 'connected' ? (
              <Badge variant="outline" className="text-emerald-500 border-emerald-500">
                <CheckCircle className="h-3 w-3 mr-1" /> Conectado
              </Badge>
            ) : connectionStatus === 'error' ? (
              <Badge variant="outline" className="text-red-500 border-red-500">
                <XCircle className="h-3 w-3 mr-1" /> Não conectado
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                Não testado
              </Badge>
            )}
          </div>

          {/* URL da API */}
          <div className="space-y-2">
            <Label htmlFor="uazapi-url" className="text-sm font-medium">
              URL da API
            </Label>
            <Input
              id="uazapi-url"
              placeholder="https://api.uazapi.com"
              value={config.api_url}
              onChange={(e) => setConfig(prev => ({ ...prev, api_url: e.target.value }))}
            />
          </div>

          {/* Token */}
          <div className="space-y-2">
            <Label htmlFor="uazapi-token" className="text-sm font-medium">
              Token de Acesso
            </Label>
            <div className="relative">
              <Input
                id="uazapi-token"
                type={showToken ? "text" : "password"}
                placeholder="Seu token da UaZapi"
                value={config.api_token}
                onChange={(e) => setConfig(prev => ({ ...prev, api_token: e.target.value }))}
                className="pr-10"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Ativo */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <Label className="text-sm font-medium">Ativar UaZapi</Label>
              <p className="text-xs text-muted-foreground">Habilitar integração com a UaZapi</p>
            </div>
            <Switch
              checked={config.is_active}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, is_active: checked }))}
            />
          </div>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={testConnection}
              disabled={testing || !config.api_url || !config.api_token}
              className="flex-1"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <MessageCircle className="h-4 w-4 mr-2" />
              )}
              Testar Conexão
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Configuração
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
