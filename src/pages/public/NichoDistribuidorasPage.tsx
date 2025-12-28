import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Beer, 
  Droplets, 
  Bike, 
  MapPin, 
  Timer, 
  Tablet, 
  Smartphone, 
  DollarSign, 
  BarChart3, 
  Calendar,
  Snowflake,
  Check,
  X,
  Star,
  ArrowRight,
  QrCode,
  Zap,
  TrendingUp,
  RefreshCw,
  Shield,
  Clock,
  Users
} from "lucide-react";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { usePageSEO } from "@/hooks/useSEO";

const NichoDistribuidorasPage = () => {
  usePageSEO({
    title: "Mostralo para Distribuidoras de Bebidas | Sistema Completo com GPS",
    description: "Sistema All-in-One para distribuidoras de bebidas, depósitos e adegas. Delivery com GPS, PDV ultra-rápido, WhatsApp Marketing e taxa zero. Economize R$ 85.000/ano.",
    keywords: "sistema distribuidora bebidas, delivery bebidas GPS, PDV distribuidora, cardápio digital bebidas, gestão entregadores, app motoboy",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const solutions = [
    {
      icon: MapPin,
      title: "Delivery Inteligente por Mapa",
      description: "Defina taxas de entrega por distância ou bairros vizinhos. Bloqueie áreas não atendidas e calcule o frete automático. O cliente pede, o sistema calcula, você só entrega."
    },
    {
      icon: Bike,
      title: "App do Entregador com GPS",
      description: "Rastreie seus motoboys em tempo real. Dê segurança ao cliente enviando o link de rastreio e saiba exatamente quanto cada entregador deve prestar de contas."
    },
    {
      icon: Zap,
      title: "PDV Ultra-Rápido de Balcão",
      description: "Venda um pack de cerveja em 2 toques. Integração total com estoque e financeiro para que o balcão nunca pare, mesmo em dias de pico (sexta e sábado)."
    }
  ];

  const benefits = [
    {
      icon: Calendar,
      title: "WhatsApp Marketing - O Gatilho do FDS",
      description: "'Sextou com oferta!' O Mostralo envia o link do seu catálogo automaticamente para seus clientes fiéis. Crie picos de venda nos momentos certos sem esforço manual.",
      stat: "+80%",
      statLabel: "vendas sexta/sábado"
    },
    {
      icon: RefreshCw,
      title: "Recorrência de Gás e Água",
      description: "Se você também vende gás ou água, o sistema identifica o tempo médio de consumo e avisa seu cliente que está na hora de pedir um novo galão ou botijão.",
      stat: "+40%",
      statLabel: "recorrência"
    },
    {
      icon: BarChart3,
      title: "Gestão Financeira e Curva ABC",
      description: "Saiba quais rótulos dão lucro e quais só ocupam espaço no freezer. Controle seu fluxo de caixa e saiba centavo por centavo o seu lucro real.",
      stat: "100%",
      statLabel: "controle"
    }
  ];

  const testimonials = [
    {
      name: "Fernando",
      business: "Distribuidora Gelada - SP",
      text: "O GPS dos entregadores mudou tudo. Sei exatamente quem está com qual pedido e quanto dinheiro tem na rua."
    },
    {
      name: "Marcos",
      business: "Depósito do Marcos - MG",
      text: "O WhatsApp automático na sexta-feira é sucesso. Os clientes já esperam a mensagem e pedem antes de eu enviar."
    },
    {
      name: "Ricardo",
      business: "Adega Central - RJ",
      text: "Saí do iFood e economizo R$ 7.000/mês. Esse dinheiro virou estoque extra e uma moto nova pro motoboy."
    }
  ];

  const plans = [
    {
      name: "Essencial",
      price: "249,90",
      description: "Cardápio Digital + PDV + Central de Pedidos",
      features: [
        "Catálogo digital por categorias",
        "PDV de balcão ultra-rápido",
        "Central de pedidos unificada",
        "Suporte 7 dias"
      ],
      highlighted: false
    },
    {
      name: "Profissional",
      price: "397,00",
      description: "Gestão de Entregadores + WhatsApp Marketing + GPS em tempo real",
      features: [
        "Tudo do Essencial",
        "App do Entregador com GPS",
        "WhatsApp Marketing 'Gatilho do FDS'",
        "Mapa de entregas por bairro",
        "Curva ABC de produtos"
      ],
      highlighted: true,
      badge: "O MAIS INDICADO"
    },
    {
      name: "Empresarial",
      price: "597,00",
      description: "Multi-lojas e integrações avançadas",
      features: [
        "Tudo do Profissional",
        "Multi-lojas",
        "API completa",
        "Recorrência Gás/Água",
        "Suporte Prioritário 24h"
      ],
      highlighted: false
    }
  ];

  const faqs = [
    {
      question: "Como funciona o GPS dos entregadores?",
      answer: "Cada entregador baixa o app do Mostralo e fica rastreável em tempo real. Você vê a posição de cada motoboy, quanto tempo falta pra entregar e quanto dinheiro ele já arrecadou. O cliente também pode acompanhar a entrega via link de rastreio."
    },
    {
      question: "Consigo definir taxas diferentes por bairro?",
      answer: "Sim! O Mostralo permite configurar taxas de entrega por distância (ex: até 3km grátis, acima cobra R$ X por km) ou por bairros específicos. Você também pode bloquear áreas não atendidas para evitar pedidos impossíveis de entregar."
    },
    {
      question: "Funciona para venda de gás e água também?",
      answer: "Perfeitamente! O sistema identifica o tempo médio de consumo de cada cliente (ex: galão de água a cada 15 dias, botijão a cada 30 dias) e dispara lembretes automáticos via WhatsApp. Você vende mais sem precisar ligar pra ninguém."
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-orange-500/10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-sky-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-400 text-sm font-medium mb-8">
              <Beer className="w-4 h-4" />
              Para Distribuidoras de Bebidas, Depósitos e Adegas
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Não deixe o seu lucro{" "}
              <span className="bg-gradient-to-r from-orange-500 to-sky-400 bg-clip-text text-transparent">
                "esquentar"
              </span>
              . Transforme sua distribuidora em uma{" "}
              <span className="bg-gradient-to-r from-sky-400 to-orange-500 bg-clip-text text-transparent">
                máquina de vendas
              </span>
              .
            </h1>

            {/* Sub-headline */}
            <p className="text-xl text-zinc-400 mb-10 max-w-3xl mx-auto">
              O Mostralo é o ecossistema All-in-One que une seu PDV de balcão ao delivery ultra-rápido. 
              Taxa zero por pedido, gestão de entregadores via GPS e automação de vendas por WhatsApp.
            </p>

            {/* CTA */}
            <Link to="/signup">
              <Button 
                size="lg" 
                className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300 hover:scale-105"
              >
                MODERNIZAR MINHA DISTRIBUIDORA
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-4 mt-12">
              {[
                { icon: DollarSign, text: "Taxa 0%" },
                { icon: MapPin, text: "Mapa de Entregas" },
                { icon: Bike, text: "GPS Entregadores" },
                { icon: BarChart3, text: "Curva ABC" }
              ].map((badge, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-sm"
                >
                  <badge.icon className="w-4 h-4 text-sky-400" />
                  {badge.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-24 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              O cliente quer{" "}
              <span className="text-sky-400">gelada</span>{" "}
              e quer{" "}
              <span className="text-orange-500">agora</span>
              . Você está pronto?
            </h2>
            <p className="text-xl text-zinc-400">
              Na distribuidora, quem entrega primeiro ganha a fidelidade. Mas se você perde tempo 
              no telefone ou paga 25% de taxa pro iFood, sua margem morre no gelo. O Mostralo 
              organiza sua logística e protege seu faturamento.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {solutions.map((solution, index) => (
              <Card 
                key={index}
                className="bg-zinc-900 border-zinc-800 hover:border-sky-500/50 transition-all duration-300 group"
              >
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <solution.icon className="w-8 h-8 text-sky-400" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-100 mb-4">{solution.title}</h3>
                  <p className="text-zinc-400">{solution.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Inteligência de Vendas:{" "}
              <span className="bg-gradient-to-r from-orange-500 to-sky-400 bg-clip-text text-transparent">
                O seu Vendedor 24h
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {benefits.map((benefit, index) => (
              <Card 
                key={index}
                className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 group overflow-hidden"
              >
                <CardContent className="p-8 relative">
                  <div className="absolute top-4 right-4 text-right">
                    <div className="text-3xl font-bold text-sky-400">{benefit.stat}</div>
                    <div className="text-xs text-zinc-500">{benefit.statLabel}</div>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <benefit.icon className="w-7 h-7 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-100 mb-4">{benefit.title}</h3>
                  <p className="text-zinc-400 text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Phygital Section */}
      <section className="py-24 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              <span className="text-sky-400">QR Code</span> no balcão:{" "}
              <span className="text-orange-500">pega e leva</span> sem esperar
            </h2>
            <p className="text-xl text-zinc-400">
              Para quem só quer chegar, pegar o pack e sair, o QR Code agiliza tudo. 
              O cliente escaneia, escolhe os produtos, paga no celular e só retira no balcão. 
              Menos fila, mais rotatividade.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Channels */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[
                { icon: QrCode, title: "QR CODE", subtitle: "Pega e leva sem fila", color: "sky" },
                { icon: Tablet, title: "BALCÃO", subtitle: "PDV ultra-rápido", color: "orange" },
                { icon: Bike, title: "DELIVERY", subtitle: "GPS em tempo real", color: "sky" }
              ].map((channel, index) => (
                <div 
                  key={index}
                  className={`p-6 rounded-2xl bg-zinc-900 border ${channel.color === 'sky' ? 'border-sky-500/30' : 'border-orange-500/30'} text-center`}
                >
                  <div className={`w-16 h-16 mx-auto rounded-xl ${channel.color === 'sky' ? 'bg-sky-500/20' : 'bg-orange-500/20'} flex items-center justify-center mb-4`}>
                    <channel.icon className={`w-8 h-8 ${channel.color === 'sky' ? 'text-sky-400' : 'text-orange-500'}`} />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{channel.title}</h3>
                  <p className="text-zinc-400 text-sm">{channel.subtitle}</p>
                </div>
              ))}
            </div>

            {/* Connector Lines */}
            <div className="flex justify-center mb-8">
              <div className="w-1 h-12 bg-gradient-to-b from-sky-500/50 to-orange-500/50 rounded-full" />
            </div>

            {/* Dashboard */}
            <div className="p-8 rounded-2xl bg-gradient-to-br from-sky-500/10 to-orange-500/10 border border-sky-500/20 text-center">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-sky-500/30 to-orange-500/30 flex items-center justify-center mb-4">
                <BarChart3 className="w-10 h-10 text-sky-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">CONTROLE TOTAL</h3>
              <p className="text-zinc-400">Entregadores + Caixa + Curva ABC</p>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Pare de dar{" "}
              <span className="text-orange-500">"goles"</span>{" "}
              no seu lucro para os grandes apps
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
              <CardContent className="p-0">
                {/* App Terceiro */}
                <div className="p-8 border-b border-zinc-800">
                  <div className="flex items-center gap-3 mb-6">
                    <Beer className="w-6 h-6 text-zinc-400" />
                    <h3 className="text-lg font-semibold text-zinc-300">
                      Faturamento via App Terceiro (R$ 30.000/mês)
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-zinc-400">
                      <span>Faturamento mensal:</span>
                      <span>R$ 30.000,00</span>
                    </div>
                    <div className="flex justify-between text-red-400">
                      <span className="flex items-center gap-2">
                        <X className="w-4 h-4" />
                        Taxa App (25%):
                      </span>
                      <span>- R$ 7.500,00</span>
                    </div>
                    <div className="flex justify-between text-zinc-300 font-semibold pt-3 border-t border-zinc-800">
                      <span>Lucro líquido:</span>
                      <span>R$ 22.500,00</span>
                    </div>
                  </div>
                </div>

                {/* Mostralo */}
                <div className="p-8 bg-gradient-to-br from-sky-500/5 to-orange-500/5">
                  <div className="flex items-center gap-3 mb-6">
                    <Beer className="w-6 h-6 text-sky-400" />
                    <h3 className="text-lg font-semibold text-zinc-100">
                      Faturamento via Mostralo (R$ 30.000/mês)
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-zinc-400">
                      <span>Faturamento mensal:</span>
                      <span>R$ 30.000,00</span>
                    </div>
                    <div className="flex justify-between text-green-400">
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Taxa Mostralo:
                      </span>
                      <span>R$ 0,00</span>
                    </div>
                    <div className="flex justify-between text-green-400">
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Mensalidade Profissional:
                      </span>
                      <span>- R$ 397,00</span>
                    </div>
                    <div className="flex justify-between text-zinc-100 font-semibold pt-3 border-t border-zinc-700">
                      <span>Lucro líquido:</span>
                      <span>R$ 29.603,00</span>
                    </div>
                  </div>
                </div>

                {/* Result */}
                <div className="p-8 bg-gradient-to-r from-orange-500/20 to-sky-500/20 border-t border-orange-500/30">
                  <div className="grid md:grid-cols-2 gap-6 text-center">
                    <div>
                      <div className="text-3xl font-bold text-orange-500 mb-1">R$ 7.103,00</div>
                      <div className="text-zinc-400 text-sm">LUCRO EXTRA MENSAL</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-sky-400 mb-1">R$ 85.236,00</div>
                      <div className="text-zinc-400 text-sm">ECONOMIA ANUAL</div>
                    </div>
                  </div>
                  <p className="text-center text-zinc-300 mt-6 text-sm">
                    💡 Lucro líquido voltando para o seu bolso!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Distribuidoras que já{" "}
              <span className="bg-gradient-to-r from-sky-400 to-orange-500 bg-clip-text text-transparent">
                dominam a região
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index}
                className="bg-zinc-900 border-zinc-800 hover:border-sky-500/30 transition-all duration-300"
              >
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-orange-500 text-orange-500" />
                    ))}
                  </div>
                  <p className="text-zinc-300 mb-6 italic">"{testimonial.text}"</p>
                  <div>
                    <div className="font-semibold text-zinc-100">{testimonial.name}</div>
                    <div className="text-sm text-zinc-500">{testimonial.business}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Pronto para ser a maior{" "}
              <span className="text-sky-400">referência</span>{" "}
              em bebidas da região?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index}
                className={`relative overflow-hidden transition-all duration-300 ${
                  plan.highlighted 
                    ? 'bg-gradient-to-br from-sky-500/10 to-orange-500/10 border-sky-500/50 scale-105' 
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {plan.badge && (
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-xs font-bold">
                      {plan.badge}
                    </span>
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-zinc-100 mb-2">{plan.name}</h3>
                  <p className="text-zinc-400 text-sm mb-6">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-zinc-100">R$ {plan.price}</span>
                    <span className="text-zinc-500">/mês</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-3 text-zinc-300">
                        <Check className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/signup" className="block">
                    <Button 
                      className={`w-full ${
                        plan.highlighted 
                          ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]' 
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'
                      }`}
                    >
                      Começar agora
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
                className="bg-gradient-to-r from-orange-500 to-sky-500 hover:from-orange-600 hover:to-sky-600 text-white text-lg px-10 py-6 rounded-xl shadow-[0_0_40px_rgba(56,189,248,0.3)] hover:shadow-[0_0_60px_rgba(56,189,248,0.5)] transition-all duration-300"
              >
                COMEÇAR AGORA - TESTE GRÁTIS
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-zinc-900/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Perguntas Frequentes
            </h2>

            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 overflow-hidden"
                >
                  <AccordionTrigger className="text-left text-zinc-100 hover:text-sky-400 py-6">
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
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Beer className="w-6 h-6 text-sky-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-sky-400 bg-clip-text text-transparent">
                Mostralo.com.br
              </span>
            </div>
            <p className="text-zinc-500 mb-6">
              Sua marca. Sua logística. Seu lucro.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
              <Link to="/" className="hover:text-sky-400 transition-colors">Início</Link>
              <Link to="/funcionalidades" className="hover:text-sky-400 transition-colors">Funcionalidades</Link>
              <Link to="/suporte" className="hover:text-sky-400 transition-colors">Suporte</Link>
              <Link to="/termos" className="hover:text-sky-400 transition-colors">Termos</Link>
              <Link to="/privacidade" className="hover:text-sky-400 transition-colors">Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Lead Button */}
      <WhatsAppLeadButton />
    </div>
  );
};

export default NichoDistribuidorasPage;
