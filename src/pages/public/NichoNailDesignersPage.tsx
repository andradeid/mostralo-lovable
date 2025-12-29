import { usePageSEO } from '@/hooks/useSEO';
import { WhatsAppLeadButton } from '@/components/leads/WhatsAppLeadButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
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
  Palette,
  Camera,
  Image
} from 'lucide-react';
import { useState } from 'react';
import { format, isBefore, startOfDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// ============ Hero Section ============
const HeroSection = () => (
  <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-zinc-950">
    {/* Background gradient with rose tones */}
    <div className="absolute inset-0 bg-gradient-to-br from-rose-950/30 via-zinc-950 to-zinc-950" />
    
    {/* Decorative elements */}
    <div className="absolute top-20 left-10 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl" />
    <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-3xl" />
    
    <div className="container mx-auto px-4 py-20 relative z-10">
      <div className="max-w-4xl mx-auto text-center">
        {/* Badge */}
        <Badge className="mb-6 bg-rose-500/20 text-rose-400 border-rose-500/30 px-4 py-2 text-sm">
          <Sparkles className="w-4 h-4 mr-2" />
          Sistema Completo para Nail Designers
        </Badge>
        
        {/* Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
          Sua agenda lotada.{' '}
          <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 bg-clip-text text-transparent">
            Seu estúdio organizado.
          </span>{' '}
          Seu lucro protegido.
        </h1>
        
        {/* Sub-headline */}
        <p className="text-xl md:text-2xl text-zinc-400 mb-8 max-w-3xl mx-auto">
          O ecossistema completo para Nail Designers que querem{' '}
          <strong className="text-white">profissionalizar o agendamento</strong>, 
          {' '}<strong className="text-white">eliminar as faltas</strong> e 
          {' '}<strong className="text-white">vender muito mais serviços e produtos</strong> sem esforço manual.
        </p>
        
        <p className="text-lg text-rose-400 mb-10">
          Acabe com os "bolos" e tenha clientes que voltam sempre.
        </p>
        
        {/* CTA Principal */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link to="/signup">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 transition-all duration-300 animate-pulse"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              QUERO PROFISSIONALIZAR MEU ESTÚDIO
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
        
        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 text-zinc-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-rose-500" />
            <span>Agenda 24h</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-rose-500" />
            <span>Taxa de Reserva PIX</span>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-500" />
            <span>Lembretes WhatsApp</span>
          </div>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-rose-500" />
            <span>Portfólio Integrado</span>
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
    title: 'Faltas Inesperadas',
    description: 'Cliente que marca e não aparece tira o seu pão de cada dia. Procedimento de 2-3h perdido que você não consegue preencher.',
    color: 'text-red-500'
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Infinito',
    description: 'Passar o dia respondendo "qual seu horário disponível?" e "quanto custa o alongamento?". Tempo que poderia ser na mesa.',
    color: 'text-amber-500'
  },
  {
    icon: Calculator,
    title: 'Confusão Financeira',
    description: 'Não saber quanto lucrou de verdade após pagar materiais, géis, acessórios e comissões. Dinheiro que escoa sem controle.',
    color: 'text-yellow-500'
  },
  {
    icon: Clock,
    title: 'Esquecimento de Manutenção',
    description: 'Clientes que passam do tempo da manutenção e acabam danificando as unhas. Você perde a cliente e a reputação do seu trabalho.',
    color: 'text-rose-500'
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
          Cansada de perder tempo no WhatsApp e{' '}
          <span className="text-red-500">sofrer com "vácuos" e faltas?</span>
        </h2>
        <p className="text-xl text-zinc-400">
          Valorize seu tempo, <span className="text-rose-400">ele é seu maior ativo.</span>
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {problemCards.map((problem, index) => (
          <Card 
            key={index} 
            className="bg-zinc-900/50 border-zinc-800 hover:border-rose-500/50 transition-all duration-300 hover:-translate-y-1"
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
    icon: CreditCard,
    title: 'Agendamento com Taxa de Reserva',
    subtitle: 'Fim dos "Bolos"',
    features: [
      'Cliente só confirma após pagar sinal via PIX',
      'Compromisso total com a sua hora',
      'Se faltar, você fica com o sinal',
      'Política de cancelamento configurável'
    ],
    color: 'from-orange-500 to-rose-500',
    bgColor: 'bg-orange-500/10'
  },
  {
    icon: Bell,
    title: 'Lembretes de Manutenção',
    subtitle: 'Automação Inteligente',
    features: [
      'Sistema sabe quando o alongamento vence (20 dias)',
      'Envia mensagem carinhosa no WhatsApp',
      'Lembra de agendar antes que quebre',
      'Aumenta frequência de retorno'
    ],
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-rose-500/10'
  },
  {
    icon: ShoppingBag,
    title: 'Vitrine de Produtos (Shop)',
    subtitle: 'Venda Sem Esforço',
    features: [
      'Venda óleos, cremes e acessórios no agendamento',
      'Controle seu estoque de esmaltes e géis',
      'Cliente compra junto com o serviço',
      'Aumente seu ticket médio'
    ],
    color: 'from-pink-500 to-purple-500',
    bgColor: 'bg-pink-500/10'
  },
  {
    icon: Calculator,
    title: 'Gestão de Comissões',
    subtitle: 'Erro Zero, Paz Total',
    features: [
      'Cálculo automático por profissional',
      'Serviços + produtos separados',
      'Relatórios prontos em segundos',
      'Perfeito para espaços compartilhados'
    ],
    color: 'from-purple-500 to-violet-500',
    bgColor: 'bg-purple-500/10'
  }
];

const FourPillarsSection = () => (
  <section className="py-20 bg-zinc-900">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <Badge className="mb-4 bg-rose-500/20 text-rose-400 border-rose-500/30">
          <CheckCircle className="w-4 h-4 mr-2" />
          O Método Mostralo para Nail Designers
        </Badge>
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Os 4 Pilares do{' '}
          <span className="bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 bg-clip-text text-transparent">
            Estúdio Lucrativo
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
            className="bg-zinc-950 border-zinc-800 hover:border-rose-500/50 transition-all duration-300 hover:-translate-y-2 overflow-hidden"
          >
            <div className={`h-2 bg-gradient-to-r ${pillar.color}`} />
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl ${pillar.bgColor} flex items-center justify-center`}>
                  <pillar.icon className="w-7 h-7 text-rose-500" />
                </div>
                <div>
                  <CardTitle className="text-xl text-white">{pillar.title}</CardTitle>
                  <p className="text-rose-400 text-sm font-medium">{pillar.subtitle}</p>
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

// ============ Portfolio Gallery Section ============
const portfolioImages = [
  { id: 1, emoji: '💅', style: 'Francesinha Moderna' },
  { id: 2, emoji: '✨', style: 'Glitter Degradê' },
  { id: 3, emoji: '🌸', style: 'Nail Art Floral' },
  { id: 4, emoji: '💎', style: 'Pedrarias Luxo' },
  { id: 5, emoji: '🌈', style: 'Ombré Colorido' },
  { id: 6, emoji: '🖤', style: 'Minimalista Chic' }
];

const PortfolioGallerySection = () => (
  <section className="py-20 bg-zinc-950">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-pink-500/20 text-pink-400 border-pink-500/30">
          <Camera className="w-4 h-4 mr-2" />
          Portfólio Integrado
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Suas unhas são sua <span className="text-rose-500">vitrine</span>
        </h2>
        <p className="text-zinc-400">
          Mostre seu trabalho diretamente no agendamento. Cliente vê suas artes e já marca o horário.
        </p>
      </div>
      
      {/* Gallery Grid */}
      <div className="max-w-4xl mx-auto">
        <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
          <CardHeader className="border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">Studio Nail Art</CardTitle>
                <p className="text-zinc-500 text-sm">@studionailart • Portfólio</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-2">
              {portfolioImages.map((img) => (
                <div 
                  key={img.id}
                  className="aspect-square bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-pointer border border-zinc-700 hover:border-rose-500/50"
                >
                  <span className="text-4xl mb-2">{img.emoji}</span>
                  <span className="text-zinc-400 text-xs text-center px-2">{img.style}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg">
              <p className="text-rose-400 text-sm text-center flex items-center justify-center gap-2">
                <Image className="w-4 h-4" />
                As fotos do seu trabalho aparecerão aqui para as clientes escolherem
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);

// ============ Demo Data ============
const demoServices = [
  { id: 'alongamento', name: 'Alongamento Fibra de Vidro', price: 180, duration: 120, icon: '💎' },
  { id: 'esmaltacao', name: 'Esmaltação em Gel', price: 80, duration: 60, icon: '💅' },
  { id: 'manutencao', name: 'Manutenção Completa', price: 120, duration: 90, icon: '✨', popular: true }
];

const demoProfessionals = [
  { id: 'ana', name: 'Ana Carolina', rating: 4.9, specialty: 'Nail Art & Pedrarias', avatar: '💅' },
  { id: 'juliana', name: 'Juliana Santos', rating: 4.8, specialty: 'Alongamento Fibra', avatar: '✨' },
  { id: 'carla', name: 'Carla Mendes', rating: 4.7, specialty: 'Esmaltação em Gel', avatar: '💎' }
];

const demoTimeSlots = ['09:00', '10:30', '13:00', '14:30', '16:00', '17:30'];

// ============ Interactive Booking Demo ============
const InteractiveBookingDemo = () => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const service = demoServices.find(s => s.id === selectedService);
  const professional = demoProfessionals.find(p => p.id === selectedProfessional);

  const handleConfirm = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setStep(1);
      setSelectedService(null);
      setSelectedProfessional(null);
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
    setSelectedProfessional(null);
    setSelectedDate(undefined);
    setSelectedTime(null);
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 relative overflow-hidden">
      {/* Success overlay */}
      {showSuccess && (
        <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-pink-600 flex flex-col items-center justify-center z-20 animate-fade-in">
          <CheckCircle className="w-20 h-20 text-white mb-4" />
          <p className="text-white text-2xl font-bold mb-2">Agendamento Confirmado!</p>
          <p className="text-white/80">Você receberá um lembrete no WhatsApp 💕</p>
        </div>
      )}

      <CardHeader className="border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rose-500" />
            Studio Nail Art - Agendamento
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
                    ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white"
                    : "bg-zinc-800 text-zinc-500"
                )}
              >
                {s}
              </div>
              {s < 4 && (
                <div className={cn(
                  "w-8 h-1 mx-1 transition-all",
                  step > s ? "bg-gradient-to-r from-rose-500 to-pink-500" : "bg-zinc-800"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Service Selection */}
        {step === 1 && (
          <div className="animate-fade-in">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">Escolha o Serviço</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      ? "border-rose-500"
                      : "border-transparent hover:border-rose-500/50"
                  )}
                >
                  {svc.popular && (
                    <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs">
                      Popular
                    </Badge>
                  )}
                  <div className="text-3xl mb-2">{svc.icon}</div>
                  <h4 className="text-white font-semibold">{svc.name}</h4>
                  <p className="text-zinc-400 text-sm">{svc.duration} min</p>
                  <p className="text-rose-500 font-bold mt-2">R$ {svc.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Professional Selection */}
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
              <h3 className="text-lg font-semibold text-white">Escolha a Profissional</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {demoProfessionals.map((prof) => (
                <div
                  key={prof.id}
                  onClick={() => {
                    setSelectedProfessional(prof.id);
                    setStep(3);
                  }}
                  className={cn(
                    "bg-zinc-800 rounded-xl p-4 cursor-pointer border-2 transition-all hover:-translate-y-1 text-center",
                    selectedProfessional === prof.id
                      ? "border-rose-500"
                      : "border-transparent hover:border-rose-500/50"
                  )}
                >
                  <div className="text-4xl mb-2">{prof.avatar}</div>
                  <h4 className="text-white font-semibold">{prof.name}</h4>
                  <div className="flex items-center justify-center gap-1 text-yellow-400 my-1">
                    <Star className="w-4 h-4 fill-yellow-400" />
                    <span className="text-sm">{prof.rating}</span>
                  </div>
                  <p className="text-zinc-400 text-sm">{prof.specialty}</p>
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
                    day_selected: "bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 focus:from-rose-600 focus:to-pink-600",
                    day_today: "border-2 border-rose-500/50 text-rose-400",
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
                          ? "bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white border-0"
                          : "border-zinc-700 text-zinc-300 hover:border-rose-500 hover:text-white"
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
        {step === 4 && service && professional && selectedDate && selectedTime && (
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
                  <span className="text-zinc-400">Serviço</span>
                  <span className="text-white font-semibold">{service.name}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-zinc-700">
                  <span className="text-zinc-400">Profissional</span>
                  <span className="text-white font-semibold">{professional.name}</span>
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
                  <span className="text-rose-500 font-bold text-xl">R$ {service.price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 mb-6">
              <p className="text-rose-400 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Sinal de R$ 30,00 via PIX para confirmar a vaga
              </p>
            </div>

            <Button
              onClick={handleConfirm}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-lg py-6"
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
  <section className="py-20 bg-zinc-900">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-rose-500/20 text-rose-400 border-rose-500/30">
          <Smartphone className="w-4 h-4 mr-2" />
          Teste Agora - 100% Interativo
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Experimente <span className="text-rose-500">Como a Cliente Vê</span>
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

// ============ Social Proof & ROI Section ============
const comparisonData = [
  { feature: 'Faltas por semana', manual: '3 a 5 "bolos"', mostralo: 'Quase zero (sinal PIX)' },
  { feature: 'Tempo no WhatsApp', manual: '2+ horas/dia', mostralo: '0 minutos (automático)' },
  { feature: 'Cálculo de comissões', manual: '3+ horas/semana', mostralo: '1 clique' },
  { feature: 'Manutenções esquecidas', manual: 'Clientes perdidas', mostralo: 'Lembrete automático 20 dias' },
  { feature: 'Venda de produtos', manual: 'Só no balcão', mostralo: 'Integrado ao agendamento' },
  { feature: 'Portfólio', manual: 'Só Instagram', mostralo: 'Direto no agendamento' }
];

const SocialProofSection = () => (
  <section className="py-20 bg-zinc-950">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">
          <TrendingUp className="w-4 h-4 mr-2" />
          Resultados Reais
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          O <span className="text-rose-500">Retorno do Investimento</span> é Garantido
        </h2>
        
        {/* Quote */}
        <Card className="bg-gradient-to-r from-rose-500/10 to-pink-500/10 border-rose-500/30 mb-12">
          <CardContent className="p-6">
            <p className="text-xl md:text-2xl text-white italic">
              "Transforme seu talento em uma empresa de alta performance. Tenha a tecnologia das grandes 
              esmalterias por um preço que{' '}
              <span className="text-rose-500 font-bold">cabe no seu faturamento</span>."
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Comparison Table */}
      <div className="max-w-4xl mx-auto">
        <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
          <div className="grid grid-cols-3 bg-zinc-800 border-b border-zinc-700">
            <div className="p-4 text-center font-semibold text-zinc-400">Aspecto</div>
            <div className="p-4 text-center font-semibold text-red-400 border-x border-zinc-700">
              Agenda de Papel/WhatsApp
            </div>
            <div className="p-4 text-center font-semibold text-green-400">
              Experiência Mostralo
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
    name: 'Amanda Oliveira',
    role: 'Studio Nails Luxo - São Paulo',
    image: '💅',
    text: 'Antes eu perdia 4-5 clientes por semana com no-show. Depois do Mostralo, com o sinal PIX, isso caiu pra quase zero. Só isso já me economiza R$ 800/mês em procedimentos perdidos.',
    rating: 5
  },
  {
    name: 'Fernanda Costa',
    role: 'Espaço Belle Nails - RJ',
    image: '✨',
    text: 'O lembrete de manutenção é um sonho! Minhas clientes voltam no tempo certo e não deixam as unhas danificar. Minha taxa de retorno aumentou 40%.',
    rating: 5
  },
  {
    name: 'Patricia Santos',
    role: 'Art Nail Studio - MG',
    image: '💎',
    text: 'Tenho 3 profissionais no espaço. O cálculo de comissão era meu pesadelo. Agora em 1 clique tenho tudo pronto. E ainda vendo óleos e cremes junto com o agendamento!',
    rating: 5
  }
];

const TestimonialsSection = () => (
  <section className="py-20 bg-zinc-900">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-rose-500/20 text-rose-400 border-rose-500/30">
          <Star className="w-4 h-4 mr-2" />
          Depoimentos
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          O Que <span className="text-rose-500">Nail Designers de Sucesso</span> Dizem
        </h2>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {testimonials.map((testimonial, index) => (
          <Card 
            key={index} 
            className="bg-zinc-950 border-zinc-800 hover:border-rose-500/50 transition-all"
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
                  <Star key={i} className="w-4 h-4 fill-rose-500 text-rose-500" />
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
      'Catálogo de Serviços',
      'Controle de Clientes',
      'Relatórios Básicos',
      'Portfólio Integrado'
    ],
    highlighted: false,
    cta: 'Começar Agora'
  },
  {
    name: 'Profissional',
    price: 197,
    description: 'O mais escolhido pelas Nail Designers',
    features: [
      'Tudo do Essencial +',
      'Taxa de Reserva (Sinal PIX)',
      'Lembretes de Manutenção',
      'Gestão de Comissões',
      'Vitrine de Produtos',
      'Relatórios Avançados',
      'WhatsApp Automático'
    ],
    highlighted: true,
    cta: 'Escolher Profissional'
  },
  {
    name: 'Empresarial',
    price: null,
    description: 'Para redes de esmalterias',
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
  <section className="py-20 bg-zinc-950">
    <div className="container mx-auto px-4">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-rose-500/20 text-rose-400 border-rose-500/30">
          <Gift className="w-4 h-4 mr-2" />
          Planos
        </Badge>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Escolha o plano que <span className="text-rose-500">combina com seu crescimento</span>
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
                ? 'bg-gradient-to-b from-rose-500/20 to-zinc-900 border-rose-500' 
                : 'bg-zinc-900 border-zinc-800'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-center text-sm py-1 font-semibold">
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
                    <span className="text-4xl font-bold text-rose-500">{plan.price}</span>
                    <span className="text-zinc-500">/mês</span>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-rose-500">Sob Consulta</p>
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
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white' 
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
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-lg px-10 py-6 rounded-xl shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 transition-all"
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
    question: 'Como funciona a taxa de reserva (sinal)?',
    answer: 'Você define o valor do sinal (ex: R$ 30) e quando a cliente agendar, ela paga esse valor via PIX para confirmar. Se ela faltar, você fica com o sinal. Se ela comparecer, o sinal é descontado do serviço.'
  },
  {
    question: 'A cliente pode ver meu portfólio no agendamento?',
    answer: 'Sim! Você cadastra as fotos dos seus trabalhos e elas aparecem diretamente na página de agendamento. A cliente escolhe o serviço já vendo seus resultados.'
  },
  {
    question: 'Consigo controlar estoque de esmaltes e géis?',
    answer: 'Sim! No plano Profissional você pode cadastrar todos os seus produtos, controlar o estoque e até vender óleos e cremes junto com o agendamento.'
  },
  {
    question: 'Posso usar em mais de uma profissional?',
    answer: 'Sim! Se você tem outras manicures no espaço, cada uma tem sua agenda individual e o sistema calcula a comissão automaticamente.'
  },
  {
    question: 'O lembrete de manutenção é automático mesmo?',
    answer: 'Sim! Você configura o prazo (ex: 20 dias para alongamento) e o sistema envia automaticamente uma mensagem carinhosa no WhatsApp da cliente lembrando de agendar a manutenção.'
  },
  {
    question: 'Posso testar antes de pagar?',
    answer: 'Sim! Oferecemos 7 dias grátis em todos os planos para você testar todas as funcionalidades sem compromisso e sem precisar colocar cartão de crédito.'
  }
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  return (
    <section className="py-20 bg-zinc-900">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-rose-500/20 text-rose-400 border-rose-500/30">
              <MessageSquare className="w-4 h-4 mr-2" />
              Dúvidas Frequentes
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Perguntas <span className="text-rose-500">Frequentes</span>
            </h2>
          </div>
          
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <Card 
                key={index} 
                className="bg-zinc-950 border-zinc-800 cursor-pointer hover:border-rose-500/50 transition-all"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold pr-4">{item.question}</h3>
                    {openIndex === index ? (
                      <ChevronUp className="w-5 h-5 text-rose-500 flex-shrink-0" />
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
        <Store className="w-8 h-8 text-rose-500" />
        <span className="text-2xl font-bold text-white">Mostralo</span>
      </div>
      <p className="text-zinc-400 mb-6">
        Sua arte. Sua gestão. Seu lucro. 💅
      </p>
      <div className="flex flex-wrap justify-center gap-6 text-zinc-500 text-sm">
        <Link to="/termos" className="hover:text-rose-500 transition-colors">
          Termos de Uso
        </Link>
        <Link to="/privacidade" className="hover:text-rose-500 transition-colors">
          Privacidade
        </Link>
        <Link to="/suporte" className="hover:text-rose-500 transition-colors">
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
const NichoNailDesignersPage = () => {
  usePageSEO({
    title: 'Sistema para Nail Designers | Agendamento + Taxa de Reserva + WhatsApp | Mostralo',
    description: 'Sistema completo para Nail Designers, Manicures e Esmalterias: agendamento com taxa de reserva PIX, lembretes de manutenção automáticos, gestão de comissões e venda de produtos. Teste grátis por 7 dias.',
    keywords: 'sistema nail designer, agenda manicure, software esmalteria, gestão unhas, agendamento nail art, controle comissões manicure, sistema agendamento unhas',
    image: 'https://mostralo.com.br/og-nail-designers.png'
  });

  return (
    <div className="min-h-screen bg-zinc-950">
      <HeroSection />
      <ProblemsSection />
      <FourPillarsSection />
      <PortfolioGallerySection />
      <FlowSimulatorSection />
      <SocialProofSection />
      <TestimonialsSection />
      <PlansSection />
      <FAQSection />
      <FooterSection />
      <WhatsAppLeadButton />
    </div>
  );
};

export default NichoNailDesignersPage;
