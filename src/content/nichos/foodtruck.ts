import { ArrowRight, BarChart3, CreditCard, DollarSign, MapPin, Monitor, QrCode, Smartphone, Star, Truck, Users } from 'lucide-react';
import { badge, cta, custom, f, faq, FOOTER_LINKS, grid, h, icon, itemIcon, layer, links, plans, span, trust } from '@/components/nicho/build';
import { FoodTruckOrderTracking } from '@/components/nicho/custom/FoodTruckOrderTracking';
import type { NicheContent } from '@/components/nicho/types';

// ---- Textos ----
const solutions = [
  {
    icon: Smartphone,
    title: 'PDV Móvel (Tablet/Celular)',
    description: 'Venda no balcão com um toque. Aceite PIX, Cartão e Dinheiro com fechamento de caixa automático. Sem fios, sem bagunça.',
  },
  {
    icon: QrCode,
    title: 'QR Code na Mesa ou Balcão',
    description: 'O cliente chega, escaneia o código, faz o pedido e paga sozinho. O pedido cai direto na sua tela de preparo (KDS).',
  },
  {
    icon: Monitor,
    title: 'KDS para Espaços Reduzidos',
    description: 'Substitua a impressora barulhenta por um monitor ou tablet. Visualize a fila de pedidos por ordem de chegada.',
  },
];

const features = [
  {
    icon: DollarSign,
    title: 'O Fim das Taxas do App',
    description: 'Por que dar 25% do seu lucro para aplicativos se o cliente está na sua frente? Use o Mostralo para criar sua própria base de clientes fiéis e venda com taxa 0%.',
    stat: '0%',
    statLabel: 'taxas',
  },
  {
    icon: MapPin,
    title: 'WhatsApp Marketing de Localização',
    description: 'Vai mudar de ponto hoje? O Mostralo avisa seus clientes daquela região automaticamente via WhatsApp. Garanta movimento onde quer que você estacione.',
    stat: '+40%',
    statLabel: 'movimento',
  },
  {
    icon: BarChart3,
    title: 'Financeiro na Palma da Mão',
    description: 'Saiba exatamente quanto faturou na noite, quais ingredientes estão acabando e qual o seu lucro real, tudo pelo smartphone.',
    stat: '100%',
    statLabel: 'controle',
  },
];

const roiRows = [
  { icon: Users, label: 'Funcionário no caixa (salário + encargos)', detail: 'Substituído pelo QR Code/Totem', value: 'R$ 2.000,00' },
  { icon: CreditCard, label: 'Taxas de marketplace em eventos', detail: '(iFood, Rappi, etc. - 25%)', value: 'R$ 3.500,00' },
];

const testimonials = [
  { quote: 'O QR Code eliminou a fila no balcão. Faturei 30% mais no último evento.', author: 'Lucas', business: 'Truck Burger - SP' },
  { quote: 'O aviso de localização pelo WhatsApp é genial. Meus clientes me acham em qualquer ponto.', author: 'Camila', business: 'Taco Truck - RJ' },
  { quote: 'Controlo tudo pelo celular, até de casa. Sei exatamente quanto faturei cada noite.', author: 'Roberto', business: 'Hot Dog Truck - MG' },
];

const faqs = [
  {
    q: 'O sistema funciona sem internet fixa?',
    a: 'Sim! O PDV móvel funciona com 4G do seu celular. E mesmo se a conexão cair temporariamente, os pedidos são salvos localmente e sincronizados quando a internet voltar. Sua operação nunca para.',
  },
  {
    q: 'Como funciona o WhatsApp de localização?',
    a: "Você cadastra suas regiões de atuação e seus clientes. Quando você estacionar em um novo ponto, o sistema avisa automaticamente os clientes daquela região: 'O Truck Burger está hoje na Praça X! Venha nos visitar.'",
  },
  {
    q: 'Preciso de equipamentos caros?',
    a: 'Não! Você pode usar o celular ou tablet que já tem. O sistema é 100% na nuvem. Se quiser, pode adicionar uma impressora térmica Bluetooth compacta para imprimir os pedidos na cozinha.',
  },
];

// ---- Página ----
export const foodtruck: NicheContent = {
  path: '/nicho-foodtruck',
  seo: {
    title: 'Sistema para Food Truck | PDV Móvel, QR Code e KDS | Mostralo',
    description: 'Sistema completo para Food Trucks: PDV móvel, QR Code de autoatendimento, KDS compacto e WhatsApp Marketing por localização. Taxa 0% e controle total pelo celular.',
    keywords: 'sistema food truck, pdv móvel food truck, qr code food truck, cardápio digital food truck, gestão food truck, autoatendimento food truck',
  },
  pageClassName: 'min-h-screen bg-zinc-950 text-white',
  sections: [
    // Hero
    h('section', 'relative overflow-hidden py-20 lg:py-32', [
      layer('absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-zinc-950'),
      layer('absolute top-20 right-10 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl animate-pulse'),
      layer('absolute bottom-10 left-10 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl'),
      h('div', 'container mx-auto px-4 relative z-10', [
        h('div', 'max-w-4xl mx-auto text-center', [
          badge({
            className: 'inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 mb-8',
            icon: Truck,
            iconClassName: 'w-5 h-5 text-orange-400',
            text: 'Para Food Trucks & Trailers de Comida',
            textClassName: 'text-orange-300 font-medium',
          }),
          h('h1', {
            className: 'text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight',
            text: [
              'Leve a inteligência do Mostralo para a',
              ' ',
              span('text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600', 'estrada'),
              ' ',
              'e fature mais em cada parada.',
            ],
          }),
          h('p', {
            className: 'text-xl text-zinc-400 mb-10 max-w-3xl mx-auto',
            text: 'O ecossistema All-in-One que transforma seu Food Truck em uma operação profissional. Gerencie pedidos, elimine filas com autoatendimento e controle tudo pelo celular ou tablet.',
          }),
          cta({
            label: 'QUERO TURBINAR MEU FOOD TRUCK',
            className: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-6 text-lg font-bold rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.5)] hover:shadow-[0_0_50px_rgba(249,115,22,0.7)] transition-all duration-300',
            iconRight: { icon: ArrowRight, className: 'ml-2 w-5 h-5' },
          }),
          trust({
            className: 'flex flex-wrap justify-center gap-6 mt-12',
            itemClassName: 'flex items-center gap-2 text-zinc-400',
            iconClassName: 'w-5 h-5 text-orange-400',
            items: [
              { icon: DollarSign, text: 'Taxa 0%' },
              { icon: Smartphone, text: 'PDV Móvel' },
              { icon: QrCode, text: 'QR Code' },
              { icon: Monitor, text: 'KDS Compacto' },
            ],
          }),
        ]),
      ]),
    ]),

    // Problema
    h('section', 'py-20 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-4xl mx-auto text-center mb-16', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-6', text: ['Espaço pequeno,', ' ', span('text-orange-400', 'produtividade gigante')] }),
          h('p', { className: 'text-xl text-zinc-400 mb-4', text: 'Pare de se enrolar com comandas de papel no meio da correria.' }),
          h('p', {
            className: 'text-zinc-500',
            text: 'No Food Truck, cada centímetro e cada segundo contam. Se você perde tempo gritando pedidos ou conferindo papel molhado de gordura, você está perdendo dinheiro.',
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-8 max-w-6xl mx-auto',
          items: solutions,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 group', [
            h('CardContent', 'p-8', [
              h('div', 'w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-500/30 transition-colors', [itemIcon('w-7 h-7 text-orange-400')]),
              f('h3', 'text-xl font-bold text-white mb-4', 'title'),
              f('p', 'text-zinc-400', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // Recursos
    h('section', 'py-20', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-4xl mx-auto text-center mb-16', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-6', text: ['Tecnologia que', ' ', span('text-orange-400', 'acompanha o seu ritmo')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-8 max-w-6xl mx-auto',
          items: features,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 overflow-hidden group', [
            h('CardContent', 'p-8', [
              h('div', 'flex items-center justify-between mb-6', [
                h('div', 'w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center group-hover:bg-orange-500/30 transition-colors', [itemIcon('w-7 h-7 text-orange-400')]),
                h('div', 'text-right', [f('div', 'text-2xl font-bold text-orange-400', 'stat'), f('div', 'text-xs text-zinc-500 uppercase', 'statLabel')]),
              ]),
              f('h3', 'text-xl font-bold text-white mb-4', 'title'),
              f('p', 'text-zinc-400', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    custom(FoodTruckOrderTracking),

    // ROI
    h('section', 'py-20', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-4xl mx-auto text-center mb-12', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-6', text: ['Menos custo fixo,', ' ', span('text-orange-400', 'mais lucro líquido')] }),
        ]),
        h('div', 'max-w-2xl mx-auto', [
          h('Card', 'bg-zinc-900 border-orange-500/30 overflow-hidden', [
            h('CardContent', 'p-8', [
              h('div', 'space-y-6', [
                grid({
                  items: roiRows,
                  card: h('div', 'flex items-center gap-4 pb-4 border-b border-zinc-800', [
                    itemIcon('w-8 h-8 text-zinc-500'),
                    h('div', 'flex-1', [f('div', 'text-zinc-400', 'label'), f('div', 'text-sm text-zinc-600', 'detail')]),
                    h('div', 'text-right', [f('div', 'text-lg font-bold text-green-400', 'value'), h('div', { className: 'text-xs text-zinc-500', text: 'economia/mês' })]),
                  ]),
                }),
                h('div', 'bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-xl p-6 border border-orange-500/30', [
                  h('div', 'flex items-center justify-between', [
                    h('div', [
                      h('div', { className: 'text-lg text-zinc-300', text: 'ECONOMIA TOTAL MENSAL' }),
                      h('div', { className: 'text-sm text-orange-400 mt-1', text: 'O Mostralo se paga nas primeiras horas de um evento!' }),
                    ]),
                    h('div', 'text-right', [h('div', { className: 'text-3xl font-bold text-orange-400', text: 'R$ 5.500,00' })]),
                  ]),
                ]),
              ]),
            ]),
          ]),
        ]),
      ]),
    ]),

    // Depoimentos
    h('section', 'py-20 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-4xl mx-auto text-center mb-16', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold mb-6', text: ['Food Trucks que já', ' ', span('text-orange-400', 'faturam mais')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-8 max-w-6xl mx-auto',
          items: testimonials,
          card: h('Card', 'bg-zinc-900 border-zinc-800', [
            h('CardContent', 'p-8', [
              h('div', 'flex gap-1 mb-4', [icon(Star, 'w-5 h-5 fill-orange-400 text-orange-400', { repeat: 5 })]),
              f('p', 'text-zinc-300 mb-6 italic', 'quote', { quote: true }),
              h('div', 'flex items-center gap-3', [
                h('div', 'w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center', [icon(Truck, 'w-5 h-5 text-orange-400')]),
                h('div', [f('div', 'font-semibold text-white', 'author'), f('div', 'text-sm text-zinc-500', 'business')]),
              ]),
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
          h('h2', { className: 'text-3xl md:text-4xl font-bold text-center mb-12', text: ['Dúvidas ', span('text-orange-400', 'frequentes')] }),
          faq({
            variant: 'accordion',
            className: 'space-y-4',
            itemClassName: 'bg-zinc-900 border border-zinc-800 rounded-xl px-6 data-[state=open]:border-orange-500/50',
            triggerClassName: 'text-left text-white hover:text-orange-400 hover:no-underline py-6',
            contentClassName: 'text-zinc-400 pb-6',
            valuePrefix: 'faq-',
            items: faqs,
          }),
        ]),
      ]),
    ]),

    // Rodapé (esta página não tem o botão flutuante de WhatsApp)
    h('footer', 'py-12 border-t border-zinc-800', [
      h('div', 'container mx-auto px-4', [
        h('div', 'flex flex-col md:flex-row items-center justify-between gap-6', [
          h('div', 'flex items-center gap-3', [
            h('div', 'w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center', [icon(Truck, 'w-6 h-6 text-white')]),
            h('div', [
              h('div', { className: 'font-bold text-white', text: 'Mostralo.com.br' }),
              h('div', { className: 'text-sm text-zinc-500', text: 'Liberdade para vender em qualquer lugar.' }),
            ]),
          ]),
          links({ className: 'flex flex-wrap justify-center gap-6 text-sm text-zinc-500', linkClassName: 'hover:text-orange-400 transition-colors', items: FOOTER_LINKS }),
        ]),
      ]),
    ]),
  ],
};
