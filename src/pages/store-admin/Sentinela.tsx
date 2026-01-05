import { useState, useMemo } from "react";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { useSentinela } from "@/hooks/useSentinela";
import { useStoreModules } from "@/hooks/useStoreModules";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Bell, BellOff, Calendar, CheckCircle2, Clock, Eye, FileText, HelpCircle, Loader2, MessageSquare, Package, Phone, Play, Plus, RefreshCw, Send, Settings, Target, Trash2, TrendingUp, XCircle, Zap } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { SentinelaGuide } from "@/components/admin/sentinela/SentinelaGuide";
import { SentinelaTemplates } from "@/components/admin/sentinela/SentinelaTemplates";
import { CountryCodeSelect } from "@/components/ui/country-code-select";
import { WhatsAppPhonePreview } from "@/components/admin/whatsapp/WhatsAppPhonePreview";
import { formatBrazilianPhone, normalizePhone } from "@/lib/utils";

const DEFAULT_TEMPLATE = `Olá {primeiro_nome}! 👋

Lembrete amigável da {loja}! 

Seu *{produto}* deve estar acabando, né? 🏃‍♂️

🛒 Aproveite para repor agora:
{link_loja}

Qualquer dúvida, é só chamar! 💬`;

const RECURRENCE_SHORTCUTS = [7, 15, 30, 45, 60, 90];

export default function Sentinela() {
  const { storeId } = useStoreAccess();
  const { hasModule, loading: modulesLoading } = useStoreModules(storeId || null);
  const { 
    storeConfig, 
    rules, 
    reminders, 
    stats, 
    templates,
    isLoading,
    updateConfig,
    createRule,
    updateRule,
    deleteRule,
    cancelReminder
  } = useSentinela(storeId || null);

  const [isNewRuleOpen, setIsNewRuleOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [template, setTemplate] = useState(storeConfig?.sentinela_default_template || DEFAULT_TEMPLATE);
  const [showGuide, setShowGuide] = useState(false);
  
  // Estados para teste de WhatsApp
  const [testPhone, setTestPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+55');
  const [validatingPhone, setValidatingPhone] = useState(false);
  const [phoneValid, setPhoneValid] = useState<boolean | null>(null);
  const [phoneJid, setPhoneJid] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [selectedTestTemplate, setSelectedTestTemplate] = useState<string>('');
  
  // Estados para execução manual
  const [runningCheck, setRunningCheck] = useState(false);
  const [runningSend, setRunningSend] = useState(false);
  const [lastExecution, setLastExecution] = useState<{ action: string; result: any; time: Date } | null>(null);

  // Buscar informações da loja
  const { data: storeInfo } = useQuery({
    queryKey: ['store-info', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      const { data, error } = await supabase
        .from('stores')
        .select('name, slug')
        .eq('id', storeId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!storeId
  });

  // Buscar produtos da loja
  const { data: products } = useQuery({
    queryKey: ['store-products', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category_id')
        .eq('store_id', storeId)
        .eq('is_available', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!storeId
  });

  // Buscar categorias da loja
  const { data: categories } = useQuery({
    queryKey: ['store-categories', storeId],
    queryFn: async () => {
      if (!storeId) return [];
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!storeId
  });

  // State para novo regra
  const [newRule, setNewRule] = useState({
    type: 'product' as 'product' | 'category',
    product_id: '',
    category_id: '',
    recurrence_days: 30,
    reminder_days_before: 3,
    message_template: ''
  });

  const handleToggleEnabled = () => {
    updateConfig.mutate({ 
      sentinela_enabled: !storeConfig?.sentinela_enabled 
    });
  };

  const handleSaveTemplate = () => {
    updateConfig.mutate({ sentinela_default_template: template });
    setEditingTemplate(false);
  };

  const handleCreateRule = () => {
    if (!storeId) return;

    createRule.mutate({
      store_id: storeId,
      product_id: newRule.type === 'product' ? newRule.product_id : null,
      category_id: newRule.type === 'category' ? newRule.category_id : null,
      recurrence_days: newRule.recurrence_days,
      reminder_days_before: newRule.reminder_days_before,
      message_template: newRule.message_template || null
    }, {
      onSuccess: () => {
        setIsNewRuleOpen(false);
        setNewRule({
          type: 'product',
          product_id: '',
          category_id: '',
          recurrence_days: 30,
          reminder_days_before: 3,
          message_template: ''
        });
      }
    });
  };

  // Função para validar número de WhatsApp
  const handleValidatePhone = async () => {
    const phoneNumbers = normalizePhone(testPhone);
    
    if (phoneNumbers.length < 10) {
      toast.error('Digite um número de telefone válido (mínimo 10 dígitos)');
      return;
    }

    setValidatingPhone(true);
    setPhoneValid(null);
    setPhoneJid(null);

    try {
      // Combinar código do país com número normalizado
      const countryNumbers = countryCode.replace('+', '');
      const fullPhone = countryNumbers + phoneNumbers;

      const response = await supabase.functions.invoke('validate-whatsapp-number', {
        body: { phone: fullPhone, sendWelcome: false }
      });

      if (response.error) throw response.error;

      if (response.data?.valid) {
        setPhoneValid(true);
        setPhoneJid(response.data.jid);
        toast.success('Número válido no WhatsApp!');
      } else {
        setPhoneValid(false);
        toast.error('Número não encontrado no WhatsApp');
      }
    } catch (error: any) {
      console.error('Erro ao validar WhatsApp:', error);
      toast.error(error.message || 'Erro ao validar número');
      setPhoneValid(false);
    } finally {
      setValidatingPhone(false);
    }
  };

  // Função para enviar mensagem de teste usando template SENTINELA
  const handleSendTest = async () => {
    if (!phoneValid || !phoneJid) {
      toast.error('Valide o número primeiro');
      return;
    }

    if (!selectedTestTemplate) {
      toast.error('Selecione um template para enviar');
      return;
    }

    setSendingTest(true);

    try {
      // Buscar template selecionado
      const selectedTemplate = templates?.find(t => t.id === selectedTestTemplate);
      if (!selectedTemplate) {
        toast.error('Template não encontrado');
        return;
      }

      // Substituir variáveis com dados de teste
      const message = selectedTemplate.content
        .replace(/{nome}/gi, 'Cliente Teste')
        .replace(/{primeiro_nome}/gi, 'Cliente')
        .replace(/{produto}/gi, 'Produto Exemplo')
        .replace(/{loja}/gi, storeInfo?.name || 'Minha Loja')
        .replace(/{link_loja}/gi, storeInfo?.slug ? `https://${storeInfo.slug}.mostralo.com` : 'https://mostralo.com');

      // Combinar código do país com número normalizado
      const phoneNumbers = normalizePhone(testPhone);
      const countryNumbers = countryCode.replace('+', '');
      const fullPhone = countryNumbers + phoneNumbers;

      // Enviar usando whatsapp-send
      const response = await supabase.functions.invoke('whatsapp-send', {
        body: { 
          storeId: storeId,
          phoneNumber: fullPhone,
          messageType: 'text',
          content: message
        }
      });

      if (response.error) throw response.error;

      if (response.data?.success) {
        toast.success('Mensagem de teste enviada com sucesso!');
      } else {
        toast.error(response.data?.error || 'Não foi possível enviar a mensagem');
      }
    } catch (error: any) {
      console.error('Erro ao enviar teste:', error);
      toast.error(error.message || 'Erro ao enviar mensagem de teste');
    } finally {
      setSendingTest(false);
    }
  };

  // Função para executar verificação manual
  const handleManualCheck = async () => {
    if (!storeId) return;
    
    setRunningCheck(true);
    try {
      const response = await supabase.functions.invoke('sentinela-manual-trigger', {
        body: { action: 'check', storeId }
      });

      if (response.error) throw response.error;

      const result = response.data;
      setLastExecution({ action: 'check', result, time: new Date() });
      
      if (result.success) {
        toast.success(result.message || `${result.reminders_created} lembrete(s) criado(s)`);
      } else {
        toast.error(result.error || 'Erro ao verificar lembretes');
      }
    } catch (error: any) {
      console.error('Erro ao executar verificação:', error);
      toast.error(error.message || 'Erro ao verificar lembretes');
    } finally {
      setRunningCheck(false);
    }
  };

  // Função para enviar lembretes manualmente
  const handleManualSend = async () => {
    if (!storeId) return;
    
    setRunningSend(true);
    try {
      const response = await supabase.functions.invoke('sentinela-manual-trigger', {
        body: { action: 'send', storeId }
      });

      if (response.error) throw response.error;

      const result = response.data;
      setLastExecution({ action: 'send', result, time: new Date() });
      
      if (result.success) {
        toast.success(result.message || `${result.sent} enviado(s), ${result.failed} falha(s)`);
      } else {
        toast.error(result.error || 'Erro ao enviar lembretes');
      }
    } catch (error: any) {
      console.error('Erro ao enviar lembretes:', error);
      toast.error(error.message || 'Erro ao enviar lembretes');
    } finally {
      setRunningSend(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case 'sent':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30"><CheckCircle2 className="w-3 h-3 mr-1" /> Enviado</Badge>;
      case 'converted':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30"><TrendingUp className="w-3 h-3 mr-1" /> Convertido</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30"><XCircle className="w-3 h-3 mr-1" /> Falha</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-muted text-muted-foreground"><BellOff className="w-3 h-3 mr-1" /> Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading || modulesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Verificar se a loja tem acesso ao módulo SENTINELA
  if (!hasModule('sentinela')) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 rounded-full bg-destructive/10 w-fit mb-2">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle>Módulo Bloqueado</CardTitle>
            <CardDescription>
              O módulo SENTINELA não está disponível para esta loja. 
              Entre em contato com o suporte para mais informações.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-7 h-7 text-primary" />
            SENTINELA
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => setShowGuide(true)}
                >
                  <HelpCircle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Como usar o SENTINELA</p>
              </TooltipContent>
            </Tooltip>
          </h1>
          <p className="text-muted-foreground">
            Lembretes inteligentes de recompra
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Botões de ação manual */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualCheck}
                disabled={runningCheck || !storeConfig?.sentinela_enabled}
              >
                {runningCheck ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Verificar Agora
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Procura por clientes que precisam de lembretes</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSend}
                disabled={runningSend || !storeConfig?.sentinela_enabled || stats.pendingReminders === 0}
              >
                {runningSend ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Enviar Pendentes
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Envia os {stats.pendingReminders} lembretes pendentes agora</p>
            </TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-2 ml-2 border-l pl-4">
            <Label htmlFor="sentinela-enabled">Ativar SENTINELA</Label>
            <Switch
              id="sentinela-enabled"
              checked={storeConfig?.sentinela_enabled || false}
              onCheckedChange={handleToggleEnabled}
            />
          </div>
        </div>
      </div>

      {/* Última execução */}
      {lastExecution && (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="py-3">
            <div className="flex items-center gap-3 text-sm">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Última execução:</span>
              <Badge variant="outline">
                {lastExecution.action === 'check' ? 'Verificação' : 'Envio'}
              </Badge>
              <span>
                {lastExecution.result?.message || 
                  (lastExecution.action === 'check' 
                    ? `${lastExecution.result?.reminders_created || 0} lembrete(s) criado(s)` 
                    : `${lastExecution.result?.sent || 0} enviado(s)`
                  )
                }
              </span>
              <span className="text-muted-foreground">
                às {format(lastExecution.time, "HH:mm", { locale: ptBR })}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeRules}</p>
                <p className="text-sm text-muted-foreground">Regras ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pendingReminders}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.sentReminders}</p>
                <p className="text-sm text-muted-foreground">Enviados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.conversionRate}%</p>
                <p className="text-sm text-muted-foreground">Conversão</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="rules">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="rules" className="gap-2">
            <Settings className="w-4 h-4" />
            Regras
          </TabsTrigger>
          <TabsTrigger value="reminders" className="gap-2">
            <Bell className="w-4 h-4" />
            Lembretes
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="template" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Template Padrão
          </TabsTrigger>
          <TabsTrigger value="test" className="gap-2">
            <Phone className="w-4 h-4" />
            Testar
          </TabsTrigger>
        </TabsList>

        {/* Regras */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Configure quando enviar lembretes de recompra para cada produto ou categoria
            </p>
            <Dialog open={isNewRuleOpen} onOpenChange={setIsNewRuleOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Regra
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Regra de Recompra</DialogTitle>
                  <DialogDescription>
                    Configure quando enviar lembretes para reposição de produtos
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={newRule.type}
                      onValueChange={(v) => setNewRule(prev => ({ ...prev, type: v as 'product' | 'category' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="product">Produto específico</SelectItem>
                        <SelectItem value="category">Categoria inteira</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newRule.type === 'product' ? (
                    <div className="space-y-2">
                      <Label>Produto</Label>
                      <Select
                        value={newRule.product_id}
                        onValueChange={(v) => setNewRule(prev => ({ ...prev, product_id: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map(product => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select
                        value={newRule.category_id}
                        onValueChange={(v) => setNewRule(prev => ({ ...prev, category_id: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Ciclo de recompra (dias)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={newRule.recurrence_days}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        const clamped = Math.min(365, Math.max(1, value));
                        setNewRule(prev => ({ ...prev, recurrence_days: clamped }));
                      }}
                      placeholder="Ex: 30"
                    />
                    <div className="flex gap-2 flex-wrap">
                      {RECURRENCE_SHORTCUTS.map(days => (
                        <Button
                          key={days}
                          type="button"
                          variant={newRule.recurrence_days === days ? "default" : "outline"}
                          size="sm"
                          onClick={() => setNewRule(prev => ({ ...prev, recurrence_days: days }))}
                        >
                          {days}d
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Digite qualquer valor entre 1 e 365 dias
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Lembrar X dias antes de acabar</Label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={newRule.reminder_days_before}
                      onChange={(e) => setNewRule(prev => ({ ...prev, reminder_days_before: parseInt(e.target.value) || 3 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Template personalizado (opcional)</Label>
                    <Textarea
                      placeholder="Deixe em branco para usar o template padrão"
                      value={newRule.message_template}
                      onChange={(e) => setNewRule(prev => ({ ...prev, message_template: e.target.value }))}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      Variáveis: {'{nome}'}, {'{primeiro_nome}'}, {'{produto}'}, {'{loja}'}, {'{link_loja}'}
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewRuleOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateRule}
                    disabled={createRule.isPending || (!newRule.product_id && !newRule.category_id)}
                  >
                    {createRule.isPending ? 'Criando...' : 'Criar Regra'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {rules && rules.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto/Categoria</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Lembrete</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span>{rule.product?.name || rule.category?.name || '-'}</span>
                          {rule.category_id && (
                            <Badge variant="outline" className="text-xs">Categoria</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{rule.recurrence_days} dias</TableCell>
                      <TableCell>{rule.reminder_days_before} dias antes</TableCell>
                      <TableCell>
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={(checked) => updateRule.mutate({ id: rule.id, is_active: checked })}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRule.mutate(rule.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhuma regra configurada</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Crie regras para começar a enviar lembretes de recompra
                </p>
                <Button onClick={() => setIsNewRuleOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeira regra
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Lembretes */}
        <TabsContent value="reminders" className="space-y-4">
          {reminders && reminders.length > 0 ? (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Agendado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reminders.map((reminder) => (
                    <TableRow key={reminder.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{reminder.customer?.name || '-'}</p>
                          <p className="text-sm text-muted-foreground">{reminder.customer?.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{reminder.product?.name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {format(new Date(reminder.scheduled_for), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(reminder.status)}</TableCell>
                      <TableCell className="text-right">
                        {reminder.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => cancelReminder.mutate(reminder.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                        {reminder.message_sent && (
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhum lembrete ainda</p>
                <p className="text-sm text-muted-foreground">
                  Os lembretes aparecerão aqui quando forem agendados
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Templates SENTINELA */}
        <TabsContent value="templates" className="space-y-4">
          {storeId && (
            <SentinelaTemplates 
              storeId={storeId} 
              storeName={storeInfo?.name}
              storeSlug={storeInfo?.slug}
            />
          )}
        </TabsContent>

        {/* Template Padrão */}
        <TabsContent value="template" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Template Padrão de Mensagem
              </CardTitle>
              <CardDescription>
                Esta mensagem será usada quando uma regra não tiver template personalizado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={10}
                disabled={!editingTemplate}
              />
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Variáveis disponíveis:</p>
                  <ul className="grid grid-cols-2 gap-1">
                    <li><code className="bg-background px-1 rounded">{'{nome}'}</code> - Nome completo</li>
                    <li><code className="bg-background px-1 rounded">{'{primeiro_nome}'}</code> - Primeiro nome</li>
                    <li><code className="bg-background px-1 rounded">{'{produto}'}</code> - Nome do produto</li>
                    <li><code className="bg-background px-1 rounded">{'{loja}'}</code> - Nome da loja</li>
                    <li><code className="bg-background px-1 rounded">{'{link_loja}'}</code> - Link da loja</li>
                  </ul>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                {editingTemplate ? (
                  <>
                    <Button variant="outline" onClick={() => {
                      setTemplate(storeConfig?.sentinela_default_template || DEFAULT_TEMPLATE);
                      setEditingTemplate(false);
                    }}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveTemplate} disabled={updateConfig.isPending}>
                      {updateConfig.isPending ? 'Salvando...' : 'Salvar Template'}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setEditingTemplate(true)}>
                    Editar Template
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teste */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Testar Envio de Mensagem
              </CardTitle>
              <CardDescription>
                Valide um número de WhatsApp e envie uma mensagem de teste para verificar se o sistema está funcionando
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Seletor de Template */}
              <div className="space-y-2">
                <Label>Template de Mensagem</Label>
                <Select
                  value={selectedTestTemplate}
                  onValueChange={setSelectedTestTemplate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template para enviar" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.is_default ? '⭐ ' : ''}{t.name} ({t.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview do Template Selecionado */}
              {selectedTestTemplate && templates && (() => {
                const selectedTemplate = templates.find(t => t.id === selectedTestTemplate);
                if (!selectedTemplate) return null;
                
                const previewMessage = selectedTemplate.content
                  .replace(/{nome}/gi, 'Cliente Teste')
                  .replace(/{primeiro_nome}/gi, 'Cliente')
                  .replace(/{produto}/gi, 'Produto Exemplo')
                  .replace(/{loja}/gi, storeInfo?.name || 'Minha Loja')
                  .replace(/{link_loja}/gi, storeInfo?.slug ? `https://${storeInfo.slug}.mostralo.com` : 'https://mostralo.com');
                
                return (
                  <div className="flex justify-center py-4">
                    <WhatsAppPhonePreview
                      storeName={storeInfo?.name || "Minha Loja"}
                      message={previewMessage}
                      showTypingAnimation={false}
                      playNotificationSound={false}
                      allowThemeToggle={true}
                    />
                  </div>
                );
              })()}

              <div className="space-y-2">
                <Label htmlFor="test-phone">Número de WhatsApp</Label>
                <div className="flex gap-2">
                  <CountryCodeSelect 
                    value={countryCode} 
                    onChange={(value) => {
                      setCountryCode(value);
                      setPhoneValid(null);
                      setPhoneJid(null);
                    }} 
                  />
                  <div className="flex-1 relative">
                    <Input
                      id="test-phone"
                      type="tel"
                      placeholder="(61) 99400-9368"
                      value={testPhone}
                      onChange={(e) => {
                        const formatted = formatBrazilianPhone(e.target.value);
                        setTestPhone(formatted);
                        setPhoneValid(null);
                        setPhoneJid(null);
                      }}
                      maxLength={16}
                      className={phoneValid === true ? 'border-green-500 pr-10' : phoneValid === false ? 'border-red-500 pr-10' : ''}
                    />
                    {phoneValid === true && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                    {phoneValid === false && (
                      <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <Button 
                    onClick={handleValidatePhone} 
                    disabled={validatingPhone || normalizePhone(testPhone).length < 10}
                    variant="outline"
                  >
                    {validatingPhone ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Validando...
                      </>
                    ) : (
                      'Validar'
                    )}
                  </Button>
                </div>
              </div>

              {phoneValid === true && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                  <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Número válido no WhatsApp
                  </p>
                </div>
              )}

              {phoneValid === false && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                  <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Este número não está registrado no WhatsApp
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button 
                  onClick={handleSendTest} 
                  disabled={!phoneValid || !selectedTestTemplate || sendingTest}
                >
                  {sendingTest ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Mensagem de Teste
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Guia do SENTINELA */}
      <SentinelaGuide open={showGuide} onOpenChange={setShowGuide} />
    </div>
    </TooltipProvider>
  );
}
