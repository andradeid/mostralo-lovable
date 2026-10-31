import { Badge } from '@/components/ui/badge';
import { renderRich } from './RichText';
import type { BadgeNode } from './types';

/** Selo com ícone/emoji e texto (topo do hero e das seções). */
export const NicheBadge = ({ node }: { node: BadgeNode }) => {
  const Icon = node.icon;
  const content = (
    <>
      {Icon && <Icon className={node.iconClassName} />}
      {node.emoji && <span className={node.emojiClassName}>{node.emoji}</span>}
      {node.textClassName !== undefined ? (
        <span className={node.textClassName || undefined}>{renderRich(node.text)}</span>
      ) : (
        renderRich(node.text)
      )}
    </>
  );

  if (node.as === 'Badge') return <Badge className={node.className}>{content}</Badge>;
  if (node.as === 'span') return <span className={node.className}>{content}</span>;
  return <div className={node.className}>{content}</div>;
};
