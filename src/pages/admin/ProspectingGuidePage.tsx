import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Phone, MessageSquare, Instagram, Target, Shield, CheckCircle, TrendingUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    return { ifoodFee, savings, annual, daily };
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
      <div>
        <h1 className="text-3xl font-bold mb-2">📋 Guia Completo de Prospecção</h1>
        <p className="text-muted-foreground">
          Tudo que você precisa para prospectar, qualificar e fechar vendas com confiança.
        </p>
      </div>

      <Tabs defaultValue="como-prospectar" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="como-prospectar">Como Prospectar</TabsTrigger>
          <TabsTrigger value="scripts">Scripts</TabsTrigger>
          <TabsTrigger value="qualificacao">Qualificação</TabsTrigger>
          <TabsTrigger value="apresentacao">Apresentação</TabsTrigger>
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
              </ul>
              <p className="text-sm text-muted-foreground italic pt-2">
                💡 Isso normalmente custa R$ 800-2.000/mês numa agência. No Mostralo, já está no pacote!
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEÇÃO 5: QUEBRA DE OBJEÇÕES */}
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
