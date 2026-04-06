import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const ALLOWED_STATUSES = new Set([
  'aguardando_pagamento',
  'entrada',
  'em_preparo',
  'aguarda_retirada',
  'em_transito',
  'concluido',
  'cancelado',
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ success: false, error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ success: false, error: 'Missing authorization header' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: { Authorization: authHeader },
    },
  });

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();

  if (authError || !user) {
    console.error('[order-status-update] auth error', authError);
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  const body = await req.json().catch(() => null);
  const orderId = body?.orderId;
  const status = body?.status;
  const cancellationReason = body?.cancellationReason;
  const estimatedDeliveryMinutes = body?.estimatedDeliveryMinutes;

  if (!orderId || !status) {
    return json({ success: false, error: 'orderId e status são obrigatórios' }, 400);
  }

  if (!ALLOWED_STATUSES.has(status)) {
    return json({ success: false, error: 'Status inválido' }, 400);
  }

  const { data: order, error: orderError } = await adminClient
    .from('orders')
    .select('id, status, store_id')
    .eq('id', orderId)
    .maybeSingle();

  if (orderError || !order) {
    console.error('[order-status-update] order lookup error', orderError);
    return json({ success: false, error: 'Pedido não encontrado' }, 404);
  }

  const [{ data: roles, error: rolesError }, { data: store, error: storeError }] = await Promise.all([
    adminClient
      .from('user_roles')
      .select('role, store_id')
      .eq('user_id', user.id),
    adminClient
      .from('stores')
      .select('owner_id')
      .eq('id', order.store_id)
      .maybeSingle(),
  ]);

  if (rolesError || storeError) {
    console.error('[order-status-update] permission lookup error', { rolesError, storeError });
    return json({ success: false, error: 'Erro ao validar permissões' }, 500);
  }

  const normalizedRoles = roles ?? [];
  const isMasterAdmin = normalizedRoles.some((role) => role.role === 'master_admin');
  const isStoreAdmin = normalizedRoles.some(
    (role) => role.role === 'store_admin' && role.store_id === order.store_id,
  );
  const isAttendant = normalizedRoles.some(
    (role) => role.role === 'attendant' && role.store_id === order.store_id,
  );
  const isOwner = store?.owner_id === user.id;

  let hasOrderPermission = false;
  if (isAttendant) {
    const { data: canManageOrders, error: permissionError } = await adminClient.rpc(
      'attendant_has_permission',
      {
        _user_id: user.id,
        _store_id: order.store_id,
        _permission_key: 'pedidos_delivery',
      },
    );

    if (permissionError) {
      console.error('[order-status-update] attendant permission error', permissionError);
      return json({ success: false, error: 'Erro ao validar permissão do atendente' }, 500);
    }

    hasOrderPermission = !!canManageOrders;
  }

  if (!(isMasterAdmin || isOwner || isStoreAdmin || hasOrderPermission)) {
    return json({ success: false, error: 'Sem permissão para atualizar este pedido' }, 403);
  }

  if ((order.status === 'cancelado' || order.status === 'concluido') && order.status !== status) {
    return json({ success: false, error: 'Este pedido não pode mais ser alterado' }, 400);
  }

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = {
    status,
    updated_at: now,
  };

  if (typeof estimatedDeliveryMinutes === 'number' && Number.isFinite(estimatedDeliveryMinutes)) {
    updateData.estimated_delivery_minutes = estimatedDeliveryMinutes;
  }

  if (status === 'cancelado') {
    updateData.cancelled_at = now;
    updateData.cancellation_reason = cancellationReason || 'Cancelado pelo operador';
  }

  if (status === 'concluido') {
    updateData.completed_at = now;
  }

  const { data: updatedOrder, error: updateError } = await adminClient
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select('id, status, updated_at, cancelled_at, completed_at, estimated_delivery_minutes, cancellation_reason')
    .single();

  if (updateError) {
    console.error('[order-status-update] update error', updateError);
    return json({ success: false, error: updateError.message }, 500);
  }

  return json({ success: true, order: updatedOrder });
});