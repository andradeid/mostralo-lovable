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
    // Autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verificar usuário
    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // Admin client
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verificar se é master_admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "master_admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Apenas master_admin pode clonar lojas" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parâmetros
    const { source_store_id, new_name, new_slug, owner_id } = await req.json();

    if (!source_store_id || !new_name || !new_slug || !owner_id) {
      return new Response(JSON.stringify({ error: "Parâmetros obrigatórios: source_store_id, new_name, new_slug, owner_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar se slug já existe
    const { data: existingSlug } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", new_slug)
      .single();

    if (existingSlug) {
      return new Response(JSON.stringify({ error: "Slug já existe. Escolha outro." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Buscar loja origem
    const { data: sourceStore, error: storeError } = await supabase
      .from("stores")
      .select("*")
      .eq("id", source_store_id)
      .single();

    if (storeError || !sourceStore) {
      return new Response(JSON.stringify({ error: "Loja origem não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Criar nova loja (copiar configs, limpar dados sensíveis)
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
        ...storeFields,
        name: new_name,
        slug: new_slug,
        owner_id: owner_id,
        status: "active",
        last_order_number: 0,
        openai_api_key: null,
      })
      .select()
      .single();

    if (newStoreError || !newStore) {
      console.error("Erro ao criar loja:", newStoreError);
      return new Response(JSON.stringify({ error: "Erro ao criar nova loja", details: newStoreError?.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newStoreId = newStore.id;
    const stats = { categories: 0, products: 0, variants: 0, addon_categories: 0, addons: 0, modules: 0 };

    // 3. Clonar store_configurations
    const { data: sourceConfig } = await supabase
      .from("store_configurations")
      .select("*")
      .eq("store_id", source_store_id)
      .single();

    if (sourceConfig) {
      const { id: _cid, store_id: _csid, created_at: _cca, updated_at: _cua, ...configFields } = sourceConfig;
      await supabase.from("store_configurations").insert({
        ...configFields,
        store_id: newStoreId,
      });
    }

    // 4. Clonar categorias (mapeamento de IDs)
    const categoryMap = new Map<string, string>();
    const { data: sourceCategories } = await supabase
      .from("categories")
      .select("*")
      .eq("store_id", source_store_id)
      .order("display_order");

    if (sourceCategories && sourceCategories.length > 0) {
      for (const cat of sourceCategories) {
        const { id: oldId, store_id: _sid, created_at: _cca2, updated_at: _cua2, ...catFields } = cat;
        const { data: newCat } = await supabase
          .from("categories")
          .insert({ ...catFields, store_id: newStoreId })
          .select("id")
          .single();
        if (newCat) {
          categoryMap.set(oldId, newCat.id);
          stats.categories++;
        }
      }
    }

    // 5. Clonar produtos (em lotes de 50 para performance)
    const productMap = new Map<string, string>();
    let offset = 0;
    const batchSize = 50;
    let hasMore = true;

    while (hasMore) {
      const { data: sourceProducts } = await supabase
        .from("products")
        .select("*")
        .eq("store_id", source_store_id)
        .order("display_order")
        .range(offset, offset + batchSize - 1);

      if (!sourceProducts || sourceProducts.length === 0) {
        hasMore = false;
        break;
      }

      for (const prod of sourceProducts) {
        const { id: oldId, store_id: _sid2, created_at: _pca, updated_at: _pua, slug: _pslug, ...prodFields } = prod;
        const newCategoryId = prod.category_id ? categoryMap.get(prod.category_id) || null : null;

        const { data: newProd } = await supabase
          .from("products")
          .insert({
            ...prodFields,
            store_id: newStoreId,
            category_id: newCategoryId,
            slug: null, // trigger gera automaticamente
          })
          .select("id")
          .single();

        if (newProd) {
          productMap.set(oldId, newProd.id);
          stats.products++;
        }
      }

      if (sourceProducts.length < batchSize) {
        hasMore = false;
      }
      offset += batchSize;
    }

    // 6. Clonar variantes de produtos
    for (const [oldProductId, newProductId] of productMap.entries()) {
      const { data: variants } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", oldProductId);

      if (variants && variants.length > 0) {
        const newVariants = variants.map(v => {
          const { id: _vid, product_id: _vpid, created_at: _vca, updated_at: _vua, ...vFields } = v;
          return { ...vFields, product_id: newProductId };
        });
        await supabase.from("product_variants").insert(newVariants);
        stats.variants += variants.length;
      }
    }

    // 7. Clonar addon_categories (mapeamento)
    const addonCategoryMap = new Map<string, string>();
    const { data: sourceAddonCats } = await supabase
      .from("addon_categories")
      .select("*")
      .eq("store_id", source_store_id);

    if (sourceAddonCats && sourceAddonCats.length > 0) {
      for (const ac of sourceAddonCats) {
        const { id: oldId, store_id: _sid3, created_at: _aca, updated_at: _aua, ...acFields } = ac;
        const { data: newAc } = await supabase
          .from("addon_categories")
          .insert({ ...acFields, store_id: newStoreId })
          .select("id")
          .single();
        if (newAc) {
          addonCategoryMap.set(oldId, newAc.id);
          stats.addon_categories++;
        }
      }
    }

    // 8. Clonar addons
    const { data: sourceAddons } = await supabase
      .from("addons")
      .select("*")
      .eq("store_id", source_store_id);

    if (sourceAddons && sourceAddons.length > 0) {
      const newAddons = sourceAddons.map(addon => {
        const { id: _aid, store_id: _asid, created_at: _aaca, updated_at: _aaua, ...addonFields } = addon;
        return {
          ...addonFields,
          store_id: newStoreId,
          category_id: addon.category_id ? addonCategoryMap.get(addon.category_id) || null : null,
        };
      });
      await supabase.from("addons").insert(newAddons);
      stats.addons = sourceAddons.length;
    }

    // 9. Clonar category_addon_categories (vínculos)
    const { data: sourceCatAddonCats } = await supabase
      .from("category_addon_categories")
      .select("*")
      .eq("store_id", source_store_id);

    if (sourceCatAddonCats && sourceCatAddonCats.length > 0) {
      const newLinks = sourceCatAddonCats
        .map(link => {
          const newCatId = categoryMap.get(link.category_id);
          const newAddonCatId = addonCategoryMap.get(link.addon_category_id);
          if (!newCatId || !newAddonCatId) return null;
          return {
            store_id: newStoreId,
            category_id: newCatId,
            addon_category_id: newAddonCatId,
          };
        })
        .filter(Boolean);

      if (newLinks.length > 0) {
        await supabase.from("category_addon_categories").insert(newLinks);
      }
    }

    // 10. Clonar store_modules
    const { data: sourceModules } = await supabase
      .from("store_modules")
      .select("*")
      .eq("store_id", source_store_id);

    if (sourceModules && sourceModules.length > 0) {
      const newModules = sourceModules.map(m => ({
        store_id: newStoreId,
        module_id: m.module_id,
        is_enabled: m.is_enabled,
      }));
      await supabase.from("store_modules").insert(newModules);
      stats.modules = sourceModules.length;
    }

    // 11. Adicionar role store_admin para o owner
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({
        user_id: owner_id,
        role: "store_admin",
        store_id: newStoreId,
      });

    if (roleError) {
      console.warn("Aviso: Erro ao adicionar role (pode já existir):", roleError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        new_store_id: newStoreId,
        new_slug: new_slug,
        stats,
        message: `Loja "${new_name}" clonada com sucesso!`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na clonagem:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno na clonagem", details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
