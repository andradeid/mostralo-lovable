import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const IFOOD_API_URL = 'https://merchant-api.ifood.com.br'

// Mapeamento de status iFood -> Mostralo
const STATUS_MAP: Record<string, string> = {
  'PLC': 'entrada',
  'CFM': 'em_preparo',
  'PRS': 'em_preparo',
  'RTP': 'aguarda_retirada',
  'DSP': 'em_transito',
  'CON': 'concluido',
  'CAN': 'cancelado',
  'PLACED': 'entrada',
  'CONFIRMED': 'em_preparo',
  'PREPARATION_STARTED': 'em_preparo',
  'READY_TO_PICKUP': 'aguarda_retirada',
  'DISPATCHED': 'em_transito',
  'CONCLUDED': 'concluido',
  'CANCELLED': 'cancelado'
}

const PAYMENT_METHOD_MAP: Record<string, string> = {
  'CREDIT': 'cartao_credito',
  'DEBIT': 'cartao_debito',
  'PIX': 'pix',
  'CASH': 'dinheiro',
  'MEAL_VOUCHER': 'vale_refeicao',
  'FOOD_VOUCHER': 'vale_alimentacao',
  'DIGITAL_WALLET': 'pix',
  'COUPON': 'outro',
  'REDEEM': 'outro',
  'PREPAID_REDEEM': 'outro'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    console.log('[CRON] Iniciando polling automático do iFood...')

    // Buscar todas as lojas com integração iFood ativa
    const { data: integrations, error: intError } = await supabase
      .from('ifood_integrations')
      .select('*')
      .eq('is_active', true)
      .not('access_token', 'is', null)

    if (intError) {
      console.error('[CRON] Erro ao buscar integrações:', intError)
      throw intError
    }

    if (!integrations || integrations.length === 0) {
      console.log('[CRON] Nenhuma integração iFood ativa encontrada')
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhuma integração ativa', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[CRON] Encontradas ${integrations.length} integrações ativas`)

    let totalProcessed = 0
    const results: any[] = []

    for (const integration of integrations) {
      try {
        // Verificar se token não está expirado
        const tokenExpiry = new Date(integration.token_expires_at)
        if (tokenExpiry < new Date()) {
          console.log(`[CRON] Token expirado para loja ${integration.store_id}, tentando renovar...`)
          
          // Tentar renovar token
          const refreshed = await refreshToken(supabase, integration)
          if (!refreshed) {
            console.error(`[CRON] Falha ao renovar token para loja ${integration.store_id}`)
            results.push({ store_id: integration.store_id, error: 'Token expirado e não foi possível renovar' })
            continue
          }
          
          // Buscar integração atualizada
          const { data: updatedInt } = await supabase
            .from('ifood_integrations')
            .select('*')
            .eq('id', integration.id)
            .single()
          
          if (updatedInt) {
            integration.access_token = updatedInt.access_token
          }
        }

        // Fazer polling de eventos
        const eventsResult = await pollEvents(supabase, integration)
        totalProcessed += eventsResult.processed
        results.push({ store_id: integration.store_id, ...eventsResult })

      } catch (storeError) {
        console.error(`[CRON] Erro ao processar loja ${integration.store_id}:`, storeError)
        results.push({ store_id: integration.store_id, error: String(storeError) })
      }
    }

    console.log(`[CRON] Polling concluído. Total de eventos processados: ${totalProcessed}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Polling concluído para ${integrations.length} lojas`,
        totalProcessed,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[CRON] Erro geral no polling:', error)
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function refreshToken(supabase: any, integration: any): Promise<boolean> {
  try {
    if (!integration.refresh_token) {
      console.log('[CRON] Sem refresh_token disponível')
      return false
    }

    const tokenResponse = await fetch(`${IFOOD_API_URL}/authentication/v1.0/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: integration.client_id,
        client_secret: integration.client_secret,
        refresh_token: integration.refresh_token
      })
    })

    if (!tokenResponse.ok) {
      console.error('[CRON] Falha ao renovar token:', await tokenResponse.text())
      return false
    }

    const tokenData = await tokenResponse.json()
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000))

    await supabase
      .from('ifood_integrations')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || integration.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', integration.id)

    console.log('[CRON] Token renovado com sucesso')
    return true

  } catch (error) {
    console.error('[CRON] Erro ao renovar token:', error)
    return false
  }
}

async function pollEvents(supabase: any, integration: any): Promise<{ processed: number, events: number }> {
  console.log(`[CRON] Polling eventos para loja ${integration.store_id}...`)

  const response = await fetch(`${IFOOD_API_URL}/order/v1.0/events:polling`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${integration.access_token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[CRON] Erro no polling (${response.status}):`, errorText)
    throw new Error(`Polling failed: ${response.status} - ${errorText}`)
  }

  const events = await response.json()
  
  if (!Array.isArray(events) || events.length === 0) {
    console.log(`[CRON] Nenhum evento pendente para loja ${integration.store_id}`)
    return { processed: 0, events: 0 }
  }

  console.log(`[CRON] ${events.length} eventos recebidos para loja ${integration.store_id}`)

  let processed = 0
  const eventIdsToAck: string[] = []

  for (const event of events) {
    try {
      await processEvent(supabase, event, integration.store_id)
      eventIdsToAck.push(event.id)
      processed++
    } catch (eventError) {
      console.error(`[CRON] Erro ao processar evento ${event.id}:`, eventError)
    }
  }

  // Fazer acknowledge dos eventos processados
  if (eventIdsToAck.length > 0) {
    await acknowledgeEvents(integration.access_token, eventIdsToAck)
  }

  // Atualizar last_sync_at
  await supabase
    .from('ifood_integrations')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('id', integration.id)

  return { processed, events: events.length }
}

async function processEvent(supabase: any, event: any, storeId: string): Promise<void> {
  const eventCode = event.code || event.fullCode
  const orderId = event.orderId || event.correlationId

  console.log(`[CRON] Processando evento: ${eventCode} para pedido ${orderId}`)

  // Registrar evento no log
  await supabase
    .from('ifood_events_log')
    .upsert({
      event_id: event.id,
      store_id: storeId,
      event_type: eventCode,
      event_code: eventCode,
      order_id: orderId,
      payload: event,
      processed: false,
      created_at: new Date().toISOString()
    }, { onConflict: 'event_id' })

  // Se for evento de novo pedido (PLACED/PLC), criar o pedido
  if (eventCode === 'PLC' || eventCode === 'PLACED') {
    await createOrderFromEvent(supabase, storeId, event)
  } else {
    // Atualizar status do pedido existente
    await updateOrderStatus(supabase, storeId, event)
  }

  // Marcar evento como processado
  await supabase
    .from('ifood_events_log')
    .update({ 
      processed: true, 
      processed_at: new Date().toISOString() 
    })
    .eq('event_id', event.id)
}

async function createOrderFromEvent(supabase: any, storeId: string, event: any): Promise<void> {
  const orderId = event.orderId || event.correlationId

  // Verificar se pedido já existe
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('external_id', orderId)
    .eq('store_id', storeId)
    .single()

  if (existingOrder) {
    console.log(`[CRON] Pedido ${orderId} já existe, ignorando criação`)
    return
  }

  // Buscar detalhes do pedido no iFood
  const { data: integration } = await supabase
    .from('ifood_integrations')
    .select('access_token')
    .eq('store_id', storeId)
    .single()

  if (!integration?.access_token) {
    throw new Error('Token de acesso não encontrado')
  }

  const orderResponse = await fetch(`${IFOOD_API_URL}/order/v1.0/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${integration.access_token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!orderResponse.ok) {
    throw new Error(`Falha ao buscar detalhes do pedido: ${orderResponse.status}`)
  }

  const orderDetails = await orderResponse.json()

  // Gerar número do pedido
  const { data: orderNumber } = await supabase.rpc('get_next_order_number', { store_uuid: storeId })

  // Mapear método de pagamento
  const paymentMethod = orderDetails.payments?.methods?.[0]?.method || 'CASH'
  const mappedPaymentMethod = PAYMENT_METHOD_MAP[paymentMethod] || 'outro'

  // Formatar endereço
  const deliveryAddress = orderDetails.delivery?.deliveryAddress
  const formattedAddress = deliveryAddress 
    ? `${deliveryAddress.streetName}, ${deliveryAddress.streetNumber}${deliveryAddress.complement ? ` - ${deliveryAddress.complement}` : ''}, ${deliveryAddress.neighborhood}, ${deliveryAddress.city}/${deliveryAddress.state}`
    : null

  // Criar pedido
  const { data: newOrder, error: orderError } = await supabase
    .from('orders')
    .insert({
      store_id: storeId,
      external_id: orderId,
      order_number: orderNumber || `IFOOD-${Date.now()}`,
      source: 'ifood',
      status: 'entrada',
      customer_name: orderDetails.customer?.name || 'Cliente iFood',
      customer_phone: orderDetails.customer?.phone?.number || '',
      customer_email: orderDetails.customer?.email || null,
      customer_address: formattedAddress,
      delivery_type: orderDetails.orderType === 'DELIVERY' ? 'delivery' : 'pickup',
      payment_method: mappedPaymentMethod,
      payment_status: orderDetails.payments?.prepaid ? 'pago' : 'pendente',
      subtotal: orderDetails.total?.subTotal || 0,
      delivery_fee: orderDetails.total?.deliveryFee || 0,
      total: orderDetails.total?.orderAmount || 0,
      notes: orderDetails.additionalInfo || null,
      external_data: orderDetails
    })
    .select()
    .single()

  if (orderError) {
    console.error('[CRON] Erro ao criar pedido:', orderError)
    throw orderError
  }

  console.log(`[CRON] Pedido ${newOrder.order_number} criado com sucesso`)

  // Criar itens do pedido
  if (orderDetails.items && orderDetails.items.length > 0) {
    const orderItems = orderDetails.items.map((item: any) => ({
      order_id: newOrder.id,
      product_name: item.name,
      quantity: item.quantity,
      unit_price: item.unitPrice || item.price || 0,
      subtotal: item.totalPrice || (item.quantity * (item.unitPrice || item.price || 0)),
      notes: item.observations || null
    }))

    await supabase.from('order_items').insert(orderItems)
  }
}

async function updateOrderStatus(supabase: any, storeId: string, event: any): Promise<void> {
  const eventCode = event.code || event.fullCode
  const orderId = event.orderId || event.correlationId

  const newStatus = STATUS_MAP[eventCode]
  if (!newStatus) {
    console.log(`[CRON] Status não mapeado para código: ${eventCode}`)
    return
  }

  const updateData: any = { status: newStatus, updated_at: new Date().toISOString() }

  if (newStatus === 'cancelado') {
    updateData.cancelled_at = new Date().toISOString()
  } else if (newStatus === 'concluido') {
    updateData.completed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('external_id', orderId)
    .eq('store_id', storeId)

  if (error) {
    console.error(`[CRON] Erro ao atualizar status do pedido ${orderId}:`, error)
    throw error
  }

  console.log(`[CRON] Pedido ${orderId} atualizado para status: ${newStatus}`)
}

async function acknowledgeEvents(accessToken: string, eventIds: string[]): Promise<void> {
  try {
    const response = await fetch(`${IFOOD_API_URL}/order/v1.0/events/acknowledgment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventIds.map(id => ({ id })))
    })

    if (!response.ok) {
      console.error('[CRON] Erro ao fazer acknowledge:', await response.text())
    } else {
      console.log(`[CRON] Acknowledge realizado para ${eventIds.length} eventos`)
    }
  } catch (error) {
    console.error('[CRON] Erro ao fazer acknowledge:', error)
  }
}
