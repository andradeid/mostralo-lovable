import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useMasterWhatsAppConfig } from "@/hooks/useMasterWhatsAppConfig";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { CountryCodeSelect } from "@/components/ui/country-code-select";
import { formatBrazilianPhone, formatInternationalPhone, cn } from "@/lib/utils";
import { format } from "date-fns";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
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
  Clock,
  Key,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Hash,
  Calendar,
  ShoppingCart,
  Headphones,
  Activity
} from "lucide-react";
import { ptBR } from "date-fns/locale";
import { MasterBotConfigTab } from "@/components/admin/master-whatsapp/MasterBotConfigTab";
import { MasterSessionsTab } from "@/components/admin/master-whatsapp/MasterSessionsTab";
import { MasterNotificationsCard } from "@/components/admin/master-whatsapp/MasterNotificationsCard";
import { OpenAIConfigCard } from "@/components/shared/OpenAIConfigCard";

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

// OpenAIKeySection removida - agora usa OpenAIConfigCard como card separado

export default function MasterWhatsAppPage() {
  const { 
    config, 
    loading, 
    updateConfig, 
    syncBots, 
    syncing,
    syncError,
    clearSyncError,
    toggleBot,
    updateApproach,
    updateKeywords,
    updateSupportPrompt,
    updateBotBehavior,
    updatePrimaryBotType,
    updateOpenAIModel,
    hasUnsyncedChanges,
    lastSyncedAt
  } = useMasterWhatsAppConfig();
  const isMobile = useIsMobile();
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
  const [stats, setStats] = useState({ totalSessions: 0, totalMessages: 0, pausedSessions: 0 });
  const [deletingBotId, setDeletingBotId] = useState<string | null>(null);
  const [botToDelete, setBotToDelete] = useState<EvolutionBot | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (config?.instance_name) {
      setInstanceName(config.instance_name);
      setInstanceStatus(config.instance_status || "disconnected");
    }
  }, [config]);

  // Buscar estatísticas das sessões
  useEffect(() => {
    const fetchStats = async () => {
      const { data } = await supabase
        .from('master_whatsapp_sessions')
        .select('id, messages_count, bot_paused');
      
      if (data) {
        setStats({
          totalSessions: data.length,
          totalMessages: data.reduce((acc, s) => acc + (s.messages_count || 0), 0),
          pausedSessions: data.filter(s => s.bot_paused).length
        });
      }
    };
    fetchStats();
  }, []);

  const copyToClipboard = (text: string | null | undefined) => {
    if (text) {
      navigator.clipboard.writeText(text);
      toast.success('Copiado!');
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Não disponível';
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

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

  // Deletar bot
  const handleDeleteBot = async () => {
    if (!botToDelete?.botType || !config?.id) {
      toast.error('Não foi possível identificar o bot para deletar');
      return;
    }

    setDeletingBotId(botToDelete.id);
    try {
      const { data, error } = await supabase.functions.invoke('master-bot-delete', {
        body: {
          configId: config.id,
          botType: botToDelete.botType,
          evolutionBotId: botToDelete.id
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Bot de ${botToDelete.botTypeName?.replace(/^[^\s]+\s/, '')} deletado!`);
        setShowDeleteDialog(false);
        setBotToDelete(null);
        await fetchEvolutionBots();
      } else {
        throw new Error(data?.error || 'Erro ao deletar bot');
      }
    } catch (error) {
      console.error('Erro ao deletar bot:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao deletar bot');
    } finally {
      setDeletingBotId(null);
    }
  };

  const openDeleteDialog = (bot: EvolutionBot) => {
    if (!bot.botType) {
      toast.error('Não é possível deletar um bot não vinculado');
      return;
    }
    setBotToDelete(bot);
    setShowDeleteDialog(true);
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">WhatsApp Master</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie bots de vendas, recrutamento e suporte
          </p>
        </div>
        {getStatusBadge()}
      </div>

      <Tabs defaultValue="connection" className="space-y-4">
        <TabsList className="w-full flex overflow-x-auto gap-1 p-1">
          <TabsTrigger value="connection" className="flex-shrink-0 gap-1.5 text-xs sm:text-sm">
            <Smartphone className="w-4 h-4" />
            <span className="hidden xs:inline">Conexão</span>
          </TabsTrigger>
          <TabsTrigger value="bots" className="flex-shrink-0 gap-1.5 text-xs sm:text-sm">
            <Bot className="w-4 h-4" />
            <span className="hidden xs:inline">Configurar</span> Bots
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex-shrink-0 gap-1.5 text-xs sm:text-sm">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden xs:inline">Sessões</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Conexão */}
        <TabsContent value="connection">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Criar/Gerenciar Instância - Card Redesenhado */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-primary" />
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
                  <div className="space-y-4">
                    {/* Status em Destaque */}
                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border-2 transition-colors",
                      instanceStatus === 'connected' || instanceStatus === 'open'
                        ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                        : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                    )}>
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        instanceStatus === 'connected' || instanceStatus === 'open' 
                          ? "bg-green-500 animate-pulse" 
                          : "bg-red-500"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "font-semibold text-sm",
                          instanceStatus === 'connected' || instanceStatus === 'open'
                            ? "text-green-700 dark:text-green-300"
                            : "text-red-700 dark:text-red-300"
                        )}>
                          {instanceStatus === 'connected' || instanceStatus === 'open' ? 'CONECTADO' : 'DESCONECTADO'}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {config?.instance_name}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 shrink-0"
                        onClick={() => copyToClipboard(config?.instance_name)}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Informações da Instância */}
                    <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <Activity className="w-3.5 h-3.5" />
                        Informações da Instância
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Hash className="w-3 h-3" />
                            <span className="text-xs">Evolution ID</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <p className="font-mono text-xs truncate">
                              {config?.evolution_instance_id?.slice(0, 8) || 'N/A'}...
                            </p>
                            {config?.evolution_instance_id && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-5 w-5 p-0"
                                onClick={() => copyToClipboard(config?.evolution_instance_id)}
                              >
                                <Copy className="w-2.5 h-2.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <span className="text-xs">Telefone</span>
                          </div>
                          <p className="text-xs font-medium">
                            {config?.instance_phone || 'Não detectado'}
                          </p>
                        </div>
                        <div className="col-span-2 space-y-1">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span className="text-xs">Última atualização</span>
                          </div>
                          <p className="text-xs font-medium">
                            {formatDate(config?.updated_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status dos Bots */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <Bot className="w-3.5 h-3.5" />
                        Status dos Bots
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge 
                          variant={config?.sales_bot_enabled ? "default" : "outline"}
                          className={cn(
                            "text-xs",
                            config?.sales_bot_enabled && "bg-blue-500 hover:bg-blue-600"
                          )}
                        >
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          Vendas
                        </Badge>
                        <Badge 
                          variant={config?.recruitment_bot_enabled ? "default" : "outline"}
                          className={cn(
                            "text-xs",
                            config?.recruitment_bot_enabled && "bg-purple-500 hover:bg-purple-600"
                          )}
                        >
                          <Users className="w-3 h-3 mr-1" />
                          Recrutamento
                        </Badge>
                        <Badge 
                          variant={config?.support_bot_enabled ? "default" : "outline"}
                          className={cn(
                            "text-xs",
                            config?.support_bot_enabled && "bg-orange-500 hover:bg-orange-600"
                          )}
                        >
                          <Headphones className="w-3 h-3 mr-1" />
                          Suporte
                        </Badge>
                      </div>
                    </div>

                    {/* Estatísticas Rápidas */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 bg-muted rounded-lg text-center">
                        <p className="text-lg font-bold text-primary">{stats.totalSessions}</p>
                        <p className="text-[10px] text-muted-foreground">Sessões</p>
                      </div>
                      <div className="p-2 bg-muted rounded-lg text-center">
                        <p className="text-lg font-bold text-primary">{stats.totalMessages}</p>
                        <p className="text-[10px] text-muted-foreground">Mensagens</p>
                      </div>
                      <div className="p-2 bg-muted rounded-lg text-center">
                        <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{stats.pausedSessions}</p>
                        <p className="text-[10px] text-muted-foreground">Pausados</p>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={checkStatus}
                        disabled={loadingAction === 'status'}
                        className="flex-1"
                        size="sm"
                      >
                        {loadingAction === 'status' ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Atualizar Status
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={disconnect}
                        disabled={loadingAction === 'disconnect'}
                        size="sm"
                      >
                        {loadingAction === 'disconnect' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <PowerOff className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
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

            {/* Card OpenAI Configuração */}
            <OpenAIConfigCard context="master" configId={config?.id} />

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
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Bots na Evolution API
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Bots ativos na instância {config?.instance_name?.slice(0, 20) || 'não configurada'}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchEvolutionBots}
                  disabled={loadingBots}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className={cn("w-4 h-4 mr-2", loadingBots && "animate-spin")} />
                  Atualizar
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
              ) : isMobile ? (
                /* Mobile: Cards empilhados */
                <div className="space-y-3">
                  {evolutionBots.map((bot, idx) => (
                    <Card key={bot.id || idx} className="p-4 bg-muted/30">
                      <div className="flex items-start justify-between mb-3">
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
                        <Badge variant={bot.enabled ? 'default' : 'secondary'} className="gap-1">
                          {bot.enabled ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {bot.enabled ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground text-xs">Trigger:</span>
                          <p className="font-medium text-xs">
                            {bot.triggerType === 'all' ? 'Todas mensagens' : 'Keywords'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">Expiração:</span>
                          <p className="font-medium text-xs">
                            {bot.expire > 0 ? `${bot.expire} min` : 'Sem limite'}
                          </p>
                        </div>
                      </div>

                      {bot.triggerValue && (
                        <div className="mb-3">
                          <span className="text-muted-foreground text-xs">Keywords:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {bot.triggerValue.split(',').slice(0, 4).map((kw, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {kw.trim()}
                              </Badge>
                            ))}
                            {bot.triggerValue.split(',').length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{bot.triggerValue.split(',').length - 4}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground mb-3 font-mono">
                        ID: {bot.id?.slice(0, 12)}...
                      </div>

                      {bot.botType && (
                        <div className="flex gap-2 pt-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSyncIndividualBot(bot)}
                            disabled={syncingBotId === bot.id || syncing || deletingBotId === bot.id}
                            className="flex-1"
                          >
                            {syncingBotId === bot.id ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4 mr-1" />
                            )}
                            Sincronizar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(bot)}
                            disabled={syncingBotId === bot.id || syncing || deletingBotId === bot.id}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            {deletingBotId === bot.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                /* Desktop: Tabela */
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
                            <div className="flex items-center gap-1">
                              {bot.botType ? (
                                <>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleSyncIndividualBot(bot)}
                                          disabled={syncingBotId === bot.id || syncing || deletingBotId === bot.id}
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
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => openDeleteDialog(bot)}
                                          disabled={syncingBotId === bot.id || syncing || deletingBotId === bot.id}
                                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                          {deletingBotId === bot.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <Trash2 className="w-4 h-4" />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Deletar bot de {bot.botTypeName?.replace(/^[^\s]+\s/, '')}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <MasterBotConfigTab 
            config={config!}
            syncing={syncing}
            syncError={syncError}
            clearSyncError={clearSyncError}
            toggleBot={toggleBot}
            updateApproach={updateApproach}
            updateKeywords={updateKeywords}
            updateSupportPrompt={updateSupportPrompt}
            updateBotBehavior={updateBotBehavior}
            syncBots={syncBots}
            updatePrimaryBotType={updatePrimaryBotType}
            updateOpenAIModel={updateOpenAIModel}
            hasUnsyncedChanges={hasUnsyncedChanges}
            lastSyncedAt={lastSyncedAt}
          />
        </TabsContent>

        {/* Tab Sessões */}
        <TabsContent value="sessions">
          <MasterSessionsTab />
        </TabsContent>
      </Tabs>

      {/* Modal de Confirmação de Delete */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Deletar Bot
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar o bot de <strong>{botToDelete?.botTypeName?.replace(/^[^\s]+\s/, '')}</strong>?
              <br /><br />
              Esta ação irá:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Remover o bot da Evolution API</li>
                <li>O bot deixará de responder mensagens</li>
                <li>Você poderá recriá-lo depois sincronizando novamente</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setBotToDelete(null);
              }}
              disabled={!!deletingBotId}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteBot}
              disabled={!!deletingBotId}
            >
              {deletingBotId ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Confirmar Exclusão
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
