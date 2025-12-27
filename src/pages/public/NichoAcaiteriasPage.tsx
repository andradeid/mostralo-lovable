import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { usePageSEO } from '@/hooks/useSEO';
import { WhatsAppLeadButton } from '@/components/leads/WhatsAppLeadButton';
import { 
  Grape, 
  Cherry, 
  Banana,
  Droplets,
  Monitor, 
  Tablet, 
  Smartphone,
  Zap,
  Sun,
  DollarSign,
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
  Star,
  Quote,
  TrendingUp,
  Store,
  MessageSquare,
  ShoppingBag
} from 'lucide-react';

const NichoAcaiteriasPage: React.FC = () => {
  usePageSEO({
    title: 'Mostralo para Açaiterias | Cardápio Digital, Totem e Delivery sem Taxas',
    description: 'Sistema completo para açaiterias: montador de copo visual, totem de autoatendimento, KDS e delivery sem taxas. Elimine filas e aumente seu lucro.',
    keywords: 'açaí, açaiteria, cardápio digital açaí, totem açaiteria, delivery açaí, sistema açaí, montador de copo',
    url: 'https://mostralo.com.br/nicho-acaiterias'
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 px-4 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-orange-950/20" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto max-w-6xl relative z-10">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm font-medium">
              <Grape className="w-4 h-4" />
              Para Açaiterias - Loja Física & Delivery
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-center mb-6 leading-tight">
            Transforme sua Açaiteria em uma{' '}
            <span className="bg-gradient-to-r from-violet-400 to-orange-400 bg-clip-text text-transparent">
              máquina de vendas
            </span>
            , do balcão ao delivery.
          </h1>

          <p className="text-lg md:text-xl text-zinc-400 text-center max-w-3xl mx-auto mb-8">
            O Mostralo é o ecossistema All-in-One que organiza seus adicionais, 
            elimina filas com autoatendimento e acaba com as taxas abusivas dos aplicativos.
          </p>

          {/* CTA Button with orange glow */}
          <div className="flex justify-center mb-10">
            <Link to="/signup">
              <Button 
                size="lg" 
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300 animate-pulse"
              >
                QUERO MODERNIZAR MINHA AÇAITERIA
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {[
              { icon: DollarSign, text: 'Taxa 0%' },
              { icon: Grape, text: 'Montador de Copo' },
              { icon: Tablet, text: 'Totem' },
              { icon: Monitor, text: 'KDS Integrado' }
            ].map((badge, index) => (
              <div key={index} className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-full">
                <badge.icon className="w-4 h-4 text-violet-400" />
                <span className="text-sm text-zinc-300">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 md:py-20 px-4 bg-zinc-900/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Muitos adicionais? Pouco tempo?{' '}
              <span className="text-violet-400">O Mostralo organiza tudo.</span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              O segredo de uma açaiteria lucrativa é o giro rápido e o erro zero nos acompanhamentos. 
              Se você ainda perde tempo anotando pedidos manualmente ou pagando 25% de taxa pro iFood, 
              sua margem está derretendo.
            </p>
          </div>

          {/* Solutions Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Grape,
                title: 'Montador de Copo Intuitivo',
                description: 'O cliente escolhe o tamanho, as camadas e os adicionais (leite em pó, frutas, caldas) de forma visual. O pedido chega detalhado e sem erros na produção.',
                color: 'violet'
              },
              {
                icon: Tablet,
                title: 'Totem de Autoatendimento',
                subtitle: 'O Fim das Filas',
                description: 'O cliente pede e paga sozinho no totem. Ideal para horários de pico em lojas físicas. Menos custo com atendentes, mais agilidade.',
                color: 'orange'
              },
              {
                icon: Monitor,
                title: 'PDV Touch para Balcão',
                description: 'Vendas presenciais em 2 toques. Integração total com a impressora da copa para montagem imediata.',
                color: 'violet'
              }
            ].map((solution, index) => (
              <Card 
                key={index} 
                className={`bg-zinc-900 border-zinc-800 hover:border-${solution.color === 'violet' ? 'violet' : 'orange'}-500/50 transition-all duration-300 group`}
              >
                <CardHeader>
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${solution.color === 'violet' ? 'from-violet-500/20 to-violet-600/10' : 'from-orange-500/20 to-orange-600/10'} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <solution.icon className={`w-7 h-7 ${solution.color === 'violet' ? 'text-violet-400' : 'text-orange-400'}`} />
                  </div>
                  <CardTitle className="text-white text-xl">
                    {solution.title}
                    {solution.subtitle && (
                      <span className="block text-sm text-orange-400 font-normal mt-1">
                        {solution.subtitle}
                      </span>
                    )}
                  </CardTitle>
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
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Fidelize o cliente que{' '}
              <span className="text-violet-400">ama Açaí</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Sun,
                title: 'WhatsApp Marketing',
                subtitle: 'O Lembrete do Calor',
                description: 'Fez sol? O Mostralo avisa! Dispare promoções automáticas para seus clientes nos dias mais quentes e veja sua loja lotar.',
                stat: '+45%',
                statLabel: 'vendas em dias quentes'
              },
              {
                icon: DollarSign,
                title: 'Taxa Zero = Mais Lucro',
                description: 'Pare de dar 1 de cada 4 copos de açaí para os aplicativos. Com o Mostralo, o faturamento do seu delivery é 100% seu.',
                stat: '100%',
                statLabel: 'seu lucro'
              },
              {
                icon: Monitor,
                title: 'KDS - Monitor de Preparo',
                description: 'Sua equipe visualiza os pedidos por ordem de chegada em uma tela, com cores que indicam o tempo de espera. Organização máxima para não derreter o produto.',
                stat: '0',
                statLabel: 'produtos derretidos'
              }
            ].map((feature, index) => (
              <Card key={index} className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-800 hover:border-violet-500/30 transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                      {feature.subtitle && (
                        <span className="text-sm text-orange-400">{feature.subtitle}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-zinc-400 mb-4">{feature.description}</p>
                  <div className="flex items-baseline gap-2 pt-4 border-t border-zinc-800">
                    <span className="text-3xl font-black text-violet-400">{feature.stat}</span>
                    <span className="text-sm text-zinc-500">{feature.statLabel}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Phygital Section */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-br from-violet-950/30 via-zinc-900 to-orange-950/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Loja Física + Delivery ={' '}
              <span className="bg-gradient-to-r from-violet-400 to-orange-400 bg-clip-text text-transparent">
                Experiência Completa
              </span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              O Mostralo integra sua loja física com o delivery em uma única plataforma. 
              Totem no balcão, pedidos via WhatsApp e gestão completa em um só lugar.
            </p>
          </div>

          {/* Phygital Flow */}
          <div className="grid md:grid-cols-3 gap-6 md:gap-4">
            {[
              {
                icon: Tablet,
                title: 'TOTEM',
                subtitle: 'Balcão Autoatendimento',
                description: 'Cliente pede e paga sozinho'
              },
              {
                icon: MessageSquare,
                title: 'WHATSAPP',
                subtitle: 'Delivery Automático',
                description: 'Pedidos 24h sem atendente'
              },
              {
                icon: Store,
                title: 'PDV',
                subtitle: 'Gestão Unificada',
                description: 'Tudo em um só painel'
              }
            ].map((step, index) => (
              <div key={index} className="relative">
                <Card className="bg-zinc-900 border-violet-500/30 hover:border-violet-400/50 transition-all">
                  <CardContent className="pt-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/30 to-orange-500/20 flex items-center justify-center mx-auto mb-4">
                      <step.icon className="w-8 h-8 text-violet-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">{step.title}</h3>
                    <p className="text-orange-400 text-sm mb-2">{step.subtitle}</p>
                    <p className="text-zinc-500 text-sm">{step.description}</p>
                  </CardContent>
                </Card>
                {index < 2 && (
                  <div className="hidden md:flex absolute top-1/2 -right-5 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-violet-500/50" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-center text-violet-400 mt-8 font-medium">
            Tudo conectado em tempo real
          </p>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Troque as taxas do iFood pelo seu{' '}
              <span className="text-orange-400">próximo investimento</span>
            </h2>
          </div>

          {/* ROI Calculator Box */}
          <Card className="bg-zinc-900 border-violet-500/30 overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="space-y-4">
                {/* With Apps */}
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Grape className="w-5 h-5 text-red-400" />
                    <span className="text-zinc-300 font-medium">Faturamento Mensal:</span>
                    <span className="text-white font-bold ml-auto">R$ 15.000,00</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-400">
                    <span className="text-2xl">❌</span>
                    <span>Taxas Aplicativos (25%):</span>
                    <span className="font-bold ml-auto">- R$ 3.750,00</span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="w-px h-8 bg-zinc-700" />
                </div>

                {/* With Mostralo */}
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Grape className="w-5 h-5 text-emerald-400" />
                    <span className="text-zinc-300 font-medium">Faturamento com Mostralo:</span>
                    <span className="text-white font-bold ml-auto">R$ 15.000,00</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400 mb-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Taxas por pedido:</span>
                    <span className="font-bold ml-auto">R$ 0,00</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Mensalidade Profissional:</span>
                    <span className="font-bold ml-auto">R$ 397,00</span>
                  </div>
                </div>

                {/* Results */}
                <div className="p-6 rounded-xl bg-gradient-to-r from-violet-500/20 to-orange-500/20 border border-violet-500/30">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="text-center md:text-left">
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                        <TrendingUp className="w-5 h-5 text-violet-400" />
                        <span className="text-zinc-400">Lucro Extra Mensal:</span>
                      </div>
                      <span className="text-3xl font-black text-violet-400">R$ 3.353,00</span>
                    </div>
                    <div className="text-center md:text-right">
                      <div className="flex items-center justify-center md:justify-end gap-2 mb-1">
                        <Star className="w-5 h-5 text-orange-400" />
                        <span className="text-zinc-400">Economia Anual:</span>
                      </div>
                      <span className="text-3xl font-black text-orange-400">R$ 40.236,00</span>
                    </div>
                  </div>
                </div>

                <p className="text-center text-violet-300 font-medium pt-2">
                  💰 Dinheiro direto para o seu bolso.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-20 px-4 bg-zinc-900/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Açaiterias que já{' '}
              <span className="text-violet-400">faturam mais</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: 'O totem zerou a fila no horário de pico. Meus clientes adoram!',
                author: 'Fernanda',
                business: 'Açaí Tropical - SP',
                avatar: '🍇'
              },
              {
                quote: 'Economizo R$ 4.200/mês desde que parei de depender do iFood.',
                author: 'Marcos',
                business: 'Açaí da Praia - RJ',
                avatar: '🏖️'
              },
              {
                quote: 'O montador de copo eliminou os erros de acompanhamentos.',
                author: 'Juliana',
                business: 'Açaí Power - MG',
                avatar: '💪'
              }
            ].map((testimonial, index) => (
              <Card key={index} className="bg-zinc-900 border-zinc-800 hover:border-violet-500/30 transition-all">
                <CardContent className="pt-6">
                  <Quote className="w-8 h-8 text-violet-500/30 mb-4" />
                  <p className="text-zinc-300 mb-6 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500/30 to-orange-500/20 flex items-center justify-center text-2xl">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{testimonial.author}</p>
                      <p className="text-violet-400 text-sm">{testimonial.business}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Pronto para levar sua açaiteria para o{' '}
              <span className="text-violet-400">próximo nível</span>?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Essencial */}
            <Card className="bg-zinc-900 border-zinc-800 hover:border-violet-500/30 transition-all">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-6 h-6 text-zinc-400" />
                </div>
                <CardTitle className="text-white text-xl">Essencial</CardTitle>
                <p className="text-zinc-500 text-sm">Cardápio Digital + PDV + Impressão</p>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">R$ 249</span>
                  <span className="text-zinc-500">,90/mês</span>
                </div>
                <ul className="space-y-3 text-left mb-6">
                  {[
                    'Montador de Copo Visual',
                    'Impressão térmica automática',
                    'Gestão de pedidos',
                    'Suporte 7 dias'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-zinc-400">
                      <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button variant="outline" className="w-full border-zinc-700 text-white hover:bg-zinc-800">
                    Começar
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Profissional - Highlighted */}
            <Card className="bg-gradient-to-b from-violet-950/50 to-zinc-900 border-violet-500/50 relative scale-105 shadow-[0_0_40px_rgba(124,58,237,0.2)]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1 bg-gradient-to-r from-violet-500 to-orange-500 text-white text-sm font-bold rounded-full">
                  RECOMENDADO
                </span>
              </div>
              <CardHeader className="text-center pb-4 pt-8">
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-violet-400" />
                </div>
                <CardTitle className="text-white text-xl">Profissional</CardTitle>
                <p className="text-violet-400 text-sm">Totem + KDS + WhatsApp Marketing</p>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">R$ 397</span>
                  <span className="text-zinc-500">,00/mês</span>
                </div>
                <ul className="space-y-3 text-left mb-6">
                  {[
                    'Tudo do Essencial',
                    'Totem de Autoatendimento',
                    'KDS (Monitor de Preparo)',
                    'WhatsApp Marketing Automático'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                    Escolher Profissional
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Empresarial */}
            <Card className="bg-zinc-900 border-zinc-800 hover:border-violet-500/30 transition-all">
              <CardHeader className="text-center pb-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-zinc-400" />
                </div>
                <CardTitle className="text-white text-xl">Empresarial</CardTitle>
                <p className="text-zinc-500 text-sm">Para franquias e redes multi-lojas</p>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">R$ 597</span>
                  <span className="text-zinc-500">,00/mês</span>
                </div>
                <ul className="space-y-3 text-left mb-6">
                  {[
                    'Tudo do Profissional',
                    'Multi-lojas',
                    'API completa',
                    'Suporte Prioritário 24h'
                  ].map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-zinc-400">
                      <CheckCircle2 className="w-4 h-4 text-violet-400 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button variant="outline" className="w-full border-zinc-700 text-white hover:bg-zinc-800">
                    Falar com Consultor
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Final CTA */}
          <div className="text-center mt-12">
            <Link to="/signup">
              <Button 
                size="lg" 
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all"
              >
                QUERO TESTAR GRÁTIS POR 7 DIAS
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 px-4 bg-zinc-900/50">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Perguntas <span className="text-violet-400">Frequentes</span>
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-zinc-900 border border-zinc-800 rounded-xl px-6">
              <AccordionTrigger className="text-white hover:text-violet-400 text-left">
                Como funciona o montador de copo?
              </AccordionTrigger>
              <AccordionContent className="text-zinc-400">
                O cliente escolhe o tamanho do copo, as camadas de açaí e todos os adicionais 
                (leite em pó, granola, frutas, caldas) de forma visual e intuitiva. O pedido 
                chega detalhado para a copa, eliminando erros de anotação.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-zinc-900 border border-zinc-800 rounded-xl px-6">
              <AccordionTrigger className="text-white hover:text-violet-400 text-left">
                O totem funciona sem internet?
              </AccordionTrigger>
              <AccordionContent className="text-zinc-400">
                Sim! O Mostralo funciona offline. Os pedidos são sincronizados automaticamente 
                quando a conexão voltar. Sua operação nunca para.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-zinc-900 border border-zinc-800 rounded-xl px-6">
              <AccordionTrigger className="text-white hover:text-violet-400 text-left">
                Como o sistema avisa sobre dias quentes?
              </AccordionTrigger>
              <AccordionContent className="text-zinc-400">
                O WhatsApp Marketing integrado permite criar campanhas automáticas baseadas em gatilhos. 
                Você pode programar promoções para dias específicos ou disparar manualmente quando 
                o sol aparecer.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-zinc-800">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-xl font-bold mb-2">
              <span className="bg-gradient-to-r from-violet-400 to-orange-400 bg-clip-text text-transparent">
                Mostralo.com.br
              </span>
            </p>
            <p className="text-zinc-500 mb-6">
              Sua marca. Seu açaí. Seu lucro.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
              <Link to="/" className="hover:text-violet-400 transition-colors">Início</Link>
              <Link to="/#funcionalidades" className="hover:text-violet-400 transition-colors">Funcionalidades</Link>
              <Link to="/suporte" className="hover:text-violet-400 transition-colors">Suporte</Link>
              <Link to="/termos-de-uso" className="hover:text-violet-400 transition-colors">Termos</Link>
              <Link to="/privacidade" className="hover:text-violet-400 transition-colors">Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* WhatsApp Lead Button */}
      <WhatsAppLeadButton />
    </div>
  );
};

export default NichoAcaiteriasPage;
