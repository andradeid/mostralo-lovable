import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Phone, MessageSquare, MapPin, Clock, Users, Target, Search, Mic, Calendar, ThermometerSun, Gift, UserCheck, Building2, Pizza, Coffee, Croissant, IceCream, Store } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
  toast.success(`${label} copiado!`);
};

export function ColdLeadsGuideTab() {
  return (
    <div className="space-y-6">
      {/* Preparação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            📍 Preparação Antes de Ligar
          </CardTitle>
          <CardDescription>Pesquise o lead no Google Maps antes de fazer contato</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Search className="h-4 w-4" />
                O Que Analisar
              </h4>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Avaliações</strong>: 100+ = bom volume, potencial R$ 15k+/mês</li>
                <li>• <strong>Fotos</strong>: Qualidade indica profissionalismo</li>
                <li>• <strong>Horário</strong>: Quando abre/fecha (evitar rush)</li>
                <li>• <strong>Delivery</strong>: Se tem delivery ou só presencial</li>
                <li>• <strong>Site/Instagram</strong>: Links nas informações</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <UserCheck className="h-4 w-4" />
                Descobrir o Dono
              </h4>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Instagram</strong>: Quem responde stories, bio com nome</li>
                <li>• <strong>Facebook</strong>: Páginas mostram administradores</li>
                <li>• <strong>Site</strong>: Seção "Sobre nós" ou "Quem somos"</li>
                <li>• <strong>LinkedIn</strong>: Buscar empresa e ver sócios</li>
                <li>• <strong>Reclame Aqui</strong>: Respostas às vezes têm nome</li>
              </ul>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">💡 Estimativa de Faturamento por Avaliações</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="font-bold">50-100 reviews</p>
                <p className="text-muted-foreground">~R$ 8-12k/mês</p>
              </div>
              <div className="text-center">
                <p className="font-bold">100-300 reviews</p>
                <p className="text-muted-foreground">~R$ 15-25k/mês</p>
              </div>
              <div className="text-center">
                <p className="font-bold">300+ reviews</p>
                <p className="text-muted-foreground">~R$ 30k+/mês</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horários Estratégicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            ⏰ Horários Estratégicos
          </CardTitle>
          <CardDescription>Quando o dono provavelmente está disponível</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <Badge className="bg-green-500 mb-2">✅ IDEAL</Badge>
                <p className="font-semibold">9h - 10h (manhã)</p>
                <p className="text-sm text-muted-foreground">Dono chegando, antes do rush do almoço</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <Badge className="bg-green-500 mb-2">✅ BOM</Badge>
                <p className="font-semibold">15h - 16h (tarde)</p>
                <p className="text-sm text-muted-foreground">Intervalo entre almoço e jantar</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Badge className="bg-blue-500 mb-2">📅 TÁTICO</Badge>
                <p className="font-semibold">Segunda-feira 9h</p>
                <p className="text-sm text-muted-foreground">Reuniões semanais, dono presente</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <Badge variant="destructive" className="mb-2">❌ EVITAR</Badge>
                <p className="font-semibold">11h - 14h</p>
                <p className="text-sm text-muted-foreground">Rush do almoço - ocupados demais</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <Badge variant="destructive" className="mb-2">❌ EVITAR</Badge>
                <p className="font-semibold">18h - 22h</p>
                <p className="text-sm text-muted-foreground">Rush do jantar - pior momento</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <Badge variant="destructive" className="mb-2">❌ EVITAR</Badge>
                <p className="font-semibold">Sexta e Sábado</p>
                <p className="text-sm text-muted-foreground">Dias mais movimentados</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fase 1: Mensagem Automática */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
            🤖 Fase 1: Passando pela Mensagem Automática
          </CardTitle>
          <CardDescription>Como fazer o humano responder quando tem bot</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/30 border">
            <p className="text-sm font-medium mb-2">Script após receber mensagem automática:</p>
            <ScrollArea className="h-[150px] rounded-md border p-4 bg-background">
              <pre className="text-sm whitespace-pre-wrap font-mono">
{`Oi! Vi a resposta automática 😊

Uma pergunta rápida: vocês fazem delivery pelo WhatsApp 
ou usam só iFood/Rappi?

Pergunto porque trabalho com restaurantes da região 
e queria entender como vocês funcionam.`}
              </pre>
            </ScrollArea>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3 w-full"
              onClick={() => copyToClipboard(
                `Oi! Vi a resposta automática 😊\n\nUma pergunta rápida: vocês fazem delivery pelo WhatsApp ou usam só iFood/Rappi?\n\nPergunto porque trabalho com restaurantes da região e queria entender como vocês funcionam.`,
                'Script Fase 1'
              )}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Script
            </Button>
          </div>
          
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">💡 Por que funciona:</h4>
            <ul className="text-sm space-y-1">
              <li>• Reconhece que é automático (transparência)</li>
              <li>• Faz pergunta que robô não responde</li>
              <li>• "Da região" gera identificação local</li>
              <li>• Não vende nada ainda - só curiosidade</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Fase 2: Conquistando o Funcionário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
            👥 Fase 2: Conquistando o Funcionário
          </CardTitle>
          <CardDescription>Transforme o gatekeeper em aliado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4" />
                Script Telefone
              </h4>
              <ScrollArea className="h-[180px] rounded-md border p-3 bg-background">
                <pre className="text-sm whitespace-pre-wrap font-mono">
{`Oi! Tudo bem?
Vi vocês no Google Maps, 4.8 estrelas! 
Parabéns pelo trabalho!

Estou entrando em contato porque trabalho 
com [pizzarias/restaurantes] da região.

Você poderia me ajudar?
Qual o melhor horário pra eu falar 
com o dono/gerente sobre uma parceria 
que pode reduzir custos com delivery?`}
                </pre>
              </ScrollArea>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => copyToClipboard(
                  `Oi! Tudo bem?\nVi vocês no Google Maps, 4.8 estrelas! Parabéns pelo trabalho!\n\nEstou entrando em contato porque trabalho com [pizzarias/restaurantes] da região.\n\nVocê poderia me ajudar?\nQual o melhor horário pra eu falar com o dono/gerente sobre uma parceria que pode reduzir custos com delivery?`,
                  'Script Telefone'
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 border">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4" />
                Script WhatsApp
              </h4>
              <ScrollArea className="h-[180px] rounded-md border p-3 bg-background">
                <pre className="text-sm whitespace-pre-wrap font-mono">
{`Boa tarde! 😊

Vi vocês no Google Maps e achei incrível 
a nota de vocês!

Trabalho com [tipo de negócio] aqui 
da região ajudando a reduzir custos 
com iFood.

Você consegue me passar o contato 
de quem cuida das parcerias? 
Ou um horário que o responsável esteja?

Agradeço muito! 🙏`}
                </pre>
              </ScrollArea>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => copyToClipboard(
                  `Boa tarde! 😊\n\nVi vocês no Google Maps e achei incrível a nota de vocês!\n\nTrabalho com [tipo de negócio] aqui da região ajudando a reduzir custos com iFood.\n\nVocê consegue me passar o contato de quem cuida das parcerias? Ou um horário que o responsável esteja?\n\nAgradeço muito! 🙏`,
                  'Script WhatsApp'
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-3">🛡️ Tabela de Objeções do Gatekeeper</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-semibold">Funcionário diz</th>
                    <th className="text-left p-2 font-semibold">Você responde</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2 text-muted-foreground">"Não passamos contato"</td>
                    <td className="p-2">"Entendo! Qual o melhor horário que eu ligo e ele atende?"</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 text-muted-foreground">"Manda por email"</td>
                    <td className="p-2">"Claro! Qual o email? E o nome do responsável pra eu direcionar?"</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 text-muted-foreground">"Ele não está"</td>
                    <td className="p-2">"Sem problema! Você sabe que horas ele costuma chegar?"</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 text-muted-foreground">"Não temos interesse"</td>
                    <td className="p-2">"Compreendo! Só uma curiosidade: vocês usam iFood hoje?"</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-muted-foreground">"Qual o assunto?"</td>
                    <td className="p-2">"É sobre uma forma de economizar nas taxas do iFood. Você sabe quanto pagam lá?"</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fase 3: Primeiro Contato com o Dono */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">3</span>
            📞 Fase 3: Primeiro Contato com o Dono
          </CardTitle>
          <CardDescription>Scripts para quando finalmente falar com o decisor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">✅ Com nome descoberto</h4>
              <ScrollArea className="h-[200px] rounded-md border p-3 bg-background">
                <pre className="text-sm whitespace-pre-wrap font-mono">
{`Oi [Nome]! Tudo bem?

Eu sou [Seu Nome], trabalho com 
[pizzarias/restaurantes] aqui da [cidade/bairro].

Vi que a [Nome do Estabelecimento] tem 
4.8 estrelas no Google - isso é raro! 
Parabéns!

Queria te fazer uma pergunta rápida:
Quanto em média vocês pagam de taxa 
pro iFood por mês?`}
                </pre>
              </ScrollArea>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => copyToClipboard(
                  `Oi [Nome]! Tudo bem?\n\nEu sou [Seu Nome], trabalho com [pizzarias/restaurantes] aqui da [cidade/bairro].\n\nVi que a [Nome do Estabelecimento] tem 4.8 estrelas no Google - isso é raro! Parabéns!\n\nQueria te fazer uma pergunta rápida:\nQuanto em média vocês pagam de taxa pro iFood por mês?`,
                  'Script com Nome'
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">📋 Sem nome (contato direto)</h4>
              <ScrollArea className="h-[200px] rounded-md border p-3 bg-background">
                <pre className="text-sm whitespace-pre-wrap font-mono">
{`Oi! Estou falando com o responsável 
pela [Nome do Local]?

Sou [Seu Nome], trabalho com restaurantes 
da região ajudando a reduzir custos 
com delivery.

Antes de qualquer coisa, uma pergunta:
Vocês usam iFood/Rappi hoje?

[Se sim]: Quanto mais ou menos vocês 
pagam de taxa por mês?`}
                </pre>
              </ScrollArea>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 w-full"
                onClick={() => copyToClipboard(
                  `Oi! Estou falando com o responsável pela [Nome do Local]?\n\nSou [Seu Nome], trabalho com restaurantes da região ajudando a reduzir custos com delivery.\n\nAntes de qualquer coisa, uma pergunta:\nVocês usam iFood/Rappi hoje?\n\n[Se sim]: Quanto mais ou menos vocês pagam de taxa por mês?`,
                  'Script sem Nome'
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4 Perfis de Abordagem */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            🎭 4 Perfis de Abordagem
          </CardTitle>
          <CardDescription>Escolha o perfil que combina com o lead</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="fun">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">😄</span>
                  <span className="font-semibold">Divertido/Descontraído</span>
                  <Badge variant="outline" className="ml-2">Hamburguerias, Açaís</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 p-4">
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-sm"><strong>Personalidade:</strong> Leve, usa emojis, humor sutil, não pressiona</p>
                    <p className="text-sm"><strong>Ideal para:</strong> Estabelecimentos jovens, ambiente descontraído</p>
                  </div>
                  <ScrollArea className="h-[200px] rounded-md border p-4 bg-muted/30">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
{`Oi! 👋
Vi vocês no Google Maps e pensei: 
"Cara, 4.8 estrelas? Preciso conhecer esse pessoal!"

Trabalho ajudando restaurantes a economizar 
com esse tal de iFood 😅

Uma curiosidade: vocês pagam quanto de taxa lá? 
(só pra eu chorar junto ou comemorar com vocês 🎉)

E outra: vocês mantêm contato com os clientes 
pelo WhatsApp ou só espera eles voltarem?`}
                    </pre>
                  </ScrollArea>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => copyToClipboard(
                      `Oi! 👋\nVi vocês no Google Maps e pensei: "Cara, 4.8 estrelas? Preciso conhecer esse pessoal!"\n\nTrabalho ajudando restaurantes a economizar com esse tal de iFood 😅\n\nUma curiosidade: vocês pagam quanto de taxa lá? (só pra eu chorar junto ou comemorar com vocês 🎉)\n\nE outra: vocês mantêm contato com os clientes pelo WhatsApp ou só espera eles voltarem?`,
                      'Perfil Divertido'
                    )}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Script Completo
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="polite">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🤝</span>
                  <span className="font-semibold">Educado/Consultivo</span>
                  <Badge variant="outline" className="ml-2">Restaurantes, Padarias</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 p-4">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-sm"><strong>Personalidade:</strong> Respeitoso, faz perguntas, oferece valor antes</p>
                    <p className="text-sm"><strong>Ideal para:</strong> Restaurantes tradicionais, negócios familiares</p>
                  </div>
                  <ScrollArea className="h-[200px] rounded-md border p-4 bg-muted/30">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
{`Boa tarde!

Antes de qualquer coisa, peço desculpas 
se estiver em momento corrido.

Sou consultor de delivery para estabelecimentos 
da região e vi vocês no Google Maps.

Posso fazer uma pergunta rápida sobre 
como vocês gerenciam o delivery hoje?
Prometo não tomar seu tempo.

Se usar iFood, gostaria de mostrar uma forma 
de economizar significativamente nas taxas.`}
                    </pre>
                  </ScrollArea>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => copyToClipboard(
                      `Boa tarde!\n\nAntes de qualquer coisa, peço desculpas se estiver em momento corrido.\n\nSou consultor de delivery para estabelecimentos da região e vi vocês no Google Maps.\n\nPosso fazer uma pergunta rápida sobre como vocês gerenciam o delivery hoje?\nPrometo não tomar seu tempo.\n\nSe usar iFood, gostaria de mostrar uma forma de economizar significativamente nas taxas.`,
                      'Perfil Educado'
                    )}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Script Completo
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="persuasive">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  <span className="font-semibold">Persuasivo/Dados</span>
                  <Badge variant="outline" className="ml-2">Pizzarias, Franquias</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 p-4">
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <p className="text-sm"><strong>Personalidade:</strong> Direto, foca em números, cria urgência com fatos</p>
                    <p className="text-sm"><strong>Ideal para:</strong> Donos analíticos, maiores, que gostam de dados</p>
                  </div>
                  <ScrollArea className="h-[200px] rounded-md border p-4 bg-muted/30">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
{`Olá! Direto ao ponto:

Analisei 47 restaurantes da região esta semana.
A média de taxa paga ao iFood é R$ 3.200/mês.

Vi que vocês têm ótima avaliação no Google Maps.
Provavelmente pagam mais que isso, certo?

Posso mostrar como 3 pizzarias daqui 
reduziram isso para R$ 397 fixo?

Além disso, nosso WhatsApp Marketing recupera 
23% dos clientes inativos automaticamente.
São em média R$ 2.400/mês em vendas extras.`}
                    </pre>
                  </ScrollArea>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => copyToClipboard(
                      `Olá! Direto ao ponto:\n\nAnalisei 47 restaurantes da região esta semana.\nA média de taxa paga ao iFood é R$ 3.200/mês.\n\nVi que vocês têm ótima avaliação no Google Maps.\nProvavelmente pagam mais que isso, certo?\n\nPosso mostrar como 3 pizzarias daqui reduziram isso para R$ 397 fixo?\n\nAlém disso, nosso WhatsApp Marketing recupera 23% dos clientes inativos automaticamente.\nSão em média R$ 2.400/mês em vendas extras.`,
                      'Perfil Persuasivo'
                    )}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Script Completo
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="urgent">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⚡</span>
                  <span className="font-semibold">Urgente/Direto</span>
                  <Badge variant="outline" className="ml-2">Follow-ups, Leads que sumiram</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 p-4">
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm"><strong>Personalidade:</strong> Sem rodeios, foco em ação, para follow-ups</p>
                    <p className="text-sm"><strong>Ideal para:</strong> Retomada de contato, leads que não responderam</p>
                  </div>
                  <ScrollArea className="h-[200px] rounded-md border p-4 bg-muted/30">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
{`Oi [Nome], tudo bem?

Tentei falar contigo semana passada.
Vou ser direto: você prefere continuar 
pagando 27% pro iFood crescer...

Ou quer que eu te mostre em 3 minutos 
como transformar isso em R$ 397 fixo?

E mais: enquanto você pensa, 68% dos seus 
clientes estão esquecendo de você.
Nosso WhatsApp recupera eles automaticamente.

Se não fizer sentido, só me avisa 
que não insisto mais. 👍`}
                    </pre>
                  </ScrollArea>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => copyToClipboard(
                      `Oi [Nome], tudo bem?\n\nTentei falar contigo semana passada.\nVou ser direto: você prefere continuar pagando 27% pro iFood crescer...\n\nOu quer que eu te mostre em 3 minutos como transformar isso em R$ 397 fixo?\n\nE mais: enquanto você pensa, 68% dos seus clientes estão esquecendo de você.\nNosso WhatsApp recupera eles automaticamente.\n\nSe não fizer sentido, só me avisa que não insisto mais. 👍`,
                      'Perfil Urgente'
                    )}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Script Completo
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Scripts por Nicho */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            🎯 Scripts por Nicho
          </CardTitle>
          <CardDescription>Dor principal e argumento matador para cada tipo de negócio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Pizza className="h-5 w-5 text-orange-500" />
                <h4 className="font-semibold">Pizzaria</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2"><strong>Dor:</strong> Ticket alto = taxa alta</p>
              <p className="text-sm mb-3"><strong>Argumento:</strong> "Pizza de R$ 60 = R$ 15 pro iFood. Em 100 pizzas/mês = R$ 1.500. São DUAS pizzas por dia só pra pagar o iFood!"</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => copyToClipboard(
                  `"Pizza de R$ 60 = R$ 15 pro iFood. Em 100 pizzas/mês = R$ 1.500.\n\nSão DUAS pizzas por dia só pra pagar o iFood!\n\nNo Mostralo é R$ 397 fixo. Economiza R$ 1.100/mês = R$ 13.200/ano!"`,
                  'Script Pizzaria'
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>

            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Coffee className="h-5 w-5 text-amber-600" />
                <h4 className="font-semibold">Hamburgueria</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2"><strong>Dor:</strong> Margem apertada</p>
              <p className="text-sm mb-3"><strong>Argumento:</strong> "Combo R$ 35 com 30% de custo. iFood leva mais 27%. Sobra 43%. No Mostralo sobra 70%!"</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => copyToClipboard(
                  `"Combo R$ 35 com 30% de custo = R$ 10,50.\niFood leva mais 27% = R$ 9,45.\nSobra R$ 15,05 (43%).\n\nNo Mostralo:\nMesmo combo R$ 35 - R$ 10,50 custo = R$ 24,50 (70%).\n\nDiferença de R$ 9,45 POR COMBO!\n100 combos = R$ 945/mês de economia!"`,
                  'Script Hamburgueria'
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>

            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Store className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold">Restaurante</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2"><strong>Dor:</strong> Cliente não volta</p>
              <p className="text-sm mb-3"><strong>Argumento:</strong> "68% dos clientes compram UMA VEZ e nunca mais voltam. WhatsApp Marketing recupera 23% automaticamente!"</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => copyToClipboard(
                  `"68% dos clientes compram UMA VEZ pelo iFood e nunca mais voltam!\n\nO cliente é do IFOOD, não seu.\n\nNo Mostralo:\n✅ Cliente é SEU\n✅ WhatsApp Marketing recupera 23% automaticamente\n✅ Em média R$ 2.400/mês em vendas recuperadas!"`,
                  'Script Restaurante'
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>

            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Croissant className="h-5 w-5 text-yellow-600" />
                <h4 className="font-semibold">Padaria/Confeitaria</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2"><strong>Dor:</strong> Pedidos frequentes, baixo valor</p>
              <p className="text-sm mb-3"><strong>Argumento:</strong> "Pedido médio R$ 25 x 200 pedidos = 27% de R$ 5.000 = R$ 1.350. Taxa fixa rende mais!"</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => copyToClipboard(
                  `"Pedido médio R$ 25.\n200 pedidos/mês = R$ 5.000 faturamento.\n27% pro iFood = R$ 1.350!\n\nNo Mostralo: R$ 397 fixo.\nEconomia: R$ 953/mês = R$ 11.436/ano!\n\nE ainda tem WhatsApp Marketing que avisa os clientes sobre novidades automaticamente!"`,
                  'Script Padaria'
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>

            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <IceCream className="h-5 w-5 text-pink-500" />
                <h4 className="font-semibold">Açaí/Sorvete</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2"><strong>Dor:</strong> Sazonalidade + frequência</p>
              <p className="text-sm mb-3"><strong>Argumento:</strong> "No verão vende muito, no inverno precisa de marketing. WhatsApp Marketing mantém cliente ativo o ano todo!"</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => copyToClipboard(
                  `"No verão o açaí vende sozinho. E no inverno?\n\nCom WhatsApp Marketing:\n✅ Mensagem automática: 'Oi {nome}, faz {dias} dias que você não pede!'\n✅ 23% voltam a comprar\n✅ Mantém faturamento estável o ano todo!\n\nAlém de economizar nas taxas do iFood!"`,
                  'Script Açaí'
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>

            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Store className="h-5 w-5 text-red-500" />
                <h4 className="font-semibold">Marmitaria</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-2"><strong>Dor:</strong> Volume alto, margem baixa</p>
              <p className="text-sm mb-3"><strong>Argumento:</strong> "Marmita R$ 18 x 500/mês. 27% = R$ 2.430 pro iFood. Taxa fixa = lucro dobrado!"</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => copyToClipboard(
                  `"Marmita R$ 18 x 500 pedidos/mês = R$ 9.000.\n27% pro iFood = R$ 2.430!\n\nNo Mostralo: R$ 397 fixo.\nEconomia: R$ 2.033/mês!\n\nSão R$ 24.396/ano que ficam no SEU bolso!\n\nE o WhatsApp Marketing fideliza os clientes que pedem todo dia!"`,
                  'Script Marmitaria'
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sequência de Follow-up */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            📅 Sequência de Follow-up (30 dias)
          </CardTitle>
          <CardDescription>Cronograma para não deixar o lead esfriar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border bg-green-500/10 border-green-500/20">
                <Badge className="bg-green-500 mb-2">Dia 1</Badge>
                <p className="font-semibold">Primeiro contato</p>
                <p className="text-sm text-muted-foreground">Apresentação + pergunta qualificadora</p>
              </div>
              <div className="p-4 rounded-lg border bg-blue-500/10 border-blue-500/20">
                <Badge className="bg-blue-500 mb-2">Dia 3</Badge>
                <p className="font-semibold">Follow-up 1</p>
                <p className="text-sm text-muted-foreground">"Vi que não conseguimos conversar..."</p>
              </div>
              <div className="p-4 rounded-lg border bg-yellow-500/10 border-yellow-500/20">
                <Badge className="bg-yellow-500 mb-2">Dia 7</Badge>
                <p className="font-semibold">Follow-up 2</p>
                <p className="text-sm text-muted-foreground">Enviar dado relevante + áudio</p>
              </div>
              <div className="p-4 rounded-lg border bg-orange-500/10 border-orange-500/20">
                <Badge className="bg-orange-500 mb-2">Dia 14</Badge>
                <p className="font-semibold">Follow-up 3</p>
                <p className="text-sm text-muted-foreground">Case de sucesso da região</p>
              </div>
            </div>

            <Separator />

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="followup-scripts">
                <AccordionTrigger>📝 Ver Scripts de Follow-up</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 p-4">
                    <div className="p-3 rounded-lg bg-muted/30 border">
                      <p className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Dia 3 - Follow-up Suave</p>
                      <p className="text-sm font-mono bg-background p-2 rounded">{`"Oi! Tudo bem?\nPassei aqui pra ver se você conseguiu dar uma olhada naquela proposta de economia.\nQualquer dúvida estou à disposição! 😊"`}</p>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`Oi! Tudo bem?\nPassei aqui pra ver se você conseguiu dar uma olhada naquela proposta de economia.\nQualquer dúvida estou à disposição! 😊`, 'Follow-up Dia 3')}>
                        <Copy className="h-4 w-4 mr-2" />Copiar
                      </Button>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border">
                      <p className="font-semibold text-yellow-600 dark:text-yellow-400 mb-2">Dia 7 - Follow-up com Dado</p>
                      <p className="text-sm font-mono bg-background p-2 rounded">{`"Oi [Nome]!\nPassando pra compartilhar: uma pizzaria aqui da região economizou R$ 28.800 no primeiro ano saindo do iFood.\nSe quiser, posso te mostrar como funciona em 5 minutos. 📊"`}</p>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`Oi [Nome]!\nPassando pra compartilhar: uma pizzaria aqui da região economizou R$ 28.800 no primeiro ano saindo do iFood.\nSe quiser, posso te mostrar como funciona em 5 minutos. 📊`, 'Follow-up Dia 7')}>
                        <Copy className="h-4 w-4 mr-2" />Copiar
                      </Button>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border">
                      <p className="font-semibold text-orange-600 dark:text-orange-400 mb-2">Dia 14 - Follow-up Direto</p>
                      <p className="text-sm font-mono bg-background p-2 rounded">{`"[Nome], última tentativa aqui!\nSei que é corrido, mas em 2 semanas você já perdeu R$ [valor] em taxas pro iFood.\nTe mando o link pra testar 7 dias grátis?"`}</p>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`[Nome], última tentativa aqui!\nSei que é corrido, mas em 2 semanas você já perdeu R$ [valor] em taxas pro iFood.\nTe mando o link pra testar 7 dias grátis?`, 'Follow-up Dia 14')}>
                        <Copy className="h-4 w-4 mr-2" />Copiar
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </CardContent>
      </Card>

      {/* Roteiros de Áudio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            🎙️ Roteiros de Áudio (30-45s)
          </CardTitle>
          <CardDescription>Áudios têm 3x mais engajamento que texto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">😄</span>
                <h4 className="font-semibold">Áudio Divertido</h4>
              </div>
              <p className="text-sm mb-3 text-muted-foreground">Tom: Animado, leve</p>
              <ScrollArea className="h-[120px] rounded-md border p-3 bg-background">
                <p className="text-sm">"E aí, tudo bem? Vi vocês no Google Maps, nota incrível! Olha, trabalho com restaurantes aqui da região e queria te fazer uma pergunta rápida: vocês usam iFood? Porque cara, se você fatura uns 10 mil lá, tá deixando mais de 2 mil todo mês com eles! Posso te mostrar uma forma de economizar isso e ainda ter marketing incluso. Me responde aí!"</p>
              </ScrollArea>
              <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => copyToClipboard(`E aí, tudo bem? Vi vocês no Google Maps, nota incrível! Olha, trabalho com restaurantes aqui da região e queria te fazer uma pergunta rápida: vocês usam iFood? Porque cara, se você fatura uns 10 mil lá, tá deixando mais de 2 mil todo mês com eles! Posso te mostrar uma forma de economizar isso e ainda ter marketing incluso. Me responde aí!`, 'Áudio Divertido')}>
                <Copy className="h-4 w-4 mr-2" />Copiar
              </Button>
            </div>

            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🤝</span>
                <h4 className="font-semibold">Áudio Educado</h4>
              </div>
              <p className="text-sm mb-3 text-muted-foreground">Tom: Calmo, profissional</p>
              <ScrollArea className="h-[120px] rounded-md border p-3 bg-background">
                <p className="text-sm">"Boa tarde! Peço desculpas se estiver ocupado. Sou consultor de delivery e vi vocês no Google Maps. Gostaria de fazer uma pergunta rápida sobre como gerenciam o delivery. Se usam iFood, tenho uma proposta que pode economizar bastante nas taxas. Posso explicar em 2 minutos quando for melhor pra você."</p>
              </ScrollArea>
              <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => copyToClipboard(`Boa tarde! Peço desculpas se estiver ocupado. Sou consultor de delivery e vi vocês no Google Maps. Gostaria de fazer uma pergunta rápida sobre como gerenciam o delivery. Se usam iFood, tenho uma proposta que pode economizar bastante nas taxas. Posso explicar em 2 minutos quando for melhor pra você.`, 'Áudio Educado')}>
                <Copy className="h-4 w-4 mr-2" />Copiar
              </Button>
            </div>

            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">📊</span>
                <h4 className="font-semibold">Áudio Persuasivo</h4>
              </div>
              <p className="text-sm mb-3 text-muted-foreground">Tom: Confiante, dados</p>
              <ScrollArea className="h-[120px] rounded-md border p-3 bg-background">
                <p className="text-sm">"Olá! Vou direto ao ponto: analisei 47 restaurantes da região essa semana e a média de taxa pro iFood é 3.200 reais por mês. Com a nota de vocês no Google, provavelmente pagam mais. Posso mostrar como 3 pizzarias daqui reduziram isso pra 397 fixo E ainda ganharam WhatsApp Marketing que recupera clientes automaticamente?"</p>
              </ScrollArea>
              <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => copyToClipboard(`Olá! Vou direto ao ponto: analisei 47 restaurantes da região essa semana e a média de taxa pro iFood é 3.200 reais por mês. Com a nota de vocês no Google, provavelmente pagam mais. Posso mostrar como 3 pizzarias daqui reduziram isso pra 397 fixo E ainda ganharam WhatsApp Marketing que recupera clientes automaticamente?`, 'Áudio Persuasivo')}>
                <Copy className="h-4 w-4 mr-2" />Copiar
              </Button>
            </div>

            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">⚡</span>
                <h4 className="font-semibold">Áudio Urgente</h4>
              </div>
              <p className="text-sm mb-3 text-muted-foreground">Tom: Direto, impacto</p>
              <ScrollArea className="h-[120px] rounded-md border p-3 bg-background">
                <p className="text-sm">"Tentei falar contigo antes. Vou ser direto: se você fatura 15 mil no iFood, tá pagando quase 4 mil de taxa. São mais de 130 reais POR DIA. Enquanto você pensa, esse dinheiro tá indo pro bolso deles. Posso te mostrar em 3 minutos como mudar isso. Se não fizer sentido, não insisto mais."</p>
              </ScrollArea>
              <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => copyToClipboard(`Tentei falar contigo antes. Vou ser direto: se você fatura 15 mil no iFood, tá pagando quase 4 mil de taxa. São mais de 130 reais POR DIA. Enquanto você pensa, esse dinheiro tá indo pro bolso deles. Posso te mostrar em 3 minutos como mudar isso. Se não fizer sentido, não insisto mais.`, 'Áudio Urgente')}>
                <Copy className="h-4 w-4 mr-2" />Copiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classificação de Temperatura */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ThermometerSun className="h-5 w-5" />
            🌡️ Classificação de Temperatura do Lead
          </CardTitle>
          <CardDescription>Identifique e priorize seus leads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
              <p className="text-3xl mb-2">🔥</p>
              <p className="font-bold text-red-600 dark:text-red-400">QUENTE</p>
              <ul className="text-xs text-left mt-2 space-y-1">
                <li>• Reclamou das taxas</li>
                <li>• Pediu mais info</li>
                <li>• Fez perguntas</li>
                <li>• Respondeu rápido</li>
              </ul>
              <p className="text-xs mt-2 font-medium">Ação: Fechar HOJE</p>
            </div>
            <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
              <p className="text-3xl mb-2">🟠</p>
              <p className="font-bold text-orange-600 dark:text-orange-400">MORNO</p>
              <ul className="text-xs text-left mt-2 space-y-1">
                <li>• Mostrou interesse</li>
                <li>• "Vou pensar"</li>
                <li>• Pediu tempo</li>
                <li>• Respondeu devagar</li>
              </ul>
              <p className="text-xs mt-2 font-medium">Ação: Follow-up em 3 dias</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
              <p className="text-3xl mb-2">❄️</p>
              <p className="font-bold text-blue-600 dark:text-blue-400">FRIO</p>
              <ul className="text-xs text-left mt-2 space-y-1">
                <li>• Não respondeu</li>
                <li>• "Não tenho interesse"</li>
                <li>• Funcionário bloqueou</li>
                <li>• Sem engajamento</li>
              </ul>
              <p className="text-xs mt-2 font-medium">Ação: Follow-up em 7 dias</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-500/10 border border-gray-500/20 text-center">
              <p className="text-3xl mb-2">🧊</p>
              <p className="font-bold text-gray-600 dark:text-gray-400">CONGELADO</p>
              <ul className="text-xs text-left mt-2 space-y-1">
                <li>• Bloqueou</li>
                <li>• "Não me ligue mais"</li>
                <li>• 3+ tentativas sem resposta</li>
                <li>• Resposta hostil</li>
              </ul>
              <p className="text-xs mt-2 font-medium">Ação: Revisitar em 60 dias</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ofertas de Entrada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            🎁 Ofertas de Entrada (Iscas)
          </CardTitle>
          <CardDescription>Gere valor antes de pedir algo em troca</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border bg-green-500/10 border-green-500/20">
              <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">📊 Análise Gratuita de Taxas</h4>
              <p className="text-sm mb-3">"Posso fazer uma análise gratuita de quanto você está gastando em taxas? Sem compromisso - só pra você ter clareza dos números."</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => copyToClipboard(
                  `"Posso fazer uma análise gratuita de quanto você está gastando em taxas?\n\nSem compromisso - só pra você ter clareza dos números.\n\nMe passa seu faturamento médio mensal que eu calculo pra você quanto está deixando no iFood e quanto economizaria."`,
                  'Isca Análise'
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>

            <div className="p-4 rounded-lg border bg-blue-500/10 border border-blue-500/20">
              <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">📱 Demonstração WhatsApp Marketing</h4>
              <p className="text-sm mb-3">"Quer que eu te mostre como funciona a recuperação automática de clientes? Te mando um vídeo de 2 minutos explicando."</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => copyToClipboard(
                  `"Quer que eu te mostre como funciona a recuperação automática de clientes?\n\nTe mando um vídeo de 2 minutos explicando como o WhatsApp Marketing identifica clientes inativos e manda mensagem personalizada automaticamente.\n\n23% voltam a comprar em média!"`,
                  'Isca WhatsApp'
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>

            <div className="p-4 rounded-lg border bg-purple-500/10 border border-purple-500/20">
              <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">🎯 Case da Região</h4>
              <p className="text-sm mb-3">"Tenho um case de uma [pizzaria] aqui da região que economizou R$ 28k no ano. Quer que eu te mande os detalhes?"</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => copyToClipboard(
                  `"Tenho um case de uma [pizzaria] aqui da região que economizou R$ 28.800 no primeiro ano saindo do iFood.\n\nQuer que eu te mande os detalhes de como eles fizeram?\n\nSem compromisso - é só pra você ver que é possível!"`,
                  'Isca Case'
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>

            <div className="p-4 rounded-lg border bg-orange-500/10 border border-orange-500/20">
              <h4 className="font-semibold text-orange-600 dark:text-orange-400 mb-2">⏰ 7 Dias Grátis</h4>
              <p className="text-sm mb-3">"Quer testar o sistema por 7 dias sem pagar nada? Sem cartão, sem compromisso. Se não gostar, cancela."</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => copyToClipboard(
                  `"Quer testar o sistema por 7 dias sem pagar nada?\n\n✅ Sem cartão de crédito\n✅ Sem compromisso\n✅ Se não gostar, cancela\n\nEm 30 minutos seu cardápio está no ar.\nO que você tem a perder?"`,
                  'Isca Trial'
                )}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
