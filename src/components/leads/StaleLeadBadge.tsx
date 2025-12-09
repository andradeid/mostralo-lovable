import { differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface StaleLeadBadgeProps {
  updatedAt: string;
  status: string;
}

export function StaleLeadBadge({ updatedAt, status }: StaleLeadBadgeProps) {
  // Só mostrar para leads que ainda podem ser trabalhados
  const activeStatuses = ['new', 'contacted', 'qualified'];
  if (!activeStatuses.includes(status)) {
    return null;
  }

  const daysStale = differenceInDays(new Date(), new Date(updatedAt));

  if (daysStale < 3) {
    return null;
  }

  const getStaleConfig = () => {
    if (daysStale >= 7) {
      return {
        variant: 'destructive' as const,
        label: 'URGENTE!',
        icon: AlertCircle,
        className: 'bg-red-500 text-white animate-pulse',
        tooltip: `Sem atualização há ${daysStale} dias! Este lead precisa de atenção imediata.`
      };
    }
    if (daysStale >= 5) {
      return {
        variant: 'default' as const,
        label: 'Alerta',
        icon: AlertTriangle,
        className: 'bg-orange-500 text-white',
        tooltip: `Sem atualização há ${daysStale} dias. Faça follow-up hoje!`
      };
    }
    return {
      variant: 'secondary' as const,
      label: 'Atenção',
      icon: Clock,
      className: 'bg-yellow-500 text-black',
      tooltip: `Sem atualização há ${daysStale} dias. Considere fazer follow-up.`
    };
  };

  const config = getStaleConfig();
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`${config.className} gap-1 cursor-help`}>
            <Icon className="h-3 w-3" />
            <span>{config.label}</span>
            <span className="text-xs opacity-80">({daysStale}d)</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function getStaleLevel(updatedAt: string, status: string): 'normal' | 'attention' | 'alert' | 'urgent' {
  const activeStatuses = ['new', 'contacted', 'qualified'];
  if (!activeStatuses.includes(status)) {
    return 'normal';
  }

  const daysStale = differenceInDays(new Date(), new Date(updatedAt));

  if (daysStale >= 7) return 'urgent';
  if (daysStale >= 5) return 'alert';
  if (daysStale >= 3) return 'attention';
  return 'normal';
}

export function getRowClassName(updatedAt: string, status: string): string {
  const level = getStaleLevel(updatedAt, status);
  
  switch (level) {
    case 'urgent':
      return 'bg-red-500/10 hover:bg-red-500/20';
    case 'alert':
      return 'bg-orange-500/10 hover:bg-orange-500/20';
    case 'attention':
      return 'bg-yellow-500/5 hover:bg-yellow-500/10';
    default:
      return '';
  }
}
