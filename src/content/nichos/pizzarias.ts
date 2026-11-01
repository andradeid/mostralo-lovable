import { ArrowRight, BadgePercent, Bike, MessageSquare, Monitor, Phone, Pizza, Printer, Star, Utensils, Wallet } from 'lucide-react';
import { badge, cta, f, faq, FOOTER_LINKS, grid, h, icon, itemIcon, layer, links, plans, savings, span, trust, txt, whatsapp } from '@/components/nicho/build';
import type { NicheContent } from '@/components/nicho/types';

// ---- Textos ----
const problems = [
  { icon: Wallet, title: 'Sem Comissão por Pedido', description: 'Pague apenas uma mensalidade fixa, não importa quanto você venda (pagamento online tem taxa à parte).' },
  { icon: Pizza, title: 'Montador de Pizza Inteligente', description: 'Meio a meio (até 4 sabores), borda e adicionais. O cliente monta a pizza sozinho e o preço sai certo.' },
  { icon: Monitor, title: 'KDS (Monitor de Cozinha)', description: 'Adeus aos papéis perdidos. Organize a produção por tempo de espera e evite atrasos.' },
];

const features = [
  {
    icon: Phone,
    stat: '1 link',
    title: 'O Fim do Telefone Ocupado',
    description: 'Central de pedidos instantânea via WhatsApp. Seu cliente faz o pedido em segundos e ele cai direto na cozinha e na sua impressora térmica.',
    statLabel: 'para o cliente pedir sozinho',
  },
  {
    icon: MessageSquare,
    stat: '1 clique',
    title: 'WhatsApp Marketing de Resgate',
    description: '"João não pede pizza há 15 dias?" Filtre quem está sumido (dias sem pedir, nº de pedidos, quanto já gastou) e mande o cupom de "saudade" em poucos cliques.',
    statLabel: 'para disparar a campanha',
  },
  {
    icon: Utensils,
    stat: 'Na hora',
    title: 'Comanda Digital e App do Garçom',
    description: 'Se você tem salão, seus garçons lançam os pedidos pelo celular e a cozinha recebe na hora. Mais agilidade e nada de papel perdido.',
    statLabel: 'pedido na cozinha',
  },
];

const testimonials = [
  { name: 'Marcos', business: 'Pizzaria do Bairro - SP', quote: 'Antes pagava R$ 4.500/mês de taxa. Hoje pago valor do plano vigente fixo.', savings: 'R$ 4.100' },
  { name: 'Fernanda', business: 'Pizza Express - RJ', quote: 'O KDS organizou minha cozinha. Zero pizza atrasada.', savings: '0 atrasos' },
  { name: 'Roberto', business: 'Forno a Lenha - MG', quote: 'Recuperei 28 clientes inativos no primeiro mês.', savings: '+28 clientes' },
];

const faqs = [
  {
    icon: Pizza,
    q: 'Como funciona o montador de pizza meia-meia?',
    a: 'Você liga o meio a meio na categoria das pizzas e define até quantos sabores cada tamanho aceita. O cliente escolhe os sabores na página da pizza e o sistema calcula o preço sozinho: pela média dos sabores (recomendado) ou pelo sabor mais caro, como você configurar. O pedido chega para a cozinha como "1/2 Calabresa + 1/2 Frango", com a borda e os adicionais. Por enquanto vale para o cardápio online; no PDV e na comanda do garçom ainda não.',
  },
  {
    icon: Printer,
    q: 'O sistema imprime direto na impressora térmica?',
    a: 'Sim! No app Mostralo Pedidos (Android), o pedido aceito sai impresso automaticamente na térmica de 80mm ou 58mm (Bluetooth ou rede). No navegador, você imprime com um clique. Também temos o KDS (Monitor de Cozinha) para quem prefere produção 100% digital.',
  },
  {
    icon: Bike,
    q: 'Posso usar com iFood e Mostralo ao mesmo tempo?',
    a: 'Claro! Muitos clientes começam assim para fazer a transição gradual. O objetivo é você conquistar seus próprios clientes e reduzir a dependência do iFood com o tempo. Com o WhatsApp Marketing, você começa a criar sua base própria de clientes fiéis.',
  },
];

// ---- Página ----
export const pizzarias: NicheContent = {
  path: '/nicho-pizzarias',
  seo: {
    title: 'Mostralo para Pizzarias | Sistema Completo Delivery e Salão',
    description: 'Sistema completo para pizzarias: cardápio digital com montador meia-meia, KDS para cozinha, gestão de entregas e WhatsApp Marketing. Sem comissão por pedido: mensalidade fixa.',
    keywords: 'sistema pizzaria, cardápio digital pizza, KDS pizzaria, delivery pizza, montador meia-meia, gestão pizzaria',
  },
  pageClassName: 'min-h-screen bg-zinc-950 text-zinc-100',
  sections: [
    // Hero
    h('section', 'relative py-16 md:py-24 overflow-hidden', [
      layer('absolute inset-0 bg-gradient-to-b from-orange-500/10 via-transparent to-transparent'),
      layer('absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl'),
      layer('absolute bottom-10 right-10 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl'),
      h('div', 'container mx-auto px-4 relative z-10', [
        h('div', 'text-center max-w-4xl mx-auto', [
          badge({
            className: 'inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 mb-6',
            icon: Pizza,
            iconClassName: 'w-5 h-5 text-orange-500',
            text: 'Para Pizzarias Delivery & Salão',
            textClassName: 'text-orange-400 font-medium',
          }),
          h('h1', { className: 'text-4xl md:text-6xl font-bold mb-6 leading-tight', text: ['Pare de dar', ' ', span('text-orange-500', '"fatias"'), ' ', 'do seu lucro para o iFood.'] }),
          h('p', {
            className: 'text-xl md:text-2xl text-zinc-400 mb-8 max-w-3xl mx-auto',
            text: 'O Mostralo é o sistema All-in-One que acaba com a comissão por pedido, organiza sua cozinha com KDS e coloca sua pizzaria no bolso do cliente com um cardápio digital inteligente.',
          }),
          cta({
            label: 'QUERO MINHA PIZZARIA LUCRATIVA',
            className: 'bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300 animate-pulse',
            iconRight: { icon: ArrowRight, className: 'ml-2 w-5 h-5' },
          }),
          trust({
            className: 'flex flex-wrap justify-center gap-6 mt-10',
            itemClassName: 'flex items-center gap-2 text-zinc-400',
            iconClassName: 'w-5 h-5 text-orange-500',
            items: [
              { icon: BadgePercent, text: 'Sem comissão por pedido' },
              { icon: Monitor, text: 'KDS integrado' },
              { icon: Pizza, text: 'Meia-meia fácil' },
            ],
          }),
        ]),
      ]),
    ]),

    // Problema
    h('section', 'py-16 md:py-20 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'text-center max-w-3xl mx-auto mb-12', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-4', text: ['Você faz a pizza, eles ficam com o lucro.', ' ', span('text-orange-500', 'Até quando?')] }),
          h('p', {
            className: 'text-lg text-zinc-400',
            text: 'Vender 100 pizzas e pagar 25 delas em taxas para aplicativos é insustentável. O Mostralo devolve o controle do seu faturamento e dos dados dos seus clientes.',
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6 max-w-5xl mx-auto',
          items: problems,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-colors', [
            h('CardContent', 'p-6 text-center', [
              h('div', 'w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-4', [itemIcon('w-7 h-7 text-orange-500')]),
              f('h3', 'text-xl font-bold text-zinc-100 mb-2', 'title'),
              f('p', 'text-zinc-400', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // Recursos
    h('section', 'py-16 md:py-20', [
      h('div', 'container mx-auto px-4', [
        h('div', 'text-center max-w-3xl mx-auto mb-12', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-4', text: ['Transforme sua Operação em uma', ' ', span('text-orange-500', 'Máquina de Vendas')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-8 max-w-5xl mx-auto',
          items: features,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all hover:-translate-y-1', [
            h('CardContent', 'p-6', [
              h('div', 'flex items-center justify-between mb-4', [
                h('div', 'w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center', [itemIcon('w-6 h-6 text-orange-500')]),
                f('span', 'text-2xl font-bold text-orange-500', 'stat'),
              ]),
              f('h3', 'text-xl font-bold text-zinc-100 mb-2', 'title'),
              f('p', 'text-zinc-400', 'description'),
              f('p', 'text-sm text-orange-400 mt-3', 'statLabel'),
            ]),
          ]),
        }),
      ]),
    ]),

    savings(),

    // Depoimentos
    h('section', 'py-16 md:py-20', [
      h('div', 'container mx-auto px-4', [
        h('div', 'text-center max-w-3xl mx-auto mb-12', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-4', text: ['Pizzarias que já', ' ', span('text-orange-500', 'faturam mais')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6 max-w-5xl mx-auto',
          items: testimonials,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-colors', [
            h('CardContent', 'p-6', [
              h('div', 'flex gap-1 mb-4', [icon(Star, 'w-5 h-5 fill-orange-500 text-orange-500', { repeat: 5 })]),
              h('p', 'text-zinc-300 mb-4 italic', [txt('"'), f('PricingText', undefined, 'quote'), txt('"')]),
              h('div', 'flex items-center justify-between', [
                h('div', [f('p', 'font-bold text-zinc-100', 'name'), f('p', 'text-sm text-zinc-500', 'business')]),
                h('div', 'bg-orange-500/20 px-3 py-1 rounded-full', [f('span', 'text-orange-400 font-bold text-sm', 'savings')]),
              ]),
            ]),
          ]),
        }),
      ]),
    ]),

    plans('Essencial'),

    // FAQ
    h('section', 'py-16 md:py-20', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold text-center mb-12', text: ['Perguntas ', span('text-orange-500', 'Frequentes')] }),
          faq({
            variant: 'accordion',
            itemClassName: 'border-zinc-800',
            triggerClassName: 'text-zinc-100 hover:text-orange-500',
            contentClassName: 'text-zinc-400',
            valueStart: 1,
            triggerInner: { as: 'div', className: 'flex items-center gap-3', iconClassName: 'w-5 h-5 text-orange-500' },
            items: faqs,
          }),
        ]),
      ]),
    ]),

    // Rodapé
    h('footer', 'py-12 bg-zinc-900 border-t border-zinc-800', [
      h('div', 'container mx-auto px-4', [
        h('div', 'text-center', [
          h('div', 'flex items-center justify-center gap-2 mb-4', [
            icon(Pizza, 'w-8 h-8 text-orange-500'),
            h('span', { className: 'text-2xl font-bold text-zinc-100', text: 'Mostralo' }),
          ]),
          h('p', { className: 'text-zinc-400 mb-6', text: 'Sua pizzaria, seu lucro, sua liberdade.' }),
          links({ className: 'flex flex-wrap justify-center gap-6 text-sm text-zinc-500', linkClassName: 'hover:text-orange-500 transition-colors', items: FOOTER_LINKS }),
          h('p', { className: 'text-zinc-600 text-sm mt-6', text: '© 2024 Mostralo.com.br - Todos os direitos reservados' }),
        ]),
      ]),
    ]),

    whatsapp(),
  ],
};
