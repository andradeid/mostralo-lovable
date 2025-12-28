import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePageSEO } from "@/hooks/useSEO";
import { Link } from "react-router-dom";
import { 
  Cross, 
  ShieldCheck, 
  Truck, 
  Package, 
  Clock, 
  Heart, 
  Pill,
  Smartphone,
  RefreshCw,
  MessageSquare,
  BarChart3,
  MapPin,
  Store,
  Check,
  Star,
  Zap,
  ArrowRight,
  Building2,
  Users,
  TrendingUp
} from "lucide-react";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";

const NichoFarmaciasPage = () => {
  usePageSEO({
    title: "Mostralo para Farmácias e Drogarias | Sistema de Gestão e Delivery",
    description: "Sistema completo para farmácias: catálogo digital, PDV integrado, delivery rastreado, recorrência automática via WhatsApp. Taxa zero e gestão profissional.",
    keywords: "sistema farmácia, pdv drogaria, delivery medicamentos, catálogo digital farmácia, gestão farmácia, clique e retire",
    url: "https://mostralo.com.br/nicho-farmacias"
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50 to-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-orange-500 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Pill className="w-4 h-4" />
              Para Farmácias, Drogarias e Perfumarias
            </div>

            {/* Headline */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Transforme sua farmácia no destino{" "}
              <span className="text-blue-600">número #1</span> de saúde e conveniência do seu bairro.
            </h1>

            {/* Sub-headline */}
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              O Mostralo é o ecossistema All-in-One que une seu PDV de balcão ao delivery 
              ultra-rápido, com <span className="text-orange-500 font-semibold">taxa zero</span> e 
              automação de WhatsApp para fidelizar seus pacientes.
            </p>

            {/* CTA */}
            <Link to="/signup">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300"
              >
                MODERNIZAR MINHA FARMÁCIA
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-4 mt-10">
              {[
                { icon: ShieldCheck, text: "Taxa 0%" },
                { icon: Package, text: "Catálogo Digital" },
                { icon: Truck, text: "Delivery Rastreado" },
                { icon: RefreshCw, text: "Recorrência Automática" }
              ].map((badge, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border border-gray-100"
                >
                  <badge.icon className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interesse - Onde as Grandes Redes Falham */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
              Não perca vendas para os grandes apps.{" "}
              <span className="text-blue-600">Seja a entrega mais rápida</span> da sua região.
            </h2>
            <p className="text-gray-600 text-lg">
              No setor farmacêutico, quem entrega primeiro, ganha o cliente. Mas pagar 25% de 
              taxa por uma venda de urgência destrói sua margem. O Mostralo oferece a tecnologia 
              das grandes redes para a sua drogaria.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Package,
                title: "Catálogo Digital Completo",
                description: "Organize por categorias: Medicamentos, Higiene, Infantil, Dermocosméticos. O cliente encontra o que precisa em segundos."
              },
              {
                icon: Smartphone,
                title: "PDV de Balcão Integrado",
                description: "Vendas rápidas com controle de estoque unificado. O que vende na loja atualiza no site em tempo real."
              },
              {
                icon: Truck,
                title: "Delivery Inteligente",
                description: "Zonas de entrega por polígonos. Defina taxas justas e garanta que o pedido chegue em minutos, rastreado pelo cliente."
              }
            ].map((solution, index) => (
              <Card 
                key={index} 
                className="bg-white border-2 border-gray-100 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group"
              >
                <CardContent className="p-6">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors duration-300">
                    <solution.icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{solution.title}</h3>
                  <p className="text-gray-600">{solution.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Desejo - Inteligência de Venda e Recorrência */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
              Inteligência de Venda e <span className="text-orange-500">Recorrência</span>
            </h2>
            <p className="text-gray-600 text-lg">
              Tecnologia que fideliza seus clientes de forma ética e automatizada.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: RefreshCw,
                title: "Recorrência de Uso Contínuo",
                description: "O remédio do seu cliente vai acabar em 30 dias? O Mostralo identifica e envia um lembrete automático via WhatsApp oferecendo a renovação. Fidelização real e ética.",
                stat: "+60%",
                statLabel: "recompra"
              },
              {
                icon: MessageSquare,
                title: "WhatsApp Marketing de Ofertas",
                description: "Dispense o encarte de papel. Envie as ofertas da semana (fraldas, vitaminas, higiene) direto no celular de quem já compra com você.",
                stat: "R$ 0",
                statLabel: "custo papel"
              },
              {
                icon: BarChart3,
                title: "Financeiro e Gestão",
                description: "Dashboard com KPIs de receitas e despesas. Saiba exatamente qual categoria (ex: perfumaria vs. genéricos) está trazendo mais lucro.",
                stat: "100%",
                statLabel: "visibilidade"
              }
            ].map((feature, index) => (
              <Card 
                key={index} 
                className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-orange-500" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{feature.stat}</div>
                      <div className="text-xs text-gray-500 uppercase">{feature.statLabel}</div>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Clique e Retire */}
      <section className="py-16 md:py-20 bg-blue-600">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Store className="w-4 h-4" />
              Novo Recurso
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
              Compre online. Retire na loja em minutos.
            </h2>
            <p className="text-blue-100 text-lg">
              Ofereça a praticidade do e-commerce com a velocidade da compra física. 
              Seu cliente faz o pedido pelo celular e passa na farmácia apenas para retirar. 
              Sem fila, sem espera.
            </p>
          </div>

          {/* Fluxo Visual */}
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-10">
            {[
              { icon: Smartphone, title: "PEDIDO", desc: "Cliente faz pelo app" },
              { icon: Clock, title: "PREPARO", desc: "Você separa o produto" },
              { icon: Store, title: "RETIRADA", desc: "Rápida e sem fila" }
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-xs font-bold text-blue-200 mb-1">📍 {step.title}</div>
                  <div className="text-white font-medium">{step.desc}</div>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-white/50" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Ideal Para */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto border border-white/20">
            <h3 className="text-white font-bold mb-4 text-center">Ideal para:</h3>
            <div className="grid md:grid-cols-3 gap-4 text-center">
              {[
                "Farmácias de manipulação",
                "Compras de urgência",
                "Clientes que passam de carro"
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-center gap-2 text-blue-100">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ROI */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
              Economia real para investir no seu <span className="text-blue-600">estoque</span>
            </h2>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="bg-white border-2 border-blue-200 shadow-xl">
              <CardContent className="p-8">
                <div className="space-y-4">
                  {/* iFood */}
                  <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <Pill className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Vendas Mensais no iFood</div>
                        <div className="text-sm text-gray-500">Taxas Marketplace (25%)</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">R$ 10.000,00</div>
                      <div className="text-red-500 font-medium">- R$ 2.500,00</div>
                    </div>
                  </div>

                  {/* Mostralo */}
                  <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Pill className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Vendas Mensais no Mostralo</div>
                        <div className="text-sm text-gray-500">Mensalidade Profissional</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">R$ 10.000,00</div>
                      <div className="text-green-500 font-medium">- R$ 397,00</div>
                    </div>
                  </div>

                  {/* Resultado */}
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 mt-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">LUCRO EXTRA MENSAL</div>
                        <div className="text-3xl font-bold text-blue-600">R$ 2.103,00</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">ECONOMIA ANUAL</div>
                        <div className="text-3xl font-bold text-green-600">R$ 25.236,00</div>
                      </div>
                    </div>
                    <p className="text-center text-sm text-gray-600 mt-4">
                      💡 Equivalente a renovar todo o estoque de perfumaria!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
              Farmácias que já <span className="text-orange-500">faturam mais</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                quote: "O lembrete de renovação pelo WhatsApp triplicou minhas vendas de uso contínuo.",
                author: "Dr. Paulo",
                business: "Farmácia Saúde & Vida - SP",
                avatar: "👨‍⚕️"
              },
              {
                quote: "Economizo R$ 3.200/mês desde que parei de depender do iFood para delivery.",
                author: "Marina",
                business: "Drogaria Popular - RJ",
                avatar: "👩‍💼"
              },
              {
                quote: "O Clique e Retire desafogou meu balcão nos horários de pico.",
                author: "Carlos",
                business: "Farmácia Central - MG",
                avatar: "👨‍💼"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="bg-gray-50 border-0 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{testimonial.author}</div>
                      <div className="text-sm text-gray-500">{testimonial.business}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
              Sua farmácia merece a <span className="text-blue-600">melhor tecnologia</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: "Essencial",
                price: "249,90",
                description: "Catálogo Online + PDV + Central de Pedidos",
                icon: Package,
                features: [
                  "Catálogo por categorias",
                  "PDV de Balcão Integrado",
                  "Controle de estoque",
                  "Suporte 7 dias"
                ],
                highlighted: false
              },
              {
                name: "Profissional",
                price: "397,00",
                description: "Gestão de Entregadores + WhatsApp + Financeiro",
                icon: Star,
                badge: "RECOMENDADO",
                features: [
                  "Tudo do Essencial",
                  "Gestão de Entregadores",
                  "WhatsApp Marketing (Recorrência)",
                  "Dashboard Financeiro"
                ],
                highlighted: true
              },
              {
                name: "Empresarial",
                price: "597,00",
                description: "Multi-lojas (Redes de Drogarias) + API",
                icon: Building2,
                features: [
                  "Tudo do Profissional",
                  "Multi-lojas",
                  "API para integrações externas",
                  "Suporte Prioritário 24h"
                ],
                highlighted: false
              }
            ].map((plan, index) => (
              <Card 
                key={index} 
                className={`relative border-2 transition-all duration-300 ${
                  plan.highlighted 
                    ? "border-blue-500 shadow-xl shadow-blue-500/20 scale-105" 
                    : "border-gray-200 hover:border-blue-300 hover:shadow-lg"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}
                <CardContent className="p-6 pt-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <plan.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-3xl font-bold text-gray-900">R$ {plan.price}</span>
                    <span className="text-gray-500">/mês</span>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link to="/signup" className="block">
                    <Button 
                      className={`w-full ${
                        plan.highlighted 
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white" 
                          : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                      }`}
                    >
                      Começar Agora
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* CTA Final */}
          <div className="text-center mt-12">
            <Link to="/signup">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-orange-500/30"
              >
                QUERO TESTAR GRÁTIS POR 7 DIAS
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
              Perguntas <span className="text-blue-600">Frequentes</span>
            </h2>
          </div>

          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {[
                {
                  question: "Como funciona a recorrência de uso contínuo?",
                  answer: "O sistema identifica compras de produtos recorrentes (medicamentos de uso diário, fraldas, vitaminas). Quando o período estimado de uso estiver acabando, envia automaticamente um WhatsApp oferecendo a renovação. É fidelização ética e eficiente."
                },
                {
                  question: "Posso organizar o catálogo por categorias?",
                  answer: "Sim! Você cria as categorias que quiser: Medicamentos, Higiene, Infantil, Dermocosméticos, Perfumaria. O cliente filtra e encontra o que precisa em segundos. Tudo com fotos e descrições."
                },
                {
                  question: "Como funciona o Clique e Retire?",
                  answer: "O cliente faz o pedido pelo site ou WhatsApp e escolhe \"Retirar na Loja\". Você recebe o pedido, separa o produto e avisa quando estiver pronto. O cliente passa apenas para pegar. Ideal para farmácias de manipulação!"
                }
              ].map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`faq-${index}`}
                  className="bg-gray-50 rounded-xl px-6 border-0"
                >
                  <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-blue-400 font-bold text-lg mb-2">Mostralo.com.br</p>
            <p className="text-gray-400 text-sm mb-6">
              Tecnologia para a saúde do seu negócio.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <Link to="/" className="hover:text-white transition-colors">Início</Link>
              <Link to="/funcionalidades" className="hover:text-white transition-colors">Funcionalidades</Link>
              <Link to="/suporte" className="hover:text-white transition-colors">Suporte</Link>
              <Link to="/termos" className="hover:text-white transition-colors">Termos</Link>
              <Link to="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Lead Button */}
      <WhatsAppLeadButton />
    </div>
  );
};

export default NichoFarmaciasPage;
