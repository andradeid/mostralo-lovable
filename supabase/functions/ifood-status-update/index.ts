import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Mapeamento de status Mostralo → Endpoint iFood
// Documentação: https://developer.ifood.com.br/reference/order-actions
const STATUS_TO_ENDPOINT: Record<string, { endpoint: string; method: string }> = {
  'em_preparo': { endpoint: '/confirm', method: 'POST' },
  'aguarda_retirada': { endpoint: '/readyToPickup', method: 'POST' },
  'em_transito': { endpoint: '/dispatch', method: 'POST' },
  'cancelado': { endpoint: '/requestCancellation', method: 'POST' },
}

// Status que devem iniciar preparação explicitamente no iFood
const START_PREPARATION_STATUSES = ['em_preparo']

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { order_id, new_status, cancellation_reason } = await req.json()

    if (!order_id || !new_status) {
      throw new Error('order_id e new_status são obrigatórios')
    }

    console.log(`🔄 Atualizando status no iFood: pedido=${order_id}, novo_status=${new_status}`)

    // Buscar pedido para obter external_id (ID do iFood) e store_id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, external_id, store_id, source')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      throw new Error('Pedido não encontrado')
    }

    // Verificar se é pedido do iFood
    if (order.source !== 'ifood' || !order.external_id) {
      console.log('ℹ️ Pedido não é do iFood, ignorando sincronização')
      return new Response(JSON.stringify({ 
        success: true, 
        skipped: true,
        message: 'Pedido não é do iFood'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const ifoodOrderId = order.external_id

    // Buscar integração para obter token
    const { data: integration, error: integrationError } = await supabase
      .from('ifood_integrations')
      .select('access_token, token_expires_at, is_active')
      .eq('store_id', order.store_id)
      .single()

    if (integrationError || !integration) {
      throw new Error('Integração iFood não encontrada para esta loja')
    }

    if (!integration.is_active || !integration.access_token) {
      throw new Error('Integração iFood não está ativa')
    }

    // Verificar se token expirou
    if (integration.token_expires_at) {
      const expiresAt = new Date(integration.token_expires_at)
      if (expiresAt < new Date()) {
        throw new Error('Token do iFood expirado. Reconecte a integração.')
      }
    }

    // Verificar se temos endpoint para este status
    const statusConfig = STATUS_TO_ENDPOINT[new_status]
    if (!statusConfig) {
      console.log(`ℹ️ Status ${new_status} não tem ação correspondente no iFood`)
      return new Response(JSON.stringify({ 
        success: true, 
        skipped: true,
        message: `Status ${new_status} não requer ação no iFood`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const baseUrl = 'https://merchant-api.ifood.com.br/order/v1.0/orders'
    const results = []

    // Se for status em_preparo, primeiro confirmar, depois iniciar preparação
    if (new_status === 'em_preparo') {
      // 1. Confirmar pedido
      console.log(`📤 Confirmando pedido ${ifoodOrderId} no iFood`)
      const confirmResponse = await fetch(`${baseUrl}/${ifoodOrderId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!confirmResponse.ok) {
        const errorText = await confirmResponse.text()
        console.error(`❌ Erro ao confirmar: ${confirmResponse.status} - ${errorText}`)
        // Não falhar se já estiver confirmado
        if (confirmResponse.status !== 409) {
          throw new Error(`Erro ao confirmar pedido no iFood: ${confirmResponse.status}`)
        }
        console.log('ℹ️ Pedido já estava confirmado')
      } else {
        console.log('✅ Pedido confirmado no iFood')
        results.push({ action: 'confirm', success: true })
      }

      // 2. Iniciar preparação
      console.log(`📤 Iniciando preparação do pedido ${ifoodOrderId}`)
      const prepResponse = await fetch(`${baseUrl}/${ifoodOrderId}/startPreparation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!prepResponse.ok) {
        const errorText = await prepResponse.text()
        console.error(`❌ Erro ao iniciar preparação: ${prepResponse.status} - ${errorText}`)
        // Não falhar se já estiver em preparação
        if (prepResponse.status !== 409) {
          console.warn('⚠️ Não foi possível iniciar preparação, mas continuando...')
        }
      } else {
        console.log('✅ Preparação iniciada no iFood')
        results.push({ action: 'startPreparation', success: true })
      }
    } else if (new_status === 'cancelado') {
      // Cancelamento requer motivo
      console.log(`📤 Solicitando cancelamento do pedido ${ifoodOrderId}`)
      const cancelResponse = await fetch(`${baseUrl}/${ifoodOrderId}/requestCancellation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: cancellation_reason || 'Cancelado pelo estabelecimento',
          cancellationCode: 'INTERNAL' // Código genérico de cancelamento interno
        })
      })

      if (!cancelResponse.ok) {
        const errorText = await cancelResponse.text()
        console.error(`❌ Erro ao cancelar: ${cancelResponse.status} - ${errorText}`)
        throw new Error(`Erro ao cancelar pedido no iFood: ${cancelResponse.status}`)
      }

      console.log('✅ Cancelamento solicitado no iFood')
      results.push({ action: 'requestCancellation', success: true })
    } else {
      // Outros status: chamar endpoint diretamente
      const url = `${baseUrl}/${ifoodOrderId}${statusConfig.endpoint}`
      console.log(`📤 Chamando ${statusConfig.method} ${url}`)

      const response = await fetch(url, {
        method: statusConfig.method,
        headers: {
          'Authorization': `Bearer ${integration.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ Erro na API iFood: ${response.status} - ${errorText}`)
        
        // Status 409 geralmente significa que a ação já foi executada
        if (response.status === 409) {
          console.log('ℹ️ Ação já foi executada anteriormente')
          results.push({ action: statusConfig.endpoint, success: true, note: 'already_done' })
        } else {
          throw new Error(`Erro ao atualizar status no iFood: ${response.status}`)
        }
      } else {
        console.log(`✅ Status atualizado no iFood: ${new_status}`)
        results.push({ action: statusConfig.endpoint, success: true })
      }
    }

    // Atualizar última sincronização
    await supabase
      .from('ifood_integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('store_id', order.store_id)

    // Registrar evento de sincronização no log
    await supabase
      .from('ifood_events_log')
      .insert({
        store_id: order.store_id,
        event_id: `sync_${order_id}_${Date.now()}`,
        event_type: 'STATUS_SYNC_OUT',
        event_code: new_status,
        order_id: ifoodOrderId,
        payload: { 
          direction: 'mostralo_to_ifood',
          new_status,
          results 
        },
        processed: true,
        processed_at: new Date().toISOString()
      })

    return new Response(JSON.stringify({ 
      success: true,
      message: `Status sincronizado com iFood`,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('❌ Erro ao sincronizar status:', errorMessage)
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
