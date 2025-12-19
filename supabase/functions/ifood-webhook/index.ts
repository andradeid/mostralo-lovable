import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapeamento de status iFood -> Mostralo (códigos abreviados E por extenso)
const STATUS_MAP: Record<string, string> = {
  // Códigos abreviados (como o iFood realmente envia)
  'PLC': 'entrada',
  'CFM': 'confirmado',
  'PRS': 'em_preparo',
  'RTP': 'aguarda_retirada',
  'DSP': 'em_transito',
  'CON': 'concluido',
  'CAN': 'cancelado',
  // Códigos por extenso (fallback)
  'PLACED': 'entrada',
  'CONFIRMED': 'confirmado',
  'PREPARATION_STARTED': 'em_preparo',
  'READY_TO_PICKUP': 'aguarda_retirada',
  'DISPATCHED': 'em_transito',
  'CONCLUDED': 'concluido',
  'CANCELLED': 'cancelado'
}

// Mapeamento de métodos de pagamento
const PAYMENT_METHOD_MAP: Record<string, string> = {
  'CREDIT': 'cartao_credito',
  'DEBIT': 'cartao_debito',
  'MEAL_VOUCHER': 'vale_refeicao',
  'FOOD_VOUCHER': 'vale_alimentacao',
  'CASH': 'dinheiro',
  'PIX': 'pix',
  'ONLINE': 'online'
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Webhook pode receber eventos ou polling pode chamar com action
    const body = await req.json()
    
    // Se for chamada de polling ou manual
    if (body.action === 'poll_events') {
      return await handlePolling(supabase, body.store_id)
    }

    // Se for chamada de acknowledge
    if (body.action === 'acknowledge_events') {
      return await handleAcknowledge(supabase, body.store_id, body.event_ids)
    }

    // Se for webhook do iFood (array de eventos)
    if (Array.isArray(body)) {
      console.log(`📥 Recebendo ${body.length} eventos do iFood via webhook`)
      
      for (const event of body) {
        await processEvent(supabase, event)
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Evento único
    if (body.id && body.code) {
      await processEvent(supabase, body)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    throw new Error('Formato de requisição inválido')

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('❌ Erro no webhook:', errorMessage)
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function handlePolling(supabase: any, storeId: string) {
  console.log(`🔄 Polling eventos para store ${storeId}`)

  // Buscar integração
  const { data: integration, error: integrationError } = await supabase
    .from('ifood_integrations')
    .select('*')
    .eq('store_id', storeId)
    .single()

  if (integrationError || !integration) {
    throw new Error('Integração não encontrada')
  }

  if (!integration.access_token) {
    throw new Error('Token não disponível')
  }

  // Verificar se token expirou
  if (integration.token_expires_at) {
    const expiresAt = new Date(integration.token_expires_at)
    if (expiresAt < new Date()) {
      throw new Error('Token expirado')
    }
  }

  // Buscar eventos pendentes no iFood
  const eventsResponse = await fetch('https://merchant-api.ifood.com.br/events/v1.0/events:polling', {
    headers: {
      'Authorization': `Bearer ${integration.access_token}`
    }
  })

  if (!eventsResponse.ok) {
    const errorText = await eventsResponse.text()
    console.error('❌ Erro ao buscar eventos:', errorText)
    throw new Error(`Erro ao buscar eventos: ${eventsResponse.status}`)
  }

  // Tratar resposta vazia do iFood (pode retornar corpo vazio ou array vazio)
  const responseText = await eventsResponse.text()
  let events: any[] = []
  
  if (responseText && responseText.trim()) {
    try {
      events = JSON.parse(responseText)
    } catch (parseError) {
      console.log('⚠️ Resposta não é JSON válido, assumindo array vazio')
      events = []
    }
  }
  
  console.log(`📦 ${events.length} eventos recebidos`)

  const processedEvents = []
  for (const event of events) {
    const result = await processEvent(supabase, event, storeId)
    processedEvents.push(result)
  }

  return new Response(JSON.stringify({ 
    success: true,
    events_count: events.length,
    processed: processedEvents
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function handleAcknowledge(supabase: any, storeId: string, eventIds: string[]) {
  console.log(`✅ Acknowledging ${eventIds.length} eventos`)

  // Buscar integração
  const { data: integration, error: integrationError } = await supabase
    .from('ifood_integrations')
    .select('access_token')
    .eq('store_id', storeId)
    .single()

  if (integrationError || !integration?.access_token) {
    throw new Error('Token não disponível')
  }

  // Enviar acknowledgement para iFood
  const ackResponse = await fetch('https://merchant-api.ifood.com.br/events/v1.0/events/acknowledgment', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${integration.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventIds.map(id => ({ id })))
  })

  if (!ackResponse.ok) {
    throw new Error('Erro ao confirmar eventos')
  }

  // Marcar como processados no banco
  await supabase
    .from('ifood_events_log')
    .update({ 
      processed: true, 
      processed_at: new Date().toISOString() 
    })
    .in('event_id', eventIds)

  return new Response(JSON.stringify({ 
    success: true,
    acknowledged: eventIds.length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function processEvent(supabase: any, event: any, defaultStoreId?: string) {
  console.log(`📨 Processando evento: ${event.code} - ${event.id}`)

  // Determinar store_id (do merchant ou default)
  let storeId = defaultStoreId

  if (event.merchantId && !storeId) {
    // Buscar store_id pelo merchant_id
    const { data: integration } = await supabase
      .from('ifood_integrations')
      .select('store_id')
      .eq('merchant_id', event.merchantId)
      .single()

    if (integration) {
      storeId = integration.store_id
    }
  }

  if (!storeId) {
    console.error('❌ Store ID não encontrado para o evento')
    return { event_id: event.id, success: false, error: 'Store não encontrada' }
  }

  // Salvar evento no log
  const { error: logError } = await supabase
    .from('ifood_events_log')
    .upsert({
      store_id: storeId,
      event_id: event.id,
      event_type: event.fullCode || event.code,
      event_code: event.code,
      order_id: event.orderId,
      payload: event
    }, {
      onConflict: 'event_id'
    })

  if (logError) {
    console.error('❌ Erro ao salvar log:', logError)
  }

  // Processar baseado no tipo de evento (usar fullCode quando disponível, fallback para code)
  const eventCode = event.fullCode || event.code
  console.log(`🎯 Código do evento: ${event.code} | fullCode: ${event.fullCode} | usando: ${eventCode}`)

  if (eventCode === 'PLACED' || event.code === 'PLC') {
    await createOrderFromEvent(supabase, storeId, event)
  } else if (['CONFIRMED', 'CFM', 'CANCELLED', 'CAN', 'CONCLUDED', 'CON'].includes(eventCode) || 
             ['CONFIRMED', 'CFM', 'CANCELLED', 'CAN', 'CONCLUDED', 'CON'].includes(event.code)) {
    await updateOrderStatus(supabase, storeId, event)
  }

  return { event_id: event.id, success: true }
}

async function createOrderFromEvent(supabase: any, storeId: string, event: any) {
  console.log(`📝 Criando pedido a partir do evento PLACED`)

  // Buscar detalhes do pedido no iFood
  const { data: integration } = await supabase
    .from('ifood_integrations')
    .select('access_token')
    .eq('store_id', storeId)
    .single()

  if (!integration?.access_token) {
    console.error('❌ Token não disponível para buscar pedido')
    return
  }

  const orderResponse = await fetch(`https://merchant-api.ifood.com.br/order/v1.0/orders/${event.orderId}`, {
    headers: {
      'Authorization': `Bearer ${integration.access_token}`
    }
  })

  if (!orderResponse.ok) {
    console.error('❌ Erro ao buscar detalhes do pedido')
    return
  }

  const orderData = await orderResponse.json()
  console.log(`📋 Dados do pedido recebidos:`, orderData.displayId)

  // Gerar order_number
  const { data: nextNumber } = await supabase.rpc('get_next_order_number', { store_uuid: storeId })
  const orderNumber = `IF-${nextNumber || orderData.displayId}`

  // Mapear método de pagamento
  const payment = orderData.payments?.[0]
  const paymentMethod = payment ? (PAYMENT_METHOD_MAP[payment.type] || 'outro') : 'outro'

  // Formatar endereço
  const delivery = orderData.delivery?.deliveryAddress
  const customerAddress = delivery 
    ? `${delivery.streetName}, ${delivery.streetNumber}${delivery.complement ? ' - ' + delivery.complement : ''}, ${delivery.neighborhood}, ${delivery.city} - ${delivery.state}`
    : null

  // Criar pedido
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      store_id: storeId,
      order_number: orderNumber,
      customer_name: orderData.customer?.name || 'Cliente iFood',
      customer_phone: orderData.customer?.phone?.number || '',
      customer_address: customerAddress,
      delivery_type: orderData.orderType === 'DELIVERY' ? 'delivery' : 'pickup',
      subtotal: orderData.total?.subTotal || 0,
      delivery_fee: orderData.total?.deliveryFee || 0,
      total: orderData.total?.orderAmount || 0,
      payment_method: paymentMethod,
      status: 'entrada',
      source: 'ifood',
      external_id: orderData.id,
      external_data: orderData,
      notes: orderData.customer?.ordersCountOnMerchant === 1 ? '🆕 Primeiro pedido no iFood!' : null
    })
    .select()
    .single()

  if (orderError) {
    console.error('❌ Erro ao criar pedido:', orderError)
    return
  }

  console.log(`✅ Pedido ${orderNumber} criado com sucesso`)

  // Criar itens do pedido
  for (const item of orderData.items || []) {
    const { error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        subtotal: item.totalPrice,
        notes: item.observations || null
      })

    if (itemError) {
      console.error('❌ Erro ao criar item:', itemError)
    }
  }
}

async function updateOrderStatus(supabase: any, storeId: string, event: any) {
  const newStatus = STATUS_MAP[event.code]
  if (!newStatus) {
    console.log(`⚠️ Status não mapeado: ${event.code}`)
    return
  }

  console.log(`🔄 Atualizando pedido ${event.orderId} para status ${newStatus}`)

  const updateData: any = {
    status: newStatus,
    updated_at: new Date().toISOString()
  }

  if (event.code === 'CANCELLED') {
    updateData.cancelled_at = new Date().toISOString()
    updateData.cancellation_reason = event.cancellationReason || 'Cancelado pelo iFood'
  }

  if (event.code === 'CONCLUDED') {
    updateData.completed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('external_id', event.orderId)
    .eq('store_id', storeId)

  if (error) {
    console.error('❌ Erro ao atualizar status:', error)
  } else {
    console.log(`✅ Status atualizado para ${newStatus}`)
  }
}
