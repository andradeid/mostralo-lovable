import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type DeleteMode = 'full' | 'deactivate' | 'user_only'

interface DeleteRequest {
  userId: string
  deleteMode: DeleteMode
  reason?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Client with user's JWT for auth check
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })
    
    // Admin client for deletions
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Verify caller is master_admin
    const { data: { user: caller }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if caller has master_admin role
    const { data: callerRoles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'master_admin')
      .single()

    if (!callerRoles) {
      return new Response(
        JSON.stringify({ error: 'Apenas super admins podem executar esta ação' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { userId, deleteMode, reason }: DeleteRequest = await req.json()
    
    if (!userId || !deleteMode) {
      return new Response(
        JSON.stringify({ error: 'userId e deleteMode são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[delete-user-complete] Mode: ${deleteMode}, UserId: ${userId}, By: ${caller.id}`)

    // Get user info before deletion
    const { data: targetUser } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', userId)
      .single()

    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's store if any
    const { data: userStore } = await supabaseAdmin
      .from('stores')
      .select('id, name')
      .eq('owner_id', userId)
      .single()

    const storeId = userStore?.id
    const deletedItems: Record<string, number> = {}

    // MODE: DEACTIVATE - Just block the user
    if (deleteMode === 'deactivate') {
      const { error: blockError } = await supabaseAdmin
        .from('profiles')
        .update({
          is_blocked: true,
          blocked_at: new Date().toISOString(),
          blocked_by: caller.id,
          blocked_reason: reason || 'Desativado pelo administrador'
        })
        .eq('id', userId)

      if (blockError) throw blockError

      // Log action
      await supabaseAdmin.from('admin_audit_log').insert({
        admin_id: caller.id,
        target_user_id: userId,
        action: 'deactivate',
        details: { reason, user_name: targetUser.full_name, store_name: userStore?.name }
      })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Usuário desativado com sucesso',
          deletedItems: { deactivated: 1 }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // MODE: USER_ONLY - Delete auth + profile, keep store orphan
    if (deleteMode === 'user_only') {
      // Delete user roles
      const { count: rolesCount } = await supabaseAdmin
        .from('user_roles')
        .delete({ count: 'exact' })
        .eq('user_id', userId)
      deletedItems.user_roles = rolesCount || 0

      // Mark profile as deleted
      await supabaseAdmin
        .from('profiles')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: caller.id
        })
        .eq('id', userId)
      deletedItems.profiles = 1

      // Remove owner from store (orphan it)
      if (storeId) {
        await supabaseAdmin
          .from('stores')
          .update({ owner_id: null, status: 'inactive' })
          .eq('id', storeId)
        deletedItems.stores_orphaned = 1
      }

      // Delete auth user
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (authDeleteError) {
        console.error('Erro ao deletar auth user:', authDeleteError)
      } else {
        deletedItems.auth_users = 1
      }

      // Log action
      await supabaseAdmin.from('admin_audit_log').insert({
        admin_id: caller.id,
        target_user_id: userId,
        action: 'delete_user_only',
        details: { reason, user_name: targetUser.full_name, store_orphaned: userStore?.name, deletedItems }
      })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Usuário excluído. Loja mantida como órfã.',
          deletedItems
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // MODE: FULL - Delete everything
    if (deleteMode === 'full' && storeId) {
      console.log(`[delete-user-complete] Full delete for store: ${storeId}`)

      // Order matters! Delete child records first to avoid FK errors

      // 1. Get comanda IDs first
      const { data: comandaIds } = await supabaseAdmin
        .from('comandas')
        .select('id')
        .eq('store_id', storeId)
      
      if (comandaIds && comandaIds.length > 0) {
        const { count: comandaItemsCount } = await supabaseAdmin
          .from('comanda_items')
          .delete({ count: 'exact' })
          .in('comanda_id', comandaIds.map(c => c.id))
        deletedItems.comanda_items = comandaItemsCount || 0
      }

      // 2. Comandas
      const { count: comandasCount } = await supabaseAdmin
        .from('comandas')
        .delete({ count: 'exact' })
        .eq('store_id', storeId)
      deletedItems.comandas = comandasCount || 0

      // 3. Get order IDs first
      const { data: orderIds } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('store_id', storeId)
      
      if (orderIds && orderIds.length > 0) {
        const { count: orderItemsCount } = await supabaseAdmin
          .from('order_items')
          .delete({ count: 'exact' })
          .in('order_id', orderIds.map(o => o.id))
        deletedItems.order_items = orderItemsCount || 0
      }

      // 4. Delivery assignments
      const { count: deliveryCount } = await supabaseAdmin
        .from('delivery_assignments')
        .delete({ count: 'exact' })
        .eq('store_id', storeId)
      deletedItems.delivery_assignments = deliveryCount || 0

      // 5. Orders
      const { count: ordersCount } = await supabaseAdmin
        .from('orders')
        .delete({ count: 'exact' })
        .eq('store_id', storeId)
      deletedItems.orders = ordersCount || 0

      // 6. Product addons
      const { count: addonsCount } = await supabaseAdmin
        .from('addons')
        .delete({ count: 'exact' })
        .eq('store_id', storeId)
      deletedItems.addons = addonsCount || 0

      // 7. Addon categories
      const { count: addonCatsCount } = await supabaseAdmin
        .from('addon_categories')
        .delete({ count: 'exact' })
        .eq('store_id', storeId)
      deletedItems.addon_categories = addonCatsCount || 0

      // 8. Products
      const { count: productsCount } = await supabaseAdmin
        .from('products')
        .delete({ count: 'exact' })
        .eq('store_id', storeId)
      deletedItems.products = productsCount || 0

      // 9. Categories
      const { count: categoriesCount } = await supabaseAdmin
        .from('categories')
        .delete({ count: 'exact' })
        .eq('store_id', storeId)
      deletedItems.categories = categoriesCount || 0

      // 10. Bookings
      const { count: bookingsCount } = await supabaseAdmin
        .from('bookings')
        .delete({ count: 'exact' })
        .eq('store_id', storeId)
      deletedItems.bookings = bookingsCount || 0

      // 11. Professionals
      const { count: professionalsCount } = await supabaseAdmin
        .from('professionals')
        .delete({ count: 'exact' })
        .eq('store_id', storeId)
      deletedItems.professionals = professionalsCount || 0

      // 12. Booking services
      const { count: bookingServicesCount } = await supabaseAdmin
        .from('booking_services')
        .delete({ count: 'exact' })
        .eq('store_id', storeId)
      deletedItems.booking_services = bookingServicesCount || 0

      // 13. Banners
      const { count: bannersCount } = await supabaseAdmin
        .from('banners')
        .delete({ count: 'exact' })
        .eq('store_id', storeId)
      deletedItems.banners = bannersCount || 0

      // 14. Customer stores (relationship)
      const { count: customerStoresCount } = await supabaseAdmin
        .from('customer_stores')
        .delete({ count: 'exact' })
        .eq('store_id', storeId)
      deletedItems.customer_stores = customerStoresCount || 0

      // 15. Promotions
      const { count: promotionsCount } = await supabaseAdmin
        .from('promotions')
        .delete({ count: 'exact' })
        .eq('store_id', storeId)
      deletedItems.promotions = promotionsCount || 0

      // 16. User roles for this store
      const { count: storeRolesCount } = await supabaseAdmin
        .from('user_roles')
        .delete({ count: 'exact' })
        .eq('store_id', storeId)
      deletedItems.store_user_roles = storeRolesCount || 0

      // 17. Store
      const { error: storeDeleteError } = await supabaseAdmin
        .from('stores')
        .delete()
        .eq('id', storeId)
      
      if (storeDeleteError) {
        console.error('Erro ao deletar loja:', storeDeleteError)
      } else {
        deletedItems.stores = 1
      }
    }

    // Delete user's own roles (not store-specific)
    const { count: userRolesCount } = await supabaseAdmin
      .from('user_roles')
      .delete({ count: 'exact' })
      .eq('user_id', userId)
    deletedItems.user_roles = (deletedItems.user_roles || 0) + (userRolesCount || 0)

    // Delete profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)
    
    if (profileError) {
      console.error('Erro ao deletar profile:', profileError)
    } else {
      deletedItems.profiles = 1
    }

    // Delete auth user
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (authDeleteError) {
      console.error('Erro ao deletar auth user:', authDeleteError)
    } else {
      deletedItems.auth_users = 1
    }

    // Log action
    await supabaseAdmin.from('admin_audit_log').insert({
      admin_id: caller.id,
      target_user_id: userId,
      action: 'delete_full',
      details: { 
        reason, 
        user_name: targetUser.full_name, 
        user_email: targetUser.email,
        store_name: userStore?.name,
        deletedItems 
      }
    })

    console.log(`[delete-user-complete] Completed. Deleted:`, deletedItems)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Usuário e todos os dados excluídos com sucesso',
        deletedItems
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('[delete-user-complete] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro interno'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
