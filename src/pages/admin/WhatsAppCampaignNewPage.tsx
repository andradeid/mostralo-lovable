import { useState, useEffect } from "react";
import { WhatsAppPhonePreview } from "@/components/admin/whatsapp/WhatsAppPhonePreview";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useStoreAccess } from "@/hooks/useStoreAccess";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Loader2, 
  ArrowLeft,
  Users,
  Clock,
  Filter,
  Send,
  Eye,
  MessageCircle,
  Shield,
  Timer,
  Upload,
  X,
  Image,
  Video,
  FileText,
  TestTube,
  CheckCircle,
  XCircle,
  Search,
  Save,
  Calendar,
  CalendarClock,
  Phone,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectedTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
}

export default function WhatsAppCampaignNewPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { storeId } = useStoreAccess();
  const [loading, setLoading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<SelectedTemplate | null>(null);
  const [storeName, setStoreName] = useState<string>('');
  const [storeSlug, setStoreSlug] = useState<string>('');
  
  // Estados para mídia
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  
  // Estados para teste de envio
  const [testNumber, setTestNumber] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [validatingTestNumber, setValidatingTestNumber] = useState(false);
  const [testNumberValid, setTestNumberValid] = useState<boolean | null>(null);
  const [validationStep, setValidationStep] = useState('');
  
  // Estado para salvar mensagem
  const [savingMessage, setSavingMessage] = useState(false);
  
  // Estado para validação em lote de WhatsApp
  const [validatingBatch, setValidatingBatch] = useState(false);
  
  // Estado para etapas de validação animada
  const [validationStage, setValidationStage] = useState('');
  const [validationProgress, setValidationProgress] = useState(0);
  
  // Estados para contatos manuais
  const [manualContactsInput, setManualContactsInput] = useState('');
  const [manualContacts, setManualContacts] = useState<{
    name: string;
    phone: string;
    valid: boolean | null;
    selected: boolean;
  }[]>([]);
  const [validatingManual, setValidatingManual] = useState(false);
  
  // Estados para busca de clientes
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    template_id: '',
    custom_message: '',
    media_url: '',
    media_type: '' as '' | 'image' | 'video' | 'document',
    filter_days_inactive: 7,
    filter_min_orders: 0,
    filter_max_orders: 0,
    filter_min_spent: 0,
    filter_max_spent: 0,
    filter_label_ids: [] as string[],
    include_imported_contacts: false,
    message_interval_seconds: 60,
    daily_limit: 100,
    start_hour: 9,
    end_hour: 21,
    // Anti-bloqueio
    pause_enabled: false,
    pause_after_messages: 10,
    pause_duration_seconds: 120,
    // Agendamento
    schedule_type: 'now' as 'now' | 'scheduled',
    scheduled_date: '',
    scheduled_time: '09:00',
  });

  // Funções auxiliares para formatação de tempo
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}min ${secs}s` : `${mins}min`;
  };

  const calculateEstimate = () => {
    if (!previewData?.totalRecipients) return null;
    const total = previewData.totalRecipients;
    const avgInterval = form.message_interval_seconds * 0.875; // Média entre 75% e 100%
    
    let totalSeconds = total * avgInterval;
    
    // Adicionar pausas
    if (form.pause_enabled && form.pause_after_messages > 0) {
      const pauseCount = Math.floor((total - 1) / form.pause_after_messages);
      totalSeconds += pauseCount * form.pause_duration_seconds;
    }
    
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    
    return {
      time: hours > 0 ? `${hours}h ${mins}min` : `${mins}min`,
      pauseCount: form.pause_enabled ? Math.floor((total - 1) / form.pause_after_messages) : 0,
      avgInterval: formatTime(Math.round(avgInterval)),
    };
  };

  useEffect(() => {
    if (storeId) {
      fetchTemplates();
      fetchStoreInfo();
      fetchLabels();
    }
  }, [storeId]);

  const fetchLabels = async () => {
    const { data } = await supabase
      .from('whatsapp_contact_labels' as any)
      .select('*')
      .eq('store_id', storeId)
      .order('name');
    setLabels(data || []);
  };

  // Buscar template quando o ID mudar
  useEffect(() => {
    if (form.template_id) {
      const template = templates.find(t => t.id === form.template_id);
      if (template) {
        setSelectedTemplate({
          id: template.id,
          name: template.name,
          content: template.content,
          category: template.category,
        });
        // Preencher mensagem customizada com conteúdo do template se estiver vazia
        if (!form.custom_message) {
          setForm(prev => ({ ...prev, custom_message: template.content }));
        }
      }
    } else {
      setSelectedTemplate(null);
    }
  }, [form.template_id, templates]);

  const fetchStoreInfo = async () => {
    const { data } = await supabase
      .from('stores')
      .select('name, slug')
      .eq('id', storeId)
      .single();
    
    if (data) {
      setStoreName(data.name);
      setStoreSlug(data.slug);
    }
  };

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from('whatsapp_templates' as any)
      .select('*')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .order('name');

    setTemplates(data || []);
  };

  // Upload de mídia
  const handleMediaUpload = async (file: File) => {
    if (!storeId) return;
    
    setUploadingMedia(true);
    try {
      // Detectar tipo
      let mediaType: 'image' | 'video' | 'document';
      if (file.type.startsWith('image/')) {
        mediaType = 'image';
      } else if (file.type.startsWith('video/')) {
        mediaType = 'video';
      } else {
        mediaType = 'document';
      }
      
      // Gerar nome único
      const fileExt = file.name.split('.').pop();
      const fileName = `${storeId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // Upload para bucket
      const { error: uploadError } = await supabase.storage
        .from('campaign-media')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('campaign-media')
        .getPublicUrl(fileName);
      
      setForm(prev => ({ 
        ...prev, 
        media_url: publicUrl,
        media_type: mediaType 
      }));
      
      // Criar preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setMediaFile(file);
      
      toast({
        title: "Mídia enviada!",
        description: "Arquivo carregado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível enviar o arquivo",
        variant: "destructive",
      });
    } finally {
      setUploadingMedia(false);
    }
  };

  const removeMedia = async () => {
    // Tentar remover do storage se tiver URL
    if (form.media_url && storeId) {
      const path = form.media_url.split('/campaign-media/')[1];
      if (path) {
        await supabase.storage.from('campaign-media').remove([path]);
      }
    }
    
    setMediaFile(null);
    setMediaPreview(null);
    setForm(prev => ({ ...prev, media_url: '', media_type: '' }));
  };

  // Inserir variável na mensagem
  const insertVariable = (variable: string) => {
    setForm(prev => ({
      ...prev,
      custom_message: prev.custom_message + variable
    }));
  };

  // Validar número de teste
  const validateTestNumber = async () => {
    const cleanNumber = testNumber.replace(/\D/g, '');
    
    if (!cleanNumber || cleanNumber.length < 10) {
      toast({
        title: "Número inválido",
        description: "Digite um número válido com DDD",
        variant: "destructive",
      });
      return;
    }

    setValidatingTestNumber(true);
    setTestNumberValid(null);

    try {
      setValidationStep('Aguarde um momento...');
      await new Promise(r => setTimeout(r, 600));
      
      setValidationStep('Verificando WhatsApp...');
      await new Promise(r => setTimeout(r, 500));
      
      setValidationStep('Validando número...');

      const fullPhone = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;

      const { data, error } = await supabase.functions.invoke('validate-whatsapp-number', {
        body: { phone: fullPhone, sendWelcome: false }
      });

      if (error) throw error;

      await new Promise(r => setTimeout(r, 300));

      if (data?.valid) {
        setTestNumberValid(true);
        setValidationStep('Número validado!');
        toast({
          title: "Número validado!",
          description: "Agora você pode enviar o teste",
        });
      } else {
        setTestNumberValid(false);
        setValidationStep('WhatsApp não encontrado');
        toast({
          title: "Número inválido",
          description: "Este número não possui WhatsApp ativo",
          variant: "destructive",
        });
        setTestNumber('');
      }
    } catch (error) {
      console.error('Erro ao validar:', error);
      setTestNumberValid(false);
      setValidationStep('Erro na validação');
      toast({
        title: "Erro",
        description: "Não foi possível validar o número",
        variant: "destructive",
      });
    } finally {
      setValidatingTestNumber(false);
      setTimeout(() => setValidationStep(''), 3000);
    }
  };

  // Testar envio
  const sendTestMessage = async () => {
    if (!testNumberValid) {
      toast({
        title: "Número não validado",
        description: "Valide o número antes de enviar",
        variant: "destructive",
      });
      return;
    }

    if (!form.custom_message.trim()) {
      toast({
        title: "Mensagem obrigatória",
        description: "Escreva uma mensagem para enviar",
        variant: "destructive",
      });
      return;
    }

    setSendingTest(true);
    try {
      const testContent = renderMessagePreview(form.custom_message);
      
      const payload: any = {
        storeId,
        phoneNumber: testNumber.replace(/\D/g, ''),
      };

      if (form.media_url && form.media_type) {
        payload.messageType = form.media_type;
        payload.mediaUrl = form.media_url;
        payload.content = testContent;
      } else {
        payload.messageType = 'text';
        payload.content = testContent;
      }

      const { error } = await supabase.functions.invoke('whatsapp-send', {
        body: payload
      });

      if (error) throw error;

      toast({
        title: "Teste enviado!",
        description: "Verifique seu WhatsApp",
      });
    } catch (error: any) {
      toast({
        title: "Erro no envio",
        description: error.message || "Não foi possível enviar o teste",
        variant: "destructive",
      });
    } finally {
      setSendingTest(false);
    }
  };

  // Função para substituir variáveis por exemplos
  const renderMessagePreview = (content: string) => {
    const domain = window.location.origin;
    const linkLoja = `${domain}/loja/${storeSlug}`;
    
    return content
      .replace(/\{primeiro_nome\}/g, 'Maria')
      .replace(/\{nome\}/g, 'Maria Silva')
      .replace(/\{loja\}/g, storeName || 'Sua Loja')
      .replace(/\{link_loja\}/g, linkLoja)
      .replace(/\{dias_inativo\}/g, String(form.filter_days_inactive))
      .replace(/\{total_pedidos\}/g, '5')
      .replace(/\{total_gasto\}/g, 'R$ 150,00')
      .replace(/\{ultimo_pedido\}/g, '25/11/2024');
  };

  // Detectar variáveis no template
  const detectVariables = (content: string): string[] => {
    const regex = /\{(\w+)\}/g;
    const matches = content.match(regex) || [];
    return [...new Set(matches)];
  };

  const variableDescriptions: Record<string, string> = {
    '{primeiro_nome}': 'Primeiro nome do cliente',
    '{nome}': 'Nome completo do cliente',
    '{loja}': 'Nome da sua loja',
    '{link_loja}': 'Link do cardápio digital',
    '{dias_inativo}': 'Dias desde o último pedido',
    '{total_pedidos}': 'Total de pedidos do cliente',
    '{total_gasto}': 'Valor total gasto pelo cliente',
    '{ultimo_pedido}': 'Data do último pedido',
  };

  // Função para formatar telefone
  const formatPhone = (phone: string) => {
    const cleaned = phone?.replace(/\D/g, '') || '';
    if (cleaned.length === 13) {
      return `(${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    if (cleaned.length === 12) {
      return `(${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`;
    }
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Função para validar números em lote
  const validateBatchNumbers = async () => {
    if (!previewData?.sampleRecipients) return;
    
    const pendingIds = previewData.sampleRecipients
      .filter((r: any) => r.whatsapp_valid === null)
      .map((r: any) => r.id);
    
    if (pendingIds.length === 0) {
      toast({
        title: "Todos validados",
        description: "Todos os números já foram validados",
      });
      return;
    }

    setValidatingBatch(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-whatsapp-batch', {
        body: { customerIds: pendingIds, storeId }
      });

      if (error) throw error;

      toast({
        title: "Validação concluída!",
        description: `${data.valid} válidos, ${data.invalid} inválidos`,
      });

      // Recarregar preview para atualizar status
      await previewCampaign();
    } catch (error: any) {
      toast({
        title: "Erro na validação",
        description: error.message || "Não foi possível validar",
        variant: "destructive",
      });
    } finally {
      setValidatingBatch(false);
    }
  };

  const previewCampaign = async () => {
    if (!form.custom_message.trim()) {
      toast({
        title: "Erro",
        description: "Escreva uma mensagem primeiro",
        variant: "destructive",
      });
      return;
    }

    setPreviewing(true);
    setValidationProgress(0);
    
    try {
      // Etapa 1: Buscando clientes
      setValidationStage('Buscando clientes...');
      setValidationProgress(15);
      await new Promise(r => setTimeout(r, 400));
      // Primeiro, criar a campanha como rascunho
      const { data: campaign, error: createError } = await supabase
        .from('whatsapp_campaigns' as any)
        .insert({
          store_id: storeId,
          name: form.name || 'Campanha Preview',
          description: form.description,
          template_id: form.template_id || null,
          custom_message: form.custom_message,
          media_url: form.media_url || null,
          media_type: form.media_type || null,
          filter_days_inactive: form.filter_days_inactive || null,
          filter_min_orders: form.filter_min_orders || null,
          filter_max_orders: form.filter_max_orders || null,
          filter_min_spent: form.filter_min_spent || null,
          filter_max_spent: form.filter_max_spent || null,
          message_interval_seconds: form.message_interval_seconds,
          daily_limit: form.daily_limit,
          start_hour: form.start_hour,
          end_hour: form.end_hour,
          pause_after_messages: form.pause_enabled ? form.pause_after_messages : 0,
          pause_duration_seconds: form.pause_duration_seconds,
          status: 'draft',
        })
        .select()
        .single();

      if (createError || !campaign) throw createError;
      
      const campaignData = campaign as any;

      // Etapa 2: Aplicando filtros
      setValidationStage('Aplicando filtros de segmentação...');
      setValidationProgress(40);
      await new Promise(r => setTimeout(r, 300));

      // Etapa 3: Verificando números
      setValidationStage('Verificando números WhatsApp...');
      setValidationProgress(60);

      // Fazer preview
      const response = await supabase.functions.invoke('whatsapp-campaign', {
        body: { action: 'preview', campaignId: campaignData.id, storeId },
      });

      if (response.error) throw response.error;

      // Etapa 4: Finalizando
      setValidationStage('Finalizando...');
      setValidationProgress(90);
      await new Promise(r => setTimeout(r, 200));

      setPreviewData({
        ...response.data,
        campaignId: campaignData.id,
      });
      
      setValidationProgress(100);
      setValidationStage('Concluído!');
      await new Promise(r => setTimeout(r, 300));

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer preview",
        variant: "destructive",
      });
    } finally {
      setPreviewing(false);
      setTimeout(() => {
        setValidationStage('');
        setValidationProgress(0);
      }, 500);
    }
  };

  // Parsear e adicionar contatos manuais
  const parseManualContacts = () => {
    const lines = manualContactsInput.trim().split('\n').filter(l => l.trim());
    const parsed: typeof manualContacts = [];
    
    for (const line of lines) {
      // Suporta: "Nome, Telefone" ou "Nome | Telefone" ou "Nome - Telefone" ou "Nome;Telefone"
      const parts = line.split(/[,|;\-]/).map(p => p.trim());
      if (parts.length >= 2) {
        const name = parts[0];
        const phone = parts[1].replace(/\D/g, '');
        if (phone.length >= 10) {
          // Verificar se já existe
          if (!parsed.some(c => c.phone === phone) && 
              !manualContacts.some(c => c.phone === phone)) {
            parsed.push({ name, phone, valid: null, selected: true });
          }
        }
      }
    }
    
    if (parsed.length === 0) {
      toast({
        title: "Nenhum contato válido",
        description: "Use o formato: Nome, Telefone (um por linha)",
        variant: "destructive",
      });
      return;
    }
    
    setManualContacts(prev => [...prev, ...parsed]);
    setManualContactsInput('');
    toast({
      title: `${parsed.length} contatos adicionados!`,
      description: "Valide os números antes de enviar",
    });
  };

  // Validar contatos manuais
  const validateManualContacts = async () => {
    const pending = manualContacts.filter(c => c.valid === null);
    if (pending.length === 0) {
      toast({ title: "Todos já validados" });
      return;
    }
    
    setValidatingManual(true);
    try {
      let validCount = 0;
      let invalidCount = 0;
      
      for (let i = 0; i < pending.length; i++) {
        const contact = pending[i];
        const fullPhone = contact.phone.startsWith('55') ? contact.phone : `55${contact.phone}`;
        
        try {
          const { data } = await supabase.functions.invoke('validate-whatsapp-number', {
            body: { phone: fullPhone, sendWelcome: false }
          });
          
          setManualContacts(prev => prev.map(c => 
            c.phone === contact.phone 
              ? { ...c, valid: data?.valid === true }
              : c
          ));
          
          if (data?.valid) validCount++;
          else invalidCount++;
        } catch {
          setManualContacts(prev => prev.map(c => 
            c.phone === contact.phone ? { ...c, valid: false } : c
          ));
          invalidCount++;
        }
        
        // Pequeno delay entre validações
        if (i < pending.length - 1) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
      
      toast({
        title: "Validação concluída!",
        description: `${validCount} válidos, ${invalidCount} inválidos`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao validar",
        variant: "destructive",
      });
    } finally {
      setValidatingManual(false);
    }
  };

  // Remover contato manual
  const removeManualContact = (phone: string) => {
    setManualContacts(prev => prev.filter(c => c.phone !== phone));
  };

  // Toggle seleção de contato manual
  const toggleManualContact = (phone: string) => {
    setManualContacts(prev => prev.map(c => 
      c.phone === phone ? { ...c, selected: !c.selected } : c
    ));
  };

  // Buscar clientes da base
  const searchCustomers = async (query: string) => {
    if (!query || query.length < 2) {
      setCustomerSearchResults([]);
      return;
    }
    
    setSearchingCustomers(true);
    try {
      // Buscar clientes que batem com nome ou telefone
      const { data } = await supabase
        .from('customer_stores')
        .select(`
          customer:customers(id, name, phone, whatsapp_valid)
        `)
        .eq('store_id', storeId)
        .limit(10);
      
      if (data) {
        // Filtrar por nome ou telefone no frontend (mais flexível)
        const results = data
          .map((cs: any) => cs.customer)
          .filter(Boolean)
          .filter((c: any) => {
            const nameMatch = c.name?.toLowerCase().includes(query.toLowerCase());
            const phoneMatch = c.phone?.replace(/\D/g, '').includes(query.replace(/\D/g, ''));
            return nameMatch || phoneMatch;
          })
          .slice(0, 5);
        
        setCustomerSearchResults(results);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setSearchingCustomers(false);
    }
  };

  // Adicionar cliente da busca à lista manual
  const addCustomerFromSearch = (customer: any) => {
    const phone = customer.phone?.replace(/\D/g, '') || '';
    
    // Verificar se já existe
    if (manualContacts.some(c => c.phone === phone)) {
      toast({
        title: "Cliente já adicionado",
        description: `${customer.name} já está na lista`,
      });
      return;
    }
    
    setManualContacts(prev => [...prev, {
      name: customer.name,
      phone: phone,
      valid: customer.whatsapp_valid,
      selected: true,
    }]);
    
    setCustomerSearchQuery('');
    setCustomerSearchResults([]);
    
    toast({
      title: "Cliente adicionado!",
      description: `${customer.name} foi adicionado à lista`,
    });
  };

  const startCampaign = async () => {
    if (!previewData?.campaignId) {
      toast({
        title: "Erro",
        description: "Faça o preview primeiro",
        variant: "destructive",
      });
      return;
    }

    // Contatos manuais selecionados e válidos
    const selectedManualContacts = manualContacts
      .filter(c => c.selected && c.valid !== false)
      .map(c => ({ name: c.name, phone: c.phone }));

    if (previewData.totalRecipients === 0 && selectedManualContacts.length === 0) {
      toast({
        title: "Erro",
        description: "Nenhum destinatário selecionado",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Verificar se é agendamento
      const isScheduled = form.schedule_type === 'scheduled';
      let scheduledStartAt = null;
      
      if (isScheduled) {
        scheduledStartAt = new Date(form.scheduled_date + 'T' + form.scheduled_time).toISOString();
      }

      // Atualizar nome, descrição e configurações antes de iniciar
      await supabase
        .from('whatsapp_campaigns' as any)
        .update({
          name: form.name,
          description: form.description,
          custom_message: form.custom_message,
          media_url: form.media_url || null,
          media_type: form.media_type || null,
          pause_after_messages: form.pause_enabled ? form.pause_after_messages : 0,
          pause_duration_seconds: form.pause_duration_seconds,
          scheduled_start_at: scheduledStartAt,
          status: isScheduled ? 'scheduled' : 'draft',
        })
        .eq('id', previewData.campaignId);

      if (isScheduled) {
        // Apenas salvar como agendada
        toast({
          title: "Campanha Agendada!",
          description: `Será iniciada em ${new Date(scheduledStartAt!).toLocaleDateString('pt-BR')} às ${form.scheduled_time}`,
        });
        navigate('/dashboard/whatsapp/campaigns');
        return;
      }

      // Iniciar campanha imediatamente - incluir contatos manuais
      const response = await supabase.functions.invoke('whatsapp-campaign', {
        body: { 
          action: 'start', 
          campaignId: previewData.campaignId, 
          storeId,
          manualContacts: selectedManualContacts,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Campanha Iniciada!",
        description: `${response.data.totalMessages} mensagens serão enviadas`,
      });

      navigate('/dashboard/whatsapp/campaigns');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao iniciar campanha",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    if (!form.name || !form.custom_message.trim()) {
      toast({
        title: "Erro",
        description: "Preencha o nome e a mensagem",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (previewData?.campaignId) {
        // Atualizar rascunho existente
        await supabase
          .from('whatsapp_campaigns' as any)
          .update({
            name: form.name,
            description: form.description,
            template_id: form.template_id || null,
            custom_message: form.custom_message,
            media_url: form.media_url || null,
            media_type: form.media_type || null,
            filter_days_inactive: form.filter_days_inactive || null,
            filter_min_orders: form.filter_min_orders || null,
            filter_max_orders: form.filter_max_orders || null,
            filter_min_spent: form.filter_min_spent || null,
            filter_max_spent: form.filter_max_spent || null,
            message_interval_seconds: form.message_interval_seconds,
            daily_limit: form.daily_limit,
            start_hour: form.start_hour,
            end_hour: form.end_hour,
            pause_after_messages: form.pause_enabled ? form.pause_after_messages : 0,
            pause_duration_seconds: form.pause_duration_seconds,
          })
          .eq('id', previewData.campaignId);
      } else {
        // Criar novo rascunho
        await supabase
          .from('whatsapp_campaigns' as any)
          .insert({
            store_id: storeId,
            name: form.name,
            description: form.description,
            template_id: form.template_id || null,
            custom_message: form.custom_message,
            media_url: form.media_url || null,
            media_type: form.media_type || null,
            filter_days_inactive: form.filter_days_inactive || null,
            filter_min_orders: form.filter_min_orders || null,
            filter_max_orders: form.filter_max_orders || null,
            filter_min_spent: form.filter_min_spent || null,
            filter_max_spent: form.filter_max_spent || null,
            message_interval_seconds: form.message_interval_seconds,
            daily_limit: form.daily_limit,
            start_hour: form.start_hour,
            end_hour: form.end_hour,
            pause_after_messages: form.pause_enabled ? form.pause_after_messages : 0,
            pause_duration_seconds: form.pause_duration_seconds,
            status: 'draft',
          });
      }

      toast({
        title: "Sucesso",
        description: "Rascunho salvo",
      });

      navigate('/dashboard/whatsapp/campaigns');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Salvar apenas mensagem e mídia
  const saveMessage = async () => {
    if (!form.custom_message.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem para salvar",
        variant: "destructive",
      });
      return;
    }

    setSavingMessage(true);
    try {
      if (previewData?.campaignId) {
        // Atualizar mensagem em campanha existente
        await supabase
          .from('whatsapp_campaigns' as any)
          .update({
            custom_message: form.custom_message,
            media_url: form.media_url || null,
            media_type: form.media_type || null,
          })
          .eq('id', previewData.campaignId);
      } else {
        // Criar rascunho apenas com mensagem
        const { data: campaign } = await supabase
          .from('whatsapp_campaigns' as any)
          .insert({
            store_id: storeId,
            name: form.name || 'Rascunho - ' + new Date().toLocaleDateString('pt-BR'),
            custom_message: form.custom_message,
            media_url: form.media_url || null,
            media_type: form.media_type || null,
            status: 'draft',
          })
          .select()
          .single();

        if (campaign) {
          setPreviewData((prev: any) => ({ ...prev, campaignId: (campaign as any).id }));
        }
      }

      toast({
        title: "Mensagem salva!",
        description: "Você pode continuar configurando a campanha",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar",
        variant: "destructive",
      });
    } finally {
      setSavingMessage(false);
    }
  };

  const getMediaIcon = () => {
    switch (form.media_type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      default: return <Upload className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/whatsapp/campaigns')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nova Campanha</h1>
          <p className="text-muted-foreground">
            Configure e inicie uma campanha de recuperação
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações da Campanha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Campanha *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Recuperação Dezembro 2024"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descrição opcional..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card Segmentação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Segmentação
              </CardTitle>
              <CardDescription>
                Defina quais clientes receberão as mensagens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Dias inativos (mínimo)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[form.filter_days_inactive]}
                    onValueChange={([v]) => setForm(prev => ({ ...prev, filter_days_inactive: v }))}
                    min={0}
                    max={90}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-16 text-right">{form.filter_days_inactive} dias</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Clientes que não compram há pelo menos X dias
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mín. pedidos</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.filter_min_orders}
                    onChange={(e) => setForm(prev => ({ ...prev, filter_min_orders: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Máx. pedidos</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.filter_max_orders}
                    onChange={(e) => setForm(prev => ({ ...prev, filter_max_orders: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mín. gasto (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.filter_min_spent}
                    onChange={(e) => setForm(prev => ({ ...prev, filter_min_spent: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Máx. gasto (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={form.filter_max_spent}
                    onChange={(e) => setForm(prev => ({ ...prev, filter_max_spent: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              {/* Filtro por Etiquetas */}
              {labels.length > 0 && (
                <div className="space-y-3">
                  <Label>Filtrar por etiquetas</Label>
                  <div className="flex flex-wrap gap-2">
                    {labels.map((label: any) => (
                      <div
                        key={label.id}
                        onClick={() => {
                          setForm(prev => ({
                            ...prev,
                            filter_label_ids: prev.filter_label_ids.includes(label.id)
                              ? prev.filter_label_ids.filter(id => id !== label.id)
                              : [...prev.filter_label_ids, label.id]
                          }));
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all ${
                          form.filter_label_ids.includes(label.id)
                            ? 'ring-2 ring-primary ring-offset-2'
                            : 'opacity-60 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: label.color + '30', color: label.color }}
                      >
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: label.color }}
                        />
                        <span className="text-sm font-medium">{label.name}</span>
                        <span className="text-xs opacity-70">({label.contacts_count || 0})</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enviar apenas para contatos com as etiquetas selecionadas
                  </p>
                </div>
              )}

              {/* Incluir contatos importados */}
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="include_imported"
                  checked={form.include_imported_contacts}
                  onCheckedChange={(checked) => 
                    setForm(prev => ({ ...prev, include_imported_contacts: checked === true }))
                  }
                />
                <label
                  htmlFor="include_imported"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Incluir contatos importados
                </label>
              </div>
              <p className="text-xs text-muted-foreground -mt-1">
                Além de clientes, incluir contatos da aba "Contatos WhatsApp"
              </p>
            </CardContent>
          </Card>

          {/* Card Configuração de Envio */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Configuração de Envio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Intervalo entre mensagens</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[form.message_interval_seconds]}
                    onValueChange={([v]) => setForm(prev => ({ ...prev, message_interval_seconds: v }))}
                    min={10}
                    max={300}
                    step={5}
                    className="flex-1"
                  />
                  <span className="w-20 text-right font-medium">{formatTime(form.message_interval_seconds)}</span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Timer className="h-3 w-3" />
                  Envios entre {formatTime(Math.floor(form.message_interval_seconds * 0.75))} e {formatTime(form.message_interval_seconds)} (humanizado)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Limite diário de envios</Label>
                <Input
                  type="number"
                  min="1"
                  max="500"
                  value={form.daily_limit}
                  onChange={(e) => setForm(prev => ({ ...prev, daily_limit: parseInt(e.target.value) || 100 }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Hora início</Label>
                  <Select
                    value={String(form.start_hour)}
                    onValueChange={(v) => setForm(prev => ({ ...prev, start_hour: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>{String(i).padStart(2, '0')}:00</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Hora fim</Label>
                  <Select
                    value={String(form.end_hour)}
                    onValueChange={(v) => setForm(prev => ({ ...prev, end_hour: parseInt(v) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>{String(i).padStart(2, '0')}:00</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Anti-Bloqueio */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Configurações Anti-Bloqueio
              </CardTitle>
              <CardDescription>
                Pausas estratégicas para evitar detecção
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pause_enabled"
                  checked={form.pause_enabled}
                  onCheckedChange={(checked) => setForm(prev => ({ ...prev, pause_enabled: !!checked }))}
                />
                <label
                  htmlFor="pause_enabled"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Ativar pausas por lote
                </label>
              </div>

              {form.pause_enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Pausar a cada X mensagens</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[form.pause_after_messages]}
                        onValueChange={([v]) => setForm(prev => ({ ...prev, pause_after_messages: v }))}
                        min={5}
                        max={50}
                        step={5}
                        className="flex-1"
                      />
                      <span className="w-24 text-right">{form.pause_after_messages} msgs</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Duração da pausa</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[form.pause_duration_seconds]}
                        onValueChange={([v]) => setForm(prev => ({ ...prev, pause_duration_seconds: v }))}
                        min={30}
                        max={300}
                        step={10}
                        className="flex-1"
                      />
                      <span className="w-20 text-right">{formatTime(form.pause_duration_seconds)}</span>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="text-muted-foreground">
                      📌 A cada <strong>{form.pause_after_messages} envios</strong>, o sistema pausará por <strong>{formatTime(form.pause_duration_seconds)}</strong>
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLUNA DIREITA - Preview e Ações em primeiro */}
        <div className="space-y-6">
          {/* Card Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </CardTitle>
              <CardDescription>
                Veja quantos clientes serão impactados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={previewCampaign} disabled={previewing} className="w-full">
                {previewing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {validationStage || 'Calculando...'}
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Calcular Destinatários
                  </>
                )}
              </Button>

              {/* Barra de progresso animada */}
              {previewing && validationProgress > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300 ease-out"
                      style={{ width: `${validationProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    {validationStage}
                  </p>
                </div>
              )}

              {previewData && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{previewData.totalRecipients}</p>
                    <p className="text-sm text-muted-foreground">clientes serão contatados</p>
                  </div>

                  {/* Estimativa de tempo */}
                  {calculateEstimate() && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-1">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Timer className="h-4 w-4 text-primary" />
                        Estimativa de Tempo
                      </p>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>• Tempo total: <strong className="text-foreground">{calculateEstimate()?.time}</strong></p>
                        <p>• Intervalo médio: <strong className="text-foreground">{calculateEstimate()?.avgInterval}</strong></p>
                        {form.pause_enabled && calculateEstimate()!.pauseCount > 0 && (
                          <p>• {calculateEstimate()?.pauseCount} pausas de {formatTime(form.pause_duration_seconds)}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats de validação */}
                  {previewData.validationStats && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-green-500/10 rounded-lg p-2">
                        <p className="text-sm font-bold text-green-600">{previewData.validationStats.valid}</p>
                        <p className="text-[10px] text-muted-foreground">Válidos</p>
                      </div>
                      <div className="bg-destructive/10 rounded-lg p-2">
                        <p className="text-sm font-bold text-destructive">{previewData.validationStats.invalid}</p>
                        <p className="text-[10px] text-muted-foreground">Inválidos</p>
                      </div>
                      <div className="bg-secondary rounded-lg p-2">
                        <p className="text-sm font-bold">{previewData.validationStats.pending}</p>
                        <p className="text-[10px] text-muted-foreground">Pendentes</p>
                      </div>
                    </div>
                  )}

                  {/* Botão validar pendentes */}
                  {previewData.validationStats?.pending > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={validateBatchNumbers}
                      disabled={validatingBatch}
                    >
                      {validatingBatch ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Validando...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Validar {previewData.validationStats.pending} Números Pendentes
                        </>
                      )}
                    </Button>
                  )}

                  {previewData.sampleRecipients?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Destinatários ({previewData.sampleRecipients.length} de {previewData.totalRecipients}):</p>
                      <div className="space-y-2">
                        {previewData.sampleRecipients.map((r: any, i: number) => (
                          <div key={i} className="text-xs bg-background p-2 rounded border">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium">{r.name}</p>
                              {r.whatsapp_valid === true && (
                                <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-1.5">
                                  <CheckCircle className="w-3 h-3 mr-0.5" />
                                  Válido
                                </Badge>
                              )}
                              {r.whatsapp_valid === false && (
                                <Badge variant="destructive" className="text-[10px] px-1.5">
                                  <XCircle className="w-3 h-3 mr-0.5" />
                                  Inválido
                                </Badge>
                              )}
                              {r.whatsapp_valid === null && (
                                <Badge variant="secondary" className="text-[10px] px-1.5">
                                  <HelpCircle className="w-3 h-3 mr-0.5" />
                                  Pendente
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {formatPhone(r.phone)}
                            </p>
                            <p className="text-muted-foreground">
                              {r.total_orders} pedidos | Último: {r.last_order_at ? new Date(r.last_order_at).toLocaleDateString('pt-BR') : 'Nunca'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card Contatos Manuais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-4 w-4" />
                Adicionar Contatos
              </CardTitle>
              <CardDescription>
                Busque clientes da base ou adicione manualmente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Buscar cliente da base */}
              <div className="space-y-2">
                <Label className="text-sm">Buscar Cliente</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Digite nome ou telefone..."
                    value={customerSearchQuery}
                    onChange={(e) => {
                      setCustomerSearchQuery(e.target.value);
                      searchCustomers(e.target.value);
                    }}
                    className="pl-9"
                  />
                  {searchingCustomers && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                
                {/* Resultados da busca */}
                {customerSearchResults.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    {customerSearchResults.map((customer, i) => (
                      <div
                        key={customer.id}
                        className={cn(
                          "flex items-center justify-between p-2 hover:bg-muted/50 cursor-pointer text-sm",
                          i > 0 && "border-t"
                        )}
                        onClick={() => addCustomerFromSearch(customer)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{customer.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {formatPhone(customer.phone)}
                          </p>
                        </div>
                        {customer.whatsapp_valid === true && (
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                        )}
                        {customer.whatsapp_valid === false && (
                          <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        )}
                        {customer.whatsapp_valid === null && (
                          <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Separador */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex-1 h-px bg-border" />
                <span>ou cole manualmente</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-2">
                <Textarea
                  placeholder="Maria Silva, 11999887766
João Santos, 21988776655
Ana Costa, 31977665544"
                  value={manualContactsInput}
                  onChange={(e) => setManualContactsInput(e.target.value)}
                  rows={4}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Formato: Nome, Telefone (aceita vírgula, ponto-e-vírgula ou traço como separador)
                </p>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={parseManualContacts}
                disabled={!manualContactsInput.trim()}
              >
                <Users className="h-4 w-4 mr-2" />
                Adicionar à Lista
              </Button>

              {manualContacts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {manualContacts.length} contatos adicionados
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={validateManualContacts}
                      disabled={validatingManual || manualContacts.every(c => c.valid !== null)}
                    >
                      {validatingManual ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Validando...
                        </>
                      ) : (
                        <>
                          <Shield className="h-3 w-3 mr-1" />
                          Validar
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Stats de contatos manuais */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-green-500/10 rounded p-1.5">
                      <p className="font-bold text-green-600">{manualContacts.filter(c => c.valid === true).length}</p>
                      <p className="text-muted-foreground">Válidos</p>
                    </div>
                    <div className="bg-destructive/10 rounded p-1.5">
                      <p className="font-bold text-destructive">{manualContacts.filter(c => c.valid === false).length}</p>
                      <p className="text-muted-foreground">Inválidos</p>
                    </div>
                    <div className="bg-secondary rounded p-1.5">
                      <p className="font-bold">{manualContacts.filter(c => c.valid === null).length}</p>
                      <p className="text-muted-foreground">Pendentes</p>
                    </div>
                  </div>

                  {/* Lista de contatos manuais */}
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {manualContacts.map((contact, i) => (
                      <div 
                        key={i} 
                        className={cn(
                          "flex items-center gap-2 p-2 rounded border text-xs",
                          contact.valid === false && "opacity-50",
                          contact.selected ? "bg-primary/5 border-primary/20" : "bg-background"
                        )}
                      >
                        <Checkbox
                          checked={contact.selected}
                          onCheckedChange={() => toggleManualContact(contact.phone)}
                          disabled={contact.valid === false}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{contact.name}</p>
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {formatPhone(contact.phone)}
                          </p>
                        </div>
                        {contact.valid === true && (
                          <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                        )}
                        {contact.valid === false && (
                          <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        )}
                        {contact.valid === null && (
                          <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => removeManualContact(contact.phone)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {manualContacts.filter(c => c.selected && c.valid !== false).length > 0 && (
                    <p className="text-xs text-center text-muted-foreground">
                      {manualContacts.filter(c => c.selected && c.valid !== false).length} serão incluídos na campanha
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card Agendamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                Quando enviar?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={form.schedule_type}
                onValueChange={(v) => setForm(prev => ({ ...prev, schedule_type: v as 'now' | 'scheduled' }))}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="now" id="now" />
                  <label htmlFor="now" className="text-sm font-medium cursor-pointer">
                    Enviar agora
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <label htmlFor="scheduled" className="text-sm font-medium cursor-pointer">
                    Agendar para depois
                  </label>
                </div>
              </RadioGroup>

              {form.schedule_type === 'scheduled' && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Data
                    </Label>
                    <Input
                      type="date"
                      value={form.scheduled_date}
                      onChange={(e) => setForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Hora
                    </Label>
                    <Input
                      type="time"
                      value={form.scheduled_time}
                      onChange={(e) => setForm(prev => ({ ...prev, scheduled_time: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {form.schedule_type === 'scheduled' && form.scheduled_date && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
                  <p className="text-muted-foreground">
                    📅 A campanha será iniciada automaticamente em{' '}
                    <strong className="text-foreground">
                      {new Date(form.scheduled_date + 'T' + form.scheduled_time).toLocaleDateString('pt-BR', { 
                        day: '2-digit', month: '2-digit', year: 'numeric' 
                      })} às {form.scheduled_time}
                    </strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card Ações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={startCampaign} 
                disabled={loading || !previewData || previewData.totalRecipients === 0 || (form.schedule_type === 'scheduled' && !form.scheduled_date)}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {form.schedule_type === 'scheduled' ? 'Agendando...' : 'Iniciando...'}
                  </>
                ) : form.schedule_type === 'scheduled' ? (
                  <>
                    <CalendarClock className="h-4 w-4 mr-2" />
                    Agendar Campanha
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Iniciar Campanha
                  </>
                )}
              </Button>

              <Button 
                variant="outline" 
                onClick={saveDraft} 
                disabled={loading}
                className="w-full"
              >
                Salvar como Rascunho
              </Button>

              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard/whatsapp/campaigns')}
                className="w-full"
              >
                Cancelar
              </Button>
            </CardContent>
          </Card>

          {/* Card de Mensagem Unificado (com mídia integrada) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Mensagem da Campanha *
              </CardTitle>
              <CardDescription>
                Escreva a mensagem ou use um template como base
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Seletor de template como base */}
              <div className="space-y-2">
                <Label>Usar template como base (opcional)</Label>
                <Select
                  value={form.template_id}
                  onValueChange={(v) => {
                    setForm(prev => ({ ...prev, template_id: v }));
                    const template = templates.find(t => t.id === v);
                    if (template) {
                      setForm(prev => ({ ...prev, custom_message: template.content }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Textarea para mensagem customizada */}
              <div className="space-y-2">
                <Label>Mensagem *</Label>
                <Textarea
                  value={form.custom_message}
                  onChange={(e) => setForm(prev => ({ ...prev, custom_message: e.target.value }))}
                  placeholder="Digite sua mensagem aqui..."
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              {/* Variáveis disponíveis */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Variáveis disponíveis (clique para inserir):</p>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(variableDescriptions).map(([variable, desc]) => (
                    <Badge 
                      key={variable} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                      onClick={() => insertVariable(variable)}
                      title={desc}
                    >
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Seção de Mídia Integrada */}
              <div className="space-y-2 pt-2 border-t">
                <Label className="flex items-center gap-2">
                  {getMediaIcon()}
                  Mídia (opcional)
                </Label>
                {mediaPreview || form.media_url ? (
                  <div className="relative">
                    {form.media_type === 'image' && (
                      <img 
                        src={mediaPreview || form.media_url} 
                        alt="Preview" 
                        className="w-full max-h-40 object-contain rounded-lg bg-muted"
                      />
                    )}
                    {form.media_type === 'video' && (
                      <video 
                        src={mediaPreview || form.media_url} 
                        className="w-full max-h-40 rounded-lg bg-muted" 
                        controls 
                      />
                    )}
                    {form.media_type === 'document' && (
                      <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                        <FileText className="h-8 w-8 text-primary" />
                        <span className="text-sm truncate">{mediaFile?.name || 'Documento'}</span>
                      </div>
                    )}
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="absolute top-2 right-2"
                      onClick={removeMedia}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    {uploadingMedia ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Enviando...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">
                          Arraste ou clique para enviar imagem/vídeo
                        </span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*,video/*,.pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleMediaUpload(file);
                      }}
                      disabled={uploadingMedia}
                    />
                  </label>
                )}
              </div>

              {/* Preview da mensagem com mockup de celular */}
              {form.custom_message && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-center gap-2">
                    <Eye className="h-4 w-4 text-green-600" />
                    <Label className="text-sm font-medium">Preview WhatsApp</Label>
                  </div>
                  
                  {/* Mockup de celular */}
                  <WhatsAppPhonePreview
                    storeName={storeName || 'Sua Loja'}
                    message={renderMessagePreview(form.custom_message)}
                    mediaUrl={mediaPreview || form.media_url}
                    mediaType={form.media_type as 'image' | 'video' | 'document'}
                    showTypingAnimation={true}
                    playNotificationSound={true}
                    allowThemeToggle={true}
                  />

                  {/* Legenda de variáveis usadas */}
                  {detectVariables(form.custom_message).length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                      <p className="font-medium text-muted-foreground mb-2">Variáveis utilizadas:</p>
                      {detectVariables(form.custom_message).map((variable) => (
                        <div key={variable} className="flex items-center gap-2">
                          <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px]">
                            {variable}
                          </code>
                          <span className="text-muted-foreground">
                            {variableDescriptions[variable] || 'Variável personalizada'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Botão Salvar Mensagem */}
              <Button 
                onClick={saveMessage} 
                disabled={savingMessage || !form.custom_message.trim()}
                variant="secondary"
                className="w-full"
              >
                {savingMessage ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Mensagem
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Card de Teste */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Testar Envio
              </CardTitle>
              <CardDescription>
                Envie uma mensagem de teste para seu WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Número para teste</Label>
                <div className="relative">
                  <Input
                    placeholder="Ex: 11941941427"
                    value={testNumber}
                    onChange={(e) => {
                      setTestNumber(e.target.value);
                      setTestNumberValid(null);
                      setValidationStep('');
                    }}
                    disabled={validatingTestNumber}
                    className={cn(
                      "pr-10",
                      testNumberValid === true && "border-green-500 focus-visible:ring-green-500",
                      testNumberValid === false && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {testNumberValid === true && (
                    <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                  )}
                  {testNumberValid === false && (
                    <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
                  )}
                </div>
                
                {validatingTestNumber && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {validationStep}
                  </div>
                )}
                
                {!validatingTestNumber && validationStep && (
                  <p className={cn(
                    "text-sm",
                    testNumberValid === true && "text-green-600",
                    testNumberValid === false && "text-red-600"
                  )}>
                    {testNumberValid === true ? '✅' : '❌'} {validationStep}
                  </p>
                )}
                
                {!validationStep && !validatingTestNumber && (
                  <p className="text-xs text-muted-foreground">
                    As variáveis serão substituídas por dados de exemplo
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                {/* Botão Validar Número */}
                <Button 
                  onClick={validateTestNumber} 
                  disabled={validatingTestNumber || testNumber.replace(/\D/g, '').length < 10}
                  variant={testNumberValid ? "default" : "secondary"}
                  className={cn(
                    "flex-1",
                    testNumberValid && "bg-green-600 hover:bg-green-700"
                  )}
                >
                  {validatingTestNumber ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validando...
                    </>
                  ) : testNumberValid ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Validado
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Validar Número
                    </>
                  )}
                </Button>

                {/* Botão Enviar Teste */}
                <Button 
                  onClick={sendTestMessage} 
                  disabled={sendingTest || !form.custom_message.trim() || !testNumberValid}
                  variant="outline"
                  className="flex-1"
                >
                  {sendingTest ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Teste
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
