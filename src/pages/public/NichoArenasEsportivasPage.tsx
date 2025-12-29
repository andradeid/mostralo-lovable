import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Clock, 
  CreditCard, 
  MessageCircle, 
  Users, 
  Smartphone,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Trophy,
  MapPin,
  Zap,
  TrendingUp,
  TrendingDown,
  Target,
  Star,
  Phone,
  Monitor,
  Megaphone,
  ChevronRight,
  Timer,
  QrCode,
  DollarSign,
  BarChart3,
  ShoppingCart,
  Beer,
  UtensilsCrossed,
  Waves
} from 'lucide-react';
import { useMasterWhatsApp } from '@/hooks/useMasterWhatsApp';
import { usePageSEO } from '@/hooks/useSEO';

// ==================== HERO SECTION ====================
const HeroSection = () => {
  const { getWhatsAppLink } = useMasterWhatsApp();
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-orange-500/5 to-lime-500/5 rounded-full blur-3xl" />
        {/* Tennis ball pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-[10%] left-[15%] text-6xl">🎾</div>
          <div className="absolute top-[30%] right-[20%] text-4xl">🏸</div>
          <div className="absolute bottom-[25%] left-[25%] text-5xl">⚽</div>
          <div className="absolute bottom-[40%] right-[15%] text-3xl">🎾</div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <Badge className="bg-gradient-to-r from-orange-500/20 to-lime-500/20 text-lime-400 border-lime-500/30 px-4 py-2 text-sm">
              <Trophy className="w-4 h-4 mr-2" />
              Para Arenas de Beach Tennis, Padel e Society
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Sua Arena <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-lime-400">lotada</span>. 
              Seu Bar <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-orange-400">organizado</span>. 
              Seu lucro no <span className="text-orange-400">máximo</span>.
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 leading-relaxed">
              O ecossistema completo para Centros Esportivos. Gerencie reservas de quadras, 
              controle o consumo do bar via comanda e automatize pagamentos. 
              <span className="text-white font-medium"> Tudo em uma única plataforma feita para o ritmo do seu jogo.</span>
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Calendar, text: 'Reserva 24h' },
                { icon: CreditCard, text: 'PIX Automático' },
                { icon: ShoppingCart, text: 'Comanda Integrada' },
                { icon: Megaphone, text: 'WhatsApp Marketing' }
              ].map((badge, index) => (
                <div key={index} className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700/50 rounded-full px-4 py-2">
                  <badge.icon className="w-4 h-4 text-lime-400" />
                  <span className="text-sm text-zinc-300">{badge.text}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-lime-500 hover:from-orange-600 hover:to-lime-600 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-lg shadow-orange-500/25 transition-all hover:scale-105"
                onClick={() => window.open(getWhatsAppLink('arena_esportiva'), '_blank')}
              >
                TRANSFORMAR MINHA ARENA
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 hover:text-white px-8 py-6 rounded-xl"
                onClick={() => navigate('/demo')}
              >
                <Monitor className="mr-2 w-5 h-5" />
                Ver Demonstração
              </Button>
            </div>
          </div>

          {/* Right Content - Mockup */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl p-6 border border-zinc-700/50 shadow-2xl">
              {/* Phone Frame */}
              <div className="bg-zinc-950 rounded-2xl p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-lime-500 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Arena Beach Pro</p>
                      <p className="text-zinc-500 text-xs">Reservas Online</p>
                    </div>
                  </div>
                  <Badge className="bg-lime-500/20 text-lime-400 text-xs">Ao Vivo</Badge>
                </div>

                {/* Court Grid Preview */}
                <div className="space-y-2">
                  <p className="text-zinc-400 text-xs">Quadras - Hoje</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['Beach 1', 'Beach 2', 'Padel 1'].map((court, i) => (
                      <div key={i} className={`p-2 rounded-lg text-center text-xs ${
                        i === 0 ? 'bg-lime-500/20 border border-lime-500/30 text-lime-400' :
                        i === 1 ? 'bg-orange-500/20 border border-orange-500/30 text-orange-400' :
                        'bg-zinc-800 border border-zinc-700 text-zinc-400'
                      }`}>
                        {court}
                        <div className="text-[10px] mt-1 opacity-70">
                          {i === 0 ? 'Livre 14h' : i === 1 ? 'Ocupada' : 'Livre 15h'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alert */}
                <div className="bg-gradient-to-r from-orange-500/10 to-lime-500/10 border border-orange-500/30 rounded-xl p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <QrCode className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Nova Reserva!</p>
                      <p className="text-zinc-400 text-xs">Beach 1 - 16:00 às 17:00</p>
                      <p className="text-lime-400 text-xs mt-1">💰 Sinal pago: R$ 40,00</p>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-lime-400">12</p>
                    <p className="text-zinc-500 text-xs">Reservas Hoje</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-orange-400">R$ 1.840</p>
                    <p className="text-zinc-500 text-xs">Faturamento</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-lime-500 text-zinc-900 rounded-full p-3 shadow-lg shadow-lime-500/30 animate-bounce">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-orange-500 text-white rounded-full p-3 shadow-lg shadow-orange-500/30">
              <Zap className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ==================== PROBLEMS SECTION ====================
const ProblemsSection = () => {
  const problems = [
    {
      icon: Calendar,
      title: 'Conflito de Horários',
      description: 'Duas turmas marcadas para a mesma quadra. Confusão, reclamação e desgaste com clientes.',
      color: 'red'
    },
    {
      icon: Users,
      title: 'Prejuízo no Day-Use',
      description: 'Clientes que reservam e não aparecem (No-show). Quadra vazia = dinheiro perdido.',
      color: 'orange'
    },
    {
      icon: Beer,
      title: 'Caos no Bar',
      description: 'Grupos grandes consumindo e dificuldade para fechar a conta de cada um. Prejuízo garantido.',
      color: 'yellow'
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp Sobrecarregado',
      description: 'Passar o dia enviando "tem horário pra amanhã?". Atendimento manual que não escala.',
      color: 'amber'
    }
  ];

  return (
    <section className="py-20 bg-zinc-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-red-500/10 text-red-400 border-red-500/30 mb-4">
            <XCircle className="w-4 h-4 mr-2" />
            O Jogo Não Pode Parar
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Cansado de confusão nos horários e <span className="text-red-400">"furos"</span> nas reservas?
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Esses problemas estão custando dinheiro e clientes todos os dias.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((problem, index) => (
            <Card key={index} className="bg-zinc-900/50 border-zinc-800 hover:border-red-500/30 transition-all group">
              <CardContent className="p-6">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <problem.icon className="w-7 h-7 text-red-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{problem.title}</h3>
                <p className="text-zinc-400 text-sm">{problem.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Alert Box */}
        <div className="mt-12 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
          <p className="text-zinc-300 text-lg">
            <span className="text-red-400 font-bold">Cada "furo" de reserva</span> pode custar até R$ 150,00 em horário nobre.
            <br />
            <span className="text-zinc-400">Multiplique isso por mês e veja quanto está perdendo.</span>
          </p>
        </div>
      </div>
    </section>
  );
};

// ==================== FOUR PILLARS SECTION ====================
const FourPillarsSection = () => {
  const pillars = [
    {
      icon: CreditCard,
      title: 'Reserva com Pagamento Antecipado',
      description: 'O cliente escolhe a quadra e o horário pelo link. Para confirmar, ele paga o sinal via PIX automático.',
      highlight: 'Garanta a quadra paga antes mesmo do jogo começar.',
      color: 'orange',
      gradient: 'from-orange-500 to-amber-500'
    },
    {
      icon: ShoppingCart,
      title: 'Comandas Integradas (Bar & Pro-Shop)',
      description: 'Cada grupo de jogadores abre uma comanda única. Lançamento rápido de bebidas, snacks e aluguel de raquetes.',
      highlight: 'Pelo tablet ou celular do atendente.',
      color: 'lime',
      gradient: 'from-lime-500 to-green-500'
    },
    {
      icon: Monitor,
      title: 'Totem de Autoatendimento',
      description: 'Evite filas no bar após as partidas. O jogador vai ao totem, compra sua bebida e já volta para a resenha.',
      highlight: 'Self-service que aumenta o consumo.',
      color: 'cyan',
      gradient: 'from-cyan-500 to-blue-500'
    },
    {
      icon: Megaphone,
      title: 'Ranking e WhatsApp Marketing',
      description: 'Identifique os jogadores mais assíduos e envie convites automáticos para torneios.',
      highlight: 'Horários promocionais em dias de baixo movimento.',
      color: 'purple',
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-zinc-950 to-zinc-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-lime-500/10 text-lime-400 border-lime-500/30 mb-4">
            <Trophy className="w-4 h-4 mr-2" />
            Match Point da Gestão
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            O <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-lime-400">"Cérebro"</span> da sua Arena
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Quatro recursos que transformam a gestão do seu centro esportivo.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {pillars.map((pillar, index) => (
            <Card key={index} className="bg-zinc-900/50 border-zinc-800 hover:border-lime-500/30 transition-all overflow-hidden group">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${pillar.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                    <pillar.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-3">{pillar.title}</h3>
                    <p className="text-zinc-400 mb-4">{pillar.description}</p>
                    <p className={`text-sm font-medium text-${pillar.color}-400 bg-${pillar.color}-500/10 inline-block px-3 py-1 rounded-full`}>
                      {pillar.highlight}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// ==================== COURT SCHEDULE SECTION ====================
const CourtScheduleSection = () => {
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  
  const courts = [
    { id: 'beach1', name: 'Beach Tennis 1', type: 'beach', emoji: '🎾' },
    { id: 'beach2', name: 'Beach Tennis 2', type: 'beach', emoji: '🎾' },
    { id: 'padel1', name: 'Padel 1', type: 'padel', emoji: '🏸' },
    { id: 'society1', name: 'Society 1', type: 'society', emoji: '⚽' }
  ];

  const timeSlots = ['07:00', '08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  const schedule: Record<string, Record<string, { status: 'livre' | 'reservado' | 'ocupado'; cliente?: string }>> = {
    beach1: {
      '07:00': { status: 'reservado', cliente: 'João Silva' },
      '08:00': { status: 'ocupado' },
      '09:00': { status: 'livre' },
      '10:00': { status: 'livre' },
      '11:00': { status: 'reservado', cliente: 'Maria Santos' },
      '14:00': { status: 'livre' },
      '15:00': { status: 'reservado', cliente: 'Pedro Costa' },
      '16:00': { status: 'livre' },
      '17:00': { status: 'reservado', cliente: 'Ana Oliveira' },
      '18:00': { status: 'ocupado' },
      '19:00': { status: 'reservado', cliente: 'Carlos Lima' },
      '20:00': { status: 'livre' }
    },
    beach2: {
      '07:00': { status: 'livre' },
      '08:00': { status: 'reservado', cliente: 'Turma do Beach' },
      '09:00': { status: 'ocupado' },
      '10:00': { status: 'livre' },
      '11:00': { status: 'livre' },
      '14:00': { status: 'reservado', cliente: 'Lucas Mendes' },
      '15:00': { status: 'livre' },
      '16:00': { status: 'reservado', cliente: 'Julia Ferreira' },
      '17:00': { status: 'livre' },
      '18:00': { status: 'livre' },
      '19:00': { status: 'ocupado' },
      '20:00': { status: 'reservado', cliente: 'Equipe Pro' }
    },
    padel1: {
      '07:00': { status: 'livre' },
      '08:00': { status: 'livre' },
      '09:00': { status: 'reservado', cliente: 'Dupla Padel' },
      '10:00': { status: 'ocupado' },
      '11:00': { status: 'livre' },
      '14:00': { status: 'livre' },
      '15:00': { status: 'reservado', cliente: 'Torneio Interno' },
      '16:00': { status: 'reservado', cliente: 'Torneio Interno' },
      '17:00': { status: 'reservado', cliente: 'Torneio Interno' },
      '18:00': { status: 'livre' },
      '19:00': { status: 'livre' },
      '20:00': { status: 'livre' }
    },
    society1: {
      '07:00': { status: 'livre' },
      '08:00': { status: 'livre' },
      '09:00': { status: 'livre' },
      '10:00': { status: 'reservado', cliente: 'Time Amigos' },
      '11:00': { status: 'ocupado' },
      '14:00': { status: 'livre' },
      '15:00': { status: 'livre' },
      '16:00': { status: 'livre' },
      '17:00': { status: 'reservado', cliente: 'Pelada Semanal' },
      '18:00': { status: 'reservado', cliente: 'Pelada Semanal' },
      '19:00': { status: 'livre' },
      '20:00': { status: 'reservado', cliente: 'Jogo Noturno' }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'livre': return 'bg-lime-500/20 border-lime-500/30 text-lime-400 hover:bg-lime-500/30';
      case 'reservado': return 'bg-orange-500/20 border-orange-500/30 text-orange-400';
      case 'ocupado': return 'bg-zinc-700/50 border-zinc-600/30 text-zinc-500';
      default: return 'bg-zinc-800 border-zinc-700 text-zinc-400';
    }
  };

  return (
    <section className="py-20 bg-zinc-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/30 mb-4">
            <Calendar className="w-4 h-4 mr-2" />
            Grade de Horários
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Visualize sua <span className="text-orange-400">arena</span> em tempo real
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Interface intuitiva para você e seus clientes verem disponibilidade.
          </p>
        </div>

        {/* Court Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {courts.map((court) => (
            <button
              key={court.id}
              onClick={() => setSelectedCourt(selectedCourt === court.id ? null : court.id)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                selectedCourt === court.id
                  ? 'bg-gradient-to-r from-orange-500 to-lime-500 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              <span className="mr-2">{court.emoji}</span>
              {court.name}
            </button>
          ))}
        </div>

        {/* Schedule Grid */}
        <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-6 overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-13 gap-2 mb-4">
              <div className="text-zinc-500 text-sm font-medium p-2">Quadra</div>
              {timeSlots.map((time) => (
                <div key={time} className="text-zinc-500 text-sm font-medium text-center p-2">{time}</div>
              ))}
            </div>

            {/* Rows */}
            {courts.filter(c => !selectedCourt || c.id === selectedCourt).map((court) => (
              <div key={court.id} className="grid grid-cols-13 gap-2 mb-2">
                <div className="flex items-center gap-2 p-2 bg-zinc-900 rounded-lg">
                  <span>{court.emoji}</span>
                  <span className="text-white text-sm font-medium truncate">{court.name}</span>
                </div>
                {timeSlots.map((time) => {
                  const slot = schedule[court.id]?.[time] || { status: 'livre' };
                  return (
                    <div
                      key={`${court.id}-${time}`}
                      className={`p-2 rounded-lg border text-center text-xs cursor-pointer transition-all ${getStatusColor(slot.status)}`}
                      title={slot.cliente || slot.status}
                    >
                      {slot.status === 'livre' ? '✓' : slot.status === 'reservado' ? '📅' : '🔒'}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-6 mt-6 pt-6 border-t border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-lime-500/20 border border-lime-500/30" />
              <span className="text-zinc-400 text-sm">Livre</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-500/20 border border-orange-500/30" />
              <span className="text-zinc-400 text-sm">Reservado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-zinc-700/50 border border-zinc-600/30" />
              <span className="text-zinc-400 text-sm">Ocupado</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ==================== GROUP ORDER SECTION ====================
const GroupOrderSection = () => {
  const [orderItems, setOrderItems] = useState([
    { id: 1, nome: 'Cerveja Heineken', quantidade: 4, preco: 14.00, categoria: 'bebida' },
    { id: 2, nome: 'Água Mineral 500ml', quantidade: 2, preco: 5.00, categoria: 'bebida' },
    { id: 3, nome: 'Porção de Fritas', quantidade: 1, preco: 35.00, categoria: 'snack' },
    { id: 4, nome: 'Aluguel de Raquete', quantidade: 2, preco: 25.00, categoria: 'aluguel' }
  ]);

  const total = orderItems.reduce((acc, item) => acc + (item.quantidade * item.preco), 0);
  const perPerson = total / 4; // Dividido por 4 pessoas

  const getCategoryIcon = (categoria: string) => {
    switch (categoria) {
      case 'bebida': return Beer;
      case 'snack': return UtensilsCrossed;
      case 'aluguel': return Trophy;
      default: return ShoppingCart;
    }
  };

  const getCategoryColor = (categoria: string) => {
    switch (categoria) {
      case 'bebida': return 'text-amber-400';
      case 'snack': return 'text-orange-400';
      case 'aluguel': return 'text-lime-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-zinc-900 to-zinc-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="bg-lime-500/10 text-lime-400 border-lime-500/30 mb-4">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Comandas Integradas
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Controle cada <span className="text-lime-400">centavo</span> consumido pelo grupo
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Comanda única por turma, divisão automática e fechamento sem stress.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="bg-zinc-900/80 border-zinc-800 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500/20 to-lime-500/20 p-4 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-lime-500 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Turma do Beach 🎾</h3>
                    <p className="text-zinc-400 text-sm">Beach Tennis 1 • 16:00 às 17:00</p>
                  </div>
                </div>
                <Badge className="bg-lime-500/20 text-lime-400">4 pessoas</Badge>
              </div>
            </div>

            {/* Items */}
            <CardContent className="p-6">
              <div className="space-y-4 mb-6">
                {orderItems.map((item) => {
                  const Icon = getCategoryIcon(item.categoria);
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center ${getCategoryColor(item.categoria)}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{item.nome}</p>
                          <p className="text-zinc-500 text-sm">R$ {item.preco.toFixed(2)} cada</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-1">
                          <button className="text-zinc-400 hover:text-white">-</button>
                          <span className="text-white font-medium w-6 text-center">{item.quantidade}</span>
                          <button className="text-zinc-400 hover:text-white">+</button>
                        </div>
                        <p className="text-lime-400 font-bold w-20 text-right">
                          R$ {(item.quantidade * item.preco).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Item */}
              <button className="w-full py-3 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-400 hover:text-lime-400 hover:border-lime-500/50 transition-all flex items-center justify-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Adicionar Item
              </button>

              {/* Totals */}
              <div className="mt-6 pt-6 border-t border-zinc-800 space-y-3">
                <div className="flex justify-between text-zinc-400">
                  <span>Subtotal</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-lime-400">R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-orange-400 bg-orange-500/10 rounded-lg px-4 py-2">
                  <span>Por pessoa (÷4)</span>
                  <span className="font-bold">R$ {perPerson.toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <Button className="flex-1 bg-gradient-to-r from-orange-500 to-lime-500 hover:from-orange-600 hover:to-lime-600 text-white">
                  <CreditCard className="mr-2 w-4 h-4" />
                  Fechar Conta
                </Button>
                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  <Users className="mr-2 w-4 h-4" />
                  Dividir
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

// ==================== ROI SECTION ====================
const ROISection = () => {
  const metrics = [
    {
      icon: TrendingDown,
      value: '0',
      unit: 'No-shows',
      description: 'Fim das perdas com reservas pagas antecipadamente',
      color: 'lime',
      prefix: ''
    },
    {
      icon: TrendingUp,
      value: '30',
      unit: '%',
      description: 'Aumento no consumo do bar com comandas e totens rápidos',
      color: 'orange',
      prefix: '+'
    },
    {
      icon: Timer,
      value: '80',
      unit: '%',
      description: 'Menos tempo ao telefone, mais tempo na experiência',
      color: 'cyan',
      prefix: '-'
    }
  ];

  return (
    <section className="py-20 bg-zinc-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/30 mb-4">
            <BarChart3 className="w-4 h-4 mr-2" />
            ROI Comprovado
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            O sistema que se paga com <span className="text-orange-400">2 quadras</span> reservadas
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            A matemática do "Set" ganho. Veja como o Mostralo impacta seus resultados.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {metrics.map((metric, index) => (
            <Card key={index} className="bg-zinc-900/50 border-zinc-800 hover:border-lime-500/30 transition-all text-center overflow-hidden group">
              <CardContent className="p-8">
                <div className={`w-16 h-16 rounded-2xl bg-${metric.color}-500/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                  <metric.icon className={`w-8 h-8 text-${metric.color}-400`} />
                </div>
                <div className="mb-4">
                  <span className={`text-5xl font-bold text-${metric.color}-400`}>
                    {metric.prefix}{metric.value}
                  </span>
                  <span className={`text-2xl font-bold text-${metric.color}-400`}>{metric.unit}</span>
                </div>
                <p className="text-zinc-400">{metric.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Highlight Box */}
        <div className="mt-12 bg-gradient-to-r from-orange-500/10 via-lime-500/10 to-orange-500/10 border border-lime-500/20 rounded-2xl p-8 text-center max-w-3xl mx-auto">
          <p className="text-xl text-white">
            <span className="text-lime-400 font-bold">Cada quadra reservada e paga</span> antecipadamente elimina o risco de prejuízo.
          </p>
          <p className="text-zinc-400 mt-2">
            Com média de R$ 80 por hora, basta 2 reservas para cobrir o investimento mensal no Mostralo.
          </p>
        </div>
      </div>
    </section>
  );
};

// ==================== BOOKING DEMO SECTION ====================
const BookingDemoSection = () => {
  const [step, setStep] = useState(1);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const sports = [
    { id: 'beach', name: 'Beach Tennis', emoji: '🎾', color: 'orange' },
    { id: 'padel', name: 'Padel', emoji: '🏸', color: 'lime' },
    { id: 'society', name: 'Society', emoji: '⚽', color: 'cyan' },
    { id: 'tenis', name: 'Tênis', emoji: '🎾', color: 'purple' }
  ];

  const courtsBySport: Record<string, string[]> = {
    beach: ['Beach Tennis 1', 'Beach Tennis 2'],
    padel: ['Padel 1', 'Padel 2'],
    society: ['Society 1'],
    tenis: ['Tênis 1']
  };

  const dates = ['Hoje', 'Amanhã', 'Quarta', 'Quinta', 'Sexta'];
  const times = ['07:00', '08:00', '09:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const resetDemo = () => {
    setStep(1);
    setSelectedSport(null);
    setSelectedCourt(null);
    setSelectedDate(null);
    setSelectedTime(null);
  };

  return (
    <section className="py-20 bg-gradient-to-b from-zinc-950 to-zinc-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="bg-lime-500/10 text-lime-400 border-lime-500/30 mb-4">
            <Smartphone className="w-4 h-4 mr-2" />
            Demonstração Interativa
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Veja como seu cliente <span className="text-lime-400">reserva a quadra</span>
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Processo simples, rápido e com pagamento antecipado.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  s === step ? 'bg-gradient-to-r from-orange-500 to-lime-500 text-white' :
                  s < step ? 'bg-lime-500 text-white' :
                  'bg-zinc-800 text-zinc-500'
                }`}>
                  {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 5 && (
                  <div className={`w-12 sm:w-20 h-1 ${s < step ? 'bg-lime-500' : 'bg-zinc-800'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Phone Mockup */}
          <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500/20 to-lime-500/20 p-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-lime-500 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">Arena Beach Pro</p>
                  <p className="text-zinc-400 text-sm">Reserva Online</p>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              {/* Step 1: Sport */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-white font-bold text-lg">Escolha o esporte</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {sports.map((sport) => (
                      <button
                        key={sport.id}
                        onClick={() => { setSelectedSport(sport.id); nextStep(); }}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          selectedSport === sport.id
                            ? 'border-lime-500 bg-lime-500/10'
                            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                        }`}
                      >
                        <span className="text-3xl mb-2 block">{sport.emoji}</span>
                        <span className="text-white font-medium">{sport.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Court */}
              {step === 2 && selectedSport && (
                <div className="space-y-4">
                  <h3 className="text-white font-bold text-lg">Escolha a quadra</h3>
                  <div className="space-y-3">
                    {courtsBySport[selectedSport]?.map((court) => (
                      <button
                        key={court}
                        onClick={() => { setSelectedCourt(court); nextStep(); }}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                          selectedCourt === court
                            ? 'border-lime-500 bg-lime-500/10'
                            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                        }`}
                      >
                        <span className="text-white font-medium">{court}</span>
                        <Badge className="bg-lime-500/20 text-lime-400">Disponível</Badge>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Date */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-white font-bold text-lg">Escolha a data</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {dates.map((date, i) => (
                      <button
                        key={date}
                        onClick={() => { setSelectedDate(date); nextStep(); }}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          selectedDate === date
                            ? 'border-lime-500 bg-lime-500/10'
                            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                        }`}
                      >
                        <span className="text-zinc-400 text-xs block">{['Seg', 'Ter', 'Qua', 'Qui', 'Sex'][i]}</span>
                        <span className="text-white font-medium text-sm">{date}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4: Time */}
              {step === 4 && (
                <div className="space-y-4">
                  <h3 className="text-white font-bold text-lg">Escolha o horário</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {times.map((time) => (
                      <button
                        key={time}
                        onClick={() => { setSelectedTime(time); nextStep(); }}
                        className={`p-3 rounded-xl border-2 text-center transition-all ${
                          selectedTime === time
                            ? 'border-lime-500 bg-lime-500/10'
                            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                        }`}
                      >
                        <span className="text-white font-medium text-sm">{time}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Confirmation */}
              {step === 5 && (
                <div className="space-y-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-lime-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-xl mb-2">Reserva Confirmada!</h3>
                    <p className="text-zinc-400">Seu pagamento foi processado com sucesso.</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-xl p-4 text-left space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Quadra:</span>
                      <span className="text-white font-medium">{selectedCourt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Data:</span>
                      <span className="text-white font-medium">{selectedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Horário:</span>
                      <span className="text-white font-medium">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-zinc-700">
                      <span className="text-zinc-400">Sinal pago:</span>
                      <span className="text-lime-400 font-bold">R$ 40,00</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-500/10 to-lime-500/10 rounded-xl p-4 border border-lime-500/20">
                    <p className="text-zinc-300 text-sm">
                      📱 QR Code de acesso enviado por WhatsApp!
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-6 pt-4 border-t border-zinc-800">
                {step > 1 && step < 5 && (
                  <Button variant="outline" onClick={prevStep} className="border-zinc-700 text-zinc-300">
                    Voltar
                  </Button>
                )}
                {step === 5 && (
                  <Button onClick={resetDemo} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white">
                    Reiniciar Demo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

// ==================== PLANS SECTION ====================
const PlansSection = () => {
  const { getWhatsAppLink } = useMasterWhatsApp();
  
  const plans = [
    {
      name: 'Starter',
      description: 'Para começar a digitalizar',
      price: 'R$ 197',
      period: '/mês',
      features: [
        'Gestão de Reservas Online',
        'PDV Básico',
        'Até 2 quadras',
        'Relatórios simples',
        'Suporte por email'
      ],
      cta: 'Começar Agora',
      highlighted: false
    },
    {
      name: 'Arena Pro',
      description: 'Mais vendido para arenas',
      price: 'R$ 397',
      period: '/mês',
      features: [
        'Tudo do Starter +',
        'Reservas com Sinal PIX',
        'Comandas de Bar Integradas',
        'WhatsApp Marketing',
        'Financeiro Completo',
        'Até 6 quadras',
        'Suporte prioritário'
      ],
      cta: 'Escolher Arena Pro',
      highlighted: true
    },
    {
      name: 'Elite',
      description: 'Para redes e grandes arenas',
      price: 'Sob consulta',
      period: '',
      features: [
        'Tudo do Arena Pro +',
        'Multi-arenas',
        'Gestão de Torneios',
        'Totem de Autoatendimento',
        'API Personalizada',
        'Quadras ilimitadas',
        'Gerente de conta dedicado'
      ],
      cta: 'Falar com Consultor',
      highlighted: false
    }
  ];

  return (
    <section className="py-20 bg-zinc-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/30 mb-4">
            <Trophy className="w-4 h-4 mr-2" />
            Planos
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto para <span className="text-orange-400">elevar o nível</span> da sua Arena?
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Escolha o plano ideal para o tamanho do seu centro esportivo.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative overflow-hidden ${
              plan.highlighted 
                ? 'bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-lime-500/50 shadow-lg shadow-lime-500/10' 
                : 'bg-zinc-900/50 border-zinc-800'
            }`}>
              {plan.highlighted && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-lime-500 text-white text-center py-2 text-sm font-bold">
                  ⭐ MAIS POPULAR
                </div>
              )}
              <CardContent className={`p-8 ${plan.highlighted ? 'pt-14' : ''}`}>
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-zinc-400 text-sm">{plan.description}</p>
                </div>
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-zinc-400">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-zinc-300">
                      <CheckCircle2 className="w-5 h-5 text-lime-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${
                    plan.highlighted 
                      ? 'bg-gradient-to-r from-orange-500 to-lime-500 hover:from-orange-600 hover:to-lime-600 text-white' 
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                  }`}
                  onClick={() => window.open(getWhatsAppLink('arena_esportiva'), '_blank')}
                >
                  {plan.cta}
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Final */}
        <div className="text-center mt-12">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-orange-500 to-lime-500 hover:from-orange-600 hover:to-lime-600 text-white font-bold text-lg px-12 py-6 rounded-xl shadow-lg shadow-orange-500/25"
            onClick={() => window.open(getWhatsAppLink('arena_esportiva'), '_blank')}
          >
            SOLICITAR DEMONSTRAÇÃO GRATUITA
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

// ==================== FAQ SECTION ====================
const FAQSection = () => {
  const faqs = [
    {
      question: 'Como funciona o pagamento antecipado?',
      answer: 'O cliente escolhe a quadra e horário pelo link, e paga um sinal via PIX automático para confirmar a reserva. O valor do sinal é descontado do total no dia do jogo.'
    },
    {
      question: 'E se o cliente cancelar a reserva?',
      answer: 'Você define a política de cancelamento. O sistema pode reembolsar automaticamente se cancelar com antecedência, ou reter o sinal em caso de no-show.'
    },
    {
      question: 'Posso gerenciar múltiplas quadras?',
      answer: 'Sim! O sistema suporta quadras ilimitadas, incluindo Beach Tennis, Padel, Society, Tênis e qualquer outro esporte. Cada quadra tem sua própria grade de horários.'
    },
    {
      question: 'O sistema calcula divisão de consumo do grupo?',
      answer: 'Sim, a comanda integrada permite dividir o total por pessoa automaticamente, facilitando o fechamento de conta de grupos grandes.'
    },
    {
      question: 'Consigo organizar torneios?',
      answer: 'No plano Elite, você tem acesso à gestão completa de torneios, incluindo chaveamento, ranking e pontuação automática.'
    },
    {
      question: 'Posso testar antes de pagar?',
      answer: 'Sim! Oferecemos 7 dias de teste gratuito com todas as funcionalidades. Sem compromisso e sem cartão de crédito.'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-zinc-900 to-zinc-950">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 mb-4">
            FAQ
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Tire suas dúvidas sobre o Mostralo para Arenas Esportivas.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="bg-zinc-900/50 border-zinc-800 hover:border-lime-500/30 transition-all">
              <CardContent className="p-6">
                <h3 className="text-white font-bold mb-2 flex items-start gap-3">
                  <span className="text-lime-400">Q:</span>
                  {faq.question}
                </h3>
                <p className="text-zinc-400 pl-6">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// ==================== FOOTER SECTION ====================
const FooterSection = () => {
  return (
    <footer className="py-12 bg-zinc-950 border-t border-zinc-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-lime-500 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold">Mostralo</p>
              <p className="text-zinc-500 text-sm">Tecnologia que joga no seu time.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-6 text-sm text-zinc-400">
            <a href="/termos" className="hover:text-white transition-colors">Termos de Uso</a>
            <a href="/privacidade" className="hover:text-white transition-colors">Privacidade</a>
            <a href="/suporte" className="hover:text-white transition-colors">Suporte</a>
          </div>

          <p className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} Mostralo. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

// ==================== MAIN PAGE ====================
const NichoArenasEsportivasPage = () => {
  usePageSEO({
    title: 'Sistema para Arena Esportiva | Beach Tennis, Padel, Society | Mostralo',
    description: 'Sistema completo para arenas esportivas: reserva de quadras com pagamento antecipado, comanda integrada de bar, totem de autoatendimento e WhatsApp marketing. Teste grátis.',
    keywords: 'sistema arena esportiva, reserva quadra online, beach tennis, padel, society, comanda bar esportivo, gestão centro esportivo',
  });

  return (
    <div className="min-h-screen bg-zinc-950">
      <HeroSection />
      <ProblemsSection />
      <FourPillarsSection />
      <CourtScheduleSection />
      <GroupOrderSection />
      <ROISection />
      <BookingDemoSection />
      <PlansSection />
      <FAQSection />
      <FooterSection />
    </div>
  );
};

export default NichoArenasEsportivasPage;
