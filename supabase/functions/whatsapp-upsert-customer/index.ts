import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://esm.sh/zod@3.23.8";
import { corsHeaders } from "../_shared/cors.ts";
import { getPhoneVariants, normalizePhoneCanonical } from "../_shared/phoneUtils.ts";

const requestSchema = z.object({
  storeId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(10).max(20),
  email: z.string().trim().email().max(255).nullable().optional(),
  address: z.string().trim().max(300).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  latitude: z.number().finite().nullable().optional(),
  longitude: z.number().finite().nullable().optional(),
  whatsappJid: z.string().trim().max(120).nullable().optional(),
});

interface RoleRow {
  role: string;
  store_id: string | null;
}

function sanitizeNullable(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Configuração do servidor incompleta" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsedBody = requestSchema.safeParse(await req.json());
    if (!parsedBody.success) {
      return new Response(JSON.stringify({ error: "Dados inválidos", details: parsedBody.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { storeId, name, phone, email, address, notes, latitude, longitude, whatsappJid } = parsedBody.data;
    const userId = authData.user.id;

    const [{ data: roles, error: rolesError }, { data: ownedStore, error: ownerError }] = await Promise.all([
      serviceClient
        .from("user_roles")
        .select("role,store_id")
        .eq("user_id", userId),
      serviceClient
        .from("stores")
        .select("id")
        .eq("id", storeId)
        .eq("owner_id", userId)
        .maybeSingle(),
    ]);

    if (rolesError || ownerError) {
      return new Response(JSON.stringify({ error: "Erro ao validar permissão" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const roleList = (roles ?? []) as RoleRow[];
    const hasAllowedRole = roleList.some((roleRow) => {
      if (roleRow.role === "master_admin") return true;
      if (roleRow.role === "store_admin" || roleRow.role === "attendant") {
        return roleRow.store_id === storeId;
      }
      return false;
    });

    if (!hasAllowedRole && !ownedStore) {
      return new Response(JSON.stringify({ error: "Sem permissão para cadastrar cliente nesta loja" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedPhone = normalizePhoneCanonical(phone);
    const phoneVariants = getPhoneVariants(phone);

    const { data: existingCustomer, error: searchError } = await serviceClient
      .from("customers")
      .select("id")
      .in("phone", phoneVariants)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();

    if (searchError) {
      return new Response(JSON.stringify({ error: "Erro ao buscar cliente" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerPayload = {
      name: name.trim(),
      phone: normalizedPhone,
      email: sanitizeNullable(email),
      address: sanitizeNullable(address),
      notes: sanitizeNullable(notes),
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      whatsapp_jid: sanitizeNullable(whatsappJid),
      updated_at: new Date().toISOString(),
    };

    let customerId = existingCustomer?.id ?? null;
    let wasCreated = false;

    if (customerId) {
      const { error: updateError } = await serviceClient
        .from("customers")
        .update(customerPayload)
        .eq("id", customerId);

      if (updateError) {
        return new Response(JSON.stringify({ error: "Erro ao atualizar cliente" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      const { data: insertedCustomer, error: insertError } = await serviceClient
        .from("customers")
        .insert({
          ...customerPayload,
          auth_user_id: null,
        })
        .select("id")
        .single();

      if (insertError || !insertedCustomer) {
        return new Response(JSON.stringify({ error: "Erro ao criar cliente" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      customerId = insertedCustomer.id;
      wasCreated = true;
    }

    const { data: existingLink, error: linkSearchError } = await serviceClient
      .from("customer_stores")
      .select("id")
      .eq("customer_id", customerId)
      .eq("store_id", storeId)
      .maybeSingle();

    if (linkSearchError) {
      return new Response(JSON.stringify({ error: "Erro ao validar vínculo do cliente com a loja" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!existingLink) {
      const { error: linkInsertError } = await serviceClient
        .from("customer_stores")
        .insert({ customer_id: customerId, store_id: storeId });

      if (linkInsertError) {
        return new Response(JSON.stringify({ error: "Erro ao vincular cliente à loja" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, customerId, created: wasCreated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Erro interno no cadastro de cliente" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
