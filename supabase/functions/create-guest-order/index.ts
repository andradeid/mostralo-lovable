import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Instância reutilizável entre invocações (reduz cold starts)
const url = Deno.env.get("SUPABASE_URL")!;
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(url, key);

const respond = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOLERANCE = 0.05; // centavos de arredondamento entre navegador e servidor
const round2 = (n: number) => Math.round(n * 100) / 100;
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const PRICE_CHANGED_MSG =
  "Os preços do seu carrinho mudaram. Atualize a página e confira o pedido antes de enviar.";

/**
 * Id do item no carrinho: "<produto>" | "<produto>_<variação>" | "<produto>_<variação|default>_<JSON dos adicionais>"
 * JSON dos adicionais: { [categoriaId]: { [adicionalId]: quantidade } }
 */
function parseItemId(id: string) {
  const s = String(id ?? "");
  const first = s.indexOf("_");
  if (first < 0) return { productId: s.trim(), variantId: null as string | null, addons: {} as Record<string, number> };
  const productId = s.slice(0, first).trim();
  const rest = s.slice(first + 1);
  const second = rest.indexOf("_");
  const variantPart = second < 0 ? rest : rest.slice(0, second);
  const addonsPart = second < 0 ? "" : rest.slice(second + 1);
  const variantId = UUID_RE.test(variantPart) ? variantPart : null;
  const addons: Record<string, number> = {};
  if (addonsPart) {
    try {
      const parsed = JSON.parse(addonsPart) as Record<string, Record<string, number>>;
      for (const group of Object.values(parsed || {})) {
        for (const [addonId, qty] of Object.entries(group || {})) {
          const q = num(qty);
          if (UUID_RE.test(addonId) && q > 0) addons[addonId] = (addons[addonId] || 0) + q;
        }
      }
    } catch {
      // adicionais ilegíveis: tratados como nenhum (só pode encarecer, nunca baratear)
    }
  }
  return { productId, variantId, addons };
}

const inPeriod = (p: any, now: Date) => {
  if (p.start_date && new Date(p.start_date) > now) return false;
  if (p.end_date && new Date(p.end_date) < now) return false;
  return true;
};

/**
 * Edge Function: create-guest-order-v2
 * Igual à create-guest-order, mas confere no servidor preços, adicionais,
 * taxa de entrega e desconto antes de gravar. Subtotal e total passam a ser
 * calculados aqui, não aceitos do navegador.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      store_id,
      customer_id,
      customer_name,
      customer_phone,
      customer_email,
      customer_address,
      delivery_type,
      payment_method,
      payment_details,
      delivery_fee,
      notes,
      scheduled_for,
      promotion_id,
      promotion_code,
      promotion_discount,
      is_outside_delivery_zone,
      requires_zone_approval,
      items,
    } = body;

    // Validação rápida (zero DB)
    if (!store_id || !customer_id || !customer_name || !customer_phone) {
      return respond({ error: "Campos obrigatórios: store_id, customer_id, customer_name, customer_phone" }, 400);
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return respond({ error: "Pelo menos um item é obrigatório." }, 400);
    }
    for (const it of items) {
      const q = Number(it?.quantity);
      if (!Number.isInteger(q) || q < 1 || q > 999 || !Number.isFinite(Number(it?.price)) || Number(it?.price) < 0) {
        return respond({ error: "Item inválido no carrinho." }, 400);
      }
    }

    console.info("[create-guest-order-v2] store:", store_id, "customer:", customer_id);

    // ── DEDUP: Verificar se já existe pedido do mesmo cliente nos últimos 30s ──
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
    const { data: recentOrder } = await admin
      .from("orders")
      .select("id, order_number, status")
      .eq("store_id", store_id)
      .eq("customer_id", customer_id)
      .gte("created_at", thirtySecondsAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentOrder) {
      console.info("[create-guest-order-v2] DEDUP: pedido recente encontrado:", recentOrder.id);
      return respond({
        success: true,
        order_id: recentOrder.id,
        order_number: recentOrder.order_number,
        status: recentOrder.status,
        deduplicated: true,
      }, 200);
    }

    // ── VALIDAÇÃO DE PREÇOS (catálogo do servidor) ──
    const parsedItems = items.map((it: any) => ({ raw: it, ...parseItemId(it.id) }));
    if (parsedItems.some((p: any) => !UUID_RE.test(p.productId))) {
      return respond({ error: PRICE_CHANGED_MSG, code: "unknown_product" }, 409);
    }
    const productIds = [...new Set(parsedItems.map((p: any) => p.productId))];
    const variantIds = [...new Set(parsedItems.map((p: any) => p.variantId).filter(Boolean))];
    const addonIds = [...new Set(parsedItems.flatMap((p: any) => Object.keys(p.addons)))];

    const [productsRes, variantsRes, addonsRes, promosRes, configRes] = await Promise.all([
      admin.from("products").select("id, store_id, price, offer_price, is_on_offer, is_available").in("id", productIds),
      variantIds.length
        ? admin.from("product_variants").select("id, product_id, price").in("id", variantIds)
        : Promise.resolve({ data: [], error: null }),
      addonIds.length
        ? admin.from("addons").select("id, store_id, price").in("id", addonIds)
        : Promise.resolve({ data: [], error: null }),
      admin.from("promotions").select("*").eq("store_id", store_id).eq("status", "active"),
      admin.from("store_configurations").select("delivery_zones, accept_outside_delivery_zone").eq("store_id", store_id).maybeSingle(),
    ]);
    for (const r of [productsRes, variantsRes, addonsRes, promosRes, configRes]) {
      if ((r as any).error) {
        console.error("[create-guest-order-v2] catalog error:", JSON.stringify((r as any).error));
        return respond({ error: "Erro ao conferir o pedido. Tente novamente." }, 500);
      }
    }

    const now = new Date();
    const products = new Map((productsRes.data || []).map((p: any) => [p.id, p]));
    const variants = new Map((variantsRes.data || []).map((v: any) => [v.id, v]));
    const addonPrices = new Map(
      (addonsRes.data || []).filter((a: any) => a.store_id === store_id).map((a: any) => [a.id, num(a.price)]),
    );
    const activePromos = (promosRes.data || []).filter((p: any) => inPeriod(p, now));

    // Produtos cobertos por promoções de produto específico (preço já vem com desconto no carrinho)
    const specificPromos = activePromos.filter((p: any) => p.scope === "specific_products");
    const promoProductMap = new Map<string, any[]>();
    if (specificPromos.length) {
      const { data: pp } = await admin
        .from("promotion_products")
        .select("promotion_id, product_id")
        .in("promotion_id", specificPromos.map((p: any) => p.id));
      for (const row of pp || []) {
        const promo = specificPromos.find((p: any) => p.id === row.promotion_id);
        if (!promo) continue;
        const list = promoProductMap.get(row.product_id) || [];
        list.push(promo);
        promoProductMap.set(row.product_id, list);
      }
    }

    const validatedItems: any[] = [];
    for (const it of parsedItems) {
      const product: any = products.get(it.productId);
      if (!product || product.store_id !== store_id || product.is_available === false) {
        console.warn("[create-guest-order-v2] produto indisponível:", it.productId);
        return respond({
          error: "Um produto do seu carrinho não está mais disponível. Atualize a página e confira o pedido.",
          code: "product_unavailable",
        }, 409);
      }
      const variant: any = it.variantId ? variants.get(it.variantId) : null;
      if (it.variantId && (!variant || variant.product_id !== product.id)) {
        return respond({ error: PRICE_CHANGED_MSG, code: "unknown_variant" }, 409);
      }

      // Menor preço base legítimo: variação, oferta ou preço normal
      const candidates = [num(product.price)];
      if (product.is_on_offer && num(product.offer_price) > 0) candidates.push(num(product.offer_price));
      if (variant) candidates.push(num(variant.price));
      let minBase = Math.min(...candidates);

      // Promoções de produto específico ativas podem baixar o preço do item
      for (const promo of promoProductMap.get(product.id) || []) {
        const pct = num(promo.discount_percentage);
        const amt = num(promo.discount_amount);
        if (pct > 0) minBase = Math.min(minBase, minBase * (1 - pct / 100));
        if (amt > 0) minBase = Math.min(minBase, Math.max(0, minBase - amt));
      }

      let addonsTotal = 0;
      for (const [addonId, qty] of Object.entries(it.addons)) {
        addonsTotal += (addonPrices.get(addonId) ?? 0) * (qty as number);
      }

      const minUnit = round2(Math.max(0, minBase) + addonsTotal);
      const clientUnit = round2(num(it.raw.price));
      if (clientUnit + TOLERANCE < minUnit) {
        console.warn("[create-guest-order-v2] PREÇO ABAIXO DO CATÁLOGO", JSON.stringify({
          store_id, customer_id, item: it.raw.id, client: clientUnit, min: minUnit,
        }));
        return respond({ error: PRICE_CHANGED_MSG, code: "price_mismatch" }, 409);
      }

      validatedItems.push({ ...it.raw, price: clientUnit, quantity: Number(it.raw.quantity), product_id: product.id });
    }

    const serverSubtotal = round2(validatedItems.reduce((s, i) => s + i.price * i.quantity, 0));

    // ── TAXA DE ENTREGA: não pode ficar abaixo da menor taxa configurada ──
    let serverDeliveryFee = delivery_type === "delivery" ? round2(Math.max(0, num(delivery_fee))) : 0;
    if (delivery_type === "delivery") {
      const zones = ((configRes.data as any)?.delivery_zones || []).filter((z: any) => z && z.isActive !== false);
      const acceptsOutside = !!(configRes.data as any)?.accept_outside_delivery_zone;
      if (zones.length && !acceptsOutside) {
        const fees: number[] = [];
        for (const z of zones) {
          fees.push(num(z.deliveryFee));
          for (const tf of z.timeFees || []) fees.push(num(tf.fee));
        }
        const minFee = Math.min(...fees);
        if (serverDeliveryFee + TOLERANCE < minFee) {
          console.warn("[create-guest-order-v2] TAXA ABAIXO DO MÍNIMO", JSON.stringify({ store_id, client: serverDeliveryFee, min: minFee }));
          return respond({ error: PRICE_CHANGED_MSG, code: "fee_mismatch" }, 409);
        }
      }
    }

    // ── PROMOÇÃO: precisa existir, estar ativa e o desconto não pode passar do teto ──
    let serverDiscount = 0;
    let validPromotion: any = null;
    const requestedDiscount = round2(Math.max(0, num(promotion_discount)));
    if (promotion_id) {
      const promo = activePromos.find((p: any) => p.id === promotion_id);
      if (!promo) {
        return respond({ error: "A promoção aplicada não está mais disponível. Atualize a página e tente de novo.", code: "promotion_invalid" }, 409);
      }
      if (promo.code && String(promo.code).toLowerCase() !== String(promotion_code || "").toLowerCase()) {
        return respond({ error: "Cupom inválido.", code: "promotion_code_mismatch" }, 409);
      }
      if (num(promo.minimum_order_value) > 0 && serverSubtotal + TOLERANCE < num(promo.minimum_order_value)) {
        return respond({ error: "O pedido não atinge o valor mínimo da promoção.", code: "promotion_minimum" }, 409);
      }
      if (promo.max_uses && num(promo.current_uses) >= num(promo.max_uses)) {
        return respond({ error: "Esta promoção já atingiu o limite de usos.", code: "promotion_limit" }, 409);
      }
      if (promo.first_order_only || promo.max_uses_per_customer) {
        const [{ count: previousOrders }, { count: customerUses }] = await Promise.all([
          admin.from("orders").select("id", { count: "exact", head: true })
            .eq("store_id", store_id).eq("customer_id", customer_id).neq("status", "cancelado"),
          admin.from("promotion_usage").select("id", { count: "exact", head: true })
            .eq("promotion_id", promo.id).eq("customer_id", customer_id),
        ]);
        if (promo.first_order_only && (previousOrders || 0) > 0) {
          return respond({ error: "Este cupom vale só para o primeiro pedido.", code: "promotion_first_order" }, 409);
        }
        if (promo.max_uses_per_customer && (customerUses || 0) >= num(promo.max_uses_per_customer)) {
          return respond({ error: "Você já usou esta promoção o número máximo de vezes.", code: "promotion_customer_limit" }, 409);
        }
      }

      const pct = num(promo.discount_percentage);
      const amt = num(promo.discount_amount);
      // Promoção de produto específico sem cupom já está no preço do item:
      // não pode dar desconto de novo no total (evita desconto em dobro)
      const pricedIn = promo.scope === "specific_products" && promo.applies_to_delivery && promo.applies_to_pickup && !promo.code;
      let cap = 0;
      switch (promo.type) {
        case "free_delivery":
          cap = serverDeliveryFee + (pct > 0 ? (serverSubtotal * pct) / 100 : amt);
          break;
        case "bogo": {
          const buy = num(promo.bogo_buy_quantity) || 2;
          const get = num(promo.bogo_get_quantity) || 1;
          const bogoPct = promo.bogo_discount_percentage == null ? 100 : num(promo.bogo_discount_percentage);
          cap = serverSubtotal * Math.min(1, get / buy) * (bogoPct / 100);
          break;
        }
        default:
          cap = pct > 0 ? (serverSubtotal * pct) / 100 : amt;
      }
      cap = round2(Math.min(cap, serverSubtotal + serverDeliveryFee));
      if (pricedIn) {
        if (requestedDiscount > 0) {
          console.warn("[create-guest-order-v2] desconto em dobro ignorado", JSON.stringify({ store_id, promo: promo.id, client: requestedDiscount }));
        }
        cap = 0;
      } else if (requestedDiscount > cap + TOLERANCE) {
        console.warn("[create-guest-order-v2] DESCONTO ACIMA DO TETO", JSON.stringify({ store_id, promo: promo.id, client: requestedDiscount, cap }));
        return respond({ error: PRICE_CHANGED_MSG, code: "discount_mismatch" }, 409);
      }
      serverDiscount = Math.min(requestedDiscount, cap);
      validPromotion = pricedIn ? null : promo;
    } else if (requestedDiscount > 0) {
      return respond({ error: PRICE_CHANGED_MSG, code: "discount_without_promotion" }, 409);
    }

    const serverTotal = round2(Math.max(0, serverSubtotal + serverDeliveryFee - serverDiscount));

    // ── PASSO 1: Paralelizar vínculo + número do pedido ──
    const [linkResult, numberResult] = await Promise.all([
      admin
        .from("customer_stores")
        .select("id")
        .eq("customer_id", customer_id)
        .eq("store_id", store_id)
        .maybeSingle(),
      admin.rpc("get_next_order_number", { store_uuid: store_id }),
    ]);

    if (linkResult.error) {
      console.error("[create-guest-order-v2] link error:", JSON.stringify(linkResult.error));
      return respond({ error: "Erro ao verificar vínculo.", details: linkResult.error.message }, 500);
    }
    if (!linkResult.data) {
      return respond({ error: "Cliente não vinculado a esta loja." }, 403);
    }
    if (numberResult.error) {
      console.error("[create-guest-order-v2] number error:", JSON.stringify(numberResult.error));
      return respond({ error: "Falha ao gerar número do pedido.", details: numberResult.error.message }, 500);
    }

    const orderNumber = numberResult.data;

    // ── PASSO 2: INSERT do pedido (valores calculados no servidor) ──
    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        order_number: orderNumber,
        store_id,
        customer_id,
        customer_name,
        customer_phone,
        customer_email: customer_email || null,
        customer_address: delivery_type === "delivery" ? customer_address : null,
        delivery_type,
        payment_method,
        payment_details: payment_details || null,
        payment_status: "pending",
        status: "entrada",
        source: "cardapio_digital",
        subtotal: serverSubtotal,
        delivery_fee: serverDeliveryFee,
        total: serverTotal,
        notes: notes || null,
        scheduled_for: scheduled_for || null,
        promotion_id: validPromotion?.id || null,
        promotion_code: validPromotion?.code || null,
        promotion_discount: serverDiscount > 0 ? serverDiscount : null,
        is_outside_delivery_zone: is_outside_delivery_zone || false,
        requires_zone_approval: requires_zone_approval || false,
      })
      .select("id, order_number, status")
      .single();

    if (orderError) {
      console.error("[create-guest-order-v2] order insert error:", JSON.stringify(orderError));
      // Regras de encomenda/validação do banco (RAISE EXCEPTION): devolver mensagem pronta
      if ((orderError as any).code === "P0001") {
        return respond({ error: orderError.message }, 400);
      }
      return respond({ error: "Falha ao criar pedido.", details: orderError.message }, 500);
    }

    console.info("[create-guest-order-v2] success:", order.id, "total:", serverTotal);

    // ── PASSO 3: Itens (aguarda: o pedido não pode ficar sem itens) ──
    const orderItems = validatedItems.map((item: any) => ({
      order_id: order.id,
      store_id,
      product_id: item.product_id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: round2(item.price * item.quantity),
      notes: item.notes ?? null,
    }));
    const { error: itemsError } = await admin.from("order_items").insert(orderItems);
    if (itemsError) {
      console.error("[create-guest-order-v2] items error:", JSON.stringify(itemsError));
    }

    // ── PASSO 4: Promoção (não bloqueia resposta) ──
    if (validPromotion) {
      void (async () => {
        try {
          const { error } = await admin.rpc("increment_promotion_usage", { promotion_id_param: validPromotion.id });
          if (error) console.error("[create-guest-order-v2] promo rpc error:", JSON.stringify(error));
        } catch (error) {
          console.error("[create-guest-order-v2] promo rpc fatal:", error);
        }
      })();

      void (async () => {
        try {
          const { error } = await admin.from("promotion_usage").insert({
            promotion_id: validPromotion.id,
            customer_id,
            order_id: order.id,
            discount_applied: serverDiscount,
            promotion_code: validPromotion.code || null,
          });
          if (error) console.error("[create-guest-order-v2] promo insert error:", JSON.stringify(error));
        } catch (error) {
          console.error("[create-guest-order-v2] promo insert fatal:", error);
        }
      })();
    }

    return respond({
      order_id: order.id,
      order_number: order.order_number,
      status: order.status,
      total: serverTotal,
    });
  } catch (err: any) {
    console.error("[create-guest-order-v2] fatal:", err?.message, err?.stack);
    return respond({ error: "Erro interno do servidor.", details: err?.message }, 500);
  }
});
