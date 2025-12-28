import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  Tablet, 
  Monitor, 
  Tv, 
  CheckCircle2, 
  Truck, 
  BarChart3, 
  Star,
  Timer,
  ChefHat,
  Users,
  ArrowRight,
  Utensils,
  Clock,
  DollarSign,
  Printer
} from "lucide-react";
import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/useSEO";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";

const NichoPadariasPage = () => {
  usePageSEO({
    title: "Sistema para Padarias e Panificadoras | Totem Autoatendimento | Mostralo",
    description: "Sistema completo para padarias que servem almoço. Totem de autoatendimento, KDS, chamada de senha na TV. Acabe com filas e economize em mão de obra.",
    keywords: "sistema padaria, totem autoatendimento padaria, kds padaria, chamada senha padaria, software panificadora, cardápio digital padaria"
  });

  const solutions = [
    {
      icon: Tablet,
      title: "Totem de Autoatendimento",
      description: "O cliente chega, escolhe o prato, os acompanhamentos e paga via PIX ou Cartão direto no totem. Sem filas, sem erros e sem precisar de um funcionário fixo ali."
    },
    {
      icon: Monitor,
      title: "KDS (Monitor de Cozinha)",
      description: "Adeus papelzinho. O pedido do totem vai direto para a tela da cozinha, com cores que indicam o tempo de espera. Sua equipe foca no prato, o sistema foca na organização."
    },
    {
      icon: Tv,
      title: "Chamada de Senha Integrada",
      description: "Assim que o prato fica pronto no KDS, o nome ou senha do cliente aparece em uma TV no salão. Organização de 'Fast Food' de luxo na sua padaria."
    }
  ];

  const features = [
    {
      icon: CheckCircle2,
      title: "O Fim do Erro Humano",
      description: "'Sem cebola', 'Carne bem passada', 'Extra de feijão'. O cliente seleciona tudo no totem. O que ele pede é o que a cozinha recebe. 100% de precisão.",
      stat: "0 erros",
      statLabel: "de pedido"
    },
    {
      icon: Truck,
      title: "Delivery com Taxa Zero",
      description: "Sua padaria também entrega? Pare de pagar 25% pro iFood. Tenha seu próprio cardápio digital e fidelize quem mora ao redor da loja.",
      stat: "R$ 3.000+",
      statLabel: "economia/mês"
    },
    {
      icon: BarChart3,
      title: "Financeiro Unificado",
      description: "Saiba quanto vendeu de pão no balcão e quanto vendeu de almoço no totem, tudo em um só dashboard. Controle total do seu fluxo de caixa.",
      stat: "100%",
      statLabel: "visibilidade"
    }
  ];

  const testimonials = [
    {
      name: "Seu João",
      business: "Padaria São José - SP",
      text: "O Totem eliminou a fila do almoço. Minha atendente agora ajuda na produção.",
      rating: 5
    },
    {
      name: "Maria",
      business: "Panificadora Pão Quente - MG",
      text: "A chamada de senha na TV deixou minha padaria com cara de restaurante moderno.",
      rating: 5
    },
    {
      name: "Carlos",
      business: "Padaria Artesanal - RJ",
      text: "Economia de R$ 3.500/mês só em mão de obra. O sistema se pagou no primeiro mês.",
      rating: 5
    }
  ];

  const plans = [
    {
      name: "Essencial",
      price: "249,90",
      description: "Cardápio Digital + PDV + Impressão Automática",
      features: [
        "Cardápio digital completo",
        "PDV de balcão integrado",
        "Impressão térmica automática",
        "Suporte 7 dias"
      ],
      highlighted: false
    },
    {
      name: "Profissional",
      price: "397,00",
      description: "Totem de Autoatendimento + KDS + Chamada de Senha",
      features: [
        "Tudo do Essencial",
        "Totem de Autoatendimento",
        "KDS (Monitor de Cozinha)",
        "Chamada de Senha na TV",
        "Gestão de entregadores"
      ],
      highlighted: true,
      badge: "O MAIS INDICADO PARA ALMOÇO"
    },
    {
      name: "Empresarial",
      price: "597,00",
      description: "Multi-lojas e gestão de estoque avançada",
      features: [
        "Tudo do Profissional",
        "Multi-lojas",
        "Gestão de estoque",
        "API completa",
        "Suporte Prioritário 24h"
      ],
      highlighted: false
    }
  ];

  const faqs = [
    {
      question: "O Totem funciona para padarias que vendem almoço?",
      answer: "Funciona perfeitamente! O Totem é ideal para padarias com self-service ou pratos executivos. O cliente escolhe o prato, os acompanhamentos (arroz, feijão, salada, carne), paga no próprio totem e aguarda ser chamado. Você elimina filas e libera a atendente para outras funções."
    },
    {
      question: "Como funciona a chamada de senha na TV?",
      answer: "Quando o prato fica pronto, o cozinheiro marca como 'finalizado' no KDS. Automaticamente, o nome ou número do cliente aparece na TV do salão, chamando-o para retirar. É o mesmo sistema de grandes redes de fast food, agora na sua padaria."
    },
    {
      question: "Posso usar o sistema para delivery também?",
      answer: "Sim! O Mostralo unifica balcão, totem e delivery em um só sistema. Você tem seu próprio link de cardápio digital, recebe pedidos via WhatsApp ou site, e tudo aparece no mesmo KDS da cozinha. E o melhor: taxa zero sobre as vendas."
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-4 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-zinc-950 to-zinc-950" />
        
        {/* Decorative elements */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center">
            <Badge className="mb-6 bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-2">
              <ChefHat className="w-4 h-4 mr-2" />
              Para Padarias e Panificadoras
            </Badge>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Chega de filas e pedidos esquecidos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
                no horário do almoço
              </span>{" "}
              da sua padaria.
            </h1>
            
            <p className="text-lg md:text-xl text-zinc-400 mb-8 max-w-3xl mx-auto">
              O Mostralo é o ecossistema All-in-One que substitui a confusão do balcão 
              por um autoatendimento inteligente. Automatize seu almoço, organize sua 
              cozinha e recupere o controle da sua operação.
            </p>
            
            <Link to="/signup">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-orange-500/30 animate-pulse hover:animate-none transition-all"
              >
                QUERO ACABAR COM O CAOS
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-4 mt-10">
              {[
                { icon: DollarSign, text: "Taxa 0%" },
                { icon: Tablet, text: "Totem Autoatendimento" },
                { icon: Monitor, text: "KDS Integrado" },
                { icon: Tv, text: "Chamada de Senha" }
              ].map((badge, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-full px-4 py-2"
                >
                  <badge.icon className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-zinc-300">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 px-4 bg-zinc-900/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O gargalo do almoço está{" "}
              <span className="text-orange-400">matando seu lucro?</span>
            </h2>
            <p className="text-lg text-zinc-400 max-w-3xl mx-auto">
              Atendente sobrecarregada e cliente insatisfeito? Nós temos a solução. 
              No horário de pico, sua atendente não consegue ser rápida o suficiente. 
              Pedidos são esquecidos, o cliente cansa de esperar e sua cozinha vira uma bagunça.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {solutions.map((solution, index) => (
              <Card 
                key={index}
                className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 group"
              >
                <CardHeader>
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <solution.icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-xl text-white">{solution.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-400">{solution.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tecnologia que trabalha enquanto{" "}
              <span className="text-orange-400">você assa o pão</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all duration-300"
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-orange-400" />
                    </div>
                    <div className="text-right ml-auto">
                      <div className="text-2xl font-bold text-orange-400">{feature.stat}</div>
                      <div className="text-xs text-zinc-500">{feature.statLabel}</div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-zinc-400 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Perfect Flow Section */}
      <section className="py-16 px-4 bg-zinc-900/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Fluxo Perfeito:{" "}
              <span className="text-orange-400">do pedido ao prato</span>
            </h2>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              Com o Mostralo, sua padaria opera como um fast food de primeira linha. 
              O cliente pede sozinho, a cozinha recebe organizado e o salão chama pelo nome.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-4">
            {[
              { icon: Tablet, step: "1", title: "TOTEM", subtitle: "Cliente pede e paga" },
              { icon: ChefHat, step: "2", title: "COZINHA", subtitle: "KDS organiza os pedidos" },
              { icon: Tv, step: "3", title: "TV SENHA", subtitle: "Nome chamado no painel" }
            ].map((item, index) => (
              <div key={index} className="relative">
                <Card className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all text-center py-8">
                  <CardContent>
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-xs text-orange-400 font-semibold mb-1">PASSO {item.step}</div>
                    <h3 className="text-xl font-bold text-white mb-1">{item.title}</h3>
                    <p className="text-zinc-400 text-sm">{item.subtitle}</p>
                  </CardContent>
                </Card>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-orange-500" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-zinc-500 mt-8">
            Fluxo profissional que elimina filas e erros de pedido
          </p>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O sistema que{" "}
              <span className="text-orange-400">economiza um salário</span>
            </h2>
            <p className="text-lg text-zinc-400">
              Substitua o custo de uma atendente extra por tecnologia de ponta.
            </p>
          </div>

          <Card className="bg-zinc-900 border-2 border-orange-500/30 overflow-hidden">
            <CardContent className="p-6 md:p-8">
              {/* Atendente */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-zinc-400" />
                  <span className="font-semibold text-white">Uma atendente extra para o horário do almoço</span>
                </div>
                <div className="space-y-2 pl-7 text-sm">
                  <div className="flex justify-between text-zinc-400">
                    <span>Salário:</span>
                    <span>R$ 1.800,00</span>
                  </div>
                  <div className="flex justify-between text-red-400">
                    <span>❌ Encargos (~70%):</span>
                    <span>+ R$ 1.260,00</span>
                  </div>
                  <div className="flex justify-between text-red-400">
                    <span>❌ Vale-transporte:</span>
                    <span>+ R$ 200,00</span>
                  </div>
                  <div className="flex justify-between text-red-400">
                    <span>❌ Vale-refeição:</span>
                    <span>+ R$ 300,00</span>
                  </div>
                  <div className="flex justify-between text-white font-semibold pt-2 border-t border-zinc-700">
                    <span>CUSTO MENSAL TOTAL:</span>
                    <span>R$ 3.560,00</span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-zinc-700 my-6" />

              {/* Totem */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Tablet className="w-5 h-5 text-orange-400" />
                  <span className="font-semibold text-white">Totem de Autoatendimento Mostralo</span>
                </div>
                <div className="space-y-2 pl-7 text-sm">
                  <div className="flex justify-between text-green-400">
                    <span>✅ Mensalidade Profissional:</span>
                    <span>R$ 397,00</span>
                  </div>
                  <div className="text-green-400">
                    ✅ Disponível 24h, nunca falta, nunca erra
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-zinc-700 my-6" />

              {/* Result */}
              <div className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-lg">
                  <span className="text-white font-semibold">🎯 ECONOMIA MENSAL:</span>
                  <span className="text-orange-400 font-bold">R$ 3.163,00</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="text-white font-semibold">📅 ECONOMIA ANUAL:</span>
                  <span className="text-orange-400 font-bold">R$ 37.956,00</span>
                </div>
                <p className="text-sm text-zinc-300 pt-2">
                  💡 Realoque a atendente para produção ou limpeza!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 bg-zinc-900/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Padarias que já{" "}
              <span className="text-orange-400">organizaram o almoço</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index}
                className="bg-zinc-900 border-zinc-800 hover:border-orange-500/30 transition-all"
              >
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-orange-400 text-orange-400" />
                    ))}
                  </div>
                  <p className="text-zinc-300 mb-4 italic">"{testimonial.text}"</p>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-zinc-500">{testimonial.business}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto para transformar sua padaria em uma{" "}
              <span className="text-orange-400">referência tecnológica?</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <Card 
                key={index}
                className={`relative bg-zinc-900 transition-all duration-300 ${
                  plan.highlighted 
                    ? 'border-2 border-orange-500 shadow-lg shadow-orange-500/20' 
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 text-xs whitespace-nowrap">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <CardHeader className="pt-8">
                  <CardTitle className="text-xl text-white">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-orange-400">R$ {plan.price}</span>
                    <span className="text-zinc-500">/mês</span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                        <span className="text-zinc-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/signup">
                    <Button 
                      className={`w-full ${
                        plan.highlighted
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                      }`}
                    >
                      Começar Agora
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/signup">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-orange-500/30"
              >
                SOLICITAR DEMONSTRAÇÃO GRATUITA
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-zinc-900/50">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Dúvidas{" "}
              <span className="text-orange-400">Frequentes</span>
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`faq-${index}`}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-6 data-[state=open]:border-orange-500/50"
              >
                <AccordionTrigger className="text-white hover:text-orange-400 text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-zinc-800">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xl font-semibold text-white mb-2">
              Mostralo.com.br
            </p>
            <p className="text-zinc-400">
              Menos filas. Mais pedidos. Lucro total.
            </p>
            <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm text-zinc-500">
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

export default NichoPadariasPage;
