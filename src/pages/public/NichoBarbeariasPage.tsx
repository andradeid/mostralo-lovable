import { usePageSEO } from '@/hooks/useSEO';
import { WhatsAppLeadButton } from '@/components/leads/WhatsAppLeadButton';
import { MainFooter } from '@/components/MainFooter';
import { BookingConfirmation } from '@/components/booking/BookingConfirmation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Link } from 'react-router-dom';
import { 
  Scissors, Beer, Calendar, Wallet, Users, MessageSquare, Clock, Calculator,
  XCircle, CheckCircle, Smartphone, Star, ArrowRight, Store, CreditCard, Bell,
  TrendingUp, AlertTriangle, Gift, ChevronDown, ChevronUp, ChevronLeft, RotateCcw,
  Settings, BarChart3, CalendarCheck, ClipboardList, Zap, Shield, DollarSign,
  Target, Flame, Trophy, Eye, Send, Lock, BadgeCheck, Crown, Sparkles, HeartPulse,
  Monitor
} from 'lucide-react';
import { useState } from 'react';
import { format, isBefore, startOfDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const GRID_BG = "bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]";

// ============ CTA Reutilizável ============
const ConversionCTA = ({ text = "QUERO ENCHER MINHA AGENDA AGORA", variant = "primary" }: { text?: string; variant?: "primary" | "secondary" }) => (
  <div className="text-center py-8 md:py-10 px-4">
    <Link to="/signup">
      <Button 
        size="lg" 
        className={cn(
          "text-sm sm:text-lg px-6 sm:px-10 py-6 sm:py-7 rounded-xl font-bold transition-all duration-300 w-full sm:w-auto max-w-full whitespace-normal leading-tight",
          variant === "primary" 
            ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-xl shadow-red-500/25 hover:shadow-red-500/40 hover:-translate-y-0.5" 
            : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
        )}
      >
        <Zap className="w-5 h-5 mr-2 flex-shrink-0" />
        {text}
        <ArrowRight className="w-5 h-5 ml-2 flex-shrink-0" />
      </Button>
    </Link>
    <p className="text-zinc-500 text-sm mt-3">7 dias grátis • Sem cartão • Sem compromisso</p>
  </div>
);

// ============ Frase de Impacto ============
const ImpactPhrase = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("py-12 text-center", className)}>
    <p className="text-2xl md:text-3xl font-black text-zinc-400 max-w-3xl mx-auto px-4 leading-relaxed">
      {children}
    </p>
  </div>
);

// ============ 1. ATENÇÃO — HERO ============
const HeroSection = () => (
  <section className="relative min-h-screen md:min-h-[90vh] flex items-center overflow-hidden bg-zinc-950">
    <div className="absolute inset-0 bg-gradient-to-br from-orange-950/40 via-zinc-950 to-zinc-950" />
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-600/8 rounded-full blur-3xl" />
    
    <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
      <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center max-w-6xl mx-auto">
        {/* TEXTO ESQUERDA */}
        <div className="text-center lg:text-left">
          <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
            <Store className="w-8 h-8 text-orange-500" />
            <span className="text-2xl font-bold text-white">Mostralo</span>
          </div>

          <Badge className="mb-6 bg-red-500/20 text-red-400 border-red-500/30 px-4 py-2 text-sm">
            <AlertTriangle className="w-4 h-4 mr-2" />
            ISSO ESTÁ CUSTANDO CARO PRA VOCÊ
          </Badge>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1]">
            Sua agenda vazia{' '}
            <span className="text-red-500">não é falta de cliente.</span>
            <br />
            <span className="text-orange-500">É falta de sistema.</span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-zinc-300 mb-8 font-medium leading-relaxed">
            Enquanto você perde clientes, outras barbearias estão{' '}
            <strong className="text-orange-400">enchendo a agenda todos os dias</strong>.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8">
            <Link to="/signup">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg px-10 py-7 rounded-xl shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 font-bold hover:-translate-y-0.5"
              >
                <Scissors className="w-5 h-5 mr-2" />
                QUERO ENCHER MINHA AGENDA AGORA
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
          <p className="text-zinc-500 text-sm text-center lg:text-left">7 dias grátis • Sem cartão • Sem compromisso</p>
        </div>

        {/* MOCKUP DIREITA */}
        <div className="flex justify-center lg:justify-end">
          <div className="relative">
            {/* Desktop mockup */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl shadow-orange-500/10 p-1 max-w-[440px]">
              <div className="bg-zinc-800 rounded-t-xl px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 bg-zinc-700 rounded-md px-3 py-1 text-center">
                  <span className="text-zinc-400 text-xs">mostralo.com.br/barbearia-do-joao</span>
                </div>
              </div>
              <div className="bg-zinc-950 rounded-b-xl p-4 space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Scissors className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">Barbearia do João</p>
                    <p className="text-green-400 text-xs">● Agendamento aberto</p>
                  </div>
                </div>
                {/* Mini agenda */}
                <div className="space-y-2">
                  {['09:00 - Corte Degradê', '09:30 - Barba Completa', '10:00 - Corte + Barba'].map((slot, i) => (
                    <div key={i} className="flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-2 border border-zinc-800">
                      <span className="text-zinc-300 text-xs">{slot}</span>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px]">Disponível</Badge>
                    </div>
                  ))}
                  {['10:30 - Lucas M.', '11:00 - Pedro S.'].map((slot, i) => (
                    <div key={i} className="flex items-center justify-between bg-orange-500/10 rounded-lg px-3 py-2 border border-orange-500/20">
                      <span className="text-zinc-300 text-xs">{slot}</span>
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-[10px]">Agendado</Badge>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <div className="flex-1 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                    <p className="text-green-400 text-[10px] font-semibold">✅ PIX Sinal recebido</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile mockup sobreposto */}
            <div className="absolute -bottom-4 -right-6 w-[140px] bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl p-1 hidden md:block">
              <div className="bg-zinc-800 rounded-t-xl px-2 py-1.5 flex justify-center">
                <div className="w-12 h-1 bg-zinc-600 rounded-full" />
              </div>
              <div className="bg-[#0b141a] rounded-b-xl p-2 space-y-1.5">
                <div className="bg-zinc-800 rounded-lg p-2">
                  <p className="text-white text-[8px] font-semibold">✅ Agendamento confirmado!</p>
                  <p className="text-zinc-400 text-[7px] mt-1">Corte Degradê • 14:30h</p>
                </div>
                <div className="bg-amber-900/40 rounded-lg p-2">
                  <p className="text-[8px] text-white font-semibold">💳 PIX R$15,00</p>
                  <div className="bg-green-600 text-white text-center py-1 rounded text-[7px] mt-1 font-semibold">Pagar</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-16">
        {[
          { value: '0', label: 'No-show com sinal PIX', icon: Target },
          { value: '0min', label: 'Confirmando horários', icon: Clock },
          { value: '1 clique', label: 'Pra calcular comissão', icon: Calculator },
          { value: '24/7', label: 'Agenda funcionando', icon: Calendar },
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center">
            <stat.icon className="w-5 h-5 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-black text-orange-500">{stat.value}</p>
            <p className="text-zinc-400 text-xs">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
    
    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent" />
  </section>
);

// ============ 2. INTERESSE — DOR / IDENTIFICAÇÃO ============
const RealSceneSection = () => (
  <section className="py-20 bg-zinc-950 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-red-500/20 text-red-400 border-red-500/30 px-4 py-2">
            <Eye className="w-4 h-4 mr-2" />
            SE IDENTIFICOU?
          </Badge>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            Se você é barbeiro,{' '}
            <span className="text-red-500">você já passou por isso:</span>
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-12">
          {[
            'Cliente esquece o horário e não aparece',
            'Cadeira vazia no meio do dia',
            'WhatsApp lotado de "tem horário?"',
            'Agenda com buracos que ninguém preenche',
            'Fim de semana calculando comissão na mão',
            'Cliente tomou cerveja e você esqueceu de cobrar',
            'Não sabe quanto faturou no mês',
            'Trabalha muito e sobra pouco',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-red-500/40 transition-colors group">
              <div className="w-6 h-6 rounded border-2 border-red-500/50 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-red-500/20">
                <XCircle className="w-4 h-4 text-red-500 opacity-70" />
              </div>
              <p className="text-zinc-300">{item}</p>
            </div>
          ))}
        </div>

        <Card className="bg-red-500/10 border-red-500/30 max-w-3xl mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-xl md:text-2xl font-black text-white">
              Se marcou <span className="text-red-500">3 ou mais</span>, você está{' '}
              <span className="text-red-500">perdendo dinheiro todo dia</span>.
            </p>
            <p className="text-zinc-400 mt-2">
              E o pior: já se acostumou com isso.
            </p>
          </CardContent>
        </Card>

        <ConversionCTA text="QUERO PARAR DE PERDER CLIENTES" />
      </div>
    </div>
  </section>
);

// ============ Frase de impacto isolada ============
const ImpactSection1 = () => (
  <section className="bg-zinc-950 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <ImpactPhrase className="relative z-10">
      <span className="text-red-500">Cada horário vazio é dinheiro perdido.</span>
      <br />
      <span className="text-zinc-500 text-xl">E você nem percebe.</span>
    </ImpactPhrase>
  </section>
);

// ============ 3. INTERESSE — PERDA FINANCEIRA ============
const FinancialLossSection = () => (
  <section className="py-20 bg-zinc-900 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent" />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-red-500/20 text-red-400 border-red-500/30 px-4 py-2">
          <DollarSign className="w-4 h-4 mr-2" />
          FAÇA A CONTA
        </Badge>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
          Quanto dinheiro você{' '}
          <span className="text-red-500">joga fora por semana?</span>
        </h2>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
        {[
          {
            icon: XCircle,
            title: '💸 Cliente que marca e some',
            calc: '2 horários vazios/dia × R$45 × 6 dias',
            loss: 'R$ 540/semana',
            lossMonth: 'R$ 2.160/mês',
            desc: 'Cadeira vazia. Ninguém te paga por isso.',
          },
          {
            icon: Beer,
            title: '🍺 Cerveja que você esqueceu de cobrar',
            calc: '3 cervejas + 1 pomada/dia × 6 dias',
            loss: 'R$ 180/semana',
            lossMonth: 'R$ 720/mês',
            desc: 'O cara tomou, levou pomada, e saiu sem pagar.',
          },
          {
            icon: Clock,
            title: '📱 Tempo perdido respondendo WhatsApp',
            calc: '2 horas/dia × 6 dias × R$70/hora',
            loss: 'R$ 840/semana',
            lossMonth: 'R$ 3.360/mês',
            desc: 'Cada "tem horário?" é dinheiro que você não ganhou cortando.',
          },
          {
            icon: Calculator,
            title: '📊 Comissão errada = confusão',
            calc: 'Discussões + retrabalho + erros',
            loss: 'R$ 200/semana',
            lossMonth: 'R$ 800/mês',
            desc: 'Fim de semana na planilha. Sempre tem erro.',
          }
        ].map((pain, index) => (
          <Card key={index} className="bg-zinc-950/80 border-zinc-800 hover:border-red-500/50 transition-all duration-300">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-white mb-3">{pain.title}</h3>
              <p className="text-zinc-400 mb-4">{pain.desc}</p>
              <div className="bg-zinc-900 rounded-lg p-3 mb-3">
                <p className="text-zinc-500 text-xs mb-1">{pain.calc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-red-400 font-bold text-lg">{pain.loss}</span>
                  <span className="text-red-500 font-black text-xl">{pain.lossMonth}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="max-w-3xl mx-auto">
        <Card className="!bg-zinc-900 bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/30 shadow-2xl shadow-red-500/10">
          <CardContent className="p-8 text-center">
            <p className="text-3xl md:text-4xl font-black text-white mb-2">
              Total: até <span className="text-red-500">R$ 7.040/mês</span> indo embora.
            </p>
            <p className="text-xl text-zinc-300 mt-4">
              O sistema que resolve tudo isso custa menos que{' '}
              <strong className="text-white">2 cortes de cabelo</strong>.
            </p>
          </CardContent>
        </Card>
        
        <ConversionCTA text="QUERO PARAR DE PERDER DINHEIRO" />
      </div>
    </div>
  </section>
);

// ============ Frase de impacto 2 ============
const ImpactSection2 = () => (
  <section className="bg-zinc-950 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <ImpactPhrase className="relative z-10">
      Você não precisa de mais clientes.
      <br />
      <span className="text-orange-500">Precisa organizar os que já tem.</span>
    </ImpactPhrase>
  </section>
);

// ============ 4. DESEJO — SOLUÇÃO ============
const SolutionSection = () => (
  <section className="py-20 bg-zinc-950 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent" />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30 px-4 py-2">
          <Zap className="w-4 h-4 mr-2" />
          A VIRADA
        </Badge>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
          Com o Mostralo, sua barbearia{' '}
          <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            funciona no automático.
          </span>
        </h2>
        <p className="text-xl text-zinc-300 max-w-3xl mx-auto">
          Cliente agenda sozinho. Sistema confirma. PIX cobra.
          <br />
          <strong className="text-white">Você só senta e corta.</strong>
        </p>
      </div>

      {/* Resultado claro */}
      <div className="max-w-3xl mx-auto mb-16">
        <Card className="!bg-zinc-900 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/30">
          <CardContent className="p-8">
            <h3 className="text-2xl font-black text-white mb-6 text-center">Com o Mostralo você:</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                '📅 Agenda cheia todo dia',
                '🚫 Menos faltas (95% menos no-show)',
                '💰 Mais dinheiro no bolso',
                '😌 Menos dor de cabeça',
                '🍺 Zero venda esquecida',
                '📊 Comissão em 1 clique',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-white font-medium">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {[
          {
            icon: Calendar,
            title: '📅 Agenda que trabalha por você',
            subtitle: 'Cliente marca sozinho. Qualquer hora.',
            features: [
              'Link exclusivo — Instagram, Google, WhatsApp',
              'Cliente escolhe serviço, barbeiro e horário',
              'Intervalos configuráveis',
              'Bloqueia férias e folgas automaticamente',
            ],
            color: 'from-orange-500 to-amber-500',
          },
          {
            icon: CreditCard,
            title: '💰 PIX no WhatsApp do cliente',
            subtitle: 'Cobra sinal antes. Sem link. Sem QR code.',
            features: [
              'Cobrança PIX nativa pelo WhatsApp',
              'Cliente paga o sinal e garante a vaga',
              'Sem app externo, sem link suspeito',
              'No-show cai 95%',
            ],
            color: 'from-green-500 to-emerald-500',
            isNew: true,
          },
          {
            icon: Beer,
            title: '🍻 Comanda Digital + Bar',
            subtitle: 'Nunca mais esquece de cobrar.',
            features: [
              'Comanda digital por cadeira',
              'Cerveja, pomada — tudo na conta',
              'Totem de autoatendimento',
              'Controle de estoque automático',
            ],
            color: 'from-amber-500 to-yellow-500',
          },
          {
            icon: MessageSquare,
            title: '🤖 WhatsApp no automático',
            subtitle: 'Confirma, lembra, cobra e traz de volta.',
            features: [
              'Confirmação automática ao agendar',
              'Lembrete antes do horário',
              'Cobrança PIX na conversa',
              '"Cabelo Crescido" — puxa quem sumiu',
            ],
            color: 'from-emerald-500 to-teal-500',
          },
        ].map((pillar, index) => (
          <Card 
            key={index} 
            className={cn(
              "bg-zinc-900/50 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-2 overflow-hidden",
              pillar.isNew && "ring-2 ring-green-500/50"
            )}
          >
            <div className={`h-2 bg-gradient-to-r ${pillar.color}`} />
            {pillar.isNew && (
              <div className="bg-green-500 text-white text-center text-xs py-1 font-bold tracking-wider">
                🆕 EXCLUSIVO MOSTRALO
              </div>
            )}
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center">
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

      <ConversionCTA text="QUERO ORGANIZAR MINHA BARBEARIA" />
    </div>
  </section>
);

// ============ PIX no WhatsApp - Destaque ============
const PixWhatsAppSection = () => (
  <section className="py-20 bg-zinc-900 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-green-500/5" />
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30 px-4 py-2">
              <Send className="w-4 h-4 mr-2" />
              EXCLUSIVO MOSTRALO
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-6">
              PIX direto no WhatsApp.{' '}
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                Sem link. Sem QR code.
              </span>
            </h2>
            <p className="text-lg text-zinc-300 mb-6">
              O cliente agenda, o sistema cobra o sinal.
              <br />
              Pagou? Vaga garantida. Não pagou? Horário liberado.
            </p>
            
            <div className="space-y-4 mb-8">
              {[
                { icon: CalendarCheck, text: 'Agendou? Cobrança do sinal vai na hora' },
                { icon: Shield, text: 'PIX nativo do WhatsApp — confiável' },
                { icon: DollarSign, text: 'Valor fixo ou % do serviço' },
                { icon: Zap, text: 'Pagou = vaga garantida. Acabou o no-show.' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-zinc-300">{item.text}</p>
                </div>
              ))}
            </div>

            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="p-4">
                <p className="text-green-400 font-bold text-lg">
                  💡 Quem cobra sinal reduz falta em 95%.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Simulação WhatsApp */}
          <div className="flex justify-center">
            <div className="w-full max-w-[340px] bg-zinc-900 rounded-3xl border border-zinc-700 overflow-hidden shadow-2xl shadow-green-500/10">
              <div className="bg-zinc-800 px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/30 flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Barbearia do João</p>
                  <p className="text-green-400 text-xs">online</p>
                </div>
              </div>
              
              <div className="p-4 space-y-3 min-h-[320px] bg-[#0b141a]">
                <div className="bg-zinc-800 rounded-xl rounded-tl-sm p-3 max-w-[85%]">
                  <p className="text-white text-sm">
                    ✅ <strong>Agendamento confirmado!</strong>
                  </p>
                  <p className="text-zinc-300 text-sm mt-1">
                    📋 Corte Degradê + Barba<br/>
                    👤 Marcos Silva<br/>
                    📅 Sábado, 22 de Março<br/>
                    🕐 14:30h<br/>
                    💰 R$70,00
                  </p>
                  <p className="text-zinc-500 text-xs mt-2 text-right">14:32</p>
                </div>

                <div className="bg-amber-900/40 border border-amber-500/30 rounded-xl rounded-tl-sm p-3 max-w-[85%]">
                  <p className="text-white text-sm font-semibold">
                    💳 Solicitação de Pagamento
                  </p>
                  <div className="mt-2 bg-zinc-900/50 rounded-lg p-3">
                    <p className="text-zinc-300 text-xs">Sinal para garantir sua vaga</p>
                    <p className="text-2xl font-black text-green-400 mt-1">R$15,00</p>
                    <p className="text-zinc-500 text-xs mt-1">PIX • Barbearia do João</p>
                  </div>
                  <div className="mt-2 bg-green-600 text-white text-center py-2 rounded-lg text-sm font-semibold">
                    Pagar R$15,00
                  </div>
                  <p className="text-zinc-500 text-xs mt-2 text-right">14:32</p>
                </div>

                <div className="bg-green-900/30 rounded-xl rounded-tr-sm p-3 max-w-[75%] ml-auto">
                  <p className="text-white text-sm">Pronto, paguei! ✅</p>
                  <p className="text-zinc-500 text-xs mt-1 text-right">14:33</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ============ 5. DESEJO — COMPARAÇÃO ============
const BeforeAfterSection = () => (
  <section className="py-20 bg-zinc-950 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
          <Target className="w-4 h-4 mr-2" />
          VOCÊ ESCOLHE
        </Badge>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
          <span className="text-red-500">Sobreviver</span> ou{' '}
          <span className="text-green-500">lucrar?</span>
        </h2>
        <p className="text-xl text-zinc-400">A diferença é uma decisão.</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
        <Card className="bg-red-500/5 border-red-500/30 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-red-500 to-red-600" />
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <XCircle className="w-8 h-8 text-red-500" />
              <h3 className="text-2xl font-black text-red-400">Sem sistema</h3>
            </div>
            <ul className="space-y-4">
              {[
                'Preso no WhatsApp o dia todo',
                'Agenda com buracos',
                'Cliente marca e some',
                'Cerveja que ninguém cobrou',
                'Comissão errada todo mês',
                'Não sabe quanto faturou',
                'Zero controle',
                'Estresse todo dia',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-red-300">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-green-500/5 border-green-500/30 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500" />
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <h3 className="text-2xl font-black text-green-400">Com Mostralo</h3>
            </div>
            <ul className="space-y-4">
              {[
                'Cliente agenda sozinho',
                'Agenda cheia e organizada',
                'Sinal PIX = todo mundo aparece',
                'Comanda digital: tudo cobrado',
                'Comissão em 1 clique',
                'Relatórios na palma da mão',
                'Dashboard em tempo real',
                'Menos estresse, mais dinheiro',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-green-300">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-3xl mx-auto text-center">
        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-6">
            <p className="text-xl md:text-2xl text-white italic font-medium">
              "3 faltas a menos por semana + 5 pomadas vendidas pela automação ={' '}
              <span className="text-orange-500 font-black">sistema se paga 5 vezes.</span>"
            </p>
          </CardContent>
        </Card>
      </div>

      <ConversionCTA text="QUERO ORGANIZAR MINHA AGENDA" />
    </div>
  </section>
);

// ============ Demo Interativo ============
const demoServices = [
  { id: 'corte', name: 'Corte Degradê', price: 45, duration: 30, icon: '✂️' },
  { id: 'barba', name: 'Barba Completa', price: 35, duration: 20, icon: '🧔' },
  { id: 'combo', name: 'Corte + Barba', price: 70, duration: 45, icon: '💈', popular: true }
];

const demoProfessionals = [
  { id: 'marcos', name: 'Marcos Silva', rating: 4.9, specialty: 'Degradê Americano', avatar: '💈' },
  { id: 'carlos', name: 'Carlos Santos', rating: 4.8, specialty: 'Barba Vintage', avatar: '✂️' },
  { id: 'rafael', name: 'Rafael Costa', rating: 4.7, specialty: 'Corte Moderno', avatar: '💇' }
];

const demoTimeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00'];

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

  const handleBack = () => { if (step > 1) setStep(step - 1); };
  const handleReset = () => { setStep(1); setSelectedService(null); setSelectedProfessional(null); setSelectedDate(undefined); setSelectedTime(null); };

  return (
    <Card className="bg-zinc-900 border-zinc-800 relative overflow-hidden">
      {showSuccess && service && professional && selectedDate && selectedTime && (
        <BookingConfirmation
          variant="overlay"
          theme="dark"
          store={{ name: 'Barbearia do João' }}
          service={{ name: service.name, price: service.price, duration_minutes: service.duration }}
          professional={{ name: professional.name }}
          date={selectedDate}
          time={selectedTime}
        />
      )}

      <CardHeader className="border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            Agendamento Online - Barbearia do João
          </CardTitle>
          {step > 1 && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-zinc-400 hover:text-white">
              <RotateCcw className="w-4 h-4 mr-1" /> Reiniciar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all", step >= s ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-500")}>{s}</div>
              {s < 4 && <div className={cn("w-8 h-1 mx-1 transition-all", step > s ? "bg-orange-500" : "bg-zinc-800")} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="animate-fade-in">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">Escolha o Serviço</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {demoServices.map((svc) => (
                <div key={svc.id} onClick={() => { setSelectedService(svc.id); setStep(2); }} className={cn("relative bg-zinc-800 rounded-xl p-4 cursor-pointer border-2 transition-all hover:-translate-y-1", selectedService === svc.id ? "border-orange-500" : "border-transparent hover:border-orange-500/50")}>
                  {svc.popular && <Badge className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs">Popular</Badge>}
                  <div className="text-3xl mb-2">{svc.icon}</div>
                  <h4 className="text-white font-semibold">{svc.name}</h4>
                  <p className="text-zinc-400 text-sm">{svc.duration} min</p>
                  <p className="text-orange-500 font-bold mt-2">R$ {svc.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="sm" onClick={handleBack} className="text-zinc-400 hover:text-white"><ChevronLeft className="w-4 h-4" /> Voltar</Button>
              <h3 className="text-lg font-semibold text-white">Escolha o Barbeiro</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {demoProfessionals.map((prof) => (
                <div key={prof.id} onClick={() => { setSelectedProfessional(prof.id); setStep(3); }} className={cn("bg-zinc-800 rounded-xl p-4 cursor-pointer border-2 transition-all hover:-translate-y-1 text-center", selectedProfessional === prof.id ? "border-orange-500" : "border-transparent hover:border-orange-500/50")}>
                  <div className="text-4xl mb-2">{prof.avatar}</div>
                  <h4 className="text-white font-semibold">{prof.name}</h4>
                  <div className="flex items-center justify-center gap-1 text-yellow-400 my-1">
                    <Star className="w-4 h-4 fill-yellow-400" /><span className="text-sm">{prof.rating}</span>
                  </div>
                  <p className="text-zinc-400 text-sm">{prof.specialty}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="sm" onClick={handleBack} className="text-zinc-400 hover:text-white"><ChevronLeft className="w-4 h-4" /> Voltar</Button>
              <h3 className="text-lg font-semibold text-white">Escolha Data e Horário</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex justify-center">
                <CalendarComponent
                  mode="single" selected={selectedDate}
                  onSelect={(date) => { setSelectedDate(date); setSelectedTime(null); }}
                  locale={ptBR}
                  disabled={(date) => isBefore(date, startOfDay(new Date())) || isBefore(addDays(new Date(), 30), date)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg pointer-events-auto"
                  classNames={{ day_selected: "bg-orange-500 text-white hover:bg-orange-600 focus:bg-orange-600", day_today: "border-2 border-orange-500/50 text-orange-400", nav_button: "text-zinc-400 hover:text-white hover:bg-zinc-700", caption: "text-white", head_cell: "text-zinc-400", cell: "text-zinc-300", day: "hover:bg-zinc-700 text-zinc-300", day_outside: "text-zinc-600", day_disabled: "text-zinc-600 opacity-50" }}
                />
              </div>
              <div>
                <p className="text-zinc-400 text-sm mb-3">{selectedDate ? `Horários para ${format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}` : 'Selecione uma data primeiro'}</p>
                <div className="grid grid-cols-2 gap-2">
                  {demoTimeSlots.map((time) => (
                    <Button key={time} variant={selectedTime === time ? "default" : "outline"} disabled={!selectedDate} onClick={() => { setSelectedTime(time); setStep(4); }} className={cn("text-sm", selectedTime === time ? "bg-orange-500 hover:bg-orange-600 text-white" : "border-zinc-700 text-zinc-300 hover:border-orange-500 hover:text-white")}>{time}</Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 4 && service && professional && selectedDate && selectedTime && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="sm" onClick={handleBack} className="text-zinc-400 hover:text-white"><ChevronLeft className="w-4 h-4" /> Voltar</Button>
              <h3 className="text-lg font-semibold text-white">Confirmar Agendamento</h3>
            </div>
            <div className="bg-zinc-800 rounded-xl p-6 mb-6">
              <div className="space-y-4">
                {[
                  ['Serviço', service.name],
                  ['Barbeiro', professional.name],
                  ['Data', format(selectedDate, "dd 'de' MMMM", { locale: ptBR })],
                  ['Horário', selectedTime],
                ].map(([label, value], i) => (
                  <div key={i} className="flex items-center justify-between pb-3 border-b border-zinc-700">
                    <span className="text-zinc-400">{label}</span>
                    <span className="text-white font-semibold">{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Valor</span>
                  <span className="text-orange-500 font-bold text-xl">R$ {service.price.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
              <p className="text-green-400 text-sm flex items-center gap-2">
                <Send className="w-4 h-4" />
                Cobrança PIX de R$10,00 será enviada no seu WhatsApp para garantir a vaga
              </p>
            </div>
            <Button onClick={handleConfirm} className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg py-6">
              <CheckCircle className="w-5 h-5 mr-2" /> Confirmar Agendamento
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============ Seção Demo ============
const FlowSimulatorSection = () => {
  const [activeTab, setActiveTab] = useState<'agenda' | 'comanda'>('agenda');
  const comandaItems = [
    { name: 'Corte Degradê', price: 45.00, qty: 1 },
    { name: 'Barba Completa', price: 35.00, qty: 1 },
    { name: 'Heineken 600ml', price: 12.00, qty: 2 },
    { name: 'Pomada Matte', price: 45.00, qty: 1 }
  ];
  const total = comandaItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  
  return (
    <section className="py-20 bg-zinc-900 relative overflow-hidden">
      <div className={`absolute inset-0 ${GRID_BG}`} />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
            <Eye className="w-4 h-4 mr-2" />
            VEJA FUNCIONANDO
          </Badge>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Teste agora. <span className="text-orange-500">É real.</span>
          </h2>
          <p className="text-zinc-400">Clique e navegue — é exatamente assim que seu cliente vai ver.</p>
        </div>
        
        <div className="flex justify-center gap-4 mb-8">
          <Button variant={activeTab === 'agenda' ? 'default' : 'outline'} onClick={() => setActiveTab('agenda')} className={activeTab === 'agenda' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-orange-500'}>
            <Calendar className="w-4 h-4 mr-2" /> Agendamento
          </Button>
          <Button variant={activeTab === 'comanda' ? 'default' : 'outline'} onClick={() => setActiveTab('comanda')} className={activeTab === 'comanda' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'border-zinc-700 text-zinc-400 hover:text-white hover:border-orange-500'}>
            <Beer className="w-4 h-4 mr-2" /> Comanda
          </Button>
        </div>
        
        <div className="max-w-3xl mx-auto">
          {activeTab === 'agenda' ? (
            <InteractiveBookingDemo />
          ) : (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="border-b border-zinc-800">
                <CardTitle className="text-white flex items-center gap-2">
                  <Store className="w-5 h-5 text-orange-500" /> Comanda #127 - Cadeira 3
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {comandaItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-300">{item.name}</span>
                        {item.qty > 1 && <Badge className="bg-zinc-800 text-zinc-400 text-xs">x{item.qty}</Badge>}
                      </div>
                      <span className="text-white font-semibold">R$ {(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-700">
                  <span className="text-xl font-bold text-white">Total</span>
                  <span className="text-2xl font-black text-orange-500">R$ {total.toFixed(2)}</span>
                </div>
                <p className="text-green-400 text-sm mt-4 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Tudo registrado. Zero esquecimento.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <ConversionCTA text="COMEÇAR AGORA NO WHATSAPP" />
      </div>
    </section>
  );
};

// ============ 6. PROVA SOCIAL ============
const SocialProofSection = () => (
  <section className="py-20 bg-zinc-950 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-2">
          <Star className="w-4 h-4 mr-2" />
          QUEM USA, FALA
        </Badge>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
          Resultado real.{' '}
          <span className="text-orange-500">De barbeiro pra barbeiro.</span>
        </h2>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
        {[
          { 
            name: 'João Silva', 
            role: 'Barbearia do João - SP', 
            emoji: '👨‍🦱', 
            text: 'Perdia 4-5 clientes por semana. Com o sinal PIX, caiu pra ZERO.',
            highlight: 'R$0 de no-show/mês'
          },
          { 
            name: 'Carlos Mendes', 
            role: 'Barber House - RJ', 
            emoji: '🧔', 
            text: 'Comissão era meu pesadelo. Agora 1 clique e pronto. Comanda digital? Nunca mais esqueci uma cerveja.',
            highlight: 'Comissão em 1 clique'
          },
          { 
            name: 'Pedro Costa', 
            role: 'Vintage Barber - MG', 
            emoji: '👤', 
            text: 'O lembrete "Cabelo Crescido" é genial. Meus clientes voltam mais rápido.',
            highlight: '+30% visitas recorrentes'
          },
        ].map((t, i) => (
          <Card key={i} className="bg-zinc-900/50 border-zinc-800 hover:border-orange-500/50 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">{t.emoji}</div>
                <div>
                  <p className="text-white font-semibold">{t.name}</p>
                  <p className="text-zinc-500 text-sm">{t.role}</p>
                </div>
              </div>
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-orange-500 text-orange-500" />)}
              </div>
              <p className="text-zinc-300 italic mb-4">"{t.text}"</p>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                {t.highlight}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {[
          { value: '95%', label: 'Menos faltas', icon: Target },
          { value: '2h', label: 'Economizadas/dia', icon: Clock },
          { value: '+30%', label: 'Ticket médio maior', icon: TrendingUp },
          { value: 'R$0', label: 'Vendas esquecidas', icon: DollarSign },
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
            <stat.icon className="w-6 h-6 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-black text-orange-500">{stat.value}</p>
            <p className="text-zinc-500 text-xs">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ============ 7. PRÓXIMO NÍVEL ============
const StatusSection = () => (
  <section className="py-20 bg-zinc-900 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent" />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-2">
          <Crown className="w-4 h-4 mr-2" />
          ALÉM DO CORTE
        </Badge>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
          Não é só sistema.{' '}
          <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            É outro nível de barbearia.
          </span>
        </h2>
        <p className="text-xl text-zinc-300">
          Seu cliente percebe. Sua equipe percebe. Seu bolso percebe.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {[
          { icon: BadgeCheck, title: 'Atendimento profissional', desc: 'Confirmação automática, lembrete. Cliente nota a diferença.', color: 'text-orange-500' },
          { icon: Shield, title: 'Cliente respeita seu horário', desc: 'Pagou sinal? Aparece. Acabou o no-show.', color: 'text-green-500' },
          { icon: HeartPulse, title: 'Menos estresse', desc: 'Chega de WhatsApp, planilha e calculadora.', color: 'text-violet-500' },
          { icon: TrendingUp, title: 'Controle total', desc: 'Sabe quanto faturou, quanto cada barbeiro produziu.', color: 'text-blue-500' },
        ].map((item, i) => (
          <Card key={i} className="bg-zinc-950/80 border-zinc-800 hover:border-orange-500/50 transition-all hover:-translate-y-1 text-center">
            <CardContent className="p-6">
              <item.icon className={`w-12 h-12 ${item.color} mx-auto mb-4`} />
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-zinc-400 text-sm">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

// ============ Clube de Assinaturas ============
const SubscriptionClubSection = () => (
  <section className="py-20 bg-zinc-950 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-violet-500/20 text-violet-400 border-violet-500/30 px-4 py-2">
          <Trophy className="w-4 h-4 mr-2" />
          DINHEIRO GARANTIDO
        </Badge>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
          Receita todo mês.{' '}
          <span className="bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
            Antes do mês começar.
          </span>
        </h2>
        <p className="text-xl text-zinc-300">
          Crie planos tipo <strong className="text-white">"Corte Ilimitado R$149/mês"</strong>.
          <br />
          Seu caixa previsível. Todo mês.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
        {[
          {
            icon: CreditCard,
            title: 'Monte seus planos',
            desc: 'Defina preço, serviços, limite de uso.',
            color: 'from-violet-500 to-purple-500',
          },
          {
            icon: CalendarCheck,
            title: 'Agenda reconhece',
            desc: 'Assinante agendou? Sistema identifica automaticamente.',
            color: 'from-purple-500 to-pink-500',
          },
          {
            icon: TrendingUp,
            title: 'Dinheiro previsível',
            desc: '50 assinantes × R$149 = R$7.450 garantidos.',
            color: 'from-pink-500 to-rose-500',
          },
        ].map((item, i) => (
          <Card key={i} className="bg-zinc-900/50 border-zinc-800 hover:border-violet-500/50 transition-all hover:-translate-y-1 overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${item.color}`} />
            <CardContent className="p-6">
              <item.icon className="w-10 h-10 text-violet-500 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-zinc-400 text-sm">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="max-w-md mx-auto">
        <Card className="!bg-zinc-900 bg-gradient-to-br from-violet-500/20 to-purple-500/20 border-violet-500/50 overflow-hidden">
          <CardContent className="p-6 text-center">
            <Badge className="mb-4 bg-violet-500 text-white border-0">EXEMPLO</Badge>
            <h3 className="text-2xl font-bold text-white mb-2">Plano Corte Ilimitado</h3>
            <p className="text-zinc-400 mb-4">Corte degradê quantas vezes quiser no mês</p>
            <div className="flex items-baseline justify-center gap-1 mb-4">
              <span className="text-zinc-500">R$</span>
              <span className="text-5xl font-black text-violet-400">149</span>
              <span className="text-zinc-500">/mês</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span>Cliente corta quando quiser!</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);

// ============ 8. AÇÃO — PLANOS ============
const PlansSection = () => (
  <section className="py-20 bg-zinc-950 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
          <Gift className="w-4 h-4 mr-2" />
          ESCOLHA SEU PLANO
        </Badge>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
          Quanto custa <span className="text-red-500">continuar perdendo dinheiro?</span>
        </h2>
        <p className="text-xl text-zinc-400">
          Menos que <strong className="text-white">2 cortes de cabelo</strong>. 
          Devolve <strong className="text-orange-400">20x mais</strong>.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {[
          {
            name: 'Essencial', price: 97, desc: 'Pra começar a organizar',
            features: ['Agenda Online 24h', 'PDV Básico', 'Catálogo de Serviços', 'Controle de Clientes', 'Relatórios Básicos'],
            highlighted: false, cta: 'Começar Agora'
          },
          {
            name: 'Profissional', price: 197, desc: 'O favorito dos barbeiros',
            features: ['Tudo do Essencial +', 'WhatsApp Automático', 'PIX no WhatsApp do cliente', 'Comissões automáticas', 'Comanda de Bar', 'Sinal PIX anti no-show', 'Automação "Cabelo Crescido"', 'Clube de Assinaturas', 'Avaliações automáticas'],
            highlighted: true, cta: 'QUERO MINHA AGENDA CHEIA'
          },
          {
            name: 'Empresarial', price: null, desc: 'Pra redes e franquias',
            features: ['Tudo do Profissional +', 'Múltiplas Unidades', 'Gestão Centralizada', 'Relatórios Consolidados', 'API para Integrações', 'Suporte Prioritário', 'Onboarding Dedicado'],
            highlighted: false, cta: 'Falar com Consultor'
          },
        ].map((plan, i) => (
          <Card key={i} className={cn("relative overflow-hidden transition-all hover:-translate-y-2", plan.highlighted ? "bg-gradient-to-b from-orange-500/20 to-zinc-900 border-orange-500 ring-2 ring-orange-500/50" : "bg-zinc-900 border-zinc-800")}>
            {plan.highlighted && <div className="absolute top-0 left-0 right-0 bg-orange-500 text-white text-center text-sm py-1 font-bold">⚡ MAIS POPULAR</div>}
            <CardContent className={cn("p-6", plan.highlighted && "pt-10")}>
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-zinc-400 text-sm mb-4">{plan.desc}</p>
              <div className="mb-6">
                {plan.price ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-zinc-500">R$</span>
                    <span className="text-4xl font-black text-orange-500">{plan.price}</span>
                    <span className="text-zinc-500">/mês</span>
                  </div>
                ) : <p className="text-2xl font-bold text-orange-500">Sob Consulta</p>}
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-zinc-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup">
                <Button className={cn("w-full font-bold py-6", plan.highlighted ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg shadow-lg shadow-orange-500/25" : "bg-zinc-800 hover:bg-zinc-700 text-white")}>{plan.cta}</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

// ============ 9. URGÊNCIA ============
const UrgencySection = () => (
  <section className="py-16 bg-zinc-900 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-orange-500/10" />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <Flame className="w-12 h-12 text-orange-500 mx-auto" />
        <h2 className="text-3xl md:text-4xl font-black text-white">
          Enquanto você pensa,{' '}
          <span className="text-orange-500">outro barbeiro já tá lotando.</span>
        </h2>
        <p className="text-xl text-zinc-300">
          Quem organiza primeiro, <strong className="text-white">fatura primeiro</strong>. 
          <br />
          Cada dia sem sistema é dinheiro que <strong className="text-red-400">não volta</strong>.
        </p>
        <ConversionCTA text="QUERO PARAR DE PERDER CLIENTES" />
      </div>
    </div>
  </section>
);

// ============ FAQ ============
const faqItems = [
  { q: 'Preciso de celular novo?', a: 'Não. Funciona no navegador, em qualquer dispositivo. Celular, tablet ou computador.' },
  { q: 'Como funciona o PIX no WhatsApp?', a: 'Quando o cliente agenda, o sistema envia uma cobrança PIX nativa direto no WhatsApp dele. Ele paga com 1 toque. Você configura: valor fixo ou porcentagem do serviço.' },
  { q: 'Funciona com vários barbeiros?', a: 'Sim. Cada barbeiro tem agenda individual, comissão automática e relatórios próprios.' },
  { q: 'O cliente precisa baixar app?', a: 'Não. Ele acessa o link, escolhe horário e pronto. Confirmação e lembrete vão pelo WhatsApp.' },
  { q: 'Posso testar antes?', a: '7 dias grátis. Sem cartão. Sem compromisso. Teste tudo.' },
  { q: 'Como funciona o Clube de Assinaturas?', a: 'Você cria planos tipo "Corte Ilimitado R$149/mês". Cliente paga mensalmente e agenda quantas vezes quiser. Sistema reconhece automaticamente. Receita recorrente garantida.' },
  { q: 'E se eu tiver mais de uma unidade?', a: 'Plano Empresarial suporta múltiplas unidades com gestão centralizada e relatórios consolidados.' },
  { q: 'Quanto tempo leva pra configurar?', a: 'Menos de 30 minutos. Cadastre serviços, barbeiros e horários. Compartilhe o link e comece.' },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  
  return (
    <section className="py-20 bg-zinc-950 relative overflow-hidden">
      <div className={`absolute inset-0 ${GRID_BG}`} />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white">
              Dúvidas? <span className="text-orange-500">Respondo aqui.</span>
            </h2>
          </div>
          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <Card key={index} className="bg-zinc-900 border-zinc-800 cursor-pointer hover:border-orange-500/50 transition-all" onClick={() => setOpenIndex(openIndex === index ? null : index)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold pr-4">{item.q}</h3>
                    {openIndex === index ? <ChevronUp className="w-5 h-5 text-orange-500 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-zinc-500 flex-shrink-0" />}
                  </div>
                  {openIndex === index && <p className="text-zinc-400 mt-4 pt-4 border-t border-zinc-800">{item.a}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// ============ 10. FECHAMENTO ============
const ClosingSection = () => (
  <section className="py-24 bg-zinc-900 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent" />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
          O problema não é falta de cliente.
          <br />
          <span className="text-red-500">É falta de sistema.</span>
        </h2>
        
        <p className="text-2xl text-zinc-300 font-medium">
          E você resolve isso agora.
        </p>

        <div className="pt-6">
          <Link to="/signup">
            <Button size="lg" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xl px-14 py-8 rounded-xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 font-black hover:-translate-y-1">
              <Gift className="w-6 h-6 mr-3" />
              COMEÇAR AGORA — 7 DIAS GRÁTIS
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </Link>
          <p className="text-zinc-500 text-sm mt-4">Sem cartão. Cancele quando quiser. Sem pegadinha.</p>
        </div>
      </div>
    </div>
  </section>
);


// ============ PÁGINA PRINCIPAL ============
const NichoBarbeariasPage = () => {
  usePageSEO({
    title: 'Sistema para Barbearias | Agenda + PIX no WhatsApp + Comanda | Mostralo',
    description: 'Sistema completo para barbearias: agendamento online 24h, cobrança PIX direto no WhatsApp, comanda digital, comissões automáticas e clube de assinaturas. Teste grátis 7 dias.',
    keywords: 'sistema barbearia, agenda barbearia, pix whatsapp barbearia, software barbershop, gestão barbearia, comanda bar barbearia, clube assinatura barbearia',
    image: 'https://mostralo.com.br/og-barbearia.png'
  });

  return (
    <div className="min-h-screen bg-zinc-950">
      <HeroSection />
      <RealSceneSection />
      <ImpactSection1 />
      <FinancialLossSection />
      <ImpactSection2 />
      <SolutionSection />
      <PixWhatsAppSection />
      <BeforeAfterSection />
      <FlowSimulatorSection />
      <SocialProofSection />
      <StatusSection />
      <SubscriptionClubSection />
      <PlansSection />
      <UrgencySection />
      <FAQSection />
      <ClosingSection />
      <MainFooter variant="dark" />
      <WhatsAppLeadButton />
    </div>
  );
};

export default NichoBarbeariasPage;
