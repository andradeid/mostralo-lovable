import { ArrowRight, BarChart3, CheckCircle2, ChefHat, DollarSign, Monitor, Star, Tablet, Truck, Tv } from 'lucide-react';
import { badge, cta, f, faq, FOOTER_LINKS, grid, h, icon, itemIcon, layer, links, plans, savings, span, trust, whatsapp } from '@/components/nicho/build';
import type { NicheContent } from '@/components/nicho/types';

// ---- Textos ----
const solutions = [
  {
    icon: Tablet,
    title: 'Totem de Autoatendimento',
    description: 'O cliente chega, escolhe o prato, os acompanhamentos e paga via PIX ou Cartão direto no totem. Menos fila, sem erro de anotação e sem precisar de um funcionário fixo ali.',
  },
  {
    icon: Monitor,
    title: 'KDS (Monitor de Cozinha)',
    description: 'Adeus papelzinho. O pedido do totem vai direto para a tela da cozinha, com cores que indicam o tempo de espera. Sua equipe foca no prato, o sistema foca na organização.',
  },
  {
    icon: Tv,
    title: 'Chamada de Senha Integrada',
    description: "Prato pronto? Com um toque em Chamar, o nome ou a senha do cliente aparece em uma TV no salão. Organização de 'Fast Food' de luxo na sua padaria.",
  },
];

const features = [
  {
    icon: CheckCircle2,
    title: 'O Fim do Erro Humano',
    description: "'Sem cebola', 'Carne bem passada', 'Extra de feijão'. O cliente seleciona tudo no totem. O que ele pede é o que a cozinha recebe, sem anotação no meio.",
    stat: 'Na tela',
    statLabel: 'do jeito que ele pediu',
  },
  {
    icon: Truck,
    title: 'Delivery sem Comissão',
    description: 'Sua padaria também entrega? Pare de pagar 25% pro iFood. Tenha seu próprio cardápio digital, sem comissão por pedido (pagamento online tem taxa à parte), e fidelize quem mora ao redor da loja.',
    stat: '0%',
    statLabel: 'comissão por pedido',
  },
  {
    icon: BarChart3,
    title: 'Financeiro Unificado',
    description: 'Saiba quanto vendeu de pão no balcão e quanto vendeu de almoço no totem, tudo em um só painel, com o caixa do dia na mão.',
    stat: 'Na hora',
    statLabel: 'relatório de vendas',
  },
];

const flow = [
  { icon: Tablet, step: '1', title: 'TOTEM', subtitle: 'Cliente pede e paga' },
  { icon: ChefHat, step: '2', title: 'COZINHA', subtitle: 'KDS organiza os pedidos' },
  { icon: Tv, step: '3', title: 'TV SENHA', subtitle: 'Nome chamado no painel' },
];

const testimonials = [
  { name: 'Seu João', business: 'Padaria São José - SP', text: 'O Totem eliminou a fila do almoço. Minha atendente agora ajuda na produção.', rating: 5 },
  { name: 'Maria', business: 'Panificadora Pão Quente - MG', text: 'A chamada de senha na TV deixou minha padaria com cara de restaurante moderno.', rating: 5 },
  { name: 'Carlos', business: 'Padaria Artesanal - RJ', text: 'Economia de R$ 3.500/mês só em mão de obra. O sistema se pagou no primeiro mês.', rating: 5 },
];

const faqs = [
  {
    q: 'O Totem funciona para padarias que vendem almoço?',
    a: 'Funciona perfeitamente! O Totem é ideal para padarias com self-service ou pratos executivos. O cliente escolhe o prato, os acompanhamentos (arroz, feijão, salada, carne), paga no próprio totem e aguarda ser chamado. Você elimina filas e libera a atendente para outras funções.',
  },
  {
    q: 'Como funciona a chamada de senha na TV?',
    a: "Quando o prato fica pronto, a equipe toca em Chamar no pedido e o nome ou número do cliente aparece na TV do salão (com aviso por voz), chamando-o para retirar. É o mesmo jeito das grandes redes de fast food, agora na sua padaria.",
  },
  {
    q: 'Posso usar o sistema para delivery também?',
    a: 'Sim! O Mostralo unifica balcão, totem e delivery em um só sistema. Você tem seu próprio link de cardápio digital, recebe pedidos via WhatsApp ou site, e tudo aparece no mesmo KDS da cozinha. E o melhor: sem comissão por pedido (pagamento online tem taxa à parte).',
  },
];

// ---- Página ----
export const padarias: NicheContent = {
  path: '/nicho-padarias',
  seo: {
    title: 'Sistema para Padarias e Panificadoras | Totem Autoatendimento | Mostralo',
    description: 'Sistema completo para padarias que servem almoço. Totem de autoatendimento, KDS, chamada de senha na TV. Acabe com filas e economize em mão de obra.',
    keywords: 'sistema padaria, totem autoatendimento padaria, kds padaria, chamada senha padaria, software panificadora, cardápio digital padaria',
  },
  pageClassName: 'min-h-screen bg-zinc-950 text-white',
  sections: [
    // Hero
    h('section', 'relative py-16 md:py-24 px-4 overflow-hidden', [
      layer('absolute inset-0 bg-gradient-to-br from-orange-500/10 via-zinc-950 to-zinc-950'),
      layer('absolute top-20 right-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl'),
      layer('absolute bottom-10 left-10 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl'),
      h('div', 'container mx-auto max-w-6xl relative z-10', [
        h('div', 'text-center', [
          badge({
            as: 'Badge',
            className: 'mb-6 bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-2',
            icon: ChefHat,
            iconClassName: 'w-4 h-4 mr-2',
            text: 'Para Padarias e Panificadoras',
          }),
          h('h1', {
            className: 'text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight',
            text: [
              'Chega de filas e pedidos esquecidos',
              ' ',
              span('text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600', 'no horário do almoço'),
              ' ',
              'da sua padaria.',
            ],
          }),
          h('p', {
            className: 'text-lg md:text-xl text-zinc-400 mb-8 max-w-3xl mx-auto',
            text: 'O Mostralo é o ecossistema All-in-One que substitui a confusão do balcão por um autoatendimento inteligente. Automatize seu almoço, organize sua cozinha e recupere o controle da sua operação.',
          }),
          cta({
            label: 'QUERO ACABAR COM O CAOS',
            className: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-orange-500/30 animate-pulse hover:animate-none transition-all',
            iconRight: { icon: ArrowRight, className: 'ml-2 h-5 w-5' },
          }),
          trust({
            className: 'flex flex-wrap justify-center gap-4 mt-10',
            itemClassName: 'flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-full px-4 py-2',
            iconClassName: 'w-4 h-4 text-orange-400',
            textClassName: 'text-sm text-zinc-300',
            items: [
              { icon: DollarSign, text: 'Sem comissão por pedido' },
              { icon: Tablet, text: 'Totem Autoatendimento' },
              { icon: Monitor, text: 'KDS Integrado' },
              { icon: Tv, text: 'Chamada de Senha' },
            ],
          }),
        ]),
      ]),
    ]),

    // Problema
    h('section', 'py-16 px-4 bg-zinc-900/50', [
      h('div', 'container mx-auto max-w-6xl', [
        h('div', 'text-center mb-12', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-4', text: ['O gargalo do almoço está', ' ', span('text-orange-400', 'matando seu lucro?')] }),
          h('p', {
            className: 'text-lg text-zinc-400 max-w-3xl mx-auto',
            text: 'Atendente sobrecarregada e cliente insatisfeito? Nós temos a solução. No horário de pico, sua atendente não consegue ser rápida o suficiente. Pedidos são esquecidos, o cliente cansa de esperar e sua cozinha vira uma bagunça.',
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6',
          items: solutions,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 group', [
            h('CardHeader', [
              h('div', 'w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform', [itemIcon('w-7 h-7 text-white')]),
              f('CardTitle', 'text-xl text-white', 'title'),
            ]),
            h('CardContent', [f('p', 'text-zinc-400', 'description')]),
          ]),
        }),
      ]),
    ]),

    // Recursos
    h('section', 'py-16 px-4', [
      h('div', 'container mx-auto max-w-6xl', [
        h('div', 'text-center mb-12', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-4', text: ['Tecnologia que trabalha enquanto', ' ', span('text-orange-400', 'você assa o pão')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6',
          items: features,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all duration-300', [
            h('CardContent', 'pt-6', [
              h('div', 'flex items-center gap-3 mb-4', [
                h('div', 'w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center', [itemIcon('w-6 h-6 text-orange-400')]),
                h('div', 'text-right ml-auto', [f('div', 'text-2xl font-bold text-orange-400', 'stat'), f('div', 'text-xs text-zinc-500', 'statLabel')]),
              ]),
              f('h3', 'text-lg font-semibold text-white mb-2', 'title'),
              f('p', 'text-zinc-400 text-sm', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // Fluxo perfeito
    h('section', 'py-16 px-4 bg-zinc-900/50', [
      h('div', 'container mx-auto max-w-6xl', [
        h('div', 'text-center mb-12', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-4', text: ['Fluxo Perfeito:', ' ', span('text-orange-400', 'do pedido ao prato')] }),
          h('p', {
            className: 'text-lg text-zinc-400 max-w-2xl mx-auto',
            text: 'Com o Mostralo, sua padaria opera como um fast food de primeira linha. O cliente pede sozinho, a cozinha recebe organizado e o salão chama pelo nome.',
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6 md:gap-4',
          itemWrapClassName: 'relative',
          items: flow,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all text-center py-8', [
            h('CardContent', [
              h('div', 'w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4', [itemIcon('w-8 h-8 text-white')]),
              f('div', 'text-xs text-orange-400 font-semibold mb-1', 'step', { prefix: 'PASSO ' }),
              f('h3', 'text-xl font-bold text-white mb-1', 'title'),
              f('p', 'text-zinc-400 text-sm', 'subtitle'),
            ]),
          ]),
          connector: h('div', 'hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10', [icon(ArrowRight, 'w-6 h-6 text-orange-500')]),
        }),
        h('p', { className: 'text-center text-zinc-500 mt-8', text: 'Fluxo profissional que elimina filas e erros de pedido' }),
      ]),
    ]),

    savings(),

    // Depoimentos
    h('section', 'py-16 px-4 bg-zinc-900/50', [
      h('div', 'container mx-auto max-w-6xl', [
        h('div', 'text-center mb-12', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-4', text: ['Padarias que já', ' ', span('text-orange-400', 'organizaram o almoço')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6',
          items: testimonials,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-orange-500/30 transition-all', [
            h('CardContent', 'pt-6', [
              h('div', 'flex gap-1 mb-4', [icon(Star, 'w-4 h-4 fill-orange-400 text-orange-400', { repeat: 'rating' })]),
              f('p', 'text-zinc-300 mb-4 italic', 'text', { quote: true }),
              h('div', [f('div', 'font-semibold text-white', 'name'), f('div', 'text-sm text-zinc-500', 'business')]),
            ]),
          ]),
        }),
      ]),
    ]),

    plans('Essencial'),

    // FAQ
    h('section', 'py-16 px-4 bg-zinc-900/50', [
      h('div', 'container mx-auto max-w-3xl', [
        h('div', 'text-center mb-12', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-4', text: ['Dúvidas', ' ', span('text-orange-400', 'Frequentes')] }),
        ]),
        faq({
          variant: 'accordion',
          className: 'space-y-4',
          itemClassName: 'bg-zinc-900 border border-zinc-800 rounded-lg px-6 data-[state=open]:border-orange-500/50',
          triggerClassName: 'text-white hover:text-orange-400 text-left',
          contentClassName: 'text-zinc-400',
          valuePrefix: 'faq-',
          items: faqs,
        }),
      ]),
    ]),

    // Rodapé
    h('footer', 'py-12 px-4 border-t border-zinc-800', [
      h('div', 'container mx-auto max-w-6xl', [
        h('div', 'text-center', [
          h('p', { className: 'text-xl font-semibold text-white mb-2', text: 'Mostralo.com.br' }),
          h('p', { className: 'text-zinc-400', text: 'Menos filas. Mais pedidos. Lucro total.' }),
          links({ className: 'flex flex-wrap justify-center gap-6 mt-6 text-sm text-zinc-500', linkClassName: 'hover:text-orange-400 transition-colors', items: FOOTER_LINKS }),
        ]),
      ]),
    ]),

    whatsapp(),
  ],
};
