import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Calculator,
  Calendar,
  Camera,
  CheckCircle,
  Clock,
  CreditCard,
  Image,
  MessageSquare,
  ShoppingBag,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import { badge, cta, f, grid, h, icon, layer, plans, span, strong, trust, whatsapp } from '@/components/nicho/build';
import {
  agendaFooter,
  agendaHeader,
  faqSection,
  pillarCls,
  pillarsSection,
  problemIconWrap,
  problemsSection,
  sectionBadge,
  simulatorSection,
  subscriptionClubSection,
  type AgendaAccent,
} from '@/components/nicho/presets/agendamento';
import { NailBookingDemo } from '@/components/nicho/custom/NailBookingDemo';
import type { NicheContent } from '@/components/nicho/types';

const ROSE: AgendaAccent = {
  hoverBorder: 'hover:border-rose-500/50',
  text500: 'text-rose-500',
  text400: 'text-rose-400',
  badge: 'mb-4 bg-rose-500/20 text-rose-400 border-rose-500/30',
};
const GRADIENT = 'bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 bg-clip-text text-transparent';

// ---- Textos ----
const problems = [
  {
    icon: XCircle,
    title: 'Faltas Inesperadas',
    description: 'Cliente que marca e não aparece tira o seu pão de cada dia. Procedimento de 2-3h perdido que você não consegue preencher.',
    cls: problemIconWrap('text-red-500'),
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Infinito',
    description: 'Passar o dia respondendo "qual seu horário disponível?" e "quanto custa o alongamento?". Tempo que poderia ser na mesa.',
    cls: problemIconWrap('text-amber-500'),
  },
  {
    icon: Calculator,
    title: 'Confusão Financeira',
    description: 'Não saber quanto lucrou de verdade após pagar materiais, géis, acessórios e comissões. Dinheiro que escoa sem controle.',
    cls: problemIconWrap('text-yellow-500'),
  },
  {
    icon: Clock,
    title: 'Esquecimento de Manutenção',
    description: 'Clientes que passam do tempo da manutenção e acabam danificando as unhas. Você perde a cliente e a reputação do seu trabalho.',
    cls: problemIconWrap('text-rose-500'),
  },
];

const pillars = [
  {
    icon: CreditCard,
    title: 'Agendamento com Cobrança PIX',
    subtitle: 'Menos "Bolos"',
    features: ['Cobrança PIX no WhatsApp ao confirmar o horário', 'Cliente recebe sua chave PIX na conversa', 'Prazo de cancelamento que você escolhe', 'Link para a cliente remarcar'],
    cls: pillarCls('from-orange-500 to-rose-500', 'bg-orange-500/10'),
  },
  {
    icon: Bell,
    title: 'Lembretes no WhatsApp',
    subtitle: 'Automação que Funciona',
    features: ['Confirmação automática ao agendar', 'Lembrete antes do horário', 'Pedido de avaliação depois do atendimento', 'Campanhas no WhatsApp para suas clientes'],
    cls: pillarCls('from-rose-500 to-pink-500', 'bg-rose-500/10'),
  },
  {
    icon: ShoppingBag,
    title: 'Vitrine de Produtos (Shop)',
    subtitle: 'Venda Sem Esforço',
    features: ['Loja online de óleos, cremes e acessórios', 'Controle seu estoque de esmaltes e géis', 'Link da loja junto com o da agenda', 'Aumente seu ticket médio'],
    cls: pillarCls('from-pink-500 to-purple-500', 'bg-pink-500/10'),
  },
  {
    icon: Calculator,
    title: 'Gestão de Comissões',
    subtitle: 'Erro Zero, Paz Total',
    features: ['Cálculo automático por profissional', 'Serviços + produtos separados', 'Relatórios prontos em segundos', 'Perfeito para espaços compartilhados'],
    cls: pillarCls('from-purple-500 to-violet-500', 'bg-purple-500/10'),
  },
];

const clubCards = [
  {
    icon: CreditCard,
    title: 'Crie Seus Planos',
    subtitle: 'Personalização Total',
    features: ['Planos como "Manutenção Mensal" ou "VIP Nail Art"', 'Defina serviços inclusos no plano', 'Limite de uso: ilimitado ou X vezes por mês', 'Ciclos: mensal, trimestral ou anual'],
  },
  {
    icon: Users,
    title: 'Dashboard Completo',
    subtitle: 'Gestão de Assinantes',
    features: ['Veja todas as assinantes em um só lugar', 'Controle de período e vencimento', 'Status: ativo, pausado, cancelado', 'Histórico completo de uso por cliente'],
  },
  {
    icon: Calendar,
    title: 'Agenda Reconhece o Plano',
    subtitle: 'Integração Automática',
    features: ['Sistema identifica assinante ao agendar', 'Serviços aparecem como "Incluso no Plano"', 'Registro automático de uso', 'Manutenção já incluída no plano'],
  },
  {
    icon: TrendingUp,
    title: 'Previsibilidade Financeira',
    subtitle: 'Receita Recorrente',
    features: ['Saiba quanto vai faturar antes do mês começar', 'Cliente fidelizada por contrato mensal', 'Controle dos pagamentos de cada assinante', 'Histórico completo de pagamentos'],
  },
];

const portfolio = [
  { emoji: '💅', style: 'Francesinha Moderna' },
  { emoji: '✨', style: 'Glitter Degradê' },
  { emoji: '🌸', style: 'Nail Art Floral' },
  { emoji: '💎', style: 'Pedrarias Luxo' },
  { emoji: '🌈', style: 'Ombré Colorido' },
  { emoji: '🖤', style: 'Minimalista Chic' },
];

const comparison = [
  { feature: 'Faltas por semana', manual: '3 a 5 "bolos"', mostralo: 'Menos (confirmação, lembrete e PIX)' },
  { feature: 'Tempo no WhatsApp', manual: '2+ horas/dia', mostralo: 'Bem menos (cliente agenda sozinha)' },
  { feature: 'Cálculo de comissões', manual: '3+ horas/semana', mostralo: '1 clique' },
  { feature: 'Manutenções esquecidas', manual: 'Clientes perdidas', mostralo: 'Plano mensal com manutenção' },
  { feature: 'Venda de produtos', manual: 'Só no balcão', mostralo: 'Integrado ao agendamento' },
  { feature: 'Portfólio', manual: 'Só Instagram', mostralo: 'Direto no agendamento' },
];

const testimonials = [
  {
    name: 'Amanda Oliveira',
    role: 'Studio Nails Luxo - São Paulo',
    image: '💅',
    text: 'Antes eu perdia 4-5 clientes por semana com no-show. Depois do Mostralo, com o sinal PIX, isso caiu pra quase zero. Só isso já me economiza R$ 800/mês em procedimentos perdidos.',
    rating: 5,
  },
  {
    name: 'Fernanda Costa',
    role: 'Espaço Belle Nails - RJ',
    image: '✨',
    text: 'O lembrete de manutenção é um sonho! Minhas clientes voltam no tempo certo e não deixam as unhas danificar. Minha taxa de retorno aumentou 40%.',
    rating: 5,
  },
  {
    name: 'Patricia Santos',
    role: 'Art Nail Studio - MG',
    image: '💎',
    text: 'Tenho 3 profissionais no espaço. O cálculo de comissão era meu pesadelo. Agora em 1 clique tenho tudo pronto. E ainda vendo óleos e cremes junto com o agendamento!',
    rating: 5,
  },
];

const faqs = [
  {
    q: 'Como funciona a cobrança PIX?',
    a: 'Com o WhatsApp do estúdio conectado, ao confirmar o agendamento a cliente recebe na conversa a cobrança PIX com a sua chave e o valor do serviço. A conferência do pagamento e a regra de sinal ou falta ficam com você.',
  },
  {
    q: 'A cliente pode ver meu portfólio no agendamento?',
    a: 'Sim! Você cadastra as fotos dos seus trabalhos e elas aparecem diretamente na página de agendamento. A cliente escolhe o serviço já vendo seus resultados.',
  },
  {
    q: 'Consigo controlar estoque de esmaltes e géis?',
    a: 'Sim! Você cadastra seus produtos, controla o estoque e ainda vende óleos e cremes na sua loja online.',
  },
  {
    q: 'Posso usar em mais de uma profissional?',
    a: 'Sim! Se você tem outras manicures no espaço, cada uma tem sua agenda individual e o sistema calcula a comissão automaticamente.',
  },
  {
    q: 'O lembrete de manutenção é automático?',
    a: 'O automático é o lembrete do horário marcado (confirmação e aviso antes). Para trazer a cliente de volta na manutenção, use o Clube de Assinaturas com a manutenção no plano ou uma campanha de WhatsApp: você escolhe quem recebe e dispara em poucos cliques.',
  },
  {
    q: 'Posso testar antes de pagar?',
    a: 'Sim! Oferecemos 7 dias grátis em todos os planos para você testar todas as funcionalidades sem compromisso e sem precisar colocar cartão de crédito.',
  },
  {
    q: 'Como funciona o Clube de Assinaturas?',
    a: 'Você cria planos como "Manutenção Mensal Garantida" ou "Plano Esmaltação em Gel". A cliente paga mensalmente e pode agendar conforme o plano permitir. O sistema reconhece automaticamente a assinante e marca o serviço como incluso.',
  },
];

// ---- Página ----
export const nailDesigners: NicheContent = {
  path: '/nicho-nail-designers',
  seo: {
    title: 'Sistema para Nail Designers | Agendamento + PIX + WhatsApp | Mostralo',
    description: 'Sistema completo para Nail Designers, Manicures e Esmalterias: agendamento online com cobrança PIX no WhatsApp, confirmação e lembrete automáticos, gestão de comissões e venda de produtos. Teste grátis por 7 dias.',
    keywords: 'sistema nail designer, agenda manicure, software esmalteria, gestão unhas, agendamento nail art, controle comissões manicure, sistema agendamento unhas',
    image: 'https://mostralo.com.br/og-nail-designers.png',
  },
  pageClassName: 'min-h-screen bg-zinc-950',
  sections: [
    // Hero
    h('section', 'relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-zinc-950', [
      layer('absolute inset-0 bg-gradient-to-br from-rose-950/30 via-zinc-950 to-zinc-950'),
      layer('absolute top-20 left-10 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl'),
      layer('absolute bottom-20 right-10 w-96 h-96 bg-orange-600/5 rounded-full blur-3xl'),
      layer('absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-3xl'),
      h('div', 'container mx-auto px-4 py-20 relative z-10', [
        h('div', 'max-w-4xl mx-auto text-center', [
          badge({
            as: 'Badge',
            className: 'mb-6 bg-rose-500/20 text-rose-400 border-rose-500/30 px-4 py-2 text-sm',
            icon: Sparkles,
            iconClassName: 'w-4 h-4 mr-2',
            text: 'Sistema Completo para Nail Designers',
          }),
          h('h1', {
            className: 'text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight',
            text: ['Sua agenda lotada.', ' ', span(GRADIENT, 'Seu estúdio organizado.'), ' ', 'Seu lucro protegido.'],
          }),
          h('p', {
            className: 'text-xl md:text-2xl text-zinc-400 mb-8 max-w-3xl mx-auto',
            text: [
              'O ecossistema completo para Nail Designers que querem',
              ' ',
              strong('text-white', 'profissionalizar o agendamento'),
              ',',
              ' ',
              strong('text-white', 'eliminar as faltas'),
              ' e',
              ' ',
              strong('text-white', 'vender muito mais serviços e produtos'),
              ' sem esforço manual.',
            ],
          }),
          h('p', { className: 'text-lg text-rose-400 mb-10', text: 'Acabe com os "bolos" e tenha clientes que voltam sempre.' }),
          h('div', 'flex flex-col sm:flex-row gap-4 justify-center items-center mb-12', [
            cta({
              label: 'QUERO PROFISSIONALIZAR MEU ESTÚDIO',
              className: 'bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 transition-all duration-300 animate-pulse',
              iconLeft: { icon: Sparkles, className: 'w-5 h-5 mr-2' },
              iconRight: { icon: ArrowRight, className: 'w-5 h-5 ml-2' },
            }),
          ]),
          trust({
            className: 'flex flex-wrap justify-center gap-6 text-zinc-500',
            itemClassName: 'flex items-center gap-2',
            iconClassName: 'w-5 h-5 text-rose-500',
            items: [
              { icon: Calendar, text: 'Agenda 24h' },
              { icon: CreditCard, text: 'Cobrança PIX' },
              { icon: Bell, text: 'Lembretes WhatsApp' },
              { icon: Camera, text: 'Portfólio Integrado' },
            ],
          }),
        ]),
      ]),
      layer('absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent'),
    ]),

    problemsSection(ROSE, {
      badge: sectionBadge('mb-4 bg-red-500/20 text-red-400 border-red-500/30', AlertTriangle, 'O Problema'),
      title: ['Cansada de perder tempo no WhatsApp e', ' ', span('text-red-500', 'sofrer com "vácuos" e faltas?')],
      text: ['Valorize seu tempo, ', span('text-rose-400', 'ele é seu maior ativo.')],
      items: problems,
    }),

    pillarsSection(ROSE, {
      badge: sectionBadge(ROSE.badge, CheckCircle, 'O Método Mostralo para Nail Designers'),
      title: ['Os 4 Pilares do', ' ', span(GRADIENT, 'Estúdio Lucrativo')],
      text: 'Recursos integrados que trabalham juntos para maximizar seu faturamento.',
      items: pillars,
    }),

    subscriptionClubSection({
      title: ['Clientes que voltam', ' ', span('bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent', 'todo mês, garantido')],
      text: ['Crie planos como ', strong('text-white', '"Manutenção Mensal Garantida"'), ' ou', ' ', strong('text-white', '"Plano Esmaltação em Gel"'), ' e tenha receita recorrente.'],
      cards: clubCards,
      example: { title: 'Plano Manutenção Mensal', description: '1 manutenção garantida por mês', price: '199', note: 'Manutenção garantida no plano!' },
    }),

    // Portfólio integrado
    h('section', 'py-20 bg-zinc-950', [
      h('div', 'container mx-auto px-4', [
        agendaHeader({
          className: 'max-w-4xl mx-auto text-center mb-12',
          badge: sectionBadge('mb-4 bg-pink-500/20 text-pink-400 border-pink-500/30', Camera, 'Portfólio Integrado'),
          title: ['Suas unhas são sua ', span('text-rose-500', 'vitrine')],
          titleClassName: 'text-3xl md:text-4xl font-bold text-white mb-4',
          text: 'Mostre seu trabalho diretamente no agendamento. Cliente vê suas artes e já marca o horário.',
          textClassName: 'text-zinc-400',
        }),
        h('div', 'max-w-4xl mx-auto', [
          h('Card', 'bg-zinc-900 border-zinc-800 overflow-hidden', [
            h('CardHeader', 'border-b border-zinc-800', [
              h('div', 'flex items-center gap-3', [
                h('div', 'w-10 h-10 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center', [icon(Sparkles, 'w-5 h-5 text-white')]),
                h('div', [
                  h('CardTitle', { className: 'text-white text-lg', text: 'Studio Nail Art' }),
                  h('p', { className: 'text-zinc-500 text-sm', text: '@studionailart • Portfólio' }),
                ]),
              ]),
            ]),
            h('CardContent', 'p-4', [
              grid({
                className: 'grid grid-cols-3 gap-2',
                items: portfolio,
                card: h(
                  'div',
                  'aspect-square bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-pointer border border-zinc-700 hover:border-rose-500/50',
                  [f('span', 'text-4xl mb-2', 'emoji'), f('span', 'text-zinc-400 text-xs text-center px-2', 'style')],
                ),
              }),
              h('div', 'mt-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg', [
                h('p', { className: 'text-rose-400 text-sm text-center flex items-center justify-center gap-2' }, [
                  icon(Image, 'w-4 h-4'),
                  { t: 'text', text: 'As fotos do seu trabalho aparecerão aqui para as clientes escolherem' },
                ]),
              ]),
            ]),
          ]),
        ]),
      ]),
    ]),

    simulatorSection(ROSE, { className: 'py-20 bg-zinc-900', title: ['Experimente ', span('text-rose-500', 'Como a Cliente Vê')], demo: NailBookingDemo }),

    // Prova social e ROI
    h('section', 'py-20 bg-zinc-950', [
      h('div', 'container mx-auto px-4', [
        h('div', 'max-w-4xl mx-auto text-center mb-12', [
          sectionBadge('mb-4 bg-green-500/20 text-green-400 border-green-500/30', TrendingUp, 'Antes e Depois'),
          h('h2', { className: 'text-3xl md:text-4xl font-bold text-white mb-6', text: ['O ', span('text-rose-500', 'Retorno do Investimento')] }),
          h('Card', 'bg-gradient-to-r from-rose-500/10 to-pink-500/10 border-rose-500/30 mb-12', [
            h('CardContent', 'p-6', [
              h('p', {
                className: 'text-xl md:text-2xl text-white italic',
                text: [
                  '"Transforme seu talento em uma empresa de alta performance. Tenha a tecnologia das grandes esmalterias por um preço que',
                  ' ',
                  span('text-rose-500 font-bold', 'cabe no seu faturamento'),
                  '."',
                ],
              }),
            ]),
          ]),
        ]),
        h('div', 'max-w-4xl mx-auto', [
          h('Card', 'bg-zinc-900 border-zinc-800 overflow-hidden', [
            h('div', 'grid grid-cols-3 bg-zinc-800 border-b border-zinc-700', [
              h('div', { className: 'p-4 text-center font-semibold text-zinc-400', text: 'Aspecto' }),
              h('div', { className: 'p-4 text-center font-semibold text-red-400 border-x border-zinc-700', text: 'Agenda de Papel/WhatsApp' }),
              h('div', { className: 'p-4 text-center font-semibold text-green-400', text: 'Experiência Mostralo' }),
            ]),
            grid({
              items: comparison,
              card: h('div', 'grid grid-cols-3 border-b border-zinc-800 last:border-0', [
                f('div', 'p-4 text-white font-medium', 'feature'),
                f('div', 'p-4 text-center text-red-400 border-x border-zinc-800 bg-red-500/5', 'manual'),
                f('div', 'p-4 text-center text-green-400 bg-green-500/5', 'mostralo'),
              ]),
            }),
          ]),
        ]),
      ]),
    ]),

    // Depoimentos
    h('section', 'py-20 bg-zinc-900', [
      h('div', 'container mx-auto px-4', [
        agendaHeader({
          className: 'max-w-4xl mx-auto text-center mb-12',
          badge: sectionBadge(ROSE.badge, Star, 'Depoimentos'),
          title: ['O Que ', span('text-rose-500', 'Nail Designers de Sucesso'), ' Dizem'],
          titleClassName: 'text-3xl md:text-4xl font-bold text-white mb-4',
        }),
        grid({
          className: 'grid md:grid-cols-3 gap-6 max-w-5xl mx-auto',
          items: testimonials,
          card: h('Card', 'bg-zinc-950 border-zinc-800 hover:border-rose-500/50 transition-all', [
            h('CardContent', 'p-6', [
              h('div', 'flex items-center gap-3 mb-4', [
                f('div', 'text-4xl', 'image'),
                h('div', [f('p', 'text-white font-semibold', 'name'), f('p', 'text-zinc-500 text-sm', 'role')]),
              ]),
              h('div', 'flex gap-1 mb-4', [icon(Star, 'w-4 h-4 fill-rose-500 text-rose-500', { repeat: 'rating' })]),
              f('p', 'text-zinc-300 italic', 'text', { quote: true }),
            ]),
          ]),
        }),
      ]),
    ]),

    plans('Agenda', true),

    faqSection(ROSE, { className: 'py-20 bg-zinc-900', cardBg: 'bg-zinc-950', items: faqs }),

    agendaFooter({ iconClassName: 'w-8 h-8 text-rose-500', linkClassName: 'hover:text-rose-500 transition-colors', tagline: 'Sua arte. Sua gestão. Seu lucro. 💅' }),

    whatsapp(),
  ],
};
