import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Flame, 
  Timer, 
  Utensils, 
  Printer, 
  MessageSquare, 
  Monitor, 
  Tablet,
  TrendingUp,
  DollarSign,
  BarChart3,
  Check,
  Star,
  ArrowRight,
  Zap,
  Users,
  ShieldCheck
} from "lucide-react";
import { Link } from "react-router-dom";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { usePageSEO } from "@/hooks/useSEO";

const NichoPastelariasPage = () => {
  usePageSEO({
    title: "Sistema para Pastelarias | Mostralo - Cardápio Digital e Gestão",
    description: "Sistema completo para pastelarias: montador de pastel inteligente, KDS, totem de autoatendimento e WhatsApp Marketing. Taxa zero e lucro 100%.",
    keywords: "sistema pastelaria, cardápio digital pastelaria, montador de pastel, totem autoatendimento, kds pastelaria, delivery pastelaria"
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-yellow-400/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-zinc-900/80 border border-orange-500/30 rounded-full px-4 py-2 mb-6">
              <span className="text-2xl">🥟</span>
              <span className="text-orange-400 font-medium">Para Pastelarias (Delivery e Balcão)</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Pare de fritar o seu lucro{" "}
              <span className="bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent">
                com as taxas dos apps de entrega.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-lg md:text-xl text-zinc-400 mb-8 max-w-3xl mx-auto">
              O Mostralo é o ecossistema All-in-One que organiza a sua pastelaria: 
              do montador de recheios à gestão de entregas em tempo real. Lucre 100% sobre cada 
              venda e tenha uma operação profissional com taxa zero.
            </p>

            {/* CTA */}
            <Button 
              asChild
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-orange-600 hover:to-yellow-500 text-zinc-900 font-bold text-lg px-8 py-6 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300 animate-pulse"
            >
              <Link to="/signup">
                QUERO MINHA PASTELARIA LUCRATIVA
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-4 mt-10">
              {[
                { icon: ShieldCheck, text: "Taxa 0%" },
                { icon: Utensils, text: "Montador Inteligente" },
                { icon: Monitor, text: "KDS Integrado" },
                { icon: MessageSquare, text: "WhatsApp Automático" }
              ].map((badge, index) => (
                <div key={index} className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-full px-4 py-2">
                  <badge.icon className="h-4 w-4 text-orange-400" />
                  <span className="text-sm text-zinc-300">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problema Section */}
      <section className="py-16 md:py-20 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Muitos pedidos, muitos sabores e{" "}
              <span className="text-orange-400">pouco tempo?</span>{" "}
              O Mostralo resolve.
            </h2>
            <p className="text-zinc-400 text-lg">
              No horário de pico, um erro no recheio ou um pedido esquecido no WhatsApp 
              é prejuízo na certa. Se você ainda depende de anotações manuais ou paga 25% de 
              taxa para o iFood, sua pastelaria está a perder fôlego.
            </p>
          </div>

          {/* Solutions Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Utensils,
                title: "Montador de Pastel Inteligente",
                description: "Meia-meia, adicionais (ovo, queijo extra, bacon) e combos com caldo de cana. O cliente escolhe tudo de forma visual e o pedido chega pronto para a fritura, sem erros.",
                color: "orange"
              },
              {
                icon: Monitor,
                title: "KDS (Monitor de Cozinha)",
                description: "Organize sua linha de produção. Saiba exatamente qual pastel deve ser montado e frito primeiro, com alertas visuais de tempo para garantir que chegue crocante.",
                color: "yellow"
              },
              {
                icon: Printer,
                title: "Impressão Automática",
                description: "Assim que o cliente confirma o pedido, ele sai impresso na cozinha com todos os detalhes e observações. Agilidade máxima do balcão à entrega.",
                color: "orange"
              }
            ].map((solution, index) => (
              <Card key={index} className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${solution.color === 'orange' ? 'from-orange-500/20 to-orange-600/10' : 'from-yellow-400/20 to-yellow-500/10'} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <solution.icon className={`h-7 w-7 ${solution.color === 'orange' ? 'text-orange-400' : 'text-yellow-400'}`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{solution.title}</h3>
                  <p className="text-zinc-400">{solution.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tecnologia que gera{" "}
              <span className="bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent">
                Recorrência e Lucro
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: MessageSquare,
                title: "O Vendedor que Não Dorme",
                description: "'Dia de Pastel!' O Mostralo identifica seus clientes fiéis e envia promoções automáticas via WhatsApp nos dias de menor movimento, garantindo fritadeira quente a semana toda.",
                stat: "+45%",
                statLabel: "vendas"
              },
              {
                icon: DollarSign,
                title: "Taxa Zero = Dinheiro no Bolso",
                description: "Economize milhares de reais todos os meses ao direcionar seus clientes para seu link próprio. O lucro de cada pastel vendido é inteiramente seu.",
                stat: "R$ 4.500+",
                statLabel: "/mês"
              },
              {
                icon: BarChart3,
                title: "Financeiro Integrado",
                description: "Controle seu fluxo de caixa, saiba quais sabores são os campeões de venda e tenha relatórios detalhados para tomar decisões inteligentes.",
                stat: "100%",
                statLabel: "controle"
              }
            ].map((feature, index) => (
              <Card key={index} className="bg-zinc-900 border-zinc-800 hover:border-yellow-400/50 transition-all duration-300 overflow-hidden group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-400/10 flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-orange-400" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent">
                        {feature.stat}
                      </div>
                      <div className="text-xs text-zinc-500">{feature.statLabel}</div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-zinc-400 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Phygital Section */}
      <section className="py-16 md:py-20 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-2 mb-6">
              <Tablet className="h-4 w-4 text-yellow-400" />
              <span className="text-yellow-400 font-medium">Experiência Phygital</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Balcão lotado?{" "}
              <span className="text-yellow-400">Totem acaba com as filas.</span>
            </h2>
            <p className="text-zinc-400 text-lg">
              O cliente chega no balcão, escolhe seu pastel no Totem de Autoatendimento, 
              paga na hora e aguarda ser chamado. Zero fila, zero erro de recheio, máxima agilidade.
            </p>
          </div>

          {/* Flow Visual */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: Tablet,
                step: "1",
                title: "TOTEM",
                description: "Cliente monta seu pastel"
              },
              {
                icon: Flame,
                step: "2",
                title: "FRITURA",
                description: "KDS organiza a produção"
              },
              {
                icon: Check,
                step: "3",
                title: "RETIRADA",
                description: "Nome chamado no painel"
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <Card className="bg-zinc-800/50 border-zinc-700 text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-8 w-8 text-zinc-900" />
                  </div>
                  <div className="text-sm text-orange-400 font-medium mb-1">Passo {item.step}</div>
                  <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-zinc-400 text-sm">{item.description}</p>
                </Card>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ArrowRight className="h-6 w-6 text-orange-400" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-zinc-500 mt-8">
            Autoatendimento que elimina filas e erros de pedido
          </p>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Quanto vale a sua{" "}
                <span className="bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent">
                  independência?
                </span>
              </h2>
            </div>

            <Card className="bg-zinc-900 border-2 border-orange-500/30 overflow-hidden">
              <CardContent className="p-6 md:p-8">
                {/* iFood */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🥟</span>
                    <span className="text-lg font-semibold text-white">500 Pastéis/mês no iFood (ticket médio R$ 36)</span>
                  </div>
                  <div className="space-y-2 pl-10">
                    <div className="flex justify-between text-zinc-400">
                      <span>Faturamento:</span>
                      <span className="text-white font-medium">R$ 18.000,00</span>
                    </div>
                    <div className="flex justify-between text-red-400">
                      <span>❌ Taxa iFood (25%):</span>
                      <span className="font-medium">- R$ 4.500,00</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-800 my-6" />

                {/* Mostralo */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🥟</span>
                    <span className="text-lg font-semibold text-white">500 Pastéis/mês no Mostralo</span>
                  </div>
                  <div className="space-y-2 pl-10">
                    <div className="flex justify-between text-zinc-400">
                      <span>Faturamento:</span>
                      <span className="text-white font-medium">R$ 18.000,00</span>
                    </div>
                    <div className="flex justify-between text-green-400">
                      <span>✅ Taxa Mostralo:</span>
                      <span className="font-medium">R$ 0,00</span>
                    </div>
                    <div className="flex justify-between text-green-400">
                      <span>✅ Mensalidade Profissional:</span>
                      <span className="font-medium">- R$ 397,00</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-800 my-6" />

                {/* Results */}
                <div className="bg-gradient-to-r from-orange-500/10 to-yellow-400/10 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-white">🎯 LUCRO EXTRA MENSAL:</span>
                    <span className="text-2xl font-bold text-orange-400">R$ 4.103,00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-white">📅 ECONOMIA ANUAL:</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent">R$ 49.236,00</span>
                  </div>
                  <p className="text-center text-yellow-400 text-sm pt-2">
                    💡 Valor de uma nova unidade ou reforma completa!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-20 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pastelarias que já{" "}
              <span className="text-orange-400">faturam mais</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                quote: "O montador de pastel zerou os erros de recheio. Meia-meia nunca mais sai errado.",
                author: "Ricardo",
                business: "Pastelaria do Riquinho - SP"
              },
              {
                quote: "O Totem no balcão foi sensacional. Reduzi 2 funcionários no caixa e a fila sumiu.",
                author: "Ana",
                business: "Pastelaria Crocante - MG"
              },
              {
                quote: "Saí do iFood e economizo R$ 5.000/mês. Já penso em abrir a segunda unidade.",
                author: "Marcos",
                business: "Pastel & Caldo - RJ"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="bg-zinc-800/50 border-zinc-700">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-zinc-300 mb-4 italic">"{testimonial.quote}"</p>
                  <div>
                    <div className="font-semibold text-white">{testimonial.author}</div>
                    <div className="text-sm text-zinc-500">{testimonial.business}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para ser a pastelaria{" "}
              <span className="bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent">
                número #1 da região?
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "Essencial",
                price: "249,90",
                description: "Cardápio Digital + PDV + Central de Pedidos",
                features: [
                  "Cardápio com Montador de Pastel",
                  "PDV de balcão integrado",
                  "Impressão térmica automática",
                  "Suporte 7 dias"
                ],
                highlighted: false
              },
              {
                name: "Profissional",
                price: "397,00",
                description: "KDS + WhatsApp Marketing + Gestão de Entregadores",
                features: [
                  "Tudo do Essencial",
                  "KDS (Monitor de Cozinha)",
                  "Gestão de entregadores",
                  "WhatsApp Marketing Automático"
                ],
                highlighted: true,
                badge: "O MAIS VENDIDO"
              },
              {
                name: "Empresarial",
                price: "597,00",
                description: "Para redes de pastelarias e franquias",
                features: [
                  "Tudo do Profissional",
                  "Multi-lojas",
                  "Totem de Autoatendimento",
                  "API completa",
                  "Suporte Prioritário 24h"
                ],
                highlighted: false
              }
            ].map((plan, index) => (
              <Card 
                key={index} 
                className={`relative overflow-hidden ${
                  plan.highlighted 
                    ? 'bg-gradient-to-b from-zinc-900 to-zinc-800 border-2 border-orange-500 scale-105' 
                    : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                {plan.badge && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-yellow-400 text-zinc-900 text-center text-sm font-bold py-1">
                    {plan.badge}
                  </div>
                )}
                <CardContent className={`p-6 ${plan.badge ? 'pt-10' : ''}`}>
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-white">R$ {plan.price}</span>
                    <span className="text-zinc-500">/mês</span>
                  </div>
                  <p className="text-sm text-zinc-400 mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                        <Check className="h-4 w-4 text-orange-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    asChild
                    className={`w-full ${
                      plan.highlighted 
                        ? 'bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-orange-600 hover:to-yellow-500 text-zinc-900' 
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    }`}
                  >
                    <Link to="/signup">Começar agora</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Final CTA */}
          <div className="text-center mt-12">
            <Button 
              asChild
              size="lg"
              className="bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-orange-600 hover:to-yellow-500 text-zinc-900 font-bold text-lg px-8 py-6 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300 animate-pulse"
            >
              <Link to="/signup">
                TESTAR GRÁTIS AGORA
                <Zap className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Perguntas <span className="text-orange-400">Frequentes</span>
              </h2>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-6">
                <AccordionTrigger className="text-white hover:text-orange-400">
                  Como funciona o montador de pastel?
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400">
                  O cliente entra no seu cardápio digital, escolhe o recheio principal 
                  (carne, frango, queijo, pizza), pode fazer meia-meia com outro sabor, 
                  adicionar extras (ovo, bacon, queijo extra) e montar combos com caldo 
                  de cana ou refrigerante. O pedido chega completo e detalhado na cozinha, 
                  sem risco de erro de recheio.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-6">
                <AccordionTrigger className="text-white hover:text-orange-400">
                  O Totem de Autoatendimento funciona bem em pastelaria?
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400">
                  Funciona perfeitamente! O Totem é ideal para pastelarias de balcão com 
                  fluxo intenso. O cliente monta o pedido sozinho, paga na hora e aguarda 
                  ser chamado. Você reduz filas, elimina erros e pode realocar funcionários 
                  para a produção.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-6">
                <AccordionTrigger className="text-white hover:text-orange-400">
                  Como o sistema garante que o pastel chegue crocante?
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400">
                  O KDS organiza a produção por tempo de preparo. Quando o entregador 
                  está próximo de sair, o sistema avisa para fritar o pastel. Assim, o 
                  produto sai quentinho e crocante, sem ficar esperando na embalagem.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-zinc-500 mb-4">
              <span className="font-semibold text-white">Mostralo.com.br</span> | Sua marca. Seu lucro. Sua pastelaria no próximo nível.
            </p>
            <div className="flex justify-center gap-6 text-sm text-zinc-600">
              <Link to="/" className="hover:text-orange-400 transition-colors">Início</Link>
              <Link to="/funcionalidades" className="hover:text-orange-400 transition-colors">Funcionalidades</Link>
              <Link to="/suporte" className="hover:text-orange-400 transition-colors">Suporte</Link>
              <Link to="/termos" className="hover:text-orange-400 transition-colors">Termos</Link>
              <Link to="/privacidade" className="hover:text-orange-400 transition-colors">Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Lead Button */}
      <WhatsAppLeadButton />
    </div>
  );
};

export default NichoPastelariasPage;
