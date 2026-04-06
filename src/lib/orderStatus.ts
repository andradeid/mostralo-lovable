import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface UpdateOrderStatusParams {
  orderId: string;
  status: OrderStatus;
  cancellationReason?: string;
  estimatedDeliveryMinutes?: number;
}

interface UpdateOrderStatusResult {
  success: boolean;
  error?: string;
}

export async function updateOrderStatus({
  orderId,
  status,
  cancellationReason,
  estimatedDeliveryMinutes,
}: UpdateOrderStatusParams): Promise<UpdateOrderStatusResult> {
  const { data, error } = await supabase.functions.invoke("order-status-update", {
    body: {
      orderId,
      status,
      cancellationReason,
      estimatedDeliveryMinutes,
    },
  });

  if (error) {
    return {
      success: false,
      error: error.message || "Não foi possível atualizar o pedido.",
    };
  }

  if (!data?.success) {
    return {
      success: false,
      error: data?.error || "Não foi possível atualizar o pedido.",
    };
  }

  return { success: true };
}