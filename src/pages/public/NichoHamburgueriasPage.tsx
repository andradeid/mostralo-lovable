import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { usePageSEO } from "@/hooks/useSEO";
import { Link } from "react-router-dom";
import { 
  Flame, 
  Beef, 
  Timer, 
  Monitor, 
  Tablet,
  Bike,
  Zap,
  MessageSquare,
  Printer,
  Users,
  TrendingUp,
  Check,
  Star,
  ArrowRight,
  Package,
  ChefHat
} from "lucide-react";

// Componente de Status de Pedido Animado (Kanban Visual)
const OrderStatusKanban = () => {
  return (
    <div className="w-full py-16 px-4 bg-zinc-900/50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Visualize o fluxo perfeito da sua operação
          </h2>
          <p className="text-zinc-400 text-lg">
            Acompanhe cada pedido em tempo real no seu KDS
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Entrada */}
          <div className="relative">
            <div className="bg-zinc-800 rounded-xl p-6 border-2 border-orange-500/30 animate-[pulse_3s_ease-in-out_infinite]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-white">ENTRADA</h3>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-orange-500 font-bold">#42</span>
                  <span className="text-xs text-zinc-500">Agora</span>
                </div>
                <p className="text-white text-sm font-medium">Smash Duplo + Bacon</p>
                <p className="text-zinc-500 text-xs mt-1">Ponto: Ao ponto</p>
              </div>
            </div>
            <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
              <ArrowRight className="w-6 h-6 text-orange-500 animate-pulse" />
            </div>
          </div>

          {/* Preparo */}
          <div className="relative">
            <div className="bg-zinc-800 rounded-xl p-6 border-2 border-orange-500/60">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-500/30 rounded-full flex items-center justify-center animate-pulse">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold text-white">NA CHAPA</h3>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4 border border-orange-500/50 shadow-lg shadow-orange-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-orange-500 font-bold">#41</span>
                  <span className="text-xs text-orange-400">2 min</span>
                </div>
                <p className="text-white text-sm font-medium">Combo Burger Premium</p>
                <p className="text-zinc-500 text-xs mt-1">Ponto: Bem passado</p>
                <div className="mt-2 h-1 bg-zinc-700 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full animate-[progress_2s_ease-in-out_infinite]" style={{ width: '60%' }} />
                </div>
              </div>
            </div>
            <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
              <ArrowRight className="w-6 h-6 text-orange-500 animate-pulse" />
            </div>
          </div>

          {/* Saída */}
          <div>
            <div className="bg-zinc-800 rounded-xl p-6 border-2 border-green-500/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-white">SAÍDA</h3>
              </div>
              <div className="bg-zinc-900 rounded-lg p-4 border border-green-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-500 font-bold">#40</span>
                  <span className="text-xs text-green-400">Pronto!</span>
                </div>
                <p className="text-white text-sm font-medium">Classic Burger</p>
                <p className="text-zinc-500 text-xs mt-1">Aguardando entregador</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NichoHamburgueriasPage = () => {
  usePageSEO({
    title: "Sistema para Hamburguerias | Cardápio Digital, KDS e Delivery | Mostralo",
    description: "Sistema completo para hamburguerias. Cardápio digital com adicionais ilimitados, KDS, totem de autoatendimento e gestão de delivery. Taxa 0% por pedido.",
    keywords: "sistema hamburgueria, cardápio digital burger, KDS hamburgueria, delivery hamburgueria, totem autoatendimento, gestão fast food"
  });

  const solutions = [
    {
      icon: Beef,
      title: "Adicionais Ilimitados",
      description: "Ponto da carne, combos, extras e observações. O cliente monta o burger perfeito sem você precisar atender o telefone."
    },
    {
      icon: Monitor,
      title: "KDS (Monitor de Cozinha)",
      description: "Organize a sequência de montagem por tempo de preparo. Sua equipe da chapa foca no burger, o sistema cuida do tempo."
    },
    {
      icon: Tablet,
      title: "Totem de Autoatendimento",
      description: "Para sua loja física. Reduza filas no balcão e deixe o cliente pedir e pagar via PIX automático sozinho."
    }
  ];

  const features = [
    {
      icon: TrendingUp,
      title: "O Fim das Taxas",
      description: "Imagine economizar mais de R$ 3.000/mês em comissões do iFood. Esse dinheiro é seu, não do aplicativo.",
      stat: "R$ 3.000+",
      statLabel: "economia/mês"
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Marketing de Resgate",
      description: "'Quinta do Burger!' O Mostralo avisa automaticamente todos os seus clientes fiéis, gerando picos de venda nos dias parados.",
      stat: "+35%",
      statLabel: "vendas"
    },
    {
      icon: Bike,
      title: "App do Entregador",
      description: "Gestão total da sua frota própria. Rastreie a entrega em tempo real e dê segurança para o seu cliente.",
      stat: "100%",
      statLabel: "controle"
    }
  ];

  const testimonials = [
    {
      quote: "Economizo R$ 3.800/mês desde que saí do iFood.",
      author: "Carlos",
      business: "Smash Burger - SP"
    },
    {
      quote: "O KDS zerou os erros de montagem no horário de pico.",
      author: "Amanda",
      business: "Burger House - RJ"
    },
    {
      quote: "O totem de autoatendimento reduziu 40% da fila.",
      author: "Ricardo",
      business: "Fast Burger - MG"
    }
  ];

  const plans = [
    {
      name: "Essencial",
      price: "249,90",
      description: "Cardápio Digital + PDV + Central de Pedidos",
      features: [
        "Cardápio com Adicionais Ilimitados",
        "Controle de ponto da carne",
        "Impressão térmica automática",
        "Suporte 7 dias"
      ]
    },
    {
      name: "Profissional",
      price: "397,00",
      description: "KDS + Gestão de Entregadores + Automação WhatsApp",
      popular: true,
      badge: "O QUERIDINHO",
      features: [
        "Tudo do Essencial",
        "KDS (Monitor de Cozinha)",
        "Gestão de Entregas",
        "WhatsApp Marketing Automático"
      ]
    },
    {
      name: "Empresarial",
      price: "597,00",
      description: "Para franquias e redes de hamburguerias",
      features: [
        "Tudo do Profissional",
        "Multi-lojas",
        "API completa",
        "Suporte Prioritário 24h"
      ]
    }
  ];

  const faqs = [
    {
      question: "Como funciona o controle de ponto da carne?",
      answer: "O cliente escolhe o ponto (Mal passado, Ao ponto, Bem passado) direto no cardápio. O pedido chega formatado para a chapa com todas as informações destacadas, evitando erros de preparo."
    },
    {
      question: "O sistema suporta adicionais ilimitados?",
      answer: "Sim! Você pode criar quantos adicionais quiser: bacon extra, queijo cheddar, cebola caramelizada, molhos especiais. O cliente monta o burger do jeito dele e o sistema calcula tudo automaticamente."
    },
    {
      question: "Como funciona o Totem de Autoatendimento?",
      answer: "Você disponibiliza um tablet na sua loja. O cliente faz o pedido sozinho, paga via PIX e o pedido cai automaticamente na cozinha. Sem filas, sem erros, e você economiza com atendentes."
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-zinc-950" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 mb-8">
              <Beef className="w-4 h-4 text-orange-500" />
              <span className="text-orange-400 text-sm font-medium">Para Hamburguerias & Fast-Food</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Domine o seu delivery e{" "}
              <span className="text-orange-500">pare de dividir o seu lucro</span>{" "}
              com os apps.
            </h1>
            
            <p className="text-xl md:text-2xl text-zinc-400 mb-10 max-w-3xl mx-auto">
              O Mostralo é o ecossistema All-in-One que blinda a sua hamburgueria contra taxas abusivas, 
              organiza sua chapa com KDS e automatiza seus pedidos via WhatsApp.
            </p>
            
            <Link to="/signup">
              <Button 
                size="lg" 
                className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 animate-[neon-pulse_2s_ease-in-out_infinite]"
                style={{
                  animation: "neon-pulse 2s ease-in-out infinite"
                }}
              >
                <Flame className="w-5 h-5 mr-2" />
                QUERO MINHA HAMBURGUERIA LUCRATIVA
              </Button>
            </Link>
            
            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 mt-12">
              {[
                { icon: Zap, text: "Taxa 0%" },
                { icon: Beef, text: "Adicionais ilimitados" },
                { icon: Monitor, text: "KDS integrado" },
                { icon: Tablet, text: "Totem" }
              ].map((badge, index) => (
                <div key={index} className="flex items-center gap-2 text-zinc-400">
                  <badge.icon className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problema Section */}
      <section className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Pedido errado na chapa é{" "}
              <span className="text-orange-500">dinheiro jogado fora.</span>
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              No horário de pico, cada segundo conta. Se você ainda depende de papel ou de 
              sistemas lentos que cobram taxas por cada venda, sua hamburgueria está perdendo oxigênio.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {solutions.map((solution, index) => (
              <Card key={index} className="bg-zinc-800 border-zinc-700 hover:border-orange-500/50 transition-all duration-300 group">
                <CardContent className="p-8">
                  <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500/30 transition-colors">
                    <solution.icon className="w-7 h-7 text-orange-500" />
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
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Inteligência de Vendas que{" "}
              <span className="text-orange-500">Trabalha por Você</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-orange-500" />
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-orange-500">{feature.stat}</span>
                      <p className="text-xs text-zinc-500">{feature.statLabel}</p>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-zinc-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Kanban Visual */}
      <OrderStatusKanban />

      {/* ROI Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              O investimento que se paga na{" "}
              <span className="text-orange-500">primeira semana.</span>
            </h2>
          </div>
          
          <Card className="bg-zinc-900 border-orange-500/30 shadow-xl shadow-orange-500/10">
            <CardContent className="p-8 md:p-12">
              <div className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <Beef className="w-5 h-5 text-orange-500" />
                    <span className="text-zinc-300">300 burgers vendidos no iFood</span>
                  </div>
                  <span className="text-white font-medium">R$ 13.500,00</span>
                </div>
                
                <div className="flex items-center justify-between py-4 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="text-red-500 text-xl">❌</span>
                    <span className="text-zinc-300">Taxas iFood (25%)</span>
                  </div>
                  <span className="text-red-500 font-medium">- R$ 3.375,00</span>
                </div>
                
                <div className="h-px bg-zinc-700 my-4" />
                
                <div className="flex items-center justify-between py-4 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <Beef className="w-5 h-5 text-orange-500" />
                    <span className="text-zinc-300">300 burgers vendidos no Mostralo</span>
                  </div>
                  <span className="text-white font-medium">R$ 13.500,00</span>
                </div>
                
                <div className="flex items-center justify-between py-4 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-xl">✅</span>
                    <span className="text-zinc-300">Taxas por pedido</span>
                  </div>
                  <span className="text-green-500 font-medium">R$ 0,00</span>
                </div>
                
                <div className="flex items-center justify-between py-4 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <span className="text-green-500 text-xl">✅</span>
                    <span className="text-zinc-300">Mensalidade Profissional</span>
                  </div>
                  <span className="text-orange-500 font-medium">R$ 597,90</span>
                </div>
                
                <div className="bg-orange-500/10 rounded-xl p-6 mt-6 border border-orange-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl text-white font-bold">🎯 LUCRO EXTRA MENSAL:</span>
                    <span className="text-3xl font-bold text-orange-500">R$ 2.777,10</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">📅 Economia Anual:</span>
                    <span className="text-xl font-bold text-green-500">R$ 33.324,00</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Hamburguerias que já{" "}
              <span className="text-orange-500">faturam mais</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-zinc-800 border-zinc-700">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-orange-500 text-orange-500" />
                    ))}
                  </div>
                  <p className="text-white text-lg mb-6">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                      <ChefHat className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{testimonial.author}</p>
                      <p className="text-zinc-500 text-sm">{testimonial.business}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Pronto para elevar o nível do seu{" "}
              <span className="text-orange-500">Burger?</span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`bg-zinc-900 border-2 transition-all duration-300 ${
                  plan.popular 
                    ? 'border-orange-500 shadow-xl shadow-orange-500/20' 
                    : 'border-zinc-800 hover:border-orange-500/50'
                }`}
              >
                <CardContent className="p-8">
                  {plan.badge && (
                    <div className="inline-flex items-center gap-2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                      <Flame className="w-3 h-3" />
                      {plan.badge}
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-sm text-zinc-500">R$</span>
                    <span className="text-4xl font-bold text-orange-500">{plan.price}</span>
                    <span className="text-zinc-500">/mês</span>
                  </div>
                  <p className="text-zinc-400 mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-3 text-zinc-300">
                        <Check className="w-5 h-5 text-orange-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/signup">
                    <Button 
                      className={`w-full ${
                        plan.popular 
                          ? 'bg-orange-500 hover:bg-orange-600' 
                          : 'bg-zinc-800 hover:bg-zinc-700'
                      }`}
                    >
                      Começar Agora
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link to="/signup">
              <Button 
                size="lg" 
                className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-10 py-6 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
              >
                <Zap className="w-5 h-5 mr-2" />
                TESTAR GRÁTIS POR 7 DIAS
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Perguntas <span className="text-orange-500">Frequentes</span>
            </h2>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-zinc-800 border border-zinc-700 rounded-xl px-6 data-[state=open]:border-orange-500/50"
              >
                <AccordionTrigger className="text-white hover:text-orange-500 text-left py-6">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <p className="text-2xl font-bold text-white mb-2">Mostralo.com.br</p>
            <p className="text-zinc-500">
              Sua marca forte. Seu lucro protegido. Sua operação no controle.
            </p>
            <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm text-zinc-500">
              <Link to="/" className="hover:text-orange-500 transition-colors">Início</Link>
              <Link to="/funcionalidades" className="hover:text-orange-500 transition-colors">Funcionalidades</Link>
              <Link to="/suporte" className="hover:text-orange-500 transition-colors">Suporte</Link>
              <Link to="/termos" className="hover:text-orange-500 transition-colors">Termos</Link>
              <Link to="/privacidade" className="hover:text-orange-500 transition-colors">Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Lead Button */}
      <WhatsAppLeadButton />

      {/* CSS Animation */}
      <style>{`
        @keyframes neon-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(249, 115, 22, 0.4); }
          50% { box-shadow: 0 0 45px rgba(249, 115, 22, 0.8); }
        }
        @keyframes progress {
          0%, 100% { width: 60%; }
          50% { width: 80%; }
        }
      `}</style>
    </div>
  );
};

export default NichoHamburgueriasPage;
