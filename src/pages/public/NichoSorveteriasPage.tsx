import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { IceCreamBowl, Snowflake, Cherry, Zap, Timer, Tablet, Smartphone, DollarSign, BarChart3, Sun, Check, X, Star, MessageSquare, Truck, Users, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/useSEO";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";

const NichoSorveteriasPage = () => {
  usePageSEO({
    title: "Mostralo para Sorveterias | Sistema Completo para Gelatarias e Lojas de Gelados",
    description: "Sistema All-in-One para sorveterias: Totem de autoatendimento, montador de taças, WhatsApp Marketing e delivery próprio. Elimine filas e lucre 100% sobre cada sorvete vendido.",
    keywords: "sistema sorveteria, pdv sorvete, totem autoatendimento gelato, cardápio digital sorvete, delivery sorveteria, gestão gelataria"
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-orange-500/10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-pink-500/20 border border-pink-500/30 rounded-full px-4 py-2 mb-8">
              <IceCreamBowl className="w-5 h-5 text-pink-400" />
              <span className="text-pink-300 text-sm font-medium">Para Sorveterias, Gelatarias e Lojas de Gelados</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Não deixe o seu lucro{" "}
              <span className="bg-gradient-to-r from-orange-500 to-pink-400 bg-clip-text text-transparent">
                derreter
              </span>{" "}
              com taxas abusivas e filas no balcão.
            </h1>

            {/* Sub-headline */}
            <p className="text-xl md:text-2xl text-zinc-300 mb-10 max-w-3xl mx-auto">
              O Mostralo é o ecossistema All-in-One que organiza a sua sorveteria: do autoatendimento inteligente 
              à gestão de entregas ultra-rápidas. Lucre 100% sobre cada bola de gelado e fidelize os seus 
              clientes no piloto automático.
            </p>

            {/* CTA */}
            <Button 
              asChild
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300 hover:scale-105"
            >
              <Link to="/signup">
                QUERO MODERNIZAR MINHA SORVETERIA
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-4 mt-12">
              {[
                { icon: DollarSign, text: "Taxa 0%" },
                { icon: Cherry, text: "Montador de Taças" },
                { icon: Tablet, text: "Totem Autoatendimento" },
                { icon: MessageSquare, text: "WhatsApp Marketing" }
              ].map((badge, index) => (
                <div key={index} className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-full px-4 py-2">
                  <badge.icon className="w-4 h-4 text-pink-400" />
                  <span className="text-sm text-zinc-300">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problema/Interesse Section */}
      <section className="py-20 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Filas intermináveis e pedidos errados?{" "}
              <span className="text-pink-400">Temos a solução.</span>
            </h2>
            <p className="text-xl text-zinc-400">
              No calor, a sua loja enche e o atendimento precisa ser imediato. Se o cliente espera muito 
              ou o pedido vem sem a cobertura desejada, a experiência estraga-se. O Mostralo elimina o 
              caos operacional e as taxas de 25% dos aplicativos de entrega.
            </p>
          </div>

          {/* Grid de soluções */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Cherry,
                title: "Montador de Taças e Copos",
                description: "O cliente escolhe o tamanho, os sabores e os toppings (frutas, chocolates, caldas) de forma visual. O pedido chega detalhado à produção, com 0% de erro humano.",
                color: "pink"
              },
              {
                icon: Tablet,
                title: "Totem de Autoatendimento",
                subtitle: "O fim das filas",
                description: "Deixe que o cliente peça e pague via PIX ou Cartão sozinho. Ideal para dias de calor intenso, libertando a sua equipa para focar apenas na montagem dos pedidos.",
                color: "orange"
              },
              {
                icon: Zap,
                title: "PDV Touch Rápido",
                description: "Vendas presenciais processadas em segundos. Integração direta com a impressora para que a equipa de produção saiba exatamente o que preparar.",
                color: "amber"
              }
            ].map((solution, index) => (
              <Card key={index} className="bg-zinc-900 border-zinc-800 hover:border-pink-500/50 transition-all duration-300 group">
                <CardContent className="p-8">
                  <div className={`w-16 h-16 rounded-2xl bg-${solution.color}-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <solution.icon className={`w-8 h-8 ${solution.color === 'pink' ? 'text-pink-400' : solution.color === 'orange' ? 'text-orange-400' : 'text-amber-400'}`} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{solution.title}</h3>
                  {solution.subtitle && (
                    <p className="text-pink-400 text-sm mb-3">{solution.subtitle}</p>
                  )}
                  <p className="text-zinc-400">{solution.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios/Desejo Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Tecnologia que cria{" "}
              <span className="bg-gradient-to-r from-orange-500 to-pink-400 bg-clip-text text-transparent">
                "Fãs"
              </span>{" "}
              da sua Marca
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: Sun,
                title: "WhatsApp Marketing",
                subtitle: "O Gatilho do Calor",
                description: "'Fim de semana de Sol!' O Mostralo identifica os seus clientes e envia promoções automáticas via WhatsApp nos dias mais quentes, garantindo loja cheia e delivery a todo o vapor.",
                stat: "+60%",
                statLabel: "vendas no calor"
              },
              {
                icon: DollarSign,
                title: "Independência Total",
                description: "Pare de pagar comissões por cada sorvete vendido no delivery. Com o Mostralo, o link é seu, os dados são seus e o lucro é 100% da sua sorveteria.",
                stat: "R$ 2.500+",
                statLabel: "economia/mês"
              },
              {
                icon: BarChart3,
                title: "Financeiro e Gestão de Sabores",
                description: "Saiba quais são os sabores campeões de venda e quais estão parados no estoque. Dashboard completo com fluxo de caixa e ticket médio por cliente.",
                stat: "100%",
                statLabel: "visibilidade"
              }
            ].map((benefit, index) => (
              <Card key={index} className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 overflow-hidden group">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <benefit.icon className="w-7 h-7 text-orange-400" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-pink-400">{benefit.stat}</div>
                      <div className="text-xs text-zinc-500">{benefit.statLabel}</div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{benefit.title}</h3>
                  {benefit.subtitle && (
                    <p className="text-orange-400 text-sm mb-3">{benefit.subtitle}</p>
                  )}
                  <p className="text-zinc-400">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Seção Phygital */}
      <section className="py-20 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-orange-300 text-sm font-medium">Experiência Phygital</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Do balcão físico ao mundo digital:{" "}
              <span className="text-pink-400">tudo integrado.</span>
            </h2>
            <p className="text-xl text-zinc-400">
              Com o Mostralo, sua sorveteria opera no físico e no digital de forma unificada. 
              O cliente pode pedir no Totem da loja, no balcão ou pelo delivery - tudo vai 
              para o mesmo sistema, com o mesmo controle.
            </p>
          </div>

          {/* Fluxo visual */}
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[
                { icon: Tablet, title: "TOTEM", subtitle: "Autoatendimento sem filas" },
                { icon: IceCreamBowl, title: "BALCÃO", subtitle: "PDV Touch ultra-rápido" },
                { icon: Truck, title: "DELIVERY", subtitle: "Link próprio taxa zero" }
              ].map((channel, index) => (
                <div key={index} className="relative">
                  <Card className="bg-zinc-900 border-zinc-800 hover:border-pink-500/50 transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                        <channel.icon className="w-8 h-8 text-pink-400" />
                      </div>
                      <h3 className="font-bold text-lg mb-1">{channel.title}</h3>
                      <p className="text-sm text-zinc-400">{channel.subtitle}</p>
                    </CardContent>
                  </Card>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <ArrowRight className="w-6 h-6 text-pink-500/50" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Seta central para baixo */}
            <div className="flex justify-center my-6">
              <div className="w-0.5 h-12 bg-gradient-to-b from-pink-500/50 to-orange-500/50" />
            </div>

            {/* Dashboard único */}
            <Card className="bg-zinc-900 border-orange-500/30 max-w-md mx-auto">
              <CardContent className="p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/30 to-pink-500/30 flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-10 h-10 text-orange-400" />
                </div>
                <h3 className="font-bold text-xl mb-2">DASHBOARD ÚNICO</h3>
                <p className="text-zinc-400">Controle total da sua operação</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Transforme taxas perdidas em{" "}
              <span className="text-orange-500">lucro líquido.</span>
            </h2>
          </div>

          <Card className="max-w-3xl mx-auto bg-zinc-900 border-pink-500/30 overflow-hidden">
            <CardContent className="p-8">
              {/* Via App Terceiro */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <IceCreamBowl className="w-5 h-5 text-red-400" />
                  <span className="font-semibold text-lg">Faturamento via App Terceiro (R$ 10.000/mês)</span>
                </div>
                <div className="space-y-2 pl-7">
                  <div className="flex justify-between text-zinc-300">
                    <span>Faturamento mensal:</span>
                    <span>R$ 10.000,00</span>
                  </div>
                  <div className="flex justify-between text-red-400">
                    <span className="flex items-center gap-2">
                      <X className="w-4 h-4" /> Taxa App (25%):
                    </span>
                    <span>- R$ 2.500,00</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-zinc-800">
                    <span>Lucro líquido:</span>
                    <span className="text-zinc-300">R$ 7.500,00</span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent my-8" />

              {/* Via Mostralo */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <IceCreamBowl className="w-5 h-5 text-pink-400" />
                  <span className="font-semibold text-lg">Faturamento via Mostralo (R$ 10.000/mês)</span>
                </div>
                <div className="space-y-2 pl-7">
                  <div className="flex justify-between text-zinc-300">
                    <span>Faturamento mensal:</span>
                    <span>R$ 10.000,00</span>
                  </div>
                  <div className="flex justify-between text-green-400">
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4" /> Taxa Mostralo:
                    </span>
                    <span>R$ 0,00</span>
                  </div>
                  <div className="flex justify-between text-green-400">
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4" /> Mensalidade Profissional:
                    </span>
                    <span>- R$ 397,00</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-zinc-800">
                    <span>Lucro líquido:</span>
                    <span className="text-pink-400">R$ 9.603,00</span>
                  </div>
                </div>
              </div>

              {/* Resultado */}
              <div className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 rounded-xl p-6 border border-pink-500/30">
                <div className="grid md:grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-sm text-zinc-400 mb-1">🎯 LUCRO EXTRA MENSAL</div>
                    <div className="text-3xl font-bold text-orange-400">R$ 2.103,00</div>
                  </div>
                  <div>
                    <div className="text-sm text-zinc-400 mb-1">📅 ECONOMIA ANUAL</div>
                    <div className="text-3xl font-bold text-pink-400">R$ 25.236,00</div>
                  </div>
                </div>
                <p className="text-center text-zinc-400 mt-4">
                  💡 Invista em novas máquinas ou expansão da loja!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Depoimentos Section */}
      <section className="py-20 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Sorveterias que já{" "}
              <span className="text-pink-400">derretem a concorrência</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                quote: "O Totem foi a melhor decisão. No dia mais quente do ano, a fila simplesmente não existia mais.",
                author: "Rafael",
                business: "Gelato Artesanal - SP"
              },
              {
                quote: "O montador de taças zerou os erros. Chocolate com morango? O cliente escolhe e vem certinho.",
                author: "Carla",
                business: "Sorveteria Tropical - MG"
              },
              {
                quote: "O WhatsApp automático no calor é genial. Mandou promoção no domingo de sol e a loja lotou.",
                author: "Bruno",
                business: "Ice Cream Paradise - RJ"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="bg-zinc-900 border-zinc-800 hover:border-pink-500/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-orange-400 fill-orange-400" />
                    ))}
                  </div>
                  <p className="text-zinc-300 mb-6 italic">"{testimonial.quote}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.author}</div>
                    <div className="text-sm text-pink-400">{testimonial.business}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Planos Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Pronto para ser a sorveteria{" "}
              <span className="bg-gradient-to-r from-orange-500 to-pink-400 bg-clip-text text-transparent">
                mais tecnológica da cidade?
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Essencial",
                price: "249,90",
                subtitle: "Cardápio Digital + PDV + Central de Pedidos",
                features: [
                  "Cardápio com Montador de Taças",
                  "PDV touch ultra-rápido",
                  "Impressão automática",
                  "Suporte 7 dias"
                ],
                highlighted: false
              },
              {
                name: "Profissional",
                price: "397,00",
                subtitle: "Totem de Autoatendimento + WhatsApp Marketing + Gestão de Entregas",
                badge: "O MAIS VENDIDO",
                features: [
                  "Tudo do Essencial",
                  "Totem de Autoatendimento",
                  "WhatsApp Marketing 'Gatilho do Calor'",
                  "Gestão de entregadores",
                  "Relatórios de sabores"
                ],
                highlighted: true
              },
              {
                name: "Empresarial",
                price: "597,00",
                subtitle: "Para redes de sorveterias e franquias",
                features: [
                  "Tudo do Profissional",
                  "Multi-lojas",
                  "API completa",
                  "Gestão de estoque por sabor",
                  "Suporte Prioritário 24h"
                ],
                highlighted: false
              }
            ].map((plan, index) => (
              <Card 
                key={index} 
                className={`relative overflow-hidden transition-all duration-300 ${
                  plan.highlighted 
                    ? 'bg-zinc-900 border-2 border-pink-500 shadow-[0_0_30px_rgba(244,114,182,0.3)]' 
                    : 'bg-zinc-900 border-zinc-800 hover:border-pink-500/50'
                }`}
              >
                {plan.badge && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                    {plan.badge}
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-sm text-zinc-400 mb-4">{plan.subtitle}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-pink-400">R$ {plan.price}</span>
                    <span className="text-zinc-400">/mês</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                        <span className="text-zinc-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    asChild
                    className={`w-full ${
                      plan.highlighted 
                        ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600' 
                        : 'bg-zinc-800 hover:bg-zinc-700'
                    }`}
                  >
                    <Link to="/signup">Começar Agora</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Final */}
          <div className="text-center mt-12">
            <Button 
              asChild
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300 hover:scale-105"
            >
              <Link to="/signup">
                QUERO COMEÇAR AGORA
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Perguntas <span className="text-pink-400">Frequentes</span>
            </h2>

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-zinc-900 border border-zinc-800 rounded-xl px-6">
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="font-semibold">Como funciona o montador de taças?</span>
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 pb-6">
                  O cliente entra no seu cardápio digital ou totem, escolhe o tamanho da taça 
                  (pequena, média, grande), seleciona até X sabores de sorvete, escolhe caldas 
                  (chocolate, morango, caramelo) e toppings (granulado, frutas, chantilly). 
                  O pedido chega completo e visual na produção, sem risco de erro.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-zinc-900 border border-zinc-800 rounded-xl px-6">
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="font-semibold">O Totem aguenta o movimento do dia de calor?</span>
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 pb-6">
                  Sim! O Totem foi projetado para dias de pico. Enquanto seus atendentes focam 
                  na montagem, o cliente pede e paga sozinho. É como ter um funcionário extra 
                  que nunca cansa, nunca erra e trabalha 24 horas.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-zinc-900 border border-zinc-800 rounded-xl px-6">
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="font-semibold">Como funciona o WhatsApp 'Gatilho do Calor'?</span>
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 pb-6">
                  O Mostralo identifica clientes que compraram recentemente e, quando você programar 
                  ou em dias de previsão de calor, dispara promoções automáticas via WhatsApp. 
                  "Sol chegando! 🍦 Que tal um gelado?" - e sua loja enche.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-800">
        <div className="container mx-auto px-4 text-center">
          <p className="text-zinc-400 mb-4">
            <span className="font-semibold text-white">Mostralo.com.br</span> | Sua marca. Seu lucro. Sua sorveteria no próximo nível.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
            <Link to="/" className="hover:text-pink-400 transition-colors">Início</Link>
            <Link to="/funcionalidades" className="hover:text-pink-400 transition-colors">Funcionalidades</Link>
            <Link to="/suporte" className="hover:text-pink-400 transition-colors">Suporte</Link>
            <Link to="/termos" className="hover:text-pink-400 transition-colors">Termos</Link>
            <Link to="/privacidade" className="hover:text-pink-400 transition-colors">Privacidade</Link>
          </div>
        </div>
      </footer>

      {/* WhatsApp Lead Button */}
      <WhatsAppLeadButton />
    </div>
  );
};

export default NichoSorveteriasPage;
