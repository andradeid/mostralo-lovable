import { Badge } from '@/components/ui/badge';

interface CustomerLabelBadgeProps {
  name: string;
  color: string;
  size?: 'sm' | 'md';
}

export const CustomerLabelBadge = ({ name, color, size = 'sm' }: CustomerLabelBadgeProps) => {
  return (
    <Badge
      variant="outline"
      className={`border-0 ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}`}
      style={{ 
        backgroundColor: `${color}20`,
        color: color,
      }}
    >
      {name}
    </Badge>
  );
};
