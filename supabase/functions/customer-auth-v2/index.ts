import { createClient } from "npm:@supabase/supabase-js@2";

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

    // Mesmo aparelho: renova o prazo do mesmo token (mantém o histórico deste aparelho)
    const newExpires = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
    const { error: regenError } = await admin
      .from("customer_tokens")
      .update({ expires_at: newExpires })
      .eq("id", tokenRow.id);

    if (regenError) {
      console.error("Erro ao renovar token:", regenError);
      return { error: "Falha ao regenerar token." };
    }
    const newToken = { new_token: tokenRow.token, new_expires_at: newExpires };

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

const isPlaceholderName = (n?: string | null) => !n || !n.trim() || /^Cliente\s*\d*$/i.test(n.trim());

/** Token deste aparelho, se for desta loja e deste cliente (null se não servir). */
async function deviceToken(admin: ReturnType<typeof getAdminClient>, token: string | undefined, storeId: string) {
  if (!token) return null;
  const { data } = await admin
    .from("customer_tokens")
    .select("id, customer_id, token, expires_at")
    .eq("token", token)
    .eq("store_id", storeId)
    .maybeSingle();
  return data ?? null;
}

/**
 * ACTION: identify-by-phone
 * Recebe phone + store_id (+ token do aparelho, se houver) → encontra ou cria o cliente → token.
 * Não devolve dados já salvos do cliente (nome, e-mail, endereço): quem só sabe o telefone
 * não descobre nada. Cada aparelho tem o seu token; o mesmo aparelho reaproveita o dele.
 */
async function identifyByPhone(
  phone: string,
  storeId: string,
  name?: string,
  email?: string,
  address?: string,
  token?: string
) {
  const admin = getAdminClient();
  const canonical = normalizePhoneCanonical(phone);
  const variants = getPhoneVariants(phone);

  // 1. Buscar cliente existente por variantes de telefone
  const { data: existingCustomers, error: findError } = await admin
    .from("customers")
    .select("id, name, email")
    .in("phone", variants)
    .is("deleted_at", null)
    .limit(1);

  if (findError) {
    console.error("Erro ao buscar cliente:", findError);
    return { error: "Erro ao buscar cliente no banco." };
  }

  let customerId: string;
  let isNew = false;

  if (existingCustomers && existingCustomers.length > 0) {
    const existing = existingCustomers[0];
    customerId = existing.id;
    // Sem confirmação de quem digitou: só completa o que está vazio (não troca nome/e-mail reais)
    const updates: Record<string, string> = {};
    if (name && name.trim() && isPlaceholderName(existing.name)) updates.name = name.trim();
    if (email && email.trim() && !existing.email) updates.email = email.trim();
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await admin
        .from("customers")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", customerId);
      if (updateError) console.error("Erro ao completar cliente:", updateError);
    }
  } else {
    isNew = true;
    const { data: newCustomer, error: createError } = await admin
      .from("customers")
      .insert({
        phone: canonical,
        name: name?.trim() || `Cliente ${canonical}`,
        email: email?.trim() || null,
        address: address?.trim() || null,
      })
      .select("id")
      .single();

    if (createError || !newCustomer) {
      console.error("Erro ao criar cliente:", createError);
      return { error: "Falha ao criar novo cliente." };
    }
    customerId = newCustomer.id;
  }

  // 2. Garantir vínculo customer_stores
  const { data: existingLink } = await admin
    .from("customer_stores")
    .select("id")
    .eq("customer_id", customerId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (!existingLink) {
    const { error: linkError } = await admin
      .from("customer_stores")
      .insert({ customer_id: customerId, store_id: storeId });
    if (linkError) console.error("Erro ao vincular customer_stores:", linkError);
  }

  // 3. Token do aparelho: reaproveita se for deste cliente; senão cria um novo
  const expiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
  const current = await deviceToken(admin, token, storeId);
  let tokenValue: string;
  if (current && current.customer_id === customerId) {
    await admin.from("customer_tokens").update({ expires_at: expiresAt }).eq("id", current.id);
    tokenValue = current.token;
  } else {
    const { data: created, error: tokenError } = await admin
      .from("customer_tokens")
      .insert({ customer_id: customerId, store_id: storeId, token: crypto.randomUUID(), expires_at: expiresAt })
      .select("token")
      .single();
    if (tokenError || !created) {
      console.error("Erro ao gerar token:", tokenError);
      return { error: "Falha ao gerar token de acesso." };
    }
    tokenValue = created.token;
  }

  return {
    customer: {
      id: customerId,
      // Só o que quem chamou informou (nada do cadastro salvo volta para o navegador)
      name: name?.trim() || null,
      phone: canonical,
      email: email?.trim() || null,
      address: null,
      latitude: null,
      longitude: null,
    },
    token: tokenValue,
    expires_at: expiresAt,
    is_new: isNew,
  };
}

/**
 * ACTION: lookup-by-phone
 * Somente leitura, usada enquanto o cliente digita o telefone no checkout.
 * Devolve os dados apenas para o aparelho que já tem o token deste cliente nesta loja;
 * para qualquer outro, responde como "não encontrado" (não revela se o telefone existe).
 */
async function lookupByPhone(phone: string, storeId: string, token?: string) {
  const admin = getAdminClient();
  const current = await deviceToken(admin, token, storeId);
  if (!current) return { customer: null };

  const variants = getPhoneVariants(phone);
  const { data: customer, error: findError } = await admin
    .from("customers")
    .select("id, name, phone, email, address, latitude, longitude")
    .eq("id", current.customer_id)
    .in("phone", variants)
    .is("deleted_at", null)
    .maybeSingle();

  if (findError) {
    console.error("Erro ao buscar cliente:", findError);
    return { error: "Erro ao buscar cliente no banco." };
  }
  return { customer: customer ?? null };
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

      case "lookup-by-phone":
        if (!phone) {
          return new Response(
            JSON.stringify({ error: "Campo phone é obrigatório." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        result = await lookupByPhone(phone, store_id, token);
        break;

      case "identify-by-phone":
        if (!phone) {
          return new Response(
            JSON.stringify({ error: "Campo phone é obrigatório." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        result = await identifyByPhone(phone, store_id, name, email, address, token);
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
