import type { ComponentType, CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import type {
  BadgeNode,
  CtaNode,
  ElNode,
  ElTag,
  FaqNode,
  GridNode,
  IconNode,
  LinksNode,
  NicheNode,
  Rich,
  RichSpan,
  TextNode,
  TrustNode,
} from './types';

/**
 * Atalhos para montar as seções nos arquivos de `src/content/nichos/`.
 * `h(tag, classe, filhos)` cria um elemento de layout; os demais criam as peças semânticas.
 */

type ElOptions = Omit<ElNode, 't' | 'tag' | 'children'>;
type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export function h(tag: ElTag, a?: string | ElOptions | NicheNode[], b?: NicheNode[]): ElNode {
  let opts: ElOptions = {};
  let children: NicheNode[] | undefined;
  if (typeof a === 'string') opts = { className: a };
  else if (Array.isArray(a)) children = a;
  else if (a) opts = a;
  if (b) children = b;
  return { t: 'el', tag, ...opts, ...(children ? { children } : {}) };
}

/** Elemento cujo conteúdo vem do campo `field` do item. */
export const f = (tag: ElTag, className: string | undefined, field: string, opts: ElOptions = {}): ElNode => ({
  t: 'el',
  tag,
  className,
  field,
  ...opts,
});

/** Texto solto. */
export const txt = (text: Rich): TextNode => ({ t: 'text', text });
/** Texto solto vindo do campo do item. */
export const fld = (field: string, opts: Partial<TextNode> = {}): TextNode => ({ t: 'text', field, ...opts });

/** Ícone fixo. */
export const icon = (Icon: LucideIcon, className?: string, opts: Partial<IconNode> = {}): IconNode => ({
  t: 'icon',
  icon: Icon,
  className,
  ...opts,
});
/** Ícone vindo do item (campo `icon` por padrão). */
export const itemIcon = (className?: string, opts: Partial<IconNode> = {}): IconNode => ({ t: 'icon', className, ...opts });

/** Camada decorativa (div vazia). */
export const layer = (className: string, style?: CSSProperties): ElNode => ({ t: 'el', tag: 'div', className, ...(style ? { style } : {}) });

// ---- Texto rico ----
export const span = (className: string | undefined, text: Rich): RichSpan => ({ tag: 'span', className, text });
export const strong = (className: string | undefined, text: Rich): RichSpan => ({ tag: 'strong', className, text });
export const br = (className?: string): RichSpan => ({ tag: 'br', className });
export const YEAR: RichSpan = { tag: 'year' };

// ---- Peças semânticas ----
export const badge = (node: Omit<BadgeNode, 't'>): BadgeNode => ({ t: 'badge', ...node });
export const cta = (node: Omit<CtaNode, 't'>): CtaNode => ({ t: 'cta', ...node });
export const trust = (node: Omit<TrustNode, 't'>): TrustNode => ({ t: 'trust', ...node });
export const grid = (node: Omit<GridNode, 't'>): GridNode => ({ t: 'grid', ...node });
export const faq = (node: DistOmit<FaqNode, 't'>): FaqNode => ({ t: 'faq', ...node }) as FaqNode;
export const links = (node: Omit<LinksNode, 't'>): LinksNode => ({ t: 'links', ...node });

export const savings = (): NicheNode => ({ t: 'savings' });
export const plans = (priority: 'Agenda' | 'Essencial', founder?: boolean): NicheNode => ({
  t: 'plans',
  priority,
  ...(founder ? { founder } : {}),
});
export const whatsapp = (): NicheNode => ({ t: 'whatsapp' });
export const mainFooter = (variant: 'light' | 'dark' | 'auto'): NicheNode => ({ t: 'mainFooter', variant });
export const custom = (component: ComponentType<any>, props?: Record<string, unknown>): NicheNode => ({
  t: 'custom',
  component,
  ...(props ? { props } : {}),
});
export const style = (css: string): NicheNode => ({ t: 'style', css });

/** Links padrão do rodapé das páginas de delivery. */
export const FOOTER_LINKS = [
  { label: 'Início', to: '/' },
  { label: 'Funcionalidades', to: '/funcionalidades' },
  { label: 'Suporte', to: '/suporte' },
  { label: 'Termos', to: '/termos' },
  { label: 'Privacidade', to: '/privacidade' },
];
