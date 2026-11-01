// Pedido do totem conferido e criado pelo servidor, com Pix ligado ao pedido.
// Ações:
//  - create: confere loja (totem ligado), produtos e adicionais pelo catálogo, calcula o total no servidor,
//            grava o pedido "aguardando_pagamento" com os itens (estoque baixa pelo gatilho) e gera o Pix
//            do valor do pedido (efi-create-pix-charge, que aplica o split da loja quando houver conta EFI).
//  - status: consulta o Pix na EFI; se CONCLUIDA com valor suficiente, marca pago (o banco passa para
//            em_preparo e cria a senha). O webhook da EFI faz o mesmo se a tela fechar.
//  - cancel: cancela o pedido ainda não pago (estoque volta pelo gatilho).
import { createClient } from "npm:@supabase/supabase-js@2";
import { getPixCharge, openEfiSession } from "../_shared/efi-pix.ts";
import { priceTotemCart, type TotemCartInput } from "../_shared/totem-pricing.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// deno-lint-ignore no-explicit-any
type Any = any;

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

async function createOrder(admin: Any, body: Any) {
  const storeId = String(body?.store_id ?? "");
  if (!UUID_RE.test(storeId)) return json({ error: "Loja inválida" }, 400);
  const items: TotemCartInput[] = Array.isArray(body?.items) ? body.items : [];
  if (!items.length || items.length > 100) return json({ error: "Carrinho vazio" }, 400);

  const [{ data: store }, { data: cfg }] = await Promise.all([
    admin.from("stores").select("id, name, status").eq("id", storeId).maybeSingle(),
    admin.from("store_totem_config").select("is_enabled, pix_timeout_seconds").eq("store_id", storeId).maybeSingle(),
  ]);
  if (!store || !cfg?.is_enabled) return json({ error: "Totem indisponível nesta loja" }, 403);

  const productIds = [...new Set(items.map((i) => String(i?.product_id ?? "")))];
  const addonIds = [...new Set(items.flatMap((i) => (Array.isArray(i?.addon_ids) ? i.addon_ids : []).map(String)))];
  if (productIds.some((id) => !UUID_RE.test(id)) || addonIds.some((id) => !UUID_RE.test(id))) {
    return json({ error: "Item inválido no carrinho", code: "invalid_item" }, 400);
  }
  const [{ data: products }, { data: addons }] = await Promise.all([
    admin.from("products").select("id, store_id, name, price, is_available").in("id", productIds),
    addonIds.length ? admin.from("addons").select("id, store_id, name, price").in("id", addonIds) : Promise.resolve({ data: [] }),
  ]);

  const priced = priceTotemCart(items, storeId, products ?? [], addons ?? []);
  if (!priced.ok) return json({ error: priced.error, code: priced.code }, 409);

  // Cliente (opcional): só o id, pela função do banco
  const phone = String(body?.customer?.phone ?? "").replace(/\D/g, "").slice(0, 13);
  const name = String(body?.customer?.name ?? "").trim().slice(0, 120);
  let customerId: string | null = null;
  if (phone.length >= 10) {
    const { data } = await admin.rpc("find_or_create_customer_by_phone", { p_phone: phone, p_name: name || "Cliente Totem" });
    customerId = (data as string | null) ?? null;
  }

  const { data: numberData } = await admin.rpc("get_next_order_number", { store_uuid: storeId });
  const orderNumber = String(numberData || `T${Date.now().toString().slice(-4)}`);

  const { data: order, error: orderErr } = await admin.from("orders").insert({
    store_id: storeId,
    order_number: orderNumber,
    status: "aguardando_pagamento",
    payment_status: "pending",
    payment_method: "pix",
    delivery_type: "pickup",
    source: "totem",
    subtotal: priced.total,
    total: priced.total,
    delivery_fee: 0,
    customer_id: customerId,
    customer_name: name || "Cliente Totem",
    customer_phone: phone,
    external_data: { totem: true },
  }).select("id, order_number, total").single();
  if (orderErr || !order) {
    console.error("[totem-order] erro ao gravar pedido", orderErr);
    return json({ error: "Não foi possível registrar o pedido" }, 500);
  }

  // Itens e adicionais (o gatilho do banco baixa o estoque)
  for (const line of priced.lines) {
    const { data: item, error: itemErr } = await admin.from("order_items").insert({
      order_id: order.id, store_id: storeId, product_id: line.product_id, product_name: line.product_name,
      quantity: line.quantity, unit_price: line.unit_price, subtotal: line.subtotal, notes: line.notes,
    }).select("id").single();
    if (itemErr || !item) {
      console.error("[totem-order] erro ao gravar item", itemErr);
      await admin.from("orders").update({ status: "cancelado", payment_status: "cancelled", cancellation_reason: "Erro ao gravar itens do totem" }).eq("id", order.id);
      return json({ error: "Não foi possível registrar o pedido" }, 500);
    }
    if (line.addons.length) {
      await admin.from("order_addons").insert(line.addons.map((a) => ({
        order_item_id: item.id, addon_id: a.id, addon_name: a.name, quantity: line.quantity, unit_price: a.price, subtotal: a.price * line.quantity,
      })));
    }
  }

  if (customerId) {
    // Etiqueta de canal "Totem" (cria a etiqueta do sistema se a loja ainda não tiver)
    const { data: label } = await admin.from("customer_labels").select("id").eq("store_id", storeId).eq("name", "Totem").maybeSingle();
    let labelId = label?.id as string | undefined;
    if (!labelId) {
      const { data: created } = await admin.from("customer_labels")
        .insert({ store_id: storeId, name: "Totem", color: "#8b5cf6", is_system: true, label_type: "channel" }).select("id").maybeSingle();
      labelId = created?.id;
    }
    if (labelId) {
      await admin.from("customer_label_assignments").upsert(
        { customer_id: customerId, label_id: labelId, store_id: storeId },
        { onConflict: "customer_id,label_id", ignoreDuplicates: true },
      );
    }
  }

  // Pix do valor do pedido (a função de cobrança lê o total do pedido e aplica o split da loja)
  const expiration = Math.min(Math.max(Number(cfg.pix_timeout_seconds) || 300, 60), 1800);
  const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/efi-create-pix-charge`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
    body: JSON.stringify({ order_id: order.id, descricao: `Pedido ${order.order_number} - ${store.name}`.slice(0, 140), expiracao_segundos: expiration }),
  });
  const pix = await res.json().catch(() => ({}));
  if (!res.ok || !pix?.success || !pix?.txid) {
    console.error("[totem-order] erro ao gerar Pix", res.status, pix?.error);
    await admin.from("orders").update({ status: "cancelado", payment_status: "cancelled", cancellation_reason: "Erro ao gerar Pix do totem" }).eq("id", order.id);
    return json({ error: "Não foi possível gerar o Pix. Tente novamente." }, 502);
  }

  return json({
    order_id: order.id,
    order_number: order.order_number,
    total: Number(order.total),
    txid: pix.txid,
    qrcode: pix.qrCodeBase64,
    pix_copia_e_cola: pix.pixCopiaECola,
    expires_in: Number(pix.expiracao) || expiration,
  });
}

async function orderStatus(admin: Any, body: Any) {
  const id = String(body?.order_id ?? "");
  if (!UUID_RE.test(id)) return json({ error: "Pedido inválido" }, 400);
  const { data: order } = await admin.from("orders")
    .select("id, order_number, status, payment_status, total, payment_details, source").eq("id", id).maybeSingle();
  if (!order || order.source !== "totem") return json({ error: "Pedido não encontrado" }, 404);
  if (order.payment_status === "paid") return json({ paid: true, order_number: order.order_number });
  if (order.status === "cancelado") return json({ paid: false, cancelled: true });

  const txid = order.payment_details?.pix_txid;
  if (!txid) return json({ paid: false });
  const efi = await openEfiSession(admin);
  try {
    const cob = await getPixCharge(efi, txid);
    if (cob?.status === "CONCLUIDA" && Array.isArray(cob.pix) && cob.pix.length) {
      const received = cob.pix.reduce((s: number, p: Any) => s + Number(p.valor || 0), 0);
      if (received + 0.01 >= Number(order.total)) {
        const first = cob.pix[0];
        await admin.from("orders").update({
          payment_status: "paid",
          payment_details: { pix_txid: txid, endToEndId: first?.endToEndId ?? null, valor: received.toFixed(2), pago_em: first?.horario ?? null },
        }).eq("id", order.id).eq("payment_status", "pending");
        return json({ paid: true, order_number: order.order_number });
      }
      console.warn(`[totem-order] Pix ${txid}: recebido ${received}, esperado ${order.total}`);
    }
    return json({ paid: false, pix_status: cob?.status ?? null });
  } finally {
    efi.client.close();
  }
}

async function cancelOrder(admin: Any, body: Any) {
  const id = String(body?.order_id ?? "");
  if (!UUID_RE.test(id)) return json({ error: "Pedido inválido" }, 400);
  const { data } = await admin.from("orders")
    .update({ status: "cancelado", payment_status: "cancelled", cancelled_at: new Date().toISOString(), cancellation_reason: "Pix do totem não pago" })
    .eq("id", id).eq("source", "totem").eq("status", "aguardando_pagamento").eq("payment_status", "pending")
    .select("id");
  return json({ cancelled: (data ?? []).length > 0 });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = await req.json().catch(() => ({}));
    switch (body?.action) {
      case "create": return await createOrder(admin, body);
      case "status": return await orderStatus(admin, body);
      case "cancel": return await cancelOrder(admin, body);
      default: return json({ error: "Ação inválida" }, 400);
    }
  } catch (e) {
    console.error("[totem-order]", e);
    return json({ error: "Erro interno" }, 500);
  }
});
