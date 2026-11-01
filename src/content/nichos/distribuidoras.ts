import { ArrowRight, BarChart3, Beer, Bike, Calendar, DollarSign, MapPin, QrCode, RefreshCw, Star, Tablet, Zap } from 'lucide-react';
import { badge, cta, f, faq, FOOTER_LINKS, grid, h, icon, itemIcon, layer, links, plans, savings, span, trust, whatsapp } from '@/components/nicho/build';
import type { NicheContent } from '@/components/nicho/types';

const ORANGE_SKY = 'bg-gradient-to-r from-orange-500 to-sky-400 bg-clip-text text-transparent';
const SKY_ORANGE = 'bg-gradient-to-r from-sky-400 to-orange-500 bg-clip-text text-transparent';

const channelCls = (color: 'sky' | 'orange') => ({
  card: `p-6 rounded-2xl bg-zinc-900 border ${color === 'sky' ? 'border-sky-500/30' : 'border-orange-500/30'} text-center`,
  iconWrap: `w-16 h-16 mx-auto rounded-xl ${color === 'sky' ? 'bg-sky-500/20' : 'bg-orange-500/20'} flex items-center justify-center mb-4`,
  icon: `w-8 h-8 ${color === 'sky' ? 'text-sky-400' : 'text-orange-500'}`,
});

// ---- Textos ----
const solutions = [
  {
    icon: MapPin,
    title: 'Delivery Inteligente por Mapa',
    description: 'Desenhe no mapa as zonas de entrega (raio ou área) com a taxa de cada uma. Fora das zonas, não entra pedido. O cliente pede, o sistema calcula o frete, você só entrega.',
  },
  {
    icon: Bike,
    title: 'App do Entregador',
    description: 'Cada motoboy vê e aceita as entregas no app dele. Você sabe quem está com qual pedido, o cliente acompanha o status pelo link do pedido e o acerto com cada entregador fica registrado.',
  },
  {
    icon: Zap,
    title: 'PDV Ultra-Rápido de Balcão',
    description: 'Venda um pack de cerveja em poucos toques, com baixa no estoque e tudo no relatório, para o balcão não parar nos dias de pico (sexta e sábado).',
  },
];

const benefits = [
  {
    icon: Calendar,
    title: 'WhatsApp Marketing - O Gatilho do FDS',
    description: "'Sextou com oferta!' Em poucos cliques você manda o link do seu catálogo para os clientes fiéis (e pode agendar o envio para sexta). Você escolhe quem recebe.",
    stat: '1 clique',
    statLabel: 'para disparar a campanha',
  },
  {
    icon: RefreshCw,
    title: 'Recorrência de Gás e Água',
    description: 'Se você também vende gás ou água, defina o ciclo de cada produto (ex.: galão a cada 15 dias) e o Mostralo avisa o cliente no WhatsApp quando estiver na hora de pedir de novo.',
    stat: 'Todo dia',
    statLabel: 'lembretes de recompra',
  },
  {
    icon: BarChart3,
    title: 'Gestão Financeira e Relatórios',
    description: 'Saiba quais rótulos mais vendem e quais só ocupam espaço no freezer. Acompanhe o caixa e o faturamento de cada dia.',
    stat: 'Na hora',
    statLabel: 'relatório de vendas',
  },
];

const channels = [
  { icon: QrCode, title: 'QR CODE', subtitle: 'Pega e leva sem fila', cls: channelCls('sky') },
  { icon: Tablet, title: 'BALCÃO', subtitle: 'PDV ultra-rápido', cls: channelCls('orange') },
  { icon: Bike, title: 'DELIVERY', subtitle: 'Status em tempo real', cls: channelCls('sky') },
];

const testimonials = [
  { name: 'Fernando', business: 'Distribuidora Gelada - SP', text: 'O GPS dos entregadores mudou tudo. Sei exatamente quem está com qual pedido e quanto dinheiro tem na rua.' },
  { name: 'Marcos', business: 'Depósito do Marcos - MG', text: 'O WhatsApp automático na sexta-feira é sucesso. Os clientes já esperam a mensagem e pedem antes de eu enviar.' },
  { name: 'Ricardo', business: 'Adega Central - RJ', text: 'Saí do iFood e economizo R$ 7.000/mês. Esse dinheiro virou estoque extra e uma moto nova pro motoboy.' },
];

const faqs = [
  {
    q: 'Como funciona o app dos entregadores?',
    a: 'Cada entregador entra no app do Mostralo pelo celular, vê as entregas disponíveis e aceita as dele. Você sabe quem está com qual pedido e acompanha o acerto de cada um. O cliente acompanha o status do pedido pelo link. O Mostralo não mostra a posição do motoboy no mapa.',
  },
  {
    q: 'Consigo definir taxas diferentes por bairro?',
    a: 'Sim! Você desenha as zonas de entrega no mapa (por raio ou por área, cobrindo os bairros que quiser) e define a taxa de cada uma, inclusive grátis para quem está perto. Fora das zonas, o pedido de entrega não entra.',
  },
  {
    q: 'Funciona para venda de gás e água também?',
    a: 'Sim! Você define o ciclo de cada produto (ex: galão de água a cada 15 dias, botijão a cada 30 dias) e o Mostralo manda o lembrete de recompra no WhatsApp do cliente antes de acabar. Você vende mais sem precisar ligar pra ninguém.',
  },
];

// ---- Página ----
export const distribuidoras: NicheContent = {
  path: '/nicho-distribuidoras',
  seo: {
    title: 'Mostralo para Distribuidoras de Bebidas | Sistema Completo com Delivery',
    description: 'Sistema All-in-One para distribuidoras de bebidas, depósitos e adegas. Delivery com zonas no mapa e app do entregador, PDV rápido, WhatsApp Marketing e sem comissão por pedido.',
    keywords: 'sistema distribuidora bebidas, delivery bebidas, PDV distribuidora, cardápio digital bebidas, gestão entregadores, app motoboy',
  },
  pageClassName: 'min-h-screen bg-zinc-950 text-zinc-100',
  scrollToTop: true,
  sections: [
    // Hero
    h('section', 'relative overflow-hidden pt-20 pb-32', [
      layer('absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-orange-500/10'),
      layer('absolute top-20 left-10 w-72 h-72 bg-sky-500/20 rounded-full blur-3xl animate-pulse'),
      layer('absolute bottom-20 right-10 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl animate-pulse', { animationDelay: '1s' }),
      h('div', 'container mx-auto px-4 relative z-10', [
        h('div', 'max-w-4xl mx-auto text-center', [
          badge({
            className: 'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-400 text-sm font-medium mb-8',
            icon: Beer,
            iconClassName: 'w-4 h-4',
            text: 'Para Distribuidoras de Bebidas, Depósitos e Adegas',
          }),
          h('h1', {
            className: 'text-4xl md:text-6xl font-bold mb-6 leading-tight',
            text: ['Não deixe o seu lucro', ' ', span(ORANGE_SKY, '"esquentar"'), '. Transforme sua distribuidora em uma', ' ', span(SKY_ORANGE, 'máquina de vendas'), '.'],
          }),
          h('p', {
            className: 'text-xl text-zinc-400 mb-10 max-w-3xl mx-auto',
            text: 'O Mostralo é o ecossistema All-in-One que une seu PDV de balcão ao delivery ultra-rápido. Sem comissão por pedido (pagamento online tem taxa à parte), app do entregador e campanhas de vendas por WhatsApp.',
          }),
          cta({
            label: 'MODERNIZAR MINHA DISTRIBUIDORA',
            className: 'bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300 hover:scale-105',
            iconRight: { icon: ArrowRight, className: 'ml-2 w-5 h-5' },
          }),
          trust({
            className: 'flex flex-wrap justify-center gap-4 mt-12',
            itemClassName: 'flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-sm',
            iconClassName: 'w-4 h-4 text-sky-400',
            bareText: true,
            items: [
              { icon: DollarSign, text: 'Sem comissão por pedido' },
              { icon: MapPin, text: 'Mapa de Entregas' },
              { icon: Bike, text: 'App do Entregador' },
              { icon: BarChart3, text: 'Relatórios' },
            ],
          }),
        ]),
      ]),
    ]),

    // Problema / solução
    h('section', 'py-24 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-4xl mx-auto text-center mb-16', [
          h('h2', {
            className: 'text-3xl md:text-5xl font-bold mb-6',
            text: ['O cliente quer', ' ', span('text-sky-400', 'gelada'), ' ', 'e quer', ' ', span('text-orange-500', 'agora'), '. Você está pronto?'],
          }),
          h('p', {
            className: 'text-xl text-zinc-400',
            text: 'Na distribuidora, quem entrega primeiro ganha a fidelidade. Mas se você perde tempo no telefone ou paga 25% de taxa pro iFood, sua margem morre no gelo. O Mostralo organiza sua logística e protege seu faturamento.',
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-8 max-w-6xl mx-auto',
          items: solutions,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-sky-500/50 transition-all duration-300 group', [
            h('CardContent', 'p-8', [
              h('div', 'w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300', [
                itemIcon('w-8 h-8 text-sky-400'),
              ]),
              f('h3', 'text-xl font-bold text-zinc-100 mb-4', 'title'),
              f('p', 'text-zinc-400', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // Benefícios
    h('section', 'py-24', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-4xl mx-auto text-center mb-16', [
          h('h2', { className: 'text-3xl md:text-5xl font-bold mb-6', text: ['Inteligência de Vendas:', ' ', span(ORANGE_SKY, 'O seu Vendedor 24h')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-8 max-w-6xl mx-auto',
          items: benefits,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 group overflow-hidden', [
            h('CardContent', 'p-8 relative', [
              h('div', 'absolute top-4 right-4 text-right', [f('div', 'text-3xl font-bold text-sky-400', 'stat'), f('div', 'text-xs text-zinc-500', 'statLabel')]),
              h('div', 'w-14 h-14 rounded-xl bg-orange-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300', [
                itemIcon('w-7 h-7 text-orange-500'),
              ]),
              f('h3', 'text-xl font-bold text-zinc-100 mb-4', 'title'),
              f('p', 'text-zinc-400 text-sm', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // QR Code no balcão
    h('section', 'py-24 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-4xl mx-auto text-center mb-16', [
          h('h2', {
            className: 'text-3xl md:text-5xl font-bold mb-6',
            text: [span('text-sky-400', 'QR Code'), ' no balcão:', ' ', span('text-orange-500', 'pega e leva'), ' sem esperar'],
          }),
          h('p', {
            className: 'text-xl text-zinc-400',
            text: 'Para quem só quer chegar, pegar o pack e sair, o QR Code agiliza tudo. O cliente escaneia, escolhe os produtos, paga no Pix online ou no balcão e só retira. Menos fila, mais rotatividade.',
          }),
        ]),
        h('div', 'max-w-5xl mx-auto', [
          grid({
            className: 'grid md:grid-cols-3 gap-6 mb-8',
            items: channels,
            card: h('div', { key: 'card' }, [
              h('div', { key: 'iconWrap' }, [itemIcon(undefined, { key: 'icon' })]),
              f('h3', 'font-bold text-lg mb-1', 'title'),
              f('p', 'text-zinc-400 text-sm', 'subtitle'),
            ]),
          }),
          h('div', 'flex justify-center mb-8', [layer('w-1 h-12 bg-gradient-to-b from-sky-500/50 to-orange-500/50 rounded-full')]),
          h('div', 'p-8 rounded-2xl bg-gradient-to-br from-sky-500/10 to-orange-500/10 border border-sky-500/20 text-center', [
            h('div', 'w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-sky-500/30 to-orange-500/30 flex items-center justify-center mb-4', [
              icon(BarChart3, 'w-10 h-10 text-sky-400'),
            ]),
            h('h3', { className: 'text-2xl font-bold mb-2', text: 'CONTROLE TOTAL' }),
            h('p', { className: 'text-zinc-400', text: 'Entregadores + Caixa + Relatórios' }),
          ]),
        ]),
      ]),
    ]),

    savings(),

    // Depoimentos
    h('section', 'py-24 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-4xl mx-auto text-center mb-16', [
          h('h2', { className: 'text-3xl md:text-5xl font-bold mb-6', text: ['Distribuidoras que já', ' ', span(SKY_ORANGE, 'dominam a região')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-8 max-w-6xl mx-auto',
          items: testimonials,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-sky-500/30 transition-all duration-300', [
            h('CardContent', 'p-8', [
              h('div', 'flex gap-1 mb-4', [icon(Star, 'w-5 h-5 fill-orange-500 text-orange-500', { repeat: 5 })]),
              f('p', 'text-zinc-300 mb-6 italic', 'text', { quote: true }),
              h('div', [f('div', 'font-semibold text-zinc-100', 'name'), f('div', 'text-sm text-zinc-500', 'business')]),
            ]),
          ]),
        }),
      ]),
    ]),

    plans('Essencial'),

    // FAQ
    h('section', 'py-24 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto', [
          h('h2', { className: 'text-3xl md:text-4xl font-bold text-center mb-12', text: 'Perguntas Frequentes' }),
          faq({
            variant: 'accordion',
            className: 'space-y-4',
            itemClassName: 'bg-zinc-900 border border-zinc-800 rounded-xl px-6 overflow-hidden',
            triggerClassName: 'text-left text-zinc-100 hover:text-sky-400 py-6',
            contentClassName: 'text-zinc-400 pb-6',
            items: faqs,
          }),
        ]),
      ]),
    ]),

    // Rodapé
    h('footer', 'py-12 border-t border-zinc-800', [
      h('div', 'container mx-auto px-4', [
        h('div', 'text-center', [
          h('div', 'flex items-center justify-center gap-2 mb-4', [
            icon(Beer, 'w-6 h-6 text-sky-400'),
            h('span', { className: `text-xl font-bold ${ORANGE_SKY}`, text: 'Mostralo.com.br' }),
          ]),
          h('p', { className: 'text-zinc-500 mb-6', text: 'Sua marca. Sua logística. Seu lucro.' }),
          links({ className: 'flex flex-wrap justify-center gap-6 text-sm text-zinc-500', linkClassName: 'hover:text-sky-400 transition-colors', items: FOOTER_LINKS }),
        ]),
      ]),
    ]),

    whatsapp(),
  ],
};
