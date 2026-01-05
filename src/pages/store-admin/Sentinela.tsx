import { useState, useMemo, useEffect } from "react";
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
import { AlertCircle, BarChart3, Bell, BellOff, Calendar, CheckCircle2, Clock, Edit2, Eye, FileText, HelpCircle, ImageIcon, Loader2, MessageSquare, Package, Pause, Phone, Play, Plus, RefreshCw, Send, Settings, Shield, Target, Trash2, TrendingUp, Upload, XCircle, Zap } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { SentinelaGuide } from "@/components/admin/sentinela/SentinelaGuide";
import { SentinelaTemplates } from "@/components/admin/sentinela/SentinelaTemplates";
import { SentinelaAnalytics } from "@/components/admin/sentinela/SentinelaAnalytics";
import { CountryCodeSelect } from "@/components/ui/country-code-select";
import { WhatsAppPhonePreview } from "@/components/admin/whatsapp/WhatsAppPhonePreview";
import { formatBrazilianPhone, normalizePhone } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

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

  // Estados para teste no modal de nova regra
  const [ruleTestPhone, setRuleTestPhone] = useState('');
  const [ruleTestCountryCode, setRuleTestCountryCode] = useState('+55');
  const [ruleTestValidating, setRuleTestValidating] = useState(false);
  const [ruleTestPhoneValid, setRuleTestPhoneValid] = useState<boolean | null>(null);
  const [ruleTestPhoneJid, setRuleTestPhoneJid] = useState<string | null>(null);
  const [ruleTestSending, setRuleTestSending] = useState(false);

  // Estados para agendamento
  const [savingSchedule, setSavingSchedule] = useState(false);

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
    message_template: '',
    template_id: '',
    image_url: ''
  });
  
  // Estados para upload de imagem
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Preview da mensagem em tempo real
  const [previewMessage, setPreviewMessage] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  
  // Estados para edição de regras
  const [isEditRuleOpen, setIsEditRuleOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<{
    id: string;
    type: 'product' | 'category';
    product_id: string;
    category_id: string;
    recurrence_days: number;
    reminder_days_before: number;
    message_template: string;
    template_id: string;
    image_url: string;
  } | null>(null);
  
  // Atualizar preview quando template ou mensagem mudar
  useEffect(() => {
    let message = '';
    let imageUrl: string | null = newRule.image_url || null;
    
    if (newRule.template_id && templates) {
      const selectedTemplate = templates.find(t => t.id === newRule.template_id);
      message = selectedTemplate?.content || '';
      // Se não tiver imagem manual, usar do template
      if (!newRule.image_url && selectedTemplate?.image_url) {
        imageUrl = selectedTemplate.image_url;
      }
    } else if (newRule.message_template) {
      message = newRule.message_template;
    } else {
      message = storeConfig?.sentinela_default_template || DEFAULT_TEMPLATE;
    }
    
    // Obter nome do produto/categoria selecionado
    const selectedProductName = newRule.type === 'product' 
      ? products?.find(p => p.id === newRule.product_id)?.name || 'Produto Exemplo'
      : categories?.find(c => c.id === newRule.category_id)?.name || 'Categoria Exemplo';
    
    // Substituir variáveis com dados de exemplo
    const preview = message
      .replace(/{nome}/gi, 'Cliente Exemplo')
      .replace(/{primeiro_nome}/gi, 'Cliente')
      .replace(/{produto}/gi, selectedProductName)
      .replace(/{loja}/gi, storeInfo?.name || 'Minha Loja')
      .replace(/{link_loja}/gi, `https://mostralo.com.br/loja/${storeInfo?.slug || 'minha-loja'}`);
    
    setPreviewMessage(preview);
    setPreviewImageUrl(imageUrl);
  }, [newRule.template_id, newRule.message_template, newRule.product_id, newRule.category_id, newRule.type, newRule.image_url, templates, products, categories, storeInfo, storeConfig]);
  
  // Função para upload de imagem
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storeId) return;
    
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${storeId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('sentinela-images')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('sentinela-images')
        .getPublicUrl(fileName);
      
      setNewRule(prev => ({ ...prev, image_url: publicUrl }));
      toast.success('Imagem enviada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao enviar imagem:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploadingImage(false);
    }
  };

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

    // Determinar a imagem: usar a do template se não tiver imagem manual
    let finalImageUrl = newRule.image_url || null;
    if (!finalImageUrl && newRule.template_id && templates) {
      const selectedTemplate = templates.find(t => t.id === newRule.template_id);
      finalImageUrl = selectedTemplate?.image_url || null;
    }

    createRule.mutate({
      store_id: storeId,
      product_id: newRule.type === 'product' ? newRule.product_id : null,
      category_id: newRule.type === 'category' ? newRule.category_id : null,
      recurrence_days: newRule.recurrence_days,
      reminder_days_before: newRule.reminder_days_before,
      message_template: newRule.message_template || null,
      template_id: newRule.template_id || null,
      image_url: finalImageUrl
    }, {
      onSuccess: () => {
        setIsNewRuleOpen(false);
        setNewRule({
          type: 'product',
          product_id: '',
          category_id: '',
          recurrence_days: 30,
          reminder_days_before: 3,
          message_template: '',
          template_id: '',
          image_url: ''
        });
      }
    });
  };

  // Função para editar regra
  const handleEditRule = (rule: any) => {
    setEditingRule({
      id: rule.id,
      type: rule.product_id ? 'product' : 'category',
      product_id: rule.product_id || '',
      category_id: rule.category_id || '',
      recurrence_days: rule.recurrence_days,
      reminder_days_before: rule.reminder_days_before,
      message_template: rule.message_template || '',
      template_id: rule.template_id || '',
      image_url: rule.image_url || ''
    });
    setIsEditRuleOpen(true);
  };

  const handleSaveEditRule = () => {
    if (!editingRule) return;

    updateRule.mutate({
      id: editingRule.id,
      product_id: editingRule.type === 'product' ? editingRule.product_id : null,
      category_id: editingRule.type === 'category' ? editingRule.category_id : null,
      recurrence_days: editingRule.recurrence_days,
      reminder_days_before: editingRule.reminder_days_before,
      message_template: editingRule.message_template || null,
      template_id: editingRule.template_id || null,
      image_url: editingRule.image_url || null
    } as any, {
      onSuccess: () => {
        setIsEditRuleOpen(false);
        setEditingRule(null);
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
        .replace(/{link_loja}/gi, storeInfo?.slug ? `https://mostralo.com.br/loja/${storeInfo.slug}` : 'https://mostralo.com.br');

      // Combinar código do país com número normalizado
      const phoneNumbers = normalizePhone(testPhone);
      const countryNumbers = countryCode.replace('+', '');
      const fullPhone = countryNumbers + phoneNumbers;

      // Enviar usando whatsapp-send com suporte a imagem
      const response = await supabase.functions.invoke('whatsapp-send', {
        body: { 
          storeId: storeId,
          phoneNumber: fullPhone,
          messageType: selectedTemplate.image_url ? 'image' : 'text',
          content: message,
          mediaUrl: selectedTemplate.image_url || undefined
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

  // Função para validar número no modal de nova regra
  const handleRuleTestValidate = async () => {
    const phoneNumbers = normalizePhone(ruleTestPhone);
    
    if (phoneNumbers.length < 10) {
      toast.error('Digite um número de telefone válido (mínimo 10 dígitos)');
      return;
    }

    setRuleTestValidating(true);
    setRuleTestPhoneValid(null);
    setRuleTestPhoneJid(null);

    try {
      const countryNumbers = ruleTestCountryCode.replace('+', '');
      const fullPhone = countryNumbers + phoneNumbers;

      const response = await supabase.functions.invoke('validate-whatsapp-number', {
        body: { phone: fullPhone, sendWelcome: false }
      });

      if (response.error) throw response.error;

      if (response.data?.valid) {
        setRuleTestPhoneValid(true);
        setRuleTestPhoneJid(response.data.jid);
        toast.success('Número válido no WhatsApp!');
      } else {
        setRuleTestPhoneValid(false);
        toast.error('Número não encontrado no WhatsApp');
      }
    } catch (error: any) {
      console.error('Erro ao validar WhatsApp:', error);
      toast.error(error.message || 'Erro ao validar número');
      setRuleTestPhoneValid(false);
    } finally {
      setRuleTestValidating(false);
    }
  };

  // Função para enviar teste da regra
  const handleRuleTestSend = async () => {
    if (!ruleTestPhoneValid || !ruleTestPhoneJid) {
      toast.error('Valide o número primeiro');
      return;
    }

    if (!previewMessage) {
      toast.error('Configure a mensagem da regra primeiro');
      return;
    }

    setRuleTestSending(true);

    try {
      const phoneNumbers = normalizePhone(ruleTestPhone);
      const countryNumbers = ruleTestCountryCode.replace('+', '');
      const fullPhone = countryNumbers + phoneNumbers;

      // Enviar usando whatsapp-send
      const response = await supabase.functions.invoke('whatsapp-send', {
        body: { 
          storeId: storeId,
          phoneNumber: fullPhone,
          messageType: newRule.image_url ? 'image' : 'text',
          content: previewMessage,
          mediaUrl: newRule.image_url || undefined
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
      setRuleTestSending(false);
    }
  };

  // Função para salvar configurações de agendamento
  const handleSaveSchedule = async (hour: number, days: string[]) => {
    if (!storeId) return;
    
    setSavingSchedule(true);
    try {
      updateConfig.mutate({ 
        sentinela_send_hour: hour,
        sentinela_send_days: days
      } as any);
      toast.success('Configurações de agendamento salvas!');
    } catch (error: any) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSavingSchedule(false);
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
          <TabsTrigger value="schedule" className="gap-2">
            <Calendar className="w-4 h-4" />
            Agendamento
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
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
              <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nova Regra de Recompra</DialogTitle>
                  <DialogDescription>
                    Configure quando enviar lembretes para reposição de produtos
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
                  {/* Coluna esquerda - Formulário */}
                  <div className="space-y-4">
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

                    <div className="grid grid-cols-2 gap-4">
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
                        <div className="flex gap-1 flex-wrap">
                          {RECURRENCE_SHORTCUTS.slice(0, 4).map(days => (
                            <Button
                              key={days}
                              type="button"
                              variant={newRule.recurrence_days === days ? "default" : "outline"}
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => setNewRule(prev => ({ ...prev, recurrence_days: days }))}
                            >
                              {days}d
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Lembrar X dias antes</Label>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          value={newRule.reminder_days_before}
                          onChange={(e) => setNewRule(prev => ({ ...prev, reminder_days_before: parseInt(e.target.value) || 3 }))}
                        />
                      </div>
                    </div>

                    {/* Seleção de Template */}
                    <div className="space-y-2">
                      <Label>Template de Mensagem</Label>
                      <Select
                        value={newRule.template_id}
                        onValueChange={(v) => {
                          if (v === 'custom') {
                            setNewRule(prev => ({ ...prev, template_id: '', message_template: prev.message_template || '' }));
                          } else if (v === 'default') {
                            setNewRule(prev => ({ ...prev, template_id: '', message_template: '' }));
                          } else {
                            setNewRule(prev => ({ ...prev, template_id: v, message_template: '' }));
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Usar template padrão" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">📋 Usar template padrão</SelectItem>
                          <SelectItem value="custom">✏️ Escrever personalizado</SelectItem>
                          {templates?.map(t => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.is_default ? '⭐ ' : ''}{t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Campo de mensagem personalizada */}
                    {!newRule.template_id && (
                      <div className="space-y-2">
                        <Label>Mensagem {newRule.message_template ? 'Personalizada' : '(opcional)'}</Label>
                        <Textarea
                          placeholder="Deixe em branco para usar o template padrão da loja"
                          value={newRule.message_template}
                          onChange={(e) => setNewRule(prev => ({ ...prev, message_template: e.target.value }))}
                          rows={4}
                        />
                      </div>
                    )}

                    {/* Upload de Imagem */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Imagem do Produto (opcional)
                      </Label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            className="cursor-pointer"
                          />
                        </div>
                        {uploadingImage && <Loader2 className="w-5 h-5 animate-spin" />}
                      </div>
                      {newRule.image_url && (
                        <div className="relative inline-block">
                          <img 
                            src={newRule.image_url} 
                            alt="Preview" 
                            className="w-20 h-20 object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 w-6 h-6"
                            onClick={() => setNewRule(prev => ({ ...prev, image_url: '' }))}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        A imagem será enviada junto com a mensagem no WhatsApp
                      </p>
                    </div>

                    {/* Variáveis disponíveis */}
                    <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium mb-1">Variáveis disponíveis:</p>
                        <div className="flex flex-wrap gap-1">
                          <code className="bg-background px-1.5 py-0.5 rounded text-xs">{'{nome}'}</code>
                          <code className="bg-background px-1.5 py-0.5 rounded text-xs">{'{primeiro_nome}'}</code>
                          <code className="bg-background px-1.5 py-0.5 rounded text-xs">{'{produto}'}</code>
                          <code className="bg-background px-1.5 py-0.5 rounded text-xs">{'{loja}'}</code>
                          <code className="bg-background px-1.5 py-0.5 rounded text-xs">{'{link_loja}'}</code>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Coluna direita - Preview WhatsApp + Teste */}
                  <div className="flex flex-col items-center justify-start space-y-4">
                    <div>
                      <Label className="mb-3 flex items-center gap-2 justify-center">
                        <Eye className="w-4 h-4" />
                        Preview da Mensagem
                      </Label>
                      <WhatsAppPhonePreview
                        storeName={storeInfo?.name || "Minha Loja"}
                        message={previewMessage}
                        mediaUrl={previewImageUrl || undefined}
                        mediaType={previewImageUrl ? 'image' : undefined}
                        showTypingAnimation={false}
                        playNotificationSound={false}
                        allowThemeToggle={true}
                      />
                    </div>

                    {/* Seção de Teste de Envio */}
                    <div className="w-full border-t pt-4 space-y-3">
                      <Label className="flex items-center gap-2 text-sm font-medium">
                        <Send className="w-4 h-4" />
                        Testar Envio
                      </Label>
                      <div className="flex gap-2">
                        <CountryCodeSelect 
                          value={ruleTestCountryCode} 
                          onChange={(value) => {
                            setRuleTestCountryCode(value);
                            setRuleTestPhoneValid(null);
                            setRuleTestPhoneJid(null);
                          }} 
                        />
                        <div className="flex-1 relative">
                          <Input
                            type="tel"
                            placeholder="(61) 99400-9368"
                            value={ruleTestPhone}
                            onChange={(e) => {
                              const formatted = formatBrazilianPhone(e.target.value);
                              setRuleTestPhone(formatted);
                              setRuleTestPhoneValid(null);
                              setRuleTestPhoneJid(null);
                            }}
                            maxLength={16}
                            className={ruleTestPhoneValid === true ? 'border-green-500 pr-10' : ruleTestPhoneValid === false ? 'border-red-500 pr-10' : ''}
                          />
                          {ruleTestPhoneValid === true && (
                            <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                          )}
                          {ruleTestPhoneValid === false && (
                            <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <Button 
                          onClick={handleRuleTestValidate} 
                          disabled={ruleTestValidating || normalizePhone(ruleTestPhone).length < 10}
                          variant="outline"
                          size="sm"
                        >
                          {ruleTestValidating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Validar'
                          )}
                        </Button>
                      </div>

                      {ruleTestPhoneValid === true && (
                        <div className="p-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                          <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3" />
                            Número válido no WhatsApp
                          </p>
                        </div>
                      )}

                      {ruleTestPhoneValid === false && (
                        <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                          <p className="text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                            <XCircle className="w-3 h-3" />
                            Número não encontrado no WhatsApp
                          </p>
                        </div>
                      )}

                      <Button 
                        onClick={handleRuleTestSend} 
                        disabled={!ruleTestPhoneValid || !previewMessage || ruleTestSending}
                        className="w-full"
                        size="sm"
                      >
                        {ruleTestSending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Enviar Teste
                          </>
                        )}
                      </Button>
                    </div>
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
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditRule(rule)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteRule.mutate(rule.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
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

        {/* Agendamento */}
        <TabsContent value="schedule" className="space-y-4">
          {/* Card de Pausa */}
          <Card className={storeConfig?.sentinela_paused ? 'border-yellow-500/50 bg-yellow-500/5' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pause className="w-5 h-5" />
                Pausar Envios
                {storeConfig?.sentinela_paused && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30 ml-2">
                    PAUSADO
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Pause temporariamente os envios do SENTINELA durante férias, feriados ou manutenção
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {storeConfig?.sentinela_paused ? (
                    <div className="p-2 bg-yellow-500/20 rounded-full">
                      <Pause className="w-5 h-5 text-yellow-600" />
                    </div>
                  ) : (
                    <div className="p-2 bg-green-500/20 rounded-full">
                      <Play className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">
                      {storeConfig?.sentinela_paused ? 'Envios Pausados' : 'Envios Ativos'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {storeConfig?.sentinela_paused 
                        ? 'Nenhum lembrete será enviado enquanto pausado'
                        : 'Os lembretes estão sendo enviados normalmente'
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  checked={storeConfig?.sentinela_paused || false}
                  onCheckedChange={(checked) => {
                    updateConfig.mutate({ 
                      sentinela_paused: checked,
                      sentinela_pause_reason: checked ? 'Pausa manual' : null
                    } as any);
                  }}
                />
              </div>

              {storeConfig?.sentinela_paused && (
                <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-yellow-700 dark:text-yellow-400">
                    <p className="font-medium">Os envios estão pausados</p>
                    <p>Os lembretes acumulados serão enviados quando você retomar os envios.</p>
                    {storeConfig?.sentinela_pause_reason && (
                      <p className="mt-1 text-xs opacity-80">Motivo: {storeConfig.sentinela_pause_reason}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Agendamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Configurações de Envio Automático
              </CardTitle>
              <CardDescription>
                Configure quando o SENTINELA deve enviar as mensagens de recompra automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Horário */}
              <div className="space-y-2">
                <Label>Horário de envio</Label>
                <Select
                  value={String(storeConfig?.sentinela_send_hour ?? 10)}
                  onValueChange={(v) => handleSaveSchedule(parseInt(v), storeConfig?.sentinela_send_days ?? ['mon', 'tue', 'wed', 'thu', 'fri'])}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Selecione o horário" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 15 }, (_, i) => i + 7).map(hour => (
                      <SelectItem key={hour} value={String(hour)}>
                        {String(hour).padStart(2, '0')}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Horário de Brasília (America/Sao_Paulo)</p>
              </div>

              {/* Dias da semana */}
              <div className="space-y-3">
                <Label>Dias da semana</Label>
                <div className="flex flex-wrap gap-3">
                  {[
                    { key: 'mon', label: 'Seg' },
                    { key: 'tue', label: 'Ter' },
                    { key: 'wed', label: 'Qua' },
                    { key: 'thu', label: 'Qui' },
                    { key: 'fri', label: 'Sex' },
                    { key: 'sat', label: 'Sáb' },
                    { key: 'sun', label: 'Dom' },
                  ].map(day => {
                    const days = storeConfig?.sentinela_send_days ?? ['mon', 'tue', 'wed', 'thu', 'fri'];
                    const isChecked = days.includes(day.key);
                    return (
                      <div key={day.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day.key}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const newDays = checked 
                              ? [...days, day.key]
                              : days.filter(d => d !== day.key);
                            handleSaveSchedule(storeConfig?.sentinela_send_hour ?? 10, newDays);
                          }}
                        />
                        <Label htmlFor={`day-${day.key}`} className="text-sm cursor-pointer">
                          {day.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Anti-Banimento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Proteção Anti-Banimento
              </CardTitle>
              <CardDescription>
                Configure intervalos entre mensagens para evitar bloqueio do número de WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Intervalo entre mensagens */}
              <div className="space-y-2">
                <Label>Intervalo entre mensagens (segundos)</Label>
                <Select
                  value={String(storeConfig?.sentinela_interval_seconds ?? 60)}
                  onValueChange={(v) => {
                    updateConfig.mutate({ sentinela_interval_seconds: parseInt(v) } as any);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 segundos</SelectItem>
                    <SelectItem value="45">45 segundos</SelectItem>
                    <SelectItem value="60">60 segundos (recomendado)</SelectItem>
                    <SelectItem value="90">90 segundos</SelectItem>
                    <SelectItem value="120">120 segundos</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Intervalo mínimo recomendado: 45 segundos</p>
              </div>

              {/* Pausar após X mensagens */}
              <div className="space-y-2">
                <Label>Pausar após quantas mensagens</Label>
                <Select
                  value={String(storeConfig?.sentinela_pause_after_messages ?? 10)}
                  onValueChange={(v) => {
                    updateConfig.mutate({ sentinela_pause_after_messages: parseInt(v) } as any);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 mensagens</SelectItem>
                    <SelectItem value="10">10 mensagens (recomendado)</SelectItem>
                    <SelectItem value="15">15 mensagens</SelectItem>
                    <SelectItem value="20">20 mensagens</SelectItem>
                    <SelectItem value="0">Não pausar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duração da pausa */}
              <div className="space-y-2">
                <Label>Duração da pausa (segundos)</Label>
                <Select
                  value={String(storeConfig?.sentinela_pause_duration_seconds ?? 120)}
                  onValueChange={(v) => {
                    updateConfig.mutate({ sentinela_pause_duration_seconds: parseInt(v) } as any);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 minuto</SelectItem>
                    <SelectItem value="120">2 minutos (recomendado)</SelectItem>
                    <SelectItem value="180">3 minutos</SelectItem>
                    <SelectItem value="300">5 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Estimativa de tempo */}
              {(() => {
                const interval = storeConfig?.sentinela_interval_seconds ?? 60;
                const pauseAfter = storeConfig?.sentinela_pause_after_messages ?? 10;
                const pauseDuration = storeConfig?.sentinela_pause_duration_seconds ?? 120;
                
                // Calcular tempo para 100 mensagens
                const numPauses = pauseAfter > 0 ? Math.floor(100 / pauseAfter) : 0;
                const totalSeconds = (100 * interval) + (numPauses * pauseDuration);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                
                return (
                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">Estimativa de tempo</p>
                      <p>
                        Com essas configurações, <strong>100 mensagens</strong> levarão aproximadamente{' '}
                        <strong>{hours > 0 ? `${hours}h ` : ''}{minutes} minutos</strong> para serem enviadas.
                      </p>
                      <p className="mt-1 text-xs">Isso reduz significativamente o risco de bloqueio do número.</p>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          {storeId && <SentinelaAnalytics storeId={storeId} />}
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
                  .replace(/{link_loja}/gi, storeInfo?.slug ? `https://mostralo.com.br/loja/${storeInfo.slug}` : 'https://mostralo.com.br');
                
                return (
                  <div className="flex justify-center py-4">
                    <WhatsAppPhonePreview
                      storeName={storeInfo?.name || "Minha Loja"}
                      message={previewMessage}
                      mediaUrl={selectedTemplate.image_url || undefined}
                      mediaType={selectedTemplate.image_url ? 'image' : undefined}
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

      {/* Modal de Edição de Regra */}
      <Dialog open={isEditRuleOpen} onOpenChange={(open) => {
        setIsEditRuleOpen(open);
        if (!open) setEditingRule(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Regra de Recompra</DialogTitle>
            <DialogDescription>
              Atualize as configurações da regra de lembrete
            </DialogDescription>
          </DialogHeader>
          {editingRule && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={editingRule.type}
                  onValueChange={(v) => setEditingRule(prev => prev ? { ...prev, type: v as 'product' | 'category' } : null)}
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

              {editingRule.type === 'product' ? (
                <div className="space-y-2">
                  <Label>Produto</Label>
                  <Select
                    value={editingRule.product_id}
                    onValueChange={(v) => setEditingRule(prev => prev ? { ...prev, product_id: v } : null)}
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
                    value={editingRule.category_id}
                    onValueChange={(v) => setEditingRule(prev => prev ? { ...prev, category_id: v } : null)}
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ciclo de recompra (dias)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={editingRule.recurrence_days}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1;
                      const clamped = Math.min(365, Math.max(1, value));
                      setEditingRule(prev => prev ? { ...prev, recurrence_days: clamped } : null);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Lembrar X dias antes</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={editingRule.reminder_days_before}
                    onChange={(e) => setEditingRule(prev => prev ? { ...prev, reminder_days_before: parseInt(e.target.value) || 3 } : null)}
                  />
                </div>
              </div>

              {/* Seleção de Template */}
              <div className="space-y-2">
                <Label>Template de Mensagem</Label>
                <Select
                  value={editingRule.template_id || 'default'}
                  onValueChange={(v) => {
                    if (v === 'custom') {
                      setEditingRule(prev => prev ? { ...prev, template_id: '', message_template: prev.message_template || '' } : null);
                    } else if (v === 'default') {
                      setEditingRule(prev => prev ? { ...prev, template_id: '', message_template: '' } : null);
                    } else {
                      setEditingRule(prev => prev ? { ...prev, template_id: v, message_template: '' } : null);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Usar template padrão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">📋 Usar template padrão</SelectItem>
                    <SelectItem value="custom">✏️ Escrever personalizado</SelectItem>
                    {templates?.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.is_default ? '⭐ ' : ''}{t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Campo de mensagem personalizada */}
              {!editingRule.template_id && (
                <div className="space-y-2">
                  <Label>Mensagem {editingRule.message_template ? 'Personalizada' : '(opcional)'}</Label>
                  <Textarea
                    placeholder="Deixe em branco para usar o template padrão da loja"
                    value={editingRule.message_template}
                    onChange={(e) => setEditingRule(prev => prev ? { ...prev, message_template: e.target.value } : null)}
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRuleOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEditRule}
              disabled={updateRule.isPending || (editingRule?.type === 'product' && !editingRule?.product_id) || (editingRule?.type === 'category' && !editingRule?.category_id)}
            >
              {updateRule.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </TooltipProvider>
  );
}
