import { createElement, Fragment, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SavingsCalculator } from '@/components/landing/SavingsCalculator';
import { MostraloPlansSection } from '@/components/pricing/MostraloPlansSection';
import { PricingText } from '@/components/pricing/PricingText';
import { WhatsAppLeadButton } from '@/components/leads/WhatsAppLeadButton';
import { MainFooter } from '@/components/MainFooter';
import { renderRich, richToString } from './RichText';
import { NicheBadge } from './NicheBadge';
import { NicheCta } from './NicheCta';
import { NicheTrustBadges } from './NicheTrustBadges';
import { NicheFaq } from './NicheFaq';
import type { ElNode, NicheItem, NicheNode, Rich } from './types';

const COMPONENTS: Record<string, unknown> = {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Link,
};

const fieldOf = (item: NicheItem | undefined, field: string | undefined): unknown =>
  field && item ? item[field] : undefined;

const classOf = (node: { className?: string; key?: string }, item?: NicheItem) =>
  (node.key && item?.cls?.[node.key]) || node.className;

const renderEl = (node: ElNode, item: NicheItem | undefined, key: number | string): ReactNode => {
  const className = classOf(node, item);
  const content: Rich | undefined = node.field ? (fieldOf(item, node.field) as Rich) : node.text;

  if (node.tag === 'PricingText') {
    return <PricingText key={key} text={richToString(content)} />;
  }

  const children: ReactNode[] = [];
  if (node.prefix !== undefined) children.push(<Fragment key="prefix">{renderRich(node.prefix)}</Fragment>);
  if (content !== undefined) {
    children.push(
      <Fragment key="content">
        {node.quote ? '"' : null}
        {renderRich(content)}
        {node.quote ? '"' : null}
      </Fragment>,
    );
  }
  node.children?.forEach((child, i) => children.push(renderNode(child, item, `c${i}`)));
  if (node.suffix !== undefined) children.push(<Fragment key="suffix">{renderRich(node.suffix)}</Fragment>);

  const type = (COMPONENTS[node.tag] ?? node.tag) as string;
  const fromItem = node.propFields
    ? Object.fromEntries(Object.entries(node.propFields).map(([prop, field]) => [prop, fieldOf(item, field)]))
    : {};
  // Mesma ordem de atributos do JSX original (href/target/rel antes de className).
  const props = { key, ...fromItem, ...node.props, className, style: node.style };
  if (node.tag === 'img') return createElement(type, props);
  return createElement(type, props, ...children);
};

/** O card mostra algum texto entre aspas (`quote: true`)? Usado para reconhecer grades de depoimentos. */
const hasQuoteNode = (node: NicheNode): boolean => {
  const n = node as { quote?: boolean; children?: NicheNode[] };
  return n.quote === true || (Array.isArray(n.children) && n.children.some(hasQuoteNode));
};

const renderOne = (node: NicheNode, item: NicheItem | undefined, key: number | string): ReactNode => {
  switch (node.t) {
    case 'el':
      return renderEl(node, item, key);
    case 'icon': {
      const Icon = (node.icon ?? fieldOf(item, node.field ?? 'icon')) as LucideIcon | undefined;
      if (!Icon) return null;
      return <Icon key={key} className={classOf(node, item)} style={node.style} />;
    }
    case 'text':
      return <Fragment key={key}>{renderRich(node.field ? (fieldOf(item, node.field) as Rich) : node.text)}</Fragment>;
    case 'badge':
      return <NicheBadge key={key} node={node} />;
    case 'cta':
      return <NicheCta key={key} node={node} />;
    case 'trust':
      return <NicheTrustBadges key={key} node={node} />;
    case 'faq':
      return <NicheFaq key={key} node={node} />;
    case 'grid': {
      const last = node.items.length - 1;
      const cards = node.items.map((entry, index) =>
        node.itemWrapClassName !== undefined ? (
          <div key={index} className={node.itemWrapClassName}>
            {renderNode(node.card, entry, 'card')}
            {node.connector && index < last && renderNode(node.connector, entry, 'connector')}
          </div>
        ) : (
          renderNode(node.card, entry, index)
        ),
      );
      // Depoimentos das páginas de nicho são exemplos (ainda não há depoimentos reais publicados)
      // (itens com campo `quote` ou card que mostra o texto entre aspas — algumas páginas usam o campo `text`)
      const isTestimonials =
        node.items.length > 0 &&
        (node.items.every((it) => typeof (it as Record<string, unknown>).quote === 'string') || hasQuoteNode(node.card));
      const note = isTestimonials ? (
        <p key={`${key}-nota`} className="mt-4 text-center text-xs opacity-70">Depoimentos ilustrativos, para exemplo.</p>
      ) : null;
      // Sem className: os cards ficam direto no elemento pai (ex.: dentro de um space-y-*).
      if (node.className === undefined) return <Fragment key={key}>{cards}{note}</Fragment>;
      if (note) {
        return (
          <Fragment key={key}>
            <div className={node.className}>{cards}</div>
            {note}
          </Fragment>
        );
      }
      return (
        <div key={key} className={node.className}>
          {cards}
        </div>
      );
    }
    case 'links':
      return (
        <div key={key} className={node.className}>
          {node.items.map((link, index) =>
            node.as === 'a' ? (
              <a key={index} href={link.to} className={node.linkClassName}>
                {renderRich(link.label)}
              </a>
            ) : (
              <Link key={index} to={link.to} className={node.linkClassName}>
                {renderRich(link.label)}
              </Link>
            ),
          )}
        </div>
      );
    case 'savings':
      return <SavingsCalculator key={key} />;
    case 'plans':
      return node.founder ? (
        <MostraloPlansSection key={key} priority={node.priority} founder />
      ) : (
        <MostraloPlansSection key={key} priority={node.priority} />
      );
    case 'whatsapp':
      return <WhatsAppLeadButton key={key} />;
    case 'mainFooter':
      return <MainFooter key={key} variant={node.variant} />;
    case 'custom': {
      const Component = node.component;
      return <Component key={key} {...(node.props ?? {})} />;
    }
    case 'style':
      return <style key={key}>{node.css}</style>;
    default:
      return null;
  }
};

/**
 * Renderiza um nó com o item atual (para `field`, `when`, `each`, `repeat`).
 * `each` repete o nó para cada entrada de uma lista do item; `repeat` repete N vezes.
 */
export const renderNode = (node: NicheNode, item: NicheItem | undefined, key: number | string): ReactNode => {
  if (node.when && !fieldOf(item, node.when)) return null;
  if (node.unless && fieldOf(item, node.unless)) return null;

  if (node.each) {
    const list = (fieldOf(item, node.each) as unknown[]) ?? [];
    const single = { ...node, each: undefined } as NicheNode;
    return (
      <Fragment key={key}>
        {list.map((entry, i) =>
          renderOne(single, typeof entry === 'object' && entry !== null ? (entry as NicheItem) : { value: entry }, i),
        )}
      </Fragment>
    );
  }

  if (node.repeat !== undefined) {
    const count = typeof node.repeat === 'number' ? node.repeat : Number(fieldOf(item, node.repeat) ?? 0);
    const single = { ...node, repeat: undefined } as NicheNode;
    return <Fragment key={key}>{[...Array(count)].map((_, i) => renderOne(single, item, i))}</Fragment>;
  }

  return renderOne(node, item, key);
};

/** Renderiza uma lista de nós (sem item). */
export const NicheNodes = ({ nodes }: { nodes: NicheNode[] }) => <>{nodes.map((node, i) => renderNode(node, undefined, i))}</>;
