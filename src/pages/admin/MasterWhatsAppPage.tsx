import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useMasterWhatsAppConfig } from "@/hooks/useMasterWhatsAppConfig";
import { toast } from "sonner";
import { 
  Loader2, 
  Smartphone, 
  RefreshCw, 
  Power, 
  PowerOff, 
  QrCode,
  CheckCircle,
  XCircle,
  AlertCircle,
  Bot,
  MessageSquare,
  Users,
  HelpCircle,
  Settings
} from "lucide-react";
import { MasterBotConfigTab } from "@/components/admin/master-whatsapp/MasterBotConfigTab";
import { MasterSessionsTab } from "@/components/admin/master-whatsapp/MasterSessionsTab";

export default function MasterWhatsAppPage() {
  const { config, loading, updateConfig } = useMasterWhatsAppConfig();
  const [instanceName, setInstanceName] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceStatus, setInstanceStatus] = useState<string>("disconnected");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useEffect(() => {
    if (config?.instance_name) {
      setInstanceName(config.instance_name);
      setInstanceStatus(config.instance_status || "disconnected");
    }
  }, [config]);

  // Buscar Evolution Config
  const getEvolutionConfig = async () => {
    const { data, error } = await supabase
      .from('evolution_config')
      .select('*')
      .eq('is_active', true)
      .single();
    
    if (error || !data) {
      toast.error('Evolution API não configurada');
      return null;
    }
    return data;
  };

  // Criar instância
  const createInstance = async () => {
    if (!instanceName.trim()) {
      toast.error('Digite um nome para a instância');
      return;
    }

    setLoadingAction('create');
    try {
      const evolutionConfig = await getEvolutionConfig();
      if (!evolutionConfig) return;

      // Gerar nome único
      const uniqueName = `master_${instanceName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;

      const response = await fetch(`${evolutionConfig.api_url}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionConfig.api_key
        },
        body: JSON.stringify({
          instanceName: uniqueName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao criar instância');
      }

      // Salvar no banco
      await updateConfig({
        instance_name: uniqueName,
        instance_status: 'connecting',
        evolution_instance_id: data.instance?.instanceId || null
      });

      setInstanceStatus('connecting');
      
      // Buscar QR Code
      await fetchQrCode(uniqueName, evolutionConfig);
      
      toast.success('Instância criada! Escaneie o QR Code');
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar instância');
    } finally {
      setLoadingAction(null);
    }
  };

  // Buscar QR Code
  const fetchQrCode = async (name: string, evolutionConfig?: { api_url: string; api_key: string }) => {
    try {
      const config = evolutionConfig || await getEvolutionConfig();
      if (!config) return;

      const response = await fetch(`${config.api_url}/instance/connect/${name}`, {
        method: 'GET',
        headers: {
          'apikey': config.api_key
        }
      });

      const data = await response.json();

      if (data.base64) {
        setQrCode(data.base64);
      } else if (data.instance?.state === 'open') {
        setInstanceStatus('connected');
        await updateConfig({ instance_status: 'connected' });
        toast.success('WhatsApp conectado!');
      }
    } catch (error) {
      console.error('Erro ao buscar QR:', error);
    }
  };

  // Verificar status
  const checkStatus = async () => {
    if (!config?.instance_name) return;

    setLoadingAction('status');
    try {
      const evolutionConfig = await getEvolutionConfig();
      if (!evolutionConfig) return;

      const response = await fetch(
        `${evolutionConfig.api_url}/instance/connectionState/${config.instance_name}`,
        {
          headers: { 'apikey': evolutionConfig.api_key }
        }
      );

      const data = await response.json();
      const newStatus = data.instance?.state || 'disconnected';
      
      setInstanceStatus(newStatus);
      await updateConfig({ instance_status: newStatus });

      if (newStatus === 'open' || newStatus === 'connected') {
        toast.success('WhatsApp conectado!');
        setQrCode(null);
      } else if (newStatus === 'close' || newStatus === 'disconnected') {
        await fetchQrCode(config.instance_name, evolutionConfig);
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao verificar status');
    } finally {
      setLoadingAction(null);
    }
  };

  // Desconectar
  const disconnect = async () => {
    if (!config?.instance_name) return;

    setLoadingAction('disconnect');
    try {
      const evolutionConfig = await getEvolutionConfig();
      if (!evolutionConfig) return;

      await fetch(`${evolutionConfig.api_url}/instance/logout/${config.instance_name}`, {
        method: 'DELETE',
        headers: { 'apikey': evolutionConfig.api_key }
      });

      setInstanceStatus('disconnected');
      setQrCode(null);
      await updateConfig({ instance_status: 'disconnected' });
      
      toast.success('Desconectado');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao desconectar');
    } finally {
      setLoadingAction(null);
    }
  };

  const getStatusBadge = () => {
    switch (instanceStatus) {
      case 'open':
      case 'connected':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Conectado</Badge>;
      case 'connecting':
        return <Badge className="bg-yellow-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Conectando</Badge>;
      case 'close':
      case 'disconnected':
      default:
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Desconectado</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">WhatsApp Master</h1>
          <p className="text-muted-foreground">
            Gerencie bots de vendas, recrutamento e suporte
          </p>
        </div>
        {getStatusBadge()}
      </div>

      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connection" className="gap-2">
            <Smartphone className="w-4 h-4" />
            Conexão
          </TabsTrigger>
          <TabsTrigger value="bots" className="gap-2">
            <Bot className="w-4 h-4" />
            Configurar Bots
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Sessões
          </TabsTrigger>
        </TabsList>

        {/* Tab Conexão */}
        <TabsContent value="connection">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Criar/Gerenciar Instância */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Instância WhatsApp
                </CardTitle>
                <CardDescription>
                  Configure a conexão do WhatsApp Master
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!config?.instance_name ? (
                  <>
                    <div className="space-y-2">
                      <Label>Nome da Instância</Label>
                      <Input
                        placeholder="ex: vendas-master"
                        value={instanceName}
                        onChange={(e) => setInstanceName(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={createInstance} 
                      disabled={loadingAction === 'create'}
                      className="w-full"
                    >
                      {loadingAction === 'create' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Power className="w-4 h-4 mr-2" />
                      )}
                      Criar Instância
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Instância ativa:</p>
                      <p className="font-mono text-sm truncate">{config.instance_name}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={checkStatus}
                        disabled={loadingAction === 'status'}
                        className="flex-1"
                      >
                        {loadingAction === 'status' ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Atualizar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={disconnect}
                        disabled={loadingAction === 'disconnect'}
                      >
                        {loadingAction === 'disconnect' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <PowerOff className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* QR Code */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  QR Code
                </CardTitle>
                <CardDescription>
                  Escaneie com o WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent>
                {qrCode ? (
                  <div className="flex justify-center p-4 bg-white rounded-lg">
                    <img 
                      src={qrCode} 
                      alt="QR Code" 
                      className="w-64 h-64"
                    />
                  </div>
                ) : instanceStatus === 'open' || instanceStatus === 'connected' ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    <p className="text-lg font-medium">WhatsApp Conectado!</p>
                    <p className="text-sm text-muted-foreground">
                      Configure os bots na aba "Configurar Bots"
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {config?.instance_name 
                        ? 'Clique em "Atualizar" para gerar QR Code'
                        : 'Crie uma instância para começar'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Info dos Bots */}
          <div className="grid gap-4 md:grid-cols-3 mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 rounded-full bg-green-500/10">
                    <MessageSquare className="w-4 h-4 text-green-500" />
                  </div>
                  Bot de Vendas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Atende leads interessados em conhecer a plataforma. 
                  3 níveis: Consultivo, Persuasivo, Urgência.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 rounded-full bg-blue-500/10">
                    <Users className="w-4 h-4 text-blue-500" />
                  </div>
                  Bot de Recrutamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Recruta novos vendedores/afiliados. 
                  4 níveis: Lead Frio, Moderado, Agressivo, Super Agressivo.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="p-2 rounded-full bg-purple-500/10">
                    <HelpCircle className="w-4 h-4 text-purple-500" />
                  </div>
                  Bot de Suporte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Responde dúvidas gerais sobre a plataforma.
                  Prompt customizável.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Configuração dos Bots */}
        <TabsContent value="bots">
          <MasterBotConfigTab />
        </TabsContent>

        {/* Tab Sessões */}
        <TabsContent value="sessions">
          <MasterSessionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
