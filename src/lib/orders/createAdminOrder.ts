import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { AdminOrderCreated, AdminOrderRequest } from './adminOrderRequest';

/** order: pedido criado, ou null na falha. message: texto do servidor para recusas (4xx),
 *  senão null (a tela mostra a mensagem genérica). */
export interface AdminOrderResult {
  order: AdminOrderCreated | null;
  message: string | null;
  code: string | null;
}

/** Cria o pedido do painel pela função admin-create-order (usa o login do usuário; sem retry). */
export async function createAdminOrder(body: AdminOrderRequest): Promise<AdminOrderResult> {
  const { data, error } = await supabase.functions.invoke<AdminOrderCreated>('admin-create-order', { body });
  if (!error && data?.order_id) return { order: data, message: null, code: null };

  let message: string | null = null;
  let code: string | null = null;
  if (error instanceof FunctionsHttpError) {
    const status = error.context?.status ?? 0;
    try {
      const payload = await error.context.json();
      code = payload?.code ?? null;
      if (status >= 400 && status < 500 && payload?.error) message = String(payload.error);
    } catch {
      // corpo não é JSON
    }
  }
  console.error('[admin-create-order] falha ao criar pedido:', code, error);
  return { order: null, message, code };
}
