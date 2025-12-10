import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Phone, MessageSquare, Instagram, Target, Shield, CheckCircle, TrendingUp, Loader2, RefreshCw, Users, Clock, Zap, Tags, Send, BarChart3, UsersRound, Link2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type Plan = Database['public']['Tables']['plans']['Row'];

export default function ProspectingGuidePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

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
      toast.success('Dados atualizados!');
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculateSavings = (revenue: number) => {
    const ifoodFee = revenue * 0.25;
    const planPrice = plans[0]?.price || 397.90;
    const savings = ifoodFee - planPrice;
    const annual = savings * 12;
    const daily = savings / 30;
    const marketingValue = 1200;
    const whatsappValue = 800;
    const totalValue = savings + marketingValue + whatsappValue;
    return { ifoodFee, savings, annual, daily, marketingValue, whatsappValue, totalValue };
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
          <h1 className="text-3xl font-bold mb-2">📋 Guia Completo de Prospecção</h1>
          <p className="text-muted-foreground">
            Tudo que você precisa para prospectar, qualificar e fechar vendas com confiança.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            Atualizado: {new Date().toLocaleTimeString('pt-BR')}
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchPlans}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="como-prospectar" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="como-prospectar">Como Prospectar</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
          <TabsTrigger value="qualificacao">Qualificação</TabsTrigger>
          <TabsTrigger value="apresentacao">Apresentação</TabsTrigger>
          <TabsTrigger value="whatsapp" className="text-[#25D366]">💬 WhatsApp</TabsTrigger>
          <TabsTrigger value="objecoes">Objeções</TabsTrigger>
          <TabsTrigger value="fechamento">Fechamento</TabsTrigger>
        </TabsList>

        {/* SEÇÃO 1: COMO PROSPECTAR */}
        <TabsContent value="como-prospectar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                📍 Onde Encontrar Leads
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-1">Instagram</Badge>
                  <p className="text-sm">Restaurantes locais com perfis ativos e presença em delivery</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-1">Google Maps</Badge>
                  <p className="text-sm">Estabelecimentos com muitas avaliações e que fazem delivery</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-1">iFood/Rappi</Badge>
                  <p className="text-sm">Parceiros já cadastrados (potenciais saídas devido às taxas altas)</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-1">WhatsApp</Badge>
                  <p className="text-sm">Grupos de restaurantes e comunidades gastronômicas</p>
                </div>
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-1">Feiras</Badge>
                  <p className="text-sm">Feiras gastronômicas e eventos do setor alimentício</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>⏰ Melhores Horários para Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500">Ideal</Badge>
                  <span className="text-sm font-medium">Segunda a Quinta: 14h - 17h</span>
                </div>
                <p className="text-sm text-muted-foreground ml-16">Fora do horário de rush, melhor momento para conversar</p>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Evitar</Badge>
                  <span className="text-sm font-medium">11h - 14h e 18h - 22h</span>
                </div>
                <p className="text-sm text-muted-foreground ml-16">Horários de pico - donos estão ocupados</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📋 Antes de Fazer Contato</CardTitle>
              <CardDescription>Preparação essencial para aumentar suas chances</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Visite o perfil no Instagram do estabelecimento</li>
                <li>Verifique se tem delivery próprio ou usa apenas marketplace</li>
                <li>Estime o faturamento pelo número de reviews e movimento</li>
                <li>Anote o nome do dono/gerente se possível</li>
                <li>Prepare perguntas específicas baseadas no que observou</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEÇÃO 2: SCRIPTS DE ABORDAGEM */}
        <TabsContent value="scripts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                📱 WhatsApp - Primeira Mensagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ScrollArea className="h-[200px] rounded-md border p-4 bg-muted/30">
                <p className="text-sm whitespace-pre-wrap font-mono">
                  {`Olá! Vi que a [NOME DO RESTAURANTE] usa o iFood.

Já pensou em quanto dinheiro você deixa lá todo mês?

Com R$ [ESTIMATIVA] de faturamento, você paga cerca de R$ [25%] em taxas.

Posso te mostrar uma forma de economizar esse dinheiro E ainda ter marketing incluso? 😊`}
                </p>
              </ScrollArea>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => copyToClipboard(
                  'Olá! Vi que a [NOME DO RESTAURANTE] usa o iFood.\n\nJá pensou em quanto dinheiro você deixa lá todo mês?\n\nCom R$ [ESTIMATIVA] de faturamento, você paga cerca de R$ [25%] em taxas.\n\nPosso te mostrar uma forma de economizar esse dinheiro E ainda ter marketing incluso? 😊',
                  'Script WhatsApp'
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Script
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                📞 Telefone - Abertura
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ScrollArea className="h-[200px] rounded-md border p-4 bg-muted/30">
                <p className="text-sm whitespace-pre-wrap font-mono">
                  {`Boa tarde! Falo com o responsável pela [NOME]?

Trabalho com sistemas de delivery e vi que vocês estão no iFood.

Tenho uma proposta que pode economizar mais de R$ 2.000/mês para vocês.

Tem 2 minutinhos?

[Se sim:]
Perfeito! Me conta, quanto vocês faturam por mês com delivery?`}
                </p>
              </ScrollArea>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => copyToClipboard(
                  'Boa tarde! Falo com o responsável pela [NOME]?\n\nTrabalho com sistemas de delivery e vi que vocês estão no iFood.\n\nTenho uma proposta que pode economizar mais de R$ 2.000/mês para vocês.\n\nTem 2 minutinhos?',
                  'Script Telefone'
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Script
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Instagram className="h-5 w-5" />
                📸 Instagram - DM
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ScrollArea className="h-[180px] rounded-md border p-4 bg-muted/30">
                <p className="text-sm whitespace-pre-wrap font-mono">
                  {`Olá! Adorei o cardápio de vocês 😍

Vi que vocês usam marketplace para delivery.

Trabalho com um sistema que ajuda restaurantes a saírem do iFood e ainda tem marketing digital INCLUSO.

Posso explicar melhor?`}
                </p>
              </ScrollArea>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => copyToClipboard(
                  'Olá! Adorei o cardápio de vocês 😍\n\nVi que vocês usam marketplace para delivery.\n\nTrabalho com um sistema que ajuda restaurantes a saírem do iFood e ainda tem marketing digital INCLUSO.\n\nPosso explicar melhor?',
                  'Script Instagram'
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Script
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEÇÃO 3: QUALIFICAÇÃO */}
        <TabsContent value="qualificacao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>✅ Perguntas para Qualificar Leads</CardTitle>
              <CardDescription>Use essas perguntas para identificar o potencial do lead</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-3 text-sm">
                <li className="font-medium">
                  "Qual marketplace você usa hoje?"
                  <p className="text-muted-foreground ml-6 mt-1">(iFood, Rappi, etc - entender dependência)</p>
                </li>
                <li className="font-medium">
                  "Qual seu faturamento médio mensal com delivery?"
                  <p className="text-muted-foreground ml-6 mt-1">(Calcular economia potencial)</p>
                </li>
                <li className="font-medium">
                  "Você já pensou em ter seu próprio sistema?"
                  <p className="text-muted-foreground ml-6 mt-1">(Verificar nível de interesse)</p>
                </li>
                <li className="font-medium">
                  "Quem cuida do marketing/redes sociais?"
                  <p className="text-muted-foreground ml-6 mt-1">(Mostrar diferencial do marketing incluso)</p>
                </li>
                <li className="font-medium">
                  "Você está satisfeito com as taxas que paga?"
                  <p className="text-muted-foreground ml-6 mt-1">(Criar dor e urgência)</p>
                </li>
              </ol>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-green-500/50">
              <CardHeader>
                <CardTitle className="text-green-600 dark:text-green-400 flex items-center gap-2">
                  🔥 Lead Quente (PRIORIZAR)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Reclama das taxas do iFood
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Já tentou sair antes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Faturamento &gt; R$ 5.000/mês
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Tem presença em redes sociais
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Responde rápido e demonstra interesse
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-500/50">
              <CardHeader>
                <CardTitle className="text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  ❄️ Lead Frio (AQUECER)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    Nunca pensou em sair
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    Acha "muito complicado"
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    Não sabe quanto paga de taxa
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    Faturamento baixo (&lt; R$ 3.000)
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    Demora para responder
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SEÇÃO 4: APRESENTAÇÃO DE VALOR */}
        <TabsContent value="apresentacao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                💰 Script de Economia (DINÂMICO)
              </CardTitle>
              <CardDescription>Adapte os valores conforme o faturamento do lead</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 border">
                <p className="text-sm font-mono whitespace-pre-wrap">
{`"Então você fatura R$ [VALOR] por mês no iFood.

Isso significa que você paga R$ [VALOR × 0.25] de taxa.
São R$ [VALOR × 0.25 × 12] POR ANO!

No Mostralo você paga R$ ${formatCurrency(plans[0]?.price || 397.90)} fixo por mês.

Sua economia seria de R$ [DIFERENÇA] por mês.
Em 1 ano, são R$ [DIFERENÇA × 12] no seu bolso!"`}
                </p>
              </div>

              <Separator />
              
              <div>
                <h4 className="font-semibold mb-2">Exemplo com R$ 10.000/mês:</h4>
                {(() => {
                  const { ifoodFee, savings, annual, daily } = calculateSavings(10000);
                  return (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <p className="text-muted-foreground">Taxa iFood</p>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">{formatCurrency(ifoodFee)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-muted-foreground">Mostralo</p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatCurrency(plans[0]?.price || 397.90)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-muted-foreground">Economia Mensal</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(savings)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-muted-foreground">Economia Anual</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(annual)}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="text-primary">🚨 DIFERENCIAL: Marketing Digital Incluso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm font-medium">
                "E o melhor: diferente de TODOS os concorrentes (Anota AI, Goomer, Cardápio Web)...
                No Mostralo você tem MARKETING DIGITAL INCLUSO!"
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>1 perfil de rede social</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>Posts ILIMITADOS</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>IA que cria legendas</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span>Análise dos seus concorrentes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5" />
                  <span className="font-medium">Isso normalmente custa R$ 800-2.000/mês numa agência!</span>
                </li>
              </ul>
              
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => copyToClipboard(
                  `E o melhor: diferente de TODOS os concorrentes (Anota AI, Goomer, Cardápio Web), no Mostralo você tem MARKETING DIGITAL INCLUSO!\n\n✅ 1 perfil de rede social\n✅ Posts ILIMITADOS\n✅ IA que cria legendas\n✅ Análise dos seus concorrentes\n✅ Integração Facebook/Google Ads\n\nIsso normalmente custa R$ 800-2.000/mês numa agência. No Mostralo, já está no pacote!`,
                  'Diferencial de Marketing'
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Script de Marketing
              </Button>
            </CardContent>
          </Card>

          {/* NOVO: Card de Planos Disponíveis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💼 Planos Disponíveis para Apresentar
                <Button variant="ghost" size="sm" onClick={fetchPlans}>
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
              </CardTitle>
              <CardDescription>
                Dados atualizados em tempo real do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plans.map((plan) => {
                  const hasPromotion = plan.promotion_active && plan.discount_price;
                  const displayPrice = hasPromotion ? plan.discount_price : plan.price;
                  
                  return (
                    <div key={plan.id} className="p-4 rounded-lg border bg-muted/30">
                      {/* Header do plano */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-lg">{plan.name}</h4>
                          <p className="text-sm text-muted-foreground">{plan.description}</p>
                        </div>
                        <div className="text-right">
                          {hasPromotion ? (
                            <>
                              <p className="text-sm line-through text-muted-foreground">
                                De {formatCurrency(plan.price)}
                              </p>
                              <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(displayPrice!)}/mês
                              </p>
                              {plan.discount_percentage && (
                                <Badge variant="destructive" className="mt-1">
                                  🔥 {plan.discount_percentage}% OFF
                                </Badge>
                              )}
                            </>
                          ) : (
                            <p className="text-2xl font-bold">{formatCurrency(plan.price)}/mês</p>
                          )}
                          {plan.is_popular && (
                            <Badge className="mt-1">⭐ Mais Escolhido</Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Features do plano */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                        {(Array.isArray(plan.features) ? plan.features as string[] : []).map((feature, i) => (
                          <div key={i} className="flex items-center gap-1 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Botão copiar pitch do plano */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3 w-full"
                        onClick={() => {
                          const price = hasPromotion ? displayPrice! : plan.price;
                          const priceText = hasPromotion 
                            ? `De ${formatCurrency(plan.price)} por ${formatCurrency(price)}/mês (${plan.discount_percentage}% OFF! 🔥)` 
                            : `${formatCurrency(price)}/mês`;
                          const pitch = `✨ Plano ${plan.name}\n${priceText}\n\n${plan.description}\n\nInclui:\n${(Array.isArray(plan.features) ? plan.features as string[] : []).map(f => `✅ ${f}`).join('\n')}`;
                          copyToClipboard(pitch, `Pitch do ${plan.name}`);
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Pitch do {plan.name}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEÇÃO 5: WHATSAPP MARKETING */}
        <TabsContent value="whatsapp" className="space-y-4">
          {/* Card: O Problema */}
          <Card className="border-red-500/50">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                🚨 O Problema que o Cliente NÃO SABE que Tem
              </CardTitle>
              <CardDescription>Use esses dados para criar consciência da dor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                  <p className="text-4xl font-bold text-red-600 dark:text-red-400">68%</p>
                  <p className="text-sm text-muted-foreground mt-1">dos clientes compram UMA VEZ e nunca mais voltam</p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                  <p className="text-4xl font-bold text-red-600 dark:text-red-400">R$ 2.400</p>
                  <p className="text-sm text-muted-foreground mt-1">perdidos por mês em média por não reconquistar clientes</p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                  <p className="text-4xl font-bold text-red-600 dark:text-red-400">15 dias</p>
                  <p className="text-sm text-muted-foreground mt-1">tempo médio para um cliente "esquecer" do restaurante</p>
                </div>
              </div>
              <Button 
                variant="outline"
                className="w-full mt-4"
                onClick={() => copyToClipboard(
                  `🚨 DADOS IMPORTANTES:\n\n• 68% dos clientes compram UMA VEZ e nunca mais voltam se você não entrar em contato\n• Restaurantes perdem em média R$ 2.400/mês por não reconquistar clientes inativos\n• Após 15 dias sem contato, o cliente "esquece" do seu restaurante\n\nVocê está deixando dinheiro na mesa!`,
                  'Estatísticas do problema'
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Estatísticas
              </Button>
            </CardContent>
          </Card>

          {/* Card: Funcionalidades */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#25D366]" />
                💬 Funcionalidades do WhatsApp Marketing
              </CardTitle>
              <CardDescription>8 recursos que transformam o WhatsApp em máquina de vendas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Users className="h-5 w-5 text-[#25D366] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Gestão de Contatos Inteligente</p>
                    <p className="text-sm text-muted-foreground">Sincroniza e organiza todos os contatos automaticamente</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Tags className="h-5 w-5 text-[#25D366] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Etiquetas Coloridas</p>
                    <p className="text-sm text-muted-foreground">Segmentação visual por tipo de cliente (VIP, Inativo, Novo...)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Zap className="h-5 w-5 text-[#25D366] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Recuperação Automática</p>
                    <p className="text-sm text-muted-foreground">Identifica inativos e envia mensagem personalizada 24/7</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <MessageSquare className="h-5 w-5 text-[#25D366] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Templates com Variáveis</p>
                    <p className="text-sm text-muted-foreground">{'{nome}, {último_pedido}, {dias_sem_comprar}'} personalizados</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Clock className="h-5 w-5 text-[#25D366] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Campanhas Agendadas</p>
                    <p className="text-sm text-muted-foreground">Programe envios em massa com proteção anti-bloqueio</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <BarChart3 className="h-5 w-5 text-[#25D366] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Métricas em Tempo Real</p>
                    <p className="text-sm text-muted-foreground">Acompanhe taxa de entrega, abertura e conversão</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <UsersRound className="h-5 w-5 text-[#25D366] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Integração com Grupos</p>
                    <p className="text-sm text-muted-foreground">Extrai membros de grupos e transforma em contatos</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Link2 className="h-5 w-5 text-[#25D366] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Link com Clientes</p>
                    <p className="text-sm text-muted-foreground">Vincula contatos com histórico de pedidos automaticamente</p>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline"
                className="w-full mt-4"
                onClick={() => copyToClipboard(
                  `💬 FUNCIONALIDADES DO WHATSAPP MARKETING:\n\n✅ Gestão de Contatos Inteligente - Sincroniza todos automaticamente\n✅ Etiquetas Coloridas - Segmentação visual (VIP, Inativo, Novo...)\n✅ Recuperação Automática - Identifica inativos e envia mensagem 24/7\n✅ Templates com Variáveis - {nome}, {último_pedido} personalizados\n✅ Campanhas Agendadas - Envios em massa com proteção anti-bloqueio\n✅ Métricas em Tempo Real - Taxa de entrega, abertura e conversão\n✅ Integração com Grupos - Extrai membros e transforma em contatos\n✅ Link com Clientes - Vincula contatos com histórico de pedidos\n\nTudo isso INCLUSO no plano! No mercado custa R$ 500-1.500/mês.`,
                  'Funcionalidades WhatsApp'
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Lista de Funcionalidades
              </Button>
            </CardContent>
          </Card>

          {/* Card: KPIs de Resultados */}
          <Card className="border-[#25D366]/50 bg-[#25D366]/5">
            <CardHeader>
              <CardTitle className="text-[#25D366] flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                📊 Resultados Comprovados
              </CardTitle>
              <CardDescription>Use esses números para convencer o lead</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-background border text-center">
                  <p className="text-3xl font-bold text-[#25D366]">23%</p>
                  <p className="text-sm text-muted-foreground mt-1">Taxa de recuperação de clientes inativos</p>
                </div>
                <div className="p-4 rounded-lg bg-background border text-center">
                  <p className="text-3xl font-bold text-[#25D366]">R$ 2.400</p>
                  <p className="text-sm text-muted-foreground mt-1">Aumento médio mensal em vendas recuperadas</p>
                </div>
                <div className="p-4 rounded-lg bg-background border text-center">
                  <p className="text-3xl font-bold text-[#25D366]">8h/mês</p>
                  <p className="text-sm text-muted-foreground mt-1">Economizadas em trabalho manual</p>
                </div>
                <div className="p-4 rounded-lg bg-background border text-center">
                  <p className="text-3xl font-bold text-[#25D366]">98%</p>
                  <p className="text-sm text-muted-foreground mt-1">Taxa de abertura das mensagens</p>
                </div>
              </div>
              <Button 
                variant="outline"
                className="w-full mt-4"
                onClick={() => copyToClipboard(
                  `📊 RESULTADOS COMPROVADOS DO WHATSAPP MARKETING:\n\n• 23% dos clientes inativos VOLTAM a comprar\n• R$ 2.400/mês de aumento médio em vendas recuperadas\n• 8 horas/mês economizadas em trabalho manual\n• 98% de taxa de abertura (vs 20% do e-mail)\n\nSó o WhatsApp Marketing já paga o sistema inteiro!`,
                  'KPIs de Resultados'
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar KPIs
              </Button>
            </CardContent>
          </Card>

          {/* Card: Scripts de Abordagem */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                🎯 Scripts de Abordagem WhatsApp
              </CardTitle>
              <CardDescription>3 estilos para diferentes situações e perfis de lead</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Script Consultivo */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Consultivo</Badge>
                  <span className="text-sm text-muted-foreground">Para leads que precisam entender o valor</span>
                </div>
                <ScrollArea className="h-[180px] rounded-md border p-4 bg-muted/30">
                  <p className="text-sm whitespace-pre-wrap font-mono">
{`"Você mantém contato com seus clientes pelo WhatsApp?"
"Quando um cliente para de pedir, você entra em contato com ele?"

O problema: 68% dos clientes que compram uma vez nunca mais voltam se você não entrar em contato.

Nosso sistema identifica automaticamente clientes inativos há X dias e envia mensagem personalizada com o nome dele, último pedido e uma oferta especial. Tudo automático, 24/7.

Em média, 23% dos clientes inativos voltam a comprar. São R$ 2.400/mês em vendas que você está perdendo.`}
                  </p>
                </ScrollArea>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => copyToClipboard(
                    `"Você mantém contato com seus clientes pelo WhatsApp?"\n"Quando um cliente para de pedir, você entra em contato com ele?"\n\nO problema: 68% dos clientes que compram uma vez nunca mais voltam se você não entrar em contato.\n\nNosso sistema identifica automaticamente clientes inativos há X dias e envia mensagem personalizada com o nome dele, último pedido e uma oferta especial. Tudo automático, 24/7.\n\nEm média, 23% dos clientes inativos voltam a comprar. São R$ 2.400/mês em vendas que você está perdendo.`,
                    'Script Consultivo WhatsApp'
                  )}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Script Consultivo
                </Button>
              </div>

              <Separator />

              {/* Script Persuasivo */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">Persuasivo</Badge>
                  <span className="text-sm text-muted-foreground">Para leads que respondem a números</span>
                </div>
                <ScrollArea className="h-[200px] rounded-md border p-4 bg-muted/30">
                  <p className="text-sm whitespace-pre-wrap font-mono">
{`"Sabia que 68% dos clientes compram UMA VEZ e nunca mais voltam?"

Se você tem 100 clientes inativos:
- 23 voltam a comprar com mensagem personalizada
- Se cada um gasta R$ 80, são R$ 1.840/mês recuperados!

O sistema sincroniza seus contatos, identifica quem não compra há 15, 30, 60 dias, e envia mensagem automática:

"Oi {nome}, faz {dias} dias que você não pede da gente... Sentimos sua falta! 🍕 Que tal um cupom de 10% pra voltar?"

E isso está INCLUSO no plano. No mercado custa R$ 500-1.500/mês.`}
                  </p>
                </ScrollArea>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => copyToClipboard(
                    `"Sabia que 68% dos clientes compram UMA VEZ e nunca mais voltam?"\n\nSe você tem 100 clientes inativos:\n- 23 voltam a comprar com mensagem personalizada\n- Se cada um gasta R$ 80, são R$ 1.840/mês recuperados!\n\nO sistema sincroniza seus contatos, identifica quem não compra há 15, 30, 60 dias, e envia mensagem automática:\n\n"Oi {nome}, faz {dias} dias que você não pede da gente... Sentimos sua falta! 🍕 Que tal um cupom de 10% pra voltar?"\n\nE isso está INCLUSO no plano. No mercado custa R$ 500-1.500/mês.`,
                    'Script Persuasivo WhatsApp'
                  )}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Script Persuasivo
                </Button>
              </div>

              <Separator />

              {/* Script Urgência */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">Urgência</Badge>
                  <span className="text-sm text-muted-foreground">Para leads indecisos que precisam de pressão</span>
                </div>
                <ScrollArea className="h-[200px] rounded-md border p-4 bg-muted/30">
                  <p className="text-sm whitespace-pre-wrap font-mono">
{`"Você está JOGANDO DINHEIRO FORA todos os dias!"

68% dos seus clientes compraram uma vez e ESQUECERAM DE VOCÊ.
Clientes que VOCÊ conquistou, gastou dinheiro pra trazer...
E agora estão comprando DO CONCORRENTE!

Faz a conta:
100 clientes inativos × 23% = 23 clientes de volta
23 × R$ 80 = R$ 1.840/MÊS que você está PERDENDO!

O sistema recupera eles AUTOMATICAMENTE enquanto você dorme!

E sabe quanto custa? Está INCLUSO no plano.
Ferramentas similares cobram R$ 500-1.500/mês SÓ pelo WhatsApp Marketing.`}
                  </p>
                </ScrollArea>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => copyToClipboard(
                    `"Você está JOGANDO DINHEIRO FORA todos os dias!"\n\n68% dos seus clientes compraram uma vez e ESQUECERAM DE VOCÊ.\nClientes que VOCÊ conquistou, gastou dinheiro pra trazer...\nE agora estão comprando DO CONCORRENTE!\n\nFaz a conta:\n100 clientes inativos × 23% = 23 clientes de volta\n23 × R$ 80 = R$ 1.840/MÊS que você está PERDENDO!\n\nO sistema recupera eles AUTOMATICAMENTE enquanto você dorme!\n\nE sabe quanto custa? Está INCLUSO no plano.\nFerramentas similares cobram R$ 500-1.500/mês SÓ pelo WhatsApp Marketing.`,
                    'Script Urgência WhatsApp'
                  )}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Script Urgência
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card: FAQ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ❓ FAQ - Perguntas Frequentes sobre WhatsApp Marketing
              </CardTitle>
              <CardDescription>Respostas prontas para as dúvidas mais comuns</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Como funciona a recuperação automática?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      O sistema monitora todos os clientes e identifica quem não faz pedidos há X dias (você configura: 15, 30, 60 dias). 
                      Quando um cliente atinge esse período, o sistema envia automaticamente uma mensagem personalizada com o nome dele, 
                      mencionando o último pedido e oferecendo um incentivo para voltar. Tudo sem você precisar fazer nada!
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>Preciso de outro número de WhatsApp?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      Não! Você conecta o mesmo número que já usa no restaurante. O sistema funciona em paralelo, 
                      você continua usando o WhatsApp normalmente enquanto as automações trabalham por você.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>Quantos contatos posso ter?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      Ilimitados! Não há limite de contatos cadastrados. Você pode importar sua base inteira, 
                      sincronizar grupos e adicionar novos clientes sem restrição.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>As mensagens são realmente automáticas?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      Sim! Você configura uma vez os templates e as regras (ex: enviar após 15 dias sem pedido), 
                      e o sistema trabalha 24 horas por dia, 7 dias por semana. Você recebe relatórios de quantas 
                      mensagens foram enviadas e quantos clientes voltaram.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>Posso personalizar as mensagens?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      Totalmente! Você cria templates usando variáveis como {'{nome}'}, {'{último_pedido}'}, {'{dias_sem_comprar}'}, {'{link_loja}'}.
                      Cada mensagem sai personalizada com os dados reais do cliente. Quanto mais personalizada, maior a taxa de conversão!
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6">
                  <AccordionTrigger>O WhatsApp pode bloquear meu número?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      O sistema tem proteção anti-bloqueio com delays inteligentes entre mensagens e limites diários seguros. 
                      Além disso, as mensagens são personalizadas (não parecem spam) e só são enviadas para clientes que já 
                      têm relacionamento com você. A taxa de bloqueio é praticamente zero.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-7">
                  <AccordionTrigger>Funciona com grupos?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      Sim! Você pode extrair membros dos grupos que administra e transformá-los em contatos individuais. 
                      Isso é ótimo para grupos de promoções ou clientes VIP. Depois de extrair, pode enviar mensagens 
                      personalizadas para cada um.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-8">
                  <AccordionTrigger>Quanto custa?</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      O WhatsApp Marketing está INCLUSO em todos os planos! Não tem custo adicional. 
                      Ferramentas similares no mercado cobram de R$ 500 a R$ 1.500/mês. 
                      No Mostralo, você ganha isso de bônus junto com o sistema de delivery e marketing digital.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Card: Objeções Específicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                🛡️ Objeções Específicas de WhatsApp
              </CardTitle>
              <CardDescription>Respostas para quebrar resistências sobre o WhatsApp Marketing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Objeção 1 */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Badge variant="destructive" className="mt-1">❌</Badge>
                  <p className="font-semibold">"TENHO MEDO DE SER BLOQUEADO"</p>
                </div>
                <div className="ml-8 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">✅ Resposta:</p>
                  <p className="text-sm mt-1">
                    "O sistema tem proteção inteligente! Ele coloca delays entre as mensagens, respeita limites diários seguros, 
                    e só manda para clientes que JÁ COMPRARAM de você. Não é spam, é relacionamento. 
                    Além disso, as mensagens são personalizadas com o nome do cliente - isso não parece automatizado.
                    A taxa de bloqueio é praticamente zero!"
                  </p>
                </div>
              </div>

              <Separator />

              {/* Objeção 2 */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Badge variant="destructive" className="mt-1">❌</Badge>
                  <p className="font-semibold">"JÁ MANDO MENSAGEM MANUAL"</p>
                </div>
                <div className="ml-8 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">✅ Resposta:</p>
                  <p className="text-sm mt-1">
                    "E quanto tempo você gasta nisso? Com 100 clientes, mandando mensagem um por um...
                    O sistema economiza 8 HORAS por mês! E funciona 24/7, inclusive enquanto você dorme.
                    Você foca em fazer comida boa, o sistema cuida da reconquista!"
                  </p>
                </div>
              </div>

              <Separator />

              {/* Objeção 3 */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Badge variant="destructive" className="mt-1">❌</Badge>
                  <p className="font-semibold">"MEUS CLIENTES VÃO ACHAR SPAM"</p>
                </div>
                <div className="ml-8 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">✅ Resposta:</p>
                  <p className="text-sm mt-1">
                    "Spam é quando você manda a mesma mensagem genérica pra todo mundo. 
                    Com o sistema, a mensagem vai assim: 'Oi João, faz 20 dias que você não pede da gente... 
                    Da última vez você pediu nossa pizza marguerita! Sentimos sua falta!'
                    Isso não é spam, é CUIDADO! O cliente se sente lembrado, especial. 
                    Por isso a taxa de retorno é 23%!"
                  </p>
                </div>
              </div>

              <Separator />

              {/* Objeção 4 */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Badge variant="destructive" className="mt-1">❌</Badge>
                  <p className="font-semibold">"NÃO TENHO MUITOS CONTATOS"</p>
                </div>
                <div className="ml-8 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">✅ Resposta:</p>
                  <p className="text-sm mt-1">
                    "Melhor ainda! Com poucos contatos, cada cliente perdido pesa mais.
                    Se você tem 50 clientes e perde 68% (34), sobram 16. 
                    Recuperar 23% desses 34 = 8 clientes de volta!
                    E à medida que você cresce, o sistema já está configurado. 
                    O sistema também vincula automaticamente novos clientes que fazem pedido - sua base cresce sozinha!"
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEÇÃO 6: QUEBRA DE OBJEÇÕES */}
        <TabsContent value="objecoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                🛡️ Respostas para Objeções Comuns
              </CardTitle>
              <CardDescription>Use esses argumentos baseados em dados reais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Objeção 1 */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Badge variant="destructive" className="mt-1">❌</Badge>
                  <p className="font-semibold">"É CARO"</p>
                </div>
                <div className="ml-8 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">✅ Resposta:</p>
                  <p className="text-sm mt-1">
                    "Vamos fazer uma conta rápida: você paga R$ [TAXA_IFOOD] ao iFood todo mês.
                    O plano [PLANO_NOME] é R$ {formatCurrency(plans[0]?.price || 397.90)}.
                    Você economiza R$ [DIFERENÇA] por mês.
                    Em 1 ano são R$ [ANUAL]. Ainda acha caro? Sem contar o marketing digital incluso!"
                  </p>
                </div>
              </div>

              <Separator />

              {/* Objeção 2 */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Badge variant="destructive" className="mt-1">❌</Badge>
                  <p className="font-semibold">"NÃO TENHO CLIENTES FORA DO IFOOD"</p>
                </div>
                <div className="ml-8 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">✅ Resposta:</p>
                  <p className="text-sm mt-1">
                    "Normal! Mas pensa: você já conquistou esses clientes.
                    Com a economia de R$ [DIFERENÇA], você investe em marketing.
                    E no Mostralo o marketing já vem INCLUSO! Posts ilimitados, IA para criar conteúdo, análise de concorrentes..."
                  </p>
                </div>
              </div>

              <Separator />

              {/* Objeção 3 */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Badge variant="destructive" className="mt-1">❌</Badge>
                  <p className="font-semibold">"É DIFÍCIL DE USAR"</p>
                </div>
                <div className="ml-8 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">✅ Resposta:</p>
                  <p className="text-sm mt-1">
                    "Mais simples que o painel do iFood! Tem IA que atende cliente, organiza pedido automaticamente...
                    E tem suporte 24/7 se precisar de ajuda. Você tem 7 dias grátis pra testar!"
                  </p>
                </div>
              </div>

              <Separator />

              {/* Objeção 4 */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Badge variant="destructive" className="mt-1">❌</Badge>
                  <p className="font-semibold">"VOU PERDER VENDAS"</p>
                </div>
                <div className="ml-8 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">✅ Resposta:</p>
                  <p className="text-sm mt-1">
                    "No começo você pode manter os dois! Aos poucos, migra os clientes pro SEU sistema.
                    A economia das taxas paga seu marketing próprio. E lembra: no Mostralo o marketing já vem incluso!"
                  </p>
                </div>
              </div>

              <Separator />

              {/* Objeção 5 */}
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Badge variant="destructive" className="mt-1">❌</Badge>
                  <p className="font-semibold">"NÃO TENHO TEMPO AGORA"</p>
                </div>
                <div className="ml-8 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">✅ Resposta:</p>
                  <p className="text-sm mt-1">
                    "Entendo! Mas cada dia que passa você perde R$ [DIÁRIA] em taxas.
                    São R$ [SEMANAL] por semana. O sistema leva 30 minutos pra configurar, e a IA trabalha 24/7 por você."
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEÇÃO 6: FECHAMENTO */}
        <TabsContent value="fechamento" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>🎯 Técnicas de Fechamento</CardTitle>
              <CardDescription>Use essas técnicas para converter o lead em cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Badge>1</Badge>
                  Técnica da Economia Diária
                </h3>
                <div className="ml-8 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-mono">
                    "Cada dia que você fica no iFood, perde R$ [DIARIA].
                    São R$ [SEMANAL] por semana.
                    Quer começar a economizar HOJE ou semana que vem?"
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Badge>2</Badge>
                  Técnica do Teste Grátis
                </h3>
                <div className="ml-8 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm font-mono">
                    "Você tem 7 dias grátis pra testar.
                    Se não gostar, cancela sem pagar nada.
                    Mas se gostar, já começa a economizar no mês que vem.
                    O que você tem a perder?"
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Badge>3</Badge>
                  Técnica da Comparação
                </h3>
                <div className="ml-8 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Olha a comparação com os concorrentes:</p>
                    <ul className="text-sm space-y-1">
                      <li>• Anota AI: R$ 399 - SEM marketing</li>
                      <li>• Goomer: R$ 299 - SEM marketing</li>
                      <li>• Cardápio Web: R$ 397 - SEM marketing</li>
                      <li className="font-bold text-primary">• Mostralo: {formatCurrency(plans[0]?.price || 397.90)} - COM marketing incluso!</li>
                    </ul>
                    <p className="text-sm mt-2 italic">
                      Pelo mesmo preço, você ganha muito mais. Só o Mostralo tem marketing incluso!
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Badge className="bg-green-600">📲</Badge>
                  CTA Final
                </h3>
                <div className="ml-8 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm font-mono text-green-700 dark:text-green-300">
                    "Vou te mandar o link agora. É só criar a conta.
                    Em 30 minutos seu cardápio já está no ar.
                    [LINK_SIGNUP]
                    
                    Qualquer dúvida, me chama! Estou aqui pra ajudar 😊"
                  </p>
                </div>
                <Button 
                  className="ml-8 mt-2"
                  onClick={() => {
                    const link = `${window.location.origin}/signup`;
                    copyToClipboard(link, 'Link de cadastro');
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Link de Cadastro
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-primary">💡 Dica de Ouro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Sempre que possível, <strong>mencione o marketing digital incluso</strong>. 
                Esse é o nosso GRANDE DIFERENCIAL que nenhum concorrente tem. 
                Esse argumento sozinho pode fechar muitas vendas!
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
