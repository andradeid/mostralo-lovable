// "Novo pedido" do painel da loja (CreateOrderDialog), gravado pelo servidor.
// - Quem chama precisa estar logado e poder operar a loja (_can_operate_store: dono, admin da loja,
//   master ou atendente), conferido com o token do próprio usuário.
// - Preços do catálogo (variação, oferta, adicionais) por _shared/admin-order.ts; a taxa de entrega é a
//   informada pelo lojista (fica registrada em external_data.manual_order com a taxa padrão da loja).
// - Grava pedido (número por get_next_order_number), itens (estoque baixa pelo gatilho), adicionais,
//   atribuição do entregador e etiquetas de canal do cliente, como o painel fazia no navegador.
// Recebe: AdminOrderRequest. Devolve: { order_id, order_number, subtotal, delivery_fee, total }.
// Erros: { error, code } (400 dados, 401/403 acesso, 409 catálogo, 500 servidor).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import {
  adminOrderLabels,
  adminOrderTotals,
  CHANNEL_LABEL_COLORS,
  catalogIds,
  parseAdminOrderRequest,
  priceAdminOrder,
} from "../_shared/admin-order.ts";

// deno-lint-ignore no-explicit-any
type Any = any;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const err = (status: number, error: string, code: string) => json({ error, code }, status);

async function cancelBroken(admin: Any, orderId: string, reason: string) {
  // Itens já gravados voltam ao estoque pelo gatilho de cancelamento
  await admin.from("orders")
    .update({ status: "cancelado", cancelled_at: new Date().toISOString(), cancellation_reason: reason })
    .eq("id", orderId);
}

async function applyChannelLabels(admin: Any, storeId: string, customerId: string, names: string[]) {
  for (const name of names) {
    try {
      const { data: label } = await admin.from("customer_labels").select("id").eq("store_id", storeId).eq("name", name).maybeSingle();
      let labelId = label?.id as string | undefined;
      if (!labelId) {
        const { data: created } = await admin.from("customer_labels")
          .insert({ store_id: storeId, name, color: CHANNEL_LABEL_COLORS[name] ?? "#6b7280", is_system: true, label_type: "channel" })
          .select("id").maybeSingle();
        labelId = created?.id;
      }
      if (labelId) {
        await admin.from("customer_label_assignments").upsert(
          { customer_id: customerId, label_id: labelId, store_id: storeId },
          { onConflict: "customer_id,label_id", ignoreDuplicates: true },
        );
      }
    } catch (e) {
      console.error(`[admin-create-order] etiqueta "${name}"`, e);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return err(405, "Método não permitido.", "method_not_allowed");

  try {
    const body = await req.json().catch(() => null);
    const parsed = parseAdminOrderRequest(body);
    if (!parsed.ok) return err(parsed.status, parsed.error, parsed.code);
    const input = parsed.req;
    const storeId = input.store_id;

    // ── Acesso: usuário do JWT e permissão de operar a loja (com o token dele) ──
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) return err(401, "Faça login para criar pedidos.", "unauthorized");
    const url = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return err(401, "Sessão expirada. Entre de novo para criar pedidos.", "unauthorized");
    const { data: canOperate, error: accessError } = await userClient.rpc("_can_operate_store", { p_store_id: storeId });
    if (accessError) {
      console.error("[admin-create-order] erro ao conferir acesso", accessError);
      return err(500, "Não foi possível conferir seu acesso à loja. Tente novamente.", "access_check_failed");
    }
    if (canOperate !== true) return err(403, "Você não tem acesso para criar pedidos nesta loja.", "forbidden");

    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ── Loja, cliente, entregador e catálogo ──
    const ids = catalogIds(input.items);
    const [storeRes, customerRes, linkRes, driverRes, productsRes, variantsRes, addonsRes, linksRes] = await Promise.all([
      admin.from("stores").select("id, delivery_fee").eq("id", storeId).maybeSingle(),
      admin.from("customers").select("id").eq("id", input.customer.id).maybeSingle(),
      admin.from("customer_stores").select("id").eq("customer_id", input.customer.id).eq("store_id", storeId).maybeSingle(),
      input.driver_id
        ? admin.from("user_roles").select("user_id").eq("user_id", input.driver_id).eq("store_id", storeId).eq("role", "delivery_driver").limit(1)
        : Promise.resolve({ data: [], error: null }),
      admin.from("products").select("id, store_id, name, price, offer_price, is_on_offer, is_available").in("id", ids.productIds),
      ids.variantIds.length
        ? admin.from("product_variants").select("id, product_id, name, price, is_available").in("id", ids.variantIds)
        : Promise.resolve({ data: [], error: null }),
      ids.addonIds.length
        ? admin.from("addons").select("id, store_id, name, price, is_available").in("id", ids.addonIds)
        : Promise.resolve({ data: [], error: null }),
      ids.addonIds.length
        ? admin.from("product_addons").select("product_id, addon_id").in("product_id", ids.productIds).in("addon_id", ids.addonIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    for (const r of [storeRes, customerRes, linkRes, driverRes, productsRes, variantsRes, addonsRes, linksRes] as Any[]) {
      if (r.error) {
        console.error("[admin-create-order] erro ao ler dados", r.error);
        return err(500, "Erro ao conferir o pedido. Tente novamente.", "lookup_failed");
      }
    }
    if (!storeRes.data) return err(404, "Loja não encontrada.", "store_not_found");
    if (!customerRes.data) return err(409, "Cliente não encontrado. Selecione o cliente de novo.", "customer_not_found");
    if (input.driver_id && !(driverRes.data ?? []).length) {
      return err(409, "Entregador não encontrado nesta loja. Escolha outro.", "invalid_driver");
    }

    const priced = priceAdminOrder(input.items, storeId, {
      products: productsRes.data ?? [],
      variants: variantsRes.data ?? [],
      addons: addonsRes.data ?? [],
      productAddons: linksRes.data ?? [],
    });
    if (!priced.ok) return err(priced.status, priced.error, priced.code);
    const totals = adminOrderTotals(priced.subtotal, input.delivery_type, input.delivery_fee);

    // Cliente achado pelo telefone (chat) pode ainda não estar ligado a esta loja
    if (!linkRes.data) {
      const { error: linkError } = await admin.from("customer_stores")
        .upsert({ customer_id: input.customer.id, store_id: storeId }, { onConflict: "customer_id,store_id", ignoreDuplicates: true });
      if (linkError) console.error("[admin-create-order] erro ao ligar cliente à loja", linkError);
    }

    // ── Número e pedido ──
    const { data: orderNumber, error: numberError } = await admin.rpc("get_next_order_number", { store_uuid: storeId });
    if (numberError || !orderNumber) {
      console.error("[admin-create-order] erro no número do pedido", numberError);
      return err(500, "Não foi possível gerar o número do pedido. Tente novamente.", "order_number_failed");
    }

    const isDelivery = input.delivery_type === "delivery";
    const { data: order, error: orderError } = await admin.from("orders").insert({
      order_number: orderNumber,
      store_id: storeId,
      customer_id: input.customer.id,
      customer_name: input.customer.name,
      customer_phone: input.customer.phone,
      customer_email: input.customer.email,
      customer_address: isDelivery ? input.customer.address : null,
      delivery_type: input.delivery_type,
      payment_method: input.payment_method,
      payment_details: input.payment_details,
      payment_status: input.payment_status,
      status: "entrada",
      source: input.source,
      subtotal: totals.subtotal,
      delivery_fee: totals.delivery_fee,
      total: totals.total,
      notes: input.notes,
      assigned_driver_id: isDelivery ? input.driver_id : null,
      external_data: {
        manual_order: {
          created_by: user.id,
          delivery_fee_informed: totals.delivery_fee,
          store_default_delivery_fee: Number(storeRes.data.delivery_fee) || 0,
        },
      },
    }).select("id, order_number").single();
    if (orderError || !order) {
      console.error("[admin-create-order] erro ao gravar pedido", orderError);
      if ((orderError as Any)?.code === "P0001") return err(400, orderError!.message, "order_rejected");
      return err(500, "Não foi possível registrar o pedido. Tente novamente.", "order_insert_failed");
    }

    // ── Etiquetas de canal e entregador (falhas não desfazem o pedido, como antes) ──
    await applyChannelLabels(admin, storeId, input.customer.id, adminOrderLabels(input.source, input.delivery_type));
    if (isDelivery && input.driver_id) {
      const { error: assignmentError } = await admin.from("delivery_assignments").insert({
        order_id: order.id,
        delivery_driver_id: input.driver_id,
        store_id: storeId,
        status: "assigned",
        assigned_at: new Date().toISOString(),
      });
      if (assignmentError) console.error("[admin-create-order] erro ao criar atribuição", assignmentError);
    }

    // ── Itens (o gatilho baixa o estoque) e adicionais ──
    for (const line of priced.items) {
      const { data: item, error: itemError } = await admin.from("order_items").insert({
        order_id: order.id,
        store_id: storeId,
        product_id: line.product_id,
        product_name: line.product_name,
        quantity: line.quantity,
        unit_price: line.unit_price,
        subtotal: line.subtotal,
        notes: line.notes,
      }).select("id").single();
      if (itemError || !item) {
        console.error("[admin-create-order] erro ao gravar item", itemError);
        await cancelBroken(admin, order.id, "Erro ao gravar itens do pedido do painel");
        return err(500, "Não foi possível registrar os itens do pedido. Tente novamente.", "items_insert_failed");
      }
      if (line.addons.length) {
        const { error: addonsError } = await admin.from("order_addons").insert(line.addons.map((a) => ({
          order_item_id: item.id,
          addon_id: a.addon_id,
          addon_name: a.addon_name,
          quantity: a.quantity,
          unit_price: a.unit_price,
          subtotal: a.subtotal,
        })));
        if (addonsError) {
          console.error("[admin-create-order] erro ao gravar adicionais", addonsError);
          await cancelBroken(admin, order.id, "Erro ao gravar adicionais do pedido do painel");
          return err(500, "Não foi possível registrar os adicionais do pedido. Tente novamente.", "addons_insert_failed");
        }
      }
    }

    console.info("[admin-create-order] pedido criado", JSON.stringify({ order_id: order.id, store_id: storeId, user_id: user.id, total: totals.total }));
    return json({ order_id: order.id, order_number: order.order_number, ...totals });
  } catch (e) {
    console.error("[admin-create-order]", e);
    return err(500, "Erro interno ao criar o pedido. Tente novamente.", "internal_error");
  }
});
