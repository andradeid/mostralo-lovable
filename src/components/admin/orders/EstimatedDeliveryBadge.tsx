import { Clock, CheckCircle, AlertTriangle, AlertCircle, Pencil } from "lucide-react";
import { useEstimatedDeliveryTimer } from "@/hooks/useEstimatedDeliveryTimer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EstimatedDeliveryBadgeProps {
  createdAt: string;
  estimatedMinutes: number | null;
  variant?: 'compact' | 'expanded';
  deliveryType?: 'delivery' | 'pickup';
  onEdit?: () => void;
}

export const EstimatedDeliveryBadge = ({ 
  createdAt, 
  estimatedMinutes, 
  variant = 'compact',
  deliveryType = 'delivery',
  onEdit
}: EstimatedDeliveryBadgeProps) => {
  const { hasEstimate, displayText, color, status, estimatedTime, remainingMinutes } = 
    useEstimatedDeliveryTimer(createdAt, estimatedMinutes);

  if (!hasEstimate) return null;

  const colorClasses = {
    green: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-600 dark:text-green-400',
      icon: 'text-green-500',
    },
    yellow: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-600 dark:text-yellow-400',
      icon: 'text-yellow-500',
    },
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-600 dark:text-red-400',
      icon: 'text-red-500',
    },
  };

  const colors = colorClasses[color];

  const StatusIcon = status === 'on_time' ? CheckCircle : 
                     status === 'almost_due' ? AlertTriangle : 
                     AlertCircle;

  if (variant === 'compact') {
    return (
      <div 
        className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium",
          colors.bg,
          colors.text
        )}
      >
        <Clock className="h-3 w-3" />
        <span className="whitespace-nowrap">
          {remainingMinutes > 0 ? `${remainingMinutes}m` : `${Math.abs(remainingMinutes)}m`}
        </span>
        <StatusIcon className={cn("h-3 w-3", colors.icon)} />
      </div>
    );
  }

  // Variante expandida para o OrderDetailDialog
  const title = deliveryType === 'pickup' ? 'Tempo de Preparo' : 'Tempo de Entrega';
  
  return (
    <div 
      className={cn(
        "rounded-lg border p-3 mt-2",
        colors.bg,
        colors.border
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <Clock className={cn("h-4 w-4", colors.icon)} />
          <span className={cn("font-medium text-sm", colors.text)}>{title}</span>
        </div>
        {onEdit && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onEdit}
            className="h-7 w-7 p-0 hover:bg-background/50"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn("h-5 w-5", colors.icon)} />
          <span className={cn("font-semibold", colors.text)}>
            {displayText}
          </span>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Previsão</p>
          <p className={cn("font-bold text-lg", colors.text)}>{estimatedTime}</p>
        </div>
      </div>
    </div>
  );
};