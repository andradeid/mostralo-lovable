import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface TableAuthAnimatedStepProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  status: 'loading' | 'success' | 'error' | 'info';
  iconClassName?: string;
}

export function TableAuthAnimatedStep({ 
  icon: Icon, 
  title, 
  subtitle, 
  status,
  iconClassName 
}: TableAuthAnimatedStepProps) {
  const statusColors = {
    loading: 'text-amber-500',
    success: 'text-emerald-500',
    error: 'text-destructive',
    info: 'text-primary'
  };

  const statusBgColors = {
    loading: 'bg-amber-500/10',
    success: 'bg-emerald-500/10',
    error: 'bg-destructive/10',
    info: 'bg-primary/10'
  };

  const iconAnimations = {
    loading: 'animate-pulse',
    success: 'animate-scale-in',
    error: 'animate-scale-in',
    info: 'animate-scale-in'
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-fade-in">
      <div className={cn(
        "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500",
        statusBgColors[status]
      )}>
        <Icon className={cn(
          "h-10 w-10 transition-all duration-300",
          statusColors[status],
          iconAnimations[status],
          iconClassName
        )} />
      </div>
      
      <div className="text-center space-y-1">
        <h3 className="text-xl font-semibold animate-fade-in">{title}</h3>
        {subtitle && (
          <p className="text-muted-foreground text-sm animate-fade-in" style={{ animationDelay: '100ms' }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
