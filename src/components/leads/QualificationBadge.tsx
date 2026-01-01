import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, Clock, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type QualificationLevel = 'elite' | 'potential' | 'disqualified' | 'evaluation' | null;

interface QualificationBadgeProps {
  level: QualificationLevel;
  score?: number | null;
  showScore?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const LEVEL_CONFIG: Record<NonNullable<QualificationLevel>, {
  label: string;
  icon: typeof Star;
  className: string;
}> = {
  elite: {
    label: 'Elite',
    icon: Star,
    className: 'bg-amber-500/20 text-amber-600 border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400'
  },
  potential: {
    label: 'Potencial',
    icon: TrendingUp,
    className: 'bg-purple-500/20 text-purple-600 border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-400'
  },
  disqualified: {
    label: 'Desqualificado',
    icon: HelpCircle,
    className: 'bg-muted text-muted-foreground border-border'
  },
  evaluation: {
    label: 'Em Avaliação',
    icon: Clock,
    className: 'bg-blue-500/20 text-blue-600 border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400'
  }
};

export function QualificationBadge({ 
  level, 
  score, 
  showScore = false,
  size = 'sm',
  className 
}: QualificationBadgeProps) {
  if (!level) return null;

  const config = LEVEL_CONFIG[level];
  if (!config) return null;

  const Icon = config.icon;
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1';

  return (
    <Badge 
      variant="outline" 
      className={cn(
        'font-medium gap-1 border',
        padding,
        textSize,
        config.className,
        className
      )}
    >
      <Icon className={iconSize} />
      <span>{config.label}</span>
      {showScore && score !== null && score !== undefined && (
        <span className="opacity-70">({score}/12)</span>
      )}
    </Badge>
  );
}

// Constantes para uso em filtros
export const QUALIFICATION_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'elite', label: 'Elite' },
  { value: 'potential', label: 'Potencial' },
  { value: 'disqualified', label: 'Desqualificado' },
  { value: 'evaluation', label: 'Em Avaliação' }
] as const;

// Função utilitária para labels
export function getQualificationLabel(level: QualificationLevel): string {
  if (!level) return 'Não qualificado';
  return LEVEL_CONFIG[level]?.label || level;
}
