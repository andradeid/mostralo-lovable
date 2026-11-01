import {
  BarChart3,
  Beer,
  Calendar,
  CheckCircle2,
  CreditCard,
  Megaphone,
  MessageCircle,
  Monitor,
  ShoppingCart,
  Timer,
  TrendingUp,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';
import { br, custom, f, fld, grid, h, icon, itemIcon, layer, links, span, trust, whatsapp, YEAR } from '@/components/nicho/build';
import { agendaHeader, sectionBadge, subscriptionClubSection } from '@/components/nicho/presets/agendamento';
import { ArenaHeroCtas, ArenaHeroMockup, ArenaPlans } from '@/components/nicho/custom/ArenaHero';
import { ArenaCourtSchedule } from '@/components/nicho/custom/ArenaCourtSchedule';
import { ArenaGroupOrder } from '@/components/nicho/custom/ArenaGroupOrder';
import { ArenaBookingDemo } from '@/components/nicho/custom/ArenaBookingDemo';
import type { NicheContent } from '@/components/nicho/types';

const ORANGE_LIME = 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-lime-400';

// Classes por cor sempre literais (o Tailwind não gera classe montada por variável).
type Color = 'orange' | 'lime' | 'cyan' | 'purple';
const HIGHLIGHT: Record<Color, string> = {
  orange: 'text-sm font-medium text-orange-400 bg-orange-500/10 inline-block px-3 py-1 rounded-full',
  lime: 'text-sm font-medium text-lime-400 bg-lime-500/10 inline-block px-3 py-1 rounded-full',
  cyan: 'text-sm font-medium text-cyan-400 bg-cyan-500/10 inline-block px-3 py-1 rounded-full',
  purple: 'text-sm font-medium text-purple-400 bg-purple-500/10 inline-block px-3 py-1 rounded-full',
};
const highlightCls = (color: Color) => ({ highlight: HIGHLIGHT[color] });
const ROI: Record<'lime' | 'orange' | 'cyan', { iconWrap: string; icon: string; value: string; unit: string }> = {
  lime: {
    iconWrap: 'w-16 h-16 rounded-2xl bg-lime-500/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform',
    icon: 'w-8 h-8 text-lime-400',
    value: 'text-5xl font-bold text-lime-400',
    unit: 'text-2xl font-bold text-lime-400',
  },
  orange: {
    iconWrap: 'w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform',
    icon: 'w-8 h-8 text-orange-400',
    value: 'text-5xl font-bold text-orange-400',
    unit: 'text-2xl font-bold text-orange-400',
  },
  cyan: {
    iconWrap: 'w-16 h-16 rounded-2xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform',
    icon: 'w-8 h-8 text-cyan-400',
    value: 'text-5xl font-bold text-cyan-400',
    unit: 'text-2xl font-bold text-cyan-400',
  },
};
const roiCls = (color: keyof typeof ROI) => ROI[color];

// ---- Textos ----
const problems = [
  { icon: Calendar, title: 'Conflito de Horários', description: 'Duas turmas marcadas para a mesma quadra. Confusão, reclamação e desgaste com clientes.' },
  { icon: Users, title: 'Prejuízo no Day-Use', description: 'Clientes que reservam e não aparecem (No-show). Quadra vazia = dinheiro perdido.' },
  { icon: Beer, title: 'Caos no Bar', description: 'Grupos grandes consumindo e dificuldade para fechar a conta de cada um. Prejuízo garantido.' },
  { icon: MessageCircle, title: 'WhatsApp Sobrecarregado', description: 'Passar o dia enviando "tem horário pra amanhã?". Atendimento manual que não escala.' },
];

const pillars = [
  {
    icon: CreditCard,
    title: 'Reserva Online pelo Link',
    description: 'O cliente escolhe a quadra e o horário livre pelo link, a qualquer hora. Com o WhatsApp da arena conectado, ele recebe a confirmação e um lembrete antes do jogo.',
    highlight: 'Menos "tem horário?" no seu WhatsApp.',
    cls: { ...highlightCls('orange'), iconWrap: 'w-16 h-16 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform' },
  },
  {
    icon: ShoppingCart,
    title: 'Comandas Integradas (Bar & Pro-Shop)',
    description: 'Cada grupo de jogadores abre uma comanda única. Lançamento rápido de bebidas, snacks e aluguel de raquetes.',
    highlight: 'Pelo tablet ou celular do atendente.',
    cls: { ...highlightCls('lime'), iconWrap: 'w-16 h-16 rounded-2xl bg-gradient-to-r from-lime-500 to-green-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform' },
  },
  {
    icon: Monitor,
    title: 'Totem de Autoatendimento',
    description: 'Evite filas no bar após as partidas. O jogador vai ao totem, compra sua bebida e já volta para a resenha.',
    highlight: 'Menos fila no bar depois do jogo.',
    cls: { ...highlightCls('cyan'), iconWrap: 'w-16 h-16 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform' },
  },
  {
    icon: Megaphone,
    title: 'Campanhas no WhatsApp',
    description: 'Mande o convite do torneio ou a promoção do horário vago para os seus clientes em poucos cliques. Você escolhe quem recebe.',
    highlight: 'Horários promocionais em dias de baixo movimento.',
    cls: { ...highlightCls('purple'), iconWrap: 'w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform' },
  },
];

const clubCards = [
  {
    icon: CreditCard,
    title: 'Crie Seus Planos',
    description: 'Planos como "Mensalista 2x/semana" ou "Horário Fixo Premium". Defina quadras, dias e horários inclusos.',
    highlight: 'Mais previsão nos horários de baixa',
    cls: { iconWrap: 'w-16 h-16 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center flex-shrink-0', highlight: 'text-sm font-medium text-violet-400 bg-violet-500/10 inline-block px-3 py-1 rounded-full' },
  },
  {
    icon: Users,
    title: 'Dashboard de Mensalistas',
    description: 'Veja todos os mensalistas, controle de período, vencimento e status (ativo, pausado, cancelado).',
    highlight: 'Histórico completo de uso',
    cls: { iconWrap: 'w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0', highlight: 'text-sm font-medium text-purple-400 bg-purple-500/10 inline-block px-3 py-1 rounded-full' },
  },
  {
    icon: Calendar,
    title: 'Agenda Integrada',
    description: 'O horário fixo do mensalista é lançado na Agenda (dá para lançar o mês inteiro de uma vez) e a quadra fica ocupada para mais ninguém reservar.',
    highlight: 'Sem quadra marcada duas vezes',
    cls: { iconWrap: 'w-16 h-16 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0', highlight: 'text-sm font-medium text-pink-400 bg-pink-500/10 inline-block px-3 py-1 rounded-full' },
  },
  {
    icon: TrendingUp,
    title: 'Receita Antecipada',
    description: 'Saiba quanto vai faturar antes do mês começar: o mensalista paga o mês adiantado, do jeito que você combinar.',
    highlight: 'Quem paga antes falta menos',
    cls: { iconWrap: 'w-16 h-16 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 flex items-center justify-center flex-shrink-0', highlight: 'text-sm font-medium text-orange-400 bg-orange-500/10 inline-block px-3 py-1 rounded-full' },
  },
];

const roiMetrics = [
  { icon: Calendar, value: '24', unit: 'h', description: 'Reserva online pelo link, até com a arena fechada', prefix: '', cls: roiCls('lime') },
  { icon: TrendingUp, value: '0', unit: ' comissão', description: 'Por reserva ou por pedido do bar: você paga só a mensalidade (pagamento online tem taxa à parte)', prefix: '', cls: roiCls('orange') },
  { icon: Timer, value: '1', unit: ' link', description: 'Para o jogador ver os horários livres e reservar sem te chamar', prefix: '', cls: roiCls('cyan') },
];

const faqs = [
  {
    question: 'Como o jogador reserva?',
    answer: 'Pelo link da arena: ele escolhe a quadra, o dia e o horário livre. A reserva cai na sua agenda e, com o WhatsApp conectado, ele recebe a confirmação e um lembrete antes do jogo. Se você cobra sinal, combine a forma de pagamento com o jogador; a conferência do pagamento é feita por você.',
  },
  {
    question: 'E se o cliente cancelar a reserva?',
    answer: 'Você define até quantas horas antes o jogador pode cancelar ou remarcar pelo link da confirmação. Sinal, multa e devolução seguem a regra que a arena combinar com o jogador e são feitos por você.',
  },
  {
    question: 'Posso gerenciar múltiplas quadras?',
    answer: 'Sim! Cada quadra tem sua própria grade de horários e seus bloqueios (manutenção, chuva, torneio). Serve para Beach Tennis, Padel, Society, Tênis e outros esportes.',
  },
  {
    question: 'Como funciona a comanda do bar?',
    answer: 'Cada grupo abre uma comanda, a equipe lança bebidas, petiscos e aluguel de raquete pelo celular ou tablet e a conta fecha no PDV, em dinheiro, cartão ou Pix.',
  },
  {
    question: 'Consigo organizar torneios?',
    answer: 'Você bloqueia as quadras do torneio na agenda e avisa os jogadores pelas campanhas de WhatsApp. O Mostralo não monta chaveamento nem ranking: a tabela do torneio fica por sua conta.',
  },
  {
    question: 'Posso testar antes de pagar?',
    answer: 'Sim! Oferecemos 7 dias de teste gratuito com todas as funcionalidades. Sem compromisso e sem cartão de crédito.',
  },
  {
    question: 'Como funciona o Clube de Assinaturas para mensalistas?',
    answer: 'Você cria planos como "Mensalista 2x/semana" ou "Horário Fixo Premium". O jogador paga o mês adiantado e o horário fixo é lançado na Agenda (dá para lançar o mês inteiro de uma vez, no dia em que ele paga). Receita antecipada e quadra ocupada nos horários do plano.',
  },
];

// Card com ícone em degradê à esquerda (pilares e clube de assinaturas).
const sideIconCard = (cardClassName: string) =>
  h('Card', cardClassName, [
    h('CardContent', 'p-8', [
      h('div', 'flex items-start gap-6', [
        h('div', { key: 'iconWrap' }, [itemIcon('w-8 h-8 text-white')]),
        h('div', 'flex-1', [f('h3', 'text-xl font-bold text-white mb-3', 'title'), f('p', 'text-zinc-400 mb-4', 'description'), f('p', undefined, 'highlight', { key: 'highlight' })]),
      ]),
    ]),
  ]);

// ---- Página ----
export const arenasEsportivas: NicheContent = {
  path: '/nicho-arenas',
  seo: {
    title: 'Sistema para Arena Esportiva | Beach Tennis, Padel, Society | Mostralo',
    description: 'Sistema completo para arenas esportivas: reserva de quadras online pelo link, confirmação e lembrete no WhatsApp, comanda de bar, totem de autoatendimento e campanhas de WhatsApp. Teste grátis.',
    keywords: 'sistema arena esportiva, reserva quadra online, beach tennis, padel, society, comanda bar esportivo, gestão centro esportivo',
  },
  pageClassName: 'min-h-screen bg-zinc-950',
  sections: [
    // Hero
    h('section', 'relative min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 overflow-hidden', [
      h('div', 'absolute inset-0', [
        layer('absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-pulse'),
        layer('absolute bottom-20 right-10 w-96 h-96 bg-lime-500/10 rounded-full blur-3xl animate-pulse', { animationDelay: '1s' }),
        layer('absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-orange-500/5 to-lime-500/5 rounded-full blur-3xl'),
        h('div', 'absolute inset-0 opacity-5', [
          h('div', { className: 'absolute top-[10%] left-[15%] text-6xl', text: '🎾' }),
          h('div', { className: 'absolute top-[30%] right-[20%] text-4xl', text: '🏸' }),
          h('div', { className: 'absolute bottom-[25%] left-[25%] text-5xl', text: '⚽' }),
          h('div', { className: 'absolute bottom-[40%] right-[15%] text-3xl', text: '🎾' }),
        ]),
      ]),
      h('div', 'relative z-10 container mx-auto px-4 py-20 lg:py-32', [
        h('div', 'grid lg:grid-cols-2 gap-12 items-center', [
          h('div', 'space-y-8', [
            sectionBadge('bg-gradient-to-r from-orange-500/20 to-lime-500/20 text-lime-400 border-lime-500/30 px-4 py-2 text-sm', Trophy, 'Para Arenas de Beach Tennis, Padel e Society'),
            h('h1', {
              className: 'text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight',
              text: [
                'Sua Arena ',
                span(ORANGE_LIME, 'lotada'),
                '. Seu Bar ',
                span('text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-orange-400', 'organizado'),
                '. Seu lucro no ',
                span('text-orange-400', 'máximo'),
                '.',
              ],
            }),
            h('p', {
              className: 'text-lg md:text-xl text-zinc-400 leading-relaxed',
              text: [
                'O ecossistema completo para Centros Esportivos. Gerencie reservas de quadras, controle o consumo do bar via comanda e confirme reservas pelo WhatsApp.',
                span('text-white font-medium', ' Tudo em uma única plataforma feita para o ritmo do seu jogo.'),
              ],
            }),
            trust({
              className: 'flex flex-wrap gap-3',
              itemClassName: 'flex items-center gap-2 bg-zinc-800/50 border border-zinc-700/50 rounded-full px-4 py-2',
              iconClassName: 'w-4 h-4 text-lime-400',
              textClassName: 'text-sm text-zinc-300',
              items: [
                { icon: Calendar, text: 'Reserva 24h' },
                { icon: MessageCircle, text: 'Confirmação no WhatsApp' },
                { icon: ShoppingCart, text: 'Comanda Integrada' },
                { icon: Megaphone, text: 'WhatsApp Marketing' },
              ],
            }),
            custom(ArenaHeroCtas),
          ]),
          custom(ArenaHeroMockup),
        ]),
      ]),
    ]),

    // Problemas
    h('section', 'py-20 bg-zinc-950', [
      h('div', 'container mx-auto px-4', [
        agendaHeader({
          className: 'text-center mb-16',
          badge: sectionBadge('bg-red-500/10 text-red-400 border-red-500/30 mb-4', XCircle, 'O Jogo Não Pode Parar'),
          title: ['Cansado de confusão nos horários e ', span('text-red-400', '"furos"'), ' nas reservas?'],
          titleClassName: 'text-3xl md:text-4xl font-bold text-white mb-4',
          text: 'Esses problemas estão custando dinheiro e clientes todos os dias.',
          textClassName: 'text-zinc-400 text-lg max-w-2xl mx-auto',
        }),
        grid({
          className: 'grid md:grid-cols-2 lg:grid-cols-4 gap-6',
          items: problems,
          card: h('Card', 'bg-zinc-900/50 border-zinc-800 hover:border-red-500/30 transition-all group', [
            h('CardContent', 'p-6', [
              h('div', 'w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform', [itemIcon('w-7 h-7 text-red-400')]),
              f('h3', 'text-lg font-bold text-white mb-2', 'title'),
              f('p', 'text-zinc-400 text-sm', 'description'),
            ]),
          ]),
        }),
        h('div', 'mt-12 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-6 text-center', [
          h('p', {
            className: 'text-zinc-300 text-lg',
            text: [
              span('text-red-400 font-bold', 'Cada "furo" de reserva'),
              ' em horário nobre é dinheiro perdido (exemplo: R$ 150,00 a hora).',
              br(),
              span('text-zinc-400', 'Multiplique isso por mês e veja quanto está perdendo.'),
            ],
          }),
        ]),
      ]),
    ]),

    // Os 4 pilares
    h('section', 'py-20 bg-gradient-to-b from-zinc-950 to-zinc-900', [
      h('div', 'container mx-auto px-4', [
        agendaHeader({
          className: 'text-center mb-16',
          badge: sectionBadge('bg-lime-500/10 text-lime-400 border-lime-500/30 mb-4', Trophy, 'Match Point da Gestão'),
          title: ['O ', span(ORANGE_LIME, '"Cérebro"'), ' da sua Arena'],
          titleClassName: 'text-3xl md:text-4xl font-bold text-white mb-4',
          text: 'Quatro recursos que transformam a gestão do seu centro esportivo.',
          textClassName: 'text-zinc-400 text-lg max-w-2xl mx-auto',
        }),
        grid({
          className: 'grid md:grid-cols-2 gap-6',
          items: pillars,
          card: sideIconCard('bg-zinc-900/50 border-zinc-800 hover:border-lime-500/30 transition-all overflow-hidden group'),
        }),
      ]),
    ]),

    subscriptionClubSection({
      title: ['Mensalistas que pagam', ' ', span('bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent', 'antes de jogar')],
      text: [
        'Crie planos como ',
        { tag: 'strong', className: 'text-white', text: '"Mensalista Quadra Fixa"' },
        ' ou',
        ' ',
        { tag: 'strong', className: 'text-white', text: '"Plano 2x/semana"' },
        ' e tenha receita garantida.',
      ],
      grid: grid({
        className: 'grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12',
        items: clubCards,
        card: sideIconCard('bg-zinc-900/50 border-zinc-800 hover:border-violet-500/30 transition-all overflow-hidden'),
      }),
      example: {
        title: '🎾 Mensalista 2x/semana',
        description: 'Beach Tennis 1 - Terça e Quinta 18h',
        price: '399',
        note: 'Quadra garantida toda semana!',
        noteClassName: 'text-lime-400',
        noteIcon: CheckCircle2,
      },
    }),

    custom(ArenaCourtSchedule),
    custom(ArenaGroupOrder),

    // ROI
    h('section', 'py-20 bg-zinc-950', [
      h('div', 'container mx-auto px-4', [
        agendaHeader({
          className: 'text-center mb-16',
          badge: sectionBadge('bg-orange-500/10 text-orange-400 border-orange-500/30 mb-4', BarChart3, 'A Conta Fecha'),
          title: ['O sistema que se paga com ', span('text-orange-400', 'poucas reservas'), ' a mais'],
          titleClassName: 'text-3xl md:text-4xl font-bold text-white mb-4',
          text: 'A matemática do "Set" ganho. Veja como o Mostralo impacta seus resultados.',
          textClassName: 'text-zinc-400 text-lg max-w-2xl mx-auto',
        }),
        grid({
          className: 'grid md:grid-cols-3 gap-8 max-w-5xl mx-auto',
          items: roiMetrics,
          card: h('Card', 'bg-zinc-900/50 border-zinc-800 hover:border-lime-500/30 transition-all text-center overflow-hidden group', [
            h('CardContent', 'p-8', [
              h('div', { key: 'iconWrap' }, [itemIcon(undefined, { key: 'icon' })]),
              h('div', 'mb-4', [h('span', { key: 'value' }, [fld('prefix'), fld('value')]), f('span', undefined, 'unit', { key: 'unit' })]),
              f('p', 'text-zinc-400', 'description'),
            ]),
          ]),
        }),
        h('div', 'mt-12 bg-gradient-to-r from-orange-500/10 via-lime-500/10 to-orange-500/10 border border-lime-500/20 rounded-2xl p-8 text-center max-w-3xl mx-auto', [
          h('p', { className: 'text-xl text-white', text: [span('text-lime-400 font-bold', 'Reserva pelo link, confirmação e lembrete'), ' ajudam a diminuir faltas e horário vazio.'] }),
          h('p', { className: 'text-zinc-400 mt-2', text: 'Exemplo: com a hora da quadra a R$ 80, poucas reservas a mais no mês já pagam a mensalidade do Mostralo.' }),
        ]),
      ]),
    ]),

    custom(ArenaBookingDemo),
    custom(ArenaPlans),

    // FAQ
    h('section', 'py-20 bg-gradient-to-b from-zinc-900 to-zinc-950', [
      h('div', 'container mx-auto px-4', [
        agendaHeader({
          className: 'text-center mb-16',
          badge: h('Badge', { className: 'bg-zinc-800 text-zinc-300 border-zinc-700 mb-4', text: 'FAQ' }),
          title: 'Perguntas Frequentes',
          titleClassName: 'text-3xl md:text-4xl font-bold text-white mb-4',
          text: 'Tire suas dúvidas sobre o Mostralo para Arenas Esportivas.',
          textClassName: 'text-zinc-400 text-lg max-w-2xl mx-auto',
        }),
        grid({
          className: 'max-w-3xl mx-auto space-y-4',
          items: faqs,
          card: h('Card', 'bg-zinc-900/50 border-zinc-800 hover:border-lime-500/30 transition-all', [
            h('CardContent', 'p-6', [
              h('h3', 'text-white font-bold mb-2 flex items-start gap-3', [h('span', { className: 'text-lime-400', text: 'Q:' }), fld('question')]),
              f('p', 'text-zinc-400 pl-6', 'answer'),
            ]),
          ]),
        }),
      ]),
    ]),

    // Rodapé
    h('footer', 'py-12 bg-zinc-950 border-t border-zinc-800', [
      h('div', 'container mx-auto px-4', [
        h('div', 'flex flex-col md:flex-row items-center justify-between gap-6', [
          h('div', 'flex items-center gap-3', [
            h('div', 'w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-lime-500 flex items-center justify-center', [icon(Trophy, 'w-5 h-5 text-white')]),
            h('div', [
              h('p', { className: 'text-white font-bold', text: 'Mostralo' }),
              h('p', { className: 'text-zinc-500 text-sm', text: 'Tecnologia que joga no seu time.' }),
            ]),
          ]),
          links({
            as: 'a',
            className: 'flex flex-wrap gap-6 text-sm text-zinc-400',
            linkClassName: 'hover:text-white transition-colors',
            items: [
              { label: 'Termos de Uso', to: '/termos' },
              { label: 'Privacidade', to: '/privacidade' },
              { label: 'Suporte', to: '/suporte' },
            ],
          }),
          h('p', { className: 'text-zinc-500 text-sm', text: ['© ', YEAR, ' Mostralo. Todos os direitos reservados.'] }),
        ]),
      ]),
    ]),

    whatsapp(),
  ],
};
