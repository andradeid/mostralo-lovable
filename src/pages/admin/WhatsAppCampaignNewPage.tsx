import { useState, useEffect } from "react";
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
import { 
  Loader2, 
  ArrowLeft,
  Users,
  Clock,
  Filter,
  Send,
  Eye,
  MessageCircle
} from "lucide-react";

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
  const [previewData, setPreviewData] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<SelectedTemplate | null>(null);
  const [storeName, setStoreName] = useState<string>('');
  const [storeSlug, setStoreSlug] = useState<string>('');
  
  const [form, setForm] = useState({
    name: '',
    description: '',
    template_id: '',
    filter_days_inactive: 7,
    filter_min_orders: 0,
    filter_max_orders: 0,
    filter_min_spent: 0,
    filter_max_spent: 0,
    message_interval_seconds: 30,
    daily_limit: 100,
    start_hour: 9,
    end_hour: 21,
  });

  useEffect(() => {
    if (storeId) {
      fetchTemplates();
      fetchStoreInfo();
    }
  }, [storeId]);

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

  const previewCampaign = async () => {
    if (!form.template_id) {
      toast({
        title: "Erro",
        description: "Selecione um template primeiro",
        variant: "destructive",
      });
      return;
    }

    setPreviewing(true);
    try {
      // Primeiro, criar a campanha como rascunho
      const { data: campaign, error: createError } = await supabase
        .from('whatsapp_campaigns' as any)
        .insert({
          store_id: storeId,
          name: form.name || 'Campanha Preview',
          description: form.description,
          template_id: form.template_id,
          filter_days_inactive: form.filter_days_inactive || null,
          filter_min_orders: form.filter_min_orders || null,
          filter_max_orders: form.filter_max_orders || null,
          filter_min_spent: form.filter_min_spent || null,
          filter_max_spent: form.filter_max_spent || null,
          message_interval_seconds: form.message_interval_seconds,
          daily_limit: form.daily_limit,
          start_hour: form.start_hour,
          end_hour: form.end_hour,
          status: 'draft',
        })
        .select()
        .single();

      if (createError || !campaign) throw createError;
      
      const campaignData = campaign as any;

      // Fazer preview
      const response = await supabase.functions.invoke('whatsapp-campaign', {
        body: { action: 'preview', campaignId: campaignData.id, storeId },
      });

      if (response.error) throw response.error;

      setPreviewData({
        ...response.data,
        campaignId: campaignData.id,
      });

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer preview",
        variant: "destructive",
      });
    } finally {
      setPreviewing(false);
    }
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

    if (previewData.totalRecipients === 0) {
      toast({
        title: "Erro",
        description: "Nenhum cliente encontrado com os filtros selecionados",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Atualizar nome e descrição antes de iniciar
      await supabase
        .from('whatsapp_campaigns' as any)
        .update({
          name: form.name,
          description: form.description,
        })
        .eq('id', previewData.campaignId);

      // Iniciar campanha
      const response = await supabase.functions.invoke('whatsapp-campaign', {
        body: { action: 'start', campaignId: previewData.campaignId, storeId },
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
    if (!form.name || !form.template_id) {
      toast({
        title: "Erro",
        description: "Preencha o nome e selecione um template",
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
            template_id: form.template_id,
            filter_days_inactive: form.filter_days_inactive || null,
            filter_min_orders: form.filter_min_orders || null,
            filter_max_orders: form.filter_max_orders || null,
            filter_min_spent: form.filter_min_spent || null,
            filter_max_spent: form.filter_max_spent || null,
            message_interval_seconds: form.message_interval_seconds,
            daily_limit: form.daily_limit,
            start_hour: form.start_hour,
            end_hour: form.end_hour,
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
            template_id: form.template_id,
            filter_days_inactive: form.filter_days_inactive || null,
            filter_min_orders: form.filter_min_orders || null,
            filter_max_orders: form.filter_max_orders || null,
            filter_min_spent: form.filter_min_spent || null,
            filter_max_spent: form.filter_max_spent || null,
            message_interval_seconds: form.message_interval_seconds,
            daily_limit: form.daily_limit,
            start_hour: form.start_hour,
            end_hour: form.end_hour,
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
              <div className="space-y-2">
                <Label>Template de Mensagem *</Label>
                <Select
                  value={form.template_id}
                  onValueChange={(v) => setForm(prev => ({ ...prev, template_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {templates.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Nenhum template disponível. <a href="/dashboard/whatsapp/templates" className="text-primary">Crie um template</a>
                  </p>
                )}
              </div>

              {/* Prévia do Template */}
              {selectedTemplate ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-green-600" />
                    <Label className="text-sm font-medium">Prévia da Mensagem</Label>
                  </div>
                  
                  {/* Balão estilo WhatsApp */}
                  <div className="bg-[#dcf8c6] rounded-lg rounded-tr-none p-3 relative max-w-full shadow-sm">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {renderMessagePreview(selectedTemplate.content)}
                    </p>
                    <span className="text-[10px] text-gray-500 float-right mt-1">
                      {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Legenda de variáveis */}
                  {detectVariables(selectedTemplate.content).length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                      <p className="font-medium text-muted-foreground mb-2">Variáveis utilizadas:</p>
                      {detectVariables(selectedTemplate.content).map((variable) => (
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
              ) : (
                <div className="border border-dashed rounded-lg p-4 text-center text-muted-foreground text-sm">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>Selecione um template para visualizar a mensagem</p>
                </div>
              )}
            </CardContent>
          </Card>

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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Configuração de Envio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Intervalo entre mensagens (segundos)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[form.message_interval_seconds]}
                    onValueChange={([v]) => setForm(prev => ({ ...prev, message_interval_seconds: v }))}
                    min={10}
                    max={120}
                    step={5}
                    className="flex-1"
                  />
                  <span className="w-16 text-right">{form.message_interval_seconds}s</span>
                </div>
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
        </div>

        <div className="space-y-6">
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
                    Calculando...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Calcular Destinatários
                  </>
                )}
              </Button>

              {previewData && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">{previewData.totalRecipients}</p>
                    <p className="text-sm text-muted-foreground">clientes serão contatados</p>
                  </div>

                  {previewData.sampleRecipients?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Exemplos:</p>
                      <div className="space-y-2">
                        {previewData.sampleRecipients.map((r: any, i: number) => (
                          <div key={i} className="text-xs bg-background p-2 rounded">
                            <p className="font-medium">{r.name}</p>
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                onClick={startCampaign} 
                disabled={loading || !previewData || previewData.totalRecipients === 0}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Iniciando...
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
        </div>
      </div>
    </div>
  );
}
