import { ArrowRight, DollarSign, Grape, MessageSquare, Monitor, Quote, Store, Sun, Tablet } from 'lucide-react';
import { badge, cta, f, faq, grid, h, icon, itemIcon, layer, links, plans, savings, span, trust, whatsapp } from '@/components/nicho/build';
import type { NicheContent } from '@/components/nicho/types';

const GRADIENT = 'bg-gradient-to-r from-violet-400 to-orange-400 bg-clip-text text-transparent';

// Classes por cor sempre literais (o Tailwind não gera classe montada por variável).
const solutionCls = (color: 'violet' | 'orange') => ({
  card:
    color === 'violet'
      ? 'bg-zinc-900 border-zinc-800 hover:border-violet-500/50 transition-all duration-300 group'
      : 'bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 group',
  iconWrap: `w-14 h-14 rounded-xl bg-gradient-to-br ${color === 'violet' ? 'from-violet-500/20 to-violet-600/10' : 'from-orange-500/20 to-orange-600/10'} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`,
  icon: `w-7 h-7 ${color === 'violet' ? 'text-violet-400' : 'text-orange-400'}`,
});

// ---- Textos ----
const solutions = [
  {
    icon: Grape,
    title: 'Montador de Copo Intuitivo',
    description: 'O cliente escolhe o tamanho, as camadas e os adicionais (leite em pó, frutas, caldas) de forma visual. O pedido chega detalhado na produção, sem erro de anotação.',
    cls: solutionCls('violet'),
  },
  {
    icon: Tablet,
    title: 'Totem de Autoatendimento',
    subtitle: 'O Fim das Filas',
    description: 'O cliente pede e paga sozinho no totem. Ideal para horários de pico em lojas físicas. Menos custo com atendentes, mais agilidade.',
    cls: solutionCls('orange'),
  },
  {
    icon: Monitor,
    title: 'PDV Touch para Balcão',
    description: 'Vendas presenciais em poucos toques, com a comanda impressa na copa (térmica 58/80 mm) para montagem imediata.',
    cls: solutionCls('violet'),
  },
];

const features = [
  {
    icon: Sun,
    title: 'WhatsApp Marketing',
    subtitle: 'O Lembrete do Calor',
    description: 'Fez sol? Monte a campanha de WhatsApp em poucos cliques: você escolhe quem recebe e dispara a promoção para os seus clientes no dia quente.',
    stat: '1 clique',
    statLabel: 'para disparar a campanha',
  },
  {
    icon: DollarSign,
    title: 'Sem Comissão = Mais Lucro',
    description: 'Pare de dar 1 de cada 4 copos de açaí para os aplicativos. No seu link do Mostralo não há comissão por pedido: você paga só a mensalidade (pagamento online tem taxa à parte).',
    stat: '0%',
    statLabel: 'comissão por pedido',
  },
  {
    icon: Monitor,
    title: 'KDS - Monitor de Preparo',
    description: 'Sua equipe visualiza os pedidos por ordem de chegada em uma tela, com cores que indicam o tempo de espera. Organização máxima para não derreter o produto.',
    stat: 'Na hora',
    statLabel: 'pedido na tela',
  },
];

const flow = [
  { icon: Tablet, title: 'TOTEM', subtitle: 'Balcão Autoatendimento', description: 'Cliente pede e paga sozinho' },
  { icon: MessageSquare, title: 'WHATSAPP', subtitle: 'Delivery pelo Link', description: 'Cliente pede sozinho pelo link' },
  { icon: Store, title: 'PDV', subtitle: 'Gestão Unificada', description: 'Tudo em um só painel' },
];

const testimonials = [
  { quote: 'O totem zerou a fila no horário de pico. Meus clientes adoram!', author: 'Fernanda', business: 'Açaí Tropical - SP', avatar: '🍇' },
  { quote: 'Economizo R$ 4.200/mês desde que parei de depender do iFood.', author: 'Marcos', business: 'Açaí da Praia - RJ', avatar: '🏖️' },
  { quote: 'O montador de copo eliminou os erros de acompanhamentos.', author: 'Juliana', business: 'Açaí Power - MG', avatar: '💪' },
];

const faqs = [
  {
    q: 'Como funciona o montador de copo?',
    a: 'O cliente escolhe o tamanho do copo, as camadas de açaí e todos os adicionais (leite em pó, granola, frutas, caldas) de forma visual e intuitiva. O pedido chega detalhado para a copa, sem erro de anotação.',
  },
  {
    q: 'O totem precisa de internet?',
    a: 'Sim. O totem roda no navegador de um tablet e precisa de internet (Wi-Fi ou 4G) para enviar os pedidos e confirmar o Pix. Não precisa de computador nem de instalação.',
  },
  {
    q: 'Como aviso os clientes nos dias quentes?',
    a: 'Pelas campanhas de WhatsApp do Mostralo: você escreve a promoção, filtra quem recebe (dias sem pedir, número de pedidos ou quanto já gastou) e dispara na hora ou agenda para o dia que quiser.',
  },
];

// ---- Página ----
export const acaiterias: NicheContent = {
  path: '/nicho-acaiterias',
  seo: {
    title: 'Mostralo para Açaiterias | Cardápio Digital, Totem e Delivery sem Comissão',
    description: 'Sistema completo para açaiterias: montador de copo visual, totem de autoatendimento, KDS e delivery sem comissão por pedido (mensalidade fixa). Menos filas e mais lucro.',
    keywords: 'açaí, açaiteria, cardápio digital açaí, totem açaiteria, delivery açaí, sistema açaí, montador de copo',
    url: 'https://mostralo.com.br/nicho-acaiterias',
  },
  pageClassName: 'min-h-screen bg-zinc-950 text-white overflow-x-hidden',
  sections: [
    // Hero
    h('section', 'relative py-16 md:py-24 px-4 overflow-hidden', [
      layer('absolute inset-0 bg-gradient-to-br from-violet-950/30 via-zinc-950 to-orange-950/20'),
      layer('absolute top-20 left-10 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl'),
      layer('absolute bottom-10 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl'),
      h('div', 'container mx-auto max-w-6xl relative z-10', [
        h('div', 'flex justify-center mb-6', [
          badge({
            as: 'span',
            className: 'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm font-medium',
            icon: Grape,
            iconClassName: 'w-4 h-4',
            text: 'Para Açaiterias - Loja Física & Delivery',
          }),
        ]),
        h('h1', {
          className: 'text-3xl md:text-5xl lg:text-6xl font-black text-center mb-6 leading-tight',
          text: ['Transforme sua Açaiteria em uma', ' ', span(GRADIENT, 'máquina de vendas'), ', do balcão ao delivery.'],
        }),
        h('p', {
          className: 'text-lg md:text-xl text-zinc-400 text-center max-w-3xl mx-auto mb-8',
          text: 'O Mostralo é o ecossistema All-in-One que organiza seus adicionais, diminui filas com autoatendimento e tira você das comissões dos aplicativos.',
        }),
        h('div', 'flex justify-center mb-10', [
          cta({
            label: 'QUERO MODERNIZAR MINHA AÇAITERIA',
            className: 'bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300 animate-pulse',
            iconRight: { icon: ArrowRight, className: 'ml-2 w-5 h-5' },
          }),
        ]),
        trust({
          className: 'flex flex-wrap justify-center gap-4 md:gap-6',
          itemClassName: 'flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-full',
          iconClassName: 'w-4 h-4 text-violet-400',
          textClassName: 'text-sm text-zinc-300',
          items: [
            { icon: DollarSign, text: 'Sem comissão por pedido' },
            { icon: Grape, text: 'Montador de Copo' },
            { icon: Tablet, text: 'Totem' },
            { icon: Monitor, text: 'KDS Integrado' },
          ],
        }),
      ]),
    ]),

    // Problema
    h('section', 'py-16 md:py-20 px-4 bg-zinc-900/50', [
      h('div', 'container mx-auto max-w-6xl', [
        h('div', 'text-center mb-12', [
          h('h2', { className: 'text-2xl md:text-4xl font-bold mb-4', text: ['Muitos adicionais? Pouco tempo?', ' ', span('text-violet-400', 'O Mostralo organiza tudo.')] }),
          h('p', {
            className: 'text-zinc-400 max-w-2xl mx-auto',
            text: 'O segredo de uma açaiteria lucrativa é o giro rápido e o erro zero nos acompanhamentos. Se você ainda perde tempo anotando pedidos manualmente ou pagando 25% de taxa pro iFood, sua margem está derretendo.',
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6',
          items: solutions,
          card: h('Card', { key: 'card' }, [
            h('CardHeader', [
              h('div', { key: 'iconWrap' }, [itemIcon(undefined, { key: 'icon' })]),
              h('CardTitle', { className: 'text-white text-xl', field: 'title' }, [
                f('span', 'block text-sm text-orange-400 font-normal mt-1', 'subtitle', { when: 'subtitle' }),
              ]),
            ]),
            h('CardContent', [f('p', 'text-zinc-400', 'description')]),
          ]),
        }),
      ]),
    ]),

    // Recursos
    h('section', 'py-16 md:py-20 px-4', [
      h('div', 'container mx-auto max-w-6xl', [
        h('div', 'text-center mb-12', [
          h('h2', { className: 'text-2xl md:text-4xl font-bold mb-4', text: ['Fidelize o cliente que', ' ', span('text-violet-400', 'ama Açaí')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6',
          items: features,
          card: h('Card', 'bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-800 hover:border-violet-500/30 transition-all duration-300', [
            h('CardContent', 'pt-6', [
              h('div', 'flex items-start gap-4 mb-4', [
                h('div', 'w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0', [itemIcon('w-6 h-6 text-violet-400')]),
                h('div', [f('h3', 'text-lg font-bold text-white', 'title'), f('span', 'text-sm text-orange-400', 'subtitle', { when: 'subtitle' })]),
              ]),
              f('p', 'text-zinc-400 mb-4', 'description'),
              h('div', 'flex items-baseline gap-2 pt-4 border-t border-zinc-800', [
                f('span', 'text-3xl font-black text-violet-400', 'stat'),
                f('span', 'text-sm text-zinc-500', 'statLabel'),
              ]),
            ]),
          ]),
        }),
      ]),
    ]),

    // Loja física + delivery
    h('section', 'py-16 md:py-20 px-4 bg-gradient-to-br from-violet-950/30 via-zinc-900 to-orange-950/20', [
      h('div', 'container mx-auto max-w-6xl', [
        h('div', 'text-center mb-12', [
          h('h2', { className: 'text-2xl md:text-4xl font-bold mb-4', text: ['Loja Física + Delivery =', ' ', span(GRADIENT, 'Experiência Completa')] }),
          h('p', {
            className: 'text-zinc-400 max-w-2xl mx-auto',
            text: 'O Mostralo integra sua loja física com o delivery em uma única plataforma. Totem no balcão, pedidos via WhatsApp e gestão completa em um só lugar.',
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6 md:gap-4',
          itemWrapClassName: 'relative',
          items: flow,
          card: h('Card', 'bg-zinc-900 border-violet-500/30 hover:border-violet-400/50 transition-all', [
            h('CardContent', 'pt-6 text-center', [
              h('div', 'w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/30 to-orange-500/20 flex items-center justify-center mx-auto mb-4', [itemIcon('w-8 h-8 text-violet-400')]),
              f('h3', 'text-lg font-bold text-white mb-1', 'title'),
              f('p', 'text-orange-400 text-sm mb-2', 'subtitle'),
              f('p', 'text-zinc-500 text-sm', 'description'),
            ]),
          ]),
          connector: h('div', 'hidden md:flex absolute top-1/2 -right-5 transform -translate-y-1/2 z-10', [icon(ArrowRight, 'w-6 h-6 text-violet-500/50')]),
        }),
        h('p', { className: 'text-center text-violet-400 mt-8 font-medium', text: 'Tudo conectado em tempo real' }),
      ]),
    ]),

    savings(),

    // Depoimentos
    h('section', 'py-16 md:py-20 px-4 bg-zinc-900/50', [
      h('div', 'container mx-auto max-w-6xl', [
        h('div', 'text-center mb-12', [
          h('h2', { className: 'text-2xl md:text-4xl font-bold mb-4', text: ['Açaiterias que já', ' ', span('text-violet-400', 'faturam mais')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6',
          items: testimonials,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-violet-500/30 transition-all', [
            h('CardContent', 'pt-6', [
              icon(Quote, 'w-8 h-8 text-violet-500/30 mb-4'),
              f('p', 'text-zinc-300 mb-6 italic', 'quote', { quote: true }),
              h('div', 'flex items-center gap-3', [
                f('div', 'w-12 h-12 rounded-full bg-gradient-to-br from-violet-500/30 to-orange-500/20 flex items-center justify-center text-2xl', 'avatar'),
                h('div', [f('p', 'text-white font-semibold', 'author'), f('p', 'text-violet-400 text-sm', 'business')]),
              ]),
            ]),
          ]),
        }),
      ]),
    ]),

    plans('Essencial'),

    // FAQ
    h('section', 'py-16 md:py-20 px-4 bg-zinc-900/50', [
      h('div', 'container mx-auto max-w-3xl', [
        h('div', 'text-center mb-12', [
          h('h2', { className: 'text-2xl md:text-4xl font-bold mb-4', text: ['Perguntas ', span('text-violet-400', 'Frequentes')] }),
        ]),
        faq({
          variant: 'accordion',
          className: 'space-y-4',
          itemClassName: 'bg-zinc-900 border border-zinc-800 rounded-xl px-6',
          triggerClassName: 'text-white hover:text-violet-400 text-left',
          contentClassName: 'text-zinc-400',
          valueStart: 1,
          items: faqs,
        }),
      ]),
    ]),

    // Rodapé
    h('footer', 'py-12 px-4 border-t border-zinc-800', [
      h('div', 'container mx-auto max-w-6xl', [
        h('div', 'text-center', [
          h('p', { className: 'text-xl font-bold mb-2', text: [span(GRADIENT, 'Mostralo.com.br')] }),
          h('p', { className: 'text-zinc-500 mb-6', text: 'Sua marca. Seu açaí. Seu lucro.' }),
          links({
            className: 'flex flex-wrap justify-center gap-6 text-sm text-zinc-500',
            linkClassName: 'hover:text-violet-400 transition-colors',
            items: [
              { label: 'Início', to: '/' },
              { label: 'Funcionalidades', to: '/funcionalidades' },
              { label: 'Suporte', to: '/suporte' },
              { label: 'Termos', to: '/termos' },
              { label: 'Privacidade', to: '/privacidade' },
            ],
          }),
        ]),
      ]),
    ]),

    whatsapp(),
  ],
};
