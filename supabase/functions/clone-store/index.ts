import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verificar master_admin
    const { data: roleData } = await supabase
      .from("user_roles").select("role")
      .eq("user_id", user.id).eq("role", "master_admin").single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Apenas master_admin pode clonar lojas" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { source_store_id, new_name, new_slug, owner_id } = await req.json();
    if (!source_store_id || !new_name || !new_slug || !owner_id) {
      return new Response(JSON.stringify({ error: "Parâmetros obrigatórios: source_store_id, new_name, new_slug, owner_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar slug
    const { data: existingSlug } = await supabase.from("stores").select("id").eq("slug", new_slug).single();
    if (existingSlug) {
      return new Response(JSON.stringify({ error: "Slug já existe. Escolha outro." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar loja origem
    const { data: sourceStore, error: storeError } = await supabase.from("stores").select("*").eq("id", source_store_id).single();
    if (storeError || !sourceStore) {
      return new Response(JSON.stringify({ error: "Loja origem não encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Criar nova loja
    const {
      id: _id, created_at: _ca, updated_at: _ua, slug: _slug, name: _name,
      owner_id: _oid, openai_api_key: _oai, last_order_number: _lon,
      efi_account_id: _eai, efi_account_number: _ean, efi_account_status: _eas,
      efi_certificate_pem: _ecp, efi_client_id: _eci, efi_client_secret: _ecs,
      efi_document_number: _edn, efi_document_type: _edt, efi_pix_enabled: _epe,
      custom_domain: _cd, custom_domain_requested_at: _cdra, custom_domain_verified: _cdv,
      custom_monthly_price: _cmp, discount_reason: _dr, discount_applied_at: _daa, discount_applied_by: _dab,
      subscription_expires_at: _sea,
      notification_phone: _np, notification_phone_2: _np2,
      ...storeFields
    } = sourceStore;

    const { data: newStore, error: newStoreError } = await supabase
      .from("stores")
      .insert({
        ...storeFields, name: new_name, slug: new_slug, owner_id,
        status: "active", last_order_number: 0, openai_api_key: null,
      })
      .select().single();

    if (newStoreError || !newStore) {
      console.error("Erro ao criar loja:", newStoreError);
      return new Response(JSON.stringify({ error: "Erro ao criar nova loja", details: newStoreError?.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clonar dados via SQL (executa no PostgreSQL, sem limite de CPU)
    const { data: stats, error: cloneError } = await supabase.rpc("clone_store_data", {
      p_source_store_id: source_store_id,
      p_new_store_id: newStore.id,
    });

    if (cloneError) {
      console.error("Erro no clone_store_data:", cloneError);
      // Limpar loja criada em caso de erro
      await supabase.from("stores").delete().eq("id", newStore.id);
      return new Response(JSON.stringify({ error: "Erro ao clonar dados", details: cloneError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Adicionar role store_admin
    await supabase.from("user_roles").insert({
      user_id: owner_id, role: "store_admin", store_id: newStore.id,
    });

    return new Response(
      JSON.stringify({
        success: true, new_store_id: newStore.id, new_slug: new_slug,
        stats: stats || {},
        message: `Loja "${new_name}" clonada com sucesso!`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro na clonagem:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno na clonagem", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
