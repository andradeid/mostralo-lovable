import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MasterWhatsAppConfig,
  SalesApproach, 
  RecruitmentApproach,
  BotBehaviorConfig,
  SyncErrorDetails,
  PrimaryBotType,
  TriggerType,
  TriggerOperator,
  getBotBehaviorConfig
} from "@/hooks/useMasterWhatsAppConfig";
import { toast } from "sonner";
import {
  Loader2, 
  MessageSquare, 
  Users, 
  HelpCircle,
  RefreshCw,
  Zap,
  TrendingUp,
  Flame,
  Snowflake,
  Save,
  AlertTriangle,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PromptPreviewCard } from "./PromptPreviewCard";
import { MasterBotBehaviorCard } from "./MasterBotBehaviorCard";
import { BotSyncStatusBadge } from "./BotSyncStatusBadge";
import { SyncErrorModal } from "./SyncErrorModal";
import { PrimaryBotSelector } from "./PrimaryBotSelector";
import { TriggerConfigCard } from "./TriggerConfigCard";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { supabase } from "@/integrations/supabase/client";
import { generateSalesPrompt, PromptType } from "@/utils/salesPromptGenerator";
import { generateRecruitmentPrompt, RecruitmentPromptType, BonusTier } from "@/utils/recruitmentPromptGenerator";
import { Database } from "@/integrations/supabase/types";

type Plan = Database['public']['Tables']['plans']['Row'];

// Labels para exibição
const salesApproachLabels: Record<SalesApproach, string> = {
  basic: 'Consultivo',
  intermediate: 'Persuasivo',
  aggressive: 'Urgência'
};

const recruitmentApproachLabels: Record<RecruitmentApproach, string> = {
  cold_lead: 'Lead Frio',
  moderate: 'Moderado',
  aggressive: 'Agressivo',
  super_aggressive: 'Super Agressivo'
};

// Prompt padrão de suporte
function getSupportPrompt(customPrompt?: string): string {
  if (customPrompt?.trim()) {
    return customPrompt;
  }
  return `Você é um assistente de suporte da plataforma Mostralo.

SOBRE O MOSTRALO:
- Sistema completo de delivery e vendas online
- Para restaurantes, lojas, farmácias, açougues, etc.
- 0% de taxa por pedido
- WhatsApp Marketing integrado
- Relatórios com IA

FAQ COMUM:
1. "Como funciona o pagamento?" → Assinatura mensal, paga via PIX ou cartão
2. "Quanto custa?" → Planos a partir de R$ 197,90/mês
3. "Tem taxa por pedido?" → NÃO! 0% de taxa
4. "Posso testar?" → Sim, oferecemos período de teste gratuito
5. "Funciona no meu celular?" → Sim, é um sistema web/app
6. "Preciso de CNPJ?" → Pode ser PF ou PJ
7. "Como recebo os pedidos?" → WhatsApp, app ou painel web

ESTILO:
- Seja prestativo e paciente
- Responda de forma clara e objetiva
- Se não souber, encaminhe para suporte humano
- Use emojis moderadamente

CONTATO HUMANO:
WhatsApp: (61) 99555-0099
Email: suporte@mostralo.com.br`;
}

// Keywords Editor Component
function KeywordsEditor({ 
  keywords, 
  onChange, 
  label 
}: { 
  keywords: string[]; 
  onChange: (keywords: string[]) => void;
  label: string;
}) {
  const [input, setInput] = useState("");

  const addKeyword = () => {
    const trimmed = input.trim().toLowerCase();
    if (trimmed && !keywords.includes(trimmed)) {
      onChange([...keywords, trimmed]);
      setInput("");
    }
  };

  const removeKeyword = (kw: string) => {
    onChange(keywords.filter(k => k !== kw));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <Label>{label}</Label>
        <InfoTooltip text="Palavras-chave que, quando presentes na mensagem do cliente, ativam este bot. Ex: 'preço', 'quanto custa', 'quero saber mais'. Clique na keyword para remover." />
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
          placeholder="Digite uma keyword..."
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <Button type="button" size="sm" onClick={addKeyword}>
          Adicionar
        </Button>
      </div>
      <div className="flex flex-wrap gap-1">
        {keywords.map((kw) => (
          <Badge 
            key={kw} 
            variant="secondary" 
            className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => removeKeyword(kw)}
          >
            {kw} ×
          </Badge>
        ))}
      </div>
    </div>
  );
}

// Sales Approach Selector
function SalesApproachSelector({ 
  value, 
  onChange 
}: { 
  value: SalesApproach; 
  onChange: (v: SalesApproach) => void;
}) {
  const options: { value: SalesApproach; label: string; icon: typeof Zap; description: string; tooltip: string }[] = [
    { value: 'basic', label: 'Consultivo', icon: MessageSquare, description: 'Tom amigável e educador', tooltip: 'Abordagem suave e educativa. Ideal para leads que precisam entender o produto antes de comprar.' },
    { value: 'intermediate', label: 'Persuasivo', icon: TrendingUp, description: 'Foco em números e resultados', tooltip: 'Abordagem focada em benefícios e ROI. Usa dados e comparações para convencer.' },
    { value: 'aggressive', label: 'Urgência', icon: Flame, description: 'FOMO e pressão direta', tooltip: 'Abordagem direta com senso de urgência. Usa escassez e FOMO para acelerar a decisão.' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex flex-col items-center p-3 rounded-lg border-2 transition-all relative group",
            value === opt.value 
              ? "border-primary bg-primary/5" 
              : "border-transparent bg-muted/50 hover:bg-muted"
          )}
          title={opt.tooltip}
        >
          <opt.icon className={cn(
            "w-5 h-5 mb-1",
            value === opt.value ? "text-primary" : "text-muted-foreground"
          )} />
          <span className="text-sm font-medium">{opt.label}</span>
          <span className="text-xs text-muted-foreground text-center">{opt.description}</span>
        </button>
      ))}
    </div>
  );
}

// Recruitment Approach Selector
function RecruitmentApproachSelector({ 
  value, 
  onChange 
}: { 
  value: RecruitmentApproach; 
  onChange: (v: RecruitmentApproach) => void;
}) {
  const options: { value: RecruitmentApproach; label: string; icon: typeof Zap; color: string }[] = [
    { value: 'cold_lead', label: 'Lead Frio', icon: Snowflake, color: 'text-blue-400' },
    { value: 'moderate', label: 'Moderado', icon: MessageSquare, color: 'text-green-500' },
    { value: 'aggressive', label: 'Agressivo', icon: TrendingUp, color: 'text-yellow-500' },
    { value: 'super_aggressive', label: 'Super Agressivo', icon: Flame, color: 'text-red-500' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex flex-col items-center p-3 rounded-lg border-2 transition-all",
            value === opt.value 
              ? "border-primary bg-primary/5" 
              : "border-transparent bg-muted/50 hover:bg-muted"
          )}
        >
          <opt.icon className={cn("w-5 h-5 mb-1", opt.color)} />
          <span className="text-xs font-medium text-center">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

// Props interface - recebe dados do componente pai
interface MasterBotConfigTabProps {
  config: MasterWhatsAppConfig;
  syncing: boolean;
  syncError: SyncErrorDetails | null;
  clearSyncError: () => void;
  toggleBot: (botType: 'sales' | 'recruitment' | 'support', enabled: boolean) => Promise<boolean>;
  updateApproach: (botType: 'sales' | 'recruitment', approach: SalesApproach | RecruitmentApproach) => Promise<boolean>;
  updateKeywords: (botType: 'sales' | 'recruitment' | 'support', keywords: string[]) => Promise<boolean>;
  updateSupportPrompt: (prompt: string) => Promise<boolean>;
  updateBotBehavior: (botType: 'sales' | 'recruitment' | 'support', updates: Partial<BotBehaviorConfig>) => Promise<boolean>;
  syncBots: (botType?: 'sales' | 'recruitment' | 'support') => Promise<boolean>;
  updatePrimaryBotType: (botType: PrimaryBotType) => Promise<boolean>;
  updateOpenAIModel: (model: string) => Promise<boolean>;
  updateTriggerConfig: (botType: 'sales' | 'recruitment' | 'support', triggerType: TriggerType, triggerOperator: TriggerOperator) => Promise<boolean>;
  hasUnsyncedChanges: (botType: 'sales' | 'recruitment' | 'support') => boolean;
  lastSyncedAt: { sales: string | null; recruitment: string | null; support: string | null };
}

export function MasterBotConfigTab({
  config,
  syncing,
  syncError,
  clearSyncError,
  toggleBot,
  updateApproach,
  updateKeywords,
  updateSupportPrompt,
  updateBotBehavior,
  syncBots,
  updatePrimaryBotType,
  updateOpenAIModel,
  updateTriggerConfig,
  hasUnsyncedChanges,
  lastSyncedAt
}: MasterBotConfigTabProps) {
  const [supportPrompt, setSupportPrompt] = useState(config.support_bot_custom_prompt || "");
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [bonusTiers, setBonusTiers] = useState<BonusTier[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Buscar dados do banco para geração de prompts
  useEffect(() => {
    async function fetchData() {
      try {
        // @ts-ignore - Supabase tipos muito profundos
        const { data: plansData } = await supabase.from('plans').select('*').order('price', { ascending: true });
        
        // @ts-ignore - Supabase tipos muito profundos
        const { data: bonusData } = await supabase.from('salesperson_bonus_tiers').select('*').eq('is_active', true).order('min_sales', { ascending: true });

        if (plansData) setPlans(plansData as Plan[]);
        if (bonusData) {
          setBonusTiers((bonusData as any[]).map(b => ({
            id: b.id,
            tier_name: b.tier_name,
            min_sales: b.min_sales,
            bonus_amount: b.bonus_amount,
            is_cumulative: b.is_cumulative ?? true,
            is_active: b.is_active ?? true
          })));
        }
      } catch (error) {
        console.error('Erro ao buscar dados para prompts:', error);
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, []);

  // Gerar prompts usando os geradores reais com dados do banco
  const salesPromptPreview = useMemo(() => {
    if (plans.length === 0) return "";
    return generateSalesPrompt({
      type: config.sales_bot_approach as PromptType,
      plans: plans
    });
  }, [config.sales_bot_approach, plans]);

  const recruitmentPromptPreview = useMemo(() => {
    if (plans.length === 0) return "";
    return generateRecruitmentPrompt({
      type: config.recruitment_bot_approach as RecruitmentPromptType,
      plans: plans,
      bonusTiers: bonusTiers,
      baseUrl: 'https://mostralo.com.br'
    });
  }, [config.recruitment_bot_approach, plans, bonusTiers]);

  const supportPromptPreview = useMemo(() => 
    getSupportPrompt(supportPrompt),
    [supportPrompt]
  );

  // Extrair configs de comportamento de cada bot
  const salesBehaviorConfig = useMemo(() => 
    getBotBehaviorConfig(config, 'sales'),
    [config]
  );

  const recruitmentBehaviorConfig = useMemo(() => 
    getBotBehaviorConfig(config, 'recruitment'),
    [config]
  );

  const supportBehaviorConfig = useMemo(() => 
    getBotBehaviorConfig(config, 'support'),
    [config]
  );

  const handleSaveSupportPrompt = async () => {
    setSavingPrompt(true);
    const success = await updateSupportPrompt(supportPrompt);
    setSavingPrompt(false);
    if (success) {
      toast.success('Prompt salvo!');
    }
  };

  return (
    <>
    <SyncErrorModal error={syncError} onClose={clearSyncError} />
    <div className="space-y-4 sm:space-y-6">
      {/* Indicador do Bot Ativo */}
      <PrimaryBotSelector value={config.primary_bot_type || 'sales'} />
      {/* Botão de Sincronização Global */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <RefreshCw className="w-5 h-5" />
                Sincronizar Bots
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Atualize os bots na Evolution API
              </CardDescription>
            </div>
            <Button 
              onClick={() => syncBots()} 
              disabled={syncing || !config.instance_name}
              className="w-full sm:w-auto"
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Sincronizar Todos
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm">Modelo de IA:</Label>
              <InfoTooltip text="Modelo de linguagem usado pelos bots. GPT-4o-mini é mais rápido e barato. GPT-4o é mais inteligente." />
            </div>
            <Select
              value={config.openai_model || 'gpt-4o-mini'}
              onValueChange={updateOpenAIModel}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Selecione o modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini (Rápido)</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o (Inteligente)</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Básico)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs dos Bots */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="w-full flex overflow-x-auto gap-1 p-1">
          <TabsTrigger value="sales" className="flex-1 sm:flex-none gap-1.5 text-xs sm:text-sm">
            <MessageSquare className="w-4 h-4" />
            <span>Vendas</span>
          </TabsTrigger>
          <TabsTrigger value="recruitment" className="flex-1 sm:flex-none gap-1.5 text-xs sm:text-sm">
            <Users className="w-4 h-4" />
            <span className="hidden xs:inline">Recrutamento</span>
            <span className="xs:hidden">Recr.</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="flex-1 sm:flex-none gap-1.5 text-xs sm:text-sm">
            <HelpCircle className="w-4 h-4" />
            <span>Suporte</span>
          </TabsTrigger>
        </TabsList>

        {/* Bot de Vendas */}
        <TabsContent value="sales" className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <MessageSquare className="w-5 h-5 text-green-500" />
                  <CardTitle>Bot de Vendas</CardTitle>
                  <BotSyncStatusBadge
                    evolutionId={config.sales_bot_evolution_id}
                    botEnabled={config.sales_bot_enabled}
                    hasUnsyncedChanges={hasUnsyncedChanges('sales')}
                    syncing={syncing}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="sales-toggle">Ativo</Label>
                  <InfoTooltip text="Quando ativado, o bot responde automaticamente às mensagens que contêm as keywords configuradas. Desativar pausa o bot sem excluí-lo." />
                  <Switch
                    id="sales-toggle"
                    checked={config.sales_bot_enabled}
                    onCheckedChange={(checked) => toggleBot('sales', checked)}
                  />
                </div>
              </div>
              <CardDescription>
                Atende leads interessados em conhecer a plataforma Mostralo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Label>Nível de Abordagem</Label>
                  <InfoTooltip text="Define o tom e intensidade das respostas do bot. Consultivo é mais educativo, Persuasivo foca em benefícios, e Urgência usa FOMO e pressão." />
                </div>
                <SalesApproachSelector
                  value={config.sales_bot_approach}
                  onChange={(v) => updateApproach('sales', v)}
                />
              </div>

              <KeywordsEditor
                label="Keywords de Ativação"
                keywords={config.sales_bot_keywords}
                onChange={(kws) => updateKeywords('sales', kws)}
              />

              <TriggerConfigCard
                triggerType={(config.sales_bot_trigger_type as TriggerType) || 'all'}
                triggerOperator={(config.sales_bot_trigger_operator as TriggerOperator) || 'contains'}
                onTriggerTypeChange={(type) => updateTriggerConfig('sales', type, (config.sales_bot_trigger_operator as TriggerOperator) || 'contains')}
                onTriggerOperatorChange={(op) => updateTriggerConfig('sales', (config.sales_bot_trigger_type as TriggerType) || 'all', op)}
                disabled={!config.sales_bot_enabled || syncing}
              />

              {/* Preview do Prompt de Vendas */}
              <PromptPreviewCard
                prompt={salesPromptPreview}
                approachLabel={salesApproachLabels[config.sales_bot_approach]}
                approachVariant={
                  config.sales_bot_approach === 'aggressive' ? 'destructive' : 
                  config.sales_bot_approach === 'intermediate' ? 'default' : 'secondary'
                }
                isSynced={!hasUnsyncedChanges('sales')}
                lastSyncedAt={lastSyncedAt.sales || undefined}
              />

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => syncBots('sales')}
                  disabled={syncing}
                >
                  {syncing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sincronizar Bot
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card de Comportamento do Bot de Vendas */}
          {salesBehaviorConfig && (
            <MasterBotBehaviorCard
              config={salesBehaviorConfig}
              onUpdate={(updates) => updateBotBehavior('sales', updates)}
              botType="sales"
              disabled={!config.sales_bot_enabled}
            />
          )}
        </TabsContent>

        {/* Bot de Recrutamento */}
        <TabsContent value="recruitment" className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <Users className="w-5 h-5 text-blue-500" />
                  <CardTitle>Bot de Recrutamento</CardTitle>
                  <BotSyncStatusBadge
                    evolutionId={config.recruitment_bot_evolution_id}
                    botEnabled={config.recruitment_bot_enabled}
                    hasUnsyncedChanges={hasUnsyncedChanges('recruitment')}
                    syncing={syncing}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="recruitment-toggle">Ativo</Label>
                  <Switch
                    id="recruitment-toggle"
                    checked={config.recruitment_bot_enabled}
                    onCheckedChange={(checked) => toggleBot('recruitment', checked)}
                  />
                </div>
              </div>
              <CardDescription>
                Recruta novos vendedores e afiliados para a plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Nível de Abordagem</Label>
                <RecruitmentApproachSelector
                  value={config.recruitment_bot_approach}
                  onChange={(v) => updateApproach('recruitment', v)}
                />
              </div>

              <KeywordsEditor
                label="Keywords de Ativação"
                keywords={config.recruitment_bot_keywords}
                onChange={(kws) => updateKeywords('recruitment', kws)}
              />

              <TriggerConfigCard
                triggerType={(config.recruitment_bot_trigger_type as TriggerType) || 'all'}
                triggerOperator={(config.recruitment_bot_trigger_operator as TriggerOperator) || 'contains'}
                onTriggerTypeChange={(type) => updateTriggerConfig('recruitment', type, (config.recruitment_bot_trigger_operator as TriggerOperator) || 'contains')}
                onTriggerOperatorChange={(op) => updateTriggerConfig('recruitment', (config.recruitment_bot_trigger_type as TriggerType) || 'all', op)}
                disabled={!config.recruitment_bot_enabled || syncing}
              />

              {/* Preview do Prompt de Recrutamento */}
              <PromptPreviewCard
                prompt={recruitmentPromptPreview}
                approachLabel={recruitmentApproachLabels[config.recruitment_bot_approach]}
                approachVariant={
                  config.recruitment_bot_approach === 'super_aggressive' ? 'destructive' : 
                  config.recruitment_bot_approach === 'aggressive' ? 'default' : 'secondary'
                }
                isSynced={!hasUnsyncedChanges('recruitment')}
                lastSyncedAt={lastSyncedAt.recruitment || undefined}
              />

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => syncBots('recruitment')}
                  disabled={syncing}
                >
                  {syncing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sincronizar Bot
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card de Comportamento do Bot de Recrutamento */}
          {recruitmentBehaviorConfig && (
            <MasterBotBehaviorCard
              config={recruitmentBehaviorConfig}
              onUpdate={(updates) => updateBotBehavior('recruitment', updates)}
              botType="recruitment"
              disabled={!config.recruitment_bot_enabled}
            />
          )}
        </TabsContent>

        {/* Bot de Suporte */}
        <TabsContent value="support" className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <HelpCircle className="w-5 h-5 text-purple-500" />
                  <CardTitle>Bot de Suporte</CardTitle>
                  <BotSyncStatusBadge
                    evolutionId={config.support_bot_evolution_id}
                    botEnabled={config.support_bot_enabled}
                    hasUnsyncedChanges={hasUnsyncedChanges('support')}
                    syncing={syncing}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="support-toggle">Ativo</Label>
                  <Switch
                    id="support-toggle"
                    checked={config.support_bot_enabled}
                    onCheckedChange={(checked) => toggleBot('support', checked)}
                  />
                </div>
              </div>
              <CardDescription>
                Responde dúvidas gerais sobre a plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <KeywordsEditor
                label="Keywords de Ativação"
                keywords={config.support_bot_keywords}
                onChange={(kws) => updateKeywords('support', kws)}
              />

              <TriggerConfigCard
                triggerType={(config.support_bot_trigger_type as TriggerType) || 'all'}
                triggerOperator={(config.support_bot_trigger_operator as TriggerOperator) || 'contains'}
                onTriggerTypeChange={(type) => updateTriggerConfig('support', type, (config.support_bot_trigger_operator as TriggerOperator) || 'contains')}
                onTriggerOperatorChange={(op) => updateTriggerConfig('support', (config.support_bot_trigger_type as TriggerType) || 'all', op)}
                disabled={!config.support_bot_enabled || syncing}
              />

              <div className="space-y-2">
                <Label>Prompt Customizado (opcional)</Label>
                <Textarea
                  value={supportPrompt}
                  onChange={(e) => setSupportPrompt(e.target.value)}
                  placeholder="Deixe em branco para usar o prompt padrão..."
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Se deixar em branco, será usado um prompt padrão com FAQ da plataforma.
                </p>
              </div>

              {/* Preview do Prompt de Suporte */}
              <PromptPreviewCard
                prompt={supportPromptPreview}
                approachLabel={supportPrompt.trim() ? "Customizado" : "Padrão"}
                approachVariant={supportPrompt.trim() ? "default" : "secondary"}
                isSynced={!hasUnsyncedChanges('support')}
                lastSyncedAt={lastSyncedAt.support || undefined}
              />

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveSupportPrompt}
                  disabled={savingPrompt}
                >
                  {savingPrompt ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar Prompt
                </Button>
                <Button
                  variant="outline"
                  onClick={() => syncBots('support')}
                  disabled={syncing}
                >
                  {syncing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Sincronizar Bot
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card de Comportamento do Bot de Suporte */}
          {supportBehaviorConfig && (
            <MasterBotBehaviorCard
              config={supportBehaviorConfig}
              onUpdate={(updates) => updateBotBehavior('support', updates)}
              botType="support"
              disabled={!config.support_bot_enabled}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}
