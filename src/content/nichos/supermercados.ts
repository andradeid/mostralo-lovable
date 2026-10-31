import { ArrowRight, BarChart3, CheckCircle2, DollarSign, MessageCircle, Package, ShoppingBag, Smartphone, Star, Store, Tablet, Truck, Zap } from 'lucide-react';
import { badge, cta, f, faq, grid, h, icon, itemIcon, layer, links, plans, savings, span, trust, whatsapp } from '@/components/nicho/build';
import type { NicheContent } from '@/components/nicho/types';

const GRADIENT = 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-green-400';

// As classes por cor são montadas como no original (`bg-${cor}-500/20`, `text-${cor}-400`...):
// o Tailwind só as gera quando aparecem literais em outro arquivo — mantido para não mudar o visual.
type Color = 'orange' | 'green';
const iconCls = (color: Color) => ({
  iconWrap: `w-14 h-14 rounded-xl bg-${color}-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`,
  icon: `w-7 h-7 text-${color}-400`,
});
const featureCls = (color: Color) => ({ ...iconCls(color), stat: `text-3xl font-bold text-${color}-400` });
const stepCls = (color: Color) => ({
  stepNumber: `w-8 h-8 rounded-full bg-${color}-500 text-white font-bold flex items-center justify-center mx-auto mb-4 text-sm`,
  iconWrap: `w-16 h-16 rounded-2xl bg-${color}-500/20 flex items-center justify-center mx-auto mb-4`,
  icon: `w-8 h-8 text-${color}-400`,
});

// ---- Textos ----
const solutions = [
  {
    icon: ShoppingBag,
    title: 'Catálogo Online Completo',
    description: "Organize por categorias (Limpeza, Bebidas, Padaria, Hortifruti). Seu cliente faz o 'mercadinho' pelo celular e você recebe o pedido pronto para separar.",
    cls: iconCls('orange'),
  },
  {
    icon: Zap,
    title: 'PDV Ultra-Rápido',
    description: 'Venda no balcão com agilidade. Busca rápida por nome e integração total com o estoque. Atenda a fila do pão ou do caixa sem travamentos.',
    cls: iconCls('green'),
  },
  {
    icon: Truck,
    title: 'Delivery Inteligente',
    description: 'Defina taxas de entrega por distância ou bairros vizinhos. Garanta que o pedido chegue em minutos e seja o número #1 em conveniência na sua região.',
    cls: iconCls('orange'),
  },
];

const features = [
  {
    icon: MessageCircle,
    title: 'Recorrência via WhatsApp',
    description: 'O cliente compra produtos de limpeza todo mês? O Mostralo identifica o comportamento e envia ofertas automáticas para garantir que ele compre de você, e não do concorrente.',
    stat: '+45%',
    statLabel: 'vendas recorrentes',
    cls: featureCls('green'),
  },
  {
    icon: Tablet,
    title: 'Totem para Hortifruti/Padaria',
    description: 'Instale um Totem de Autoatendimento no setor de padaria ou frios. O cliente pede, retira a senha e continua fazendo compras. Menos filas, mais vendas.',
    stat: '0',
    statLabel: 'filas',
    cls: featureCls('orange'),
  },
  {
    icon: BarChart3,
    title: 'Gestão Financeira e Estoque',
    description: "Tenha relatórios de quais itens estão 'encalhados' e quais são os campeões de venda. Tome decisões baseadas em dados reais de lucro.",
    stat: '100%',
    statLabel: 'controle',
    cls: featureCls('green'),
  },
];

const pickupSteps = [
  { step: '1', icon: Smartphone, title: 'PEDIDO', subtitle: 'Cliente faz pelo celular', cls: stepCls('orange') },
  { step: '2', icon: Package, title: 'SEPARAÇÃO', subtitle: 'Equipe prepara as sacolas', cls: stepCls('green') },
  { step: '3', icon: CheckCircle2, title: 'RETIRADA', subtitle: 'Sacolas prontas', cls: stepCls('orange') },
];

const testimonials = [
  {
    quote: 'O catálogo online fez meus vizinhos pedirem pelo celular em vez de ir no mercado grande. Virei a conveniência da rua.',
    author: 'Seu Antônio',
    business: 'Mercadinho do Antônio - SP',
    rating: 5,
  },
  {
    quote: 'O Clique e Retire foi sucesso total. O pessoal do escritório compra na hora do almoço e passa só pra buscar.',
    author: 'Dona Rosa',
    business: 'Hortifruti da Rosa - MG',
    rating: 5,
  },
  {
    quote: 'Saí do app e economizo R$ 4.000/mês. Esse dinheiro virou estoque extra pro fim de semana.',
    author: 'Carlos',
    business: 'Mercearia Central - RJ',
    rating: 5,
  },
];

const faqs = [
  {
    q: 'Posso organizar o catálogo por categorias?',
    a: 'Sim! O Mostralo permite criar categorias ilimitadas: Limpeza, Bebidas, Hortifruti, Padaria, Frios, Congelados, etc. O cliente navega como em um supermercado online, mas compra de você, o lojista do bairro.',
  },
  {
    q: 'Como funciona o Clique e Retire?',
    a: 'O cliente faz o pedido pelo celular e seleciona "Retirar na Loja". Sua equipe separa os produtos e, quando o cliente chega, as sacolas já estão prontas. Ideal para quem mora ou trabalha perto e não quer esperar entrega.',
  },
  {
    q: 'Consigo definir taxas diferentes por bairro?',
    a: 'Sim! O Mostralo permite configurar taxas de entrega por distância ou por bairros específicos. Você pode cobrar mais barato pra vizinhos próximos e ajustar o valor pra bairros mais distantes, garantindo lucro em cada entrega.',
  },
];

// ---- Página ----
export const supermercados: NicheContent = {
  path: '/nicho-supermercados',
  seo: {
    title: 'Mostralo para Supermercados de Bairro | Catálogo Online + PDV + Delivery',
    description: 'Sistema completo para mercadinhos, mercearias e hortifrutis. Catálogo online por categorias, PDV ultra-rápido, delivery inteligente e Clique e Retire. Taxa 0% sobre vendas.',
    keywords: 'sistema supermercado bairro, catálogo mercadinho, pdv mercearia, delivery hortifruti, clique retire mercado, gestão estoque supermercado',
  },
  pageClassName: 'min-h-screen bg-zinc-950 text-white',
  sections: [
    // Hero
    h('section', 'relative py-16 md:py-24 overflow-hidden', [
      layer('absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950'),
      layer('absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl'),
      layer('absolute bottom-0 left-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl'),
      h('div', 'container mx-auto px-4 relative z-10', [
        h('div', 'flex justify-center mb-6', [
          badge({
            as: 'span',
            className: 'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-sm font-medium border border-green-500/30',
            icon: ShoppingBag,
            iconClassName: 'w-4 h-4',
            text: 'Para Supermercados, Mercadinhos e Hortifrutis',
          }),
        ]),
        h('div', 'max-w-4xl mx-auto text-center', [
          h('h1', {
            className: 'text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight',
            text: ['Leve o seu supermercado para o', ' ', span(GRADIENT, 'celular dos seus vizinhos'), ' ', 'e venda muito mais.'],
          }),
          h('p', {
            className: 'text-lg md:text-xl text-zinc-400 mb-8 max-w-3xl mx-auto',
            text: 'O Mostralo é o ecossistema All-in-One que une seu PDV de balcão a um delivery de bairro profissional. Sem taxas por pedido, com controle de estoque e fidelização automática via WhatsApp.',
          }),
          h('div', 'flex flex-col sm:flex-row gap-4 justify-center mb-12', [
            cta({
              label: 'MODERNIZAR MEU MERCADO',
              className: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105',
              iconLeft: { icon: Store, className: 'w-5 h-5 mr-2' },
            }),
          ]),
          trust({
            className: 'flex flex-wrap justify-center gap-4 md:gap-8',
            itemClassName: 'flex items-center gap-2 text-zinc-400',
            iconClassName: 'w-5 h-5 text-green-400',
            textClassName: 'text-sm font-medium',
            items: [
              { icon: DollarSign, text: 'Taxa 0%' },
              { icon: ShoppingBag, text: 'Catálogo Completo' },
              { icon: Zap, text: 'PDV Ultra-Rápido' },
              { icon: Package, text: 'Clique e Retire' },
            ],
          }),
        ]),
      ]),
    ]),

    // Problema
    h('section', 'py-16 md:py-24 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto text-center mb-12', [
          h('h2', { className: 'text-2xl md:text-4xl font-bold mb-4', text: ['Por que ser', ' ', span('text-orange-400', 'refém dos grandes apps?')] }),
          h('p', { className: 'text-zinc-400 text-lg', text: 'Não deixe o lucro das suas gôndolas ir para a mão de terceiros.' }),
        ]),
        h('div', 'max-w-4xl mx-auto mb-12', [
          h('Card', 'bg-zinc-900/80 border-red-500/30 p-6', [
            h('p', {
              className: 'text-zinc-300 text-center text-lg',
              text: [
                'No supermercado de bairro, o cliente quer rapidez. Mas pagar',
                ' ',
                span('text-red-400 font-bold', '25% de taxa'),
                ' por um pedido de "compras do mês" ou "itens esquecidos" acaba com a sua margem. O Mostralo dá a ',
                span('text-green-400 font-semibold', 'tecnologia dos grandes'),
                ' para o lojista local.',
              ],
            }),
          ]),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6 max-w-6xl mx-auto',
          items: solutions,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-green-500/50 transition-all duration-300 group', [
            h('CardContent', 'p-6', [
              h('div', { key: 'iconWrap' }, [itemIcon(undefined, { key: 'icon' })]),
              f('h3', 'text-xl font-bold mb-3 text-white', 'title'),
              f('p', 'text-zinc-400', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // Inteligência que gera recorrência
    h('section', 'py-16 md:py-24 bg-zinc-950', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto text-center mb-12', [
          h('h2', { className: 'text-2xl md:text-4xl font-bold mb-4', text: ['Inteligência que', ' ', span(GRADIENT, 'gera recorrência')] }),
          h('p', { className: 'text-zinc-400 text-lg', text: 'Tecnologia que trabalha enquanto você abastece as prateleiras.' }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6 max-w-6xl mx-auto',
          items: features,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 group overflow-hidden', [
            h('CardContent', 'p-6', [
              h('div', { key: 'iconWrap' }, [itemIcon(undefined, { key: 'icon' })]),
              f('h3', 'text-xl font-bold mb-3 text-white', 'title'),
              f('p', 'text-zinc-400 mb-4', 'description'),
              h('div', 'pt-4 border-t border-zinc-800', [f('span', undefined, 'stat', { key: 'stat' }), f('span', 'text-zinc-500 text-sm ml-2', 'statLabel')]),
            ]),
          ]),
        }),
      ]),
    ]),

    // Clique e Retire
    h('section', 'py-16 md:py-24 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto text-center mb-12', [
          badge({
            className: 'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-sm font-medium border border-green-500/30 mb-6',
            icon: Package,
            iconClassName: 'w-4 h-4',
            text: 'Clique e Retire',
          }),
          h('h2', { className: 'text-2xl md:text-4xl font-bold mb-4', text: ['Comprou no trabalho?', ' ', span('text-green-400', 'Só passa pra buscar.')] }),
          h('p', {
            className: 'text-zinc-400 text-lg',
            text: 'O cliente faz as compras pelo celular enquanto está no trabalho e avisa que vai passar pra retirar. Quando ele chega, as sacolas já estão prontas. Conveniência máxima para o vizinho ocupado.',
          }),
        ]),
        h('div', 'max-w-5xl mx-auto', [
          grid({
            className: 'grid md:grid-cols-3 gap-4 md:gap-8',
            itemWrapClassName: 'relative',
            items: pickupSteps,
            card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-green-500/50 transition-all duration-300 text-center p-6', [
              f('div', undefined, 'step', { key: 'stepNumber' }),
              h('div', { key: 'iconWrap' }, [itemIcon(undefined, { key: 'icon' })]),
              f('h3', 'text-lg font-bold text-white mb-1', 'title'),
              f('p', 'text-zinc-400 text-sm', 'subtitle'),
            ]),
            connector: h('div', 'hidden md:flex absolute top-1/2 -right-4 transform -translate-y-1/2 z-10', [icon(ArrowRight, 'w-8 h-8 text-zinc-600')]),
          }),
          h('p', { className: 'text-center text-zinc-500 mt-8 text-sm', text: 'Compre online, retire na loja em minutos' }),
        ]),
      ]),
    ]),

    savings(),

    // Depoimentos
    h('section', 'py-16 md:py-24 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto text-center mb-12', [
          h('h2', { className: 'text-2xl md:text-4xl font-bold mb-4', text: ['Mercados de bairro que', ' ', span('text-green-400', 'já vendem mais')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6 max-w-6xl mx-auto',
          items: testimonials,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-green-500/30 transition-all duration-300', [
            h('CardContent', 'p-6', [
              h('div', 'flex gap-1 mb-4', [icon(Star, 'w-5 h-5 fill-orange-400 text-orange-400', { repeat: 'rating' })]),
              f('p', 'text-zinc-300 mb-4 italic', 'quote', { quote: true }),
              h('div', [f('p', 'font-semibold text-white', 'author'), f('p', 'text-zinc-500 text-sm', 'business')]),
            ]),
          ]),
        }),
      ]),
    ]),

    plans('Essencial'),

    // FAQ
    h('section', 'py-16 md:py-24 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto text-center mb-12', [
          h('h2', { className: 'text-2xl md:text-4xl font-bold mb-4', text: ['Perguntas', ' ', span('text-green-400', 'Frequentes')] }),
        ]),
        h('div', 'max-w-3xl mx-auto', [
          faq({
            variant: 'accordion',
            className: 'space-y-4',
            itemClassName: 'bg-zinc-900 border border-zinc-800 rounded-lg px-6',
            triggerClassName: 'text-white hover:text-orange-400 text-left',
            contentClassName: 'text-zinc-400',
            valueStart: 1,
            items: faqs,
          }),
        ]),
      ]),
    ]),

    // CTA final
    h('section', 'py-16 md:py-24 bg-gradient-to-b from-zinc-950 to-zinc-900', [
      h('div', 'container mx-auto px-4 text-center', [
        h('h2', {
          className: 'text-2xl md:text-4xl font-bold mb-4',
          text: ['Pronto para ser o', ' ', span(GRADIENT, 'mercado do bairro'), ' ', 'mais tecnológico?'],
        }),
        h('p', { className: 'text-zinc-400 text-lg mb-8 max-w-2xl mx-auto', text: 'Teste grátis por 7 dias. Sem compromisso, sem cartão de crédito.' }),
        cta({
          label: 'COMEÇAR TESTE GRÁTIS',
          className: 'bg-gradient-to-r from-orange-500 to-green-500 hover:from-orange-600 hover:to-green-600 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105',
          iconLeft: { icon: ShoppingBag, className: 'w-5 h-5 mr-2' },
        }),
      ]),
    ]),

    // Rodapé
    h('footer', 'py-8 bg-zinc-950 border-t border-zinc-800', [
      h('div', 'container mx-auto px-4', [
        h('div', 'flex flex-col md:flex-row justify-between items-center gap-4', [
          h('p', { className: 'text-zinc-500 text-sm', text: 'Mostralo.com.br | O parceiro do comércio de bairro.' }),
          links({
            as: 'a',
            className: 'flex gap-6',
            linkClassName: 'text-zinc-500 hover:text-orange-400 text-sm transition-colors',
            items: ['Início', 'Funcionalidades', 'Suporte', 'Termos', 'Privacidade'].map((label) => ({ label, to: '#' })),
          }),
        ]),
      ]),
    ]),

    whatsapp(),
  ],
};
