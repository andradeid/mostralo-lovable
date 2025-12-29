import { usePageSEO } from '@/hooks/useSEO';
import { WhatsAppLeadButton } from '@/components/leads/WhatsAppLeadButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Link } from 'react-router-dom';
import { 
  Dog, 
  Heart, 
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
  ChevronUp,
  ChevronLeft,
  RotateCcw,
  ShoppingBag,
  Package,
  MapPin,
  Truck,
  Scissors,
  Droplets,
  Tablet
} from 'lucide-react';
import { useState } from 'react';
import { format, isBefore, startOfDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// ============ Hero Section ============
const HeroSection = () => (
  <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-zinc-950">
    {/* Background gradient with orange tones */}
    <div className="absolute inset-0 bg-gradient-to-br from-orange-950/30 via-zinc-950 to-zinc-950" />
    
    {/* Decorative elements */}
    <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" />
    <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl" />
    
    {/* Paw prints decorative */}
    <div className="absolute top-32 right-20 text-6xl opacity-10">🐾</div>
    <div className="absolute bottom-40 left-20 text-5xl opacity-10">🐾</div>
    <div className="absolute top-1/3 left-1/4 text-4xl opacity-10">🐾</div>
    
    <div className="container mx-auto px-4 py-20 relative z-10">
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <Badge className="mb-6 bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-2 text-sm">
          <Dog className="w-4 h-4 mr-2" />
          Sistema Completo para Pet Shops
        </Badge>
        
        {/* Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          Não gerencie apenas um Pet Shop.{' '}
          <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 bg-clip-text text-transparent">
            Domine o mercado pet da sua região.
          </span>
        </h1>
        
        {/* Sub-headline */}
        <p className="text-xl md:text-2xl text-zinc-400 mb-8 max-w-3xl mx-auto">
          O único ecossistema que une{' '}
          <strong className="text-white">Agendamento de Banho e Tosa</strong>, 
          {' '}<strong className="text-white">Venda de Ração com Lembrete de Recorrência</strong> e 
          {' '}<strong className="text-white">Gestão de Entregas</strong>. Tudo o que seu Pet Shop precisa para faturar mais.
        </p>
        
        <p className="text-lg text-orange-400 mb-10">
          🐕 Organize o caos e aumente seu faturamento no piloto automático.
        </p>
        
        {/* CTA Principal */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link to="/signup">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 animate-pulse"
            >
              <Dog className="w-5 h-5 mr-2" />
              QUERO MODERNIZAR MEU PET SHOP
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
        
        {/* Mockup preview */}
        <Card className="max-w-md mx-auto bg-zinc-900/80 border-zinc-800 mb-8">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                🐕
              </div>
              <div className="text-left">
                <p className="text-white font-semibold">Thor - Golden Retriever</p>
                <p className="text-zinc-400 text-sm">Próximo banho: Hoje, 14:00</p>
              </div>
            </div>
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3">
              <p className="text-amber-400 text-sm flex items-center gap-2">
                <Bell className="w-4 h-4" />
                ⚠️ A ração do Thor acaba em 2 dias. Enviar lembrete?
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 text-zinc-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            <span>Agenda 24h</span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            <span>Lembrete de Ração</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            <span>GPS Leva e Traz</span>
          </div>
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-orange-500" />
            <span>Comissões Automáticas</span>
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
    title: 'Agenda Confusa',
    description: 'Telefone tocando para marcar banho enquanto você atende no balcão. Horários perdidos e confusão generalizada.',
    color: 'text-red-500'
  },
  {
    icon: ShoppingBag,
    title: 'Esquecimento da Ração',
    description: 'O cliente esquece de comprar a ração e acaba comprando no supermercado por conveniência. Você perde a venda!',
    color: 'text-amber-500'
  },
  {
    icon: Truck,
    title: 'Logística de Leva e Traz',
    description: 'Confusão para organizar as rotas de busca e entrega dos pets. Não sabe onde o motorista está.',
    color: 'text-yellow-500'
  },
  {
    icon: Clock,
    title: 'Faltas (No-show)',
    description: 'Horário de tosa vazio porque a cliente esqueceu de vir. Tempo do tosador desperdiçado.',
    color: 'text-orange-500'
  }
];

const ProblemsSection = () => (
  <section className="py-20 bg-zinc-950">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <Badge className="mb-4 bg-red-500/20 text-red-400 border-red-500/30">
          <AlertTriangle className="w-4 h-4 mr-2" />
          O Desafio de Cuidar de Quem Não Fala
        </Badge>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Você cuida dos pets.{' '}
          <span className="text-orange-500">O Mostralo cuida do seu lucro.</span>
        </h2>
        <p className="text-xl text-zinc-400">
          Chega de perder vendas e tempo. <span className="text-orange-400">Automatize seu Pet Shop.</span>
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {problemCards.map((problem, index) => (
          <Card 
            key={index} 
            className="bg-zinc-900/50 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1"
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
    title: 'Agendamento Online + Lembrete WhatsApp',
    subtitle: 'Menos Faltas, Mais Produtividade',
    features: [
      'Cliente marca o banho sozinho, 24h',
      'Sistema envia lembrete 2h antes',
      'Redução de 80% nas faltas',
      'Agenda do tosador sempre cheia'
    ],
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-500/10'
  },
  {
    icon: Package,
    title: 'Inteligência de Recorrência (Ração)',
    subtitle: 'O Diferencial que Ninguém Tem',
    features: [
      'Sistema calcula consumo do saco',
      'Lembrete 5 dias antes de acabar',
      'Link de compra automático via WhatsApp',
      'Venda garantida no piloto automático'
    ],
    color: 'from-amber-500 to-yellow-500',
    bgColor: 'bg-amber-500/10'
  },
  {
    icon: MapPin,
    title: 'Gestão de Leva e Traz (GPS)',
    subtitle: 'Rotas Organizadas, Cliente Tranquilo',
    features: [
      'Organize rotas de busca e entrega',
      'Saiba onde o motorista está em tempo real',
      'Avise o cliente quando o pet estiver chegando',
      'Fim da confusão logística'
    ],
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500/10'
  },
  {
    icon: Calculator,
    title: 'Comissões de Banho/Tosa',
    subtitle: 'Erro Zero, Paz Total',
    features: [
      'Cálculo automático por tosador',
      'Serviços adicionais separados',
      'Relatórios prontos em segundos',
      'Simples, rápido e sem erros'
    ],
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10'
  }
];

const FourPillarsSection = () => (
  <section className="py-20 bg-zinc-900">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
          <CheckCircle className="w-4 h-4 mr-2" />
          O "Cérebro" do seu Pet Shop
        </Badge>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Os 4 Pilares do{' '}
          <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
            Pet Shop Lucrativo
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

// ============ Pet Profile Section ============
interface Pet {
  nome: string;
  raca: string;
  emoji: string;
  ultimaVacina: string;
  alergias: string[];
  racaoPreferida: string;
  diasParaAcabar: number;
  proximoBanho: string;
}

const demoPet: Pet = {
  nome: 'Thor',
  raca: 'Golden Retriever',
  emoji: '🐕',
  ultimaVacina: '15/10/2024',
  alergias: ['Frango', 'Milho'],
  racaoPreferida: 'Golden Formula - 15kg',
  diasParaAcabar: 5,
  proximoBanho: 'Sexta, 10:00'
};

const PetProfileSection = () => (
  <section className="py-20 bg-zinc-950">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
          <Heart className="w-4 h-4 mr-2" />
          Perfil Completo do Pet
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Conheça cada pet como <span className="text-orange-500">ninguém mais conhece</span>
        </h2>
        <p className="text-zinc-400">
          Cadastro completo com histórico, alergias, vacinas e preferências. Gera confiança total do tutor.
        </p>
      </div>
      
      {/* Pet Profile Card */}
      <div className="max-w-lg mx-auto">
        <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
          <CardHeader className="border-b border-zinc-800 bg-gradient-to-r from-orange-500/10 to-amber-500/10">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center text-4xl">
                {demoPet.emoji}
              </div>
              <div>
                <CardTitle className="text-2xl text-white">{demoPet.nome}</CardTitle>
                <p className="text-zinc-400">{demoPet.raca}</p>
                <div className="flex gap-2 mt-2">
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    Vacinas em dia
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {/* Próximo banho */}
            <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Droplets className="w-5 h-5 text-blue-400" />
                <span className="text-zinc-300">Próximo Banho</span>
              </div>
              <span className="text-white font-semibold">{demoPet.proximoBanho}</span>
            </div>
            
            {/* Última vacina */}
            <div className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-red-400" />
                <span className="text-zinc-300">Última Vacina</span>
              </div>
              <span className="text-white font-semibold">{demoPet.ultimaVacina}</span>
            </div>
            
            {/* Alergias */}
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-semibold">Alergias</span>
              </div>
              <div className="flex gap-2">
                {demoPet.alergias.map((alergia, i) => (
                  <Badge key={i} className="bg-red-500/20 text-red-300 border-red-500/30">
                    {alergia}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Ração preferida com alerta */}
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 font-semibold">Ração Preferida</span>
                </div>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse">
                  ⚠️ Acaba em {demoPet.diasParaAcabar} dias
                </Badge>
              </div>
              <p className="text-white">{demoPet.racaoPreferida}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);

// ============ Recurrence Timeline Section ============
const timelineSteps = [
  {
    day: 'Dia 01',
    icon: ShoppingBag,
    title: 'Compra de Ração',
    description: 'Cliente compra saco de 15kg',
    color: 'from-green-500 to-emerald-500',
    emoji: '📦'
  },
  {
    day: 'Dia 25',
    icon: Bell,
    title: 'Lembrete Automático',
    description: 'Sistema envia mensagem no WhatsApp',
    color: 'from-amber-500 to-yellow-500',
    emoji: '📲'
  },
  {
    day: 'Dia 28',
    icon: Wallet,
    title: 'Nova Venda Garantida',
    description: 'Cliente compra novamente',
    color: 'from-orange-500 to-amber-500',
    emoji: '💰'
  }
];

const RecurrenceTimelineSection = () => (
  <section className="py-20 bg-zinc-900">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-amber-500/20 text-amber-400 border-amber-500/30">
          <TrendingUp className="w-4 h-4 mr-2" />
          O Pulo do Gato 🐱
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Vendas de ração no <span className="text-orange-500">piloto automático</span>
        </h2>
        <p className="text-zinc-400 max-w-2xl mx-auto">
          Enquanto o pet está no banho, o sistema já está vendendo a próxima ração. 
          <strong className="text-white"> Não perca mais venda para o supermercado!</strong>
        </p>
      </div>
      
      {/* Timeline Desktop */}
      <div className="hidden md:block max-w-4xl mx-auto">
        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-1/2 left-0 right-0 h-2 bg-zinc-800 rounded-full -translate-y-1/2" />
          <div className="absolute top-1/2 left-0 right-0 h-2 bg-gradient-to-r from-green-500 via-amber-500 to-orange-500 rounded-full -translate-y-1/2 animate-pulse" style={{ width: '100%' }} />
          
          <div className="relative flex justify-between">
            {timelineSteps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center w-1/3">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-4xl shadow-lg mb-4 relative z-10`}>
                  {step.emoji}
                </div>
                <Badge className="mb-2 bg-zinc-800 text-zinc-300 border-zinc-700">
                  {step.day}
                </Badge>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-zinc-400 text-sm max-w-[200px]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Timeline Mobile */}
      <div className="md:hidden max-w-sm mx-auto">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 via-amber-500 to-orange-500 rounded-full" />
          
          <div className="space-y-8">
            {timelineSteps.map((step, index) => (
              <div key={index} className="flex items-start gap-4 relative">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-2xl shadow-lg flex-shrink-0 relative z-10`}>
                  {step.emoji}
                </div>
                <div className="pt-2">
                  <Badge className="mb-2 bg-zinc-800 text-zinc-300 border-zinc-700 text-xs">
                    {step.day}
                  </Badge>
                  <h3 className="text-lg font-bold text-white">{step.title}</h3>
                  <p className="text-zinc-400 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* WhatsApp Preview */}
      <div className="max-w-md mx-auto mt-12">
        <Card className="bg-[#1f2c34] border-zinc-700 overflow-hidden">
          <CardHeader className="bg-[#2a3942] border-b border-zinc-700 py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-xl">
                🐕
              </div>
              <div>
                <p className="text-white font-semibold">PetShop Amigo Fiel</p>
                <p className="text-green-400 text-xs">online</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="bg-[#005c4b] rounded-lg rounded-tl-none p-3 max-w-[85%]">
              <p className="text-white text-sm">
                Olá! 🐾 A ração do <strong>Thor</strong> está acabando!
              </p>
              <p className="text-white text-sm mt-2">
                📦 <strong>Golden Formula - 15kg</strong>
              </p>
              <p className="text-white text-sm mt-2">
                🛒 Clique aqui para fazer seu pedido e garanta 10% de desconto na entrega!
              </p>
              <p className="text-zinc-300 text-xs mt-2 text-right">14:32 ✓✓</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);

// ============ ROI Section ============
const roiMetrics = [
  {
    icon: TrendingUp,
    value: '80%',
    label: 'Redução nas faltas',
    description: 'Com lembretes automáticos no WhatsApp',
    color: 'text-green-400'
  },
  {
    icon: Package,
    value: '25%',
    label: 'Aumento nas vendas de ração',
    description: 'Com antecipação inteligente',
    color: 'text-amber-400'
  },
  {
    icon: Calculator,
    value: '0',
    label: 'Erros de cobrança',
    description: 'Serviços adicionais calculados automaticamente',
    color: 'text-blue-400'
  }
];

const ROISection = () => (
  <section className="py-20 bg-zinc-950">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">
          <Wallet className="w-4 h-4 mr-2" />
          ROI Garantido
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Como o Mostralo <span className="text-orange-500">se paga sozinho</span> em 15 dias
        </h2>
        <p className="text-zinc-400">
          A matemática do faturamento pet que você precisa conhecer.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
        {roiMetrics.map((metric, index) => (
          <Card 
            key={index} 
            className="bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all text-center"
          >
            <CardContent className="p-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
                <metric.icon className={`w-8 h-8 ${metric.color}`} />
              </div>
              <p className={`text-5xl font-bold ${metric.color} mb-2`}>{metric.value}</p>
              <p className="text-white font-semibold mb-2">{metric.label}</p>
              <p className="text-zinc-400 text-sm">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Quote */}
      <Card className="max-w-3xl mx-auto bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/30">
        <CardContent className="p-6 text-center">
          <p className="text-xl md:text-2xl text-white italic">
            "Não perca mais venda de ração para o supermercado. O{' '}
            <span className="text-orange-500 font-bold">lembrete inteligente</span>{' '}
            garante que você seja sempre a primeira opção do cliente."
          </p>
        </CardContent>
      </Card>
    </div>
  </section>
);

// ============ Demo Data ============
const demoServices = [
  { id: 'banho', name: 'Banho Completo', price: 60, duration: 60, icon: '🛁' },
  { id: 'tosa', name: 'Tosa Higiênica', price: 45, duration: 45, icon: '✂️' },
  { id: 'banho-tosa', name: 'Banho + Tosa', price: 90, duration: 90, icon: '🐾', popular: true },
  { id: 'hidratacao', name: 'Hidratação', price: 35, duration: 30, icon: '💧' }
];

const demoPets = [
  { id: 'thor', name: 'Thor', breed: 'Golden Retriever', avatar: '🐕' },
  { id: 'luna', name: 'Luna', breed: 'Shih Tzu', avatar: '🐩' },
  { id: 'max', name: 'Max', breed: 'Bulldog Francês', avatar: '🐶' }
];

const demoTimeSlots = ['08:00', '09:30', '11:00', '14:00', '15:30', '17:00'];

// ============ Interactive Booking Demo ============
const InteractiveBookingDemo = () => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const service = demoServices.find(s => s.id === selectedService);
  const pet = demoPets.find(p => p.id === selectedPet);

  const handleConfirm = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setStep(1);
      setSelectedService(null);
      setSelectedPet(null);
      setSelectedDate(undefined);
      setSelectedTime(null);
    }, 3000);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleReset = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedPet(null);
    setSelectedDate(undefined);
    setSelectedTime(null);
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 relative overflow-hidden">
      {/* Success overlay */}
      {showSuccess && (
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600 flex flex-col items-center justify-center z-20 animate-fade-in">
          <CheckCircle className="w-20 h-20 text-white mb-4" />
          <p className="text-white text-2xl font-bold mb-2">Agendamento Confirmado!</p>
          <p className="text-white/80">Você receberá um lembrete no WhatsApp 🐾</p>
          <div className="mt-4 bg-white/20 rounded-lg p-3">
            <p className="text-white text-sm">⚠️ A ração do Thor acaba em 5 dias. Lembrar?</p>
          </div>
        </div>
      )}

      <CardHeader className="border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Dog className="w-5 h-5 text-orange-500" />
            Pet Shop Amigo Fiel - Agendamento
          </CardTitle>
          {step > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-zinc-400 hover:text-white"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reiniciar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Progress bar */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  step >= s
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                    : "bg-zinc-800 text-zinc-500"
                )}
              >
                {s}
              </div>
              {s < 4 && (
                <div className={cn(
                  "w-8 h-1 mx-1 transition-all",
                  step > s ? "bg-gradient-to-r from-orange-500 to-amber-500" : "bg-zinc-800"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Service Selection */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">Escolha o Serviço</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {demoServices.map((svc) => (
                <div
                  key={svc.id}
                  onClick={() => {
                    setSelectedService(svc.id);
                    setStep(2);
                  }}
                  className={cn(
                    "relative bg-zinc-800 rounded-xl p-4 cursor-pointer border-2 transition-all hover:-translate-y-1",
                    selectedService === svc.id
                      ? "border-orange-500"
                      : "border-transparent hover:border-orange-500/50"
                  )}
                >
                  {svc.popular && (
                    <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs">
                      Popular
                    </Badge>
                  )}
                  <div className="text-3xl mb-2 text-center">{svc.icon}</div>
                  <h4 className="text-white font-semibold text-sm text-center">{svc.name}</h4>
                  <p className="text-zinc-400 text-xs text-center">{svc.duration} min</p>
                  <p className="text-orange-500 font-bold mt-2 text-center">R$ {svc.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Pet Selection */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-zinc-400 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </Button>
              <h3 className="text-lg font-semibold text-white">Escolha o Pet</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {demoPets.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedPet(p.id);
                    setStep(3);
                  }}
                  className={cn(
                    "bg-zinc-800 rounded-xl p-4 cursor-pointer border-2 transition-all hover:-translate-y-1 text-center",
                    selectedPet === p.id
                      ? "border-orange-500"
                      : "border-transparent hover:border-orange-500/50"
                  )}
                >
                  <div className="text-5xl mb-2">{p.avatar}</div>
                  <h4 className="text-white font-semibold">{p.name}</h4>
                  <p className="text-zinc-400 text-sm">{p.breed}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Date and Time Selection */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-zinc-400 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </Button>
              <h3 className="text-lg font-semibold text-white">Escolha Data e Horário</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calendar */}
              <div className="flex justify-center">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedTime(null);
                  }}
                  locale={ptBR}
                  disabled={(date) => isBefore(date, startOfDay(new Date())) || isBefore(addDays(new Date(), 30), date)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg pointer-events-auto"
                  classNames={{
                    day_selected: "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 focus:from-orange-600 focus:to-amber-600",
                    day_today: "border-2 border-orange-500/50 text-orange-400",
                    nav_button: "text-zinc-400 hover:text-white hover:bg-zinc-700",
                    caption: "text-white",
                    head_cell: "text-zinc-400",
                    cell: "text-zinc-300",
                    day: "hover:bg-zinc-700 text-zinc-300",
                    day_outside: "text-zinc-600",
                    day_disabled: "text-zinc-600 opacity-50",
                  }}
                />
              </div>

              {/* Time slots */}
              <div>
                <p className="text-zinc-400 text-sm mb-3">
                  {selectedDate 
                    ? `Horários para ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}`
                    : 'Selecione uma data primeiro'
                  }
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {demoTimeSlots.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      disabled={!selectedDate}
                      onClick={() => {
                        setSelectedTime(time);
                        setStep(4);
                      }}
                      className={cn(
                        "text-sm",
                        selectedTime === time
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0"
                          : "border-zinc-700 text-zinc-300 hover:border-orange-500 hover:text-white"
                      )}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && service && pet && selectedDate && selectedTime && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-zinc-400 hover:text-white"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </Button>
              <h3 className="text-lg font-semibold text-white">Confirmar Agendamento</h3>
            </div>

            <div className="bg-zinc-800 rounded-xl p-6 mb-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-700">
                  <span className="text-zinc-400">Pet</span>
                  <span className="text-white font-semibold flex items-center gap-2">
                    {pet.avatar} {pet.name}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-700">
                  <span className="text-zinc-400">Serviço</span>
                  <span className="text-white font-semibold">{service.name}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-700">
                  <span className="text-zinc-400">Data</span>
                  <span className="text-white font-semibold">
                    {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-700">
                  <span className="text-zinc-400">Horário</span>
                  <span className="text-white font-semibold">{selectedTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Valor</span>
                  <span className="text-orange-500 font-bold text-xl">R$ {service.price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
              <p className="text-amber-400 text-sm flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Você receberá um lembrete no WhatsApp 2h antes do horário!
              </p>
            </div>

            <Button
              onClick={handleConfirm}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg py-6"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Confirmar Agendamento
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============ Flow Simulator Section ============
const FlowSimulatorSection = () => (
  <section className="py-20 bg-zinc-950">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
          <Smartphone className="w-4 h-4 mr-2" />
          Teste Agora - 100% Interativo
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Experimente <span className="text-orange-500">Como o Cliente Vê</span>
        </h2>
        <p className="text-zinc-400">
          Clique e navegue pelo sistema real de agendamento
        </p>
      </div>
      
      {/* Simulator content */}
      <div className="max-w-3xl mx-auto">
        <InteractiveBookingDemo />
      </div>
    </div>
  </section>
);

// ============ Plans Section ============
const plans = [
  {
    name: 'Essencial',
    price: 97,
    description: 'Para começar a organizar',
    features: [
      'Agenda Online 24h',
      'PDV Básico',
      'Cadastro de Pets',
      'Controle de Clientes',
      'Relatórios Básicos'
    ],
    highlighted: false,
    cta: 'Começar Agora'
  },
  {
    name: 'Profissional',
    price: 197,
    description: 'O mais escolhido pelos Pet Shops',
    features: [
      'Tudo do Essencial +',
      'Inteligência de Recorrência (Ração)',
      'Lembretes WhatsApp',
      'Gestão de Leva e Traz',
      'Comissões de Tosadores',
      'Controle de Estoque',
      'Relatórios Avançados'
    ],
    highlighted: true,
    cta: 'Escolher Profissional'
  },
  {
    name: 'Empresarial',
    price: null,
    description: 'Para redes de Pet Shops e Franquias',
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
          Escolha o plano que vai <span className="text-orange-500">escalar seu Pet Shop</span>
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
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-center text-sm py-1 font-semibold">
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
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white' 
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
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg px-10 py-6 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
          >
            <Gift className="w-5 h-5 mr-2" />
            TESTAR GRÁTIS POR 7 DIAS
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
    question: 'Como funciona o lembrete de ração?',
    answer: 'O sistema calcula automaticamente o consumo baseado no tamanho do saco e no porte do pet. Quando faltar 5 dias para acabar, enviamos uma mensagem no WhatsApp do cliente com um link para comprar novamente. Você não perde mais venda para o supermercado!'
  },
  {
    question: 'Posso organizar as rotas de leva e traz?',
    answer: 'Sim! No plano Profissional você tem acesso ao módulo de Leva e Traz com GPS. Organize as rotas do motorista, saiba onde ele está em tempo real e avise o cliente quando o pet estiver chegando em casa.'
  },
  {
    question: 'O sistema calcula comissão dos tosadores?',
    answer: 'Sim! Você cadastra os tosadores e define a porcentagem de comissão. O sistema calcula automaticamente quanto cada um deve receber baseado nos serviços realizados. Fim dos erros de cálculo!'
  },
  {
    question: 'Consigo cadastrar histórico de vacinas?',
    answer: 'Sim! No perfil do pet você cadastra todas as vacinas, datas de aplicação e próximas doses. O sistema também pode alertar sobre vacinas vencidas ou próximas de vencer.'
  },
  {
    question: 'E se o cliente tiver mais de um pet?',
    answer: 'Sem problema! Cada cliente pode ter quantos pets quiser cadastrados. Cada pet tem seu próprio perfil com histórico, alergias, preferências e agendamentos independentes.'
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
        Sua marca. O cuidado que o pet merece. O lucro que você precisa. 🐾
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
const NichoPetShopsPage = () => {
  usePageSEO({
    title: 'Sistema para Pet Shop | Agendamento + Lembrete de Ração + Leva e Traz | Mostralo',
    description: 'Sistema completo para Pet Shops: agendamento de banho e tosa online, lembrete inteligente de ração, gestão de leva e traz com GPS e comissões automáticas. Teste grátis por 7 dias.',
    keywords: 'sistema pet shop, agendamento banho tosa, lembrete ração automático, gestão pet shop, software petshop, leva e traz pet, comissões tosador',
    image: 'https://mostralo.com.br/og-pet-shop.png'
  });

  return (
    <div className="min-h-screen bg-zinc-950">
      <HeroSection />
      <ProblemsSection />
      <FourPillarsSection />
      <PetProfileSection />
      <RecurrenceTimelineSection />
      <ROISection />
      <FlowSimulatorSection />
      <PlansSection />
      <FAQSection />
      <FooterSection />
      <WhatsAppLeadButton />
    </div>
  );
};

export default NichoPetShopsPage;
