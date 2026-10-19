import { Badge } from "@/components/ui/badge";
import { Database } from "@/integrations/supabase/types";
import { CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';

type OrderStatus = Database['public']['Enums']['order_status'];

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export const OrderStatusBadge = ({ status }: OrderStatusBadgeProps) => {
  const statusConfig: Record<OrderStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    aguardando_pagamento: { label: "Aguardando Pagamento", variant: "outline" },
    entrada: { label: "Entrada", variant: "default" },
    confirmado: { label: "Confirmado", variant: "default" },
    em_preparo: { label: "Em Preparo", variant: "secondary" },
    aguarda_retirada: { label: "Aguarda Retirada", variant: "outline" },
    em_transito: { label: "Em Trânsito", variant: "outline" },
    concluido: { label: "Concluído", variant: "default" },
    cancelado: { label: "Cancelado", variant: "destructive" }
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={cn("whitespace-nowrap", status === 'confirmado' && 'bg-info/10 text-info border-info/20')}>
      {status === 'confirmado' && <CalendarClock className="h-3 w-3 mr-1" />}
      {config.label}
    </Badge>
  );
};
