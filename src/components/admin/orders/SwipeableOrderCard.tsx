import { useRef, useState } from "react";
import { Database } from "@/integrations/supabase/types";
import { OrderCard } from "./OrderCard";
import { cn } from "@/lib/utils";
import { ArrowRight, Printer, X, Truck } from "lucide-react";
import { getNextStatus, getStatusLabel } from "@/hooks/useOrderStatusAdvance";

type Order = Database['public']['Tables']['orders']['Row'];

interface SwipeableOrderCardProps {
  order: Order;
  onAdvanceStatus: (order: Order) => void;
  onPrint: (order: Order) => void;
  onCancel: (order: Order) => void;
  onAssignDriver?: (order: Order) => void;
  onClick: () => void;
  isViewed?: boolean;
}

const SWIPE_THRESHOLD = 80;

export const SwipeableOrderCard = ({
  order,
  onAdvanceStatus,
  onPrint,
  onCancel,
  onAssignDriver,
  onClick,
  isViewed
}: SwipeableOrderCardProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swiping, setSwiping] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  
  const isCancelled = order.status === 'cancelado';
  const isCompleted = order.status === 'concluido';
  const canAdvance = !isCancelled && !isCompleted;
  const nextStatus = getNextStatus(order.status, order.delivery_type || 'delivery');
  
  // Para delivery sem entregador indo para em_transito, mostrar "Atribuir"
  const needsDriver = nextStatus === 'em_transito' && 
                      order.delivery_type === 'delivery' && 
                      !order.assigned_driver_id;
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isCancelled) return;
    setTouchStart(e.targetTouches[0].clientX);
    setTouchEnd(null);
    setSwiping(true);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || isCancelled) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    
    const diff = currentTouch - touchStart;
    // Limitar o offset máximo
    const maxOffset = 120;
    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, diff));
    setSwipeOffset(clampedOffset);
  };
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || isCancelled) {
      resetSwipe();
      return;
    }
    
    const distance = touchEnd - touchStart;
    
    // Swipe direita - Avançar status
    if (distance > SWIPE_THRESHOLD && canAdvance) {
      if (needsDriver && onAssignDriver) {
        onAssignDriver(order);
      } else {
        onAdvanceStatus(order);
      }
    }
    
    // Swipe esquerda - Mostrar opções (pode abrir menu ou executar ação primária)
    if (distance < -SWIPE_THRESHOLD) {
      // Swipe esquerda executa impressão como ação primária
      onPrint(order);
    }
    
    resetSwipe();
  };
  
  const resetSwipe = () => {
    setTouchStart(null);
    setTouchEnd(null);
    setSwiping(false);
    setSwipeOffset(0);
  };
  
  return (
    <div 
      ref={containerRef}
      className="relative overflow-hidden rounded-lg touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background de swipe direita (Avançar) */}
      {canAdvance && (
        <div 
          className={cn(
            "absolute inset-y-0 left-0 flex items-center justify-start pl-4 transition-opacity",
            needsDriver ? "bg-orange-500" : "bg-green-500",
            swipeOffset > 20 ? "opacity-100" : "opacity-0"
          )}
          style={{ width: Math.max(0, swipeOffset) }}
        >
          <div className="flex flex-col items-center text-white">
            {needsDriver ? (
              <>
                <Truck className="h-6 w-6" />
                <span className="text-xs font-medium mt-1">Atribuir</span>
              </>
            ) : (
              <>
                <ArrowRight className="h-6 w-6" />
                <span className="text-xs font-medium mt-1">
                  {nextStatus ? getStatusLabel(nextStatus) : 'Avançar'}
                </span>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Background de swipe esquerda (Opções) */}
      <div 
        className={cn(
          "absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-blue-500 transition-opacity",
          swipeOffset < -20 ? "opacity-100" : "opacity-0"
        )}
        style={{ width: Math.max(0, -swipeOffset) }}
      >
        <div className="flex flex-col items-center text-white">
          <Printer className="h-6 w-6" />
          <span className="text-xs font-medium mt-1">Imprimir</span>
        </div>
      </div>
      
      {/* Card principal */}
      <div 
        className={cn(
          "relative bg-background transition-transform",
          swiping ? "duration-0" : "duration-200"
        )}
        style={{ 
          transform: `translateX(${swipeOffset}px)`,
        }}
      >
        <OrderCard
          order={order}
          onClick={onClick}
          isViewed={isViewed}
        />
      </div>
      
      {/* Hint visual na primeira vez */}
      {!isViewed && order.status === 'entrada' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="animate-pulse text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
            ← Deslize para ações →
          </div>
        </div>
      )}
    </div>
  );
};
