import { ArrowRight, BarChart3, Coffee, DollarSign, IceCreamCone, Layers, ListChecks, MessageSquare, Monitor, Printer, Sparkles, Tablet, Truck, Tv } from 'lucide-react';
import { badge, cta, f, faq, FOOTER_LINKS, grid, h, icon, itemIcon, layer, links, plans, savings, span, trust, whatsapp } from '@/components/nicho/build';
import type { NicheContent } from '@/components/nicho/types';

const GRADIENT = 'bg-gradient-to-r from-emerald-300 to-amber-200 bg-clip-text text-transparent';

// ---- Textos ----
const vitrine = [
  {
    icon: ListChecks,
    title: 'Sabores do dia',
    description: 'Acabou o pistache? Desligue o sabor no painel e ele some do totem e da loja online. Saiu uma cuba nova, é só ligar de novo.',
  },
  {
    icon: IceCreamCone,
    title: 'Copinho, casquinha e pote',
    description: 'Cada tamanho com o seu limite de sabores. O cliente escolhe dentro do que você definiu, e o pedido chega com cada sabor escrito, sem confusão no balcão.',
  },
  {
    icon: Coffee,
    title: 'Especiais da casa',
    description: 'Affogato, gelato com calda quente, taça montada. Cadastre como produto com adicionais pagos: dose extra de café, chantilly, farofa de castanha, cada um com o seu preço.',
  },
  {
    icon: Truck,
    title: 'Pote para levar',
    description: 'Pote de meio litro ou de um litro pela loja online, para retirar ou receber em casa pelo seu delivery próprio. Sem comissão por pedido.',
  },
];

const ticket = [
  {
    icon: Layers,
    title: 'O adicional aparece na hora certa',
    description: 'No totem e na loja online, o cliente vê as opções extras enquanto monta o pedido, com o preço ao lado. Quem quer a calda de chocolate belga escolhe sozinho.',
    stat: 'Na tela',
    statLabel: 'com preço ao lado',
  },
  {
    icon: Tv,
    title: 'A TV vende o especial',
    description: 'A TV de cardápio mostra o affogato e a taça da semana com foto, na parede da loja. Quem está na fila já chega sabendo o que vai pedir.',
    stat: 'Na parede',
    statLabel: 'cardápio com a sua marca',
  },
  {
    icon: MessageSquare,
    title: 'Sabor novo no WhatsApp',
    description: 'Lançou sabor sazonal? Monte uma campanha de WhatsApp para quem já comprou de você e avise no mesmo dia, ou agende o envio.',
    stat: '1 campanha',
    statLabel: 'para avisar a clientela',
  },
];

const flow = [
  { icon: Tablet, step: '1', title: 'TOTEM', subtitle: 'Escolhe os sabores e paga no Pix' },
  { icon: Printer, step: '2', title: 'BALCÃO', subtitle: 'Pedido impresso para quem serve' },
  { icon: Monitor, step: '3', title: 'TV', subtitle: 'Senha chamada na tela' },
];

const steps = [
  { n: '1', title: 'Você manda os sabores e as fotos', description: 'Lista de sabores, tamanhos, especiais e a logo. Sem foto boa ainda? Começamos com o que você tiver e você troca depois.' },
  { n: '2', title: 'A gente monta com a sua marca', description: 'Loja online com domínio próprio, totem, caixa e TV de cardápio com as suas cores. Você vê tudo funcionando antes de decidir.' },
  { n: '3', title: 'Configura e treina a equipe', description: 'Ligamos a impressora térmica, deixamos o totem e a TV prontos e mostramos para a equipe como trocar os sabores do dia.' },
];

const faqs = [
  {
    q: 'Dá para trocar os sabores todo dia?',
    a: 'Sim. Cada sabor é uma opção que você liga e desliga no painel, pelo celular ou pelo computador. O que estiver desligado não aparece para o cliente no totem nem na loja online.',
  },
  {
    q: 'Como cobro o affogato ou um adicional de café?',
    a: 'O affogato entra como produto, e os extras ficam em grupos de adicionais: você define o preço de cada opção e o mínimo e o máximo que o cliente pode escolher. O caixa e o totem somam tudo sozinhos.',
  },
  {
    q: 'O totem aceita cartão?',
    a: 'No totem o cliente paga no Pix, na própria tela, e recebe a senha. Quem prefere cartão ou dinheiro faz o pedido no totem e paga no caixa, ou pede direto no balcão.',
  },
  {
    q: 'Vendo gelato por peso. Funciona?',
    a: 'Funciona no caixa. O produto vendido por quilo pede o peso: o atendente digita o que a balança mostra e o sistema calcula o valor. A balança não é ligada ao sistema.',
  },
  {
    q: 'Preciso comprar equipamento?',
    a: 'Não necessariamente. O Mostralo roda no navegador: tablet, computador ou Smart TV que você já tem servem. Para o totem, um tablet com suporte ou uma tela touch. Para os pedidos, impressora térmica de 58 ou 80 mm ou o app Mostralo Pedidos no Android.',
  },
];

const related = [
  { label: 'Página para sorveterias', to: '/nicho-sorveterias' },
  { label: 'Guia: sistema para sorveteria', to: '/guia/sistema-para-sorveteria' },
  { label: 'Guia: totem para sorveteria', to: '/guia/totem-para-sorveteria' },
  { label: 'Guia: cardápio digital na TV', to: '/guia/cardapio-digital-na-tv' },
];

// ---- Página ----
export const gelaterias: NicheContent = {
  path: '/nicho-gelaterias',
  seo: {
    title: 'Sistema para Gelateria: Totem, PDV e TV de Cardápio | Mostralo',
    description: 'Sistema para gelateria artesanal: sabores do dia no painel, totem com Pix, caixa (PDV), TV de cardápio, especiais com adicionais e delivery sem comissão.',
    keywords: 'sistema para gelateria, pdv gelateria, totem gelateria, cardápio digital gelato, tv de cardápio gelateria, delivery gelateria, sistema gelato artesanal',
  },
  pageClassName: 'min-h-screen bg-stone-950 text-white',
  sections: [
    // Hero
    h('section', 'relative overflow-hidden py-20 lg:py-28', [
      layer('absolute inset-0 bg-gradient-to-b from-emerald-500/10 via-transparent to-amber-500/5'),
      layer('absolute -top-10 right-0 w-80 h-80 bg-emerald-400/15 rounded-full blur-3xl'),
      layer('absolute bottom-0 left-0 w-80 h-80 bg-amber-300/10 rounded-full blur-3xl'),
      h('div', 'container mx-auto px-4 relative z-10', [
        h('div', 'max-w-4xl mx-auto text-center', [
          badge({
            className: 'inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-400/30 rounded-full px-4 py-2 mb-8',
            icon: IceCreamCone,
            iconClassName: 'w-5 h-5 text-emerald-300',
            text: 'Para gelaterias artesanais',
            textClassName: 'text-emerald-200 text-sm font-medium',
          }),
          h('h1', {
            className: 'text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight',
            text: ['Gelato artesanal pede', ' ', span(GRADIENT, 'atendimento caprichado'), ' ', 'do balcão ao delivery.'],
          }),
          h('p', {
            className: 'text-xl md:text-2xl text-stone-300 mb-10 max-w-3xl mx-auto',
            text: 'Sabores do dia sempre certos, especiais com adicionais, totem com Pix e TV de cardápio na parede. Tudo no mesmo sistema, e a gente deixa tudo pronto para você.',
          }),
          cta({
            asChild: true,
            label: 'QUERO O MOSTRALO NA MINHA GELATERIA',
            className: 'bg-emerald-500 hover:bg-emerald-600 text-white text-lg px-8 py-6 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.35)] hover:shadow-[0_0_45px_rgba(16,185,129,0.55)] transition-all duration-300 hover:scale-105 whitespace-normal h-auto',
            iconRight: { icon: ArrowRight, className: 'ml-2 w-5 h-5' },
          }),
          trust({
            className: 'flex flex-wrap justify-center gap-4 mt-12',
            itemClassName: 'flex items-center gap-2 bg-stone-900/60 border border-stone-800 rounded-full px-4 py-2',
            iconClassName: 'w-4 h-4 text-emerald-300',
            textClassName: 'text-sm text-stone-300',
            items: [
              { icon: ListChecks, text: 'Sabores do dia' },
              { icon: Tablet, text: 'Totem com Pix' },
              { icon: Tv, text: 'TV de cardápio' },
              { icon: DollarSign, text: 'Sem comissão por pedido' },
            ],
          }),
        ]),
      ]),
    ]),

    // Vitrine
    h('section', 'py-20 bg-stone-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto text-center mb-14', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-6', text: ['A vitrine muda todo dia.', ' ', span('text-emerald-300', 'O cardápio acompanha.')] }),
          h('p', {
            className: 'text-lg md:text-xl text-stone-400',
            text: 'Na gelateria, o sabor que saiu de manhã pode acabar à tarde. Se o cardápio não acompanha, o cliente escolhe o que não tem e a fila trava. Com o Mostralo, você atualiza em um lugar e vale para todos os canais.',
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto',
          items: vitrine,
          card: h('Card', 'bg-stone-900 border-stone-800 hover:border-emerald-400/50 transition-all duration-300 group', [
            h('CardContent', 'p-7', [
              h('div', 'w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform', [itemIcon('w-7 h-7 text-emerald-300')]),
              f('h3', 'text-xl font-bold mb-2 text-white', 'title'),
              f('p', 'text-stone-400', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // Ticket maior
    h('section', 'py-20', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto text-center mb-14', [
          badge({
            className: 'inline-flex items-center gap-2 bg-amber-400/15 border border-amber-300/30 rounded-full px-4 py-2 mb-6',
            icon: Sparkles,
            iconClassName: 'w-4 h-4 text-amber-200',
            text: 'Ticket maior',
            textClassName: 'text-amber-100 text-sm font-medium',
          }),
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-6', text: ['Gelato bom vende o', ' ', span(GRADIENT, 'segundo item.')] }),
          h('p', {
            className: 'text-lg md:text-xl text-stone-400',
            text: 'Quem paga por gelato artesanal aceita um extra quando vê a opção. O Mostralo mostra o adicional na hora da escolha, sem o atendente precisar oferecer a cada cliente.',
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-8 max-w-6xl mx-auto',
          items: ticket,
          card: h('Card', 'bg-stone-900 border-stone-800 hover:border-amber-300/50 transition-all duration-300 group', [
            h('CardContent', 'p-8', [
              h('div', 'flex items-start justify-between mb-6', [
                h('div', 'w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-amber-400/20 flex items-center justify-center group-hover:scale-110 transition-transform', [itemIcon('w-7 h-7 text-amber-200')]),
                h('div', 'text-right', [f('div', 'text-xl font-bold text-emerald-300', 'stat'), f('div', 'text-xs text-stone-500', 'statLabel')]),
              ]),
              f('h3', 'text-xl font-bold mb-2 text-white', 'title'),
              f('p', 'text-stone-400', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // Fluxo totem e TV
    h('section', 'py-20 bg-stone-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto text-center mb-14', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-6', text: ['Fim de tarde cheio,', ' ', span('text-emerald-300', 'balcão tranquilo.')] }),
          h('p', {
            className: 'text-lg md:text-xl text-stone-400',
            text: 'O cliente escolhe no totem enquanto olha a vitrine. Quem serve recebe o pedido impresso e chama a senha na TV. A equipe fica na espátula, não na anotação.',
          }),
        ]),
        h('div', 'max-w-5xl mx-auto', [
          grid({
            className: 'grid md:grid-cols-3 gap-6',
            itemWrapClassName: 'relative',
            items: flow,
            card: h('Card', 'bg-stone-900 border-stone-800 hover:border-emerald-400/50 transition-all text-center', [
              h('CardContent', 'p-6', [
                h('div', 'w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/25 to-amber-400/25 flex items-center justify-center mx-auto mb-4', [itemIcon('w-8 h-8 text-emerald-300')]),
                f('div', 'text-xs text-amber-200 font-semibold mb-1', 'step', { prefix: 'PASSO ' }),
                f('h3', 'font-bold text-lg mb-1 text-white', 'title'),
                f('p', 'text-sm text-stone-400', 'subtitle'),
              ]),
            ]),
            connector: h('div', 'hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10', [icon(ArrowRight, 'w-6 h-6 text-emerald-400/60')]),
          }),
          h('div', 'grid sm:grid-cols-2 gap-6 mt-8', [
            h('Card', 'bg-stone-900 border-stone-800', [
              h('CardContent', 'p-6', [
                h('h3', { className: 'font-bold text-lg mb-2 text-white', text: 'Pix no totem, cartão no caixa' }),
                h('p', { className: 'text-stone-400', text: 'O totem recebe no Pix, na própria tela. Quem quer pagar no cartão ou em dinheiro passa no caixa, que tem abertura, sangria e fechamento.' }),
              ]),
            ]),
            h('Card', 'bg-stone-900 border-stone-800', [
              h('CardContent', 'p-6', [
                h('h3', { className: 'font-bold text-lg mb-2 text-white', text: 'Tudo no mesmo relatório' }),
                h('p', { className: 'text-stone-400', text: 'Totem, balcão e delivery caem no mesmo painel. Você vê quais sabores e especiais mais vendem e acompanha o estoque.' }),
              ]),
            ]),
          ]),
        ]),
      ]),
    ]),

    savings(),

    // Como começa
    h('section', 'py-20 bg-stone-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto text-center mb-14', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-6', text: ['Vai abrir ou renovar a gelateria?', ' ', span('text-emerald-300', 'A gente deixa tudo pronto.')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-8 max-w-6xl mx-auto',
          items: steps,
          card: h('Card', 'bg-stone-900 border-stone-800 hover:border-emerald-400/30 transition-all duration-300', [
            h('CardContent', 'p-6', [
              f('div', 'w-10 h-10 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center mb-4', 'n'),
              f('h3', 'text-xl font-bold mb-2 text-white', 'title'),
              f('p', 'text-stone-400', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    plans('Essencial'),

    // FAQ
    h('section', 'py-20 bg-stone-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto', [
          h('h2', { className: 'text-3xl font-bold text-center mb-12', text: ['Perguntas ', span('text-emerald-300', 'frequentes')] }),
          faq({
            variant: 'accordion',
            className: 'space-y-4',
            itemClassName: 'bg-stone-900 border border-stone-800 rounded-xl px-6',
            triggerClassName: 'text-left hover:no-underline py-6',
            contentClassName: 'text-stone-400 pb-6',
            valueStart: 1,
            triggerInner: { as: 'span', className: 'font-semibold' },
            items: faqs,
          }),
          h('p', { className: 'text-center text-stone-500 mt-10 mb-3 text-sm', text: 'Para ler com calma:' }),
          links({ className: 'flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm', linkClassName: 'text-emerald-300 hover:text-emerald-200 underline underline-offset-4', items: related }),
        ]),
      ]),
    ]),

    // Rodapé
    h('footer', 'py-12 border-t border-stone-800', [
      h('div', 'container mx-auto px-4 text-center', [
        h('p', { className: 'text-stone-400 mb-4', text: [span('font-semibold text-white', 'Mostralo.com.br'), ' | Sua marca. Seus clientes. Sua gelateria organizada.'] }),
        links({ className: 'flex flex-wrap justify-center gap-6 text-sm text-stone-500', linkClassName: 'hover:text-emerald-300 transition-colors', items: FOOTER_LINKS }),
      ]),
    ]),

    whatsapp(),
  ],
};
