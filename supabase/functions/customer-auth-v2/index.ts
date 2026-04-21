import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Normaliza telefone brasileiro para formato canônico (11 dígitos com 9)
 */
function normalizePhoneCanonical(phone: string): string {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("55") && digits.length >= 12) {
    digits = digits.substring(2);
  }

  if (digits.startsWith("0") && digits.length === 12) {
    digits = digits.substring(1);
  }

  if (digits.length === 10) {
    const ddd = digits.substring(0, 2);
    const number = digits.substring(2);
    digits = ddd + "9" + number;
  }

  return digits;
}

/**
 * Gera variantes de telefone para busca tolerante
 */
function getPhoneVariants(phone: string): string[] {
  const variants = new Set<string>();
  const canonical = normalizePhoneCanonical(phone);
  variants.add(canonical);

  // Sem o 9 (10 dígitos)
  if (canonical.length === 11) {
    variants.add(canonical.substring(0, 2) + canonical.substring(3));
  }

  // Com DDI 55
  variants.add("55" + canonical);

  // Original limpo
  const clean = phone.replace(/\D/g, "");
  variants.add(clean);

  return Array.from(variants);
}

function getAdminClient() {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

/**
 * ACTION: resolve-token
 * Recebe token + store_id → retorna dados do cliente
 * Se expirado, faz Regeneração Silenciosa
 */
async function resolveToken(token: string, storeId: string) {
  const admin = getAdminClient();

  // Buscar token com dados do cliente
  const { data: tokenRow, error } = await admin
    .from("customer_tokens")
    .select("id, customer_id, token, expires_at, customers(id, name, phone, email, address, latitude, longitude)")
    .eq("token", token)
    .eq("store_id", storeId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar token:", error);
    return { error: "Erro interno ao validar token." };
  }

  if (!tokenRow || !tokenRow.customers) {
    return { error: "Token inválido ou não encontrado para esta loja." };
  }

  const customer = tokenRow.customers as any;
  const now = new Date();
  const expiresAt = new Date(tokenRow.expires_at);

  // Se expirado → Regeneração Silenciosa
  if (now > expiresAt) {
    console.log(`Token expirado para customer ${customer.id}, regenerando...`);

    const { data: newToken, error: regenError } = await admin
      .rpc("generate_customer_token", {
        p_customer_id: customer.id,
        p_store_id: storeId,
      })
      .single();

    if (regenError || !newToken) {
      console.error("Erro ao regenerar token:", regenError);
      return { error: "Falha ao regenerar token." };
    }

    return {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        latitude: customer.latitude,
        longitude: customer.longitude,
      },
      token: newToken.new_token,
      expires_at: newToken.new_expires_at,
      regenerated: true,
    };
  }

  // Token válido
  return {
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      latitude: customer.latitude,
      longitude: customer.longitude,
    },
    token: tokenRow.token,
    expires_at: tokenRow.expires_at,
    regenerated: false,
  };
}

/**
 * ACTION: identify-by-phone
 * Recebe phone + store_id → encontra ou cria customer → gera token
 */
async function identifyByPhone(
  phone: string,
  storeId: string,
  name?: string,
  email?: string,
  address?: string
) {
  const admin = getAdminClient();
  const canonical = normalizePhoneCanonical(phone);
  const variants = getPhoneVariants(phone);

  console.log(`Buscando cliente com variantes: ${variants.join(", ")}`);

  // 1. Buscar cliente existente por variantes de telefone
  const { data: existingCustomers, error: findError } = await admin
    .from("customers")
    .select("id, name, phone, email, address, latitude, longitude")
    .in("phone", variants)
    .is("deleted_at", null)
    .limit(1);

  if (findError) {
    console.error("Erro ao buscar cliente:", findError);
    return { error: "Erro ao buscar cliente no banco." };
  }

  let customer: any;
  let isNew = false;

  if (existingCustomers && existingCustomers.length > 0) {
    // Cliente encontrado
    customer = existingCustomers[0];
    console.log(`Cliente existente encontrado: ${customer.id} (${customer.name})`);

    // Atualizar dados se fornecidos (dados frescos)
    const updates: any = {};
    if (name && name.trim()) updates.name = name.trim();
    if (email && email.trim()) updates.email = email.trim();
    // Não atualizar address aqui - o endereço de entrega é salvo apenas no pedido (orders.customer_address)

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      const { error: updateError } = await admin
        .from("customers")
        .update(updates)
        .eq("id", customer.id);

      if (updateError) {
        console.error("Erro ao atualizar cliente:", updateError);
      } else {
        // Mesclar updates no objeto retornado
        Object.assign(customer, updates);
      }
    }
  } else {
    // Cliente novo → criar
    isNew = true;
    const { data: newCustomer, error: createError } = await admin
      .from("customers")
      .insert({
        phone: canonical,
        name: name?.trim() || `Cliente ${canonical}`,
        email: email?.trim() || null,
        address: address?.trim() || null,
      })
      .select("id, name, phone, email, address, latitude, longitude")
      .single();

    if (createError || !newCustomer) {
      console.error("Erro ao criar cliente:", createError);
      return { error: "Falha ao criar novo cliente." };
    }

    customer = newCustomer;
    console.log(`Novo cliente criado: ${customer.id}`);
  }

  // 2. Garantir vínculo customer_stores
  const { data: existingLink } = await admin
    .from("customer_stores")
    .select("id")
    .eq("customer_id", customer.id)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!existingLink) {
    const { error: linkError } = await admin
      .from("customer_stores")
      .insert({ customer_id: customer.id, store_id: storeId });

    if (linkError) {
      console.error("Erro ao vincular customer_stores:", linkError);
      // Não bloquear o fluxo por causa disso
    } else {
      console.log(`Vínculo customer_stores criado para loja ${storeId}`);
    }
  }

  // 3. Gerar token
  const { data: tokenData, error: tokenError } = await admin
    .rpc("generate_customer_token", {
      p_customer_id: customer.id,
      p_store_id: storeId,
    })
    .single();

  if (tokenError || !tokenData) {
    console.error("Erro ao gerar token:", tokenError);
    return { error: "Falha ao gerar token de acesso." };
  }

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      latitude: customer.latitude,
      longitude: customer.longitude,
    },
    token: tokenData.new_token,
    expires_at: tokenData.new_expires_at,
    is_new: isNew,
  };
}

// Handler principal
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, token, store_id, phone, name, email, address } = body;

    if (!action || !store_id) {
      return new Response(
        JSON.stringify({ error: "Campos action e store_id são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result;

    switch (action) {
      case "resolve-token":
        if (!token) {
          return new Response(
            JSON.stringify({ error: "Campo token é obrigatório." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        result = await resolveToken(token, store_id);
        break;

      case "identify-by-phone":
        if (!phone) {
          return new Response(
            JSON.stringify({ error: "Campo phone é obrigatório." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        result = await identifyByPhone(phone, store_id, name, email, address);
        break;

      default:
        return new Response(
          JSON.stringify({ error: `Action '${action}' não reconhecida.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    if (result.error) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Erro na Edge Function customer-auth-v2:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
