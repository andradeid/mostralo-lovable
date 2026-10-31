import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { renderRich } from './RichText';
import type { CtaNode } from './types';

/** Botão de chamada: por padrão leva ao cadastro (/signup). */
export const NicheCta = ({ node }: { node: CtaNode }) => {
  const IconLeft = node.iconLeft?.icon;
  const IconRight = node.iconRight?.icon;
  const content = (
    <>
      {IconLeft && <IconLeft className={node.iconLeft!.className} />}
      {renderRich(node.label)}
      {IconRight && <IconRight className={node.iconRight!.className} />}
    </>
  );
  const size = node.size ?? 'lg';
  const to = node.to ?? '/signup';

  if (node.asChild) {
    return (
      <Button asChild size={size} className={node.className} style={node.style}>
        <Link to={to}>{content}</Link>
      </Button>
    );
  }

  const button = (
    <Button size={size} className={node.className} style={node.style}>
      {content}
    </Button>
  );

  if (node.href) {
    return (
      <a href={node.href} target={node.target} rel={node.rel} className={node.linkClassName}>
        {button}
      </a>
    );
  }

  return (
    <Link to={to} className={node.linkClassName}>
      {button}
    </Link>
  );
};
