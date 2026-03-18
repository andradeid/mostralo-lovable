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
  Target, Flame, Trophy, Eye, Send, Lock, BadgeCheck, Crown, Sparkles, HeartPulse
} from 'lucide-react';
import { useState } from 'react';
import { format, isBefore, startOfDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const GRID_BG = "bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]";

// ============ 1. HEADLINE COM DOR + VILÃO ============
const HeroSection = () => (
  <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-zinc-950">
    <div className="absolute inset-0 bg-gradient-to-br from-orange-950/40 via-zinc-950 to-zinc-950" />
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
    <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-600/8 rounded-full blur-3xl" />
    
    <div className="container mx-auto px-4 py-20 relative z-10">
      <div className="max-w-5xl mx-auto text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Store className="w-10 h-10 text-orange-500" />
          <span className="text-3xl font-bold text-white">Mostralo</span>
        </div>

        <Badge className="mb-6 bg-red-500/20 text-red-400 border-red-500/30 px-4 py-2 text-sm">
          <AlertTriangle className="w-4 h-4 mr-2" />
          ALERTA: VOCÊ ESTÁ PERDENDO DINHEIRO TODOS OS DIAS
        </Badge>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-[1.1]">
          O maior ladrão de dinheiro da sua barbearia{' '}
          <span className="text-red-500">não é o aluguel…</span>
          <br />
          <span className="text-orange-500">é a agenda bagunçada.</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-zinc-300 mb-4 max-w-3xl mx-auto font-medium">
          Enquanto você lê isso, algum cliente marcou e <strong className="text-red-400">não vai aparecer</strong>.
          Outro mandou mensagem e <strong className="text-red-400">você nem viu</strong>.
          E aquele que veio? Tomou cerveja e você <strong className="text-red-400">esqueceu de cobrar</strong>.
        </p>
        
        <p className="text-lg md:text-xl text-orange-400 mb-10 font-bold">
          Isso tem nome: desorganização. E ela custa caro. Muito caro.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link to="/signup">
            <Button 
              size="lg" 
              className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-10 py-7 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 font-bold"
            >
              <Scissors className="w-5 h-5 mr-2" />
              QUERO PARAR DE PERDER DINHEIRO
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-zinc-500 text-sm">7 dias grátis • Sem cartão • Sem compromisso</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { value: '0', label: 'No-show com sinal PIX', icon: Target },
            { value: '0min', label: 'Confirmando horários', icon: Clock },
            { value: '1 clique', label: 'Pra calcular comissão', icon: Calculator },
            { value: '24/7', label: 'Agenda funcionando', icon: Calendar },
          ].map((stat, i) => (
            <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
              <stat.icon className="w-5 h-5 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-black text-orange-500">{stat.value}</p>
              <p className="text-zinc-400 text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
    
    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent" />
  </section>
);

// ============ 2. CENA REAL (IDENTIFICAÇÃO) ============
const RealSceneSection = () => (
  <section className="py-20 bg-zinc-950 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-red-500/20 text-red-400 border-red-500/30 px-4 py-2">
            <Eye className="w-4 h-4 mr-2" />
            ESPELHO DA REALIDADE
          </Badge>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            Se isso acontece com você…{' '}
            <span className="text-red-500">você tem um problema.</span>
          </h2>
          <p className="text-xl text-zinc-400">
            Marque quantos desses são sua rotina:
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-12">
          {[
            'Cliente manda mensagem e você demora pra responder',
            'Você esquece de confirmar horário e o cara não aparece',
            'Cliente marca e some — cadeira vazia, dinheiro perdido',
            'Agenda fica com buracos no meio do dia',
            'Você perde atendimento sem nem perceber',
            'Final de semana: 3 horas calculando comissão na planilha',
            'Cliente tomou cerveja e você esqueceu de anotar',
            'Não sabe quantos clientes atendeu no mês',
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
              Se você marcou <span className="text-red-500">3 ou mais</span>, a desorganização está te custando{' '}
              <span className="text-red-500">milhares de reais todo mês</span>.
            </p>
            <p className="text-zinc-400 mt-2">
              E o pior: você já se acostumou com isso.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);

// ============ 3. PERDA FINANCEIRA (IMPACTO) ============
const FinancialLossSection = () => (
  <section className="py-20 bg-zinc-900 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent" />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-red-500/20 text-red-400 border-red-500/30 px-4 py-2">
          <DollarSign className="w-4 h-4 mr-2" />
          CHOQUE DE REALIDADE
        </Badge>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
          Veja quanto você está{' '}
          <span className="text-red-500">perdendo por semana:</span>
        </h2>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12">
        {[
          {
            icon: XCircle,
            title: '💸 No-show: "Marcou e não veio"',
            calc: '2 horários vazios/dia × R$45 × 6 dias',
            loss: 'R$ 540/semana',
            lossMonth: 'R$ 2.160/mês',
            desc: 'O cliente marca, some, e você fica com a cadeira vazia. Ninguém te paga por isso.',
          },
          {
            icon: Beer,
            title: '🍺 Vendas esquecidas no bar',
            calc: '3 cervejas + 1 pomada esquecidas/dia × 6 dias',
            loss: 'R$ 180/semana',
            lossMonth: 'R$ 720/mês',
            desc: 'O cara tomou cerveja, levou pomada, e você só lembrou depois que ele já tava no carro.',
          },
          {
            icon: Clock,
            title: '📱 Tempo perdido no WhatsApp',
            calc: '2 horas/dia × 6 dias × R$70/hora',
            loss: 'R$ 840/semana',
            lossMonth: 'R$ 3.360/mês',
            desc: 'Respondendo "Que horário tem?" em vez de estar cortando cabelo e faturando.',
          },
          {
            icon: Calculator,
            title: '📊 Erros de comissão',
            calc: 'Discussões + retrabalho + erros',
            loss: 'R$ 200/semana',
            lossMonth: 'R$ 800/mês',
            desc: 'Fim de semana na planilha, sempre tem erro, sempre tem discussão com a equipe.',
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
        <Card className="bg-gradient-to-r from-red-500/20 to-red-600/20 border-red-500/40 shadow-2xl shadow-red-500/10">
          <CardContent className="p-8 text-center">
            <p className="text-3xl md:text-4xl font-black text-white mb-2">
              Total: até <span className="text-red-500">R$ 7.040/mês</span> indo embora.
            </p>
            <p className="text-xl text-zinc-300 mt-4">
              E o sistema que resolve tudo isso custa menos que{' '}
              <strong className="text-white">2 cortes de cabelo</strong>.
            </p>
            <div className="mt-6">
              <Link to="/signup">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-6 text-lg rounded-xl">
                  QUERO PARAR DE PERDER DINHEIRO
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </section>
);

// ============ 4. APRESENTAÇÃO DO MOSTRALO (MÁQUINA DE DINHEIRO) ============
const SolutionSection = () => (
  <section className="py-20 bg-zinc-950 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent" />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30 px-4 py-2">
          <Zap className="w-4 h-4 mr-2" />
          A VIRADA DE CHAVE
        </Badge>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
          O problema não é falta de cliente.{' '}
          <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            É falta de sistema.
          </span>
        </h2>
        <p className="text-xl text-zinc-300 max-w-3xl mx-auto">
          O Mostralo não é "mais um software". É uma{' '}
          <strong className="text-orange-400">máquina que organiza sua agenda e transforma horários vazios em dinheiro</strong>.
          Cliente agenda sozinho, paga sinal PIX pelo WhatsApp, recebe lembrete automático.
          Você só senta e corta.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {[
          {
            icon: Calendar,
            title: '📅 Agenda Inteligente 24h',
            subtitle: 'Seu cliente marca sozinho, a qualquer hora',
            features: [
              'Link exclusivo da sua barbearia — Instagram, Google, WhatsApp',
              'Cliente escolhe serviço, barbeiro, dia e horário sem te ligar',
              'Intervalos configuráveis (15, 30, 45 ou 60 min)',
              'Bloqueio automático de férias, feriados e folgas',
            ],
            color: 'from-orange-500 to-amber-500',
          },
          {
            icon: CreditCard,
            title: '💰 PIX Direto no WhatsApp',
            subtitle: 'NOVO! Cobrança nativa — sem link, sem QR code',
            features: [
              'Envia cobrança PIX nativa pelo WhatsApp do cliente',
              'Sinal de agendamento: cliente paga e garante a vaga',
              'Sem app externo, sem link suspeito — PIX oficial',
              'Reduz no-show em até 95% com compromisso financeiro',
            ],
            color: 'from-green-500 to-emerald-500',
            isNew: true,
          },
          {
            icon: Beer,
            title: '🍻 Comanda Digital + Bar',
            subtitle: 'Nunca mais esqueça de cobrar uma cerveja',
            features: [
              'Comanda digital por cadeira — tudo registrado',
              'Venda produtos (pomadas, shampoos, etc.)',
              'Totem de autoatendimento',
              'Controle de estoque automático',
            ],
            color: 'from-amber-500 to-yellow-500',
          },
          {
            icon: MessageSquare,
            title: '🤖 WhatsApp Automático',
            subtitle: 'Confirma, lembra, cobra e reconquista',
            features: [
              'Confirmação automática ao agendar',
              'Lembrete configurável antes do horário',
              'Cobrança PIX direto na conversa',
              '"Cabelo Crescido" — recupera quem sumiu há 20+ dias',
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
                🆕 FUNCIONALIDADE EXCLUSIVA MOSTRALO
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
              Cobrança PIX{' '}
              <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                direto no WhatsApp
              </span>{' '}
              do cliente
            </h2>
            <p className="text-lg text-zinc-300 mb-6">
              Esqueça links externos, QR codes confusos ou apps de pagamento. 
              O Mostralo envia uma <strong className="text-white">cobrança PIX nativa</strong> direto na conversa do WhatsApp.
            </p>
            
            <div className="space-y-4 mb-8">
              {[
                { icon: CalendarCheck, text: 'Cliente agendou? Cobrança do sinal vai automaticamente' },
                { icon: Shield, text: 'PIX nativo do WhatsApp — sem link suspeito' },
                { icon: DollarSign, text: 'Você define: valor fixo (R$10,00) ou % do serviço' },
                { icon: Zap, text: 'Pagamento confirmado = vaga garantida. Sem no-show.' },
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
                  💡 Resultado: barbearias que cobram sinal reduzem no-show em até 95%.
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

// ============ 5. ANTES vs DEPOIS (AGRESSIVO) ============
const BeforeAfterSection = () => (
  <section className="py-20 bg-zinc-950 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
          <Target className="w-4 h-4 mr-2" />
          A DIFERENÇA É BRUTAL
        </Badge>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
          A diferença entre <span className="text-red-500">sobreviver</span> e{' '}
          <span className="text-green-500">lucrar</span>
        </h2>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
        {/* SEM MOSTRALO */}
        <Card className="bg-red-500/5 border-red-500/30 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-red-500 to-red-600" />
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <XCircle className="w-8 h-8 text-red-500" />
              <h3 className="text-2xl font-black text-red-400">Sem Mostralo</h3>
            </div>
            <ul className="space-y-4">
              {[
                'Cliente esperando resposta no WhatsApp',
                'Agenda bagunçada, com buracos o dia todo',
                'Horários vazios por no-show',
                'Perda de dinheiro com vendas esquecidas',
                'Comissão errada, equipe insatisfeita',
                'Não sabe quantos clientes atendeu',
                'Zero controle sobre faturamento',
                'Estresse e caos todo dia',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-red-300">
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* COM MOSTRALO */}
        <Card className="bg-green-500/5 border-green-500/30 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500" />
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <h3 className="text-2xl font-black text-green-400">Com Mostralo</h3>
            </div>
            <ul className="space-y-4">
              {[
                'Cliente agenda sozinho, qualquer hora',
                'Agenda organizada e sem buracos',
                'Pagamento antecipado via PIX no WhatsApp',
                'Comanda digital: tudo registrado',
                'Comissão automática em 1 clique',
                'Relatórios completos de atendimentos',
                'Dashboard com faturamento em tempo real',
                'Controle total, menos estresse',
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
              "Um barbeiro que reduz 3 faltas por semana e vende 5 pomadas extras pela automação{' '}
              <span className="text-orange-500 font-black">já paga o sistema 5 vezes.</span>"
            </p>
          </CardContent>
        </Card>
      </div>
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
            VEJA COM SEUS PRÓPRIOS OLHOS
          </Badge>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Teste agora. <span className="text-orange-500">É interativo.</span>
          </h2>
          <p className="text-zinc-400">Clique e navegue pelo sistema real — exatamente como seu cliente vai ver.</p>
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
                  Tudo registrado automaticamente. Zero esquecimento.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
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
          RESULTADOS REAIS
        </Badge>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
          Quem usa, <span className="text-orange-500">não volta atrás</span>
        </h2>
        <p className="text-xl text-zinc-400">
          Barbeiros reais, resultados reais.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
        {[
          { 
            name: 'João Silva', 
            role: 'Barbearia do João - SP', 
            emoji: '👨‍🦱', 
            text: 'Antes eu perdia 4-5 clientes por semana com no-show. Com o sinal PIX automático no WhatsApp, caiu pra ZERO. Só isso me economiza R$1.400/mês.',
            highlight: 'R$0 de no-show/mês'
          },
          { 
            name: 'Carlos Mendes', 
            role: 'Barber House - RJ', 
            emoji: '🧔', 
            text: 'O cálculo de comissão era meu pesadelo. Agora em 1 clique tá pronto. E a comanda digital? Nunca mais esqueci de cobrar uma cerveja sequer.',
            highlight: 'Comissão em 1 clique'
          },
          { 
            name: 'Pedro Costa', 
            role: 'Vintage Barber - MG', 
            emoji: '👤', 
            text: 'O lembrete do "Cabelo Crescido" é genial. Meus clientes voltam mais rápido. Aumentei a frequência de visitas em 30%. Isso é dinheiro!',
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

      {/* Mini prints de resultado */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {[
          { value: '95%', label: 'Redução de no-show', icon: Target },
          { value: '2h', label: 'Economizadas/dia no WhatsApp', icon: Clock },
          { value: '+30%', label: 'Aumento de ticket médio', icon: TrendingUp },
          { value: 'R$0', label: 'Perda com vendas esquecidas', icon: DollarSign },
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

// ============ 7. STATUS (PRÓXIMO NÍVEL) ============
const StatusSection = () => (
  <section className="py-20 bg-zinc-900 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent" />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-2">
          <Crown className="w-4 h-4 mr-2" />
          PRÓXIMO NÍVEL
        </Badge>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
          Sua barbearia no{' '}
          <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            próximo nível
          </span>
        </h2>
        <p className="text-xl text-zinc-300">
          Não é só sobre sistema. É sobre <strong className="text-white">como você quer ser visto</strong>.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {[
          { icon: BadgeCheck, title: 'Atendimento Profissional', desc: 'Confirmação automática, lembretes, tudo no padrão. Seu cliente percebe a diferença.', color: 'text-orange-500' },
          { icon: Shield, title: 'Cliente Respeita Seu Horário', desc: 'Com sinal PIX, quem marca aparece. Acabou a palhaçada do no-show.', color: 'text-green-500' },
          { icon: HeartPulse, title: 'Menos Estresse', desc: 'Chega de ficar no WhatsApp, na planilha, na calculadora. O sistema faz tudo por você.', color: 'text-violet-500' },
          { icon: TrendingUp, title: 'Mais Controle', desc: 'Sabe exatamente quanto faturou, quanto cada barbeiro produziu, e pra onde o dinheiro tá indo.', color: 'text-blue-500' },
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
          FIDELIZAÇÃO PREMIUM
        </Badge>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
          Receita recorrente.{' '}
          <span className="bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
            Todo mês. Garantida.
          </span>
        </h2>
        <p className="text-xl text-zinc-300">
          Crie planos como <strong className="text-white">"Corte Ilimitado R$149/mês"</strong> e 
          saiba exatamente quanto vai faturar antes do mês começar.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
        {[
          {
            icon: CreditCard,
            title: 'Crie Seus Planos',
            desc: 'Defina nome, preço, serviços inclusos, limite de uso e ciclo de cobrança. Ex: "VIP Barba + Corte" ou "Plano Estudante".',
            color: 'from-violet-500 to-purple-500',
          },
          {
            icon: CalendarCheck,
            title: 'Agenda Reconhece',
            desc: 'Quando o assinante agenda, o sistema identifica automaticamente e marca como "Incluso no Plano".',
            color: 'from-purple-500 to-pink-500',
          },
          {
            icon: TrendingUp,
            title: 'Previsibilidade Total',
            desc: '50 assinantes × R$149 = R$7.450 garantidos todo mês, sem depender da agenda lotada.',
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
        <Card className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 border-violet-500/50 overflow-hidden">
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

// ============ 8. CTA FORTE + PLANOS ============
const PlansSection = () => (
  <section className="py-20 bg-zinc-950 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
          <Gift className="w-4 h-4 mr-2" />
          SUA DECISÃO
        </Badge>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
          Quanto custa <span className="text-red-500">continuar perdendo dinheiro?</span>
        </h2>
        <p className="text-xl text-zinc-400">
          O sistema custa menos que <strong className="text-white">2 cortes de cabelo por mês</strong>. 
          E devolve <strong className="text-orange-400">20x mais</strong> em economia.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {[
          {
            name: 'Essencial', price: 97, desc: 'Para começar a profissionalizar',
            features: ['Agenda Online 24h', 'PDV Básico', 'Catálogo de Serviços', 'Controle de Clientes', 'Relatórios Básicos'],
            highlighted: false, cta: 'Começar Agora'
          },
          {
            name: 'Profissional', price: 197, desc: 'O mais escolhido por barbeiros',
            features: ['Tudo do Essencial +', 'WhatsApp Automático', 'PIX no WhatsApp do cliente', 'Comissões automáticas', 'Comanda de Bar', 'Sinal PIX anti no-show', 'Automação "Cabelo Crescido"', 'Clube de Assinaturas', 'Avaliações automáticas'],
            highlighted: true, cta: 'QUERO MINHA AGENDA CHEIA'
          },
          {
            name: 'Empresarial', price: null, desc: 'Para redes e franquias',
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
                <Button className={cn("w-full font-bold py-6", plan.highlighted ? "bg-orange-500 hover:bg-orange-600 text-white text-lg" : "bg-zinc-800 hover:bg-zinc-700 text-white")}>{plan.cta}</Button>
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
          <span className="text-orange-500">outro barbeiro já está lotando a agenda.</span>
        </h2>
        <p className="text-xl text-zinc-300">
          Quem implementa primeiro, <strong className="text-white">sai na frente</strong>. 
          Cada dia sem o Mostralo é dinheiro que você <strong className="text-red-400">não vai recuperar</strong>.
        </p>
        <div className="pt-4">
          <Link to="/signup">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-10 py-7 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all font-bold">
              <Zap className="w-5 h-5 mr-2" />
              ATIVAR MINHA BARBEARIA AUTOMÁTICA
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-zinc-500 text-sm mt-4">7 dias grátis • Sem cartão • Cancele quando quiser</p>
        </div>
      </div>
    </div>
  </section>
);

// ============ FAQ ============
const faqItems = [
  { q: 'Preciso de um celular novo?', a: 'Não! Funciona 100% no navegador, em qualquer dispositivo. Celular, tablet ou computador.' },
  { q: 'Como funciona o PIX no WhatsApp?', a: 'Quando o cliente agenda, o sistema envia automaticamente uma cobrança PIX nativa direto na conversa do WhatsApp dele. Ele paga com 1 toque, sem sair do app. Você configura: valor fixo ou porcentagem do serviço.' },
  { q: 'Consigo usar com vários barbeiros?', a: 'Sim! Cada barbeiro tem sua agenda individual, comissão automática e relatórios próprios. A equipe toda no mesmo sistema.' },
  { q: 'O cliente precisa baixar app?', a: 'Não! Ele acessa o link pelo navegador, escolhe horário e pronto. Confirmação e lembrete chegam pelo WhatsApp.' },
  { q: 'Posso testar antes de pagar?', a: 'Sim! 7 dias grátis, sem cartão, sem compromisso. Teste tudo.' },
  { q: 'Como funciona o Clube de Assinaturas?', a: 'Você cria planos como "Corte Ilimitado R$149/mês". O cliente paga mensalmente e agenda quantas vezes o plano permitir. O sistema reconhece automaticamente e marca como incluso. Receita recorrente garantida!' },
  { q: 'E se eu tiver mais de uma unidade?', a: 'O plano Empresarial suporta múltiplas unidades com gestão centralizada e relatórios consolidados.' },
  { q: 'Quanto tempo leva pra configurar?', a: 'Menos de 30 minutos. Cadastre seus serviços, barbeiros e horários. Compartilhe o link e comece a receber agendamentos.' },
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
              Perguntas <span className="text-orange-500">Frequentes</span>
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

// ============ 10. FECHAMENTO AGRESSIVO + FOOTER ============
const ClosingSection = () => (
  <section className="py-20 bg-zinc-900 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent" />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
          O problema não é falta de cliente.
          <br />
          É falta de sistema.
          <br />
          <span className="text-orange-500">E isso você resolve agora.</span>
        </h2>
        
        <p className="text-xl text-zinc-300">
          Pare de trabalhar mais e ganhar menos. Pare de perder dinheiro com no-show,
          vendas esquecidas e desorganização. <strong className="text-white">Automatize. Profissionalize. Lucre.</strong>
        </p>

        <div className="pt-4">
          <Link to="/signup">
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white text-xl px-12 py-8 rounded-xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all font-black">
              <Gift className="w-6 h-6 mr-2" />
              TESTAR GRÁTIS POR 7 DIAS
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
          </Link>
          <p className="text-zinc-500 text-sm mt-4">Sem cartão de crédito. Cancele quando quiser. Sem pegadinha.</p>
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
      {/* 1. Headline com dor + vilão */}
      <HeroSection />
      {/* 2. Cena real (identificação) */}
      <RealSceneSection />
      {/* 3. Perda financeira (impacto) */}
      <FinancialLossSection />
      {/* 4. Apresentação do Mostralo (solução = máquina de dinheiro) */}
      <SolutionSection />
      {/* PIX destaque */}
      <PixWhatsAppSection />
      {/* 5. Antes vs Depois */}
      <BeforeAfterSection />
      {/* Demo interativo */}
      <FlowSimulatorSection />
      {/* 6. Prova social */}
      <SocialProofSection />
      {/* 7. Status (vida melhor) */}
      <StatusSection />
      {/* Clube de Assinaturas */}
      <SubscriptionClubSection />
      {/* 8. CTA forte + Planos */}
      <PlansSection />
      {/* 9. Urgência */}
      <UrgencySection />
      {/* FAQ */}
      <FAQSection />
      {/* 10. Fechamento forte */}
      <ClosingSection />
      <MainFooter variant="dark" />
      <WhatsAppLeadButton />
    </div>
  );
};

export default NichoBarbeariasPage;
