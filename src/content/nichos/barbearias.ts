import {
  AlertTriangle,
  ArrowRight,
  Beer,
  Calculator,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Eye,
  Gift,
  MessageSquare,
  Scissors,
  Send,
  Shield,
  Star,
  Store,
  Target,
  TrendingUp,
  Trophy,
  UserPlus,
  XCircle,
  Zap,
} from 'lucide-react';
import { br, cta, custom, f, faq, fld, grid, h, icon, itemIcon, layer, mainFooter, plans, span, strong, txt, whatsapp } from '@/components/nicho/build';
import { checkList, sectionBadge } from '@/components/nicho/presets/agendamento';
import { BarbeariaHeroMockup } from '@/components/nicho/custom/BarbeariaHeroMockup';
import { BarbeariaPixChat } from '@/components/nicho/custom/BarbeariaPixChat';
import type { NicheContent, NicheNode } from '@/components/nicho/types';

// Fundo quadriculado usado em todas as seções da página.
const GRID_BG = 'bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]';
const gridLayer = layer(`absolute inset-0 ${GRID_BG}`);
const H2 = 'text-2xl sm:text-3xl md:text-5xl font-black text-white';
const BIG_CTA =
  'w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-base sm:text-xl px-8 sm:px-14 py-7 sm:py-8 rounded-xl shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 font-black hover:-translate-y-1 whitespace-normal leading-tight';
const GUARANTEE = '7 dias para testar e garantia de 30 dias • Suporte humanizado • Sem cartão';

// ---- Textos ----
const heroStats = [
  { value: 'PIX', label: 'Cobrança no WhatsApp', icon: Target },
  { value: '0min', label: 'Confirmando horários', icon: Clock },
  { value: '1 clique', label: 'Pra calcular comissão', icon: Calculator },
  { value: '24/7', label: 'Agenda funcionando', icon: Calendar },
];

const realScene = [
  'Cliente esquece o horário e não aparece',
  'Cadeira vazia no meio do dia',
  'WhatsApp lotado de "tem horário?"',
  'Agenda com buracos que ninguém preenche',
  'Fim de semana calculando comissão na mão',
  'Cliente tomou cerveja e você esqueceu de cobrar',
  'Não sabe quanto faturou no mês',
  'Trabalha muito e sobra pouco',
];

const losses = [
  { icon: XCircle, title: '💸 Cliente que marca e some', desc: 'Cadeira vazia. Ninguém te paga por isso.' },
  { icon: Beer, title: '🍺 Cerveja que você esqueceu de cobrar', desc: 'O cara tomou, levou pomada, e saiu sem pagar.' },
  { icon: Clock, title: '📱 Tempo perdido respondendo WhatsApp', desc: 'Cada "tem horário?" é dinheiro que você não ganhou cortando.' },
  { icon: Calculator, title: '📊 Comissão errada = confusão', desc: 'Fim de semana na planilha. Sempre tem erro.' },
];

const results = ['📅 Agenda mais cheia', '🚫 Menos faltas', '💰 Mais dinheiro no bolso', '😌 Menos dor de cabeça', '🍺 Zero venda esquecida', '📊 Comissão em 1 clique'];

const PILLAR_CARD = 'bg-zinc-900/50 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-2 overflow-hidden';
const pillars = [
  {
    icon: Calendar,
    title: '📅 Agenda que trabalha por você',
    subtitle: 'Cliente marca sozinho. Qualquer hora.',
    features: ['Link exclusivo — Instagram, Google, WhatsApp', 'Cliente escolhe serviço, barbeiro e horário', 'Intervalos configuráveis', 'Bloqueio de férias e folgas na agenda'],
    cls: { card: PILLAR_CARD, bar: 'h-2 bg-gradient-to-r from-orange-500 to-amber-500' },
  },
  {
    icon: CreditCard,
    title: '💰 PIX no WhatsApp do cliente',
    subtitle: 'Cobra antes do horário. Sem link. Sem QR code.',
    features: ['Cobrança PIX nativa pelo WhatsApp', 'Vai sozinha quando o horário é confirmado', 'Sem app externo, sem link suspeito', 'Quem paga antes falta menos'],
    isNew: true,
    cls: { card: `${PILLAR_CARD} ring-2 ring-green-500/50`, bar: 'h-2 bg-gradient-to-r from-green-500 to-emerald-500' },
  },
  {
    icon: Beer,
    title: '🍻 Comanda Digital + Bar',
    subtitle: 'Nunca mais esquece de cobrar.',
    features: ['Comanda digital por cadeira', 'Cerveja, pomada — tudo na conta', 'Totem de autoatendimento', 'Controle de estoque automático'],
    cls: { card: PILLAR_CARD, bar: 'h-2 bg-gradient-to-r from-amber-500 to-yellow-500' },
  },
  {
    icon: MessageSquare,
    title: '🤖 WhatsApp no automático',
    subtitle: 'Confirma, lembra, cobra e pede avaliação.',
    features: ['Confirmação automática ao agendar', 'Lembrete antes do horário', 'Cobrança PIX na conversa', 'Pedido de avaliação no Google depois do corte'],
    cls: { card: PILLAR_CARD, bar: 'h-2 bg-gradient-to-r from-emerald-500 to-teal-500' },
  },
  {
    icon: UserPlus,
    title: '🔗 Cada barbeiro com link próprio',
    subtitle: 'Cada profissional, sua própria agenda.',
    text: 'Ele divulga no Instagram dele e o cliente cai direto na agenda dele. Sem confusão de quem atende quem.',
    linkLabel: 'Ver um cartão de exemplo',
    linkUrl: 'https://mostralo.com.br/c/julianarocha',
    cls: { card: `${PILLAR_CARD} md:col-span-2 mx-auto max-w-xl`, bar: 'h-2 bg-gradient-to-r from-orange-500 to-amber-500' },
  },
];

const pixPoints = [
  { icon: CheckCircle, text: 'Horário confirmado? A cobrança PIX vai na hora' },
  { icon: Shield, text: 'PIX nativo do WhatsApp — confiável' },
  { icon: DollarSign, text: 'Valor do serviço, com a sua chave PIX' },
  { icon: Zap, text: 'Quem paga antes falta menos.' },
];

const clubCards = [
  { icon: CreditCard, title: 'Monte seus planos', desc: 'Defina preço, serviços, limite de uso.', cls: { bar: 'h-2 bg-gradient-to-r from-violet-500 to-purple-500' } },
  { icon: CheckCircle, title: 'Agenda reconhece', desc: 'Assinante agendou? Sistema identifica automaticamente.', cls: { bar: 'h-2 bg-gradient-to-r from-purple-500 to-pink-500' } },
  { icon: TrendingUp, title: 'Dinheiro previsível', desc: 'Exemplo: 50 assinantes × R$149 = R$7.450 por mês.', cls: { bar: 'h-2 bg-gradient-to-r from-pink-500 to-rose-500' } },
];

const faqs = [
  { q: 'Preciso de celular novo?', a: 'Não. Funciona no navegador, em qualquer dispositivo. Celular, tablet ou computador.' },
  {
    q: 'Como funciona o PIX no WhatsApp?',
    a: 'Com o WhatsApp da barbearia conectado, quando o horário é confirmado o sistema envia ao cliente uma cobrança PIX nativa na conversa, com a sua chave e o valor do serviço. Ele copia a chave com 1 toque e paga no app do banco. A conferência do pagamento fica com você.',
  },
  { q: 'Funciona com vários barbeiros?', a: 'Sim. Cada barbeiro tem agenda individual, comissão automática e relatórios próprios.' },
  { q: 'O cliente precisa baixar app?', a: 'Não. Ele acessa o link, escolhe horário e pronto. Confirmação e lembrete vão pelo WhatsApp.' },
  {
    q: 'Posso testar antes?',
    a: '7 dias para testar e garantia de 30 dias pra você testar tudo. Sem cartão, sem compromisso. E com suporte humanizado do nosso time pra te ajudar a configurar.',
  },
  {
    q: 'Como funciona o Clube de Assinaturas?',
    a: 'Você cria planos tipo "Corte Ilimitado R$149/mês". Cliente paga mensalmente e agenda quantas vezes quiser. Sistema reconhece automaticamente. Receita recorrente garantida.',
  },
  { q: 'Quanto tempo leva pra configurar?', a: 'Menos de 30 minutos. Cadastre serviços, barbeiros e horários. Compartilhe o link e comece.' },
];

// ---- Página ----
export const barbearias: NicheContent = {
  path: '/nicho-barbearias',
  seo: {
    title: 'Sistema para Barbearias | Agenda + PIX no WhatsApp + Comanda | Mostralo',
    description: 'Sistema completo para barbearias: agendamento online 24h, cobrança PIX direto no WhatsApp, comanda digital, comissões automáticas e clube de assinaturas. Teste grátis 30 dias.',
    keywords: 'sistema barbearia, agenda barbearia, pix whatsapp barbearia, software barbershop, gestão barbearia, comanda bar barbearia, clube assinatura barbearia',
    image: 'https://mostralo.com.br/og-barbearia.png',
  },
  pageClassName: 'min-h-screen bg-zinc-950',
  sections: [
    // 1. Atenção — hero
    h('section', 'relative min-h-screen md:min-h-[90vh] flex items-center overflow-hidden bg-zinc-950', [
      layer('absolute inset-0 bg-gradient-to-br from-orange-950/40 via-zinc-950 to-zinc-950'),
      gridLayer,
      layer('absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse'),
      layer('absolute bottom-20 right-10 w-96 h-96 bg-orange-600/8 rounded-full blur-3xl'),
      h('div', 'container mx-auto px-4 py-12 md:py-16 relative z-10', [
        h('div', 'grid lg:grid-cols-2 gap-8 md:gap-12 items-center max-w-6xl mx-auto', [
          h('div', 'text-center lg:text-left', [
            h('div', 'flex items-center justify-center lg:justify-start gap-2 mb-6', [
              icon(Store, 'w-8 h-8 text-orange-500'),
              h('span', { className: 'text-2xl font-bold text-white', text: 'Mostralo' }),
            ]),
            sectionBadge('mb-6 bg-red-500/20 text-red-400 border-red-500/30 px-4 py-2 text-sm', AlertTriangle, 'ISSO ESTÁ CUSTANDO CARO PRA VOCÊ'),
            h('h1', {
              className: 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-[1.1]',
              text: ['Sua agenda vazia', ' ', span('text-red-500', 'não é falta de cliente.'), br(), span('text-orange-500', 'É falta de sistema.')],
            }),
            h('p', {
              className: 'text-lg sm:text-xl md:text-2xl text-zinc-300 mb-8 font-medium leading-relaxed',
              text: ['Enquanto você perde clientes, outras barbearias estão', ' ', strong('text-orange-400', 'enchendo a agenda todos os dias'), '.'],
            }),
            h('div', 'flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-8 px-0', [
              cta({
                label: 'QUERO ENCHER MINHA AGENDA AGORA',
                linkClassName: 'w-full sm:w-auto',
                className:
                  'w-full sm:w-auto bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-sm sm:text-lg px-6 sm:px-10 py-6 sm:py-7 rounded-xl shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 font-bold hover:-translate-y-0.5 whitespace-normal leading-tight',
                iconLeft: { icon: Scissors, className: 'w-5 h-5 mr-2 flex-shrink-0' },
                iconRight: { icon: ArrowRight, className: 'w-5 h-5 ml-2 flex-shrink-0' },
              }),
            ]),
            h('p', { className: 'text-zinc-500 text-sm text-center lg:text-left', text: GUARANTEE }),
          ]),
          custom(BarbeariaHeroMockup),
        ]),
        grid({
          className: 'grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl mx-auto mt-12 md:mt-16',
          items: heroStats,
          card: h('div', 'bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center', [
            itemIcon('w-5 h-5 text-orange-500 mx-auto mb-2'),
            f('p', 'text-xl sm:text-2xl font-black text-orange-500', 'value'),
            f('p', 'text-zinc-400 text-[10px] sm:text-xs', 'label'),
          ]),
        }),
      ]),
      layer('absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent'),
    ]),

    // 2. Interesse — dor / identificação
    h('section', 'py-20 bg-zinc-950 relative overflow-hidden', [
      gridLayer,
      h('div', 'container mx-auto px-4 relative z-10', [
        h('div', 'max-w-4xl mx-auto', [
          h('div', 'text-center mb-12', [
            sectionBadge('mb-4 bg-red-500/20 text-red-400 border-red-500/30 px-4 py-2', Eye, 'SE IDENTIFICOU?'),
            h('h2', { className: `${H2} mb-4`, text: ['Se você é barbeiro,', ' ', span('text-red-500', 'você já passou por isso:')] }),
          ]),
          grid({
            className: 'grid md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-12',
            items: realScene.map((value) => ({ value })),
            card: h('div', 'flex items-start gap-3 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-red-500/40 transition-colors group', [
              h('div', 'w-6 h-6 rounded border-2 border-red-500/50 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-red-500/20', [icon(XCircle, 'w-4 h-4 text-red-500 opacity-70')]),
              f('p', 'text-zinc-300', 'value'),
            ]),
          }),
          h('Card', 'bg-red-500/10 border-red-500/30 max-w-3xl mx-auto', [
            h('CardContent', 'p-6 text-center', [
              h('p', {
                className: 'text-xl md:text-2xl font-black text-white',
                text: ['Se marcou ', span('text-red-500', '3 ou mais'), ', você está', ' ', span('text-red-500', 'perdendo dinheiro todo dia'), '.'],
              }),
              h('p', { className: 'text-zinc-400 mt-2', text: 'E o pior: já se acostumou com isso.' }),
            ]),
          ]),
        ]),
      ]),
    ]),

    // 3. Interesse — perda financeira
    h('section', 'py-20 bg-zinc-900 relative overflow-hidden', [
      gridLayer,
      layer('absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent'),
      h('div', 'container mx-auto px-4 relative z-10', [
        h('div', 'max-w-4xl mx-auto text-center mb-12', [
          sectionBadge('mb-4 bg-red-500/20 text-red-400 border-red-500/30 px-4 py-2', DollarSign, 'FAÇA A CONTA'),
          h('h2', { className: `${H2} mb-6`, text: ['Quanto dinheiro você', ' ', span('text-red-500', 'joga fora por semana?')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-2 gap-6 max-w-5xl mx-auto',
          items: losses,
          card: h('Card', 'bg-zinc-950/80 border-zinc-800 hover:border-red-500/50 transition-all duration-300', [
            h('CardContent', 'p-6', [
              h('div', 'flex items-start gap-4', [
                h('div', 'w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0', [itemIcon('w-6 h-6 text-red-500')]),
                h('div', [f('h3', 'text-xl font-bold text-white mb-2', 'title'), f('p', 'text-zinc-400', 'desc')]),
              ]),
            ]),
          ]),
        }),
      ]),
    ]),

    // 4. Desejo — solução
    h('section', 'py-20 bg-zinc-950 relative overflow-hidden', [
      gridLayer,
      layer('absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent'),
      h('div', 'container mx-auto px-4 relative z-10', [
        h('div', 'max-w-4xl mx-auto text-center mb-16', [
          sectionBadge('mb-4 bg-green-500/20 text-green-400 border-green-500/30 px-4 py-2', Zap, 'A VIRADA'),
          h('h2', {
            className: `${H2} mb-6`,
            text: ['Com o Mostralo, sua barbearia', ' ', span('bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent', 'funciona no automático.')],
          }),
          h('p', {
            className: 'text-lg sm:text-xl text-zinc-300 max-w-3xl mx-auto',
            text: ['Cliente agenda sozinho. Sistema confirma. PIX cobra.', br(), strong('text-white', 'Você só senta e corta.')],
          }),
        ]),
        h('div', 'max-w-3xl mx-auto mb-16', [
          h('Card', '!bg-zinc-900 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/30', [
            h('CardContent', 'p-5 sm:p-8', [
              h('h3', { className: 'text-xl sm:text-2xl font-black text-white mb-6 text-center', text: 'Com o Mostralo você:' }),
              grid({
                className: 'grid sm:grid-cols-2 gap-4',
                items: results.map((value) => ({ value })),
                card: h('div', 'flex items-center gap-3', [icon(CheckCircle, 'w-5 h-5 text-green-500 flex-shrink-0'), f('span', 'text-white font-medium', 'value')]),
              }),
            ]),
          ]),
        ]),
        grid({
          className: 'grid md:grid-cols-2 gap-8 max-w-5xl mx-auto',
          items: pillars,
          card: h('Card', { key: 'card' }, [
            h('div', { key: 'bar' }),
            h('div', { className: 'bg-green-500 text-white text-center text-xs py-1 font-bold tracking-wider', text: '🆕 EXCLUSIVO MOSTRALO', when: 'isNew' }),
            h('CardHeader', 'pb-4', [
              h('div', 'flex items-center gap-4', [
                h('div', 'w-14 h-14 rounded-xl bg-orange-500/10 flex items-center justify-center', [itemIcon('w-7 h-7 text-orange-500')]),
                h('div', [f('CardTitle', 'text-xl text-white', 'title'), f('p', 'text-orange-400 text-sm font-medium', 'subtitle')]),
              ]),
            ]),
            h('CardContent', [
              h('div', { when: 'text' }, [
                f('p', 'text-zinc-300 leading-relaxed', 'text'),
                h(
                  'a',
                  {
                    when: 'linkUrl',
                    propFields: { href: 'linkUrl' },
                    props: { target: '_blank', rel: 'noopener noreferrer' },
                    className: 'inline-block mt-3 text-xs text-orange-400 hover:text-orange-300 hover:underline transition-colors',
                  },
                  [fld('linkLabel'), txt(' ↗')],
                ),
              ]),
              { ...checkList('features'), unless: 'text' },
            ]),
          ]),
        }),
      ]),
    ]),

    // PIX no WhatsApp — destaque
    h('section', 'py-20 bg-zinc-900 relative overflow-hidden', [
      layer('absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-green-500/5'),
      gridLayer,
      h('div', 'container mx-auto px-4 relative z-10', [
        h('div', 'max-w-5xl mx-auto', [
          h('div', 'grid md:grid-cols-2 gap-12 items-center', [
            h('div', [
              sectionBadge('mb-4 bg-green-500/20 text-green-400 border-green-500/30 px-4 py-2', Send, 'EXCLUSIVO MOSTRALO'),
              h('h2', {
                className: 'text-2xl sm:text-3xl md:text-4xl font-black text-white mb-6',
                text: ['PIX direto no WhatsApp.', ' ', span('bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent', 'Sem link. Sem QR code.')],
              }),
              h('p', {
                className: 'text-lg text-zinc-300 mb-6',
                text: ['O cliente agenda, o sistema manda a cobrança PIX.', br(), 'Quem paga antes falta menos.'],
              }),
              grid({
                className: 'space-y-4',
                items: pixPoints,
                card: h('div', 'flex items-start gap-3', [
                  h('div', 'w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0', [itemIcon('w-4 h-4 text-green-500')]),
                  f('p', 'text-zinc-300', 'text'),
                ]),
              }),
            ]),
            custom(BarbeariaPixChat),
          ]),
        ]),
      ]),
    ]),

    // 5. Demonstração
    h('section', 'py-20 bg-zinc-900 relative overflow-hidden', [
      gridLayer,
      h('div', 'container mx-auto px-4 relative z-10', [
        h('div', 'max-w-3xl mx-auto text-center', [
          sectionBadge('mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-2', Eye, 'DEMONSTRAÇÃO REAL'),
          h('h2', { className: `${H2} mb-4`, text: ['Veja funcionando ', span('text-orange-500', 'de verdade')] }),
          h('p', {
            className: 'text-lg text-zinc-400 max-w-2xl mx-auto mb-10',
            text: 'Essa é uma barbearia rodando no sistema. Abra e marque um horário de teste — é exatamente o que seu cliente vê.',
          }),
          cta({
            label: 'Abrir agendamento de teste',
            href: 'https://mostralo.com.br/agendar/corte-fino',
            target: '_blank',
            rel: 'noopener noreferrer',
            linkClassName: 'inline-block w-full sm:w-auto',
            className: BIG_CTA,
            iconLeft: { icon: Calendar, className: 'w-6 h-6 mr-3 flex-shrink-0' },
            iconRight: { icon: ArrowRight, className: 'w-6 h-6 ml-3 flex-shrink-0' },
          }),
        ]),
      ]),
    ]),

    // 6. Prova social
    h('section', 'py-20 bg-zinc-950 relative overflow-hidden', [
      gridLayer,
      h('div', 'container mx-auto px-4 relative z-10', [
        h('div', 'max-w-2xl mx-auto text-center mb-12', [
          sectionBadge('mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-2', Star, 'QUEM USA, FALA'),
          h('h2', { className: `${H2} mb-4`, text: 'Quem usa, fala' }),
          h('p', { className: 'text-lg sm:text-xl text-zinc-400', text: 'Barbearia real, rodando hoje em Brasília.' }),
        ]),
        h('div', 'max-w-2xl mx-auto', [
          h('Card', 'bg-zinc-900/60 border-zinc-800 hover:border-orange-500/40 transition-all', [
            h('CardContent', 'p-8 md:p-10 text-center', [
              h('div', 'flex justify-center gap-1 mb-6', [icon(Star, 'w-5 h-5 fill-orange-500 text-orange-500', { repeat: 5 })]),
              h('p', {
                className: 'text-xl sm:text-2xl text-white italic font-medium leading-relaxed mb-8',
                text: '"Hoje eu nem toco no WhatsApp pra marcar. O cliente agenda sozinho e eu só corto."',
              }),
              h('div', [
                h('p', { className: 'text-white font-bold text-lg', text: 'Jefferson Dias' }),
                h('p', { className: 'text-zinc-400 text-sm mt-1', text: 'Barbearia Jefferson Dias — Brasília/DF' }),
              ]),
            ]),
          ]),
        ]),
      ]),
    ]),

    // Clube de assinaturas
    h('section', 'py-20 bg-zinc-950 relative overflow-hidden', [
      gridLayer,
      h('div', 'container mx-auto px-4 relative z-10', [
        h('div', 'max-w-4xl mx-auto text-center mb-12', [
          sectionBadge('mb-4 bg-violet-500/20 text-violet-400 border-violet-500/30 px-4 py-2', Trophy, 'DINHEIRO GARANTIDO'),
          h('h2', {
            className: `${H2} mb-6`,
            text: ['Receita todo mês.', ' ', span('bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent', 'Antes do mês começar.')],
          }),
          h('p', {
            className: 'text-lg sm:text-xl text-zinc-300',
            text: ['Crie planos tipo ', strong('text-white', '"Corte Ilimitado R$149/mês"'), '.', br(), 'Seu caixa previsível. Todo mês.'],
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12',
          items: clubCards,
          card: h('Card', 'bg-zinc-900/50 border-zinc-800 hover:border-violet-500/50 transition-all hover:-translate-y-1 overflow-hidden', [
            h('div', { key: 'bar' }),
            h('CardContent', 'p-6', [
              itemIcon('w-10 h-10 text-violet-500 mb-4'),
              f('h3', 'text-lg font-bold text-white mb-2', 'title'),
              f('p', 'text-zinc-400 text-sm', 'desc'),
            ]),
          ]),
        }),
        h('div', 'max-w-md mx-auto', [
          h('Card', '!bg-zinc-900 bg-gradient-to-br from-violet-500/20 to-purple-500/20 border-violet-500/50 overflow-hidden', [
            h('CardContent', 'p-6 text-center', [
              h('Badge', { className: 'mb-4 bg-violet-500 text-white border-0', text: 'EXEMPLO' }),
              h('h3', { className: 'text-2xl font-bold text-white mb-2', text: 'Plano Corte Ilimitado' }),
              h('p', { className: 'text-zinc-400 mb-4', text: 'Corte degradê quantas vezes quiser no mês' }),
              h('div', 'flex items-baseline justify-center gap-1 mb-4', [
                h('span', { className: 'text-zinc-500', text: 'R$' }),
                h('span', { className: 'text-5xl font-black text-violet-400', text: '149' }),
                h('span', { className: 'text-zinc-500', text: '/mês' }),
              ]),
              h('div', 'flex items-center justify-center gap-2 text-green-400', [icon(CheckCircle, 'w-5 h-5'), h('span', { text: 'Cliente corta quando quiser!' })]),
            ]),
          ]),
        ]),
      ]),
    ]),

    // 7. Ação — planos
    plans('Agenda', true),

    // FAQ
    h('section', 'py-20 bg-zinc-950 relative overflow-hidden', [
      gridLayer,
      h('div', 'container mx-auto px-4 relative z-10', [
        h('div', 'max-w-3xl mx-auto', [
          h('div', 'text-center mb-12', [
            h('h2', { className: 'text-2xl sm:text-3xl md:text-4xl font-black text-white', text: ['Dúvidas? ', span('text-orange-500', 'Respondo aqui.')] }),
          ]),
          faq({
            variant: 'toggle-card',
            className: 'space-y-3',
            cardClassName: 'bg-zinc-900 border-zinc-800 cursor-pointer hover:border-orange-500/50 transition-all',
            contentClassName: 'p-4',
            rowClassName: 'flex items-center justify-between',
            questionClassName: 'text-white font-semibold pr-4',
            openIconClassName: 'w-5 h-5 text-orange-500 flex-shrink-0',
            closedIconClassName: 'w-5 h-5 text-zinc-500 flex-shrink-0',
            answerClassName: 'text-zinc-400 mt-4 pt-4 border-t border-zinc-800',
            items: faqs,
          }),
        ]),
      ]),
    ]),

    // 8. Fechamento
    h('section', 'py-24 bg-zinc-900 relative overflow-hidden', [
      gridLayer,
      layer('absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent'),
      h('div', 'container mx-auto px-4 relative z-10', [
        h('div', 'max-w-3xl mx-auto text-center space-y-8', [
          h('h2', {
            className: 'text-3xl sm:text-4xl md:text-6xl font-black text-white leading-tight',
            text: ['O problema não é falta de cliente.', br(), span('text-red-500', 'É falta de sistema.')],
          }),
          h('p', { className: 'text-xl sm:text-2xl text-zinc-300 font-medium', text: 'E você resolve isso agora.' }),
          h('div', 'pt-6 px-4', [
            cta({
              label: 'COMEÇAR AGORA — 30 DIAS GRÁTIS',
              linkClassName: 'block',
              className: BIG_CTA,
              iconLeft: { icon: Gift, className: 'w-6 h-6 mr-3 flex-shrink-0' },
              iconRight: { icon: ArrowRight, className: 'w-6 h-6 ml-3 flex-shrink-0' },
            }),
            h('p', { className: 'text-zinc-500 text-sm mt-4', text: GUARANTEE }),
          ]),
        ]),
      ]),
    ]),

    mainFooter('dark'),
    whatsapp(),
  ],
};
