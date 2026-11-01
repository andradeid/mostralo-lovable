import { ArrowRight, BarChart3, Check, DollarSign, Flame, MessageSquare, Monitor, Printer, ShieldCheck, Star, Tablet, Utensils } from 'lucide-react';
import { badge, cta, f, faq, FOOTER_LINKS, grid, h, icon, itemIcon, layer, links, plans, savings, span, trust, whatsapp } from '@/components/nicho/build';
import type { NicheContent } from '@/components/nicho/types';

const GRADIENT = 'bg-gradient-to-r from-orange-500 to-yellow-400 bg-clip-text text-transparent';

const solutionCls = (color: 'orange' | 'yellow') => ({
  iconWrap: `w-14 h-14 rounded-xl bg-gradient-to-br ${color === 'orange' ? 'from-orange-500/20 to-orange-600/10' : 'from-yellow-400/20 to-yellow-500/10'} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`,
  icon: `h-7 w-7 ${color === 'orange' ? 'text-orange-400' : 'text-yellow-400'}`,
});

// ---- Textos ----
const solutions = [
  {
    icon: Utensils,
    title: 'Montador de Pastel Inteligente',
    description: 'Meia-meia, adicionais (ovo, queijo extra, bacon) e combos com caldo de cana. O cliente escolhe tudo de forma visual e o pedido chega pronto para a fritura, sem erro de anotação.',
    cls: solutionCls('orange'),
  },
  {
    icon: Monitor,
    title: 'KDS (Monitor de Cozinha)',
    description: 'Organize sua linha de produção. Os pedidos aparecem por ordem de chegada, com cor pelo tempo de espera, para saber qual pastel montar e fritar primeiro.',
    cls: solutionCls('yellow'),
  },
  {
    icon: Printer,
    title: 'Impressão Automática',
    description: 'O pedido sai impresso na cozinha com todos os detalhes e observações: pelo navegador ou, no app Mostralo Pedidos, automático ao aceitar. Agilidade do balcão à entrega.',
    cls: solutionCls('orange'),
  },
];

const features = [
  {
    icon: MessageSquare,
    title: 'O Vendedor que Não Dorme',
    description: "'Dia de Pastel!' Em poucos cliques você manda promoções pelo WhatsApp para os clientes fiéis nos dias de menor movimento (você escolhe quem recebe e pode agendar o envio).",
    stat: '1 clique',
    statLabel: 'para disparar a campanha',
  },
  {
    icon: DollarSign,
    title: 'Sem Comissão = Dinheiro no Bolso',
    description: 'Direcione seus clientes para seu link próprio: lá não há comissão por pedido, só a mensalidade do Mostralo (pagamento online tem taxa à parte).',
    stat: '0%',
    statLabel: 'comissão por pedido',
  },
  {
    icon: BarChart3,
    title: 'Financeiro Integrado',
    description: 'Controle seu fluxo de caixa, saiba quais sabores são os campeões de venda e tenha relatórios detalhados para tomar decisões inteligentes.',
    stat: 'Na hora',
    statLabel: 'relatório de vendas',
  },
];

const flow = [
  { icon: Tablet, step: '1', title: 'TOTEM', description: 'Cliente monta seu pastel' },
  { icon: Flame, step: '2', title: 'FRITURA', description: 'KDS organiza a produção' },
  { icon: Check, step: '3', title: 'RETIRADA', description: 'Nome chamado no painel' },
];

const testimonials = [
  { quote: 'O montador de pastel zerou os erros de recheio. Meia-meia nunca mais sai errado.', author: 'Ricardo', business: 'Pastelaria do Riquinho - SP' },
  { quote: 'O Totem no balcão foi sensacional. Reduzi 2 funcionários no caixa e a fila sumiu.', author: 'Ana', business: 'Pastelaria Crocante - MG' },
  { quote: 'Saí do iFood e economizo R$ 5.000/mês. Já penso em abrir a segunda unidade.', author: 'Marcos', business: 'Pastel & Caldo - RJ' },
];

const faqs = [
  {
    q: 'Como funciona o montador de pastel?',
    a: 'O cliente entra no seu cardápio digital, escolhe o recheio principal (carne, frango, queijo, pizza), pode fazer meia-meia com outro sabor, adicionar extras (ovo, bacon, queijo extra) e montar combos com caldo de cana ou refrigerante. O pedido chega completo e detalhado na cozinha, sem risco de erro de recheio.',
  },
  {
    q: 'O Totem de Autoatendimento funciona bem em pastelaria?',
    a: 'Funciona perfeitamente! O Totem é ideal para pastelarias de balcão com fluxo intenso. O cliente monta o pedido sozinho, paga na hora e aguarda ser chamado. Você reduz filas e erros de anotação e pode realocar funcionários para a produção.',
  },
  {
    q: 'Como o KDS ajuda o pastel a chegar crocante?',
    a: 'O KDS mostra os pedidos por ordem de chegada, com o tempo de espera de cada um em cores. A equipe vê o que fritar primeiro e marca quando está pronto, para o pastel não ficar parado na embalagem.',
  },
];

// ---- Página ----
export const pastelarias: NicheContent = {
  path: '/nicho-pastelarias',
  seo: {
    title: 'Sistema para Pastelarias | Mostralo - Cardápio Digital e Gestão',
    description: 'Sistema completo para pastelarias: montador de pastel inteligente, KDS, totem de autoatendimento e WhatsApp Marketing. Sem comissão por pedido: mensalidade fixa.',
    keywords: 'sistema pastelaria, cardápio digital pastelaria, montador de pastel, totem autoatendimento, kds pastelaria, delivery pastelaria',
  },
  pageClassName: 'min-h-screen bg-zinc-950 text-white',
  sections: [
    // Hero
    h('section', 'relative py-16 md:py-24 overflow-hidden', [
      layer('absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-yellow-400/5'),
      layer('absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl'),
      layer('absolute bottom-20 right-10 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl'),
      h('div', 'container mx-auto px-4 relative z-10', [
        h('div', 'max-w-4xl mx-auto text-center', [
          badge({
            className: 'inline-flex items-center gap-2 bg-zinc-900/80 border border-orange-500/30 rounded-full px-4 py-2 mb-6',
            emoji: '🥟',
            emojiClassName: 'text-2xl',
            text: 'Para Pastelarias (Delivery e Balcão)',
            textClassName: 'text-orange-400 font-medium',
          }),
          h('h1', { className: 'text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight', text: ['Pare de fritar o seu lucro', ' ', span(GRADIENT, 'com as taxas dos apps de entrega.')] }),
          h('p', {
            className: 'text-lg md:text-xl text-zinc-400 mb-8 max-w-3xl mx-auto',
            text: 'O Mostralo é o ecossistema All-in-One que organiza a sua pastelaria: do montador de recheios à gestão de entregas em tempo real. Venda sem comissão por pedido e tenha uma operação profissional.',
          }),
          cta({
            asChild: true,
            label: 'QUERO MINHA PASTELARIA LUCRATIVA',
            className: 'bg-gradient-to-r from-orange-500 to-yellow-400 hover:from-orange-600 hover:to-yellow-500 text-zinc-900 font-bold text-lg px-8 py-6 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300 animate-pulse',
            iconRight: { icon: ArrowRight, className: 'ml-2 h-5 w-5' },
          }),
          trust({
            className: 'flex flex-wrap justify-center gap-4 mt-10',
            itemClassName: 'flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-full px-4 py-2',
            iconClassName: 'h-4 w-4 text-orange-400',
            textClassName: 'text-sm text-zinc-300',
            items: [
              { icon: ShieldCheck, text: 'Sem comissão por pedido' },
              { icon: Utensils, text: 'Montador Inteligente' },
              { icon: Monitor, text: 'KDS Integrado' },
              { icon: MessageSquare, text: 'WhatsApp Marketing' },
            ],
          }),
        ]),
      ]),
    ]),

    // Problema
    h('section', 'py-16 md:py-20 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-4xl mx-auto text-center mb-12', [
          h('h2', {
            className: 'text-3xl md:text-4xl font-bold mb-4',
            text: ['Muitos pedidos, muitos sabores e', ' ', span('text-orange-400', 'pouco tempo?'), ' ', 'O Mostralo resolve.'],
          }),
          h('p', {
            className: 'text-zinc-400 text-lg',
            text: 'No horário de pico, um erro no recheio ou um pedido esquecido no WhatsApp é prejuízo na certa. Se você ainda depende de anotações manuais ou paga 25% de taxa para o iFood, sua pastelaria está a perder fôlego.',
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6 max-w-5xl mx-auto',
          items: solutions,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 group', [
            h('CardContent', 'p-6', [
              h('div', { key: 'iconWrap' }, [itemIcon(undefined, { key: 'icon' })]),
              f('h3', 'text-xl font-bold text-white mb-3', 'title'),
              f('p', 'text-zinc-400', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // Recursos
    h('section', 'py-16 md:py-20', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-4xl mx-auto text-center mb-12', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-4', text: ['Tecnologia que gera', ' ', span(GRADIENT, 'Recorrência e Lucro')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6 max-w-5xl mx-auto',
          items: features,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-yellow-400/50 transition-all duration-300 overflow-hidden group', [
            h('CardContent', 'p-6', [
              h('div', 'flex items-center justify-between mb-4', [
                h('div', 'w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-400/10 flex items-center justify-center', [itemIcon('h-6 w-6 text-orange-400')]),
                h('div', 'text-right', [f('div', `text-2xl font-bold ${GRADIENT}`, 'stat'), f('div', 'text-xs text-zinc-500', 'statLabel')]),
              ]),
              f('h3', 'text-xl font-bold text-white mb-3', 'title'),
              f('p', 'text-zinc-400 text-sm', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // Experiência phygital
    h('section', 'py-16 md:py-20 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-4xl mx-auto text-center mb-12', [
          badge({
            className: 'inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-2 mb-6',
            icon: Tablet,
            iconClassName: 'h-4 w-4 text-yellow-400',
            text: 'Experiência Phygital',
            textClassName: 'text-yellow-400 font-medium',
          }),
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-4', text: ['Balcão lotado?', ' ', span('text-yellow-400', 'Totem acaba com as filas.')] }),
          h('p', {
            className: 'text-zinc-400 text-lg',
            text: 'O cliente chega no balcão, escolhe seu pastel no Totem de Autoatendimento, paga na hora e aguarda ser chamado. Menos fila, sem erro de anotação no recheio e mais agilidade.',
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6 max-w-4xl mx-auto',
          itemWrapClassName: 'relative',
          items: flow,
          card: h('Card', 'bg-zinc-800/50 border-zinc-700 text-center p-6', [
            h('div', 'w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-yellow-400 flex items-center justify-center mx-auto mb-4', [itemIcon('h-8 w-8 text-zinc-900')]),
            f('div', 'text-sm text-orange-400 font-medium mb-1', 'step', { prefix: 'Passo ' }),
            f('h3', 'text-xl font-bold text-white mb-2', 'title'),
            f('p', 'text-zinc-400 text-sm', 'description'),
          ]),
          connector: h('div', 'hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10', [icon(ArrowRight, 'h-6 w-6 text-orange-400')]),
        }),
        h('p', { className: 'text-center text-zinc-500 mt-8', text: 'Autoatendimento que elimina filas e erros de pedido' }),
      ]),
    ]),

    savings(),

    // Depoimentos
    h('section', 'py-16 md:py-20 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'text-center mb-12', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-4', text: ['Pastelarias que já', ' ', span('text-orange-400', 'faturam mais')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6 max-w-5xl mx-auto',
          items: testimonials,
          card: h('Card', 'bg-zinc-800/50 border-zinc-700', [
            h('CardContent', 'p-6', [
              h('div', 'flex gap-1 mb-4', [icon(Star, 'h-4 w-4 fill-yellow-400 text-yellow-400', { repeat: 5 })]),
              f('p', 'text-zinc-300 mb-4 italic', 'quote', { quote: true }),
              h('div', [f('div', 'font-semibold text-white', 'author'), f('div', 'text-sm text-zinc-500', 'business')]),
            ]),
          ]),
        }),
      ]),
    ]),

    plans('Essencial'),

    // FAQ
    h('section', 'py-16 md:py-20 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto', [
          h('div', 'text-center mb-10', [
            h('h2', { className: 'text-3xl md:text-4xl font-bold mb-4', text: ['Perguntas ', span('text-orange-400', 'Frequentes')] }),
          ]),
          faq({
            variant: 'accordion',
            className: 'space-y-4',
            itemClassName: 'bg-zinc-800/50 border border-zinc-700 rounded-lg px-6',
            triggerClassName: 'text-white hover:text-orange-400',
            contentClassName: 'text-zinc-400',
            valueStart: 1,
            items: faqs,
          }),
        ]),
      ]),
    ]),

    // Rodapé
    h('footer', 'py-8 border-t border-zinc-800', [
      h('div', 'container mx-auto px-4', [
        h('div', 'text-center', [
          h('p', { className: 'text-zinc-500 mb-4', text: [span('font-semibold text-white', 'Mostralo.com.br'), ' | Sua marca. Seu lucro. Sua pastelaria no próximo nível.'] }),
          links({ className: 'flex justify-center gap-6 text-sm text-zinc-600', linkClassName: 'hover:text-orange-400 transition-colors', items: FOOTER_LINKS }),
        ]),
      ]),
    ]),

    whatsapp(),
  ],
};
