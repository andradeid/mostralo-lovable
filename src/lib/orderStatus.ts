import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

interface UpdateOrderStatusParams {
  orderId: string;
  status?: OrderStatus;
  cancellationReason?: string;
  estimatedDeliveryMinutes?: number;
  assignedDriverId?: string | null;
  whatsappNotified?: boolean;
  whatsappNotifiedAt?: string;
  updateOnly?: boolean;
}

interface UpdateOrderStatusResult {
  success: boolean;
  error?: string;
}

export async function updateOrderStatus(params: UpdateOrderStatusParams): Promise<UpdateOrderStatusResult> {
  try {
    const { data, error } = await supabase.functions.invoke("order-status-update", {
      body: params,
    });

    if (error) {
      // For FunctionsHttpError, the response body may contain the real error
      let errorMsg = error.message || "Não foi possível atualizar o pedido.";
      
      // Try to extract error from the response context  
      if (error.context && typeof error.context === 'object') {
        try {
          const resp = error.context as Response;
          if (resp.json) {
            const body = await resp.json();
            if (body?.error) errorMsg = body.error;
          }
        } catch {
          // ignore parse errors
        }
      }

      console.error('[updateOrderStatus] error:', errorMsg, error);
      return { success: false, error: errorMsg };
    }

    if (!data?.success) {
      return {
        success: false,
        error: data?.error || "Não foi possível atualizar o pedido.",
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[updateOrderStatus] unexpected error:', err);
    return { success: false, error: err?.message || "Erro inesperado ao atualizar pedido." };
  }
}