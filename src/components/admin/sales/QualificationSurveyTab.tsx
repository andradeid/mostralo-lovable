import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Copy, Check, ClipboardList, Target, Gift, Zap, Calculator, ArrowRight, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  SURVEY_QUESTIONS, 
  BENEFIT_TIERS, 
  getTierByPoints, 
  getMaxPoints,
  generateQualificationSurveyPrompt,
  convertDbTiersToBenefitTiers,
  QualificationSurveyConfig,
  BenefitTier
} from '@/utils/qualificationSurveyPromptGenerator';
import { useQualificationTiers } from '@/hooks/useQualificationTiers';
import { Database } from '@/integrations/supabase/types';

type Plan = Database['public']['Tables']['plans']['Row'];

interface QualificationSurveyTabProps {
  plans: Plan[];
}

export function QualificationSurveyTab({ plans }: QualificationSurveyTabProps) {
  const [copied, setCopied] = useState(false);
  const [simulatorAnswers, setSimulatorAnswers] = useState<Record<number, number>>({});
  
  // Fetch dynamic tiers from database
  const { tiers: dbTiers, promotions, loading: tiersLoading } = useQualificationTiers();
  
  // Convert DB tiers to BenefitTier format
  const dynamicTiers: BenefitTier[] = dbTiers.length > 0 && promotions
    ? convertDbTiersToBenefitTiers(dbTiers, promotions)
    : BENEFIT_TIERS;
  
  const baseUrl = window.location.origin;
  const prompt = generateQualificationSurveyPrompt({ 
    baseUrl, 
    plans,
    benefitTiers: dbTiers.length > 0 ? dbTiers : undefined,
    promotions: promotions.length > 0 ? promotions : undefined
  });
  
  const simulatorScore = Object.values(simulatorAnswers).reduce((sum, pts) => sum + pts, 0);
  const simulatorTier = getTierByPoints(simulatorScore, dynamicTiers);
  const maxPoints = getMaxPoints();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success('Prompt copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulatorAnswer = (questionId: number, points: number) => {
    setSimulatorAnswers(prev => ({ ...prev, [questionId]: points }));
  };

  const resetSimulator = () => {
    setSimulatorAnswers({});
  };

  const categoryColors: Record<string, string> = {
    revenue: 'bg-green-500/10 text-green-600 border-green-500/30',
    pain: 'bg-red-500/10 text-red-600 border-red-500/30',
    decision: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    technical: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    engagement: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  };

  return (
    <div className="space-y-6">
      {/* Header com Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Sistema de Qualificação por Pesquisa
          </CardTitle>
          <CardDescription>
            Transforme uma pesquisa simples em uma venda qualificada. O lead responde 10 perguntas e ganha benefícios proporcionais ao seu potencial.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
            <div className="text-center p-3 md:p-4 rounded-lg bg-muted/50">
              <div className="text-2xl md:text-3xl font-bold text-primary">10</div>
              <div className="text-xs md:text-sm text-muted-foreground">Perguntas</div>
            </div>
            <div className="text-center p-3 md:p-4 rounded-lg bg-muted/50">
              <div className="text-2xl md:text-3xl font-bold text-primary">{maxPoints}</div>
              <div className="text-xs md:text-sm text-muted-foreground">Pts Máx.</div>
            </div>
            <div className="text-center p-3 md:p-4 rounded-lg bg-muted/50">
              <div className="text-2xl md:text-3xl font-bold text-primary">5</div>
              <div className="text-xs md:text-sm text-muted-foreground">Faixas</div>
            </div>
            <div className="text-center p-3 md:p-4 rounded-lg bg-muted/50">
              <div className="text-2xl md:text-3xl font-bold text-primary">~3min</div>
              <div className="text-xs md:text-sm text-muted-foreground">Duração</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Faixas de Benefícios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Faixas de Benefícios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tiersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground text-sm">Carregando...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
              {dynamicTiers.map((tier, index) => (
                <div 
                  key={tier.classification}
                  className={cn(
                    "p-3 md:p-4 rounded-lg border text-center",
                    index === 0 && "bg-yellow-500/10 border-yellow-500/30",
                    index === 1 && "bg-orange-500/10 border-orange-500/30",
                    index === 2 && "bg-blue-500/10 border-blue-500/30",
                    index === 3 && "bg-cyan-500/10 border-cyan-500/30",
                    index >= 4 && "bg-muted/50 border-border"
                  )}
                >
                  <div className="text-xl md:text-2xl mb-1 md:mb-2">{tier.emoji}</div>
                  <div className="font-semibold text-xs md:text-sm truncate">{tier.classification}</div>
                  <Badge variant="outline" className="mt-1.5 md:mt-2 text-[10px] md:text-xs">
                    {tier.minPoints}-{tier.maxPoints}
                  </Badge>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1.5 md:mt-2 line-clamp-2">{tier.benefit}</p>
                  {tier.promotionCode && (
                    <Badge variant="secondary" className="mt-1.5 md:mt-2 text-[10px] md:text-xs">
                      🎁 {tier.promotionCode.slice(0, 8)}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Perguntas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            As 10 Perguntas de Qualificação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {SURVEY_QUESTIONS.map((q) => (
                <div key={q.id} className="p-4 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={cn("text-xs", categoryColors[q.category])}>
                      {q.categoryName}
                    </Badge>
                    <span className="text-sm text-muted-foreground">Máx: {q.maxPoints} pts</span>
                  </div>
                  <p className="font-medium mb-3">
                    <span className="text-primary">#{q.id}</span> "{q.question}"
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {q.options.map((opt, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm">
                        <span>{opt.answer}</span>
                        <Badge variant="secondary">{opt.points} pts</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Simulador */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Simulador de Qualificação
              </CardTitle>
              <CardDescription>Teste como funciona a pontuação</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={resetSimulator}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <ScrollArea className="h-[300px] pr-4">
                {SURVEY_QUESTIONS.map((q) => (
                  <div key={q.id} className="mb-4 p-3 rounded-lg border">
                    <p className="text-sm font-medium mb-2">
                      #{q.id} {q.question}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((opt, i) => (
                        <Button
                          key={i}
                          size="sm"
                          variant={simulatorAnswers[q.id] === opt.points ? "default" : "outline"}
                          onClick={() => handleSimulatorAnswer(q.id, opt.points)}
                          className="text-xs"
                        >
                          {opt.answer.substring(0, 20)}{opt.answer.length > 20 ? '...' : ''} ({opt.points}pts)
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
            <div className="space-y-4">
              <div className="p-6 rounded-lg border-2 text-center" style={{ borderColor: simulatorTier.color }}>
                <div className="text-4xl mb-2">{simulatorTier.emoji}</div>
                <div className="text-2xl font-bold">{simulatorScore}/{maxPoints}</div>
                <div className="text-sm text-muted-foreground">pontos</div>
                <Separator className="my-4" />
                <div className={cn("font-semibold", simulatorTier.color)}>
                  {simulatorTier.classification}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {simulatorTier.benefit}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Perguntas respondidas: {Object.keys(simulatorAnswers).length}/10
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview do Prompt */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Prompt Completo para IA
              </CardTitle>
              <CardDescription>
                Cole este prompt no ChatGPT ou Claude para ter um agente de qualificação
              </CardDescription>
            </div>
            <Button onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Prompt
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-muted/30">
            <pre className="text-sm whitespace-pre-wrap font-mono">{prompt}</pre>
          </ScrollArea>
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="text-[10px] md:text-xs text-muted-foreground">
              {prompt.length.toLocaleString()} caracteres
            </span>
            <div className="overflow-x-auto scrollbar-hide w-full sm:w-auto">
              <div className="flex items-center gap-1.5 md:gap-2 pb-1">
                <Badge variant="outline" className="text-[10px] md:text-xs shrink-0">Lead Scoring</Badge>
                <Badge variant="outline" className="text-[10px] md:text-xs shrink-0">10 Perguntas</Badge>
                <Badge variant="outline" className="text-[10px] md:text-xs shrink-0">5 Faixas</Badge>
                <Badge variant="outline" className="text-[10px] md:text-xs shrink-0">Fechamento</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dicas */}
      <div className="bg-muted/50 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <ArrowRight className="h-5 w-5" />
          Como usar o Sistema de Qualificação:
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
          <li>Copie o prompt e cole no ChatGPT ou Claude</li>
          <li>Inicie a conversa com o lead dizendo que vai fazer uma pesquisa rápida</li>
          <li>A IA vai conduzir as 10 perguntas naturalmente</li>
          <li>No final, a IA calcula a pontuação e revela o benefício</li>
          <li>A IA transiciona para apresentação do Mostralo</li>
          <li>A IA quebra objeções e coleta dados para criar a conta</li>
        </ol>
        <Separator />
        <p className="text-xs text-muted-foreground">
          💡 <strong>Diferencial:</strong> O lead acha que é só uma pesquisa, mas está sendo qualificado. 
          Quando ganha o benefício, sente reciprocidade e fica mais propenso a fechar!
        </p>
      </div>
    </div>
  );
}
