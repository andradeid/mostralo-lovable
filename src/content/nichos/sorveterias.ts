import { ArrowRight, BarChart3, Cherry, DollarSign, IceCreamBowl, MessageSquare, Sparkles, Star, Sun, Tablet, Truck, Zap } from 'lucide-react';
import { badge, cta, f, faq, FOOTER_LINKS, grid, h, icon, itemIcon, layer, links, plans, savings, span, trust, whatsapp } from '@/components/nicho/build';
import type { NicheContent } from '@/components/nicho/types';

const GRADIENT = 'bg-gradient-to-r from-orange-500 to-pink-400 bg-clip-text text-transparent';

// Classes por cor sempre literais (o Tailwind não gera classe montada por variável).
const SOLUTION_CLS = {
  pink: { iconWrap: 'w-16 h-16 rounded-2xl bg-pink-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform', icon: 'w-8 h-8 text-pink-400' },
  orange: { iconWrap: 'w-16 h-16 rounded-2xl bg-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform', icon: 'w-8 h-8 text-orange-400' },
  amber: { iconWrap: 'w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform', icon: 'w-8 h-8 text-amber-400' },
};
const solutionCls = (color: keyof typeof SOLUTION_CLS) => SOLUTION_CLS[color];

// ---- Textos ----
const solutions = [
  {
    icon: Cherry,
    title: 'Montador de Taças e Copos',
    description: 'O cliente escolhe o tamanho, os sabores e os toppings (frutas, chocolates, caldas) de forma visual. O pedido chega detalhado à produção, sem erro de anotação.',
    cls: solutionCls('pink'),
  },
  {
    icon: Tablet,
    title: 'Totem de Autoatendimento',
    subtitle: 'O fim das filas',
    description: 'Deixe que o cliente peça e pague via PIX ou Cartão sozinho. Ideal para dias de calor intenso, libertando a sua equipa para focar apenas na montagem dos pedidos.',
    cls: solutionCls('orange'),
  },
  {
    icon: Zap,
    title: 'PDV Touch Rápido',
    description: 'Vendas presenciais em poucos toques, com a comanda impressa (térmica 58/80 mm) para a equipa de produção saber exatamente o que preparar.',
    cls: solutionCls('amber'),
  },
];

const benefits = [
  {
    icon: Sun,
    title: 'WhatsApp Marketing',
    subtitle: 'O Gatilho do Calor',
    description: "'Fim de semana de Sol!' Monte a campanha de WhatsApp em poucos cliques: você escolhe quem recebe (quem não pede há dias, quem mais compra) e dispara a promoção no dia quente.",
    stat: '1 clique',
    statLabel: 'para disparar a campanha',
  },
  {
    icon: DollarSign,
    title: 'Independência Total',
    description: 'Pare de pagar comissão por cada sorvete vendido no delivery. Com o Mostralo, o link é seu, os dados são seus e não há comissão por pedido: só a mensalidade (pagamento online tem taxa à parte).',
    stat: '0%',
    statLabel: 'comissão por pedido',
  },
  {
    icon: BarChart3,
    title: 'Financeiro e Gestão de Sabores',
    description: 'Saiba quais são os sabores campeões de venda e quais estão parados no estoque. Dashboard completo com fluxo de caixa e ticket médio por cliente.',
    stat: 'Na hora',
    statLabel: 'relatório de vendas',
  },
];

const channels = [
  { icon: Tablet, title: 'TOTEM', subtitle: 'Autoatendimento sem filas' },
  { icon: IceCreamBowl, title: 'BALCÃO', subtitle: 'PDV Touch ultra-rápido' },
  { icon: Truck, title: 'DELIVERY', subtitle: 'Link próprio sem comissão' },
];

const testimonials = [
  { quote: 'O Totem foi a melhor decisão. No dia mais quente do ano, a fila simplesmente não existia mais.', author: 'Rafael', business: 'Gelato Artesanal - SP' },
  { quote: 'O montador de taças zerou os erros. Chocolate com morango? O cliente escolhe e vem certinho.', author: 'Carla', business: 'Sorveteria Tropical - MG' },
  { quote: 'O WhatsApp automático no calor é genial. Mandou promoção no domingo de sol e a loja lotou.', author: 'Bruno', business: 'Ice Cream Paradise - RJ' },
];

const faqs = [
  {
    q: 'Como funciona o montador de taças?',
    a: 'O cliente entra no seu cardápio digital ou totem, escolhe o tamanho da taça (pequena, média, grande), seleciona os sabores (até o limite que você definir), escolhe caldas (chocolate, morango, caramelo) e toppings (granulado, frutas, chantilly). O pedido chega completo e visual na produção, sem erro de anotação.',
  },
  {
    q: 'O Totem aguenta o movimento do dia de calor?',
    a: 'Sim! O Totem foi projetado para dias de pico. Enquanto seus atendentes focam na montagem, o cliente pede e paga sozinho. É como ter um caixa extra que não cansa, no horário que a loja estiver aberta.',
  },
  {
    q: "Como funciona o WhatsApp 'Gatilho do Calor'?",
    a: 'Pelas campanhas de WhatsApp do Mostralo: você escreve a promoção, filtra quem recebe (dias sem pedir, número de pedidos ou quanto já gastou) e dispara na hora ou agenda para o dia que quiser. "Sol chegando! 🍦 Que tal um gelado?"',
  },
];

// ---- Página ----
export const sorveterias: NicheContent = {
  path: '/nicho-sorveterias',
  seo: {
    title: 'Mostralo para Sorveterias | Sistema Completo para Gelatarias e Lojas de Gelados',
    description: 'Sistema All-in-One para sorveterias: Totem de autoatendimento, montador de taças, WhatsApp Marketing e delivery próprio. Menos filas e sem comissão por pedido: mensalidade fixa.',
    keywords: 'sistema sorveteria, pdv sorvete, totem autoatendimento gelato, cardápio digital sorvete, delivery sorveteria, gestão gelataria',
  },
  pageClassName: 'min-h-screen bg-zinc-950 text-white',
  sections: [
    // Hero
    h('section', 'relative overflow-hidden py-20 lg:py-32', [
      layer('absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-orange-500/10'),
      layer('absolute top-20 left-10 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl'),
      layer('absolute bottom-20 right-10 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl'),
      h('div', 'container mx-auto px-4 relative z-10', [
        h('div', 'max-w-4xl mx-auto text-center', [
          badge({
            className: 'inline-flex items-center gap-2 bg-pink-500/20 border border-pink-500/30 rounded-full px-4 py-2 mb-8',
            icon: IceCreamBowl,
            iconClassName: 'w-5 h-5 text-pink-400',
            text: 'Para Sorveterias, Gelatarias e Lojas de Gelados',
            textClassName: 'text-pink-300 text-sm font-medium',
          }),
          h('h1', {
            className: 'text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight',
            text: ['Não deixe o seu lucro', ' ', span(GRADIENT, 'derreter'), ' ', 'com taxas abusivas e filas no balcão.'],
          }),
          h('p', {
            className: 'text-xl md:text-2xl text-zinc-300 mb-10 max-w-3xl mx-auto',
            text: 'O Mostralo é o ecossistema All-in-One que organiza a sua sorveteria: do autoatendimento inteligente à gestão de entregas ultra-rápidas. Sem comissão por pedido em cada bola de gelado e com campanhas de WhatsApp para os seus clientes voltarem.',
          }),
          cta({
            asChild: true,
            label: 'QUERO MODERNIZAR MINHA SORVETERIA',
            className: 'bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300 hover:scale-105',
            iconRight: { icon: ArrowRight, className: 'ml-2 w-5 h-5' },
          }),
          trust({
            className: 'flex flex-wrap justify-center gap-4 mt-12',
            itemClassName: 'flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-full px-4 py-2',
            iconClassName: 'w-4 h-4 text-pink-400',
            textClassName: 'text-sm text-zinc-300',
            items: [
              { icon: DollarSign, text: 'Sem comissão por pedido' },
              { icon: Cherry, text: 'Montador de Taças' },
              { icon: Tablet, text: 'Totem Autoatendimento' },
              { icon: MessageSquare, text: 'WhatsApp Marketing' },
            ],
          }),
        ]),
      ]),
    ]),

    // Problema / interesse
    h('section', 'py-20 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-4xl mx-auto text-center mb-16', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-6', text: ['Filas intermináveis e pedidos errados?', ' ', span('text-pink-400', 'Temos a solução.')] }),
          h('p', {
            className: 'text-xl text-zinc-400',
            text: 'No calor, a sua loja enche e o atendimento precisa ser imediato. Se o cliente espera muito ou o pedido vem sem a cobertura desejada, a experiência estraga-se. O Mostralo organiza a operação e tira você das comissões de 25% dos aplicativos de entrega.',
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-8 max-w-6xl mx-auto',
          items: solutions,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-pink-500/50 transition-all duration-300 group', [
            h('CardContent', 'p-8', [
              h('div', { key: 'iconWrap' }, [itemIcon(undefined, { key: 'icon' })]),
              f('h3', 'text-xl font-bold mb-2', 'title'),
              f('p', 'text-pink-400 text-sm mb-3', 'subtitle', { when: 'subtitle' }),
              f('p', 'text-zinc-400', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // Benefícios / desejo
    h('section', 'py-20', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-4xl mx-auto text-center mb-16', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-6', text: ['Tecnologia que cria', ' ', span(GRADIENT, '"Fãs"'), ' ', 'da sua Marca'] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-8 max-w-6xl mx-auto',
          items: benefits,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 overflow-hidden group', [
            h('CardContent', 'p-8', [
              h('div', 'flex items-start justify-between mb-6', [
                h('div', 'w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center group-hover:scale-110 transition-transform', [itemIcon('w-7 h-7 text-orange-400')]),
                h('div', 'text-right', [f('div', 'text-2xl font-bold text-pink-400', 'stat'), f('div', 'text-xs text-zinc-500', 'statLabel')]),
              ]),
              f('h3', 'text-xl font-bold mb-1', 'title'),
              f('p', 'text-orange-400 text-sm mb-3', 'subtitle', { when: 'subtitle' }),
              f('p', 'text-zinc-400', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // Experiência phygital
    h('section', 'py-20 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-4xl mx-auto text-center mb-16', [
          badge({
            className: 'inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 mb-6',
            icon: Sparkles,
            iconClassName: 'w-4 h-4 text-orange-400',
            text: 'Experiência Phygital',
            textClassName: 'text-orange-300 text-sm font-medium',
          }),
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-6', text: ['Do balcão físico ao mundo digital:', ' ', span('text-pink-400', 'tudo integrado.')] }),
          h('p', {
            className: 'text-xl text-zinc-400',
            text: 'Com o Mostralo, sua sorveteria opera no físico e no digital de forma unificada. O cliente pode pedir no Totem da loja, no balcão ou pelo delivery - tudo vai para o mesmo sistema, com o mesmo controle.',
          }),
        ]),
        h('div', 'max-w-5xl mx-auto', [
          grid({
            className: 'grid md:grid-cols-3 gap-6 mb-8',
            itemWrapClassName: 'relative',
            items: channels,
            card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-pink-500/50 transition-all duration-300', [
              h('CardContent', 'p-6 text-center', [
                h('div', 'w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4', [itemIcon('w-8 h-8 text-pink-400')]),
                f('h3', 'font-bold text-lg mb-1', 'title'),
                f('p', 'text-sm text-zinc-400', 'subtitle'),
              ]),
            ]),
            connector: h('div', 'hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10', [icon(ArrowRight, 'w-6 h-6 text-pink-500/50')]),
          }),
          h('div', 'flex justify-center my-6', [layer('w-0.5 h-12 bg-gradient-to-b from-pink-500/50 to-orange-500/50')]),
          h('Card', 'bg-zinc-900 border-orange-500/30 max-w-md mx-auto', [
            h('CardContent', 'p-6 text-center', [
              h('div', 'w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/30 to-pink-500/30 flex items-center justify-center mx-auto mb-4', [icon(BarChart3, 'w-10 h-10 text-orange-400')]),
              h('h3', { className: 'font-bold text-xl mb-2', text: 'DASHBOARD ÚNICO' }),
              h('p', { className: 'text-zinc-400', text: 'Controle total da sua operação' }),
            ]),
          ]),
        ]),
      ]),
    ]),

    savings(),

    // Depoimentos
    h('section', 'py-20 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-4xl mx-auto text-center mb-16', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-6', text: ['Sorveterias que já', ' ', span('text-pink-400', 'derretem a concorrência')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-8 max-w-6xl mx-auto',
          items: testimonials,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-pink-500/30 transition-all duration-300', [
            h('CardContent', 'p-6', [
              h('div', 'flex gap-1 mb-4', [icon(Star, 'w-4 h-4 text-orange-400 fill-orange-400', { repeat: 5 })]),
              f('p', 'text-zinc-300 mb-6 italic', 'quote', { quote: true }),
              h('div', [f('div', 'font-semibold', 'author'), f('div', 'text-sm text-pink-400', 'business')]),
            ]),
          ]),
        }),
      ]),
    ]),

    plans('Essencial'),

    // FAQ
    h('section', 'py-20 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto', [
          h('h2', { className: 'text-3xl font-bold text-center mb-12', text: ['Perguntas ', span('text-pink-400', 'Frequentes')] }),
          faq({
            variant: 'accordion',
            className: 'space-y-4',
            itemClassName: 'bg-zinc-900 border border-zinc-800 rounded-xl px-6',
            triggerClassName: 'text-left hover:no-underline py-6',
            contentClassName: 'text-zinc-400 pb-6',
            valueStart: 1,
            triggerInner: { as: 'span', className: 'font-semibold' },
            items: faqs,
          }),
        ]),
      ]),
    ]),

    // Rodapé
    h('footer', 'py-12 border-t border-zinc-800', [
      h('div', 'container mx-auto px-4 text-center', [
        h('p', { className: 'text-zinc-400 mb-4', text: [span('font-semibold text-white', 'Mostralo.com.br'), ' | Sua marca. Seu lucro. Sua sorveteria no próximo nível.'] }),
        links({ className: 'flex flex-wrap justify-center gap-6 text-sm text-zinc-500', linkClassName: 'hover:text-pink-400 transition-colors', items: FOOTER_LINKS }),
      ]),
    ]),

    whatsapp(),
  ],
};
