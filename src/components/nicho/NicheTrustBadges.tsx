import { renderRich } from './RichText';
import type { TrustNode } from './types';

/** Linha de selos ("Taxa 0%", "KDS integrado"...) abaixo do CTA do hero. */
export const NicheTrustBadges = ({ node }: { node: TrustNode }) => (
  <div className={node.className}>
    {node.items.map((badge, index) => {
      const Icon = badge.icon;
      return (
        <div key={index} className={node.itemClassName}>
          {Icon ? <Icon className={node.iconClassName} /> : node.dotClassName ? <div className={node.dotClassName} /> : null}
          {node.bareText ? renderRich(badge.text) : <span className={node.textClassName}>{renderRich(badge.text)}</span>}
        </div>
      );
    })}
  </div>
);
