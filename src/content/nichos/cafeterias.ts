import { ArrowRight, BarChart3, Clock, Coffee, Croissant, DollarSign, Monitor, Printer, QrCode, Receipt, ShoppingBag, Smartphone, Zap } from 'lucide-react';
import { badge, cta, f, faq, FOOTER_LINKS, grid, h, itemIcon, layer, links, plans, span, trust, whatsapp } from '@/components/nicho/build';
import type { NicheContent } from '@/components/nicho/types';

const GRADIENT = 'bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent';

// ---- Textos ----
const rush = [
  {
    icon: Zap,
    title: 'Balcão em poucos toques',
    description: 'No PDV, os itens que mais saem ficam em atalhos na tela: espresso, pingado, pão na chapa. Produto embalado entra pelo leitor de código de barras.',
  },
  {
    icon: ShoppingBag,
    title: 'Pediu antes, só retira',
    description: 'O cliente pede pelo link da sua loja online antes de sair de casa e escolhe retirar. Chegou, pegou. Dá para deixar o pedido marcado para um horário, como 7h30.',
  },
  {
    icon: QrCode,
    title: 'Mesa pede pelo QR Code',
    description: 'Quem senta lê o QR Code da mesa, escolhe no celular e o pedido cai na comanda da mesa. A equipe não precisa ir e voltar para anotar.',
  },
  {
    icon: Receipt,
    title: 'Comanda fecha no caixa',
    description: 'Tudo o que a mesa pediu fica na comanda. Na hora de ir embora, o caixa fecha a conta com a forma de pagamento escolhida.',
  },
];

const combos = [
  {
    icon: Croissant,
    title: 'Combo café da manhã',
    description: 'Um produto só, com escolhas: a bebida, o pão ou o salgado e um extra. Você define quantas opções o cliente escolhe em cada grupo e o preço de cada uma.',
  },
  {
    icon: Coffee,
    title: 'Bebida do jeito do cliente',
    description: 'Tamanho, tipo de leite, dose extra, sem açúcar. Cada escolha vira um grupo de adicionais, com mínimo, máximo e preço. O barista lê exatamente o que foi pedido.',
  },
  {
    icon: Clock,
    title: 'Café da tarde também vende',
    description: 'Combo de bolo com café no meio da tarde? Monte uma campanha de WhatsApp para quem já comprou de você e mande no horário mais parado.',
  },
];

const ops = [
  {
    icon: Monitor,
    title: 'Cardápio na TV',
    description: 'A TV atrás do balcão mostra o cardápio e os combos com as suas fotos. Mudou o preço, troca no painel e a TV atualiza.',
  },
  {
    icon: Printer,
    title: 'Pedido impresso para o barista',
    description: 'Cada pedido sai na impressora térmica ou no app Mostralo Pedidos, no Android. Do balcão, da mesa ou da retirada, tudo na mesma fila de preparo.',
  },
  {
    icon: BarChart3,
    title: 'Caixa e relatórios',
    description: 'Abertura, sangria e fechamento de caixa. Relatório por produto e forma de pagamento, e estoque dos itens que você controla.',
  },
];

const steps = [
  { n: '1', title: 'Você manda o cardápio e a logo', description: 'Pode ser a foto do quadro do balcão. A gente organiza bebidas, tamanhos, combos e adicionais.' },
  { n: '2', title: 'A gente monta com a sua marca', description: 'Loja online com domínio próprio, PDV, QR Code das mesas e cardápio na TV com as suas cores. Você vê funcionando antes de decidir.' },
  { n: '3', title: 'Configura e treina', description: 'Ligamos a impressora, imprimimos os QR Codes das mesas e mostramos para a equipe como abrir e fechar o caixa.' },
];

const faqs = [
  {
    q: 'O cliente consegue pedir para retirar no horário que ele quer?',
    a: 'Sim. Com os pedidos agendados ligados, o cliente escolhe data e horário na hora de fechar o pedido. Você define a antecedência mínima e a máxima, separadas para retirada e entrega.',
  },
  {
    q: 'Como funciona o pedido na mesa pelo QR Code?',
    a: 'Cada mesa tem o seu QR Code. O cliente lê com o celular, o cardápio abre no navegador, sem baixar aplicativo, e o pedido vai para a comanda daquela mesa. A conta é fechada no caixa.',
  },
  {
    q: 'Dá para montar combo de café da manhã?',
    a: 'Dá. O combo é um produto com grupos de escolha: bebida, pão ou salgado, extra. Você define quantas opções o cliente escolhe em cada grupo e quanto custa cada uma.',
  },
  {
    q: 'Vendo pão de queijo e salgado por quilo. Funciona?',
    a: 'Funciona no caixa. O produto vendido por quilo pede o peso: o atendente digita o que a balança mostra e o sistema calcula o valor. A balança não é ligada ao sistema.',
  },
  {
    q: 'Também faço entrega. Tem comissão?',
    a: 'Não tem comissão por pedido. O link é seu e os clientes são seus: você paga a mensalidade do Mostralo. Se usar o pagamento online pelo EFI, ele tem taxa à parte.',
  },
];

const related = [
  { label: 'Guia: cardápio QR Code na mesa', to: '/guia/cardapio-qr-code-na-mesa' },
  { label: 'Guia: pedido para retirada no balcão', to: '/guia/pedido-para-retirada-no-balcao' },
  { label: 'Guia: PDV para pequeno negócio', to: '/guia/pdv-para-pequeno-negocio' },
  { label: 'Página para padarias', to: '/nicho-padarias' },
];

// ---- Página ----
export const cafeterias: NicheContent = {
  path: '/nicho-cafeterias',
  seo: {
    title: 'Sistema para Cafeteria: PDV, Comanda e Pedido na Mesa | Mostralo',
    description: 'Sistema para cafeteria: PDV rápido no balcão, pedido para retirada, mesa por QR Code com comanda, combos de café da manhã e cardápio na TV. Sem comissão.',
    keywords: 'sistema para cafeteria, pdv cafeteria, comanda cafeteria, cardápio qr code cafeteria, pedido para retirada cafeteria, combo café da manhã, cardápio na tv cafeteria',
  },
  pageClassName: 'min-h-screen bg-neutral-950 text-white',
  sections: [
    // Hero
    h('section', 'relative overflow-hidden py-20 lg:py-28', [
      layer('absolute inset-0 bg-gradient-to-br from-amber-900/30 via-neutral-950 to-neutral-950'),
      layer('absolute top-16 left-1/2 -translate-x-1/2 w-[28rem] max-w-full h-72 bg-amber-600/15 rounded-full blur-3xl'),
      h('div', 'container mx-auto px-4 relative z-10', [
        h('div', 'max-w-4xl mx-auto text-center', [
          badge({
            className: 'inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 rounded-full px-4 py-2 mb-8',
            icon: Coffee,
            iconClassName: 'w-5 h-5 text-amber-300',
            text: 'Para cafeterias e casas de café',
            textClassName: 'text-amber-200 text-sm font-medium',
          }),
          h('h1', {
            className: 'text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight',
            text: ['Das 7h às 9h,', ' ', span(GRADIENT, 'cada minuto de fila'), ' ', 'é cliente que vai embora.'],
          }),
          h('p', {
            className: 'text-xl md:text-2xl text-neutral-300 mb-10 max-w-3xl mx-auto',
            text: 'Balcão rápido, pedido para retirada, mesa pedindo pelo QR Code e cardápio na TV. O Mostralo junta tudo num sistema só, e a gente deixa tudo pronto para você.',
          }),
          cta({
            asChild: true,
            label: 'QUERO AGILIZAR MINHA CAFETERIA',
            className: 'bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold text-lg px-8 py-6 rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.35)] hover:shadow-[0_0_45px_rgba(245,158,11,0.55)] transition-all duration-300 hover:scale-105 whitespace-normal h-auto',
            iconRight: { icon: ArrowRight, className: 'ml-2 w-5 h-5' },
          }),
          trust({
            className: 'flex flex-wrap justify-center gap-4 mt-12',
            itemClassName: 'flex items-center gap-2 bg-neutral-900/70 border border-neutral-800 rounded-full px-4 py-2',
            iconClassName: 'w-4 h-4 text-amber-300',
            textClassName: 'text-sm text-neutral-300',
            items: [
              { icon: Zap, text: 'PDV rápido' },
              { icon: ShoppingBag, text: 'Pedido para retirada' },
              { icon: QrCode, text: 'Mesa por QR Code' },
              { icon: Monitor, text: 'Cardápio na TV' },
              { icon: DollarSign, text: 'Sem comissão por pedido' },
            ],
          }),
        ]),
      ]),
    ]),

    // Horário de pico
    h('section', 'py-20 bg-neutral-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto text-center mb-14', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-6', text: ['Quatro jeitos de pedir,', ' ', span('text-amber-300', 'um só sistema.')] }),
          h('p', {
            className: 'text-lg md:text-xl text-neutral-400',
            text: 'De manhã, o cliente tem pressa. Uns pedem no balcão, outros querem só retirar, outros sentam. Se cada um vira uma anotação diferente, o café atrasa e o pedido sai errado.',
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto',
          items: rush,
          card: h('Card', 'bg-neutral-900 border-neutral-800 hover:border-amber-500/50 transition-all duration-300 group', [
            h('CardContent', 'p-7', [
              h('div', 'w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform', [itemIcon('w-7 h-7 text-amber-300')]),
              f('h3', 'text-xl font-bold mb-2 text-white', 'title'),
              f('p', 'text-neutral-400', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // Combos
    h('section', 'py-20', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto text-center mb-14', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-6', text: ['Combo bem montado', ' ', span(GRADIENT, 'aumenta o pedido.')] }),
          h('p', {
            className: 'text-lg md:text-xl text-neutral-400',
            text: 'Café com pão de queijo, cappuccino com croissant. O combo facilita a escolha do cliente e coloca mais um item em cada pedido.',
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-8 max-w-6xl mx-auto',
          items: combos,
          card: h('Card', 'bg-neutral-900 border-neutral-800 hover:border-orange-400/50 transition-all duration-300 group', [
            h('CardContent', 'p-8', [
              h('div', 'w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform', [itemIcon('w-7 h-7 text-orange-300')]),
              f('h3', 'text-xl font-bold mb-2 text-white', 'title'),
              f('p', 'text-neutral-400', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // Operação
    h('section', 'py-20 bg-neutral-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto text-center mb-14', [
          badge({
            className: 'inline-flex items-center gap-2 bg-orange-500/15 border border-orange-500/30 rounded-full px-4 py-2 mb-6',
            icon: Smartphone,
            iconClassName: 'w-4 h-4 text-orange-300',
            text: 'Atrás do balcão',
            textClassName: 'text-orange-200 text-sm font-medium',
          }),
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-6', text: ['O barista prepara.', ' ', span('text-amber-300', 'O sistema organiza.')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6 max-w-6xl mx-auto',
          items: ops,
          card: h('Card', 'bg-neutral-900 border-neutral-800 hover:border-amber-500/50 transition-all duration-300', [
            h('CardContent', 'p-7', [
              h('div', 'flex items-center gap-3 mb-4', [
                h('div', 'w-12 h-12 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0', [itemIcon('w-6 h-6 text-amber-300')]),
                f('h3', 'text-lg font-bold text-white', 'title'),
              ]),
              f('p', 'text-neutral-400', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // Como começa
    h('section', 'py-20', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto text-center mb-14', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-6', text: ['Sem tempo para configurar?', ' ', span('text-amber-300', 'A gente deixa tudo pronto.')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-8 max-w-6xl mx-auto',
          items: steps,
          card: h('Card', 'bg-neutral-900 border-neutral-800 hover:border-amber-500/30 transition-all duration-300', [
            h('CardContent', 'p-6', [
              f('div', 'w-10 h-10 rounded-full bg-amber-500 text-neutral-950 font-bold flex items-center justify-center mb-4', 'n'),
              f('h3', 'text-xl font-bold mb-2 text-white', 'title'),
              f('p', 'text-neutral-400', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    plans('Essencial'),

    // FAQ
    h('section', 'py-20 bg-neutral-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto', [
          h('h2', { className: 'text-3xl font-bold text-center mb-12', text: ['Perguntas ', span('text-amber-300', 'frequentes')] }),
          faq({
            variant: 'accordion',
            className: 'space-y-4',
            itemClassName: 'bg-neutral-900 border border-neutral-800 rounded-xl px-6',
            triggerClassName: 'text-left hover:no-underline py-6',
            contentClassName: 'text-neutral-400 pb-6',
            valueStart: 1,
            triggerInner: { as: 'span', className: 'font-semibold' },
            items: faqs,
          }),
          h('p', { className: 'text-center text-neutral-500 mt-10 mb-3 text-sm', text: 'Para ler com calma:' }),
          links({ className: 'flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm', linkClassName: 'text-amber-300 hover:text-amber-200 underline underline-offset-4', items: related }),
        ]),
      ]),
    ]),

    // Rodapé
    h('footer', 'py-12 border-t border-neutral-800', [
      h('div', 'container mx-auto px-4 text-center', [
        h('p', { className: 'text-neutral-400 mb-4', text: [span('font-semibold text-white', 'Mostralo.com.br'), ' | Menos fila no balcão. Mais café servido.'] }),
        links({ className: 'flex flex-wrap justify-center gap-6 text-sm text-neutral-500', linkClassName: 'hover:text-amber-300 transition-colors', items: FOOTER_LINKS }),
      ]),
    ]),

    whatsapp(),
  ],
};
