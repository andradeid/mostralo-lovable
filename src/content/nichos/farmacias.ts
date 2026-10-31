import { ArrowRight, BarChart3, Check, Clock, MessageSquare, Package, Pill, RefreshCw, ShieldCheck, Smartphone, Star, Store, Truck } from 'lucide-react';
import { badge, cta, f, faq, FOOTER_LINKS, grid, h, icon, itemIcon, layer, links, plans, savings, span, trust, whatsapp } from '@/components/nicho/build';
import type { NicheContent } from '@/components/nicho/types';

// ---- Textos ----
const solutions = [
  {
    icon: Package,
    title: 'Catálogo Digital Completo',
    description: 'Organize por categorias: Medicamentos, Higiene, Infantil, Dermocosméticos. O cliente encontra o que precisa em segundos.',
  },
  {
    icon: Smartphone,
    title: 'PDV de Balcão Integrado',
    description: 'Vendas rápidas com controle de estoque unificado. O que vende na loja atualiza no site em tempo real.',
  },
  {
    icon: Truck,
    title: 'Delivery Inteligente',
    description: 'Zonas de entrega por polígonos. Defina taxas justas e garanta que o pedido chegue em minutos, rastreado pelo cliente.',
  },
];

const features = [
  {
    icon: RefreshCw,
    title: 'Recorrência de Uso Contínuo',
    description: 'O remédio do seu cliente vai acabar em 30 dias? O Mostralo identifica e envia um lembrete automático via WhatsApp oferecendo a renovação. Fidelização real e ética.',
    stat: '+60%',
    statLabel: 'recompra',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Marketing de Ofertas',
    description: 'Dispense o encarte de papel. Envie as ofertas da semana (fraldas, vitaminas, higiene) direto no celular de quem já compra com você.',
    stat: 'R$ 0',
    statLabel: 'custo papel',
  },
  {
    icon: BarChart3,
    title: 'Financeiro e Gestão',
    description: 'Dashboard com KPIs de receitas e despesas. Saiba exatamente qual categoria (ex: perfumaria vs. genéricos) está trazendo mais lucro.',
    stat: '100%',
    statLabel: 'visibilidade',
  },
];

const pickupSteps = [
  { icon: Smartphone, title: 'PEDIDO', desc: 'Cliente faz pelo app' },
  { icon: Clock, title: 'PREPARO', desc: 'Você separa o produto' },
  { icon: Store, title: 'RETIRADA', desc: 'Rápida e sem fila' },
];

const idealFor = ['Farmácias de manipulação', 'Compras de urgência', 'Clientes que passam de carro'];

const testimonials = [
  { quote: 'O lembrete de renovação pelo WhatsApp triplicou minhas vendas de uso contínuo.', author: 'Dr. Paulo', business: 'Farmácia Saúde & Vida - SP', avatar: '👨‍⚕️' },
  { quote: 'Economizo R$ 3.200/mês desde que parei de depender do iFood para delivery.', author: 'Marina', business: 'Drogaria Popular - RJ', avatar: '👩‍💼' },
  { quote: 'O Clique e Retire desafogou meu balcão nos horários de pico.', author: 'Carlos', business: 'Farmácia Central - MG', avatar: '👨‍💼' },
];

const faqs = [
  {
    q: 'Como funciona a recorrência de uso contínuo?',
    a: 'O sistema identifica compras de produtos recorrentes (medicamentos de uso diário, fraldas, vitaminas). Quando o período estimado de uso estiver acabando, envia automaticamente um WhatsApp oferecendo a renovação. É fidelização ética e eficiente.',
  },
  {
    q: 'Posso organizar o catálogo por categorias?',
    a: 'Sim! Você cria as categorias que quiser: Medicamentos, Higiene, Infantil, Dermocosméticos, Perfumaria. O cliente filtra e encontra o que precisa em segundos. Tudo com fotos e descrições.',
  },
  {
    q: 'Como funciona o Clique e Retire?',
    a: 'O cliente faz o pedido pelo site ou WhatsApp e escolhe "Retirar na Loja". Você recebe o pedido, separa o produto e avisa quando estiver pronto. O cliente passa apenas para pegar. Ideal para farmácias de manipulação!',
  },
];

// ---- Página ----
export const farmacias: NicheContent = {
  path: '/nicho-farmacias',
  seo: {
    title: 'Mostralo para Farmácias e Drogarias | Sistema de Gestão e Delivery',
    description: 'Sistema completo para farmácias: catálogo digital, PDV integrado, delivery rastreado, recorrência automática via WhatsApp. Taxa zero e gestão profissional.',
    keywords: 'sistema farmácia, pdv drogaria, delivery medicamentos, catálogo digital farmácia, gestão farmácia, clique e retire',
    url: 'https://mostralo.com.br/nicho-farmacias',
  },
  pageClassName: 'min-h-screen bg-white',
  sections: [
    // Hero
    h('section', 'relative bg-gradient-to-b from-blue-50 to-white py-16 md:py-24 overflow-hidden', [
      h('div', 'absolute inset-0 opacity-5', [
        layer('absolute top-20 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl'),
        layer('absolute bottom-20 right-10 w-40 h-40 bg-orange-500 rounded-full blur-3xl'),
      ]),
      h('div', 'container mx-auto px-4 relative z-10', [
        h('div', 'text-center max-w-4xl mx-auto', [
          badge({
            className: 'inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6',
            icon: Pill,
            iconClassName: 'w-4 h-4',
            text: 'Para Farmácias, Drogarias e Perfumarias',
          }),
          h('h1', {
            className: 'text-3xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight',
            text: ['Transforme sua farmácia no destino', ' ', span('text-blue-600', 'número #1'), ' de saúde e conveniência do seu bairro.'],
          }),
          h('p', {
            className: 'text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto',
            text: [
              'O Mostralo é o ecossistema All-in-One que une seu PDV de balcão ao delivery ultra-rápido, com ',
              span('text-orange-500 font-semibold', 'taxa zero'),
              ' e automação de WhatsApp para fidelizar seus pacientes.',
            ],
          }),
          cta({
            label: 'MODERNIZAR MINHA FARMÁCIA',
            className: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300',
            iconRight: { icon: ArrowRight, className: 'ml-2 w-5 h-5' },
          }),
          trust({
            className: 'flex flex-wrap justify-center gap-4 mt-10',
            itemClassName: 'flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md border border-gray-100',
            iconClassName: 'w-4 h-4 text-blue-600',
            textClassName: 'text-sm font-medium text-gray-700',
            items: [
              { icon: ShieldCheck, text: 'Taxa 0%' },
              { icon: Package, text: 'Catálogo Digital' },
              { icon: Truck, text: 'Delivery Rastreado' },
              { icon: RefreshCw, text: 'Recorrência Automática' },
            ],
          }),
        ]),
      ]),
    ]),

    // Interesse - onde as grandes redes falham
    h('section', 'py-16 md:py-20 bg-gray-50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'text-center max-w-3xl mx-auto mb-12', [
          h('h2', {
            className: 'text-2xl md:text-4xl font-bold text-gray-900 mb-4',
            text: ['Não perca vendas para os grandes apps.', ' ', span('text-blue-600', 'Seja a entrega mais rápida'), ' da sua região.'],
          }),
          h('p', {
            className: 'text-gray-600 text-lg',
            text: 'No setor farmacêutico, quem entrega primeiro, ganha o cliente. Mas pagar 25% de taxa por uma venda de urgência destrói sua margem. O Mostralo oferece a tecnologia das grandes redes para a sua drogaria.',
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6',
          items: solutions,
          card: h('Card', 'bg-white border-2 border-gray-100 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group', [
            h('CardContent', 'p-6', [
              h('div', 'w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors duration-300', [
                itemIcon('w-7 h-7 text-blue-600 group-hover:text-white transition-colors duration-300'),
              ]),
              f('h3', 'text-xl font-bold text-gray-900 mb-2', 'title'),
              f('p', 'text-gray-600', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // Desejo - inteligência de venda e recorrência
    h('section', 'py-16 md:py-20 bg-white', [
      h('div', 'container mx-auto px-4', [
        h('div', 'text-center max-w-3xl mx-auto mb-12', [
          h('h2', { className: 'text-2xl md:text-4xl font-bold text-gray-900 mb-4', text: ['Inteligência de Venda e ', span('text-orange-500', 'Recorrência')] }),
          h('p', { className: 'text-gray-600 text-lg', text: 'Tecnologia que fideliza seus clientes de forma ética e automatizada.' }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6',
          items: features,
          card: h('Card', 'bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 hover:border-orange-300 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300', [
            h('CardContent', 'p-6', [
              h('div', 'flex justify-between items-start mb-4', [
                h('div', 'w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center', [itemIcon('w-6 h-6 text-orange-500')]),
                h('div', 'text-right', [f('div', 'text-2xl font-bold text-blue-600', 'stat'), f('div', 'text-xs text-gray-500 uppercase', 'statLabel')]),
              ]),
              f('h3', 'text-xl font-bold text-gray-900 mb-2', 'title'),
              f('p', 'text-gray-600 text-sm', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // Clique e Retire
    h('section', 'py-16 md:py-20 bg-blue-600', [
      h('div', 'container mx-auto px-4', [
        h('div', 'text-center max-w-3xl mx-auto mb-12', [
          badge({
            className: 'inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-full text-sm font-medium mb-4',
            icon: Store,
            iconClassName: 'w-4 h-4',
            text: 'Novo Recurso',
          }),
          h('h2', { className: 'text-2xl md:text-4xl font-bold text-white mb-4', text: 'Compre online. Retire na loja em minutos.' }),
          h('p', {
            className: 'text-blue-100 text-lg',
            text: 'Ofereça a praticidade do e-commerce com a velocidade da compra física. Seu cliente faz o pedido pelo celular e passa na farmácia apenas para retirar. Sem fila, sem espera.',
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-10',
          itemWrapClassName: 'relative',
          items: pickupSteps,
          card: h('div', 'bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20', [
            h('div', 'w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4', [itemIcon('w-8 h-8 text-blue-600')]),
            f('div', 'text-xs font-bold text-blue-200 mb-1', 'title', { prefix: '📍 ' }),
            f('div', 'text-white font-medium', 'desc'),
          ]),
          connector: h('div', 'hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10', [icon(ArrowRight, 'w-6 h-6 text-white/50')]),
        }),
        h('div', 'bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto border border-white/20', [
          h('h3', { className: 'text-white font-bold mb-4 text-center', text: 'Ideal para:' }),
          grid({
            className: 'grid md:grid-cols-3 gap-4 text-center',
            items: idealFor.map((value) => ({ value })),
            card: h('div', 'flex items-center justify-center gap-2 text-blue-100', [icon(Check, 'w-4 h-4 text-green-400'), f('span', 'text-sm', 'value')]),
          }),
        ]),
      ]),
    ]),

    savings(),

    // Depoimentos
    h('section', 'py-16 md:py-20 bg-white', [
      h('div', 'container mx-auto px-4', [
        h('div', 'text-center max-w-3xl mx-auto mb-12', [
          h('h2', { className: 'text-2xl md:text-4xl font-bold text-gray-900 mb-4', text: ['Farmácias que já ', span('text-orange-500', 'faturam mais')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6 max-w-5xl mx-auto',
          items: testimonials,
          card: h('Card', 'bg-gray-50 border-0 hover:shadow-lg transition-shadow duration-300', [
            h('CardContent', 'p-6', [
              h('div', 'flex gap-1 mb-4', [icon(Star, 'w-4 h-4 fill-yellow-400 text-yellow-400', { repeat: 5 })]),
              f('p', 'text-gray-700 mb-6 italic', 'quote', { quote: true }),
              h('div', 'flex items-center gap-3', [
                f('div', 'w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl', 'avatar'),
                h('div', [f('div', 'font-bold text-gray-900', 'author'), f('div', 'text-sm text-gray-500', 'business')]),
              ]),
            ]),
          ]),
        }),
      ]),
    ]),

    plans('Essencial'),

    // FAQ
    h('section', 'py-16 md:py-20 bg-white', [
      h('div', 'container mx-auto px-4', [
        h('div', 'text-center max-w-3xl mx-auto mb-12', [
          h('h2', { className: 'text-2xl md:text-4xl font-bold text-gray-900 mb-4', text: ['Perguntas ', span('text-blue-600', 'Frequentes')] }),
        ]),
        h('div', 'max-w-2xl mx-auto', [
          faq({
            variant: 'accordion',
            className: 'space-y-4',
            itemClassName: 'bg-gray-50 rounded-xl px-6 border-0',
            triggerClassName: 'text-left font-semibold text-gray-900 hover:no-underline py-4',
            contentClassName: 'text-gray-600 pb-4',
            valuePrefix: 'faq-',
            items: faqs,
          }),
        ]),
      ]),
    ]),

    // Rodapé
    h('footer', 'bg-gray-900 py-8', [
      h('div', 'container mx-auto px-4', [
        h('div', 'text-center', [
          h('p', { className: 'text-blue-400 font-bold text-lg mb-2', text: 'Mostralo.com.br' }),
          h('p', { className: 'text-gray-400 text-sm mb-6', text: 'Tecnologia para a saúde do seu negócio.' }),
          links({ className: 'flex flex-wrap justify-center gap-6 text-sm text-gray-500', linkClassName: 'hover:text-white transition-colors', items: FOOTER_LINKS }),
        ]),
      ]),
    ]),

    whatsapp(),
  ],
};
