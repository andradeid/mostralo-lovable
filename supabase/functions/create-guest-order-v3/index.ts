import { createClient } from "npm:@supabase/supabase-js@2";
import { evaluatePromotion, isPricedInPromotion, pricedInUnitPrice, type CorePromotion } from "../_shared/promotion-core.ts";
import { checkFlavors, splitFlavorsFromId } from "../_shared/pizza-flavors.ts";

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


/**
 * Edge Function: create-guest-order-v3
 * Confere no servidor preços, adicionais, taxa de entrega e desconto antes de gravar.
 * As regras de promoção são as MESMAS da loja: núcleo único em _shared/promotion-core.ts
 * (período, dias e horário no fuso da loja, entrega/retirada, escopo por produto/categoria,
 * leve x pague y, frete grátis, 1ª compra, limites). O desconto aceito é o calculado aqui.
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
      customer_token,
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

    console.info("[create-guest-order-v3] store:", store_id, "customer:", customer_id);

    // ── CLIENTE: o token emitido pela customer-auth-v2 precisa ser desta loja e deste cliente ──
    if (!customer_token) {
      return respond({ error: "Sessão do cliente expirada. Atualize a página e tente de novo.", code: "invalid_token" }, 401);
    }
    const { data: tokenRow } = await admin
      .from("customer_tokens")
      .select("id, customer_id")
      .eq("token", customer_token)
      .eq("store_id", store_id)
      .maybeSingle();
    if (!tokenRow || tokenRow.customer_id !== customer_id) {
      console.warn("[create-guest-order-v3] token inválido para o cliente", JSON.stringify({ store_id, customer_id }));
      return respond({ error: "Sessão do cliente expirada. Atualize a página e tente de novo.", code: "invalid_token" }, 401);
    }

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
      console.info("[create-guest-order-v3] DEDUP: pedido recente encontrado:", recentOrder.id);
      return respond({
        success: true,
        order_id: recentOrder.id,
        order_number: recentOrder.order_number,
        status: recentOrder.status,
        deduplicated: true,
      }, 200);
    }

    // ── VALIDAÇÃO DE PREÇOS (catálogo do servidor) ──
    // Pizza com mais de um sabor: o id leva os outros sabores no fim ("~f:<id>,<id>")
    const parsedItems = items.map((it: any) => {
      const { baseId, otherFlavorIds } = splitFlavorsFromId(it.id);
      return { raw: it, ...parseItemId(baseId), otherFlavorIds };
    });
    if (parsedItems.some((p: any) => !UUID_RE.test(p.productId) || p.otherFlavorIds.some((f: string) => !UUID_RE.test(f)) || p.otherFlavorIds.length > 3)) {
      return respond({ error: PRICE_CHANGED_MSG, code: "unknown_product" }, 409);
    }
    const flavorItems = parsedItems.filter((p: any) => p.otherFlavorIds.length > 0);
    const flavorProductIds = [...new Set(flavorItems.flatMap((p: any) => [p.productId, ...p.otherFlavorIds]))];
    const productIds = [...new Set([...parsedItems.map((p: any) => p.productId), ...flavorProductIds])];
    const variantIds = [...new Set(parsedItems.map((p: any) => p.variantId).filter(Boolean))];
    const addonIds = [...new Set(parsedItems.flatMap((p: any) => Object.keys(p.addons)))];

    const [productsRes, variantsRes, addonsRes, promosRes, configRes, storeRes] = await Promise.all([
      admin.from("products").select("id, name, store_id, price, offer_price, is_on_offer, is_available, category_id").in("id", productIds),
      variantIds.length
        ? admin.from("product_variants").select("id, product_id, name, price").in("id", variantIds)
        : Promise.resolve({ data: [], error: null }),
      addonIds.length
        ? admin.from("addons").select("id, store_id, price").in("id", addonIds)
        : Promise.resolve({ data: [], error: null }),
      admin.from("promotions").select("*").eq("store_id", store_id).eq("status", "active"),
      admin.from("store_configurations").select("delivery_zones, accept_outside_delivery_zone").eq("store_id", store_id).maybeSingle(),
      admin.from("stores").select("timezone").eq("id", store_id).maybeSingle(),
    ]);
    // Sabores: todas as variações dos produtos envolvidos e a configuração das categorias
    const [flavorVariantsRes, flavorCatsRes] = flavorItems.length
      ? await Promise.all([
          admin.from("product_variants").select("id, product_id, name, price, is_available").in("product_id", flavorProductIds),
          admin.from("categories").select("id, multi_flavor_enabled, multi_flavor_pricing, multi_flavor_max")
            .in("id", [...new Set((productsRes.data || []).map((p: any) => p.category_id).filter(Boolean))]),
        ])
      : [{ data: [], error: null }, { data: [], error: null }] as any;
    for (const r of [productsRes, variantsRes, addonsRes, promosRes, configRes, storeRes, flavorVariantsRes, flavorCatsRes]) {
      if ((r as any).error) {
        console.error("[create-guest-order-v3] catalog error:", JSON.stringify((r as any).error));
        return respond({ error: "Erro ao conferir o pedido. Tente novamente." }, 500);
      }
    }

    const now = new Date();
    const products = new Map((productsRes.data || []).map((p: any) => [p.id, p]));
    const variants = new Map((variantsRes.data || []).map((v: any) => [v.id, v]));
    const addonPrices = new Map(
      (addonsRes.data || []).filter((a: any) => a.store_id === store_id).map((a: any) => [a.id, num(a.price)]),
    );
    const timeZone = (storeRes.data as any)?.timezone || "America/Sao_Paulo";
    const coreCtx = { now, timeZone };

    // Promoções ativas com os vínculos de produto/categoria (para o núcleo de regras)
    const promoIds = (promosRes.data || []).map((p: any) => p.id);
    const [linkProds, linkCats] = promoIds.length
      ? await Promise.all([
          admin.from("promotion_products").select("promotion_id, product_id").in("promotion_id", promoIds),
          admin.from("promotion_categories").select("promotion_id, category_id").in("promotion_id", promoIds),
        ])
      : [{ data: [] }, { data: [] }] as any;
    const activePromos: CorePromotion[] = (promosRes.data || []).map((p: any) => ({
      ...p,
      product_ids: ((linkProds as any).data || []).filter((r: any) => r.promotion_id === p.id).map((r: any) => r.product_id),
      category_ids: ((linkCats as any).data || []).filter((r: any) => r.promotion_id === p.id).map((r: any) => r.category_id),
    }));
    const pricedInPromos = activePromos.filter((p) => isPricedInPromotion(p));

    const validatedItems: any[] = [];
    for (const it of parsedItems) {
      const product: any = products.get(it.productId);
      if (!product || product.store_id !== store_id || product.is_available === false) {
        console.warn("[create-guest-order-v3] produto indisponível:", it.productId);
        return respond({
          error: "Um produto do seu carrinho não está mais disponível. Atualize a página e confira o pedido.",
          code: "product_unavailable",
        }, 409);
      }
      const variant: any = it.variantId ? variants.get(it.variantId) : null;
      if (it.variantId && (!variant || variant.product_id !== product.id)) {
        return respond({ error: PRICE_CHANGED_MSG, code: "unknown_variant" }, 409);
      }

      let minBase: number;
      let flavors: unknown = null;
      if (it.otherFlavorIds.length) {
        // Pizza montada: preço dos sabores no tamanho escolhido, pela regra da categoria
        const cfg = ((flavorCatsRes as any).data || []).find((c: any) => c.id === product.category_id) ?? null;
        const check = checkFlavors({
          main: product,
          others: it.otherFlavorIds.map((id: string) => products.get(id)).filter(Boolean),
          sizeName: variant?.name ?? null,
          variants: (flavorVariantsRes as any).data || [],
          config: cfg,
          storeId: store_id,
        });
        if (!check.ok || it.otherFlavorIds.some((id: string) => !products.get(id))) {
          console.warn("[create-guest-order-v3] sabores recusados:", JSON.stringify({ item: it.raw.id, code: check.ok ? "missing" : check.code }));
          return respond({ error: PRICE_CHANGED_MSG, code: "invalid_flavors" }, 409);
        }
        minBase = check.price;
        flavors = check.flavors;
      } else {
        // Menor preço base legítimo: variação, oferta ou preço normal
        const candidates = [num(product.price)];
        if (product.is_on_offer && num(product.offer_price) > 0) candidates.push(num(product.offer_price));
        if (variant) candidates.push(num(variant.price));
        minBase = Math.min(...candidates);
      }

      // Desconto "no preço" (produto específico, entrega e retirada, sem cupom) — mesma regra da loja
      minBase = pricedInUnitPrice(minBase, product.id, pricedInPromos, coreCtx);

      let addonsTotal = 0;
      for (const [addonId, qty] of Object.entries(it.addons)) {
        addonsTotal += (addonPrices.get(addonId) ?? 0) * (qty as number);
      }

      const minUnit = round2(Math.max(0, minBase) + addonsTotal);
      const clientUnit = round2(num(it.raw.price));
      if (clientUnit + TOLERANCE < minUnit) {
        console.warn("[create-guest-order-v3] PREÇO ABAIXO DO CATÁLOGO", JSON.stringify({
          store_id, customer_id, item: it.raw.id, client: clientUnit, min: minUnit,
        }));
        return respond({ error: PRICE_CHANGED_MSG, code: "price_mismatch" }, 409);
      }

      validatedItems.push({ ...it.raw, price: clientUnit, quantity: Number(it.raw.quantity), product_id: product.id, category_id: product.category_id ?? null, flavors });
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
          console.warn("[create-guest-order-v3] TAXA ABAIXO DO MÍNIMO", JSON.stringify({ store_id, client: serverDeliveryFee, min: minFee }));
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
      let firstOrderCheck: boolean | null = null;
      let customerUsesCheck: number | null = null;
      if (promo.first_order_only || promo.max_uses_per_customer) {
        const [{ count: previousOrders }, { count: customerUses }] = await Promise.all([
          admin.from("orders").select("id", { count: "exact", head: true })
            .eq("store_id", store_id).eq("customer_id", customer_id).neq("status", "cancelado"),
          admin.from("promotion_usage").select("id", { count: "exact", head: true })
            .eq("promotion_id", promo.id).eq("customer_id", customer_id),
        ]);
        firstOrderCheck = (previousOrders || 0) === 0;
        customerUsesCheck = customerUses || 0;
        if (promo.first_order_only && (previousOrders || 0) > 0) {
          return respond({ error: "Este cupom vale só para o primeiro pedido.", code: "promotion_first_order" }, 409);
        }
        if (promo.max_uses_per_customer && (customerUses || 0) >= num(promo.max_uses_per_customer)) {
          return respond({ error: "Você já usou esta promoção o número máximo de vezes.", code: "promotion_customer_limit" }, 409);
        }
      }

      const result = evaluatePromotion(promo, {
        deliveryType: delivery_type === "pickup" ? "pickup" : "delivery",
        deliveryFee: serverDeliveryFee,
        items: validatedItems.map((i: any) => ({ productId: i.product_id, categoryId: i.category_id, unitPrice: i.price, quantity: i.quantity })),
      }, { ...coreCtx, isFirstOrder: firstOrderCheck, customerUses: customerUsesCheck });
      if (!result.valid && !isPricedInPromotion(promo) && requestedDiscount > 0) {
        return respond({ error: `A promoção não vale para este pedido: ${result.reason}.`, code: "promotion_not_applicable" }, 409);
      }
      const computed = isPricedInPromotion(promo) || !result.valid ? 0 : result.discount;
      if (requestedDiscount > computed + TOLERANCE) {
        console.warn("[create-guest-order-v3] DESCONTO ACIMA DO CALCULADO", JSON.stringify({ store_id, promo: promo.id, client: requestedDiscount, computed }));
        return respond({ error: PRICE_CHANGED_MSG, code: "discount_mismatch" }, 409);
      }
      serverDiscount = round2(Math.min(requestedDiscount, computed));
      validPromotion = isPricedInPromotion(promo) || serverDiscount <= 0 ? null : promo;
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
      console.error("[create-guest-order-v3] link error:", JSON.stringify(linkResult.error));
      return respond({ error: "Erro ao verificar vínculo.", details: linkResult.error.message }, 500);
    }
    if (!linkResult.data) {
      return respond({ error: "Cliente não vinculado a esta loja." }, 403);
    }
    if (numberResult.error) {
      console.error("[create-guest-order-v3] number error:", JSON.stringify(numberResult.error));
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
        customer_token_id: tokenRow.id,
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
      console.error("[create-guest-order-v3] order insert error:", JSON.stringify(orderError));
      // Regras de encomenda/validação do banco (RAISE EXCEPTION): devolver mensagem pronta
      if ((orderError as any).code === "P0001") {
        return respond({ error: orderError.message }, 400);
      }
      return respond({ error: "Falha ao criar pedido.", details: orderError.message }, 500);
    }

    console.info("[create-guest-order-v3] success:", order.id, "total:", serverTotal);

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
      ...(item.flavors ? { flavors: item.flavors } : {}),
    }));
    const { error: itemsError } = await admin.from("order_items").insert(orderItems);
    if (itemsError) {
      console.error("[create-guest-order-v3] items error:", JSON.stringify(itemsError));
    }

    // ── PASSO 4: Promoção (não bloqueia resposta) ──
    if (validPromotion) {
      void (async () => {
        try {
          const { error } = await admin.rpc("increment_promotion_usage", { promotion_id_param: validPromotion.id });
          if (error) console.error("[create-guest-order-v3] promo rpc error:", JSON.stringify(error));
        } catch (error) {
          console.error("[create-guest-order-v3] promo rpc fatal:", error);
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
          if (error) console.error("[create-guest-order-v3] promo insert error:", JSON.stringify(error));
        } catch (error) {
          console.error("[create-guest-order-v3] promo insert fatal:", error);
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
    console.error("[create-guest-order-v3] fatal:", err?.message, err?.stack);
    return respond({ error: "Erro interno do servidor.", details: err?.message }, 500);
  }
});
