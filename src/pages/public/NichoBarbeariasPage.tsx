import { usePageSEO } from '@/hooks/useSEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { 
  Scissors, 
  Beer, 
  Calendar, 
  Wallet,
  Users, 
  MessageSquare, 
  Clock, 
  Calculator,
  XCircle,
  CheckCircle,
  Smartphone,
  Star,
  ArrowRight,
  Store,
  CreditCard,
  Bell,
  TrendingUp,
  AlertTriangle,
  Gift,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';

// ============ Hero Section ============
const HeroSection = () => (
  <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-zinc-950">
    {/* Background gradient */}
    <div className="absolute inset-0 bg-gradient-to-br from-orange-950/30 via-zinc-950 to-zinc-950" />
    
    {/* Decorative elements */}
    <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" />
    <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl" />
    
    <div className="container mx-auto px-4 py-20 relative z-10">
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <Badge className="mb-6 bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-2 text-sm">
          <Scissors className="w-4 h-4 mr-2" />
          Sistema Completo para Barbearias
        </Badge>
        
        {/* Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          Sua barbearia no bolso do cliente.{' '}
          <span className="text-orange-500">Sua gestão no piloto automático.</span>
        </h1>
        
        {/* Sub-headline */}
        <p className="text-xl md:text-2xl text-zinc-400 mb-8 max-w-3xl mx-auto">
          O único ecossistema que une <strong className="text-white">Agendamento Online</strong>, 
          {' '}<strong className="text-white">Comanda de Bar</strong>, 
          {' '}<strong className="text-white">Venda de Produtos</strong> e 
          {' '}<strong className="text-white">Marketing via WhatsApp</strong> em um só lugar.
        </p>
        
        <p className="text-lg text-orange-400 mb-10">
          Aumente seu faturamento e acabe com os furos na agenda.
        </p>
        
        {/* CTA Principal */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link to="/signup">
            <Button 
              size="lg" 
              className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 animate-pulse"
            >
              <Scissors className="w-5 h-5 mr-2" />
              TRANSFORMAR MINHA BARBEARIA AGORA
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
        
        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 text-zinc-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            <span>Agenda 24h</span>
          </div>
          <div className="flex items-center gap-2">
            <Beer className="w-5 h-5 text-orange-500" />
            <span>Comanda Digital</span>
          </div>
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-orange-500" />
            <span>0% Taxa no PIX</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-orange-500" />
            <span>WhatsApp Automático</span>
          </div>
        </div>
      </div>
    </div>
    
    {/* Bottom fade */}
    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent" />
  </section>
);

// ============ Problems Section ============
const problemCards = [
  {
    icon: XCircle,
    title: 'Agenda Furada',
    description: 'O cliente marca e não aparece (No-show). Você perde tempo, dinheiro e a vaga que poderia ser de outro cliente.',
    color: 'text-red-500'
  },
  {
    icon: Beer,
    title: 'Caos no Bar',
    description: 'Cervejas, pomadas e produtos vendidos que você esquece de cobrar no final. Dinheiro que escoa pelo ralo.',
    color: 'text-amber-500'
  },
  {
    icon: Clock,
    title: 'Perda de Tempo',
    description: 'Horas e horas no WhatsApp confirmando horários manualmente. Tempo que poderia ser usado cortando cabelo.',
    color: 'text-yellow-500'
  },
  {
    icon: Calculator,
    title: 'Cálculo de Comissão',
    description: 'Todo fim de semana é um sofrimento para calcular quanto cada barbeiro deve receber. Planilha, papel, confusão.',
    color: 'text-orange-500'
  }
];

const ProblemsSection = () => (
  <section className="py-20 bg-zinc-950">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <Badge className="mb-4 bg-red-500/20 text-red-400 border-red-500/30">
          <AlertTriangle className="w-4 h-4 mr-2" />
          O Problema
        </Badge>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Você é um <span className="text-orange-500">mestre da tesoura</span>, 
          mas <span className="text-red-500">escravo da gestão?</span>
        </h2>
        <p className="text-xl text-zinc-400">
          Enquanto você deveria estar focado no que faz de melhor, a burocracia consome seu tempo e seu lucro.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {problemCards.map((problem, index) => (
          <Card 
            key={index} 
            className="bg-zinc-900/50 border-zinc-800 hover:border-red-500/50 transition-all duration-300 hover:-translate-y-1"
          >
            <CardContent className="p-6 text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center ${problem.color}`}>
                <problem.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{problem.title}</h3>
              <p className="text-zinc-400 text-sm">{problem.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

// ============ Four Pillars Section ============
const pillars = [
  {
    icon: Calendar,
    title: 'Agenda Inteligente 24h',
    subtitle: 'Zero No-Show',
    features: [
      'Cliente agenda sozinho pelo seu link exclusivo',
      'Lembretes automáticos via WhatsApp',
      'Cobrança de sinal (PIX) para garantir a vaga',
      'Política de cancelamento configurável'
    ],
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-500/10'
  },
  {
    icon: Beer,
    title: 'Bar & Shop (PDV/Totem)',
    subtitle: 'Venda Sem Perder',
    features: [
      'Venda bebidas e produtos sem esforço',
      'Totem de Autoatendimento para o cliente',
      'Comanda Digital da cadeira',
      'Controle de estoque automático'
    ],
    color: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-500/10'
  },
  {
    icon: Calculator,
    title: 'Comissões em 1 Clique',
    subtitle: 'Adeus Planilha',
    features: [
      'Cálculo automático por barbeiro',
      'Serviços + produtos separados',
      'Relatórios prontos em segundos',
      'Histórico completo de ganhos'
    ],
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/10'
  },
  {
    icon: Bell,
    title: '"Lembrete do Cabelo Crescido"',
    subtitle: 'Automação SENTINELA',
    features: [
      'Identifica quem não volta há 20 dias',
      'Envia convite personalizado no WhatsApp',
      'Recupera clientes inativos',
      'Aumenta frequência de visitas'
    ],
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/10'
  }
];

const FourPillarsSection = () => (
  <section className="py-20 bg-zinc-900">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
          <CheckCircle className="w-4 h-4 mr-2" />
          A Solução
        </Badge>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Os 4 Pilares da{' '}
          <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            Barbearia Lucrativa
          </span>
        </h2>
        <p className="text-xl text-zinc-400">
          Recursos integrados que trabalham juntos para maximizar seu faturamento.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {pillars.map((pillar, index) => (
          <Card 
            key={index} 
            className="bg-zinc-950 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-2 overflow-hidden"
          >
            <div className={`h-2 bg-gradient-to-r ${pillar.color}`} />
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl ${pillar.bgColor} flex items-center justify-center`}>
                  <pillar.icon className="w-7 h-7 text-orange-500" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">{pillar.title}</CardTitle>
                  <p className="text-orange-400 text-sm font-medium">{pillar.subtitle}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {pillar.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-zinc-300">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

// ============ Flow Simulator Section ============
const FlowSimulatorSection = () => {
  const [activeTab, setActiveTab] = useState<'agenda' | 'comanda'>('agenda');
  
  const agendaSteps = [
    { step: 1, title: 'Escolher Serviço', desc: 'Corte + Barba', icon: Scissors },
    { step: 2, title: 'Escolher Barbeiro', desc: 'Marcos - 4.9★', icon: Users },
    { step: 3, title: 'Escolher Horário', desc: 'Hoje, 15:30', icon: Clock },
    { step: 4, title: 'Confirmar com PIX', desc: 'R$ 10 de sinal', icon: CreditCard }
  ];
  
  const comandaItems = [
    { name: 'Corte Degradê', price: 45.00, qty: 1 },
    { name: 'Barba Completa', price: 35.00, qty: 1 },
    { name: 'Heineken 600ml', price: 12.00, qty: 2 },
    { name: 'Pomada Matte', price: 45.00, qty: 1 }
  ];
  
  const total = comandaItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  
  return (
    <section className="py-20 bg-zinc-950">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
            <Smartphone className="w-4 h-4 mr-2" />
            Veja na Prática
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Simples Assim, <span className="text-orange-500">Para Você e Para o Cliente</span>
          </h2>
        </div>
        
        {/* Tab buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant={activeTab === 'agenda' ? 'default' : 'outline'}
            onClick={() => setActiveTab('agenda')}
            className={activeTab === 'agenda' 
              ? 'bg-orange-500 hover:bg-orange-600 text-white' 
              : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-orange-500'
            }
          >
            <Calendar className="w-4 h-4 mr-2" />
            Fluxo de Agendamento
          </Button>
          <Button
            variant={activeTab === 'comanda' ? 'default' : 'outline'}
            onClick={() => setActiveTab('comanda')}
            className={activeTab === 'comanda' 
              ? 'bg-orange-500 hover:bg-orange-600 text-white' 
              : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-orange-500'
            }
          >
            <Beer className="w-4 h-4 mr-2" />
            Comanda Digital
          </Button>
        </div>
        
        {/* Simulator content */}
        <div className="max-w-3xl mx-auto">
          {activeTab === 'agenda' ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="border-b border-zinc-800">
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  Agendamento Online - Barbearia do João
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {agendaSteps.map((step, index) => (
                    <div 
                      key={index} 
                      className="bg-zinc-800 rounded-xl p-4 text-center border-2 border-transparent hover:border-orange-500 transition-all cursor-pointer"
                    >
                      <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <step.icon className="w-5 h-5 text-orange-500" />
                      </div>
                      <p className="text-xs text-zinc-500 mb-1">Passo {step.step}</p>
                      <p className="text-white font-semibold text-sm">{step.title}</p>
                      <p className="text-orange-400 text-sm mt-1">{step.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <p className="text-green-400 flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Cliente recebe confirmação automática no WhatsApp!
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="border-b border-zinc-800">
                <CardTitle className="text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-orange-500" />
                  Comanda #127 - Cadeira 3
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {comandaItems.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-500 text-sm font-bold">
                          {item.qty}x
                        </div>
                        <span className="text-white">{item.name}</span>
                      </div>
                      <span className="text-orange-400 font-semibold">
                        R$ {(item.price * item.qty).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-700 flex items-center justify-between">
                  <span className="text-xl text-white font-bold">Total</span>
                  <span className="text-2xl text-orange-500 font-bold">R$ {total.toFixed(2)}</span>
                </div>
                <Button className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-white">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Fechar Conta (PIX, Cartão ou Dinheiro)
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};

// ============ Social Proof & ROI Section ============
const comparisonData = [
  { feature: 'No-shows por semana', manual: '3 a 5 faltas', mostralo: 'Quase zero (sinal PIX)' },
  { feature: 'Tempo confirmando horários', manual: '2+ horas/dia', mostralo: '0 minutos (automático)' },
  { feature: 'Cálculo de comissões', manual: '3+ horas/semana', mostralo: '1 clique' },
  { feature: 'Vendas esquecidas no bar', manual: 'R$ 200-500/mês', mostralo: 'Tudo registrado' },
  { feature: 'Recuperação de clientes', manual: 'Inexistente', mostralo: 'Automático via WhatsApp' },
  { feature: 'Relatórios financeiros', manual: 'Planilha confusa', mostralo: 'Tempo real, visual' }
];

const SocialProofSection = () => (
  <section className="py-20 bg-zinc-900">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">
          <TrendingUp className="w-4 h-4 mr-2" />
          Resultados Reais
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          O <span className="text-orange-500">Retorno do Investimento</span> é Garantido
        </h2>
        
        {/* Quote */}
        <Card className="bg-orange-500/10 border-orange-500/30 mb-12">
          <CardContent className="p-6">
            <p className="text-xl md:text-2xl text-white italic">
              "Um barbeiro que reduz 3 faltas por semana e vende 5 pomadas extras através da nossa 
              automação <span className="text-orange-500 font-bold">já paga o sistema 5 vezes</span>."
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Comparison Table */}
      <div className="max-w-4xl mx-auto">
        <Card className="bg-zinc-950 border-zinc-800 overflow-hidden">
          <div className="grid grid-cols-3 bg-zinc-900 border-b border-zinc-800">
            <div className="p-4 text-center font-semibold text-zinc-400">Aspecto</div>
            <div className="p-4 text-center font-semibold text-red-400 border-x border-zinc-800">
              Agenda Manual / Papel
            </div>
            <div className="p-4 text-center font-semibold text-green-400">
              Ecossistema Mostralo
            </div>
          </div>
          {comparisonData.map((row, index) => (
            <div 
              key={index} 
              className="grid grid-cols-3 border-b border-zinc-800 last:border-0"
            >
              <div className="p-4 text-white font-medium">{row.feature}</div>
              <div className="p-4 text-center text-red-400 border-x border-zinc-800 bg-red-500/5">
                {row.manual}
              </div>
              <div className="p-4 text-center text-green-400 bg-green-500/5">
                {row.mostralo}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  </section>
);

// ============ Testimonials Section ============
const testimonials = [
  {
    name: 'João Silva',
    role: 'Barbearia do João - São Paulo',
    image: '👨‍🦱',
    text: 'Antes eu perdia 4-5 clientes por semana com no-show. Depois do Mostralo, com o sinal PIX, isso caiu pra quase zero. Só isso já me economiza R$ 600/mês.',
    rating: 5
  },
  {
    name: 'Carlos Mendes',
    role: 'Barber House - RJ',
    image: '🧔',
    text: 'O cálculo de comissão era meu pesadelo. Agora em 1 clique tenho tudo pronto. E a comanda do bar? Nunca mais esqueci de cobrar uma cerveja!',
    rating: 5
  },
  {
    name: 'Pedro Costa',
    role: 'Vintage Barber - MG',
    image: '👤',
    text: 'O "lembrete do cabelo crescido" é genial! Meus clientes voltam mais rápido. Aumentei minha frequência média de visitas em 30%.',
    rating: 5
  }
];

const TestimonialsSection = () => (
  <section className="py-20 bg-zinc-950">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
          <Star className="w-4 h-4 mr-2" />
          Depoimentos
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          O Que <span className="text-orange-500">Barbeiros de Sucesso</span> Dizem
        </h2>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {testimonials.map((testimonial, index) => (
          <Card 
            key={index} 
            className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">{testimonial.image}</div>
                <div>
                  <p className="text-white font-semibold">{testimonial.name}</p>
                  <p className="text-zinc-500 text-sm">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-orange-500 text-orange-500" />
                ))}
              </div>
              <p className="text-zinc-300 italic">"{testimonial.text}"</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

// ============ Plans Section ============
const plans = [
  {
    name: 'Essencial',
    price: 97,
    description: 'Para começar a profissionalizar',
    features: [
      'Agenda Online 24h',
      'PDV Básico',
      'Catálogo de Serviços',
      'Controle de Clientes',
      'Relatórios Básicos'
    ],
    highlighted: false,
    cta: 'Começar Agora'
  },
  {
    name: 'Profissional',
    price: 197,
    description: 'O mais escolhido pelas barbearias',
    features: [
      'Tudo do Essencial +',
      'Lembretes WhatsApp Automáticos',
      'Gestão de Comissões',
      'Comandas de Bar',
      'Cobrança de Sinal (PIX)',
      'Automação "Cabelo Crescido"',
      'Relatórios Avançados'
    ],
    highlighted: true,
    cta: 'Escolher Profissional'
  },
  {
    name: 'Empresarial',
    price: null,
    description: 'Para redes e franquias',
    features: [
      'Tudo do Profissional +',
      'Múltiplas Unidades',
      'Gestão Centralizada',
      'Relatórios Consolidados',
      'API para Integrações',
      'Suporte Prioritário',
      'Onboarding Dedicado'
    ],
    highlighted: false,
    cta: 'Falar com Consultor'
  }
];

const PlansSection = () => (
  <section className="py-20 bg-zinc-900">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
          <Gift className="w-4 h-4 mr-2" />
          Planos
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Escolha o Seu <span className="text-orange-500">Nível de Profissionalismo</span>
        </h2>
        <p className="text-zinc-400">
          Todos os planos incluem 7 dias grátis para você testar sem compromisso.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan, index) => (
          <Card 
            key={index} 
            className={`relative overflow-hidden transition-all hover:-translate-y-2 ${
              plan.highlighted 
                ? 'bg-gradient-to-b from-orange-500/20 to-zinc-900 border-orange-500' 
                : 'bg-zinc-950 border-zinc-800'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute top-0 left-0 right-0 bg-orange-500 text-white text-center text-sm py-1 font-semibold">
                MAIS POPULAR
              </div>
            )}
            <CardContent className={`p-6 ${plan.highlighted ? 'pt-10' : ''}`}>
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-zinc-400 text-sm mb-4">{plan.description}</p>
              
              <div className="mb-6">
                {plan.price ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-zinc-500">R$</span>
                    <span className="text-4xl font-bold text-orange-500">{plan.price}</span>
                    <span className="text-zinc-500">/mês</span>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-orange-500">Sob Consulta</p>
                )}
              </div>
              
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-zinc-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Link to="/signup">
                <Button 
                  className={`w-full ${
                    plan.highlighted 
                      ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Final CTA */}
      <div className="max-w-2xl mx-auto text-center mt-16">
        <Link to="/signup">
          <Button 
            size="lg" 
            className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-10 py-6 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
          >
            <Gift className="w-5 h-5 mr-2" />
            QUERO TESTAR GRÁTIS POR 7 DIAS
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
        <p className="text-zinc-500 text-sm mt-4">
          Sem cartão de crédito. Cancele quando quiser.
        </p>
      </div>
    </div>
  </section>
);

// ============ FAQ Section ============
const faqItems = [
  {
    question: 'Preciso de um celular novo para usar o sistema?',
    answer: 'Não! O Mostralo funciona 100% no navegador, tanto no celular quanto no computador. Você pode acessar de qualquer dispositivo com internet.'
  },
  {
    question: 'Como funciona a cobrança de sinal (PIX) do cliente?',
    answer: 'Você define o valor do sinal (ex: R$ 10) e quando o cliente agendar, ele paga esse valor via PIX para confirmar. Se ele faltar, você fica com o sinal. Se ele comparecer, o sinal é descontado do serviço.'
  },
  {
    question: 'Consigo usar em mais de uma cadeira/barbeiro?',
    answer: 'Sim! No plano Profissional você pode cadastrar todos os barbeiros da sua equipe, cada um com sua agenda individual e cálculo de comissão automático.'
  },
  {
    question: 'Como funciona o bar/vendas de produtos?',
    answer: 'Você cadastra os produtos (cervejas, pomadas, etc.) e quando o cliente pedir algo, é só adicionar na comanda digital dele. No final, tudo já está somado para cobrar junto com o serviço.'
  },
  {
    question: 'O cliente precisa baixar algum app?',
    answer: 'Não! O cliente acessa o link de agendamento pelo navegador, escolhe o horário e pronto. Ele recebe a confirmação e lembretes direto no WhatsApp.'
  },
  {
    question: 'Posso testar antes de pagar?',
    answer: 'Sim! Oferecemos 7 dias grátis em todos os planos para você testar todas as funcionalidades sem compromisso e sem precisar colocar cartão de crédito.'
  }
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  return (
    <section className="py-20 bg-zinc-950">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
              <MessageSquare className="w-4 h-4 mr-2" />
              Dúvidas Frequentes
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Perguntas <span className="text-orange-500">Frequentes</span>
            </h2>
          </div>
          
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <Card 
                key={index} 
                className="bg-zinc-900 border-zinc-800 cursor-pointer hover:border-orange-500/50 transition-all"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold pr-4">{item.question}</h3>
                    {openIndex === index ? (
                      <ChevronUp className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                    )}
                  </div>
                  {openIndex === index && (
                    <p className="text-zinc-400 mt-4 pt-4 border-t border-zinc-800">
                      {item.answer}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ============ Footer Section ============
const FooterSection = () => (
  <footer className="py-12 bg-zinc-950 border-t border-zinc-800">
    <div className="container mx-auto px-4 text-center">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Store className="w-8 h-8 text-orange-500" />
        <span className="text-2xl font-bold text-white">Mostralo</span>
      </div>
      <p className="text-zinc-400 mb-6">
        Sua marca. Sua agenda. Seu lucro.
      </p>
      <div className="flex flex-wrap justify-center gap-6 text-zinc-500 text-sm">
        <Link to="/termos" className="hover:text-orange-500 transition-colors">
          Termos de Uso
        </Link>
        <Link to="/privacidade" className="hover:text-orange-500 transition-colors">
          Privacidade
        </Link>
        <Link to="/suporte" className="hover:text-orange-500 transition-colors">
          Suporte
        </Link>
      </div>
      <p className="text-zinc-600 text-sm mt-8">
        © {new Date().getFullYear()} Mostralo. Todos os direitos reservados.
      </p>
    </div>
  </footer>
);

// ============ Main Page Component ============
const NichoBarbeariasPage = () => {
  usePageSEO({
    title: 'Sistema para Barbearias | Agenda Online + Comanda + WhatsApp | Mostralo',
    description: 'Sistema completo para barbearias modernas: agendamento online 24h, comanda de bar digital, cálculo de comissões automático e marketing via WhatsApp. Teste grátis por 7 dias.',
    keywords: 'sistema barbearia, agenda barbearia, software barbershop, gestão barbearia, comanda bar barbearia, sistema agendamento barbearia, controle comissões barbeiro',
    image: 'https://mostralo.com.br/og-barbearia.png'
  });

  return (
    <div className="min-h-screen bg-zinc-950">
      <HeroSection />
      <ProblemsSection />
      <FourPillarsSection />
      <FlowSimulatorSection />
      <SocialProofSection />
      <TestimonialsSection />
      <PlansSection />
      <FAQSection />
      <FooterSection />
    </div>
  );
};

export default NichoBarbeariasPage;
