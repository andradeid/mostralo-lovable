import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Zap, 
  MessageCircle, 
  Package, 
  ChefHat, 
  PackageCheck, 
  Truck, 
  CheckCircle, 
  XCircle,
  Save,
  Loader2,
  Info,
  ArrowLeft,
  Send,
  TestTube,
  Phone
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useStoreAccess } from "@/hooks/useStoreAccess";

interface AutoMessageConfig {
  id?: string;
  store_id: string;
  is_enabled: boolean;
  greeting_enabled: boolean;
  greeting_message: string;
  order_received_enabled: boolean;
  order_received_message: string;
  order_confirmed_enabled: boolean;
  order_confirmed_message: string;
  order_ready_enabled: boolean;
  order_ready_message: string;
  order_in_transit_enabled: boolean;
  order_in_transit_message: string;
  order_completed_enabled: boolean;
  order_completed_message: string;
  order_cancelled_enabled: boolean;
  order_cancelled_message: string;
  test_phone_number?: string;
}

const defaultMessages = {
  greeting_message: `Olá! 👋 Seja bem-vindo(a) à {loja}!

Confira nosso cardápio: {link_loja}
Faça seu pedido agora! 🍕`,
  order_received_message: `✅ Recebemos seu pedido #{numero_pedido}!
Valor: R$ {valor_total}
Aguarde a confirmação da {loja}. 🕐`,
  order_confirmed_message: `🎉 Pedido #{numero_pedido} CONFIRMADO!
Já estamos preparando com carinho! 👨‍🍳
Acompanhe: {link_pedido}`,
  order_ready_message: `🏪 Seu pedido #{numero_pedido} está PRONTO!
Pode vir retirar na {loja}! 🤗`,
  order_in_transit_message: `🚀 Seu pedido #{numero_pedido} está a CAMINHO!
📍 Endereço: {endereco_entrega}`,
  order_completed_message: `🎊 Pedido #{numero_pedido} ENTREGUE!
Obrigado por escolher a {loja}! 💚
Volte sempre!`,
  order_cancelled_message: `😔 Pedido #{numero_pedido} foi cancelado.
Lamentamos o ocorrido.
Entre em contato: {whatsapp_loja}`
};

const variablesList = [
  { key: '{nome}', description: 'Nome do cliente' },
  { key: '{primeiro_nome}', description: 'Primeiro nome do cliente' },
  { key: '{loja}', description: 'Nome da loja' },
  { key: '{link_loja}', description: 'Link do cardápio' },
  { key: '{numero_pedido}', description: 'Número do pedido (ex: 0001)' },
  { key: '{valor_total}', description: 'Valor total formatado' },
  { key: '{itens_pedido}', description: 'Lista de itens do pedido' },
  { key: '{endereco_entrega}', description: 'Endereço de entrega' },
  { key: '{tipo_entrega}', description: 'Delivery ou Retirada' },
  { key: '{link_pedido}', description: 'Link de acompanhamento' },
  { key: '{whatsapp_loja}', description: 'WhatsApp da loja' },
];

export default function WhatsAppAutomationsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { storeId } = useStoreAccess();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState<string | null>(null);
  const [config, setConfig] = useState<AutoMessageConfig | null>(null);
  const [hasInstance, setHasInstance] = useState(false);

  useEffect(() => {
    if (storeId) {
      fetchConfig();
      checkWhatsAppInstance();
    }
  }, [storeId]);

  const checkWhatsAppInstance = async () => {
    const { data } = await supabase
      .from('whatsapp_instances')
      .select('id, status')
      .eq('store_id', storeId)
      .eq('status', 'connected')
      .maybeSingle();
    
    setHasInstance(!!data);
  };

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_auto_messages')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setConfig(data as any);
      } else {
        setConfig({
          store_id: storeId!,
          is_enabled: false,
          greeting_enabled: false,
          greeting_message: defaultMessages.greeting_message,
          order_received_enabled: false,
          order_received_message: defaultMessages.order_received_message,
          order_confirmed_enabled: false,
          order_confirmed_message: defaultMessages.order_confirmed_message,
          order_ready_enabled: false,
          order_ready_message: defaultMessages.order_ready_message,
          order_in_transit_enabled: false,
          order_in_transit_message: defaultMessages.order_in_transit_message,
          order_completed_enabled: false,
          order_completed_message: defaultMessages.order_completed_message,
          order_cancelled_enabled: false,
          order_cancelled_message: defaultMessages.order_cancelled_message
        });
      }
    } catch (error: any) {
      console.error('Erro ao buscar configuração:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config || !storeId) return;

    setSaving(true);
    try {
      if (config.id) {
        const { error } = await supabase
          .from('whatsapp_auto_messages')
          .update({
            is_enabled: config.is_enabled,
            greeting_enabled: config.greeting_enabled,
            greeting_message: config.greeting_message,
            order_received_enabled: config.order_received_enabled,
            order_received_message: config.order_received_message,
            order_confirmed_enabled: config.order_confirmed_enabled,
            order_confirmed_message: config.order_confirmed_message,
            order_ready_enabled: config.order_ready_enabled,
            order_ready_message: config.order_ready_message,
            order_in_transit_enabled: config.order_in_transit_enabled,
            order_in_transit_message: config.order_in_transit_message,
            order_completed_enabled: config.order_completed_enabled,
            order_completed_message: config.order_completed_message,
            order_cancelled_enabled: config.order_cancelled_enabled,
            order_cancelled_message: config.order_cancelled_message,
            test_phone_number: config.test_phone_number
          })
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('whatsapp_auto_messages')
          .insert(config as any)
          .select()
          .single();

        if (error) throw error;
        setConfig(data as any);
      }

      toast({
        title: "Salvo!",
        description: "Configurações de mensagens automáticas atualizadas"
      });
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar as configurações",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMessage = async (messageType: string) => {
    if (!config || !storeId) return;

    setSavingField(messageType);
    try {
      const enabledField = `${messageType}_enabled` as keyof AutoMessageConfig;
      const messageField = `${messageType}_message` as keyof AutoMessageConfig;

      const updateData: Record<string, any> = {
        [enabledField]: config[enabledField],
        [messageField]: config[messageField]
      };

      if (config.id) {
        const { error } = await supabase
          .from('whatsapp_auto_messages')
          .update(updateData)
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('whatsapp_auto_messages')
          .insert({ ...config, ...updateData } as any)
          .select()
          .single();

        if (error) throw error;
        setConfig(data as any);
      }

      toast({
        title: "✅ Mensagem salva!",
        description: `Configuração de "${messageType}" atualizada`
      });
    } catch (error: any) {
      console.error('Erro ao salvar mensagem:', error);
      toast({
        title: "❌ Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSavingField(null);
    }
  };

  const handleSendTest = async (eventType: string) => {
    if (!config?.test_phone_number) {
      toast({
        title: "⚠️ Configure o número de teste primeiro",
        description: "Insira um número no campo 'Modo de Teste' acima",
        variant: "destructive"
      });
      return;
    }

    setSendingTest(eventType);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-auto-send', {
        body: {
          storeId,
          eventType,
          phoneNumber: config.test_phone_number,
          customerName: 'Cliente Teste',
          isTest: true,
          baseUrl: window.location.origin
        }
      });

      if (error) throw error;

      if (data?.skipped) {
        toast({
          title: "⚠️ Mensagem pulada",
          description: "Esta mensagem está desativada. Ative-a primeiro.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "✅ Teste enviado!",
          description: `Mensagem enviada para ${config.test_phone_number}`
        });
      }
    } catch (error: any) {
      console.error('Erro ao enviar teste:', error);
      toast({
        title: "❌ Erro ao enviar teste",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSendingTest(null);
    }
  };

  const updateConfig = (field: keyof AutoMessageConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, [field]: value });
  };

  const insertVariable = (field: keyof AutoMessageConfig, variable: string) => {
    if (!config) return;
    const currentValue = config[field] as string || '';
    updateConfig(field, currentValue + variable);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/whatsapp')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Mensagens Automáticas
          </h1>
          <p className="text-muted-foreground">
            Configure mensagens enviadas automaticamente via WhatsApp
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Tudo
        </Button>
      </div>

      {/* Alerta se WhatsApp não conectado */}
      {!hasInstance && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>WhatsApp não conectado!</strong> Configure sua conexão WhatsApp primeiro para usar mensagens automáticas.
            <Button 
              variant="link" 
              className="px-2 h-auto"
              onClick={() => navigate('/dashboard/whatsapp')}
            >
              Conectar agora →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Card Principal - Ativar Sistema */}
      <Card className={config?.is_enabled ? 'border-green-500/50 bg-green-500/5' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config?.is_enabled ? 'bg-green-500/20' : 'bg-muted'}`}>
                <Zap className={`h-5 w-5 ${config?.is_enabled ? 'text-green-500' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <CardTitle>Sistema de Mensagens Automáticas</CardTitle>
                <CardDescription>
                  Quando ativado, mensagens serão enviadas automaticamente nos eventos configurados
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={config?.is_enabled ? 'default' : 'secondary'} className={config?.is_enabled ? 'bg-green-500' : ''}>
                {config?.is_enabled ? 'ATIVO' : 'INATIVO'}
              </Badge>
              <Switch
                checked={config?.is_enabled}
                onCheckedChange={(checked) => updateConfig('is_enabled', checked)}
                disabled={!hasInstance}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Card de Modo de Teste */}
      <Card className="border-dashed border-2 border-yellow-500/50 bg-yellow-500/5">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <TestTube className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">🧪 Modo de Teste</CardTitle>
              <CardDescription>
                Configure um número para testar as mensagens antes de ativá-las
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="(11) 99999-9999"
                value={config?.test_phone_number || ''}
                onChange={(e) => updateConfig('test_phone_number', e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            ⚠️ As mensagens de teste serão enviadas para este número, independente do sistema estar ativo
          </p>
        </CardContent>
      </Card>

      {/* Variáveis Disponíveis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Variáveis Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {variablesList.map((v) => (
              <Badge 
                key={v.key} 
                variant="outline" 
                className="cursor-help"
                title={v.description}
              >
                {v.key}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Seção: Saudação */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-500" />
          Saudação (Novo Contato)
        </h2>

        <MessageConfigCard
          title="Mensagem de Boas-vindas"
          description="Enviada quando alguém envia mensagem pela primeira vez"
          icon={<MessageCircle className="h-5 w-5" />}
          enabled={config?.greeting_enabled || false}
          onEnabledChange={(checked) => updateConfig('greeting_enabled', checked)}
          message={config?.greeting_message || ''}
          onMessageChange={(value) => updateConfig('greeting_message', value)}
          onInsertVariable={(variable) => insertVariable('greeting_message', variable)}
          disabled={!config?.is_enabled}
          messageType="greeting"
          testPhoneNumber={config?.test_phone_number}
          onSaveMessage={handleSaveMessage}
          onSendTest={handleSendTest}
          savingField={savingField}
          sendingTest={sendingTest}
        />
      </div>

      <Separator />

      {/* Seção: Status do Pedido */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5 text-orange-500" />
          Status do Pedido
        </h2>

        <div className="grid gap-4">
          <MessageConfigCard
            title="Pedido Recebido"
            description="Enviado quando o cliente faz um novo pedido"
            icon={<Package className="h-5 w-5" />}
            enabled={config?.order_received_enabled || false}
            onEnabledChange={(checked) => updateConfig('order_received_enabled', checked)}
            message={config?.order_received_message || ''}
            onMessageChange={(value) => updateConfig('order_received_message', value)}
            onInsertVariable={(variable) => insertVariable('order_received_message', variable)}
            disabled={!config?.is_enabled}
            messageType="order_received"
            testPhoneNumber={config?.test_phone_number}
            onSaveMessage={handleSaveMessage}
            onSendTest={handleSendTest}
            savingField={savingField}
            sendingTest={sendingTest}
          />

          <MessageConfigCard
            title="Pedido Confirmado"
            description="Enviado quando a loja aceita o pedido"
            icon={<ChefHat className="h-5 w-5" />}
            enabled={config?.order_confirmed_enabled || false}
            onEnabledChange={(checked) => updateConfig('order_confirmed_enabled', checked)}
            message={config?.order_confirmed_message || ''}
            onMessageChange={(value) => updateConfig('order_confirmed_message', value)}
            onInsertVariable={(variable) => insertVariable('order_confirmed_message', variable)}
            disabled={!config?.is_enabled}
            messageType="order_confirmed"
            testPhoneNumber={config?.test_phone_number}
            onSaveMessage={handleSaveMessage}
            onSendTest={handleSendTest}
            savingField={savingField}
            sendingTest={sendingTest}
          />

          <MessageConfigCard
            title="Pronto para Retirada"
            description="Enviado para pedidos com retirada no balcão"
            icon={<PackageCheck className="h-5 w-5" />}
            enabled={config?.order_ready_enabled || false}
            onEnabledChange={(checked) => updateConfig('order_ready_enabled', checked)}
            message={config?.order_ready_message || ''}
            onMessageChange={(value) => updateConfig('order_ready_message', value)}
            onInsertVariable={(variable) => insertVariable('order_ready_message', variable)}
            disabled={!config?.is_enabled}
            messageType="order_ready"
            testPhoneNumber={config?.test_phone_number}
            onSaveMessage={handleSaveMessage}
            onSendTest={handleSendTest}
            savingField={savingField}
            sendingTest={sendingTest}
          />

          <MessageConfigCard
            title="Saiu para Entrega"
            description="Enviado para pedidos com delivery"
            icon={<Truck className="h-5 w-5" />}
            enabled={config?.order_in_transit_enabled || false}
            onEnabledChange={(checked) => updateConfig('order_in_transit_enabled', checked)}
            message={config?.order_in_transit_message || ''}
            onMessageChange={(value) => updateConfig('order_in_transit_message', value)}
            onInsertVariable={(variable) => insertVariable('order_in_transit_message', variable)}
            disabled={!config?.is_enabled}
            messageType="order_in_transit"
            testPhoneNumber={config?.test_phone_number}
            onSaveMessage={handleSaveMessage}
            onSendTest={handleSendTest}
            savingField={savingField}
            sendingTest={sendingTest}
          />

          <MessageConfigCard
            title="Pedido Concluído"
            description="Enviado quando o pedido é finalizado"
            icon={<CheckCircle className="h-5 w-5" />}
            enabled={config?.order_completed_enabled || false}
            onEnabledChange={(checked) => updateConfig('order_completed_enabled', checked)}
            message={config?.order_completed_message || ''}
            onMessageChange={(value) => updateConfig('order_completed_message', value)}
            onInsertVariable={(variable) => insertVariable('order_completed_message', variable)}
            disabled={!config?.is_enabled}
            messageType="order_completed"
            testPhoneNumber={config?.test_phone_number}
            onSaveMessage={handleSaveMessage}
            onSendTest={handleSendTest}
            savingField={savingField}
            sendingTest={sendingTest}
          />

          <MessageConfigCard
            title="Pedido Cancelado"
            description="Enviado quando o pedido é cancelado"
            icon={<XCircle className="h-5 w-5" />}
            enabled={config?.order_cancelled_enabled || false}
            onEnabledChange={(checked) => updateConfig('order_cancelled_enabled', checked)}
            message={config?.order_cancelled_message || ''}
            onMessageChange={(value) => updateConfig('order_cancelled_message', value)}
            onInsertVariable={(variable) => insertVariable('order_cancelled_message', variable)}
            disabled={!config?.is_enabled}
            messageType="order_cancelled"
            testPhoneNumber={config?.test_phone_number}
            onSaveMessage={handleSaveMessage}
            onSendTest={handleSendTest}
            savingField={savingField}
            sendingTest={sendingTest}
          />
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para cada configuração de mensagem
function MessageConfigCard({
  title,
  description,
  icon,
  enabled,
  onEnabledChange,
  message,
  onMessageChange,
  onInsertVariable,
  disabled,
  messageType,
  testPhoneNumber,
  onSaveMessage,
  onSendTest,
  savingField,
  sendingTest
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  onEnabledChange: (checked: boolean) => void;
  message: string;
  onMessageChange: (value: string) => void;
  onInsertVariable: (variable: string) => void;
  disabled: boolean;
  messageType: string;
  testPhoneNumber?: string;
  onSaveMessage: (messageType: string) => void;
  onSendTest: (eventType: string) => void;
  savingField: string | null;
  sendingTest: string | null;
}) {
  const [expanded, setExpanded] = useState(enabled);

  useEffect(() => {
    if (enabled) setExpanded(true);
  }, [enabled]);

  return (
    <Card className={`transition-all ${enabled ? 'border-primary/30' : 'opacity-75'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer flex-1"
            onClick={() => setExpanded(!expanded)}
          >
            <div className={`p-2 rounded-lg ${enabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {icon}
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-sm">{description}</CardDescription>
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={onEnabledChange}
            disabled={disabled}
          />
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {variablesList.slice(0, 7).map((v) => (
                <Button
                  key={v.key}
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => onInsertVariable(v.key)}
                  disabled={disabled || !enabled}
                >
                  {v.key}
                </Button>
              ))}
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Mensagem:</Label>
              <Textarea
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                placeholder="Digite a mensagem..."
                className="mt-1 min-h-[100px] font-mono text-sm"
                disabled={disabled || !enabled}
              />
            </div>
            
            {/* Footer com botões */}
            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSendTest(messageType)}
                disabled={!testPhoneNumber || !message || sendingTest === messageType}
              >
                {sendingTest === messageType ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Enviar Teste
              </Button>
              
              <Button
                size="sm"
                onClick={() => onSaveMessage(messageType)}
                disabled={savingField === messageType}
              >
                {savingField === messageType ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
