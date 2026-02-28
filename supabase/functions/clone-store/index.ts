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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verificar master_admin
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

    const { source_store_id, new_name, new_slug, owner_id } = await req.json();

    if (!source_store_id || !new_name || !new_slug || !owner_id) {
      return new Response(JSON.stringify({ error: "Parâmetros obrigatórios: source_store_id, new_name, new_slug, owner_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar slug
    const { data: existingSlug } = await supabase.from("stores").select("id").eq("slug", new_slug).single();
    if (existingSlug) {
      return new Response(JSON.stringify({ error: "Slug já existe. Escolha outro." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar loja origem
    const { data: sourceStore, error: storeError } = await supabase.from("stores").select("*").eq("id", source_store_id).single();
    if (storeError || !sourceStore) {
      return new Response(JSON.stringify({ error: "Loja origem não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    // Helper: buscar TODOS os registros paginando automaticamente (sem limite de 1000)
    async function fetchAll(table: string, storeId: string, orderCol?: string) {
      const allRows: any[] = [];
      const pageSize = 1000;
      let offset = 0;
      let hasMore = true;
      while (hasMore) {
        let query = supabase.from(table).select("*").eq("store_id", storeId).range(offset, offset + pageSize - 1);
        if (orderCol) query = query.order(orderCol);
        const { data } = await query;
        if (!data || data.length === 0) { hasMore = false; break; }
        allRows.push(...data);
        if (data.length < pageSize) hasMore = false;
        offset += pageSize;
      }
      return allRows;
    }

    // Buscar dados em paralelo (com paginação para tabelas grandes)
    const [
      configRes,
      sourceCategories,
      sourceProducts,
      sourceAddonCats,
      sourceAddons,
      sourceCatAddonCats,
      sourceModules,
    ] = await Promise.all([
      supabase.from("store_configurations").select("*").eq("store_id", source_store_id).single(),
      fetchAll("categories", source_store_id, "display_order"),
      fetchAll("products", source_store_id, "display_order"),
      fetchAll("addon_categories", source_store_id),
      fetchAll("addons", source_store_id),
      fetchAll("category_addon_categories", source_store_id),
      fetchAll("store_modules", source_store_id),
    ]);

    // Clonar config
    if (configRes.data) {
      const { id: _cid, store_id: _csid, created_at: _cca, updated_at: _cua, ...configFields } = configRes.data;
      await supabase.from("store_configurations").insert({ ...configFields, store_id: newStoreId });
    }

    // Clonar categorias em batch
    const categoryMap = new Map<string, string>();
    if (sourceCategories.length > 0) {
    if (sourceCategories.length > 0) {
      const catInserts = sourceCategories.map(cat => {
        const { id: _oldId, store_id: _sid, created_at: _cca2, updated_at: _cua2, ...catFields } = cat;
        return { ...catFields, store_id: newStoreId };
      });
      const { data: newCats } = await supabase.from("categories").insert(catInserts).select("id");
      if (newCats) {
        for (let i = 0; i < sourceCategories.length; i++) {
          categoryMap.set(sourceCategories[i].id, newCats[i].id);
        }
        stats.categories = newCats.length;
      }
    }

    // Clonar produtos em batch
    const productMap = new Map<string, string>();
    if (sourceProducts.length > 0) {
      // Insert em lotes de 200
      const batchSize = 200;
      for (let i = 0; i < sourceProducts.length; i += batchSize) {
        const batch = sourceProducts.slice(i, i + batchSize);
        const prodInserts = batch.map(prod => {
          const { id: _oldId, store_id: _sid2, created_at: _pca, updated_at: _pua, slug: _pslug, ...prodFields } = prod;
          return {
            ...prodFields,
            store_id: newStoreId,
            category_id: prod.category_id ? categoryMap.get(prod.category_id) || null : null,
            slug: null,
          };
        });
        const { data: newProds } = await supabase.from("products").insert(prodInserts).select("id");
        if (newProds) {
          for (let j = 0; j < batch.length; j++) {
            productMap.set(batch[j].id, newProds[j].id);
          }
          stats.products += newProds.length;
        }
      }
    }

    // Clonar variantes - buscar todas de uma vez
    if (productMap.size > 0) {
      const oldProductIds = Array.from(productMap.keys());
      // Buscar em lotes de 200 IDs
      for (let i = 0; i < oldProductIds.length; i += 200) {
        const idBatch = oldProductIds.slice(i, i + 200);
        const { data: variants } = await supabase
          .from("product_variants")
          .select("*")
          .in("product_id", idBatch);

        if (variants && variants.length > 0) {
          const newVariants = variants.map(v => {
            const { id: _vid, product_id: _vpid, created_at: _vca, updated_at: _vua, ...vFields } = v;
            return { ...vFields, product_id: productMap.get(v.product_id)! };
          });
          await supabase.from("product_variants").insert(newVariants);
          stats.variants += variants.length;
        }
      }
    }

    // Clonar addon_categories em batch
    const addonCategoryMap = new Map<string, string>();
    if (sourceAddonCats.length > 0) {
    if (sourceAddonCats.length > 0) {
      const acInserts = sourceAddonCats.map(ac => {
        const { id: _oldId, store_id: _sid3, created_at: _aca, updated_at: _aua, ...acFields } = ac;
        return { ...acFields, store_id: newStoreId };
      });
      const { data: newAcs } = await supabase.from("addon_categories").insert(acInserts).select("id");
      if (newAcs) {
        for (let i = 0; i < sourceAddonCats.length; i++) {
          addonCategoryMap.set(sourceAddonCats[i].id, newAcs[i].id);
        }
        stats.addon_categories = newAcs.length;
      }
    }

    // Clonar addons em batch
    if (sourceAddons.length > 0) {
    if (sourceAddons.length > 0) {
      const addonInserts = sourceAddons.map(addon => {
        const { id: _aid, store_id: _asid, created_at: _aaca, updated_at: _aaua, ...addonFields } = addon;
        return {
          ...addonFields,
          store_id: newStoreId,
          category_id: addon.category_id ? addonCategoryMap.get(addon.category_id) || null : null,
        };
      });
      await supabase.from("addons").insert(addonInserts);
      stats.addons = sourceAddons.length;
    }

    // Clonar vínculos category_addon_categories
    if (sourceCatAddonCats.length > 0) {
    if (sourceCatAddonCats.length > 0) {
      const newLinks = sourceCatAddonCats
        .map(link => {
          const newCatId = categoryMap.get(link.category_id);
          const newAddonCatId = addonCategoryMap.get(link.addon_category_id);
          if (!newCatId || !newAddonCatId) return null;
          return { store_id: newStoreId, category_id: newCatId, addon_category_id: newAddonCatId };
        })
        .filter(Boolean);
      if (newLinks.length > 0) {
        await supabase.from("category_addon_categories").insert(newLinks);
      }
    }

    // Clonar modules
    if (sourceModules.length > 0) {
    if (sourceModules.length > 0) {
      const newModules = sourceModules.map(m => ({
        store_id: newStoreId,
        module_id: m.module_id,
        is_enabled: m.is_enabled,
      }));
      await supabase.from("store_modules").insert(newModules);
      stats.modules = sourceModules.length;
    }

    // Adicionar role store_admin
    await supabase.from("user_roles").insert({
      user_id: owner_id,
      role: "store_admin",
      store_id: newStoreId,
    });

    return new Response(
      JSON.stringify({
        success: true,
        new_store_id: newStoreId,
        new_slug: new_slug,
        stats,
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
