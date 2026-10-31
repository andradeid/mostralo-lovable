import { BadgeCheck, BarChart3, Beef, DollarSign, Flame, MessageSquare, Monitor, Printer, QrCode, Star, Truck, Zap } from 'lucide-react';
import { badge, cta, f, faq, FOOTER_LINKS, grid, h, icon, itemIcon, layer, links, plans, savings, span, trust, whatsapp } from '@/components/nicho/build';
import type { NicheContent } from '@/components/nicho/types';

const GRADIENT = 'bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent';

// ---- Textos ----
const solutions = [
  {
    icon: Beef,
    title: 'Montador de Jantinha Inteligente',
    description: 'O cliente escolhe o espetinho, o ponto da carne e os acompanhamentos (arroz, tropeiro, mandioca, vinagrete) de forma visual e sem erros.',
  },
  {
    icon: Monitor,
    title: 'KDS (Monitor de Cozinha/Chapa)',
    description: 'Organize a sequência dos espetos por tempo de preparo. Sua equipe foca na brasa e o sistema avisa quando o pedido está pronto para sair.',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Marketing Automático',
    description: "'Sextou com Jantinha!' O Mostralo envia o cardápio automaticamente para quem já comprou com você, garantindo que sua churrasqueira não pare de trabalhar.",
  },
];

const features = [
  {
    icon: DollarSign,
    title: 'O Fim das Taxas',
    description: 'Economize mais de R$ 2.500,00 por mês em comissões. Esse dinheiro paga seu carvão, sua carne e ainda sobra para investir no negócio.',
    stat: 'R$ 2.500+',
    statLabel: 'economia/mês',
  },
  {
    icon: Printer,
    title: 'Impressão Automática',
    description: "O pedido cai no sistema e já sai impresso na cozinha com todos os detalhes (ex: 'Sem vinagrete'). Menos desperdício e mais agilidade.",
    stat: '0',
    statLabel: 'erros',
  },
  {
    icon: BarChart3,
    title: 'Financeiro Integrado',
    description: 'Saiba exatamente quantos espetinhos vendeu na noite e qual o seu lucro real, sem precisar de planilhas complexas.',
    stat: '100%',
    statLabel: 'controle',
  },
];

const flow = [
  { icon: QrCode, title: 'QR CODE', subtitle: 'Cliente faz o pedido', cls: { iconWrap: 'w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-3' } },
  { icon: Flame, title: 'KDS', subtitle: 'Cozinha organizada', cls: { iconWrap: 'w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mx-auto mb-3' } },
  { icon: Truck, title: 'ENTREGA', subtitle: 'ou Retirada rápida', cls: { iconWrap: 'w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center mx-auto mb-3' } },
];

const testimonials = [
  { text: 'O montador de jantinha zerou os erros de acompanhamentos. O cliente escolhe tudo sozinho.', author: 'João', business: 'Churrasquinho do João - SP', rating: 5 },
  { text: 'Sexta-feira o WhatsApp automático lota minha churrasqueira. Melhor investimento que fiz.', author: 'Dona Maria', business: 'Jantinha da Maria - MG', rating: 5 },
  { text: 'Saí do iFood e economizo R$ 3.500/mês. Minha margem voltou a fazer sentido.', author: 'Carlos', business: 'Espetinhos Premium - RJ', rating: 5 },
];

const faqs = [
  {
    q: 'Como funciona o montador de jantinha?',
    a: 'O cliente entra no seu cardápio digital, escolhe o tipo de espetinho (bovino, suíno, frango, coração), seleciona o ponto da carne (mal passado, ao ponto, bem passado) e adiciona os acompanhamentos (arroz, feijão tropeiro, mandioca, vinagrete). O pedido chega completo e detalhado na cozinha, sem erros de anotação.',
  },
  {
    q: 'O WhatsApp Marketing funciona mesmo no horário de pico?',
    a: "Sim! As campanhas são programadas com antecedência. Por exemplo: toda sexta-feira às 16h, o sistema dispara automaticamente 'Sextou com Jantinha! 🔥 Confira nosso cardápio e peça agora.' para todos os clientes que já compraram com você. Quando o pico chegar, os pedidos já estão entrando.",
  },
  {
    q: 'E se o cliente quiser mudar algo no pedido?',
    a: "Todas as observações são aceitas no sistema. O cliente pode escrever 'sem cebola', 'molho à parte', 'espeto ao ponto mas não muito'. Tudo isso aparece impresso na comanda da cozinha, eliminando erros humanos.",
  },
];

// ---- Página ----
export const churrasquinhos: NicheContent = {
  path: '/nicho-churrasquinhos',
  seo: {
    title: 'Sistema para Churrasquinhos e Jantinhas | Mostralo',
    description: 'Sistema completo para churrasquinhos, jantinhas e espetinhos. Montador de pedidos inteligente, KDS para cozinha, WhatsApp Marketing e taxa zero. Teste grátis!',
    keywords: 'sistema churrasquinho, cardápio digital espetinho, jantinha delivery, sistema para espetaria, montador de jantinha, KDS churrasqueira',
  },
  pageClassName: 'min-h-screen bg-zinc-950 text-white',
  sections: [
    // Hero
    h('section', 'relative py-16 md:py-24 overflow-hidden', [
      layer('absolute inset-0 bg-gradient-to-br from-orange-950/30 via-zinc-950 to-yellow-950/20'),
      layer('absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl'),
      layer('absolute bottom-20 right-10 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl'),
      h('div', 'container mx-auto px-4 relative z-10', [
        h('div', 'max-w-4xl mx-auto text-center', [
          badge({
            className: 'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm font-medium mb-6',
            icon: Flame,
            iconClassName: 'w-4 h-4 animate-pulse',
            text: 'Para Churrasquinhos, Jantinhas e Espetinhos',
          }),
          h('h1', { className: 'text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight', text: ['Chega de perder pedidos no WhatsApp', ' ', span(GRADIENT, 'enquanto a brasa queima.')] }),
          h('p', {
            className: 'text-lg md:text-xl text-zinc-400 mb-8 max-w-3xl mx-auto',
            text: 'O Mostralo é o ecossistema All-in-One que organiza sua jantinha: do montador de espetinhos à gestão de entregas. Saia do caos, elimine as taxas do iFood e lucre 100% sobre cada venda.',
          }),
          cta({
            label: 'QUERO PROFISSIONALIZAR MEU CHURRASQUINHO',
            className: 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_50px_rgba(249,115,22,0.6)] transition-all duration-300',
            iconLeft: { icon: Flame, className: 'w-5 h-5 mr-2' },
          }),
          trust({
            className: 'flex flex-wrap justify-center gap-4 md:gap-8 mt-10',
            itemClassName: 'flex items-center gap-2 text-zinc-400 text-sm',
            iconClassName: 'w-4 h-4 text-orange-400',
            items: [
              { icon: BadgeCheck, text: 'Taxa 0%' },
              { icon: Beef, text: 'Montador de Jantinha' },
              { icon: Monitor, text: 'KDS Integrado' },
              { icon: Zap, text: 'WhatsApp Automático' },
            ],
          }),
        ]),
      ]),
    ]),

    // Problema
    h('section', 'py-16 md:py-20 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-4xl mx-auto text-center mb-12', [
          h('h2', { className: 'text-2xl md:text-4xl font-bold mb-4', text: ['Atender telefone, anotar pedido e cuidar da churrasqueira', ' ', span('text-orange-400', 'ao mesmo tempo?')] }),
          h('p', {
            className: 'text-zinc-400 text-lg',
            text: 'Se você ainda anota pedidos em papel ou se perde nos áudios do WhatsApp, sua operação está lenta e seus clientes estão esperando demais. Além disso, pagar 25% de taxa para o iFood em uma jantinha é entregar o seu lucro de bandeja.',
          }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6 max-w-5xl mx-auto',
          items: solutions,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 group', [
            h('CardContent', 'p-6', [
              h('div', 'w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center mb-4 group-hover:from-orange-500/30 group-hover:to-yellow-500/30 transition-all', [
                itemIcon('w-6 h-6 text-orange-400'),
              ]),
              f('h3', 'text-xl font-bold text-white mb-3', 'title'),
              f('p', 'text-zinc-400 text-sm leading-relaxed', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // Recursos
    h('section', 'py-16 md:py-20', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-4xl mx-auto text-center mb-12', [
          h('h2', { className: 'text-2xl md:text-4xl font-bold mb-4', text: ['Tecnologia de Grande,', ' ', span(GRADIENT, 'Preço de Pequeno')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6 max-w-5xl mx-auto',
          items: features,
          card: h('Card', 'bg-zinc-900/50 border-zinc-800 hover:border-orange-500/50 transition-all duration-300 group overflow-hidden', [
            h('CardContent', 'p-6 relative', [
              h('div', 'absolute top-4 right-4 text-right', [
                f('span', 'text-2xl font-bold bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent', 'stat'),
                f('p', 'text-xs text-zinc-500', 'statLabel'),
              ]),
              h('div', 'w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center mb-4', [itemIcon('w-6 h-6 text-orange-400')]),
              f('h3', 'text-xl font-bold text-white mb-3', 'title'),
              f('p', 'text-zinc-400 text-sm leading-relaxed', 'description'),
            ]),
          ]),
        }),
      ]),
    ]),

    // QR Code no balcão
    h('section', 'py-16 md:py-20 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-4xl mx-auto text-center mb-12', [
          h('h2', { className: 'text-2xl md:text-4xl font-bold mb-4', text: ['Balcão lotado?', ' ', span('text-orange-400', 'QR Code resolve.')] }),
          h('p', {
            className: 'text-zinc-400 text-lg',
            text: 'O cliente no balcão pode escanear o QR Code da mesa ou do cardápio e fazer o pedido sozinho, sem precisar esperar na fila. O pedido cai direto no KDS da cozinha.',
          }),
        ]),
        grid({
          className: 'flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 max-w-4xl mx-auto',
          itemWrapClassName: 'flex items-center gap-4',
          items: flow,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all w-40 md:w-48', [
            h('CardContent', 'p-6 text-center', [
              h('div', { key: 'iconWrap' }, [itemIcon('w-7 h-7 text-white')]),
              f('h3', 'font-bold text-white text-sm', 'title'),
              f('p', 'text-zinc-500 text-xs mt-1', 'subtitle'),
            ]),
          ]),
          connector: h('div', { className: 'hidden md:block text-orange-400 text-2xl', text: '→' }),
        }),
        h('p', { className: 'text-center text-zinc-500 text-sm mt-8', text: 'Autoatendimento que funciona no balcão e no delivery' }),
      ]),
    ]),

    savings(),

    // Depoimentos
    h('section', 'py-16 md:py-20 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-4xl mx-auto text-center mb-12', [
          h('h2', { className: 'text-2xl md:text-4xl font-bold mb-4', text: ['Jantinhas que já', ' ', span('text-orange-400', 'faturam mais')] }),
        ]),
        grid({
          className: 'grid md:grid-cols-3 gap-6 max-w-5xl mx-auto',
          items: testimonials,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-orange-500/30 transition-all', [
            h('CardContent', 'p-6', [
              h('div', 'flex gap-1 mb-4', [icon(Star, 'w-4 h-4 fill-yellow-400 text-yellow-400', { repeat: 'rating' })]),
              f('p', 'text-zinc-300 italic mb-4', 'text', { quote: true }),
              h('div', [f('p', 'font-semibold text-white', 'author'), f('p', 'text-sm text-zinc-500', 'business')]),
            ]),
          ]),
        }),
      ]),
    ]),

    plans('Essencial'),

    // FAQ
    h('section', 'py-16 md:py-20 bg-zinc-900/50', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-3xl mx-auto', [
          h('h2', { className: 'text-2xl md:text-3xl font-bold text-center mb-8', text: ['Perguntas ', span('text-orange-400', 'Frequentes')] }),
          faq({
            variant: 'accordion',
            className: 'space-y-4',
            itemClassName: 'bg-zinc-900 border border-zinc-800 rounded-xl px-6 data-[state=open]:border-orange-500/50',
            triggerClassName: 'text-left text-white hover:text-orange-400 hover:no-underline py-4',
            contentClassName: 'text-zinc-400 pb-4',
            items: faqs,
          }),
        ]),
      ]),
    ]),

    // Rodapé
    h('footer', 'py-8 border-t border-zinc-800', [
      h('div', 'container mx-auto px-4', [
        h('div', 'flex flex-col md:flex-row items-center justify-between gap-4', [
          h('p', { className: 'text-zinc-500 text-sm', text: [span('font-bold text-orange-400', 'Mostralo.com.br'), ' | Sua brasa, seu lucro, sua liberdade.'] }),
          links({ className: 'flex gap-6 text-sm text-zinc-500', linkClassName: 'hover:text-orange-400 transition-colors', items: FOOTER_LINKS }),
        ]),
      ]),
    ]),

    whatsapp(),
  ],
};
