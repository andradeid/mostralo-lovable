import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNiches } from '@/hooks/useNiches';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Bot,
  Brain,
  MessageSquare,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Pencil,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Shield,
  Zap,
  Image as ImageIcon,
  Search,
  Package,
  MapPin,
  Tag,
  Store,
  Clock,
  Camera,
  Info,
  History,
} from 'lucide-react';

// Tipos
interface NicheAIConfig {
  id: string;
  niche_id: string;
  bot_mode: string;
  prompt_base: string;
  prompt_restrictions: string;
  enabled_tools: string[];
  max_products_per_response: number;
  vision_enabled: boolean;
  vision_prompt: string;
  send_product_photos: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface NicheAIRule {
  id: string;
  niche_ai_config_id: string;
  name: string;
  description: string;
  rule_type: string;
  trigger_condition: string;
  action_prompt: string;
  is_enabled: boolean;
  sort_order: number;
  custom_phrases: string[];
  created_at: string;
  updated_at: string;
}

// Tools disponíveis
const AVAILABLE_TOOLS = [
  { key: 'search_products', label: 'Buscar Produtos', icon: Search, description: 'Busca produtos no catálogo por termo' },
  { key: 'check_stock', label: 'Verificar Estoque', icon: Package, description: 'Verifica disponibilidade de um produto' },
  { key: 'get_product_details', label: 'Detalhes do Produto', icon: Info, description: 'Obtém detalhes de um produto pelo slug' },
  { key: 'list_categories', label: 'Listar Categorias', icon: Tag, description: 'Lista categorias disponíveis' },
  { key: 'get_promotions', label: 'Promoções', icon: Sparkles, description: 'Retorna produtos em promoção' },
  { key: 'get_recommendations', label: 'Recomendações', icon: Zap, description: 'Retorna produtos recomendados' },
  { key: 'get_store_info', label: 'Info da Loja', icon: Store, description: 'Obtém informações da loja' },
  { key: 'analyze_image', label: 'Análise de Imagem (Vision)', icon: Camera, description: 'Analisa imagem (receita médica, produto)' },
  { key: 'check_store_status', label: 'Status da Loja', icon: Clock, description: 'Verifica se a loja está aberta/fechada' },
  { key: 'calculate_delivery_fee', label: 'Taxa de Entrega', icon: MapPin, description: 'Calcula taxa de entrega por GPS' },
];

const BOT_MODES = [
  { key: 'chat_completion', label: 'Simples (v1)', icon: MessageSquare, description: 'Sem tools - baseado apenas no prompt' },
  { key: 'assistant', label: 'Agente v2', icon: Bot, description: 'Com tools e busca inteligente' },
  { key: 'conversational', label: 'Conversacional', icon: Brain, description: 'Fluxo de pedido guiado' },
];

const RULE_TYPES = [
  { key: 'behavior', label: 'Comportamento', color: 'bg-blue-500/10 text-blue-500' },
  { key: 'restriction', label: 'Restrição', color: 'bg-red-500/10 text-red-500' },
  { key: 'conditional', label: 'Condicional', color: 'bg-amber-500/10 text-amber-500' },
];

const DYNAMIC_VARIABLES = [
  '{{store_name}}', '{{bot_name}}', '{{store_link}}', '{{store_address}}',
  '{{payment_methods}}', '{{business_hours}}', '{{delivery_info}}', '{{custom_instructions}}'
];

export default function NicheAIConfigPage() {
  const queryClient = useQueryClient();
  const { data: niches, isLoading: nichesLoading } = useNiches();
  const [selectedNicheId, setSelectedNicheId] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<string>('assistant');
  const [showPreview, setShowPreview] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<NicheAIRule | null>(null);

  // Estado do formulário de config
  const [configForm, setConfigForm] = useState<Partial<NicheAIConfig>>({
    prompt_base: '',
    prompt_restrictions: '',
    enabled_tools: [],
    max_products_per_response: 3,
    vision_enabled: false,
    vision_prompt: '',
    send_product_photos: true,
    is_active: true,
  });

  // Estado do formulário de regra
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    rule_type: 'behavior',
    trigger_condition: '',
    action_prompt: '',
    is_enabled: true,
    sort_order: 0,
    custom_phrases: [] as string[],
  });

  // Selecionar primeiro nicho ao carregar
  useEffect(() => {
    if (niches && niches.length > 0 && !selectedNicheId) {
      setSelectedNicheId(niches[0].id);
    }
  }, [niches, selectedNicheId]);

  // Buscar config do nicho+modo selecionado
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['niche-ai-config', selectedNicheId, selectedMode],
    queryFn: async () => {
      if (!selectedNicheId) return null;
      const { data, error } = await supabase
        .from('niche_ai_configs')
        .select('*')
        .eq('niche_id', selectedNicheId)
        .eq('bot_mode', selectedMode)
        .maybeSingle();
      if (error) throw error;
      return data as NicheAIConfig | null;
    },
    enabled: !!selectedNicheId,
  });

  // Buscar regras da config
  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ['niche-ai-rules', config?.id],
    queryFn: async () => {
      if (!config?.id) return [];
      const { data, error } = await supabase
        .from('niche_ai_rules')
        .select('*')
        .eq('niche_ai_config_id', config.id)
        .order('sort_order');
      if (error) throw error;
      return data as NicheAIRule[];
    },
    enabled: !!config?.id,
  });

  // Sincronizar form com config carregada
  useEffect(() => {
    if (config) {
      setConfigForm({
        prompt_base: config.prompt_base || '',
        prompt_restrictions: config.prompt_restrictions || '',
        enabled_tools: config.enabled_tools || [],
        max_products_per_response: config.max_products_per_response || 3,
        vision_enabled: config.vision_enabled || false,
        vision_prompt: config.vision_prompt || '',
        send_product_photos: config.send_product_photos ?? true,
        is_active: config.is_active ?? true,
      });
    } else {
      setConfigForm({
        prompt_base: '',
        prompt_restrictions: '',
        enabled_tools: [],
        max_products_per_response: 3,
        vision_enabled: false,
        vision_prompt: '',
        send_product_photos: true,
        is_active: true,
      });
    }
  }, [config]);

  // Mutation: salvar config
  const saveConfig = useMutation({
    mutationFn: async () => {
      if (!selectedNicheId) throw new Error('Selecione um nicho');
      
      const payload = {
        niche_id: selectedNicheId,
        bot_mode: selectedMode,
        prompt_base: configForm.prompt_base || '',
        prompt_restrictions: configForm.prompt_restrictions || '',
        enabled_tools: configForm.enabled_tools || [],
        max_products_per_response: configForm.max_products_per_response || 3,
        vision_enabled: configForm.vision_enabled || false,
        vision_prompt: configForm.vision_prompt || '',
        send_product_photos: configForm.send_product_photos ?? true,
        is_active: configForm.is_active ?? true,
      };

      if (config?.id) {
        const { error } = await supabase
          .from('niche_ai_configs')
          .update(payload)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('niche_ai_configs')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success('Configuração salva com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['niche-ai-config'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Mutation: salvar regra
  const saveRule = useMutation({
    mutationFn: async () => {
      if (!config?.id) throw new Error('Salve a configuração primeiro');

      const payload = {
        niche_ai_config_id: config.id,
        name: ruleForm.name,
        description: ruleForm.description,
        rule_type: ruleForm.rule_type,
        trigger_condition: ruleForm.trigger_condition,
        action_prompt: ruleForm.action_prompt,
        is_enabled: ruleForm.is_enabled,
        sort_order: ruleForm.sort_order,
        custom_phrases: ruleForm.custom_phrases,
      };

      if (editingRule) {
        const { error } = await supabase
          .from('niche_ai_rules')
          .update(payload)
          .eq('id', editingRule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('niche_ai_rules')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingRule ? 'Regra atualizada!' : 'Regra criada!');
      queryClient.invalidateQueries({ queryKey: ['niche-ai-rules'] });
      setRuleDialogOpen(false);
      setEditingRule(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Mutation: deletar regra
  const deleteRule = useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await supabase.from('niche_ai_rules').delete().eq('id', ruleId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Regra removida!');
      queryClient.invalidateQueries({ queryKey: ['niche-ai-rules'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Mutation: toggle regra
  const toggleRule = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('niche_ai_rules')
        .update({ is_enabled: enabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['niche-ai-rules'] }),
    onError: (err: Error) => toast.error(err.message),
  });

  const handleToolToggle = (toolKey: string) => {
    const current = configForm.enabled_tools || [];
    if (current.includes(toolKey)) {
      setConfigForm(prev => ({ ...prev, enabled_tools: current.filter(t => t !== toolKey) }));
    } else {
      setConfigForm(prev => ({ ...prev, enabled_tools: [...current, toolKey] }));
    }
  };

  const openCreateRule = () => {
    setEditingRule(null);
    setRuleForm({
      name: '',
      description: '',
      rule_type: 'behavior',
      trigger_condition: '',
      action_prompt: '',
      is_enabled: true,
      sort_order: (rules?.length || 0) + 1,
      custom_phrases: [],
    });
    setRuleDialogOpen(true);
  };

  const openEditRule = (rule: NicheAIRule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      description: rule.description || '',
      rule_type: rule.rule_type,
      trigger_condition: rule.trigger_condition || '',
      action_prompt: rule.action_prompt,
      is_enabled: rule.is_enabled,
      sort_order: rule.sort_order,
      custom_phrases: rule.custom_phrases || [],
    });
    setRuleDialogOpen(true);
  };

  // Preview do prompt final
  const buildPreview = () => {
    let prompt = configForm.prompt_base || '';
    
    if (rules && rules.length > 0) {
      const enabledRules = rules.filter(r => r.is_enabled);
      if (enabledRules.length > 0) {
        prompt += '\n\n--- REGRAS DO NICHO ---\n';
        enabledRules.forEach(r => {
          prompt += `\n[${r.name}]\n${r.action_prompt}\n`;
        });
      }
    }

    if (configForm.prompt_restrictions) {
      prompt += '\n\n--- RESTRIÇÕES ---\n' + configForm.prompt_restrictions;
    }

    return prompt;
  };

  const selectedNiche = niches?.find(n => n.id === selectedNicheId);
  const selectedModeInfo = BOT_MODES.find(m => m.key === selectedMode);
  const isSimpleMode = selectedMode === 'chat_completion';

  if (nichesLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            IA por Nicho
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure o comportamento da IA para cada nicho de loja
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)} disabled={!config}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={() => saveConfig.mutate()} disabled={saveConfig.isPending || !selectedNicheId}>
            {saveConfig.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
        </div>
      </div>

      {/* Seletor de nicho + modo */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-64">
          <Label>Nicho</Label>
          <Select value={selectedNicheId} onValueChange={setSelectedNicheId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o nicho" />
            </SelectTrigger>
            <SelectContent>
              {niches?.map(n => (
                <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Label>Modo da IA</Label>
          <Tabs value={selectedMode} onValueChange={setSelectedMode}>
            <TabsList className="grid w-full grid-cols-3">
              {BOT_MODES.map(m => (
                <TabsTrigger key={m.key} value={m.key} className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <m.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{m.label}</span>
                  <span className="sm:hidden">{m.label.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {configLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna principal: Prompt + Restrições */}
          <div className="lg:col-span-2 space-y-6">
            {/* Configurações gerais */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Configurações Gerais</CardTitle>
                <CardDescription>Parâmetros de comportamento da IA para {selectedNiche?.name || 'o nicho'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-xs">Produtos por resposta</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={configForm.max_products_per_response || 3}
                      onChange={e => setConfigForm(prev => ({ ...prev, max_products_per_response: parseInt(e.target.value) || 3 }))}
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={configForm.vision_enabled || false}
                        onCheckedChange={v => setConfigForm(prev => ({ ...prev, vision_enabled: v }))}
                      />
                      <Label className="text-xs">Vision (Imagens)</Label>
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={configForm.send_product_photos ?? true}
                        onCheckedChange={v => setConfigForm(prev => ({ ...prev, send_product_photos: v }))}
                      />
                      <Label className="text-xs">Enviar fotos</Label>
                    </div>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={configForm.is_active ?? true}
                        onCheckedChange={v => setConfigForm(prev => ({ ...prev, is_active: v }))}
                      />
                      <Label className="text-xs">Ativo</Label>
                    </div>
                  </div>
                </div>

                {configForm.vision_enabled && (
                  <div>
                    <Label className="text-xs">Prompt de Vision</Label>
                    <Textarea
                      placeholder="Descreva como a IA deve analisar imagens neste nicho..."
                      value={configForm.vision_prompt || ''}
                      onChange={e => setConfigForm(prev => ({ ...prev, vision_prompt: e.target.value }))}
                      rows={3}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prompt Base */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Prompt Base</CardTitle>
                    <CardDescription>Instruções principais para a IA neste nicho</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {DYNAMIC_VARIABLES.map(v => (
                      <Badge
                        key={v}
                        variant="outline"
                        className="text-[10px] cursor-pointer hover:bg-accent"
                        onClick={() => {
                          setConfigForm(prev => ({
                            ...prev,
                            prompt_base: (prev.prompt_base || '') + ' ' + v
                          }));
                        }}
                      >
                        {v}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder={`Você é o assistente virtual da loja {{store_name}}. Seu nome é {{bot_name}}.\n\nVocê ajuda clientes a encontrar produtos...`}
                  value={configForm.prompt_base || ''}
                  onChange={e => setConfigForm(prev => ({ ...prev, prompt_base: e.target.value }))}
                  rows={12}
                  className="font-mono text-xs"
                />
              </CardContent>
            </Card>

            {/* Restrições */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-destructive" />
                  Restrições
                </CardTitle>
                <CardDescription>O que a IA NÃO deve fazer neste nicho</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Nunca recomende dosagem de medicamentos.\nNunca envie links externos.\nNunca mencione concorrentes..."
                  value={configForm.prompt_restrictions || ''}
                  onChange={e => setConfigForm(prev => ({ ...prev, prompt_restrictions: e.target.value }))}
                  rows={6}
                  className="font-mono text-xs"
                />
              </CardContent>
            </Card>

            {/* Regras */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Regras de Comportamento</CardTitle>
                    <CardDescription>Regras modulares que são injetadas no prompt</CardDescription>
                  </div>
                  <Button size="sm" onClick={openCreateRule} disabled={!config?.id}>
                    <Plus className="h-4 w-4 mr-1" />
                    Nova Regra
                  </Button>
                </div>
                {!config?.id && (
                  <p className="text-xs text-amber-500 mt-2">Salve a configuração primeiro para adicionar regras.</p>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {rulesLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : rules && rules.length > 0 ? (
                  rules.map(rule => {
                    const ruleType = RULE_TYPES.find(rt => rt.key === rule.rule_type);
                    return (
                      <div
                        key={rule.id}
                        className={`p-3 rounded-lg border ${rule.is_enabled ? 'bg-card' : 'bg-muted/50 opacity-60'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Switch
                              checked={rule.is_enabled}
                              onCheckedChange={v => toggleRule.mutate({ id: rule.id, enabled: v })}
                              className="mt-0.5"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-sm">{rule.name}</span>
                                <Badge variant="secondary" className={`text-[10px] ${ruleType?.color || ''}`}>
                                  {ruleType?.label || rule.rule_type}
                                </Badge>
                              </div>
                              {rule.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                              )}
                              {rule.trigger_condition && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  <span className="font-medium">Trigger:</span> {rule.trigger_condition}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditRule(rule)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive"
                              onClick={() => {
                                if (confirm('Remover esta regra?')) deleteRule.mutate(rule.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma regra cadastrada para este nicho/modo.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna lateral: Tools */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Tools Habilitadas
                </CardTitle>
                <CardDescription>
                  {isSimpleMode
                    ? 'Modo Simples não utiliza tools'
                    : 'Ferramentas que a IA pode usar'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isSimpleMode ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    O modo Simples (v1) não suporta tools. O prompt inclui os dados diretamente.
                  </p>
                ) : (
                  AVAILABLE_TOOLS.map(tool => {
                    const isEnabled = (configForm.enabled_tools || []).includes(tool.key);
                    return (
                      <div
                        key={tool.key}
                        className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                          isEnabled ? 'bg-primary/5 border-primary/30' : 'hover:bg-accent'
                        }`}
                        onClick={() => handleToolToggle(tool.key)}
                      >
                        <Checkbox checked={isEnabled} className="mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <tool.icon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium">{tool.label}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{tool.description}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Variáveis dinâmicas info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  Variáveis Dinâmicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {DYNAMIC_VARIABLES.map(v => (
                    <div key={v} className="text-xs flex items-center gap-2">
                      <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{v}</code>
                    </div>
                  ))}
                  <p className="text-[11px] text-muted-foreground mt-3">
                    Clique nas variáveis acima do prompt para inserir no texto.
                    São substituídas automaticamente pelos dados da loja no sync.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Dialog: Criar/Editar Regra */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Editar Regra' : 'Nova Regra'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Regra *</Label>
              <Input
                placeholder="Ex: Exigir receita para controlados"
                value={ruleForm.name}
                onChange={e => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                placeholder="Descrição curta para o admin"
                value={ruleForm.description}
                onChange={e => setRuleForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={ruleForm.rule_type} onValueChange={v => setRuleForm(prev => ({ ...prev, rule_type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RULE_TYPES.map(rt => (
                      <SelectItem key={rt.key} value={rt.key}>{rt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ordem</Label>
                <Input
                  type="number"
                  min={0}
                  value={ruleForm.sort_order}
                  onChange={e => setRuleForm(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div>
              <Label>Condição de Ativação (Trigger)</Label>
              <Input
                placeholder="Ex: Cliente pede medicamento controlado"
                value={ruleForm.trigger_condition}
                onChange={e => setRuleForm(prev => ({ ...prev, trigger_condition: e.target.value }))}
              />
            </div>
            <div>
              <Label>Prompt da Regra (injetado na IA) *</Label>
              <Textarea
                placeholder="Texto que será adicionado ao prompt quando esta regra estiver ativa..."
                value={ruleForm.action_prompt}
                onChange={e => setRuleForm(prev => ({ ...prev, action_prompt: e.target.value }))}
                rows={6}
                className="font-mono text-xs"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={ruleForm.is_enabled}
                onCheckedChange={v => setRuleForm(prev => ({ ...prev, is_enabled: v }))}
              />
              <Label>Regra ativada</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => saveRule.mutate()}
              disabled={!ruleForm.name || !ruleForm.action_prompt || saveRule.isPending}
            >
              {saveRule.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {editingRule ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Preview do Prompt */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Preview do Prompt Final</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <pre className="whitespace-pre-wrap text-xs font-mono bg-muted p-4 rounded-lg">
              {buildPreview() || 'Nenhum prompt configurado.'}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
