import { Inbox, ChefHat, Package, Truck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";

type OrderStatus = Database['public']['Enums']['order_status'];

interface StatusConfig {
  status: OrderStatus;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  color: string;
  activeColor: string;
}

const STATUS_CONFIG: StatusConfig[] = [
  { 
    status: 'entrada', 
    label: 'Entrada', 
    shortLabel: 'Entrada',
    icon: Inbox, 
    color: 'text-muted-foreground',
    activeColor: 'text-blue-500 bg-blue-500/10'
  },
  { 
    status: 'em_preparo', 
    label: 'Em Preparo', 
    shortLabel: 'Preparo',
    icon: ChefHat, 
    color: 'text-muted-foreground',
    activeColor: 'text-orange-500 bg-orange-500/10'
  },
  { 
    status: 'aguarda_retirada', 
    label: 'Aguarda', 
    shortLabel: 'Aguarda',
    icon: Package, 
    color: 'text-muted-foreground',
    activeColor: 'text-purple-500 bg-purple-500/10'
  },
  { 
    status: 'em_transito', 
    label: 'Trânsito', 
    shortLabel: 'Trânsito',
    icon: Truck, 
    color: 'text-muted-foreground',
    activeColor: 'text-green-500 bg-green-500/10'
  },
  { 
    status: 'concluido', 
    label: 'Finalizados', 
    shortLabel: 'Final',
    icon: CheckCircle2, 
    color: 'text-muted-foreground',
    activeColor: 'text-emerald-500 bg-emerald-500/10'
  },
];

interface MobileOrdersStatusBarProps {
  activeStatus: OrderStatus;
  onStatusChange: (status: OrderStatus) => void;
  counts: Record<OrderStatus, number>;
  pendingCount?: number;
}

export const MobileOrdersStatusBar = ({
  activeStatus,
  onStatusChange,
  counts,
  pendingCount = 0
}: MobileOrdersStatusBarProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t safe-area-pb">
      <div className="flex items-stretch h-16">
        {STATUS_CONFIG.map(({ status, shortLabel, icon: Icon, color, activeColor }) => {
          const isActive = activeStatus === status;
          const count = counts[status] || 0;
          const showPulse = status === 'entrada' && pendingCount > 0;
          
          return (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 transition-all relative",
                isActive ? activeColor : color,
                isActive && "border-t-2 border-current -mt-px"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", showPulse && "animate-pulse")} />
                {count > 0 && (
                  <span className={cn(
                    "absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full px-1",
                    showPulse 
                      ? "bg-red-500 text-white animate-pulse" 
                      : isActive 
                        ? "bg-current text-background" 
                        : "bg-muted text-muted-foreground"
                  )}>
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
