import { usePageSEO } from '@/hooks/useSEO';
import { WhatsAppLeadButton } from '@/components/leads/WhatsAppLeadButton';
import { MainFooter } from '@/components/MainFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Scissors, Beer, Calendar, MessageSquare, Clock, Calculator,
  XCircle, CheckCircle, Star, ArrowRight, Store, CreditCard,
  TrendingUp, AlertTriangle, Gift, ChevronDown, ChevronUp,
  Zap, Shield, DollarSign, Target, Eye, Send, Trophy,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const GRID_BG = "bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]";

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

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8 px-0">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm sm:text-lg px-6 sm:px-10 py-6 sm:py-7 rounded-xl shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 font-bold hover:-translate-y-0.5 whitespace-normal leading-tight"
              >
                <Scissors className="w-5 h-5 mr-2 flex-shrink-0" />
                QUERO ENCHER MINHA AGENDA AGORA
                <ArrowRight className="w-5 h-5 ml-2 flex-shrink-0" />
              </Button>
            </Link>
          </div>
          <p className="text-zinc-500 text-sm text-center lg:text-left">30 dias grátis • Suporte humanizado • Sem cartão</p>
        </div>

        {/* MOCKUP DIREITA */}
        <div className="flex justify-center lg:justify-end">
          <div className="relative">
            {/* Desktop mockup */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-700 shadow-2xl shadow-orange-500/10 p-1 max-w-full sm:max-w-[440px]">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl mx-auto mt-12 md:mt-16">
        {[
          { value: '0', label: 'No-show com sinal PIX', icon: Target },
          { value: '0min', label: 'Confirmando horários', icon: Clock },
          { value: '1 clique', label: 'Pra calcular comissão', icon: Calculator },
          { value: '24/7', label: 'Agenda funcionando', icon: Calendar },
        ].map((stat, i) => (
          <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center">
            <stat.icon className="w-5 h-5 text-orange-500 mx-auto mb-2" />
            <p className="text-xl sm:text-2xl font-black text-orange-500">{stat.value}</p>
            <p className="text-zinc-400 text-[10px] sm:text-xs">{stat.label}</p>
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
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-4">
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
      </div>
    </div>
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
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-6">
          Quanto dinheiro você{' '}
          <span className="text-red-500">joga fora por semana?</span>
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {[
          {
            icon: XCircle,
            title: '💸 Cliente que marca e some',
            desc: 'Cadeira vazia. Ninguém te paga por isso.',
          },
          {
            icon: Beer,
            title: '🍺 Cerveja que você esqueceu de cobrar',
            desc: 'O cara tomou, levou pomada, e saiu sem pagar.',
          },
          {
            icon: Clock,
            title: '📱 Tempo perdido respondendo WhatsApp',
            desc: 'Cada "tem horário?" é dinheiro que você não ganhou cortando.',
          },
          {
            icon: Calculator,
            title: '📊 Comissão errada = confusão',
            desc: 'Fim de semana na planilha. Sempre tem erro.',
          }
        ].map((pain, index) => (
          <Card key={index} className="bg-zinc-950/80 border-zinc-800 hover:border-red-500/50 transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <pain.icon className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{pain.title}</h3>
                  <p className="text-zinc-400">{pain.desc}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
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
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-6">
          Com o Mostralo, sua barbearia{' '}
          <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            funciona no automático.
          </span>
        </h2>
        <p className="text-lg sm:text-xl text-zinc-300 max-w-3xl mx-auto">
          Cliente agenda sozinho. Sistema confirma. PIX cobra.
          <br />
          <strong className="text-white">Você só senta e corta.</strong>
        </p>
      </div>

      {/* Resultado claro */}
      <div className="max-w-3xl mx-auto mb-16">
        <Card className="!bg-zinc-900 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/30">
          <CardContent className="p-5 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-black text-white mb-6 text-center">Com o Mostralo você:</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                '📅 Agenda cheia todo dia',
                '🚫 Menos faltas',
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-6">
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

            <div className="space-y-4">
              {[
                { icon: CheckCircle, text: 'Agendou? Cobrança do sinal vai na hora' },
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

// ============ 5. DEMONSTRAÇÃO ============
const FlowSimulatorSection = () => (
  <section className="py-20 bg-zinc-900 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-3xl mx-auto text-center">
        <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-2">
          <Eye className="w-4 h-4 mr-2" />
          DEMONSTRAÇÃO REAL
        </Badge>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-4">
          Veja funcionando <span className="text-orange-500">de verdade</span>
        </h2>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10">
          Essa é uma barbearia rodando no sistema. Abra e marque um horário de teste — é exatamente o que seu cliente vê.
        </p>

        <a
          href="https://mostralo.com.br/agendar/corte-fino"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block w-full sm:w-auto"
        >
          <Button
            size="lg"
            className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-base sm:text-xl px-8 sm:px-14 py-7 sm:py-8 rounded-xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 font-black hover:-translate-y-1 whitespace-normal leading-tight"
          >
            <Calendar className="w-6 h-6 mr-3 flex-shrink-0" />
            Abrir agendamento de teste
            <ArrowRight className="w-6 h-6 ml-3 flex-shrink-0" />
          </Button>
        </a>
      </div>
    </div>
  </section>
);

// ============ 6. PROVA SOCIAL ============
const SocialProofSection = () => (
  <section className="py-20 bg-zinc-950 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-2xl mx-auto text-center mb-12">
        <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-2">
          <Star className="w-4 h-4 mr-2" />
          QUEM USA, FALA
        </Badge>
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-4">
          Quem usa, fala
        </h2>
        <p className="text-lg sm:text-xl text-zinc-400">
          Barbearia real, rodando hoje em Brasília.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card className="bg-zinc-900/60 border-zinc-800 hover:border-orange-500/40 transition-all">
          <CardContent className="p-8 md:p-10 text-center">
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, j) => (
                <Star key={j} className="w-5 h-5 fill-orange-500 text-orange-500" />
              ))}
            </div>
            <p className="text-xl sm:text-2xl text-white italic font-medium leading-relaxed mb-8">
              "Hoje eu nem toco no WhatsApp pra marcar. O cliente agenda sozinho e eu só corto."
            </p>
            <div>
              <p className="text-white font-bold text-lg">Jefferson Dias</p>
              <p className="text-zinc-400 text-sm mt-1">Barbearia Jefferson Dias — Brasília/DF</p>
            </div>
          </CardContent>
        </Card>
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
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-6">
          Receita todo mês.{' '}
          <span className="bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
            Antes do mês começar.
          </span>
        </h2>
        <p className="text-lg sm:text-xl text-zinc-300">
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
            icon: CheckCircle,
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

// ============ 7. AÇÃO — PLANO ============
const PlansSection = () => (
  <section className="py-20 bg-zinc-950 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white">
          Um plano. <span className="text-orange-500">Sem pegadinha.</span>
        </h2>
      </div>

      <div className="max-w-xl mx-auto">
        <Card className="relative overflow-hidden bg-gradient-to-b from-orange-500/15 to-zinc-900 border-orange-500 ring-2 ring-orange-500/50">
          <div className="absolute top-0 left-0 right-0 bg-orange-500 text-white text-center text-sm py-2 font-bold">
            ⚡ Preço travado para os 5 primeiros clientes
          </div>
          <CardContent className="p-8 pt-14 text-center">
            <h3 className="text-3xl font-black text-white mb-2">Plano Fundador</h3>
            <div className="flex items-baseline justify-center gap-1 mb-6">
              <span className="text-zinc-500 text-2xl">R$</span>
              <span className="text-6xl font-black text-orange-500">129</span>
              <span className="text-zinc-500 text-xl">/mês</span>
            </div>

            <ul className="text-left space-y-3 mb-8 max-w-md mx-auto">
              {[
                'Agenda online 24h',
                'WhatsApp automático (confirmação e lembrete)',
                'Sinal PIX no WhatsApp',
                'Comissões automáticas',
                'Comanda digital',
                'Clube de assinaturas',
                'Suporte direto comigo',
              ].map((f, j) => (
                <li key={j} className="flex items-start gap-3 text-zinc-200">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link to="/signup" className="block">
              <Button className="w-full font-black py-6 text-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25">
                Quero testar 30 dias grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="text-zinc-500 text-sm mt-4">30 dias grátis • Sem cartão • Cancele quando quiser</p>
          </CardContent>
        </Card>
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
  { q: 'Posso testar antes?', a: '30 dias grátis pra você testar tudo. Sem cartão, sem compromisso. E com suporte humanizado do nosso time pra te ajudar a configurar.' },
  { q: 'Como funciona o Clube de Assinaturas?', a: 'Você cria planos tipo "Corte Ilimitado R$149/mês". Cliente paga mensalmente e agenda quantas vezes quiser. Sistema reconhece automaticamente. Receita recorrente garantida.' },
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
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

// ============ 8. FECHAMENTO ============
const ClosingSection = () => (
  <section className="py-24 bg-zinc-900 relative overflow-hidden">
    <div className={`absolute inset-0 ${GRID_BG}`} />
    <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent" />
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white leading-tight">
          O problema não é falta de cliente.
          <br />
          <span className="text-red-500">É falta de sistema.</span>
        </h2>

        <p className="text-xl sm:text-2xl text-zinc-300 font-medium">
          E você resolve isso agora.
        </p>

        <div className="pt-6 px-4">
          <Link to="/signup" className="block">
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-base sm:text-xl px-8 sm:px-14 py-7 sm:py-8 rounded-xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 font-black hover:-translate-y-1 whitespace-normal leading-tight">
              <Gift className="w-6 h-6 mr-3 flex-shrink-0" />
              COMEÇAR AGORA — 30 DIAS GRÁTIS
              <ArrowRight className="w-6 h-6 ml-3 flex-shrink-0" />
            </Button>
          </Link>
          <p className="text-zinc-500 text-sm mt-4">30 dias grátis • Suporte humanizado • Sem cartão</p>
        </div>
      </div>
    </div>
  </section>
);


// ============ PÁGINA PRINCIPAL ============
const NichoBarbeariasPage = () => {
  usePageSEO({
    title: 'Sistema para Barbearias | Agenda + PIX no WhatsApp + Comanda | Mostralo',
    description: 'Sistema completo para barbearias: agendamento online 24h, cobrança PIX direto no WhatsApp, comanda digital, comissões automáticas e clube de assinaturas. Teste grátis 30 dias.',
    keywords: 'sistema barbearia, agenda barbearia, pix whatsapp barbearia, software barbershop, gestão barbearia, comanda bar barbearia, clube assinatura barbearia',
    image: 'https://mostralo.com.br/og-barbearia.png'
  });

  return (
    <div className="min-h-screen bg-zinc-950">
      <HeroSection />
      <RealSceneSection />
      <FinancialLossSection />
      <SolutionSection />
      <PixWhatsAppSection />
      <FlowSimulatorSection />
      <SocialProofSection />
      <SubscriptionClubSection />
      <PlansSection />
      <FAQSection />
      <ClosingSection />
      <MainFooter variant="dark" />
      <WhatsAppLeadButton />
    </div>
  );
};

export default NichoBarbeariasPage;
