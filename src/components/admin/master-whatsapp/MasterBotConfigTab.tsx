import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  useMasterWhatsAppConfig, 
  SalesApproach, 
  RecruitmentApproach 
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
  Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PromptPreviewCard } from "./PromptPreviewCard";
import { 
  getSalesPrompt, 
  getRecruitmentPrompt, 
  getSupportPrompt,
  salesApproachLabels,
  recruitmentApproachLabels
} from "@/lib/masterBotPrompts";

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
      <Label>{label}</Label>
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
  const options: { value: SalesApproach; label: string; icon: typeof Zap; description: string }[] = [
    { value: 'basic', label: 'Consultivo', icon: MessageSquare, description: 'Tom amigável e educador' },
    { value: 'intermediate', label: 'Persuasivo', icon: TrendingUp, description: 'Foco em números e resultados' },
    { value: 'aggressive', label: 'Urgência', icon: Flame, description: 'FOMO e pressão direta' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
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

export function MasterBotConfigTab() {
  const { 
    config, 
    loading, 
    syncing,
    toggleBot, 
    updateApproach, 
    updateKeywords,
    updateSupportPrompt,
    syncBots 
  } = useMasterWhatsAppConfig();
  
  const [supportPrompt, setSupportPrompt] = useState(config?.support_bot_custom_prompt || "");
  const [savingPrompt, setSavingPrompt] = useState(false);

  // Memoizar os prompts baseados nas configurações atuais
  const salesPromptPreview = useMemo(() => 
    config ? getSalesPrompt(config.sales_bot_approach) : "",
    [config?.sales_bot_approach]
  );

  const recruitmentPromptPreview = useMemo(() => 
    config ? getRecruitmentPrompt(config.recruitment_bot_approach) : "",
    [config?.recruitment_bot_approach]
  );

  const supportPromptPreview = useMemo(() => 
    getSupportPrompt(supportPrompt),
    [supportPrompt]
  );

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const handleSaveSupportPrompt = async () => {
    setSavingPrompt(true);
    const success = await updateSupportPrompt(supportPrompt);
    setSavingPrompt(false);
    if (success) {
      toast.success('Prompt salvo!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Botão de Sincronização Global */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Sincronizar Bots
              </CardTitle>
              <CardDescription>
                Atualize os bots na Evolution API com as configurações atuais
              </CardDescription>
            </div>
            <Button 
              onClick={() => syncBots()} 
              disabled={syncing || !config.instance_name}
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
      </Card>

      {/* Tabs dos Bots */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="sales" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Vendas
          </TabsTrigger>
          <TabsTrigger value="recruitment" className="gap-2">
            <Users className="w-4 h-4" />
            Recrutamento
          </TabsTrigger>
          <TabsTrigger value="support" className="gap-2">
            <HelpCircle className="w-4 h-4" />
            Suporte
          </TabsTrigger>
        </TabsList>

        {/* Bot de Vendas */}
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-500" />
                    Bot de Vendas
                  </CardTitle>
                  <CardDescription>
                    Atende leads interessados em conhecer a plataforma Mostralo
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="sales-toggle">Ativo</Label>
                  <Switch
                    id="sales-toggle"
                    checked={config.sales_bot_enabled}
                    onCheckedChange={(checked) => toggleBot('sales', checked)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Nível de Abordagem</Label>
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

              {/* Preview do Prompt de Vendas */}
              <PromptPreviewCard
                prompt={salesPromptPreview}
                approachLabel={salesApproachLabels[config.sales_bot_approach]}
                approachVariant={
                  config.sales_bot_approach === 'aggressive' ? 'destructive' : 
                  config.sales_bot_approach === 'intermediate' ? 'default' : 'secondary'
                }
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
        </TabsContent>

        {/* Bot de Recrutamento */}
        <TabsContent value="recruitment">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" />
                    Bot de Recrutamento
                  </CardTitle>
                  <CardDescription>
                    Recruta novos vendedores e afiliados para a plataforma
                  </CardDescription>
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

              {/* Preview do Prompt de Recrutamento */}
              <PromptPreviewCard
                prompt={recruitmentPromptPreview}
                approachLabel={recruitmentApproachLabels[config.recruitment_bot_approach]}
                approachVariant={
                  config.recruitment_bot_approach === 'super_aggressive' ? 'destructive' : 
                  config.recruitment_bot_approach === 'aggressive' ? 'default' : 'secondary'
                }
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
        </TabsContent>

        {/* Bot de Suporte */}
        <TabsContent value="support">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-purple-500" />
                    Bot de Suporte
                  </CardTitle>
                  <CardDescription>
                    Responde dúvidas gerais sobre a plataforma
                  </CardDescription>
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
            </CardHeader>
            <CardContent className="space-y-6">
              <KeywordsEditor
                label="Keywords de Ativação"
                keywords={config.support_bot_keywords}
                onChange={(kws) => updateKeywords('support', kws)}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
