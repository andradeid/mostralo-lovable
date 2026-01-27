import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { storeId, confirmationName, password, email } = await req.json();

    if (!storeId || !confirmationName || !password || !email) {
      return new Response(
        JSON.stringify({ error: 'Dados incompletos. Todos os campos são obrigatórios.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Service client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Extract token and verify user via admin client
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Erro ao verificar usuário:', userError);
      return new Response(
        JSON.stringify({ error: 'Sessão inválida' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`[delete-all-products] Usuário ${userId} solicitando exclusão da loja ${storeId}`);

    // Verify user role - must be store_admin or master_admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role, store_id')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (roleError) {
      console.error('Erro ao verificar role:', roleError);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar permissões' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isMasterAdmin = roleData?.role === 'master_admin';
    const isStoreAdmin = roleData?.role === 'store_admin';

    if (!isMasterAdmin && !isStoreAdmin) {
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem excluir produtos' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For store_admin, verify they own the store
    if (isStoreAdmin) {
      const { data: storeData, error: storeError } = await supabaseAdmin
        .from('stores')
        .select('id, name, owner_id')
        .eq('id', storeId)
        .single();

      if (storeError || !storeData) {
        return new Response(
          JSON.stringify({ error: 'Loja não encontrada' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (storeData.owner_id !== userId) {
        return new Response(
          JSON.stringify({ error: 'Você não tem permissão para excluir produtos desta loja' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify store name matches confirmation
      if (storeData.name.toLowerCase().trim() !== confirmationName.toLowerCase().trim()) {
        return new Response(
          JSON.stringify({ error: 'Nome da loja não confere' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verify password via Supabase Auth
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (signInError) {
      console.error('Erro de autenticação:', signInError);
      return new Response(
        JSON.stringify({ error: 'Senha incorreta' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[delete-all-products] Senha verificada para ${email}`);

    // Count items before deletion
    const { count: productsCount } = await supabaseAdmin
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId);

    const { count: categoriesCount } = await supabaseAdmin
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('store_id', storeId);

    console.log(`[delete-all-products] Encontrados: ${productsCount} produtos, ${categoriesCount} categorias`);

    // Get product IDs for deleting related data
    const { data: productIds } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('store_id', storeId);

    const productIdList = productIds?.map(p => p.id) || [];

    // Delete in order (respecting foreign keys)
    let deletedVariants = 0;
    let deletedAddons = 0;

    if (productIdList.length > 0) {
      // 1. Delete product_variants
      const { count: variantsDeleted } = await supabaseAdmin
        .from('product_variants')
        .delete({ count: 'exact' })
        .in('product_id', productIdList);
      deletedVariants = variantsDeleted || 0;

      // 2. Delete product_addons
      const { count: addonsDeleted } = await supabaseAdmin
        .from('product_addons')
        .delete({ count: 'exact' })
        .in('product_id', productIdList);
      deletedAddons = addonsDeleted || 0;
    }

    // 3. Delete products
    const { count: productsDeleted, error: productsError } = await supabaseAdmin
      .from('products')
      .delete({ count: 'exact' })
      .eq('store_id', storeId);

    if (productsError) {
      console.error('Erro ao excluir produtos:', productsError);
      throw new Error('Erro ao excluir produtos');
    }

    // 4. Delete categories
    const { count: categoriesDeleted, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .delete({ count: 'exact' })
      .eq('store_id', storeId);

    if (categoriesError) {
      console.error('Erro ao excluir categorias:', categoriesError);
      throw new Error('Erro ao excluir categorias');
    }

    // Log audit
    await supabaseAdmin
      .from('admin_audit_log')
      .insert({
        admin_id: userId,
        target_user_id: userId,
        action: 'delete_all_products',
        details: {
          store_id: storeId,
          products_deleted: productsDeleted,
          categories_deleted: categoriesDeleted,
          variants_deleted: deletedVariants,
          addons_deleted: deletedAddons,
          timestamp: new Date().toISOString(),
        }
      });

    console.log(`[delete-all-products] Exclusão concluída:`, {
      products: productsDeleted,
      categories: categoriesDeleted,
      variants: deletedVariants,
      addons: deletedAddons
    });

    return new Response(
      JSON.stringify({
        success: true,
        deleted: {
          products: productsDeleted || 0,
          categories: categoriesDeleted || 0,
          variants: deletedVariants,
          addons: deletedAddons,
        },
        message: 'Todos os produtos e categorias foram excluídos com sucesso'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[delete-all-products] Erro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
