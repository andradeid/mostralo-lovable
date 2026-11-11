import { ArrowRight, BarChart3, Cake, CalendarClock, Camera, DollarSign, Gift, Heart, Layers, MessageSquare, Printer, Store, Truck } from 'lucide-react';
import { badge, cta, f, faq, FOOTER_LINKS, grid, h, icon, itemIcon, layer, links, plans, savings, span, trust, whatsapp } from '@/components/nicho/build';
import type { NicheContent } from '@/components/nicho/types';

const GRADIENT = 'bg-gradient-to-r from-rose-300 to-fuchsia-300 bg-clip-text text-transparent';

// ---- Textos ----
const encomendas = [
  {
    icon: CalendarClock,
    title: 'Data e horário na encomenda',
    description: 'O cliente escolhe o dia e o horário de retirada ou de entrega ao fechar o pedido. Nada de encomenda anotada no caderno ou perdida no WhatsApp.',
  },
  {
    icon: Cake,
    title: 'Antecedência do seu jeito',
    description: 'Você define a antecedência mínima, como 2 dias para bolo, e até quantos dias à frente o cliente pode marcar. O que não dá tempo de fazer, o cliente nem consegue pedir.',
  },
  {
    icon: Layers,
    title: 'Bolo montado com escolhas',
    description: 'Tamanho, massa, recheio e cobertura em grupos de adicionais, com mínimo, máximo e preço de cada opção. A encomenda chega completa para a produção.',
  },
  {
    icon: Truck,
    title: 'Retirada ou delivery',
    description: 'Retirada no horário marcado ou entrega pelo seu delivery próprio, sem comissão por pedido. Os horários de entrega seguem o intervalo que você escolher.',
  },
];

const vitrine = [
  {
    icon: Camera,
    title: 'Cardápio com foto de cada doce',
    description: 'Bolo, torta, brigadeiro, docinho de festa: cada produto com a sua foto, em uma loja online com o seu domínio. O cliente vê o que está comprando.',
  },
  {
    icon: Store,
    title: 'Vitrine e balcão no PDV',
    description: 'A fatia, o doce da vitrine e o café saem pelo caixa, com abertura e fechamento. Doce por quilo pede o peso digitado.',
  },
  {
    icon: Printer,
    title: 'Pedido impresso para a produção',
    description: 'Cada encomenda sai na impressora térmica ou no app Mostralo Pedidos, no Android, com a data, o horário e todas as escolhas do cliente.',
  },
];

const datas = [
  {
    icon: Gift,
    title: 'Natal',
    description: 'Abra uma categoria de encomendas de Natal com panetone, torta e caixa de doces. Ajuste a antecedência para dar conta da produção da temporada.',
  },
  {
    icon: Heart,
    title: 'Dia das Mães',
    description: 'Monte as opções de bolo e de cesta de doces semanas antes e avise a sua clientela pelo WhatsApp para ela encomendar cedo.',
  },
  {
    icon: Cake,
    title: 'Páscoa',
    description: 'Ovo de colher, ovo trufado, caixa de bombom. Cada sabor e tamanho com o seu preço, e as encomendas organizadas por data de retirada.',
  },
];

const steps = [
  { n: '1', title: 'Você manda o cardápio e as fotos', description: 'Bolos, tortas, doces, tamanhos e preços. Pode ser a tabela que você já manda no WhatsApp.' },
  { n: '2', title: 'A gente monta com a sua marca', description: 'Loja online com domínio próprio, encomendas com data e antecedência e o caixa do balcão. Você vê funcionando antes de decidir.' },
  { n: '3', title: 'Configura e acompanha', description: 'Ligamos a impressora, deixamos as regras de encomenda do jeito da sua produção e acompanhamos as primeiras encomendas.' },
];

const faqs = [
  {
    q: 'Como o cliente encomenda um bolo para uma data?',
    a: 'Com os pedidos agendados ligados, o cliente escolhe o bolo e as opções na sua loja online e, ao fechar o pedido, marca a data e o horário de retirada ou de entrega. A encomenda chega no painel com essa data.',
  },
  {
    q: 'Consigo exigir antecedência mínima?',
    a: 'Sim. Você define o tempo mínimo e o máximo de antecedência, em minutos, horas ou dias, separado para retirada e para entrega. Também dá para deixar a loja só com pedidos agendados.',
  },
  {
    q: 'Dá para cobrar mais por recheio especial ou tamanho maior?',
    a: 'Dá. Tamanho, recheio e cobertura ficam em grupos de adicionais. Cada opção tem o seu preço, e você define quantas o cliente pode escolher em cada grupo.',
  },
  {
    q: 'Também vendo no balcão. Funciona junto?',
    a: 'Funciona. O PDV usa os mesmos produtos da loja online, com abertura, sangria e fechamento de caixa. O relatório mostra as vendas do balcão e das encomendas no mesmo painel.',
  },
  {
    q: 'Tem comissão nas encomendas com entrega?',
    a: 'Não tem comissão por pedido. Você paga a mensalidade do Mostralo. Se usar o pagamento online pelo EFI, ele tem taxa à parte.',
  },
];

const related = [
  { label: 'Guia: encomenda de kit festa', to: '/guia/encomenda-de-kit-festa' },
  { label: 'Guia: encomenda de ceia de Natal', to: '/guia/encomenda-de-ceia-de-natal' },
  { label: 'Guia: o que vender no Natal', to: '/guia/o-que-vender-no-natal' },
  { label: 'Página para padarias', to: '/nicho-padarias' },
];

// ---- Página ----
export const confeitarias: NicheContent = {
  path: '/nicho-confeitarias',
  seo: {
    title: 'Sistema para Confeitaria: Encomendas de Bolo e Doces | Mostralo',
    description: 'Sistema para confeitaria: encomenda de bolo com data, horário e antecedência mínima, cardápio online com fotos, retirada agendada, delivery próprio e PDV.',
    keywords: 'sistema para confeitaria, encomenda de bolo online, sistema de encomendas confeitaria, cardápio digital confeitaria, pedido agendado bolo, pdv confeitaria, delivery de doces',
  },
  pageClassName: 'min-h-screen bg-zinc-950 text-white',
  sections: [
    // Hero
    h('section', 'relative overflow-hidden py-20 lg:py-28', [
      layer('absolute inset-0 bg-gradient-to-br from-rose-500/10 via-transparent to-fuchsia-500/10'),
      layer('absolute top-10 left-0 w-72 h-72 bg-rose-400/15 rounded-full blur-3xl'),
      layer('absolute bottom-0 right-0 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl'),
      h('div', 'container mx-auto px-4 relative z-10', [
        h('div', 'max-w-4xl mx-auto text-center', [
          badge({
            className: 'inline-flex items-center gap-2 bg-rose-500/15 border border-rose-400/30 rounded-full px-4 py-2 mb-8',
            icon: Cake,
            iconClassName: 'w-5 h-5 text-rose-300',
            text: 'Para confeitarias e docerias',
            textClassName: 'text-rose-200 text-sm font-medium',
          }),
          h('h1', {
            className: 'text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight',
            text: ['Encomenda de bolo', ' ', span(GRADIENT, 'com data, horário e tudo anotado.'), ' ', 'Sem caderno.'],
          }),
          h('p', {
            className: 'text-xl md:text-2xl text-zinc-300 mb-10 max-w-3xl mx-auto',
            text: 'O cliente escolhe o bolo, o recheio e o dia na sua loja online. Você recebe a encomenda pronta, dentro da antecedência que definiu. E a gente deixa tudo pronto para você.',
          }),
          cta({
            asChild: true,
            label: 'QUERO ORGANIZAR MINHAS ENCOMENDAS',
            className: 'bg-rose-500 hover:bg-rose-600 text-white text-lg px-8 py-6 rounded-xl shadow-[0_0_30px_rgba(244,63,94,0.35)] hover:shadow-[0_0_45px_rgba(244,63,94,0.55)] transition-all duration-300 hover:scale-105 whitespace-normal h-auto',
            iconRight: { icon: ArrowRight, className: 'ml-2 w-5 h-5' },
          }),
          trust({
            className: 'flex flex-wrap justify-center gap-4 mt-12',
            itemClassName: 'flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-full px-4 py-2',
            iconClassName: 'w-4 h-4 text-rose-300',
            textClassName: 'text-sm text-zinc-300',
            items: [
              { icon: CalendarClock, text: 'Encomenda com data' },
              { icon: Camera, text: 'Cardápio com fotos' },
              { icon: Truck, text: 'Retirada e delivery' },
              { icon: DollarSign, text: 'Sem comissão por pedido' },
            ],
          }),
        ]),
      ]),
    ]),

    // Encomendas
    h('section', 'py-20 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto text-center mb-14', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-6', text: ['Encomenda boa é a que', ' ', span('text-rose-300', 'chega certa e no prazo.')] }),
          h('p', {
            className: 'text-lg md:text-xl text-zinc-400',
            text: 'Recheio trocado, data errada, pedido para amanhã que precisava de três dias. Na confeitaria, cada erro de anotação vira bolo refeito. O Mostralo coloca a regra da sua produção no pedido.',
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto',
          items: encomendas,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-rose-400/50 transition-all duration-300 group', [
            h('CardContent', 'p-7', [
              h('div', 'w-14 h-14 rounded-2xl bg-rose-500/15 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform', [itemIcon('w-7 h-7 text-rose-300')]),
              f('h3', 'text-xl font-bold mb-2 text-white', 'title'),
              f('p', 'text-zinc-400', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // Vitrine e loja
    h('section', 'py-20', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto text-center mb-14', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-6', text: ['Da vitrine da loja', ' ', span(GRADIENT, 'ao celular do cliente.')] }),
          h('p', {
            className: 'text-lg md:text-xl text-zinc-400',
            text: 'Doce entra pelos olhos. Com foto de cada produto na loja online e o caixa no balcão usando o mesmo cadastro, você vende a encomenda e a fatia do dia sem dois sistemas.',
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-8 max-w-6xl mx-auto',
          items: vitrine,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-fuchsia-400/50 transition-all duration-300 group', [
            h('CardContent', 'p-8', [
              h('div', 'w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500/20 to-fuchsia-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform', [itemIcon('w-7 h-7 text-fuchsia-300')]),
              f('h3', 'text-xl font-bold mb-2 text-white', 'title'),
              f('p', 'text-zinc-400', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // Datas fortes
    h('section', 'py-20 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto text-center mb-14', [
          badge({
            className: 'inline-flex items-center gap-2 bg-fuchsia-500/15 border border-fuchsia-400/30 rounded-full px-4 py-2 mb-6',
            icon: MessageSquare,
            iconClassName: 'w-4 h-4 text-fuchsia-300',
            text: 'Campanhas de WhatsApp',
            textClassName: 'text-fuchsia-200 text-sm font-medium',
          }),
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-6', text: ['As datas que enchem a agenda', ' ', span('text-rose-300', 'da confeitaria.')] }),
          h('p', {
            className: 'text-lg md:text-xl text-zinc-400',
            text: 'Em data forte, a encomenda chega toda de uma vez. Abra o cardápio da data com antecedência, avise quem já comprou de você e deixe o sistema organizar as datas de retirada.',
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6 max-w-6xl mx-auto',
          items: datas,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-rose-400/50 transition-all duration-300', [
            h('CardContent', 'p-7', [
              h('div', 'flex items-center gap-3 mb-4', [
                h('div', 'w-12 h-12 rounded-lg bg-rose-500/15 flex items-center justify-center shrink-0', [itemIcon('w-6 h-6 text-rose-300')]),
                f('h3', 'text-xl font-bold text-white', 'title'),
              ]),
              f('p', 'text-zinc-400', 'description'),
            ]),
          ]),
        }),
        h('div', 'max-w-3xl mx-auto mt-10', [
          h('Card', 'bg-zinc-900 border-rose-400/30', [
            h('CardContent', 'p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left', [
              h('div', 'w-14 h-14 rounded-full bg-gradient-to-br from-rose-500/30 to-fuchsia-500/30 flex items-center justify-center shrink-0', [icon(BarChart3, 'w-7 h-7 text-rose-200')]),
              h('div', [
                h('h3', { className: 'font-bold text-lg mb-1 text-white', text: 'Relatório depois da data' }),
                h('p', { className: 'text-zinc-400', text: 'Veja quais produtos mais venderam e quanto entrou por forma de pagamento. Serve de base para planejar a produção da próxima temporada.' }),
              ]),
            ]),
          ]),
        ]),
      ]),
    ]),

    savings(),

    // Como começa
    h('section', 'py-20 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto text-center mb-14', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-6', text: ['Sem tempo entre uma fornada e outra?', ' ', span('text-rose-300', 'A gente deixa tudo pronto.')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-8 max-w-6xl mx-auto',
          items: steps,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-rose-400/30 transition-all duration-300', [
            h('CardContent', 'p-6', [
              f('div', 'w-10 h-10 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center mb-4', 'n'),
              f('h3', 'text-xl font-bold mb-2 text-white', 'title'),
              f('p', 'text-zinc-400', 'description'),
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
          h('h2', { className: 'text-3xl font-bold text-center mb-12', text: ['Perguntas ', span('text-rose-300', 'frequentes')] }),
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
          h('p', { className: 'text-center text-zinc-500 mt-10 mb-3 text-sm', text: 'Para ler com calma:' }),
          links({ className: 'flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm', linkClassName: 'text-rose-300 hover:text-rose-200 underline underline-offset-4', items: related }),
        ]),
      ]),
    ]),

    // Rodapé
    h('footer', 'py-12 border-t border-zinc-800', [
      h('div', 'container mx-auto px-4 text-center', [
        h('p', { className: 'text-zinc-400 mb-4', text: [span('font-semibold text-white', 'Mostralo.com.br'), ' | Encomenda certa, no dia certo.'] }),
        links({ className: 'flex flex-wrap justify-center gap-6 text-sm text-zinc-500', linkClassName: 'hover:text-rose-300 transition-colors', items: FOOTER_LINKS }),
      ]),
    ]),

    whatsapp(),
  ],
};
