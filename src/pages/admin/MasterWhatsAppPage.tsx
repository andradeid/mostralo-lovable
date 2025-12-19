import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useMasterWhatsAppConfig } from "@/hooks/useMasterWhatsAppConfig";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { CountryCodeSelect } from "@/components/ui/country-code-select";
import { formatBrazilianPhone, formatInternationalPhone, cn } from "@/lib/utils";
import { format } from "date-fns";
import { InfoTooltip } from "@/components/ui/info-tooltip";
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
  Send,
  History,
  ExternalLink,
  Zap,
  Phone,
  Clock
} from "lucide-react";
import { MasterBotConfigTab } from "@/components/admin/master-whatsapp/MasterBotConfigTab";
import { MasterSessionsTab } from "@/components/admin/master-whatsapp/MasterSessionsTab";
import { MasterNotificationsCard } from "@/components/admin/master-whatsapp/MasterNotificationsCard";

interface TestMessage {
  id: string;
  phone_number: string;
  country_code: string;
  message: string;
  status: string;
  sent_at: string;
  error_message?: string;
}

interface EvolutionBot {
  id: string;
  enabled: boolean;
  model: string;
  triggerType: string;
  triggerValue: string;
  expire: number;
  keywordFinish: string;
  stopBotFromMe: boolean;
  keepOpen: boolean;
  debounceTime: number;
  botType?: 'sales' | 'recruitment' | 'support' | null;
  botTypeName?: string;
}

export default function MasterWhatsAppPage() {
  const { config, loading, updateConfig, syncBots, syncing } = useMasterWhatsAppConfig();
  const [instanceName, setInstanceName] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceStatus, setInstanceStatus] = useState<string>("disconnected");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [countryCode, setCountryCode] = useState("+55");
  const [testMessages, setTestMessages] = useState<TestMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [evolutionBots, setEvolutionBots] = useState<EvolutionBot[]>([]);
  const [loadingBots, setLoadingBots] = useState(false);
  const [syncingBotId, setSyncingBotId] = useState<string | null>(null);

  useEffect(() => {
    if (config?.instance_name) {
      setInstanceName(config.instance_name);
      setInstanceStatus(config.instance_status || "disconnected");
    }
  }, [config]);

  // Buscar bots da Evolution API
  const fetchEvolutionBots = async () => {
    setLoadingBots(true);
    try {
      const { data, error } = await supabase.functions.invoke('master-whatsapp-list-bots');
      
      if (error) throw error;
      
      // Mapear tipo do bot baseado nos IDs salvos na config
      const botsWithType = (data?.bots || []).map((bot: EvolutionBot) => {
        let botType: 'sales' | 'recruitment' | 'support' | null = null;
        let botTypeName = '';
        
        if (config?.sales_bot_evolution_id === bot.id) {
          botType = 'sales';
          botTypeName = '💰 Vendas';
        } else if (config?.recruitment_bot_evolution_id === bot.id) {
          botType = 'recruitment';
          botTypeName = '👥 Recrutamento';
        } else if (config?.support_bot_evolution_id === bot.id) {
          botType = 'support';
          botTypeName = '🎧 Suporte';
        }
        
        return { ...bot, botType, botTypeName };
      });
      
      setEvolutionBots(botsWithType);
    } catch (error) {
      console.error('Erro ao buscar bots:', error);
    } finally {
      setLoadingBots(false);
    }
  };

  // Sincronizar bot individual
  const handleSyncIndividualBot = async (bot: EvolutionBot) => {
    if (!bot.botType) {
      toast.error('Não foi possível identificar o tipo deste bot');
      return;
    }
    
    setSyncingBotId(bot.id);
    try {
      const success = await syncBots(bot.botType);
      if (success) {
        toast.success(`Bot de ${bot.botTypeName?.replace(/^[^\s]+\s/, '')} sincronizado!`);
        await fetchEvolutionBots();
      }
    } finally {
      setSyncingBotId(null);
    }
  };

  // Buscar histórico de mensagens de teste
  const fetchTestMessages = async () => {
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('master_test_messages')
        .select('id, phone_number, country_code, message, status, sent_at, error_message')
        .order('sent_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setTestMessages((data as TestMessage[]) || []);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchTestMessages();
    fetchEvolutionBots();
  }, []);

  // Criar instância via Edge Function
  const createInstance = async () => {
    if (!instanceName.trim()) {
      toast.error('Digite um nome para a instância');
      return;
    }

    setLoadingAction('create');
    try {
      const uniqueName = `master_${instanceName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;

      const { data, error } = await supabase.functions.invoke('master-whatsapp-instance', {
        body: { action: 'create', instanceName: uniqueName }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setInstanceStatus('connecting');
      setInstanceName(uniqueName);
      
      if (data?.qrcode) {
        setQrCode(data.qrcode);
      }

      toast.success('Instância criada! Escaneie o QR Code');
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar instância');
    } finally {
      setLoadingAction(null);
    }
  };

  // Verificar status via Edge Function
  const checkStatus = async () => {
    if (!config?.instance_name) return;

    setLoadingAction('status');
    try {
      const { data, error } = await supabase.functions.invoke('master-whatsapp-instance', {
        body: { action: 'status' }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const newStatus = data?.status || 'disconnected';
      setInstanceStatus(newStatus);

      if (newStatus === 'connected') {
        toast.success('WhatsApp conectado!');
        setQrCode(null);
      } else if (data?.qrcode) {
        setQrCode(data.qrcode);
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao verificar status');
    } finally {
      setLoadingAction(null);
    }
  };

  // Desconectar via Edge Function
  const disconnect = async () => {
    if (!config?.instance_name) return;

    setLoadingAction('disconnect');
    try {
      const { data, error } = await supabase.functions.invoke('master-whatsapp-instance', {
        body: { action: 'disconnect' }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setInstanceStatus('disconnected');
      setQrCode(null);
      
      toast.success('Desconectado');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao desconectar');
    } finally {
      setLoadingAction(null);
    }
  };

  // Enviar mensagem de teste
  const sendTestMessage = async () => {
    if (!testPhone.trim()) {
      toast.error('Digite o número de telefone');
      return;
    }

    // Remove formatação e combina com DDI
    const cleanPhone = testPhone.replace(/\D/g, '');
    const fullNumber = countryCode.replace('+', '') + cleanPhone;

    setLoadingAction('sendTest');
    try {
      const { data, error } = await supabase.functions.invoke('master-whatsapp-instance', {
        body: { 
          action: 'sendTest', 
          phoneNumber: fullNumber,
          message: testMessage.trim() || undefined
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast.success('✅ Mensagem enviada com sucesso!');
      setTestPhone("");
      setTestMessage("");
      
      // Atualizar histórico
      await fetchTestMessages();
    } catch (error) {
      console.error('Erro:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar mensagem');
      // Mesmo em erro, atualizar histórico (pode ter salvo como failed)
      await fetchTestMessages();
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

            {/* Card de Teste de Envio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Testar Envio
                </CardTitle>
                <CardDescription>
                  Envie uma mensagem de teste
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Número do WhatsApp</Label>
                  <div className="flex gap-2">
                    <CountryCodeSelect
                      value={countryCode}
                      onChange={setCountryCode}
                      disabled={instanceStatus !== 'connected'}
                    />
                    <Input
                      className="flex-1"
                      placeholder={countryCode === '+55' ? "(00) 00000-0000" : "Número"}
                      value={testPhone}
                      onChange={(e) => {
                        const formatted = countryCode === '+55'
                          ? formatBrazilianPhone(e.target.value)
                          : formatInternationalPhone(e.target.value);
                        setTestPhone(formatted);
                      }}
                      maxLength={countryCode === '+55' ? 16 : 20}
                      disabled={instanceStatus !== 'connected'}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {countryCode === '+55' ? 'Com DDD' : 'Número sem o código do país'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Mensagem (opcional)</Label>
                  <Textarea
                    placeholder="✅ Mensagem de teste do WhatsApp Master"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    disabled={instanceStatus !== 'connected'}
                    rows={3}
                  />
                </div>
                
                <Button 
                  onClick={sendTestMessage}
                  disabled={!testPhone || instanceStatus !== 'connected' || loadingAction === 'sendTest'}
                  className="w-full"
                >
                  {loadingAction === 'sendTest' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Enviar Teste
                </Button>
              </CardContent>
            </Card>

            {/* Card de Notificações */}
            <MasterNotificationsCard 
              config={config}
              updateConfig={updateConfig}
              instanceStatus={instanceStatus}
            />
          </div>

          {/* Histórico de Mensagens de Teste */}
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Histórico de Testes
                  </CardTitle>
                  <CardDescription>
                    Últimas mensagens de teste enviadas
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchTestMessages}
                  disabled={loadingMessages}
                >
                  <RefreshCw className={`w-4 h-4 ${loadingMessages ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {testMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma mensagem de teste enviada ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {testMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`p-4 rounded-lg border ${
                        msg.status === 'failed' 
                          ? 'bg-destructive/10 border-destructive/20' 
                          : 'bg-green-500/10 border-green-500/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          {msg.status === 'failed' ? (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" /> Falhou
                            </Badge>
                          ) : (
                            <Badge className="bg-green-500 gap-1">
                              <CheckCircle className="h-3 w-3" /> Enviada
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(msg.sent_at), "dd/MM/yyyy 'às' HH:mm")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3" />
                          <span className="font-mono text-xs">{msg.country_code} {msg.phone_number}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {msg.status === 'failed' && msg.error_message 
                          ? <span className="text-destructive">❌ Erro: {msg.error_message}</span>
                          : <span>✅ {msg.message}</span>
                        }
                      </p>
                      
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(msg.sent_at), "dd/MM/yyyy, HH:mm:ss")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>


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
          {/* Card de Bots Criados na Evolution */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Bots na Evolution API
                    <InfoTooltip text="Lista dos bots realmente criados na Evolution API. Estes são os bots que estão ativos respondendo mensagens." />
                  </CardTitle>
                  <CardDescription>
                    Bots ativos na instância {config?.instance_name || 'não configurada'}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchEvolutionBots}
                  disabled={loadingBots}
                >
                  <RefreshCw className={`w-4 h-4 ${loadingBots ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingBots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : evolutionBots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum bot criado ainda</p>
                  <p className="text-xs mt-1">Configure os bots abaixo e clique em "Sincronizar Bot"</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            Tipo
                            <InfoTooltip text="Identificação do bot baseado no ID salvo na configuração" />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            Status
                            <InfoTooltip text="Se o bot está ativo e respondendo mensagens" />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            Trigger
                            <InfoTooltip text="Como o bot é ativado: por keywords específicas ou todas as mensagens" />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            Keywords
                            <InfoTooltip text="Palavras-chave que ativam este bot quando presentes na mensagem" />
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            Expiração
                            <InfoTooltip text="Tempo em minutos que a sessão fica ativa sem atividade" />
                          </div>
                        </TableHead>
                        <TableHead>ID Evolution</TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            Ações
                            <InfoTooltip text="Sincronizar configurações do bot com a Evolution API" />
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evolutionBots.map((bot, idx) => (
                        <TableRow key={bot.id || idx}>
                          <TableCell>
                            {bot.botType ? (
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "gap-1",
                                  bot.botType === 'sales' && "border-green-500/50 text-green-600 dark:text-green-400",
                                  bot.botType === 'recruitment' && "border-blue-500/50 text-blue-600 dark:text-blue-400",
                                  bot.botType === 'support' && "border-purple-500/50 text-purple-600 dark:text-purple-400"
                                )}
                              >
                                {bot.botTypeName}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">Não vinculado</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={bot.enabled ? 'default' : 'secondary'} className="gap-1">
                              {bot.enabled ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              {bot.enabled ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {bot.triggerType === 'all' ? 'Todas mensagens' : 'Keywords'}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            {bot.triggerValue ? (
                              <div className="flex flex-wrap gap-1">
                                {bot.triggerValue.split(',').slice(0, 3).map((kw, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {kw.trim()}
                                  </Badge>
                                ))}
                                {bot.triggerValue.split(',').length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{bot.triggerValue.split(',').length - 3}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {bot.expire > 0 ? `${bot.expire} min` : 'Sem limite'}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {bot.id?.slice(0, 8)}...
                          </TableCell>
                          <TableCell>
                            {bot.botType ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleSyncIndividualBot(bot)}
                                      disabled={syncingBotId === bot.id || syncing}
                                    >
                                      {syncingBotId === bot.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <RefreshCw className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Sincronizar bot de {bot.botTypeName?.replace(/^[^\s]+\s/, '')}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

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
