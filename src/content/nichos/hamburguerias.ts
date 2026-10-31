import { Beef, Bike, ChefHat, Flame, MessageSquare, Monitor, Star, Tablet, TrendingUp, Zap } from 'lucide-react';
import { badge, cta, custom, f, faq, FOOTER_LINKS, grid, h, icon, itemIcon, layer, links, plans, savings, span, style, trust, whatsapp } from '@/components/nicho/build';
import { HamburgueriaKanban } from '@/components/nicho/custom/HamburgueriaKanban';
import type { NicheContent } from '@/components/nicho/types';

// ---- Textos ----
const solutions = [
  {
    icon: Beef,
    title: 'Adicionais Ilimitados',
    description: 'Ponto da carne, combos, extras e observações. O cliente monta o burger perfeito sem você precisar atender o telefone.',
  },
  {
    icon: Monitor,
    title: 'KDS (Monitor de Cozinha)',
    description: 'Organize a sequência de montagem por tempo de preparo. Sua equipe da chapa foca no burger, o sistema cuida do tempo.',
  },
  {
    icon: Tablet,
    title: 'Totem de Autoatendimento',
    description: 'Para sua loja física. Reduza filas no balcão e deixe o cliente pedir e pagar via PIX automático sozinho.',
  },
];

const features = [
  {
    icon: TrendingUp,
    title: 'O Fim das Taxas',
    description: 'Imagine economizar mais de R$ 3.000/mês em comissões do iFood. Esse dinheiro é seu, não do aplicativo.',
    stat: 'R$ 3.000+',
    statLabel: 'economia/mês',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Marketing de Resgate',
    description: "'Quinta do Burger!' O Mostralo avisa automaticamente todos os seus clientes fiéis, gerando picos de venda nos dias parados.",
    stat: '+35%',
    statLabel: 'vendas',
  },
  {
    icon: Bike,
    title: 'App do Entregador',
    description: 'Gestão total da sua frota própria. Rastreie a entrega em tempo real e dê segurança para o seu cliente.',
    stat: '100%',
    statLabel: 'controle',
  },
];

const testimonials = [
  { quote: 'Economizo R$ 3.800/mês desde que saí do iFood.', author: 'Carlos', business: 'Smash Burger - SP' },
  { quote: 'O KDS zerou os erros de montagem no horário de pico.', author: 'Amanda', business: 'Burger House - RJ' },
  { quote: 'O totem de autoatendimento reduziu 40% da fila.', author: 'Ricardo', business: 'Fast Burger - MG' },
];

const faqs = [
  {
    q: 'Como funciona o controle de ponto da carne?',
    a: 'O cliente escolhe o ponto (Mal passado, Ao ponto, Bem passado) direto no cardápio. O pedido chega formatado para a chapa com todas as informações destacadas, evitando erros de preparo.',
  },
  {
    q: 'O sistema suporta adicionais ilimitados?',
    a: 'Sim! Você pode criar quantos adicionais quiser: bacon extra, queijo cheddar, cebola caramelizada, molhos especiais. O cliente monta o burger do jeito dele e o sistema calcula tudo automaticamente.',
  },
  {
    q: 'Como funciona o Totem de Autoatendimento?',
    a: 'Você disponibiliza um tablet na sua loja. O cliente faz o pedido sozinho, paga via PIX e o pedido cai automaticamente na cozinha. Sem filas, sem erros, e você economiza com atendentes.',
  },
];

// Animações usadas pelo CTA (neon-pulse) e pelo Kanban (progress).
const ANIMATIONS = `
        @keyframes neon-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(249, 115, 22, 0.4); }
          50% { box-shadow: 0 0 45px rgba(249, 115, 22, 0.8); }
        }
        @keyframes progress {
          0%, 100% { width: 60%; }
          50% { width: 80%; }
        }
      `;

// ---- Página ----
export const hamburguerias: NicheContent = {
  path: '/nicho-hamburguerias',
  seo: {
    title: 'Sistema para Hamburguerias | Cardápio Digital, KDS e Delivery | Mostralo',
    description: 'Sistema completo para hamburguerias. Cardápio digital com adicionais ilimitados, KDS, totem de autoatendimento e gestão de delivery. Taxa 0% por pedido.',
    keywords: 'sistema hamburgueria, cardápio digital burger, KDS hamburgueria, delivery hamburgueria, totem autoatendimento, gestão fast food',
  },
  pageClassName: 'min-h-screen bg-zinc-950 text-white',
  sections: [
    // Hero
    h('section', 'relative overflow-hidden', [
      layer('absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-zinc-950'),
      layer('absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl'),
      layer('absolute bottom-20 right-10 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl'),
      h('div', 'relative max-w-7xl mx-auto px-4 py-20 md:py-32', [
        h('div', 'text-center max-w-4xl mx-auto', [
          badge({
            className: 'inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 mb-8',
            icon: Beef,
            iconClassName: 'w-4 h-4 text-orange-500',
            text: 'Para Hamburguerias & Fast-Food',
            textClassName: 'text-orange-400 text-sm font-medium',
          }),
          h('h1', {
            className: 'text-4xl md:text-6xl font-bold mb-6 leading-tight',
            text: ['Domine o seu delivery e', ' ', span('text-orange-500', 'pare de dividir o seu lucro'), ' ', 'com os apps.'],
          }),
          h('p', {
            className: 'text-xl md:text-2xl text-zinc-400 mb-10 max-w-3xl mx-auto',
            text: 'O Mostralo é o ecossistema All-in-One que blinda a sua hamburgueria contra taxas abusivas, organiza sua chapa com KDS e automatiza seus pedidos via WhatsApp.',
          }),
          cta({
            label: 'QUERO MINHA HAMBURGUERIA LUCRATIVA',
            className: 'bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 animate-[neon-pulse_2s_ease-in-out_infinite]',
            style: { animation: 'neon-pulse 2s ease-in-out infinite' },
            iconLeft: { icon: Flame, className: 'w-5 h-5 mr-2' },
          }),
          trust({
            className: 'flex flex-wrap justify-center gap-6 mt-12',
            itemClassName: 'flex items-center gap-2 text-zinc-400',
            iconClassName: 'w-4 h-4 text-orange-500',
            textClassName: 'text-sm',
            items: [
              { icon: Zap, text: 'Taxa 0%' },
              { icon: Beef, text: 'Adicionais ilimitados' },
              { icon: Monitor, text: 'KDS integrado' },
              { icon: Tablet, text: 'Totem' },
            ],
          }),
        ]),
      ]),
    ]),

    // Problema
    h('section', 'py-20 px-4 bg-zinc-900/50', [
      h('div', 'max-w-6xl mx-auto', [
        h('div', 'text-center mb-16', [
          h('h2', { className: 'text-3xl md:text-5xl font-bold mb-6', text: ['Pedido errado na chapa é', ' ', span('text-orange-500', 'dinheiro jogado fora.')] }),
          h('p', {
            className: 'text-xl text-zinc-400 max-w-3xl mx-auto',
            text: 'No horário de pico, cada segundo conta. Se você ainda depende de papel ou de sistemas lentos que cobram taxas por cada venda, sua hamburgueria está perdendo oxigênio.',
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-8',
          items: solutions,
          card: h('Card', 'bg-zinc-800 border-zinc-700 hover:border-orange-500/50 transition-all duration-300 group', [
            h('CardContent', 'p-8', [
              h('div', 'w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500/30 transition-colors', [itemIcon('w-7 h-7 text-orange-500')]),
              f('h3', 'text-xl font-bold text-white mb-3', 'title'),
              f('p', 'text-zinc-400', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // Recursos
    h('section', 'py-20 px-4', [
      h('div', 'max-w-6xl mx-auto', [
        h('div', 'text-center mb-16', [
          h('h2', { className: 'text-3xl md:text-5xl font-bold mb-6', text: ['Inteligência de Vendas que', ' ', span('text-orange-500', 'Trabalha por Você')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-8',
          items: features,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all duration-300', [
            h('CardContent', 'p-8', [
              h('div', 'flex items-center justify-between mb-6', [
                h('div', 'w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center', [itemIcon('w-6 h-6 text-orange-500')]),
                h('div', 'text-right', [f('span', 'text-2xl font-bold text-orange-500', 'stat'), f('p', 'text-xs text-zinc-500', 'statLabel')]),
              ]),
              f('h3', 'text-xl font-bold text-white mb-3', 'title'),
              f('p', 'text-zinc-400', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    custom(HamburgueriaKanban),

    savings(),

    // Depoimentos
    h('section', 'py-20 px-4 bg-zinc-900/50', [
      h('div', 'max-w-6xl mx-auto', [
        h('div', 'text-center mb-16', [
          h('h2', { className: 'text-3xl md:text-5xl font-bold mb-6', text: ['Hamburguerias que já', ' ', span('text-orange-500', 'faturam mais')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-8',
          items: testimonials,
          card: h('Card', 'bg-zinc-800 border-zinc-700', [
            h('CardContent', 'p-8', [
              h('div', 'flex gap-1 mb-4', [icon(Star, 'w-5 h-5 fill-orange-500 text-orange-500', { repeat: 5 })]),
              f('p', 'text-white text-lg mb-6', 'quote', { quote: true }),
              h('div', 'flex items-center gap-3', [
                h('div', 'w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center', [icon(ChefHat, 'w-6 h-6 text-orange-500')]),
                h('div', [f('p', 'text-white font-medium', 'author'), f('p', 'text-zinc-500 text-sm', 'business')]),
              ]),
            ]),
          ]),
        }),
      ]),
    ]),

    plans('Essencial'),

    // FAQ
    h('section', 'py-20 px-4 bg-zinc-900/50', [
      h('div', 'max-w-3xl mx-auto', [
        h('div', 'text-center mb-12', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-6', text: ['Perguntas ', span('text-orange-500', 'Frequentes')] }),
        ]),
        faq({
          variant: 'accordion',
          className: 'space-y-4',
          itemClassName: 'bg-zinc-800 border border-zinc-700 rounded-xl px-6 data-[state=open]:border-orange-500/50',
          triggerClassName: 'text-white hover:text-orange-500 text-left py-6',
          contentClassName: 'text-zinc-400 pb-6',
          items: faqs,
        }),
      ]),
    ]),

    // Rodapé
    h('footer', 'py-12 px-4 border-t border-zinc-800', [
      h('div', 'max-w-6xl mx-auto', [
        h('div', 'text-center', [
          h('p', { className: 'text-2xl font-bold text-white mb-2', text: 'Mostralo.com.br' }),
          h('p', { className: 'text-zinc-500', text: 'Sua marca forte. Seu lucro protegido. Sua operação no controle.' }),
          links({ className: 'flex flex-wrap justify-center gap-6 mt-6 text-sm text-zinc-500', linkClassName: 'hover:text-orange-500 transition-colors', items: FOOTER_LINKS }),
        ]),
      ]),
    ]),

    whatsapp(),
    style(ANIMATIONS),
  ],
};
