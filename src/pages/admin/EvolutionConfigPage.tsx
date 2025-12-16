import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, Save, Server, Key, CheckCircle, XCircle, Eye, EyeOff, 
  RefreshCw, Smartphone, Users, MessageSquare, Wifi, WifiOff, 
  Copy, Phone, Store, AlertCircle, Link, FileText
} from "lucide-react";

interface LinkedStore {
  id: string;
  name: string;
  slug: string;
  ownerName: string | null;
  ownerEmail: string | null;
}

interface EvolutionInstance {
  instanceName: string;
  instanceId: string;
  status: string;
  owner: string;
  profilePictureUrl: string | null;
  number: string | null;
  apiKey: string | null;
  integration: string;
  contactsCount: number;
  chatsCount: number;
  isLinked: boolean;
  linkedStore: LinkedStore | null;
}

interface InstanceStats {
  total: number;
  connected: number;
  connecting: number;
  offline: number;
  linked: number;
  orphan: number;
}

export default function EvolutionConfigPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [instances, setInstances] = useState<EvolutionInstance[]>([]);
  const [stats, setStats] = useState<InstanceStats>({ total: 0, connected: 0, connecting: 0, offline: 0, linked: 0, orphan: 0 });
  const [loadingInstances, setLoadingInstances] = useState(false);
  
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
        if (configData.api_url && configData.api_key) {
          fetchInstances(configData.api_url, configData.api_key);
        }
      }
    } catch (error) {
      console.log('Nenhuma configuração encontrada, será criada ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const fetchInstances = async (apiUrl?: string, apiKey?: string) => {
    const url = apiUrl || config.api_url;
    const key = apiKey || config.api_key;
    
    if (!url || !key) return;

    setLoadingInstances(true);
    try {
      const { data, error } = await supabase.functions.invoke('evolution-test-connection', {
        body: { api_url: url, api_key: key }
      });

      if (error) throw error;

      if (data?.success) {
        setInstances(data.instances || []);
        setStats(data.stats || { total: 0, connected: 0, connecting: 0, offline: 0 });
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
        setInstances([]);
      }
    } catch (error) {
      console.error('Erro ao buscar instâncias:', error);
      setConnectionStatus('error');
    } finally {
      setLoadingInstances(false);
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
        api_url: config.api_url.replace(/\/$/, ''),
        api_key: config.api_key,
        is_active: config.is_active,
      };

      if (config.id) {
        const { error } = await supabase
          .from('evolution_config' as any)
          .update(saveData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
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

      fetchInstances();
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
      const { data, error } = await supabase.functions.invoke('evolution-test-connection', {
        body: { api_url: config.api_url, api_key: config.api_key }
      });

      if (error) throw error;

      if (data?.success) {
        setConnectionStatus('connected');
        setInstances(data.instances || []);
        setStats(data.stats || { total: 0, connected: 0, connecting: 0, offline: 0 });
        toast({
          title: "Conexão OK",
          description: data.message || `Evolution API conectada.`,
        });
      } else {
        setConnectionStatus('error');
        toast({
          title: "Erro de Conexão",
          description: data?.error || "Não foi possível conectar à Evolution API",
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: "Texto copiado para a área de transferência" });
  };

  const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return 'Não conectado';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    return phone;
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'open':
      case 'connected':
        return { label: 'Conectado', color: 'bg-emerald-500', textColor: 'text-emerald-500', icon: Wifi };
      case 'connecting':
        return { label: 'Conectando', color: 'bg-amber-500', textColor: 'text-amber-500', icon: RefreshCw };
      case 'close':
      case 'closed':
      case 'disconnected':
        return { label: 'Desconectado', color: 'bg-red-500', textColor: 'text-red-500', icon: WifiOff };
      default:
        return { label: 'Desconhecido', color: 'bg-gray-500', textColor: 'text-gray-500', icon: WifiOff };
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
    <div className="space-y-4 md:space-y-6">
      {/* Header Responsivo */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Server className="h-5 w-5 md:h-6 md:w-6 text-primary shrink-0" />
          <span className="hidden sm:inline">Configuração </span>Evolution API
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          <span className="hidden sm:inline">Gerencie a conexão com o servidor Evolution API e monitore suas instâncias WhatsApp</span>
          <span className="sm:hidden">Gerencie servidor e instâncias WhatsApp</span>
        </p>
      </div>

      {/* Estatísticas Globais */}
      {connectionStatus === 'connected' && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Smartphone className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                <span className="hidden xs:inline">Instâncias </span>WhatsApp
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => fetchInstances()}
                disabled={loadingInstances}
                className="h-8 px-2 md:px-3"
              >
                <RefreshCw className={`h-4 w-4 ${loadingInstances ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline ml-1">Atualizar</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6 pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
              <div className="text-center p-2 md:p-3 rounded-lg bg-background/50 border">
                <div className="text-xl md:text-2xl font-bold text-foreground">{stats.total}</div>
                <div className="text-[10px] md:text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Smartphone className="h-3 w-3" /> Total
                </div>
              </div>
              <div className="text-center p-2 md:p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-xl md:text-2xl font-bold text-emerald-500">{stats.connected}</div>
                <div className="text-[10px] md:text-xs text-emerald-600 flex items-center justify-center gap-1">
                  <Wifi className="h-3 w-3" /> <span className="hidden xs:inline">Conectadas</span><span className="xs:hidden">Conn</span>
                </div>
              </div>
              <div className="text-center p-2 md:p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="text-xl md:text-2xl font-bold text-amber-500">{stats.connecting}</div>
                <div className="text-[10px] md:text-xs text-amber-600 flex items-center justify-center gap-1">
                  <RefreshCw className="h-3 w-3" /> <span className="hidden xs:inline">Conectando</span><span className="xs:hidden">Pend</span>
                </div>
              </div>
              <div className="text-center p-2 md:p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="text-xl md:text-2xl font-bold text-red-500">{stats.offline}</div>
                <div className="text-[10px] md:text-xs text-red-600 flex items-center justify-center gap-1">
                  <WifiOff className="h-3 w-3" /> Offline
                </div>
              </div>
              <div className="text-center p-2 md:p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="text-xl md:text-2xl font-bold text-primary">{stats.linked}</div>
                <div className="text-[10px] md:text-xs text-primary flex items-center justify-center gap-1">
                  <Store className="h-3 w-3" /> <span className="hidden xs:inline">Vinculadas</span><span className="xs:hidden">Vinc</span>
                </div>
              </div>
              <div className="text-center p-2 md:p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="text-xl md:text-2xl font-bold text-orange-500">{stats.orphan}</div>
                <div className="text-[10px] md:text-xs text-orange-600 flex items-center justify-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Órfãs
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid de Cards de Instâncias */}
      {instances.length > 0 && (
        <div className="grid gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {instances.map((instance) => {
            const statusConfig = getStatusConfig(instance.status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <Card 
                key={instance.instanceId} 
                className="overflow-hidden border-l-4 transition-all hover:shadow-lg"
                style={{ borderLeftColor: statusConfig.color.replace('bg-', 'var(--') }}
              >
                {/* Header do Card - Compacto */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-3 md:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-background shadow-md shrink-0">
                        <AvatarImage src={instance.profilePictureUrl || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm md:text-base">
                          {instance.instanceName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm md:text-base text-foreground truncate">{instance.instanceName}</h3>
                        {instance.owner && (
                          <p className="text-[10px] md:text-xs text-muted-foreground truncate">{instance.owner}</p>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`${statusConfig.textColor} border-current text-[10px] md:text-xs shrink-0 px-1.5 md:px-2`}
                    >
                      <StatusIcon className={`h-3 w-3 ${instance.status === 'connecting' ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline ml-1">{statusConfig.label}</span>
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-3 md:p-4 space-y-3 md:space-y-4">
                  {/* Número de Telefone */}
                  <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm">
                    <Phone className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground hidden xs:inline">Número:</span>
                    <span className="font-medium truncate">{formatPhoneNumber(instance.number)}</span>
                  </div>

                  {/* Métricas de Contatos e Conversas */}
                  {(instance.status === 'open' || instance.status === 'connected') && (
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                      <div className="flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-500 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-base md:text-lg font-bold text-blue-500">{instance.contactsCount || 0}</div>
                          <div className="text-[10px] md:text-xs text-blue-600">Contatos</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4 text-purple-500 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-base md:text-lg font-bold text-purple-500">{instance.chatsCount || 0}</div>
                          <div className="text-[10px] md:text-xs text-purple-600">Conversas</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Vínculo com Loja - Compacto */}
                  {instance.isLinked && instance.linkedStore ? (
                    <div className="p-2 md:p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-1.5 md:space-y-2">
                      <div className="flex items-center gap-1.5 md:gap-2 text-primary font-medium text-xs md:text-sm">
                        <Store className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                        Vinculada à Loja
                      </div>
                      <div className="space-y-0.5 md:space-y-1 text-xs md:text-sm">
                        <div className="font-semibold text-foreground truncate">{instance.linkedStore.name}</div>
                        {instance.linkedStore.ownerName && (
                          <div className="text-muted-foreground flex items-center gap-1 truncate">
                            <Users className="h-3 w-3 shrink-0" />
                            <span className="truncate">{instance.linkedStore.ownerName}</span>
                          </div>
                        )}
                        <div className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-1 overflow-hidden">
                          <Link className="h-3 w-3 shrink-0" />
                          <span className="truncate">/loja/{instance.linkedStore.slug}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 md:p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                      <div className="flex items-center gap-1.5 md:gap-2 text-orange-600 font-medium text-xs md:text-sm">
                        <AlertCircle className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                        Não Vinculada
                      </div>
                      <p className="text-[10px] md:text-xs text-orange-600/80 mt-0.5 md:mt-1">
                        <span className="hidden sm:inline">Esta instância não está associada a nenhuma loja no sistema</span>
                        <span className="sm:hidden">Sem loja associada</span>
                      </p>
                    </div>
                  )}

                  {/* API Key da Instância - Com Scroll */}
                  {instance.apiKey && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
                        <Key className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                        <span>API Key:</span>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2 bg-muted/50 rounded-md p-1.5 md:p-2">
                        <div className="flex-1 overflow-x-auto scrollbar-hide">
                          <code className="text-[10px] md:text-xs font-mono whitespace-nowrap">
                            {instance.apiKey.slice(0, 20)}...
                          </code>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 shrink-0"
                          onClick={() => copyToClipboard(instance.apiKey!)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Integração */}
                  <div className="flex items-center justify-between text-[10px] md:text-xs text-muted-foreground pt-2 border-t">
                    <span>{instance.integration}</span>
                    <span className="font-mono">{instance.instanceId.slice(0, 8)}...</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Configuração do Servidor */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <Server className="h-4 w-4 md:h-5 md:w-5" />
            <span className="hidden xs:inline">Servidor </span>Evolution API
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            <span className="hidden sm:inline">Insira as credenciais do seu servidor Evolution API</span>
            <span className="sm:hidden">Credenciais do servidor</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 space-y-4 md:space-y-6">
          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="api_url" className="text-sm md:text-base">URL do Servidor *</Label>
            <Input
              id="api_url"
              placeholder="https://seu-servidor.com"
              value={config.api_url}
              onChange={(e) => setConfig(prev => ({ ...prev, api_url: e.target.value }))}
              className="h-9 md:h-10 text-sm"
            />
            <p className="text-[10px] md:text-xs text-muted-foreground">
              URL completa <span className="hidden sm:inline">do servidor Evolution API </span>(sem barra no final)
            </p>
          </div>

          <div className="space-y-1.5 md:space-y-2">
            <Label htmlFor="api_key" className="text-sm md:text-base flex items-center gap-1.5 md:gap-2">
              <Key className="h-3.5 w-3.5 md:h-4 md:w-4" />
              API Key<span className="hidden xs:inline"> (Global Token)</span> *
            </Label>
            <div className="relative">
              <Input
                id="api_key"
                type={showApiKey ? "text" : "password"}
                placeholder="Sua chave de API"
                value={config.api_key}
                onChange={(e) => setConfig(prev => ({ ...prev, api_key: e.target.value }))}
                className="pr-10 h-9 md:h-10 text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full w-9 md:w-10"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              Token <span className="hidden sm:inline">de autenticação global configurado no servidor Evolution</span><span className="sm:hidden">global do servidor</span>
            </p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5 min-w-0">
              <Label className="text-sm md:text-base">Status da Integração</Label>
              <p className="text-[10px] md:text-xs text-muted-foreground">
                <span className="hidden sm:inline">Ativar ou desativar a integração com WhatsApp</span>
                <span className="sm:hidden">Ativar/desativar</span>
              </p>
            </div>
            <Switch
              checked={config.is_active}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, is_active: checked }))}
            />
          </div>

          {connectionStatus !== 'unknown' && (
            <div className={`p-3 md:p-4 rounded-lg flex items-center gap-2 text-sm ${
              connectionStatus === 'connected' 
                ? 'bg-emerald-500/10 text-emerald-500' 
                : 'bg-red-500/10 text-red-500'
            }`}>
              {connectionStatus === 'connected' ? (
                <>
                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
                  <span className="text-xs md:text-sm">
                    <span className="hidden sm:inline">Conexão estabelecida com sucesso!</span>
                    <span className="sm:hidden">Conectado!</span>
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
                  <span className="text-xs md:text-sm">
                    <span className="hidden sm:inline">Erro ao conectar. Verifique as credenciais.</span>
                    <span className="sm:hidden">Erro na conexão</span>
                  </span>
                </>
              )}
            </div>
          )}

          {/* Botões Empilhados no Mobile */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button 
              onClick={testConnection} 
              variant="outline" 
              disabled={testing}
              className="w-full sm:w-auto h-9 md:h-10"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 md:mr-2 animate-spin" />
                  <span className="hidden xs:inline">Testando...</span>
                  <span className="xs:hidden">...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1.5 md:mr-2" />
                  Testar<span className="hidden xs:inline"> Conexão</span>
                </>
              )}
            </Button>
            
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full sm:w-auto h-9 md:h-10"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 md:mr-2 animate-spin" />
                  <span className="hidden xs:inline">Salvando...</span>
                  <span className="xs:hidden">...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5 md:mr-2" />
                  Salvar<span className="hidden xs:inline"> Configuração</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documentação - Compacta */}
      <Card>
        <CardHeader className="p-4 md:p-6 pb-2 md:pb-3">
          <CardTitle className="text-base md:text-lg flex items-center gap-2">
            <FileText className="h-4 w-4 md:h-5 md:w-5" />
            Documentação
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 space-y-3 md:space-y-4 text-xs md:text-sm text-muted-foreground">
          <p>
            <span className="hidden sm:inline">Para usar o módulo WhatsApp Recuperação, você precisa de um servidor Evolution API configurado.</span>
            <span className="sm:hidden">Requer servidor Evolution API.</span>
          </p>
          <div className="space-y-1.5 md:space-y-2">
            <p className="font-medium text-foreground text-sm md:text-base">Requisitos:</p>
            <ul className="list-disc list-inside space-y-0.5 md:space-y-1 ml-1">
              <li>Evolution API v2.x rodando</li>
              <li>Token global configurado</li>
              <li>Porta do servidor liberada</li>
            </ul>
          </div>
          <div className="space-y-1.5 md:space-y-2">
            <p className="font-medium text-foreground text-sm md:text-base">Links úteis:</p>
            <ul className="list-disc list-inside space-y-0.5 md:space-y-1 ml-1">
              <li>
                <a 
                  href="https://doc.evolution-api.com/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  <span className="hidden sm:inline">Documentação </span>Evolution API
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/EvolutionAPI/evolution-api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  GitHub<span className="hidden sm:inline"> Evolution API</span>
                </a>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
