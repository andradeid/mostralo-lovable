import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Calculator,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  Dog,
  MapPin,
  Package,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import { badge, cta, custom, f, grid, h, icon, itemIcon, layer, plans, span, strong, trust, whatsapp } from '@/components/nicho/build';
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
import { PetProfileSection } from '@/components/nicho/custom/PetProfileSection';
import { PetRecurrenceTimeline } from '@/components/nicho/custom/PetRecurrenceTimeline';
import { PetBookingDemo } from '@/components/nicho/custom/PetBookingDemo';
import type { NicheContent } from '@/components/nicho/types';

const ORANGE: AgendaAccent = {
  hoverBorder: 'hover:border-orange-500/50',
  text500: 'text-orange-500',
  text400: 'text-orange-400',
  badge: 'mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30',
};

// ---- Textos ----
const problems = [
  {
    icon: XCircle,
    title: 'Agenda Confusa',
    description: 'Telefone tocando para marcar banho enquanto você atende no balcão. Horários perdidos e confusão generalizada.',
    cls: problemIconWrap('text-red-500'),
  },
  {
    icon: ShoppingBag,
    title: 'Esquecimento da Ração',
    description: 'O cliente esquece de comprar a ração e acaba comprando no supermercado por conveniência. Você perde a venda!',
    cls: problemIconWrap('text-amber-500'),
  },
  {
    icon: Truck,
    title: 'Logística de Leva e Traz',
    description: 'Confusão para organizar as rotas de busca e entrega dos pets. Não sabe onde o motorista está.',
    cls: problemIconWrap('text-yellow-500'),
  },
  {
    icon: Clock,
    title: 'Faltas (No-show)',
    description: 'Horário de tosa vazio porque a cliente esqueceu de vir. Tempo do tosador desperdiçado.',
    cls: problemIconWrap('text-orange-500'),
  },
];

const pillars = [
  {
    icon: Calendar,
    title: 'Agendamento Online + Lembrete WhatsApp',
    subtitle: 'Menos Faltas, Mais Produtividade',
    features: ['Cliente marca o banho sozinho, 24h', 'Sistema envia lembrete 2h antes', 'Redução de 80% nas faltas', 'Agenda do tosador sempre cheia'],
    cls: pillarCls('from-orange-500 to-amber-500', 'bg-orange-500/10'),
  },
  {
    icon: Package,
    title: 'Inteligência de Recorrência (Ração)',
    subtitle: 'O Diferencial que Ninguém Tem',
    features: ['Sistema calcula consumo do saco', 'Lembrete 5 dias antes de acabar', 'Link de compra automático via WhatsApp', 'Venda garantida no piloto automático'],
    cls: pillarCls('from-amber-500 to-yellow-500', 'bg-amber-500/10'),
  },
  {
    icon: MapPin,
    title: 'Gestão de Leva e Traz (GPS)',
    subtitle: 'Rotas Organizadas, Cliente Tranquilo',
    features: ['Organize rotas de busca e entrega', 'Saiba onde o motorista está em tempo real', 'Avise o cliente quando o pet estiver chegando', 'Fim da confusão logística'],
    cls: pillarCls('from-green-500 to-emerald-500', 'bg-green-500/10'),
  },
  {
    icon: Calculator,
    title: 'Comissões de Banho/Tosa',
    subtitle: 'Erro Zero, Paz Total',
    features: ['Cálculo automático por tosador', 'Serviços adicionais separados', 'Relatórios prontos em segundos', 'Simples, rápido e sem erros'],
    cls: pillarCls('from-blue-500 to-cyan-500', 'bg-blue-500/10'),
  },
];

const clubCards = [
  {
    icon: CreditCard,
    title: 'Crie Seus Planos',
    subtitle: 'Personalização Total',
    features: ['Planos como "Banho Mensal" ou "Plano Pet VIP"', 'Defina serviços inclusos no plano', 'Limite: 1x, 2x ou banhos ilimitados por mês', 'Ciclos: mensal, trimestral ou anual'],
  },
  {
    icon: Users,
    title: 'Dashboard Completo',
    subtitle: 'Gestão de Assinantes',
    features: ['Veja todos os pets assinantes em um só lugar', 'Controle de período e vencimento', 'Status: ativo, pausado, cancelado', 'Histórico de banhos por pet'],
  },
  {
    icon: Calendar,
    title: 'Agenda Reconhece o Plano',
    subtitle: 'Integração Automática',
    features: ['Sistema identifica pet assinante ao agendar', 'Banho aparece como "Incluso no Plano"', 'Registro automático de uso', 'Pet sempre limpo e cheiroso!'],
  },
  {
    icon: TrendingUp,
    title: 'Previsibilidade Financeira',
    subtitle: 'Receita Recorrente',
    features: ['Saiba quanto vai faturar antes do mês começar', 'Tutor fidelizado por contrato mensal', 'PIX automático ou pagamento manual', 'Agenda do tosador sempre cheia'],
  },
];

const roiMetrics = [
  { icon: TrendingUp, value: '80%', label: 'Redução nas faltas', description: 'Com lembretes automáticos no WhatsApp', color: 'text-green-400' },
  { icon: Package, value: '25%', label: 'Aumento nas vendas de ração', description: 'Com antecipação inteligente', color: 'text-amber-400' },
  { icon: Calculator, value: '0', label: 'Erros de cobrança', description: 'Serviços adicionais calculados automaticamente', color: 'text-blue-400' },
].map((metric) => ({ ...metric, cls: { icon: `w-8 h-8 ${metric.color}`, value: `text-5xl font-bold ${metric.color} mb-2` } }));

const faqs = [
  {
    q: 'Como funciona o lembrete de ração?',
    a: 'O sistema calcula automaticamente o consumo baseado no tamanho do saco e no porte do pet. Quando faltar 5 dias para acabar, enviamos uma mensagem no WhatsApp do cliente com um link para comprar novamente. Você não perde mais venda para o supermercado!',
  },
  {
    q: 'Posso organizar as rotas de leva e traz?',
    a: 'Sim! No plano Profissional você tem acesso ao módulo de Leva e Traz com GPS. Organize as rotas do motorista, saiba onde ele está em tempo real e avise o cliente quando o pet estiver chegando em casa.',
  },
  {
    q: 'O sistema calcula comissão dos tosadores?',
    a: 'Sim! Você cadastra os tosadores e define a porcentagem de comissão. O sistema calcula automaticamente quanto cada um deve receber baseado nos serviços realizados. Fim dos erros de cálculo!',
  },
  {
    q: 'Consigo cadastrar histórico de vacinas?',
    a: 'Sim! No perfil do pet você cadastra todas as vacinas, datas de aplicação e próximas doses. O sistema também pode alertar sobre vacinas vencidas ou próximas de vencer.',
  },
  {
    q: 'E se o cliente tiver mais de um pet?',
    a: 'Sem problema! Cada cliente pode ter quantos pets quiser cadastrados. Cada pet tem seu próprio perfil com histórico, alergias, preferências e agendamentos independentes.',
  },
  {
    q: 'Posso testar antes de pagar?',
    a: 'Sim! Oferecemos 7 dias grátis em todos os planos para você testar todas as funcionalidades sem compromisso e sem precisar colocar cartão de crédito.',
  },
  {
    q: 'Como funciona o Clube de Assinaturas?',
    a: 'Você cria planos como "Banho Mensal" ou "Plano Pet VIP". O tutor paga mensalmente e pode agendar banhos conforme o plano permitir. O sistema reconhece automaticamente o pet assinante e marca o serviço como incluso. Pet sempre limpo, agenda do tosador sempre cheia!',
  },
];

// ---- Página ----
export const petShops: NicheContent = {
  path: '/nicho-pet-shop',
  seo: {
    title: 'Sistema para Pet Shop | Agendamento + Lembrete de Ração + Leva e Traz | Mostralo',
    description: 'Sistema completo para Pet Shops: agendamento de banho e tosa online, lembrete inteligente de ração, gestão de leva e traz com GPS e comissões automáticas. Teste grátis por 7 dias.',
    keywords: 'sistema pet shop, agendamento banho tosa, lembrete ração automático, gestão pet shop, software petshop, leva e traz pet, comissões tosador',
    image: 'https://mostralo.com.br/og-pet-shop.png',
  },
  pageClassName: 'min-h-screen bg-zinc-950',
  sections: [
    // Hero
    h('section', 'relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-zinc-950', [
      layer('absolute inset-0 bg-gradient-to-br from-orange-950/30 via-zinc-950 to-zinc-950'),
      layer('absolute top-20 left-10 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl'),
      layer('absolute bottom-20 right-10 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl'),
      layer('absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl'),
      h('div', { className: 'absolute top-32 right-20 text-6xl opacity-10', text: '🐾' }),
      h('div', { className: 'absolute bottom-40 left-20 text-5xl opacity-10', text: '🐾' }),
      h('div', { className: 'absolute top-1/3 left-1/4 text-4xl opacity-10', text: '🐾' }),
      h('div', 'container mx-auto px-4 py-20 relative z-10', [
        h('div', 'max-w-4xl mx-auto text-center', [
          badge({
            as: 'Badge',
            className: 'mb-6 bg-orange-500/20 text-orange-400 border-orange-500/30 px-4 py-2 text-sm',
            icon: Dog,
            iconClassName: 'w-4 h-4 mr-2',
            text: 'Sistema Completo para Pet Shops',
          }),
          h('h1', {
            className: 'text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight',
            text: [
              'Não gerencie apenas um Pet Shop.',
              ' ',
              span('bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 bg-clip-text text-transparent', 'Domine o mercado pet da sua região.'),
            ],
          }),
          h('p', {
            className: 'text-xl md:text-2xl text-zinc-400 mb-8 max-w-3xl mx-auto',
            text: [
              'O único ecossistema que une',
              ' ',
              strong('text-white', 'Agendamento de Banho e Tosa'),
              ',',
              ' ',
              strong('text-white', 'Venda de Ração com Lembrete de Recorrência'),
              ' e',
              ' ',
              strong('text-white', 'Gestão de Entregas'),
              '. Tudo o que seu Pet Shop precisa para faturar mais.',
            ],
          }),
          h('p', { className: 'text-lg text-orange-400 mb-10', text: '🐕 Organize o caos e aumente seu faturamento no piloto automático.' }),
          h('div', 'flex flex-col sm:flex-row gap-4 justify-center items-center mb-12', [
            cta({
              label: 'QUERO MODERNIZAR MEU PET SHOP',
              className: 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 animate-pulse',
              iconLeft: { icon: Dog, className: 'w-5 h-5 mr-2' },
              iconRight: { icon: ArrowRight, className: 'w-5 h-5 ml-2' },
            }),
          ]),
          h('Card', 'max-w-md mx-auto bg-zinc-900/80 border-zinc-800 mb-8', [
            h('CardContent', 'p-4', [
              h('div', 'flex items-center gap-3 mb-3', [
                h('div', { className: 'w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center', text: '🐕' }),
                h('div', 'text-left', [
                  h('p', { className: 'text-white font-semibold', text: 'Thor - Golden Retriever' }),
                  h('p', { className: 'text-zinc-400 text-sm', text: 'Próximo banho: Hoje, 14:00' }),
                ]),
              ]),
              h('div', 'bg-amber-500/20 border border-amber-500/30 rounded-lg p-3', [
                h('p', { className: 'text-amber-400 text-sm flex items-center gap-2' }, [
                  icon(Bell, 'w-4 h-4'),
                  { t: 'text', text: '⚠️ A ração do Thor acaba em 2 dias. Enviar lembrete?' },
                ]),
              ]),
            ]),
          ]),
          trust({
            className: 'flex flex-wrap justify-center gap-6 text-zinc-500',
            itemClassName: 'flex items-center gap-2',
            iconClassName: 'w-5 h-5 text-orange-500',
            items: [
              { icon: Calendar, text: 'Agenda 24h' },
              { icon: Package, text: 'Lembrete de Ração' },
              { icon: MapPin, text: 'GPS Leva e Traz' },
              { icon: Calculator, text: 'Comissões Automáticas' },
            ],
          }),
        ]),
      ]),
      layer('absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent'),
    ]),

    problemsSection(ORANGE, {
      badge: sectionBadge('mb-4 bg-red-500/20 text-red-400 border-red-500/30', AlertTriangle, 'O Desafio de Cuidar de Quem Não Fala'),
      title: ['Você cuida dos pets.', ' ', span('text-orange-500', 'O Mostralo cuida do seu lucro.')],
      text: ['Chega de perder vendas e tempo. ', span('text-orange-400', 'Automatize seu Pet Shop.')],
      items: problems,
    }),

    pillarsSection(ORANGE, {
      badge: sectionBadge(ORANGE.badge, CheckCircle, 'O "Cérebro" do seu Pet Shop'),
      title: ['Os 4 Pilares do', ' ', span('bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent', 'Pet Shop Lucrativo')],
      text: 'Recursos integrados que trabalham juntos para maximizar seu faturamento.',
      items: pillars,
    }),

    subscriptionClubSection({
      title: ['Banho mensal no', ' ', span('bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent', 'piloto automático')],
      text: ['Crie planos como ', strong('text-white', '"Plano Banho Mensal"'), ' ou', ' ', strong('text-white', '"Assinatura Tosa + Banho"'), ' e tenha tutores fidelizados.'],
      cards: clubCards,
      example: { title: '🐕 Plano Banho Mensal', description: '1 banho garantido por mês para o pet', price: '129', note: 'Pet sempre limpo e cheiroso!' },
    }),

    custom(PetProfileSection),
    custom(PetRecurrenceTimeline),

    // ROI
    h('section', 'py-20 bg-zinc-950', [
      h('div', 'container mx-auto px-4', [
        agendaHeader({
          className: 'max-w-4xl mx-auto text-center mb-12',
          badge: sectionBadge('mb-4 bg-green-500/20 text-green-400 border-green-500/30', Wallet, 'ROI Garantido'),
          title: ['Como o Mostralo ', span('text-orange-500', 'se paga sozinho'), ' em 15 dias'],
          titleClassName: 'text-3xl md:text-4xl font-bold text-white mb-4',
          text: 'A matemática do faturamento pet que você precisa conhecer.',
          textClassName: 'text-zinc-400',
        }),
        grid({
          className: 'grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12',
          items: roiMetrics,
          card: h('Card', 'bg-zinc-900 border-zinc-800 hover:border-orange-500/50 transition-all text-center', [
            h('CardContent', 'p-8', [
              h('div', 'w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center', [itemIcon(undefined, { key: 'icon' })]),
              f('p', undefined, 'value', { key: 'value' }),
              f('p', 'text-white font-semibold mb-2', 'label'),
              f('p', 'text-zinc-400 text-sm', 'description'),
            ]),
          ]),
        }),
        h('Card', 'max-w-3xl mx-auto bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/30', [
          h('CardContent', 'p-6 text-center', [
            h('p', {
              className: 'text-xl md:text-2xl text-white italic',
              text: [
                '"Não perca mais venda de ração para o supermercado. O',
                ' ',
                span('text-orange-500 font-bold', 'lembrete inteligente'),
                ' ',
                'garante que você seja sempre a primeira opção do cliente."',
              ],
            }),
          ]),
        ]),
      ]),
    ]),

    simulatorSection(ORANGE, { className: 'py-20 bg-zinc-950', title: ['Experimente ', span('text-orange-500', 'Como o Cliente Vê')], demo: PetBookingDemo }),

    plans('Essencial'),

    faqSection(ORANGE, { className: 'py-20 bg-zinc-950', cardBg: 'bg-zinc-900', items: faqs }),

    agendaFooter({
      iconClassName: 'w-8 h-8 text-orange-500',
      linkClassName: 'hover:text-orange-500 transition-colors',
      tagline: 'Sua marca. O cuidado que o pet merece. O lucro que você precisa. 🐾',
    }),

    whatsapp(),
  ],
};
