import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapeamento de status iFood -> Mostralo (códigos abreviados E por extenso)
// Valores válidos do enum order_status: entrada, em_preparo, aguarda_retirada, em_transito, concluido, cancelado
const STATUS_MAP: Record<string, string> = {
  // Códigos abreviados (como o iFood realmente envia)
  'PLC': 'entrada',           // PLACED → pedido recebido
  'CFM': 'em_preparo',        // CONFIRMED → loja confirmou, inicia preparo
  'PRS': 'em_preparo',        // PREPARATION_STARTED → em preparo
  'RTP': 'aguarda_retirada',  // READY_TO_PICKUP → pronto para retirada
  'DSP': 'em_transito',       // DISPATCHED → saiu para entrega
  'CON': 'concluido',         // CONCLUDED → entregue
  'CAN': 'cancelado',         // CANCELLED → cancelado
  // Códigos por extenso (fallback)
  'PLACED': 'entrada',
  'CONFIRMED': 'em_preparo',
  'PREPARATION_STARTED': 'em_preparo',
  'READY_TO_PICKUP': 'aguarda_retirada',
  'DISPATCHED': 'em_transito',
  'CONCLUDED': 'concluido',
  'CANCELLED': 'cancelado'
}

// Mapeamento de métodos de pagamento (compatível com enum payment_method: pix, card, cash)
const PAYMENT_METHOD_MAP: Record<string, string> = {
  // Cartões (todos mapeiam para 'card')
  'CREDIT': 'card',
  'DEBIT': 'card',
  'MEAL_VOUCHER': 'card',
  'FOOD_VOUCHER': 'card',
  'GIFT_CARD': 'card',
  // Dinheiro
  'CASH': 'cash',
  // PIX
  'PIX': 'pix',
  // Online (pagamento no app = card)
  'ONLINE': 'card'
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
  const eventIds: string[] = []
  
  for (const event of events) {
    const result = await processEvent(supabase, event, storeId)
    processedEvents.push(result)
    if (event.id) {
      eventIds.push(event.id)
    }
  }

  // ✅ ACKNOWLEDGE AUTOMÁTICO - Limpa fila do iFood após processar
  if (eventIds.length > 0) {
    console.log(`✅ Enviando acknowledge para ${eventIds.length} eventos...`)
    try {
      const ackResponse = await fetch('https://merchant-api.ifood.com.br/events/v1.0/events/acknowledgment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventIds.map(id => ({ id })))
      })
      
      if (ackResponse.ok) {
        console.log(`✅ Acknowledge enviado com sucesso para ${eventIds.length} eventos`)
        
        // Marcar como processados no banco
        await supabase
          .from('ifood_events_log')
          .update({ 
            processed: true, 
            processed_at: new Date().toISOString() 
          })
          .in('event_id', eventIds)
      } else {
        const ackError = await ackResponse.text()
        console.error(`⚠️ Erro no acknowledge: ${ackResponse.status} - ${ackError}`)
      }
    } catch (ackErr) {
      console.error('⚠️ Erro ao enviar acknowledge:', ackErr)
    }
  }

  return new Response(JSON.stringify({ 
    success: true,
    events_count: events.length,
    processed: processedEvents,
    acknowledged: eventIds.length
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

  // Se for evento de novo pedido, criar pedido
  if (eventCode === 'PLACED' || event.code === 'PLC') {
    await createOrderFromEvent(supabase, storeId, event)
  } else {
    // TODOS os outros eventos atualizam status (incluindo DSP, RTP, CAR, etc.)
    await updateOrderStatus(supabase, storeId, event)
  }

  // Marcar evento como processado
  await supabase
    .from('ifood_events_log')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('event_id', event.id)

  return { event_id: event.id, success: true }
}

async function createOrderFromEvent(supabase: any, storeId: string, event: any) {
  console.log(`📝 Criando pedido a partir do evento PLACED`)

  const orderId = event.orderId

  // VERIFICAR SE PEDIDO JÁ EXISTE (evitar duplicatas)
  // IMPORTANTE: usar maybeSingle() para não lançar erro quando não encontrar
  const { data: existingOrder, error: existingError } = await supabase
    .from('orders')
    .select('id, status, order_number')
    .eq('external_id', orderId)
    .eq('store_id', storeId)
    .maybeSingle()

  // Se houve erro de banco (não erro de "não encontrado"), logar
  if (existingError) {
    console.error('⚠️ Erro ao verificar pedido existente:', existingError)
  }

  if (existingOrder) {
    console.log(`⏭️ Pedido ${orderId} já existe (${existingOrder.order_number}), ignorando criação`)
    return existingOrder
  }

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
  console.log(`📋 Dados do pedido recebidos:`, orderData.displayId, `| Localizador: ${orderData.shortReference}`)

  // Gerar order_number
  const { data: nextNumber } = await supabase.rpc('get_next_order_number', { store_uuid: storeId })
  const orderNumber = `IF-${nextNumber || orderData.displayId}`

  // Mapear método de pagamento (fallback para 'card' que é mais comum em apps)
  const payment = orderData.payments?.[0]
  const paymentMethod = payment ? (PAYMENT_METHOD_MAP[payment.type] || 'card') : 'card'
  console.log(`💳 Pagamento: tipo=${payment?.type} -> mapeado=${paymentMethod}`)

  // Formatar endereço
  const delivery = orderData.delivery?.deliveryAddress
  const customerAddress = delivery 
    ? `${delivery.streetName}, ${delivery.streetNumber}${delivery.complement ? ' - ' + delivery.complement : ''}, ${delivery.neighborhood}, ${delivery.city} - ${delivery.state}`
    : null

  // Buscar ou criar cliente para aplicar etiqueta
  let customerId: string | null = null
  const customerPhone = orderData.customer?.phone?.number || ''
  const customerName = orderData.customer?.name || 'Cliente iFood'
  
  if (customerPhone) {
    const normalizedPhone = customerPhone.replace(/\D/g, '')
    
    // Verificar se cliente já existe
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle()
    
    if (existingCustomer) {
      customerId = existingCustomer.id
    } else {
      // Criar novo cliente
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          name: customerName,
          phone: normalizedPhone,
          address: customerAddress,
        })
        .select('id')
        .single()
      customerId = newCustomer?.id || null
    }
  }

  // Criar pedido COM short_reference (localizador do iFood)
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      store_id: storeId,
      order_number: orderNumber,
      short_reference: orderData.shortReference || null, // Localizador do iFood (ex: "2677 3093")
      customer_id: customerId,
      customer_name: customerName,
      customer_phone: customerPhone,
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

  console.log(`✅ Pedido ${orderNumber} criado com sucesso | Localizador: ${orderData.shortReference}`)

  // Aplicar etiquetas "iFood" e "Delivery" ao cliente
  if (customerId) {
    const labelsToApply = ['iFood']
    if (orderData.orderType === 'DELIVERY') {
      labelsToApply.push('Delivery')
    }
    
    for (const labelName of labelsToApply) {
      // Buscar label_id
      const { data: label } = await supabase
        .from('customer_labels')
        .select('id')
        .eq('store_id', storeId)
        .eq('name', labelName)
        .maybeSingle()
      
      if (label) {
        // Verificar se já existe a atribuição
        const { data: existing } = await supabase
          .from('customer_label_assignments')
          .select('id')
          .eq('customer_id', customerId)
          .eq('label_id', label.id)
          .maybeSingle()
        
        if (!existing) {
          await supabase
            .from('customer_label_assignments')
            .insert({
              customer_id: customerId,
              label_id: label.id,
              store_id: storeId,
            })
          console.log(`🏷️ Etiqueta "${labelName}" aplicada ao cliente ${customerId}`)
        }
      }
    }
  }

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
  // Tentar mapear pelo código abreviado OU pelo fullCode
  const eventCode = event.fullCode || event.code
  const newStatus = STATUS_MAP[eventCode] || STATUS_MAP[event.code]
  
  if (!newStatus) {
    console.log(`⚠️ Status não mapeado: ${event.code} / ${event.fullCode}`)
    return
  }

  console.log(`🔄 Atualizando pedido ${event.orderId} para status ${newStatus} (evento: ${eventCode})`)

  const updateData: any = {
    status: newStatus,
    updated_at: new Date().toISOString()
  }

  // Tratar cancelamento (CAN ou CANCELLED)
  if (event.code === 'CAN' || event.code === 'CANCELLED' || eventCode === 'CANCELLED') {
    updateData.cancelled_at = new Date().toISOString()
    updateData.cancellation_reason = event.metadata?.reason || event.cancellationReason || 'Cancelado pelo iFood'
  }

  // Tratar conclusão (CON ou CONCLUDED)
  if (event.code === 'CON' || event.code === 'CONCLUDED' || eventCode === 'CONCLUDED') {
    updateData.completed_at = new Date().toISOString()
  }

  const { error, data } = await supabase
    .from('orders')
    .update(updateData)
    .eq('external_id', event.orderId)
    .eq('store_id', storeId)
    .select('id, order_number')
    .single()

  if (error) {
    console.error('❌ Erro ao atualizar status:', error)
  } else if (data) {
    console.log(`✅ Pedido ${data.order_number} atualizado para ${newStatus}`)
  } else {
    console.log(`⚠️ Nenhum pedido encontrado com external_id ${event.orderId}`)
  }
}
