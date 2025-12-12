import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PromptTypeSelector } from '@/components/admin/sales/PromptTypeSelector';
import { PromptPreview } from '@/components/admin/sales/PromptPreview';
import { SavingsCalculatorDemo } from '@/components/admin/sales/SavingsCalculatorDemo';
import { generateSalesPrompt, PromptType } from '@/utils/salesPromptGenerator';
import { generateColdLeadPrompt, getColdLeadProfileInfo, COLD_LEAD_PROFILES, ColdLeadProfile } from '@/utils/coldLeadPromptGenerator';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import { Loader2, RefreshCw, Database as DatabaseIcon, CheckCircle, MapPin, Copy, Check, Smile, GraduationCap, BarChart3, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

type Plan = Database['public']['Tables']['plans']['Row'];

export default function SalesPromptsPage() {
  const [selectedType, setSelectedType] = useState<PromptType>('intermediate');
  const [selectedColdProfile, setSelectedColdProfile] = useState<ColdLeadProfile>('fun');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [coldLeadPrompt, setColdLeadPrompt] = useState('');
  const [copiedCold, setCopiedCold] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (plans.length > 0) {
      const prompt = generateSalesPrompt({
        type: selectedType,
        plans,
      });
      setGeneratedPrompt(prompt);
    }
  }, [selectedType, plans]);

  useEffect(() => {
    if (plans.length > 0) {
      const prompt = generateColdLeadPrompt({ profile: selectedColdProfile, plans });
      setColdLeadPrompt(prompt);
    }
  }, [selectedColdProfile, plans]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('status', 'active')
        .order('price', { ascending: true });

      if (error) throw error;

      setPlans(data || []);
      toast.success('Dados atualizados com sucesso!');
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">🤖 Gerador de Prompts de Vendas com IA</h1>
          <p className="text-muted-foreground">
            Gere prompts dinâmicos para usar com ChatGPT, Claude ou outros assistentes de IA.
            Todos os dados são atualizados automaticamente do sistema.
          </p>
        </div>
        
        <Button 
          variant="outline" 
          onClick={fetchPlans}
          disabled={loading}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Atualizar Dados
        </Button>
      </div>

      {/* Card com Planos Carregados */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5" />
            Planos Carregados do Sistema
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => {
              const hasPromotion = plan.promotion_active && plan.discount_price;
              const displayPrice = hasPromotion ? plan.discount_price : plan.price;
              
              return (
                <div key={plan.id} className="p-4 rounded-lg border bg-background">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{plan.name}</h4>
                    {plan.is_popular && <Badge>Popular</Badge>}
                  </div>
                  
                  <div className="space-y-1 mb-3">
                    {hasPromotion ? (
                      <>
                        <p className="text-sm line-through text-muted-foreground">
                          {formatCurrency(plan.price)}
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrency(displayPrice!)}
                          </p>
                          {plan.discount_percentage && (
                            <Badge variant="destructive">
                              -{plan.discount_percentage}%
                            </Badge>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-xl font-bold">{formatCurrency(plan.price)}</p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {(Array.isArray(plan.features) ? plan.features as string[] : [])
                      .slice(0, 4)
                      .map((feature, i) => (
                        <p key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                          {feature}
                        </p>
                      ))}
                    {(Array.isArray(plan.features) ? plan.features as string[] : []).length > 4 && (
                      <p className="text-xs text-primary">
                        +{(plan.features as string[]).length - 4} recursos
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            Última atualização: {new Date().toLocaleString('pt-BR')}
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="warm" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="warm">🔥 Leads Quentes</TabsTrigger>
          <TabsTrigger value="cold">🗺️ Leads Frios (Google Maps)</TabsTrigger>
        </TabsList>

        <TabsContent value="warm" className="space-y-6">
          <PromptTypeSelector selectedType={selectedType} onSelectType={setSelectedType} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PromptPreview prompt={generatedPrompt} type={selectedType} />
            </div>
            <div>
              <SavingsCalculatorDemo />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cold" className="space-y-6">
          {/* Seletor de Perfil de Lead Frio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Perfil do Agente de IA para Leads Frios
              </CardTitle>
              <CardDescription>
                Escolha a personalidade do agente baseado no tipo de estabelecimento que você vai abordar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {COLD_LEAD_PROFILES.map((profile) => {
                  const info = getColdLeadProfileInfo(profile);
                  const icons = {
                    fun: Smile,
                    polite: GraduationCap,
                    persuasive: BarChart3,
                    urgent: Zap,
                  };
                  const Icon = icons[profile];
                  const isSelected = selectedColdProfile === profile;

                  return (
                    <button
                      key={profile}
                      onClick={() => setSelectedColdProfile(profile)}
                      className={cn(
                        "p-4 rounded-lg border-2 text-left transition-all hover:shadow-md",
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn(
                          "p-2 rounded-lg",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-2xl">{info.emoji}</span>
                      </div>
                      <h4 className="font-semibold mb-1">{info.name}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{info.idealFor}</p>
                      {isSelected && (
                        <Badge variant="default" className="text-xs">Selecionado</Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Preview do Prompt de Lead Frio */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    Preview do Prompt - {getColdLeadProfileInfo(selectedColdProfile).emoji} {getColdLeadProfileInfo(selectedColdProfile).name}
                  </CardTitle>
                  <CardDescription>
                    Prompt completo com funil de fechamento, follow-ups, gatilhos mentais e coleta de dados
                  </CardDescription>
                </div>
                <Button 
                  onClick={async () => {
                    await navigator.clipboard.writeText(coldLeadPrompt);
                    setCopiedCold(true);
                    toast.success('Prompt copiado!');
                    setTimeout(() => setCopiedCold(false), 2000);
                  }} 
                  variant="outline" 
                  size="sm"
                >
                  {copiedCold ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copiar Prompt
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] w-full rounded-md border p-4 bg-muted/30">
                <pre className="text-sm whitespace-pre-wrap font-mono">{coldLeadPrompt}</pre>
              </ScrollArea>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {coldLeadPrompt.length.toLocaleString()} caracteres
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Funil Completo</Badge>
                  <Badge variant="outline">Follow-ups</Badge>
                  <Badge variant="outline">Gatilhos Mentais</Badge>
                  <Badge variant="outline">Scripts por Nicho</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dicas para Leads Frios */}
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">🗺️ Como usar prompts para Leads Frios:</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Encontre o estabelecimento no Google Maps e anote informações relevantes</li>
              <li>Escolha o perfil de agente mais adequado ao tipo de negócio</li>
              <li>Copie o prompt e cole no ChatGPT ou Claude</li>
              <li>Informe à IA os dados do lead (nome, telefone, tipo de negócio)</li>
              <li>A IA vai conduzir toda a conversa até a criação da conta!</li>
            </ol>
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Diferencial:</strong> Este prompt inclui estratégias para passar por mensagens automáticas, 
                conquistar funcionários, sequência de follow-up de 30 dias, roteiros de áudio e coleta de dados para onboarding.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="bg-muted/50 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold">📋 Como usar:</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Escolha entre Leads Quentes ou Leads Frios</li>
          <li>Selecione o tipo/perfil de prompt desejado</li>
          <li>Clique em "Copiar Prompt" no preview</li>
          <li>Abra o ChatGPT, Claude ou outro assistente de IA</li>
          <li>Cole o prompt e comece a conversar com seus leads!</li>
        </ol>
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Dica:</strong> O prompt já inclui todos os dados dos planos, calculadora de economia,
            quebra de objeções, testemunhos e CTAs. Você não precisa adicionar nada!
          </p>
        </div>
      </div>
    </div>
  );
}
