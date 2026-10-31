import type { LucideIcon } from 'lucide-react';
import { CheckCircle, CreditCard, MessageSquare, Smartphone, Store } from 'lucide-react';
import { badge, custom, f, faq, grid, h, icon, itemIcon, links, span, YEAR } from '../build';
import type { ComponentType } from 'react';
import type { FaqItem, NicheItem, NicheNode, Rich } from '../types';

/**
 * Seções do molde "agendamento" compartilhadas por Nail Designers e Pet Shops (mesma estrutura,
 * muda a cor de destaque e o texto). As classes de cor chegam completas (ex.: 'text-rose-500')
 * para o Tailwind encontrá-las nos arquivos de conteúdo.
 */
export interface AgendaAccent {
  /** ex.: 'hover:border-rose-500/50' */
  hoverBorder: string;
  /** ex.: 'text-rose-500' */
  text500: string;
  /** ex.: 'text-rose-400' */
  text400: string;
  /** Classe do selo das seções, ex.: 'mb-4 bg-rose-500/20 text-rose-400 border-rose-500/30' */
  badge: string;
}

/** Selo (shadcn Badge) com ícone, usado no topo das seções. */
export const sectionBadge = (className: string, Icon: LucideIcon, text: Rich) =>
  badge({ as: 'Badge', className, icon: Icon, iconClassName: 'w-4 h-4 mr-2', text });

/** Cabeçalho centralizado: selo, título e texto opcional. */
export const agendaHeader = (opts: {
  className?: string;
  badge?: NicheNode;
  title: Rich;
  titleClassName: string;
  text?: Rich;
  textClassName?: string;
}): NicheNode =>
  h('div', opts.className ?? 'max-w-4xl mx-auto text-center mb-16', [
    ...(opts.badge ? [opts.badge] : []),
    h('h2', { className: opts.titleClassName, text: opts.title }),
    ...(opts.text !== undefined ? [h('p', { className: opts.textClassName, text: opts.text })] : []),
  ]);

/** Cards de dores (4 colunas, ícone colorido num círculo). */
export const problemsSection = (a: AgendaAccent, opts: { badge: NicheNode; title: Rich; text: Rich; items: NicheItem[] }) =>
  h('section', 'py-20 bg-zinc-950', [
    h('div', 'container mx-auto px-4', [
      agendaHeader({ badge: opts.badge, title: opts.title, titleClassName: 'text-3xl md:text-5xl font-bold text-white mb-6', text: opts.text, textClassName: 'text-xl text-zinc-400' }),
      grid({
        className: 'grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto',
        items: opts.items,
        card: h('Card', `bg-zinc-900/50 border-zinc-800 ${a.hoverBorder} transition-all duration-300 hover:-translate-y-1`, [
          h('CardContent', 'p-6 text-center', [
            h('div', { key: 'iconWrap' }, [itemIcon('w-8 h-8')]),
            f('h3', 'text-xl font-bold text-white mb-3', 'title'),
            f('p', 'text-zinc-400 text-sm', 'description'),
          ]),
        ]),
      }),
    ]),
  ]);

/** Classe do círculo do ícone de cada dor (cor do ícone no fim, como no original). */
export const problemIconWrap = (color: string) => ({ iconWrap: `w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center ${color}` });

/** Os 4 pilares: faixa colorida no topo, ícone, título, subtítulo e lista de recursos. */
export const pillarsSection = (a: AgendaAccent, opts: { badge: NicheNode; title: Rich; text: Rich; items: NicheItem[] }) =>
  h('section', 'py-20 bg-zinc-900', [
    h('div', 'container mx-auto px-4', [
      agendaHeader({ badge: opts.badge, title: opts.title, titleClassName: 'text-3xl md:text-5xl font-bold text-white mb-6', text: opts.text, textClassName: 'text-xl text-zinc-400' }),
      grid({
        className: 'grid md:grid-cols-2 gap-8 max-w-5xl mx-auto',
        items: opts.items,
        card: h('Card', `bg-zinc-950 border-zinc-800 ${a.hoverBorder} transition-all duration-300 hover:-translate-y-2 overflow-hidden`, [
          h('div', { key: 'bar' }),
          h('CardHeader', 'pb-4', [
            h('div', 'flex items-center gap-4', [
              h('div', { key: 'iconWrap' }, [itemIcon(`w-7 h-7 ${a.text500}`)]),
              h('div', [f('CardTitle', 'text-xl text-white', 'title'), f('p', `${a.text400} text-sm font-medium`, 'subtitle')]),
            ]),
          ]),
          h('CardContent', [checkList('features')]),
        ]),
      }),
    ]),
  ]);

/** Classes da faixa e do fundo do ícone de cada pilar. */
export const pillarCls = (gradient: string, iconBg: string) => ({
  bar: `h-2 bg-gradient-to-r ${gradient}`,
  iconWrap: `w-14 h-14 rounded-xl ${iconBg} flex items-center justify-center`,
});

/** Lista com check verde (pilares e clube de assinaturas). */
export const checkList = (field: string): NicheNode =>
  h('ul', 'space-y-3', [
    h('li', { className: 'flex items-start gap-3 text-zinc-300', each: field }, [
      icon(CheckCircle, 'w-5 h-5 text-green-500 flex-shrink-0 mt-0.5'),
      f('span', undefined, 'value'),
    ]),
  ]);

// Cores fixas dos 4 cards do clube de assinaturas (iguais em todas as páginas do molde).
const CLUB_CARD_STYLES = [
  { bar: 'h-2 bg-gradient-to-r from-violet-500 to-purple-500', iconWrap: 'w-14 h-14 rounded-xl bg-violet-500/10 flex items-center justify-center', icon: 'w-7 h-7 text-violet-500', subtitle: 'text-violet-400 text-sm' },
  { bar: 'h-2 bg-gradient-to-r from-purple-500 to-pink-500', iconWrap: 'w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center', icon: 'w-7 h-7 text-purple-500', subtitle: 'text-purple-400 text-sm' },
  { bar: 'h-2 bg-gradient-to-r from-pink-500 to-rose-500', iconWrap: 'w-14 h-14 rounded-xl bg-pink-500/10 flex items-center justify-center', icon: 'w-7 h-7 text-pink-500', subtitle: 'text-pink-400 text-sm' },
  { bar: 'h-2 bg-gradient-to-r from-rose-500 to-orange-500', iconWrap: 'w-14 h-14 rounded-xl bg-rose-500/10 flex items-center justify-center', icon: 'w-7 h-7 text-rose-500', subtitle: 'text-rose-400 text-sm' },
];

export interface ClubCard {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  features: string[];
}

/** Clube de assinaturas: 4 cards + exemplo de plano. */
export const subscriptionClubSection = (opts: {
  title: Rich;
  text: Rich;
  /** Cards padrão (faixa colorida + lista). */
  cards?: ClubCard[];
  /** Grade própria no lugar dos cards padrão (ex.: Arenas). */
  grid?: NicheNode;
  example: { title: string; description: string; price: string; note: string; noteClassName?: string; noteIcon?: LucideIcon };
}) =>
  h('section', 'py-20 bg-gradient-to-b from-zinc-900 to-zinc-950', [
    h('div', 'container mx-auto px-4', [
      agendaHeader({
        badge: sectionBadge('mb-4 bg-violet-500/20 text-violet-400 border-violet-500/30 px-4 py-2', CreditCard, '🆕 NOVO! Fidelização Premium'),
        title: opts.title,
        titleClassName: 'text-3xl md:text-5xl font-bold text-white mb-6',
        text: opts.text,
        textClassName: 'text-xl text-zinc-400',
      }),
      opts.grid ?? grid({
        className: 'grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-12',
        items: (opts.cards ?? []).map((card, i) => ({ ...card, cls: CLUB_CARD_STYLES[i] })),
        card: h('Card', 'bg-zinc-950 border-zinc-800 hover:border-violet-500/50 transition-all duration-300 hover:-translate-y-2 overflow-hidden', [
          h('div', { key: 'bar' }),
          h('CardContent', 'p-6', [
            h('div', 'flex items-center gap-4 mb-4', [
              h('div', { key: 'iconWrap' }, [itemIcon(undefined, { key: 'icon' })]),
              h('div', [f('h3', 'text-xl font-bold text-white', 'title'), f('p', undefined, 'subtitle', { key: 'subtitle' })]),
            ]),
            checkList('features'),
          ]),
        ]),
      }),
      h('div', 'max-w-md mx-auto', [
        h('Card', 'bg-gradient-to-br from-violet-500/20 to-purple-500/20 border-violet-500/50 overflow-hidden', [
          h('CardContent', 'p-6 text-center', [
            h('Badge', { className: 'mb-4 bg-violet-500 text-white border-0', text: 'EXEMPLO DE PLANO' }),
            h('h3', { className: 'text-2xl font-bold text-white mb-2', text: opts.example.title }),
            h('p', { className: 'text-zinc-400 mb-4', text: opts.example.description }),
            h('div', 'flex items-baseline justify-center gap-1 mb-4', [
              h('span', { className: 'text-zinc-500', text: 'R$' }),
              h('span', { className: 'text-5xl font-bold text-violet-400', text: opts.example.price }),
              h('span', { className: 'text-zinc-500', text: '/mês' }),
            ]),
            h('div', `flex items-center justify-center gap-2 ${opts.example.noteClassName ?? 'text-green-400'}`, [
              icon(opts.example.noteIcon ?? CheckCircle, 'w-5 h-5'),
              h('span', { text: opts.example.note }),
            ]),
          ]),
        ]),
      ]),
    ]),
  ]);

/** Seção "Teste agora" com o simulador interativo da página. */
export const simulatorSection = (a: AgendaAccent, opts: { className: string; title: Rich; demo: ComponentType }) =>
  h('section', opts.className, [
    h('div', 'container mx-auto px-4', [
      agendaHeader({
        className: 'max-w-4xl mx-auto text-center mb-12',
        badge: sectionBadge(a.badge, Smartphone, 'Teste Agora - 100% Interativo'),
        title: opts.title,
        titleClassName: 'text-3xl md:text-4xl font-bold text-white mb-4',
        text: 'Clique e navegue pelo sistema real de agendamento',
        textClassName: 'text-zinc-400',
      }),
      h('div', 'max-w-3xl mx-auto', [custom(opts.demo)]),
    ]),
  ]);

/** FAQ em cards clicáveis. */
export const faqSection = (a: AgendaAccent, opts: { className: string; cardBg: string; items: FaqItem[] }) =>
  h('section', opts.className, [
    h('div', 'container mx-auto px-4', [
      h('div', 'max-w-3xl mx-auto', [
        h('div', 'text-center mb-12', [
          sectionBadge(a.badge, MessageSquare, 'Dúvidas Frequentes'),
          h('h2', { className: 'text-3xl md:text-4xl font-bold text-white', text: ['Perguntas ', span(a.text500, 'Frequentes')] }),
        ]),
        faq({
          variant: 'toggle-card',
          className: 'space-y-4',
          cardClassName: `${opts.cardBg} border-zinc-800 cursor-pointer ${a.hoverBorder} transition-all`,
          contentClassName: 'p-4',
          rowClassName: 'flex items-center justify-between',
          questionClassName: 'text-white font-semibold pr-4',
          openIconClassName: `w-5 h-5 ${a.text500} flex-shrink-0`,
          closedIconClassName: 'w-5 h-5 text-zinc-500 flex-shrink-0',
          answerClassName: 'text-zinc-400 mt-4 pt-4 border-t border-zinc-800',
          items: opts.items,
        }),
      ]),
    ]),
  ]);

/** Rodapé do molde agendamento. */
export const agendaFooter = (opts: { iconClassName: string; linkClassName: string; tagline: Rich }) =>
  h('footer', 'py-12 bg-zinc-950 border-t border-zinc-800', [
    h('div', 'container mx-auto px-4 text-center', [
      h('div', 'flex items-center justify-center gap-2 mb-4', [icon(Store, opts.iconClassName), h('span', { className: 'text-2xl font-bold text-white', text: 'Mostralo' })]),
      h('p', { className: 'text-zinc-400 mb-6', text: opts.tagline }),
      links({
        className: 'flex flex-wrap justify-center gap-6 text-zinc-500 text-sm',
        linkClassName: opts.linkClassName,
        items: [
          { label: 'Termos de Uso', to: '/termos' },
          { label: 'Privacidade', to: '/privacidade' },
          { label: 'Suporte', to: '/suporte' },
        ],
      }),
      h('p', { className: 'text-zinc-600 text-sm mt-8', text: ['© ', YEAR, ' Mostralo. Todos os direitos reservados.'] }),
    ]),
  ]);
