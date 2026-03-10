import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { 
  Server, Eye, EyeOff, Save, Loader2, 
  CheckCircle, XCircle, MessageCircle, Info,
  RefreshCw, Wifi, WifiOff, Smartphone, User,
  Globe, Link, Unlink
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UazapiInstance {
  id?: string;
  token?: string;
  phone?: string;
  owner?: string;
  name?: string;
  profileName?: string;
  instanceName?: string;
  status?: string;
  profilePicUrl?: string;
  isBusiness?: boolean;
  plataform?: string;
  lastDisconnect?: string;
  lastDisconnectReason?: string;
  chatbot_enabled?: boolean;
  created?: string;
}

interface WebhookConfig {
  enabled?: boolean;
  url?: string;
  events?: string[];
  excludeMessages?: string[];
}

export default function UaZapiConfigTab() {
  const [config, setConfig] = useState({
    api_url: '',
    admin_token: '',
    is_active: false,
  });
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [instances, setInstances] = useState<UazapiInstance[]>([]);
  const [serverStatus, setServerStatus] = useState<string | null>(null);
  const [maxInstances, setMaxInstances] = useState<number>(0);

  // Carregar configuração ao montar
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('uazapi-manage', {
        body: { action: 'get_config' }
      });
      if (error) throw error;
      if (data?.config) {
        setConfig({
          api_url: data.config.api_url || '',
          admin_token: data.config.admin_token || '',
          is_active: data.config.is_active || false,
        });
        setConnectionStatus(data.config.connection_status === 'connected' ? 'connected' : 
                           data.config.connection_status === 'error' ? 'error' : 'unknown');
        setMaxInstances(data.config.max_instances || 0);
      }
    } catch (error) {
      console.error('Erro ao carregar config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config.api_url || !config.admin_token) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('uazapi-manage', {
        body: { 
          action: 'save_config',
          api_url: config.api_url,
          admin_token: config.admin_token,
          is_active: config.is_active
        }
      });
      if (error) throw error;
      toast.success('Configuração salva com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    if (!config.api_url || !config.admin_token) {
      toast.error('Salve a configuração primeiro');
      return;
    }
    setTesting(true);
    setConnectionStatus('unknown');
    try {
      const { data, error } = await supabase.functions.invoke('uazapi-manage', {
        body: { action: 'test_connection' }
      });
      if (error) throw error;
      
      if (data?.status === 'connected') {
        setConnectionStatus('connected');
        toast.success('Conexão estabelecida com sucesso!');
        // Automaticamente carregar instâncias
        fetchInstances();
      } else {
        setConnectionStatus('error');
        toast.error(`Falha na conexão: ${data?.statusCode || 'erro desconhecido'}`);
      }
    } catch (error: any) {
      setConnectionStatus('error');
      toast.error(error.message || 'Erro ao testar conexão');
    } finally {
      setTesting(false);
    }
  };

  const fetchInstances = async () => {
    setLoadingInstances(true);
    try {
      const { data, error } = await supabase.functions.invoke('uazapi-manage', {
        body: { action: 'list_instances' }
      });
      if (error) throw error;

      const instancesList = data?.instances || [];
      setInstances(instancesList);
      setServerStatus(data?.serverStatus ? 'online' : null);
      
      if (data?.serverStatus?.maxInstances) {
        setMaxInstances(data.serverStatus.maxInstances);
      }

      if (instancesList.length > 0) {
        setConnectionStatus('connected');
      }
    } catch (error: any) {
      console.error('Erro ao buscar instâncias:', error);
      toast.error('Erro ao buscar instâncias');
    } finally {
      setLoadingInstances(false);
    }
  };

  // Carregar instâncias se já conectado
  useEffect(() => {
    if (connectionStatus === 'connected' && config.api_url && config.admin_token) {
      fetchInstances();
    }
  }, [connectionStatus]);

  const getStatusBadge = (status: string | undefined) => {
    const s = (status || '').toLowerCase();
    if (s === 'connected' || s === 'online' || s === 'open') {
      return (
        <Badge variant="outline" className="text-emerald-500 border-emerald-500 gap-1">
          <Wifi className="h-3 w-3" /> connected
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-red-500 border-red-500 gap-1">
        <WifiOff className="h-3 w-3" /> disconnected
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
            {serverStatus && (
              <Badge variant="outline" className="text-emerald-500 border-emerald-500 gap-1 ml-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
                online
              </Badge>
            )}
          </div>

          {/* URL da API */}
          <div className="space-y-2">
            <Label htmlFor="uazapi-url" className="text-sm font-medium">
              Server URL
            </Label>
            <Input
              id="uazapi-url"
              placeholder="https://hubsac.uazapi.com"
              value={config.api_url}
              onChange={(e) => setConfig(prev => ({ ...prev, api_url: e.target.value }))}
            />
          </div>

          {/* Token */}
          <div className="space-y-2">
            <Label htmlFor="uazapi-token" className="text-sm font-medium">
              Admin Token
            </Label>
            <div className="relative">
              <Input
                id="uazapi-token"
                type={showToken ? "text" : "password"}
                placeholder="Seu admin token da UaZapi"
                value={config.admin_token}
                onChange={(e) => setConfig(prev => ({ ...prev, admin_token: e.target.value }))}
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
              disabled={testing || !config.api_url || !config.admin_token}
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

      {/* Instâncias */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Smartphone className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                Instâncias Conectadas
              </CardTitle>
              <CardDescription className="text-xs md:text-sm mt-1">
                {maxInstances > 0 && (
                  <span>Limite de dispositivos: <strong>{maxInstances}</strong> · </span>
                )}
                <strong>{instances.length}</strong> total de instâncias
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchInstances}
              disabled={loadingInstances || !config.api_url || !config.admin_token}
            >
              {loadingInstances ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          {loadingInstances ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Buscando instâncias...</span>
            </div>
          ) : instances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Smartphone className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhuma instância encontrada</p>
              <p className="text-xs mt-1">Teste a conexão primeiro para listar as instâncias</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Número</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Instância</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instances.map((inst, idx) => {
                    const phone = inst.owner || inst.phone || '-';
                    const name = inst.profileName || inst.name || '-';
                    const instanceName = inst.name || '-';
                    const status = inst.status || 'unknown';

                    return (
                      <TableRow key={idx}>
                        <TableCell>
                          <Avatar className="h-8 w-8">
                            {inst.profilePicUrl ? (
                              <AvatarImage src={inst.profilePicUrl} alt={name} />
                            ) : null}
                            <AvatarFallback className="bg-muted text-xs">
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{phone}</TableCell>
                        <TableCell>{name}</TableCell>
                        <TableCell className="font-mono text-sm">{instanceName}</TableCell>
                        <TableCell>{getStatusBadge(status)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
