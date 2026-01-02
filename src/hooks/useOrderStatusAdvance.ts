import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type Order = Database['public']['Tables']['orders']['Row'];
type OrderStatus = Database['public']['Enums']['order_status'];

const STATUS_ORDER: OrderStatus[] = [
  'entrada',
  'em_preparo',
  'aguarda_retirada',
  'em_transito',
  'concluido'
];

export const getNextStatus = (currentStatus: OrderStatus, deliveryType: string): OrderStatus | null => {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  
  // Se já é concluído ou cancelado, não avança
  if (currentStatus === 'concluido' || currentStatus === 'cancelado') {
    return null;
  }
  
  // Se é retirada e está aguardando retirada, pula para concluído
  if (currentStatus === 'aguarda_retirada' && deliveryType === 'pickup') {
    return 'concluido';
  }
  
  // Avança para próximo status
  if (currentIndex < STATUS_ORDER.length - 1) {
    return STATUS_ORDER[currentIndex + 1];
  }
  
  return null;
};

export const getStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    'entrada': 'Entrada',
    'em_preparo': 'Em Preparo',
    'aguarda_retirada': 'Aguarda Retirada',
    'aguardando_pagamento': 'Aguardando Pagamento',
    'em_transito': 'Em Trânsito',
    'concluido': 'Concluído',
    'cancelado': 'Cancelado'
  };
  return labels[status] || status;
};

export const useOrderStatusAdvance = () => {
  const advanceStatus = async (order: Order): Promise<boolean> => {
    const nextStatus = getNextStatus(order.status, order.delivery_type || 'delivery');
    
    if (!nextStatus) {
      toast.info('Este pedido não pode avançar');
      return false;
    }
    
    // Se é delivery e vai para em_transito, verificar se tem entregador atribuído
    if (nextStatus === 'em_transito' && order.delivery_type === 'delivery' && !order.assigned_driver_id) {
      toast.warning('Atribua um entregador antes de enviar para trânsito');
      return false;
    }
    
    const updateData: any = {
      status: nextStatus,
      updated_at: new Date().toISOString()
    };
    
    if (nextStatus === 'concluido') {
      updateData.completed_at = new Date().toISOString();
    }
    
    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);
    
    if (error) {
      toast.error('Erro ao atualizar status');
      console.error(error);
      return false;
    }
    
    // Vibração de feedback (se suportado)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    toast.success(`Pedido #${order.order_number} → ${getStatusLabel(nextStatus)}`);
    return true;
  };
  
  const cancelOrder = async (order: Order, reason?: string): Promise<boolean> => {
    const updateData: any = {
      status: 'cancelado' as OrderStatus,
      updated_at: new Date().toISOString(),
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason || 'Cancelado pelo operador'
    };
    
    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);
    
    if (error) {
      toast.error('Erro ao cancelar pedido');
      console.error(error);
      return false;
    }
    
    toast.success(`Pedido #${order.order_number} cancelado`);
    return true;
  };
  
  return { advanceStatus, cancelOrder, getNextStatus, getStatusLabel };
};
