import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/useSEO";
import { 
  Truck, 
  MapPin, 
  Smartphone, 
  QrCode, 
  Timer, 
  Wifi,
  Tablet,
  Zap,
  DollarSign,
  CheckCircle2,
  Star,
  ArrowRight,
  Monitor,
  TrendingUp,
  Users,
  CreditCard,
  Bell,
  BarChart3
} from "lucide-react";

const NichoFoodTruckPage = () => {
  usePageSEO({
    title: "Sistema para Food Truck | PDV Móvel, QR Code e KDS | Mostralo",
    description: "Sistema completo para Food Trucks: PDV móvel, QR Code de autoatendimento, KDS compacto e WhatsApp Marketing por localização. Taxa 0% e controle total pelo celular.",
    keywords: "sistema food truck, pdv móvel food truck, qr code food truck, cardápio digital food truck, gestão food truck, autoatendimento food truck"
  });

  const solutions = [
    {
      icon: Smartphone,
      title: "PDV Móvel (Tablet/Celular)",
      description: "Venda no balcão com um toque. Aceite PIX, Cartão e Dinheiro com fechamento de caixa automático. Sem fios, sem bagunça."
    },
    {
      icon: QrCode,
      title: "QR Code na Mesa ou Balcão",
      description: "O cliente chega, escaneia o código, faz o pedido e paga sozinho. O pedido cai direto na sua tela de preparo (KDS)."
    },
    {
      icon: Monitor,
      title: "KDS para Espaços Reduzidos",
      description: "Substitua a impressora barulhenta por um monitor ou tablet. Visualize a fila de pedidos por ordem de chegada."
    }
  ];

  const features = [
    {
      icon: DollarSign,
      title: "O Fim das Taxas do App",
      description: "Por que dar 25% do seu lucro para aplicativos se o cliente está na sua frente? Use o Mostralo para criar sua própria base de clientes fiéis e venda com taxa 0%.",
      stat: "0%",
      statLabel: "taxas"
    },
    {
      icon: MapPin,
      title: "WhatsApp Marketing de Localização",
      description: "Vai mudar de ponto hoje? O Mostralo avisa seus clientes daquela região automaticamente via WhatsApp. Garanta movimento onde quer que você estacione.",
      stat: "+40%",
      statLabel: "movimento"
    },
    {
      icon: BarChart3,
      title: "Financeiro na Palma da Mão",
      description: "Saiba exatamente quanto faturou na noite, quais ingredientes estão acabando e qual o seu lucro real, tudo pelo smartphone.",
      stat: "100%",
      statLabel: "controle"
    }
  ];

  const testimonials = [
    {
      quote: "O QR Code eliminou a fila no balcão. Faturei 30% mais no último evento.",
      author: "Lucas",
      business: "Truck Burger - SP"
    },
    {
      quote: "O aviso de localização pelo WhatsApp é genial. Meus clientes me acham em qualquer ponto.",
      author: "Camila",
      business: "Taco Truck - RJ"
    },
    {
      quote: "Controlo tudo pelo celular, até de casa. Sei exatamente quanto faturei cada noite.",
      author: "Roberto",
      business: "Hot Dog Truck - MG"
    }
  ];

  const plans = [
    {
      name: "Essencial",
      price: "249,90",
      description: "PDV Móvel + Cardápio Digital + Relatórios",
      features: [
        "PDV para Tablet/Celular",
        "Cardápio Digital com QR Code",
        "Fechamento de caixa automático",
        "Suporte 7 dias"
      ],
      highlighted: false
    },
    {
      name: "Profissional",
      price: "397,00",
      description: "QR Code de Mesa + KDS + WhatsApp Marketing",
      features: [
        "Tudo do Essencial",
        "QR Code de autoatendimento",
        "KDS (Monitor de Preparo)",
        "WhatsApp Marketing de Localização"
      ],
      highlighted: true,
      badge: "IDEAL PARA EVENTOS"
    },
    {
      name: "Empresarial",
      price: "597,00",
      description: "Para frotas de Food Trucks e Franquias Móveis",
      features: [
        "Tudo do Profissional",
        "Multi-trucks (gestão centralizada)",
        "API completa",
        "Suporte Prioritário 24h"
      ],
      highlighted: false
    }
  ];

  const faqs = [
    {
      question: "O sistema funciona sem internet fixa?",
      answer: "Sim! O PDV móvel funciona com 4G do seu celular. E mesmo se a conexão cair temporariamente, os pedidos são salvos localmente e sincronizados quando a internet voltar. Sua operação nunca para."
    },
    {
      question: "Como funciona o WhatsApp de localização?",
      answer: "Você cadastra suas regiões de atuação e seus clientes. Quando você estacionar em um novo ponto, o sistema avisa automaticamente os clientes daquela região: 'O Truck Burger está hoje na Praça X! Venha nos visitar.'"
    },
    {
      question: "Preciso de equipamentos caros?",
      answer: "Não! Você pode usar o celular ou tablet que já tem. O sistema é 100% na nuvem. Se quiser, pode adicionar uma impressora térmica Bluetooth compacta para imprimir os pedidos na cozinha."
    }
  ];

  const trackingSteps = [
    { label: "Pedido Recebido", time: "19:32", completed: true },
    { label: "Preparando", time: "19:35", completed: true },
    { label: "Pronto para Retirada", time: "19:42", completed: false, current: true },
    { label: "Retirado", time: "", completed: false }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-zinc-950" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 mb-8">
              <Truck className="w-5 h-5 text-orange-400" />
              <span className="text-orange-300 font-medium">Para Food Trucks & Trailers de Comida</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Leve a inteligência do Mostralo para a{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                estrada
              </span>{" "}
              e fature mais em cada parada.
            </h1>

            {/* Sub-headline */}
            <p className="text-xl text-zinc-400 mb-10 max-w-3xl mx-auto">
              O ecossistema All-in-One que transforma seu Food Truck em uma operação profissional. 
              Gerencie pedidos, elimine filas com autoatendimento e controle tudo pelo celular ou tablet.
            </p>

            {/* CTA */}
            <Link to="/signup">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-6 text-lg font-bold rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.5)] hover:shadow-[0_0_50px_rgba(249,115,22,0.7)] transition-all duration-300"
              >
                QUERO TURBINAR MEU FOOD TRUCK
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-6 mt-12">
              {[
                { icon: DollarSign, text: "Taxa 0%" },
                { icon: Smartphone, text: "PDV Móvel" },
                { icon: QrCode, text: "QR Code" },
                { icon: Monitor, text: "KDS Compacto" }
              ].map((badge, index) => (
                <div key={index} className="flex items-center gap-2 text-zinc-400">
                  <badge.icon className="w-5 h-5 text-orange-400" />
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Espaço pequeno,{" "}
              <span className="text-orange-400">produtividade gigante</span>
            </h2>
            <p className="text-xl text-zinc-400 mb-4">
              Pare de se enrolar com comandas de papel no meio da correria.
            </p>
            <p className="text-zinc-500">
              No Food Truck, cada centímetro e cada segundo contam. Se você perde tempo 
              gritando pedidos ou conferindo papel molhado de gordura, você está perdendo dinheiro.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {solutions.map((solution, index) => (
              <Card 
                key={index} 
                className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 group"
              >
                <CardContent className="p-8">
                  <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500/30 transition-colors">
                    <solution.icon className="w-7 h-7 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{solution.title}</h3>
                  <p className="text-zinc-400">{solution.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Tecnologia que{" "}
              <span className="text-orange-400">acompanha o seu ritmo</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 overflow-hidden group"
              >
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                      <feature.icon className="w-7 h-7 text-orange-400" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-400">{feature.stat}</div>
                      <div className="text-xs text-zinc-500 uppercase">{feature.statLabel}</div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                  <p className="text-zinc-400">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Order Tracking Simulator */}
      <section className="py-20 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Seu cliente acompanha{" "}
                  <span className="text-orange-400">cada etapa</span>
                </h2>
                <p className="text-zinc-400 text-lg mb-8">
                  O cliente faz o pedido pelo QR Code e acompanha o status em tempo real no próprio celular. 
                  Quando estiver pronto, recebe uma notificação. Menos gritaria, mais organização.
                </p>
                <ul className="space-y-4">
                  {[
                    "Notificação automática quando o pedido fica pronto",
                    "Reduz aglomeração no balcão de retirada",
                    "Cliente sabe exatamente quando ir buscar"
                  ].map((item, index) => (
                    <li key={index} className="flex items-center gap-3 text-zinc-300">
                      <CheckCircle2 className="w-5 h-5 text-orange-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Phone Mockup */}
              <div className="flex justify-center">
                <div className="bg-zinc-800 rounded-3xl p-4 shadow-2xl shadow-orange-500/10 border border-zinc-700">
                  <div className="bg-zinc-950 rounded-2xl p-6 w-72">
                    {/* Phone Header */}
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <Truck className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <div className="font-bold text-white">Truck Burger</div>
                        <div className="text-sm text-zinc-500">Pedido #127</div>
                      </div>
                    </div>

                    {/* Tracking Steps */}
                    <div className="space-y-4">
                      {trackingSteps.map((step, index) => (
                        <div key={index} className="flex items-start gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              step.completed 
                                ? "bg-orange-500 border-orange-500" 
                                : step.current 
                                  ? "border-orange-500 animate-pulse" 
                                  : "border-zinc-600"
                            }`}>
                              {step.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                              {step.current && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
                            </div>
                            {index < trackingSteps.length - 1 && (
                              <div className={`w-0.5 h-8 ${
                                step.completed ? "bg-orange-500" : "bg-zinc-700"
                              }`} />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className={`font-medium ${
                              step.completed || step.current ? "text-white" : "text-zinc-500"
                            }`}>
                              {step.label}
                            </div>
                            {step.time && (
                              <div className="text-sm text-zinc-500">{step.time}</div>
                            )}
                            {step.current && (
                              <div className="text-xs text-orange-400 mt-1">(Você está no balcão)</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <button className="w-full mt-6 bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-xl py-3 flex items-center justify-center gap-2 hover:bg-orange-500/30 transition-colors">
                      <Bell className="w-4 h-4" />
                      Chamar quando estiver pronto
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Menos custo fixo,{" "}
              <span className="text-orange-400">mais lucro líquido</span>
            </h2>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="bg-zinc-900 border-orange-500/30 overflow-hidden">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 pb-4 border-b border-zinc-800">
                    <Users className="w-8 h-8 text-zinc-500" />
                    <div className="flex-1">
                      <div className="text-zinc-400">Funcionário no caixa (salário + encargos)</div>
                      <div className="text-sm text-zinc-600">Substituído pelo QR Code/Totem</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-400">R$ 2.000,00</div>
                      <div className="text-xs text-zinc-500">economia/mês</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pb-4 border-b border-zinc-800">
                    <CreditCard className="w-8 h-8 text-zinc-500" />
                    <div className="flex-1">
                      <div className="text-zinc-400">Taxas de marketplace em eventos</div>
                      <div className="text-sm text-zinc-600">(iFood, Rappi, etc. - 25%)</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-400">R$ 3.500,00</div>
                      <div className="text-xs text-zinc-500">economia/mês</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-xl p-6 border border-orange-500/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg text-zinc-300">ECONOMIA TOTAL MENSAL</div>
                        <div className="text-sm text-orange-400 mt-1">
                          O Mostralo se paga nas primeiras horas de um evento!
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-orange-400">R$ 5.500,00</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Food Trucks que já{" "}
              <span className="text-orange-400">faturam mais</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-orange-400 text-orange-400" />
                    ))}
                  </div>
                  <p className="text-zinc-300 mb-6 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                      <Truck className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">{testimonial.author}</div>
                      <div className="text-sm text-zinc-500">{testimonial.business}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Pronto para{" "}
              <span className="text-orange-400">profissionalizar</span>{" "}
              seu Food Truck?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative overflow-hidden transition-all duration-300 ${
                  plan.highlighted 
                    ? "bg-gradient-to-b from-orange-500/20 to-zinc-900 border-orange-500 scale-105" 
                    : "bg-zinc-900 border-zinc-800 hover:border-orange-500/50"
                }`}
              >
                {plan.badge && (
                  <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    {plan.badge}
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-orange-400">R$ {plan.price}</span>
                    <span className="text-zinc-500">/mês</span>
                  </div>
                  <p className="text-sm text-zinc-400 mb-6">{plan.description}</p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-3 text-zinc-300">
                        <CheckCircle2 className="w-5 h-5 text-orange-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link to="/signup">
                    <Button 
                      className={`w-full ${
                        plan.highlighted 
                          ? "bg-orange-500 hover:bg-orange-600 text-white" 
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
          <div className="text-center mt-16">
            <Link to="/signup">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-10 py-6 text-lg font-bold rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.5)] hover:shadow-[0_0_50px_rgba(249,115,22,0.7)] transition-all duration-300"
              >
                QUERO COMEÇAR AGORA
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Dúvidas <span className="text-orange-400">frequentes</span>
            </h2>

            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`faq-${index}`}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 data-[state=open]:border-orange-500/50"
                >
                  <AccordionTrigger className="text-left text-white hover:text-orange-400 hover:no-underline py-6">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-zinc-400 pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-white">Mostralo.com.br</div>
                <div className="text-sm text-zinc-500">Liberdade para vender em qualquer lugar.</div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
              <Link to="/" className="hover:text-orange-400 transition-colors">Início</Link>
              <Link to="/funcionalidades" className="hover:text-orange-400 transition-colors">Funcionalidades</Link>
              <Link to="/suporte" className="hover:text-orange-400 transition-colors">Suporte</Link>
              <Link to="/termos" className="hover:text-orange-400 transition-colors">Termos</Link>
              <Link to="/privacidade" className="hover:text-orange-400 transition-colors">Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NichoFoodTruckPage;
