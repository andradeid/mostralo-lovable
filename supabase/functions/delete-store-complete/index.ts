import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteStoreRequest {
  storeId: string
  confirmationName: string
  reason?: string
}

interface DeletionStats {
  [key: string]: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    })
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Verificar se é master_admin
    const { data: { user: caller }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    const { storeId, confirmationName, reason }: DeleteStoreRequest = await req.json()
    
    if (!storeId || !confirmationName) {
      return new Response(
        JSON.stringify({ error: 'storeId e confirmationName são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar dados da loja
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('id, name, slug, owner_id, logo_url, cover_url')
      .eq('id', storeId)
      .single()

    if (storeError || !store) {
      return new Response(
        JSON.stringify({ error: 'Loja não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validar nome da confirmação
    if (confirmationName.toLowerCase() !== store.name.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'Nome da loja não corresponde à confirmação' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[delete-store-complete] Iniciando exclusão da loja: ${store.name} (${storeId})`)

    const deletedItems: DeletionStats = {}

    // 1. Tratar tabelas SEM CASCADE primeiro (SET NULL ou delete manual)
    
    // coupon_usage - SET NULL no store_id
    const { data: couponUsageData } = await supabaseAdmin
      .from('coupon_usage')
      .update({ store_id: null })
      .eq('store_id', storeId)
      .select('id')
    deletedItems.coupon_usage_cleared = couponUsageData?.length || 0

    // salesperson_sales - SET NULL no store_id
    const { data: salesData } = await supabaseAdmin
      .from('salesperson_sales')
      .update({ store_id: null })
      .eq('store_id', storeId)
      .select('id')
    deletedItems.salesperson_sales_cleared = salesData?.length || 0

    // merchant_contract_acceptance - deletar registros
    const { count: merchantContractCount } = await supabaseAdmin
      .from('merchant_contract_acceptance')
      .delete({ count: 'exact' })
      .eq('store_id', storeId)
    deletedItems.merchant_contract_acceptance = merchantContractCount || 0

    // salesperson_commissions via payment_approvals - SET NULL
    const { data: paymentApprovals } = await supabaseAdmin
      .from('payment_approvals')
      .select('id')
      .eq('store_id', storeId)

    if (paymentApprovals && paymentApprovals.length > 0) {
      const approvalIds = paymentApprovals.map(p => p.id)
      const { data: commissionsData } = await supabaseAdmin
        .from('salesperson_commissions')
        .update({ payment_approval_id: null })
        .in('payment_approval_id', approvalIds)
        .select('id')
      deletedItems.salesperson_commissions_cleared = commissionsData?.length || 0
    }

    // 2. Deletar arquivos do storage (logo e cover)
    if (store.logo_url) {
      try {
        const logoPath = extractStoragePath(store.logo_url)
        if (logoPath) {
          await supabaseAdmin.storage.from('store-assets').remove([logoPath])
          deletedItems.storage_logo = 1
        }
      } catch (e) {
        console.error('Erro ao deletar logo:', e)
      }
    }

    if (store.cover_url) {
      try {
        const coverPath = extractStoragePath(store.cover_url)
        if (coverPath) {
          await supabaseAdmin.storage.from('store-assets').remove([coverPath])
          deletedItems.storage_cover = 1
        }
      } catch (e) {
        console.error('Erro ao deletar cover:', e)
      }
    }

    // 3. Deletar itens de comandas
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

    // 4. Deletar comandas
    const { count: comandasCount } = await supabaseAdmin
      .from('comandas')
      .delete({ count: 'exact' })
      .eq('store_id', storeId)
    deletedItems.comandas = comandasCount || 0

    // 5. Deletar itens de pedidos
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

    // 6. Deletar delivery assignments
    const { count: deliveryCount } = await supabaseAdmin
      .from('delivery_assignments')
      .delete({ count: 'exact' })
      .eq('store_id', storeId)
    deletedItems.delivery_assignments = deliveryCount || 0

    // 7. Deletar pedidos
    const { count: ordersCount } = await supabaseAdmin
      .from('orders')
      .delete({ count: 'exact' })
      .eq('store_id', storeId)
    deletedItems.orders = ordersCount || 0

    // 8. Deletar addons
    const { count: addonsCount } = await supabaseAdmin
      .from('addons')
      .delete({ count: 'exact' })
      .eq('store_id', storeId)
    deletedItems.addons = addonsCount || 0

    // 9. Deletar addon categories
    const { count: addonCatsCount } = await supabaseAdmin
      .from('addon_categories')
      .delete({ count: 'exact' })
      .eq('store_id', storeId)
    deletedItems.addon_categories = addonCatsCount || 0

    // 10. Deletar variantes de produtos primeiro
    const { data: productIds } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('store_id', storeId)

    if (productIds && productIds.length > 0) {
      const { count: variantsCount } = await supabaseAdmin
        .from('product_variants')
        .delete({ count: 'exact' })
        .in('product_id', productIds.map(p => p.id))
      deletedItems.product_variants = variantsCount || 0

      const { count: productAddonsCount } = await supabaseAdmin
        .from('product_addons')
        .delete({ count: 'exact' })
        .in('product_id', productIds.map(p => p.id))
      deletedItems.product_addons = productAddonsCount || 0
    }

    // 11. Deletar produtos
    const { count: productsCount } = await supabaseAdmin
      .from('products')
      .delete({ count: 'exact' })
      .eq('store_id', storeId)
    deletedItems.products = productsCount || 0

    // 12. Deletar categorias
    const { count: categoriesCount } = await supabaseAdmin
      .from('categories')
      .delete({ count: 'exact' })
      .eq('store_id', storeId)
    deletedItems.categories = categoriesCount || 0

    // 13. Deletar bookings
    const { count: bookingsCount } = await supabaseAdmin
      .from('bookings')
      .delete({ count: 'exact' })
      .eq('store_id', storeId)
    deletedItems.bookings = bookingsCount || 0

    // 14. Deletar professionals
    const { count: professionalsCount } = await supabaseAdmin
      .from('professionals')
      .delete({ count: 'exact' })
      .eq('store_id', storeId)
    deletedItems.professionals = professionalsCount || 0

    // 15. Deletar booking services
    const { count: bookingServicesCount } = await supabaseAdmin
      .from('booking_services')
      .delete({ count: 'exact' })
      .eq('store_id', storeId)
    deletedItems.booking_services = bookingServicesCount || 0

    // 16. Deletar banners
    const { count: bannersCount } = await supabaseAdmin
      .from('banners')
      .delete({ count: 'exact' })
      .eq('store_id', storeId)
    deletedItems.banners = bannersCount || 0

    // 17. Deletar customer_stores (relacionamento)
    const { count: customerStoresCount } = await supabaseAdmin
      .from('customer_stores')
      .delete({ count: 'exact' })
      .eq('store_id', storeId)
    deletedItems.customer_stores = customerStoresCount || 0

    // 18. Deletar promotions
    const { count: promotionsCount } = await supabaseAdmin
      .from('promotions')
      .delete({ count: 'exact' })
      .eq('store_id', storeId)
    deletedItems.promotions = promotionsCount || 0

    // 19. Deletar user_roles desta loja
    const { count: storeRolesCount } = await supabaseAdmin
      .from('user_roles')
      .delete({ count: 'exact' })
      .eq('store_id', storeId)
    deletedItems.user_roles = storeRolesCount || 0

    // 20. Deletar whatsapp_instances
    const { count: whatsappCount } = await supabaseAdmin
      .from('whatsapp_instances')
      .delete({ count: 'exact' })
      .eq('store_id', storeId)
    deletedItems.whatsapp_instances = whatsappCount || 0

    // 21. Deletar payment_approvals
    const { count: paymentApprovalsCount } = await supabaseAdmin
      .from('payment_approvals')
      .delete({ count: 'exact' })
      .eq('store_id', storeId)
    deletedItems.payment_approvals = paymentApprovalsCount || 0

    // 22. Deletar store_delivery_config
    const { count: deliveryConfigCount } = await supabaseAdmin
      .from('store_delivery_config')
      .delete({ count: 'exact' })
      .eq('store_id', storeId)
    deletedItems.store_delivery_config = deliveryConfigCount || 0

    // 23. Deletar store_business_hours
    const { count: businessHoursCount } = await supabaseAdmin
      .from('store_business_hours')
      .delete({ count: 'exact' })
      .eq('store_id', storeId)
    deletedItems.store_business_hours = businessHoursCount || 0

    // 24. Finalmente, deletar a loja
    const { error: storeDeleteError } = await supabaseAdmin
      .from('stores')
      .delete()
      .eq('id', storeId)

    if (storeDeleteError) {
      console.error('Erro ao deletar loja:', storeDeleteError)
      return new Response(
        JSON.stringify({ 
          error: 'Erro ao deletar loja: ' + storeDeleteError.message,
          partialDeletion: deletedItems 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    deletedItems.stores = 1

    // Log da ação
    await supabaseAdmin.from('admin_audit_log').insert({
      admin_id: caller.id,
      target_user_id: store.owner_id || caller.id,
      action: 'delete_store_complete',
      details: { 
        reason, 
        store_name: store.name,
        store_slug: store.slug,
        store_id: storeId,
        deletedItems 
      }
    })

    console.log(`[delete-store-complete] Loja ${store.name} excluída com sucesso:`, deletedItems)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Loja "${store.name}" e todos os dados relacionados foram excluídos com sucesso`,
        deletedItems
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('[delete-store-complete] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro interno'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper para extrair path do storage de uma URL
function extractStoragePath(url: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/store-assets\/(.+)/)
    return pathMatch ? pathMatch[1] : null
  } catch {
    return null
  }
}
