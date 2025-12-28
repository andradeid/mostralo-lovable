import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { usePageSEO } from "@/hooks/useSEO";
import { Link } from "react-router-dom";
import { 
  Flame, 
  Beef, 
  Utensils, 
  Timer, 
  Printer, 
  MessageSquare, 
  Truck, 
  BarChart3,
  Check,
  Star,
  Smartphone,
  Monitor,
  QrCode,
  Zap,
  DollarSign,
  TrendingUp,
  BadgeCheck
} from "lucide-react";

const NichoChurrasquinhosPage = () => {
  usePageSEO({
    title: "Sistema para Churrasquinhos e Jantinhas | Mostralo",
    description: "Sistema completo para churrasquinhos, jantinhas e espetinhos. Montador de pedidos inteligente, KDS para cozinha, WhatsApp Marketing e taxa zero. Teste grátis!",
    keywords: "sistema churrasquinho, cardápio digital espetinho, jantinha delivery, sistema para espetaria, montador de jantinha, KDS churrasqueira"
  });

  const solutions = [
    {
      icon: Beef,
      title: "Montador de Jantinha Inteligente",
      description: "O cliente escolhe o espetinho, o ponto da carne e os acompanhamentos (arroz, tropeiro, mandioca, vinagrete) de forma visual e sem erros."
    },
    {
      icon: Monitor,
      title: "KDS (Monitor de Cozinha/Chapa)",
      description: "Organize a sequência dos espetos por tempo de preparo. Sua equipe foca na brasa e o sistema avisa quando o pedido está pronto para sair."
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Marketing Automático",
      description: "'Sextou com Jantinha!' O Mostralo envia o cardápio automaticamente para quem já comprou com você, garantindo que sua churrasqueira não pare de trabalhar."
    }
  ];

  const features = [
    {
      icon: DollarSign,
      title: "O Fim das Taxas",
      description: "Economize mais de R$ 2.500,00 por mês em comissões. Esse dinheiro paga seu carvão, sua carne e ainda sobra para investir no negócio.",
      stat: "R$ 2.500+",
      statLabel: "economia/mês"
    },
    {
      icon: Printer,
      title: "Impressão Automática",
      description: "O pedido cai no sistema e já sai impresso na cozinha com todos os detalhes (ex: 'Sem vinagrete'). Menos desperdício e mais agilidade.",
      stat: "0",
      statLabel: "erros"
    },
    {
      icon: BarChart3,
      title: "Financeiro Integrado",
      description: "Saiba exatamente quantos espetinhos vendeu na noite e qual o seu lucro real, sem precisar de planilhas complexas.",
      stat: "100%",
      statLabel: "controle"
    }
  ];

  const testimonials = [
    {
      text: "O montador de jantinha zerou os erros de acompanhamentos. O cliente escolhe tudo sozinho.",
      author: "João",
      business: "Churrasquinho do João - SP",
      rating: 5
    },
    {
      text: "Sexta-feira o WhatsApp automático lota minha churrasqueira. Melhor investimento que fiz.",
      author: "Dona Maria",
      business: "Jantinha da Maria - MG",
      rating: 5
    },
    {
      text: "Saí do iFood e economizo R$ 3.500/mês. Minha margem voltou a fazer sentido.",
      author: "Carlos",
      business: "Espetinhos Premium - RJ",
      rating: 5
    }
  ];

  const plans = [
    {
      name: "Essencial",
      price: "249,90",
      description: "Cardápio Digital + PDV + Impressão Térmica",
      features: [
        "Cardápio com Montador de Jantinha",
        "PDV de balcão integrado",
        "Impressão térmica automática",
        "Suporte 7 dias"
      ],
      highlighted: false
    },
    {
      name: "Profissional",
      price: "397,00",
      description: "KDS + Gestão de Entregadores + WhatsApp Marketing",
      features: [
        "Tudo do Essencial",
        "KDS (Monitor de Cozinha)",
        "Gestão de entregadores",
        "WhatsApp Marketing Automático"
      ],
      highlighted: true,
      badge: "IDEAL PARA JANTINHAS"
    },
    {
      name: "Empresarial",
      price: "597,00",
      description: "Para redes de espetinhos e franquias",
      features: [
        "Tudo do Profissional",
        "Multi-lojas",
        "API completa",
        "Suporte Prioritário 24h"
      ],
      highlighted: false
    }
  ];

  const faqs = [
    {
      question: "Como funciona o montador de jantinha?",
      answer: "O cliente entra no seu cardápio digital, escolhe o tipo de espetinho (bovino, suíno, frango, coração), seleciona o ponto da carne (mal passado, ao ponto, bem passado) e adiciona os acompanhamentos (arroz, feijão tropeiro, mandioca, vinagrete). O pedido chega completo e detalhado na cozinha, sem erros de anotação."
    },
    {
      question: "O WhatsApp Marketing funciona mesmo no horário de pico?",
      answer: "Sim! As campanhas são programadas com antecedência. Por exemplo: toda sexta-feira às 16h, o sistema dispara automaticamente 'Sextou com Jantinha! 🔥 Confira nosso cardápio e peça agora.' para todos os clientes que já compraram com você. Quando o pico chegar, os pedidos já estão entrando."
    },
    {
      question: "E se o cliente quiser mudar algo no pedido?",
      answer: "Todas as observações são aceitas no sistema. O cliente pode escrever 'sem cebola', 'molho à parte', 'espeto ao ponto mas não muito'. Tudo isso aparece impresso na comanda da cozinha, eliminando erros humanos."
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/30 via-zinc-950 to-yellow-950/20" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm font-medium mb-6">
              <Flame className="w-4 h-4 animate-pulse" />
              Para Churrasquinhos, Jantinhas e Espetinhos
            </div>

            {/* Headline */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Chega de perder pedidos no WhatsApp{" "}
              <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                enquanto a brasa queima.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-lg md:text-xl text-zinc-400 mb-8 max-w-3xl mx-auto">
              O Mostralo é o ecossistema All-in-One que organiza sua jantinha: do montador 
              de espetinhos à gestão de entregas. Saia do caos, elimine as taxas do iFood 
              e lucre 100% sobre cada venda.
            </p>

            {/* CTA */}
            <Link to="/signup">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300"
              >
                <Flame className="w-5 h-5 mr-2" />
                QUERO PROFISSIONALIZAR MEU CHURRASQUINHO
              </Button>
            </Link>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 mt-10">
              {[
                { icon: BadgeCheck, text: "Taxa 0%" },
                { icon: Beef, text: "Montador de Jantinha" },
                { icon: Monitor, text: "KDS Integrado" },
                { icon: Zap, text: "WhatsApp Automático" }
              ].map((badge, index) => (
                <div key={index} className="flex items-center gap-2 text-zinc-400 text-sm">
                  <badge.icon className="w-4 h-4 text-orange-400" />
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 md:py-20 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Atender telefone, anotar pedido e cuidar da churrasqueira{" "}
              <span className="text-orange-400">ao mesmo tempo?</span>
            </h2>
            <p className="text-zinc-400 text-lg">
              Se você ainda anota pedidos em papel ou se perde nos áudios do WhatsApp, 
              sua operação está lenta e seus clientes estão esperando demais. Além disso, 
              pagar 25% de taxa para o iFood em uma jantinha é entregar o seu lucro de bandeja.
            </p>
          </div>

          {/* Solutions Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {solutions.map((solution, index) => (
              <Card 
                key={index} 
                className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 group"
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center mb-4 group-hover:from-orange-500/30 group-hover:to-yellow-500/30 transition-all">
                    <solution.icon className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{solution.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{solution.description}</p>
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
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Tecnologia de Grande,{" "}
              <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Preço de Pequeno
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="bg-zinc-900/50 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 group overflow-hidden"
              >
                <CardContent className="p-6 relative">
                  {/* Stat Badge */}
                  <div className="absolute top-4 right-4 text-right">
                    <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                      {feature.stat}
                    </span>
                    <p className="text-xs text-zinc-500">{feature.statLabel}</p>
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{feature.description}</p>
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
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Balcão lotado?{" "}
              <span className="text-orange-400">QR Code resolve.</span>
            </h2>
            <p className="text-zinc-400 text-lg">
              O cliente no balcão pode escanear o QR Code da mesa ou do cardápio e fazer 
              o pedido sozinho, sem precisar esperar na fila. O pedido cai direto no KDS da cozinha.
            </p>
          </div>

          {/* Flow Visual */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 max-w-4xl mx-auto">
            {[
              { icon: QrCode, title: "QR CODE", subtitle: "Cliente faz o pedido", color: "from-orange-500 to-orange-600" },
              { icon: Flame, title: "KDS", subtitle: "Cozinha organizada", color: "from-yellow-500 to-orange-500" },
              { icon: Truck, title: "ENTREGA", subtitle: "ou Retirada rápida", color: "from-yellow-400 to-yellow-500" }
            ].map((step, index) => (
              <div key={index} className="flex items-center gap-4">
                <Card className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all w-40 md:w-48">
                  <CardContent className="p-6 text-center">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-3`}>
                      <step.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-bold text-white text-sm">{step.title}</h3>
                    <p className="text-zinc-500 text-xs mt-1">{step.subtitle}</p>
                  </CardContent>
                </Card>
                {index < 2 && (
                  <div className="hidden md:block text-orange-400 text-2xl">→</div>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-zinc-500 text-sm mt-8">
            Autoatendimento que funciona no balcão e no delivery
          </p>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Recupere o lucro que você está{" "}
              <span className="text-orange-400">dando para os aplicativos.</span>
            </h2>
          </div>

          {/* ROI Card */}
          <Card className="max-w-2xl mx-auto bg-zinc-900 border-2 border-orange-500/30 overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="space-y-4">
                {/* iFood */}
                <div className="flex items-center justify-between py-3 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <Flame className="w-5 h-5 text-orange-400" />
                    <span className="text-zinc-300">300 Jantinhas/mês no iFood (ticket R$ 45)</span>
                  </div>
                  <span className="text-white font-semibold">R$ 13.500,00</span>
                </div>
                <div className="flex items-center justify-between py-2 text-red-400">
                  <span className="flex items-center gap-2">
                    <span className="text-lg">❌</span>
                    Taxa iFood (25%)
                  </span>
                  <span className="font-semibold">- R$ 3.375,00</span>
                </div>

                <div className="border-t-2 border-dashed border-zinc-700 my-4" />

                {/* Mostralo */}
                <div className="flex items-center justify-between py-3 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <Flame className="w-5 h-5 text-orange-400" />
                    <span className="text-zinc-300">300 Jantinhas/mês no Mostralo</span>
                  </div>
                  <span className="text-white font-semibold">R$ 13.500,00</span>
                </div>
                <div className="flex items-center justify-between py-2 text-green-400">
                  <span className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Taxa Mostralo
                  </span>
                  <span className="font-semibold">R$ 0,00</span>
                </div>
                <div className="flex items-center justify-between py-2 text-green-400">
                  <span className="flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Mensalidade Profissional
                  </span>
                  <span className="font-semibold">- R$ 397,00</span>
                </div>

                <div className="border-t-2 border-orange-500/30 my-4" />

                {/* Results */}
                <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold flex items-center gap-2">
                      🎯 LUCRO EXTRA MENSAL
                    </span>
                    <span className="text-2xl font-bold text-orange-400">R$ 2.978,00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-bold flex items-center gap-2">
                      📅 ECONOMIA ANUAL
                    </span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                      R$ 35.736,00
                    </span>
                  </div>
                  <p className="text-zinc-400 text-sm pt-2">
                    💡 Dinheiro que volta para o seu bolso!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-20 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Jantinhas que já{" "}
              <span className="text-orange-400">faturam mais</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-zinc-900 border-zinc-800 hover:border-orange-500/30 transition-all">
                <CardContent className="p-6">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-zinc-300 italic mb-4">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold text-white">{testimonial.author}</p>
                    <p className="text-sm text-zinc-500">{testimonial.business}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Pronto para ser a maior jantinha{" "}
              <span className="bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                da região?
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative overflow-hidden transition-all duration-300 ${
                  plan.highlighted 
                    ? "bg-gradient-to-br from-zinc-900 to-zinc-800 border-2 border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.2)]" 
                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {plan.badge && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-center text-xs font-bold py-1">
                    🔥 {plan.badge}
                  </div>
                )}
                <CardContent className={`p-6 ${plan.badge ? "pt-10" : ""}`}>
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-sm text-zinc-400">R$</span>
                      <span className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                        {plan.price}
                      </span>
                      <span className="text-zinc-400">/mês</span>
                    </div>
                    <p className="text-sm text-zinc-500 mt-2">{plan.description}</p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-zinc-300">
                        <Check className="w-4 h-4 text-orange-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link to="/signup" className="block">
                    <Button 
                      className={`w-full ${
                        plan.highlighted 
                          ? "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]" 
                          : "bg-zinc-800 hover:bg-zinc-700 text-white"
                      }`}
                    >
                      Começar Agora
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Final CTA */}
          <div className="text-center mt-12">
            <Link to="/signup">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300"
              >
                <Flame className="w-5 h-5 mr-2" />
                COMEÇAR AGORA - TESTE GRÁTIS
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              Perguntas <span className="text-orange-400">Frequentes</span>
            </h2>

            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 data-[state=open]:border-orange-500/50"
                >
                  <AccordionTrigger className="text-left text-white hover:text-orange-400 hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-400 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-zinc-500 text-sm">
              <span className="font-bold text-orange-400">Mostralo.com.br</span> | Sua brasa, seu lucro, sua liberdade.
            </p>
            <div className="flex gap-6 text-sm text-zinc-500">
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

export default NichoChurrasquinhosPage;
