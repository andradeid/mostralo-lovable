import { AlertTriangle, BarChart3, Beer, Calculator, Clock, Shield, Store, Target, Trophy, XCircle, Zap } from 'lucide-react';
import { badge, br, custom, f, grid, h, icon, itemIcon, layer, mainFooter, plans, span, whatsapp } from '@/components/nicho/build';
import { sectionBadge } from '@/components/nicho/presets/agendamento';
import { BarbeariaV2Cta } from '@/components/nicho/custom/BarbeariaV2Cta';
import { BarbeariaV2PhoneMockup } from '@/components/nicho/custom/BarbeariaV2PhoneMockup';
import { BarbeariaV2Testimonials } from '@/components/nicho/custom/BarbeariaV2Testimonials';
import type { NicheContent } from '@/components/nicho/types';

// Estilo V2 (premium e claro).
const TEXT_DARK = 'text-[#1A1A1A]';
const TEXT_MUTED = 'text-[#666666]';

// ---- Textos ----
const partners = ['BARBER.SHOP', 'VINTAGE', 'THE.CUT', 'CLASSIC'];

const costs = [
  { title: 'No-show', calc: '2 faltas/dia', loss: 'R$ 2.160', desc: 'Cadeira parada.', icon: XCircle },
  { title: 'WhatsApp', calc: '2h digitando/dia', loss: 'R$ 3.360', desc: 'Menos cortes.', icon: Clock },
  { title: 'Esquecimentos', calc: 'Adicionais não pagos', loss: 'R$ 720', desc: 'Furo no caixa.', icon: Beer },
  { title: 'Comissão', calc: 'Erros e retrabalho', loss: 'R$ 800', desc: 'Caos financeiro.', icon: Calculator },
];

const benefitCls = (color: string, bg: string) => ({
  iconWrap: `shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center ${bg}`,
  icon: `w-5 h-5 md:w-6 md:h-6 ${color}`,
});
const benefits = [
  {
    icon: Target,
    title: 'Garantia de Receita',
    desc: 'Receba pagamentos na hora, sem burocracia. Envie cobranças de sinal automáticas via WhatsApp.',
    cls: benefitCls('text-green-600', 'bg-green-50'),
  },
  {
    icon: Shield,
    title: 'Agenda Blindada',
    desc: 'Preencha sua agenda automaticamente e evite cancelamentos de última hora com lembretes inteligentes.',
    cls: benefitCls('text-blue-600', 'bg-blue-50'),
  },
  {
    icon: Trophy,
    title: 'Faturamento Recorrente',
    desc: 'Crie clubes de assinatura e garanta a fidelidade dos seus clientes com pagamentos mensais automáticos.',
    cls: benefitCls('text-purple-600', 'bg-purple-50'),
  },
  {
    icon: BarChart3,
    title: 'Dashboard de Gestão',
    desc: 'Controle total do seu faturamento, comissões e estoque em uma interface limpa e intuitiva.',
    cls: benefitCls('text-orange-600', 'bg-orange-50'),
  },
];

// ---- Página ----
export const barbeariasV2: NicheContent = {
  path: '/nicho-barbearias-v2',
  seo: {
    title: 'Sistema para Barbearias | Agenda Cheia & Gestão Premium | Mostralo',
    description: 'Transforme sua barbearia com o software de gestão mais moderno do mercado. Agenda online, pagamentos via PIX, clube de assinaturas e gestão completa. Teste grátis 30 dias.',
    keywords: 'sistema barbearia, agenda barbearia, software barbershop, gestão barbearia, comanda digital, clube assinatura barbearia',
  },
  pageClassName: 'min-h-screen selection:bg-orange-100 selection:text-orange-900',
  sections: [
    // Hero
    h('section', 'relative pt-8 pb-16 md:pt-20 md:pb-16 overflow-hidden bg-[#FCFCFA]', [
      h('div', 'container mx-auto px-4 relative z-10', [
        h('div', 'flex justify-center lg:justify-start mb-8 md:mb-12', [
          h('Link', { props: { to: '/' }, className: 'flex items-center gap-2 group transition-transform hover:scale-105' }, [
            h('div', 'w-10 h-10 md:w-12 md:h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:rotate-3 transition-transform', [
              icon(Store, 'w-6 h-6 md:w-7 md:h-7 text-white'),
            ]),
            h('span', { className: `text-2xl md:text-3xl font-black tracking-tighter ${TEXT_DARK}`, text: ['Mostra', span('text-orange-500', 'lo')] }),
          ]),
        ]),
        h('div', 'flex flex-col items-center lg:grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto', [
          h('div', 'text-center lg:text-left space-y-6 md:space-y-8 order-2 lg:order-1', [
            badge({
              className: 'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-[#FF5C00] text-sm font-bold border border-orange-100',
              icon: Zap,
              iconClassName: 'w-4 h-4',
              text: 'Software Premium para Barbearias',
            }),
            h('h1', {
              className: `text-3xl md:text-6xl font-extrabold tracking-tight leading-[1.1] ${TEXT_DARK}`,
              text: ['Sua agenda cheia,', br('hidden md:block'), span('text-[#FF5C00]', 'sem esforço.')],
            }),
            h('p', {
              className: `text-base md:text-xl font-medium max-w-xl ${TEXT_MUTED}`,
              text: 'O sistema de gestão que transforma sua barbearia em um negócio moderno, organizado e altamente lucrativo.',
            }),
            custom(BarbeariaV2Cta, { text: 'Agende uma Demonstração', className: 'lg:items-start' }),
            h('div', 'pt-8 border-t border-gray-100 hidden md:block', [
              h('p', { className: 'text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest', text: 'Barbearias Parceiras' }),
              grid({
                className: 'flex flex-wrap justify-center lg:justify-start gap-8 opacity-40 grayscale',
                items: partners.map((value) => ({ value })),
                card: f('div', 'font-black text-xl italic', 'value'),
              }),
            ]),
          ]),
          custom(BarbeariaV2PhoneMockup),
        ]),
      ]),
    ]),

    // Custo da desorganização
    h('section', 'py-16 md:py-24 bg-gray-50 border-y border-gray-100 overflow-hidden relative', [
      h('div', 'container mx-auto px-4 relative z-10', [
        h('div', 'max-w-4xl mx-auto text-center mb-12 md:mb-16 space-y-4', [
          sectionBadge('bg-red-50 text-red-600 border-red-100 px-4 py-2 font-bold mb-4', AlertTriangle, 'O CUSTO DA DESORGANIZAÇÃO'),
          h('h2', {
            className: `text-2xl md:text-5xl font-black tracking-tight px-2 ${TEXT_DARK}`,
            text: ['Quanto dinheiro você ', span('text-red-600 underline decoration-red-200 underline-offset-8', 'joga fora'), ' por mês?'],
          }),
          h('p', { className: `text-base md:text-lg font-medium ${TEXT_MUTED}`, text: 'A desorganização não custa apenas tempo, ela drena seu lucro todos os dias.' }),
        ]),
        grid({
          className: 'grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto mb-12 md:mb-16',
          items: costs,
          card: h('Card', 'border-none shadow-sm bg-white group hover:shadow-xl transition-all duration-300', [
            h('CardContent', 'p-4 md:p-6 space-y-2 md:space-y-4 text-center', [
              h('div', 'w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-red-50 flex items-center justify-center mx-auto', [itemIcon('w-5 h-5 md:w-6 md:h-6 text-red-600')]),
              f('h3', `text-sm md:text-lg font-bold truncate ${TEXT_DARK}`, 'title'),
              h('div', 'py-1 md:py-2 border-y border-gray-50', [
                f('p', 'text-[8px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider', 'calc'),
                f('p', 'text-lg md:text-2xl font-black text-red-600 mt-0.5 md:mt-1', 'loss'),
                h('p', { className: 'text-[8px] md:text-[10px] text-gray-400', text: '/mês' }),
              ]),
              f('p', 'hidden md:block text-xs text-gray-500', 'desc'),
            ]),
          ]),
        }),
        h('div', 'max-w-3xl mx-auto', [
          h('div', 'bg-[#1A1A1A] rounded-2xl md:rounded-[2.5rem] p-6 md:p-12 text-center relative overflow-hidden shadow-2xl', [
            layer('absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl -mr-32 -mt-32'),
            h('div', 'relative z-10 space-y-2 md:space-y-4', [
              h('p', { className: 'text-red-500 font-bold tracking-widest uppercase text-[10px] md:text-sm', text: 'Prejuízo Total Estimado' }),
              h('h3', { className: 'text-3xl md:text-6xl font-black text-white', text: ['R$ 7.040', span('text-red-500', '/mês')] }),
              h('p', {
                className: 'text-gray-400 text-sm md:text-xl',
                text: ['Pare de perder dinheiro. A Mostralo custa menos que ', span('text-white font-bold', '2 cortes por mês'), '.'],
              }),
            ]),
          ]),
        ]),
      ]),
    ]),

    // Benefícios
    h('section', 'py-16 md:py-24 bg-white', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-4xl mx-auto text-center mb-12 md:mb-16 space-y-4', [
          h('h2', {
            className: `text-2xl md:text-5xl font-bold tracking-tight px-4 ${TEXT_DARK}`,
            text: ['Tudo o que sua barbearia precisa,', br('hidden md:block'), ' em um só lugar.'],
          }),
          h('p', { className: `text-base md:text-lg ${TEXT_MUTED}`, text: 'Funcionalidades desenhadas para quem busca alta performance e organização.' }),
        ]),
        grid({
          className: 'flex flex-col gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto px-2 sm:px-0',
          items: benefits,
          card: h('Card', 'border-none shadow-sm bg-gray-50/50 hover:bg-white hover:shadow-md sm:hover:shadow-xl transition-all duration-300', [
            h('CardContent', 'p-4 sm:p-6 md:p-8 flex flex-row sm:flex-col items-start gap-4 sm:gap-4', [
              h('div', { key: 'iconWrap' }, [itemIcon(undefined, { key: 'icon' })]),
              h('div', 'space-y-1 sm:space-y-4', [
                f('h3', `text-base sm:text-lg md:text-xl font-bold ${TEXT_DARK}`, 'title'),
                f('p', `text-xs sm:text-sm leading-relaxed ${TEXT_MUTED}`, 'desc'),
              ]),
            ]),
          ]),
        }),
      ]),
    ]),

    custom(BarbeariaV2Testimonials),

    plans('Agenda', true),

    // Conversão
    h('section', 'py-16 md:py-24 bg-white text-center', [
      h('div', 'container mx-auto px-6 md:px-8', [
        h('div', 'max-w-3xl mx-auto space-y-6 md:space-y-8', [
          h('h2', { className: `text-2xl md:text-5xl font-bold tracking-tight ${TEXT_DARK}`, text: ['Sua barbearia merece o ', span('text-[#FF5C00]', 'melhor sistema.')] }),
          h('p', {
            className: `text-base md:text-lg ${TEXT_MUTED}`,
            text: 'Junte-se a centenas de barbeiros que profissionalizaram sua gestão e multiplicaram seus lucros com a Mostralo.',
          }),
          custom(BarbeariaV2Cta, { text: 'QUERO TESTAR 30 DIAS GRÁTIS AGORA' }),
        ]),
      ]),
    ]),

    mainFooter('light'),
    whatsapp(),
  ],
};
