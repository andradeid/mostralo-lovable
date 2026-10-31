import type { ComponentType, CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * Tipos das páginas de nicho (/nicho-*).
 *
 * Cada página é um arquivo de dados em `src/content/nichos/<slug>.ts` (SEO + lista de seções)
 * renderizado pelo `NicheLandingTemplate`. As seções são árvores de nós (`NicheNode`):
 * - nós de layout (`el`) guardam só a estrutura e as classes Tailwind;
 * - nós semânticos (`badge`, `cta`, `trust`, `grid`, `faq`, `links`...) são as peças reutilizáveis;
 * - textos ficam em `Rich` (texto com trechos destacados) ou nos `items` das grades.
 */

/** Trecho destacado dentro de um texto. */
export interface RichSpan {
  tag?: 'span' | 'strong' | 'em' | 'br' | 'year';
  className?: string;
  text?: Rich;
}

/** Texto simples ou sequência de pedaços (strings e trechos destacados). */
export type Rich = string | Array<string | RichSpan>;

/** Item de uma grade (card, depoimento, passo...). Campos são lidos pelos nós via `field`. */
export type NicheItem = Record<string, unknown> & {
  /** Sobrescreve a classe de um nó do molde do card que tenha a mesma `key`. */
  cls?: Record<string, string>;
};

export type ElTag =
  | 'div' | 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'strong' | 'em' | 'ul' | 'li'
  | 'section' | 'footer' | 'a' | 'img' | 'button'
  | 'Card' | 'CardContent' | 'CardHeader' | 'CardTitle' | 'Badge' | 'Button' | 'Link' | 'PricingText';

interface BaseNode {
  /** Renderiza o nó uma vez para cada entrada de `item[each]` (strings viram `{ value }`). */
  each?: string;
  /** Repete o nó N vezes (ou `item[repeat]` vezes). */
  repeat?: number | string;
  /** Só renderiza se `item[when]` existir. */
  when?: string;
  /** Só renderiza se `item[unless]` não existir. */
  unless?: string;
}

/** Elemento de layout (div, section, Card...). */
export interface ElNode extends BaseNode {
  t: 'el';
  tag: ElTag;
  className?: string;
  /** Nome usado por `item.cls[key]` para trocar a classe por item. */
  key?: string;
  style?: CSSProperties;
  /** Props extras repassadas ao elemento (to, href, target, src, alt, variant, size...). */
  props?: Record<string, unknown>;
  /** Props lidas do item atual: { prop: campo } (ex.: { href: 'linkUrl' }). */
  propFields?: Record<string, string>;
  /** Conteúdo vindo do item atual. */
  field?: string;
  /** Conteúdo fixo. */
  text?: Rich;
  /** Envolve o conteúdo de `field`/`text` em aspas. */
  quote?: boolean;
  prefix?: Rich;
  suffix?: Rich;
  children?: NicheNode[];
}

/** Ícone do lucide-react (fixo em `icon` ou vindo de `item[field]`, padrão `icon`). */
export interface IconNode extends BaseNode {
  t: 'icon';
  icon?: LucideIcon;
  field?: string;
  className?: string;
  key?: string;
  style?: CSSProperties;
}

/** Texto solto (sem elemento). */
export interface TextNode extends BaseNode {
  t: 'text';
  text?: Rich;
  field?: string;
}

/** Selo/etiqueta com ícone (topo do hero e das seções). */
export interface BadgeNode extends BaseNode {
  t: 'badge';
  as?: 'div' | 'span' | 'Badge';
  className: string;
  icon?: LucideIcon;
  iconClassName?: string;
  emoji?: string;
  emojiClassName?: string;
  text: Rich;
  /** Se definido, o texto vai dentro de um <span> com essa classe ('' = <span> sem classe). */
  textClassName?: string;
}

/** Botão de chamada (cadastro por padrão). */
export interface CtaNode extends BaseNode {
  t: 'cta';
  label: Rich;
  className: string;
  /** Rota interna (padrão /signup). */
  to?: string;
  /** Link externo (usa <a>). */
  href?: string;
  target?: string;
  rel?: string;
  /** Classe do <Link>/<a> que envolve o botão. */
  linkClassName?: string;
  /** Usa <Button asChild><Link/></Button> em vez de <Link><Button/></Link>. */
  asChild?: boolean;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  style?: CSSProperties;
  iconLeft?: { icon: LucideIcon; className: string };
  iconRight?: { icon: LucideIcon; className: string };
}

/** Linha de selos de confiança abaixo do CTA. */
export interface TrustNode extends BaseNode {
  t: 'trust';
  className: string;
  itemClassName: string;
  iconClassName?: string;
  /** Classe do <span> do texto (undefined = <span> sem classe). */
  textClassName?: string;
  /** Texto solto, sem <span>. */
  bareText?: boolean;
  /** Bolinha no lugar do ícone. */
  dotClassName?: string;
  items: Array<{ icon?: LucideIcon; text: Rich }>;
}

/** Grade de cards: `card` é o molde, preenchido com cada item. */
export interface GridNode extends BaseNode {
  t: 'grid';
  className?: string;
  items: NicheItem[];
  card: NicheNode;
  /** Envolve cada card num <div> (necessário para setas entre os cards). */
  itemWrapClassName?: string;
  /** Renderizado depois de cada card, menos o último (setas do fluxo). */
  connector?: NicheNode;
}

export interface FaqItem {
  q: Rich;
  a: Rich;
  icon?: LucideIcon;
}

/** Perguntas frequentes. */
export type FaqNode = BaseNode & {
  t: 'faq';
  items: FaqItem[];
} & (
  | {
      variant: 'accordion';
      className?: string;
      itemClassName: string;
      triggerClassName: string;
      contentClassName: string;
      /** Prefixo do value de cada item (padrão 'item-'). */
      valuePrefix?: string;
      /** Primeiro índice do value (padrão 0). */
      valueStart?: number;
      /** Envolve a pergunta: ícone + texto num <div>, ou texto num <span>. */
      triggerInner?: { as: 'div' | 'span'; className: string; iconClassName?: string };
    }
  | {
      /** Card clicável com chevron (molde agendamento). */
      variant: 'toggle-card';
      className: string;
      cardClassName: string;
      contentClassName: string;
      rowClassName: string;
      questionClassName: string;
      openIconClassName: string;
      closedIconClassName: string;
      answerClassName: string;
    }
  | {
      /** Card com <button> e chevron. */
      variant: 'toggle-button';
      className: string;
      cardClassName: string;
      buttonClassName: string;
      questionClassName: string;
      openIconClassName: string;
      closedIconClassName: string;
      answerWrapClassName: string;
      answerClassName: string;
    }
);

/** Lista de links do rodapé. */
export interface LinksNode extends BaseNode {
  t: 'links';
  className: string;
  linkClassName: string;
  /** 'Link' (react-router) ou 'a'. */
  as?: 'Link' | 'a';
  items: Array<{ label: Rich; to: string }>;
}

export interface SavingsNode extends BaseNode { t: 'savings' }
export interface PlansNode extends BaseNode { t: 'plans'; priority: 'Agenda' | 'Essencial'; founder?: boolean }
export interface WhatsAppNode extends BaseNode { t: 'whatsapp' }
export interface MainFooterNode extends BaseNode { t: 'mainFooter'; variant: 'light' | 'dark' | 'auto' }
/** Trecho único de uma página (simuladores, mockups...). */
export interface CustomNode extends BaseNode { t: 'custom'; component: ComponentType<Record<string, unknown>>; props?: Record<string, unknown> }
/** <style> embutido (animações próprias da página). */
export interface StyleNode extends BaseNode { t: 'style'; css: string }

export type NicheNode =
  | ElNode
  | IconNode
  | TextNode
  | BadgeNode
  | CtaNode
  | TrustNode
  | GridNode
  | FaqNode
  | LinksNode
  | SavingsNode
  | PlansNode
  | WhatsAppNode
  | MainFooterNode
  | CustomNode
  | StyleNode;

export interface NicheSEO {
  title: string;
  description: string;
  keywords?: string;
  url?: string;
  image?: string;
}

/** Conteúdo completo de uma página de nicho. */
export interface NicheContent {
  /** Rota pública (ex.: /nicho-pizzarias). */
  path: string;
  seo: NicheSEO;
  /** Classe do <div> raiz da página. */
  pageClassName: string;
  /** Rola para o topo ao abrir (comportamento antigo de algumas páginas). */
  scrollToTop?: boolean;
  /** Seções na ordem em que aparecem. */
  sections: NicheNode[];
}
