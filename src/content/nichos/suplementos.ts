import { BarChart3, DollarSign, Dumbbell, MessageSquare, RefreshCw, ShoppingCart, Smartphone, TrendingUp, Zap } from 'lucide-react';
import { badge, cta, custom, f, faq, grid, h, itemIcon, layer, links, plans, span, strong, trust, whatsapp, icon } from '@/components/nicho/build';
import { SuplementosHeroMockup } from '@/components/nicho/custom/SuplementosHeroMockup';
import type { NicheContent } from '@/components/nicho/types';

const GRADIENT = 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600';

// ---- Textos ----
const benefits = [
  { icon: BarChart3, title: 'Fim da Cegueira de Dados', description: 'Saiba exatamente quem comprou, o que comprou e quando vai comprar de novo.' },
  { icon: Zap, title: 'Agilidade no Balcão', description: 'PDV rápido com controle de sabores e variações (Tamanho, Peso, Sabor) em um clique.' },
  { icon: DollarSign, title: 'Independência de Taxas', description: 'Venda online sem pagar 10-20% para marketplaces. O lucro é 100% seu.' },
];

const features = [
  {
    icon: RefreshCw,
    title: 'Vendedor de Recorrência',
    subtitle: 'Automação Pós-Venda',
    description: 'O sistema identifica que o pré-treino do cliente vai acabar em 5 dias e envia cupom no WhatsApp automaticamente.',
    stat: '+23%',
    statLabel: 'recuperação',
  },
  {
    icon: Smartphone,
    title: 'Catálogo Digital Premium',
    subtitle: 'Vitrine Profissional',
    description: 'Uma vitrine que funciona como App no celular do cliente. Pedidos via delivery ou clique e retire.',
    stat: '3x',
    statLabel: 'mais pedidos',
  },
  {
    icon: TrendingUp,
    title: 'Gestão Financeira e Estoque',
    subtitle: 'Controle Total',
    description: 'Controle de entradas, saídas e fluxo de caixa. Saiba quais produtos têm mais giro e maior margem.',
    stat: '100%',
    statLabel: 'controle',
  },
];

const proofNumbers = [
  { label: 'Ticket médio', value: 'R$ 150' },
  { label: 'Clientes recuperados', value: '15/mês' },
  { label: 'Receita extra', value: 'R$ 2.250', cls: { value: 'text-2xl font-bold text-green-500' } },
  {
    label: 'LUCRO EXTRA',
    value: 'R$ 1.853',
    cls: { box: 'bg-orange-500/20 border border-orange-500/30 rounded-xl p-4', label: 'text-orange-400 text-sm mb-1', value: 'text-2xl font-bold text-orange-500' },
  },
];

const faqs = [
  {
    q: 'Como funciona a integração com o WhatsApp?',
    a: 'O sistema usa a API oficial do WhatsApp para enviar mensagens automáticas baseadas no histórico de compras do cliente. Você pode configurar alertas de recompra, promoções personalizadas e mensagens de aniversário. Tudo de forma segura e sem risco de banimento.',
  },
  {
    q: 'Posso cadastrar diferentes sabores para o mesmo produto?',
    a: 'Sim! O sistema suporta variações ilimitadas: sabor, tamanho, peso, tipo de embalagem. Você cadastra o produto uma vez e adiciona todas as variações. No PDV, é só selecionar a variação desejada em um clique.',
  },
];

// ---- Página ----
export const suplementos: NicheContent = {
  path: '/nicho-suplementos',
  seo: {
    title: 'Mostralo para Lojas de Suplementos | Sistema All-in-One',
    description: 'Sistema completo para lojas de suplementos: PDV rápido, catálogo digital, WhatsApp Marketing com automação de recorrência. Domine o lucro da sua região.',
    keywords: 'sistema loja suplementos, pdv suplementos, whatsapp marketing suplementos, catálogo digital suplementos, gestão loja suplementos',
  },
  pageClassName: 'min-h-screen bg-zinc-950 text-white',
  sections: [
    // Hero
    h('section', 'relative overflow-hidden', [
      layer('absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950'),
      layer('absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/10 via-transparent to-transparent'),
      h('div', 'container relative mx-auto px-4 py-16 md:py-24', [
        h('div', 'flex flex-col lg:flex-row items-center gap-12', [
          h('div', 'flex-1 text-center lg:text-left', [
            badge({
              className: 'inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-2 mb-6',
              icon: Dumbbell,
              iconClassName: 'w-4 h-4 text-orange-500',
              text: 'Para Lojas de Suplementos',
              textClassName: 'text-sm text-orange-400',
            }),
            h('h1', {
              className: 'text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight',
              text: ['Não venda apenas suplementos.', ' ', span(GRADIENT, 'Domine a recorrência'), ' ', 'e o lucro da sua região.'],
            }),
            h('p', {
              className: 'text-lg md:text-xl text-zinc-400 mb-8 max-w-2xl mx-auto lg:mx-0',
              text: 'O Mostralo é o único ecossistema All-in-One que une seu PDV de balcão ao catálogo digital, com automação de WhatsApp que avisa seu cliente quando o Whey está acabando.',
            }),
            cta({
              label: 'TRANSFORMAR MINHA LOJA AGORA',
              className: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-8 py-6 text-lg rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300',
            }),
            trust({
              className: 'flex flex-wrap justify-center lg:justify-start gap-6 mt-8',
              itemClassName: 'flex items-center gap-2 text-zinc-400',
              dotClassName: 'w-2 h-2 bg-orange-500 rounded-full',
              textClassName: 'text-sm',
              items: [{ text: '0% taxas' }, { text: '+23% recuperação' }, { text: 'Setup em 48h' }],
            }),
          ]),
          custom(SuplementosHeroMockup),
        ]),
      ]),
    ]),

    // Problema
    h('section', 'py-16 md:py-24 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'text-center mb-12', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-4', text: ['O cliente compra uma vez e', ' ', span('text-orange-500', 'some'), '?'] }),
          h('p', { className: 'text-xl text-orange-500 font-semibold mb-4', text: 'O Mostralo resolve.' }),
          h('p', {
            className: 'text-zinc-400 max-w-3xl mx-auto text-lg',
            text: [
              'No varejo de suplementos, o lucro está na ',
              strong('text-white', 'VOLTA'),
              ' do cliente. Se você não tem os dados e a automação, você está perdendo dinheiro para os grandes sites todo santo dia.',
            ],
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6',
          items: benefits,
          card: h('Card', 'bg-zinc-900 border-zinc-800 p-6 hover:border-orange-500/50 transition-all duration-300 group', [
            h('div', 'w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors', [itemIcon('w-6 h-6 text-orange-500')]),
            f('h3', 'text-xl font-bold text-white mb-2', 'title'),
            f('p', 'text-zinc-400', 'description'),
          ]),
        }),
      ]),
    ]),

    // Funcionalidades
    h('section', 'py-16 md:py-24', [
      h('div', 'container mx-auto px-4', [
        h('div', 'text-center mb-12', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-4', text: ['Funcionalidades de', ' ', span(GRADIENT, 'Performance')] }),
          h('p', { className: 'text-zinc-400 text-lg', text: 'Ferramentas desenvolvidas para maximizar suas vendas e fidelizar clientes' }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-8',
          items: features,
          card: h('Card', 'bg-zinc-900 border-zinc-800 p-8 hover:border-orange-500/50 transition-all duration-300 relative overflow-hidden group', [
            layer('absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity'),
            h('div', 'relative', [
              h('div', 'flex items-center justify-between mb-4', [
                h('div', 'w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center', [itemIcon('w-7 h-7 text-white')]),
                h('div', 'text-right', [f('div', 'text-3xl font-bold text-orange-500', 'stat'), f('div', 'text-xs text-zinc-500', 'statLabel')]),
              ]),
              f('div', 'text-xs text-orange-400 uppercase tracking-wider mb-1', 'subtitle'),
              f('h3', 'text-xl font-bold text-white mb-3', 'title'),
              f('p', 'text-zinc-400', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // Prova: o sistema se paga
    h('section', 'py-16 md:py-24 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-4xl mx-auto', [
          h('div', 'text-center mb-12', [
            h('h2', { className: 'text-3xl md:text-4xl font-bold mb-4', text: ['O sistema que', ' ', span('text-orange-500', 'se paga sozinho')] }),
          ]),
          h('Card', 'bg-zinc-900 border-orange-500/30 p-8 md:p-12', [
            h('p', {
              className: 'text-xl text-zinc-300 mb-8 text-center',
              text: [
                'Uma loja que recupera ',
                strong('text-white', '15 clientes por mês'),
                ' através da nossa automação já paga ',
                strong('text-orange-500', '3x a mensalidade'),
                ' do sistema. O resto é lucro líquido no seu bolso.',
              ],
            }),
            grid({
              className: 'grid md:grid-cols-4 gap-4 text-center',
              items: proofNumbers,
              card: h('div', { key: 'box', className: 'bg-zinc-800 rounded-xl p-4' }, [
                f('div', 'text-zinc-500 text-sm mb-1', 'label', { key: 'label' }),
                f('div', 'text-2xl font-bold text-white', 'value', { key: 'value' }),
              ]),
            }),
          ]),
        ]),
      ]),
    ]),

    plans('Essencial'),

    // FAQ
    h('section', 'py-16 md:py-24 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold text-center mb-12', text: 'Perguntas Frequentes' }),
          faq({
            variant: 'toggle-button',
            className: 'space-y-4',
            cardClassName: 'bg-zinc-900 border-zinc-800 overflow-hidden',
            buttonClassName: 'w-full p-6 flex items-center justify-between text-left hover:bg-zinc-800/50 transition-colors',
            questionClassName: 'font-semibold text-white pr-4',
            openIconClassName: 'w-5 h-5 text-orange-500 flex-shrink-0',
            closedIconClassName: 'w-5 h-5 text-zinc-500 flex-shrink-0',
            answerWrapClassName: 'px-6 pb-6',
            answerClassName: 'text-zinc-400',
            items: faqs,
          }),
        ]),
      ]),
    ]),

    // CTA final
    h('section', 'py-16 md:py-24', [
      h('div', 'container mx-auto px-4 text-center', [
        h('h2', { className: 'text-3xl md:text-4xl font-bold mb-4', text: 'Pronto para dominar o mercado de suplementos?' }),
        h('p', { className: 'text-zinc-400 text-lg mb-8 max-w-2xl mx-auto', text: 'Junte-se a centenas de lojistas que já transformaram suas operações com o Mostralo.' }),
        cta({
          label: 'QUERO FALAR COM UM CONSULTOR',
          className: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-10 py-6 text-lg rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300',
          iconLeft: { icon: MessageSquare, className: 'w-5 h-5 mr-2' },
        }),
      ]),
    ]),

    // Rodapé
    h('footer', 'py-8 border-t border-zinc-800', [
      h('div', 'container mx-auto px-4', [
        h('div', 'flex flex-col md:flex-row items-center justify-between gap-4', [
          h('div', 'flex items-center gap-2', [
            h('div', 'w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center', [icon(ShoppingCart, 'w-4 h-4 text-white')]),
            h('span', { className: 'font-bold text-white', text: 'Mostralo' }),
          ]),
          h('p', { className: 'text-zinc-500 text-sm text-center', text: 'Mostralo.com.br | Tecnologia para quem busca o próximo nível.' }),
          links({
            className: 'flex gap-4 text-sm text-zinc-500',
            linkClassName: 'hover:text-orange-500 transition-colors',
            items: [
              { label: 'Início', to: '/' },
              { label: 'Funcionalidades', to: '/funcionalidades' },
              { label: 'Suporte', to: '/suporte' },
              { label: 'Termos', to: '/termos-de-uso' },
            ],
          }),
        ]),
      ]),
    ]),

    whatsapp(),
  ],
};
