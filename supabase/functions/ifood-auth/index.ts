import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// URLs da API iFood
const IFOOD_AUTH_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token'
const IFOOD_AUTH_SANDBOX_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token' // Mesmo endpoint, muda o client

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { action, store_id, client_id, client_secret, authorization_code } = await req.json()
    
    console.log(`🍔 iFood Auth: action=${action}, store_id=${store_id}`)

    if (!store_id) {
      throw new Error('store_id é obrigatório')
    }

    switch (action) {
      case 'save_credentials': {
        // Salvar credenciais do iFood
        if (!client_id || !client_secret) {
          throw new Error('client_id e client_secret são obrigatórios')
        }

        const { data, error } = await supabase
          .from('ifood_integrations')
          .upsert({
            store_id,
            client_id,
            client_secret,
            is_active: false,
            environment: 'sandbox',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'store_id'
          })
          .select()
          .single()

        if (error) throw error

        console.log('✅ Credenciais salvas com sucesso')
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Credenciais salvas com sucesso',
          data 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'get_token': {
        // Obter token de acesso
        const { data: integration, error: fetchError } = await supabase
          .from('ifood_integrations')
          .select('*')
          .eq('store_id', store_id)
          .single()

        if (fetchError || !integration) {
          throw new Error('Integração não encontrada. Configure as credenciais primeiro.')
        }

        if (!integration.client_id || !integration.client_secret) {
          throw new Error('Client ID e Client Secret não configurados')
        }

        // Fazer requisição para obter token
        const tokenResponse = await fetch(IFOOD_AUTH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            'grantType': 'client_credentials',
            'clientId': integration.client_id,
            'clientSecret': integration.client_secret
          })
        })

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text()
          console.error('❌ Erro ao obter token:', errorText)
          throw new Error(`Erro ao autenticar com iFood: ${tokenResponse.status}`)
        }

        const tokenData = await tokenResponse.json()
        console.log('🎫 Token obtido com sucesso')

        // Calcular data de expiração
        const expiresAt = new Date()
        expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expiresIn || 3600))

        // Salvar token no banco
        const { error: updateError } = await supabase
          .from('ifood_integrations')
          .update({
            access_token: tokenData.accessToken,
            refresh_token: tokenData.refreshToken || null,
            token_expires_at: expiresAt.toISOString(),
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('store_id', store_id)

        if (updateError) throw updateError

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Token obtido com sucesso',
          expires_at: expiresAt.toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'refresh_token': {
        // Renovar token
        const { data: integration, error: fetchError } = await supabase
          .from('ifood_integrations')
          .select('*')
          .eq('store_id', store_id)
          .single()

        if (fetchError || !integration) {
          throw new Error('Integração não encontrada')
        }

        if (!integration.refresh_token) {
          // Se não tem refresh token, obter novo token
          console.log('⚠️ Sem refresh token, obtendo novo token...')
          
          const tokenResponse = await fetch(IFOOD_AUTH_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              'grantType': 'client_credentials',
              'clientId': integration.client_id,
              'clientSecret': integration.client_secret
            })
          })

          if (!tokenResponse.ok) {
            throw new Error('Erro ao renovar token')
          }

          const tokenData = await tokenResponse.json()
          const expiresAt = new Date()
          expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expiresIn || 3600))

          await supabase
            .from('ifood_integrations')
            .update({
              access_token: tokenData.accessToken,
              refresh_token: tokenData.refreshToken || null,
              token_expires_at: expiresAt.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('store_id', store_id)

          return new Response(JSON.stringify({ 
            success: true, 
            message: 'Token renovado com sucesso'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        // Usar refresh token
        const tokenResponse = await fetch(IFOOD_AUTH_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            'grantType': 'refresh_token',
            'clientId': integration.client_id,
            'clientSecret': integration.client_secret,
            'refreshToken': integration.refresh_token
          })
        })

        if (!tokenResponse.ok) {
          throw new Error('Erro ao renovar token')
        }

        const tokenData = await tokenResponse.json()
        const expiresAt = new Date()
        expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expiresIn || 3600))

        await supabase
          .from('ifood_integrations')
          .update({
            access_token: tokenData.accessToken,
            refresh_token: tokenData.refreshToken || integration.refresh_token,
            token_expires_at: expiresAt.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('store_id', store_id)

        console.log('✅ Token renovado com sucesso')
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Token renovado com sucesso'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'disconnect': {
        // Desconectar integração
        const { error } = await supabase
          .from('ifood_integrations')
          .update({
            is_active: false,
            access_token: null,
            refresh_token: null,
            token_expires_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('store_id', store_id)

        if (error) throw error

        console.log('🔌 Integração desconectada')
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Integração desconectada com sucesso'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      case 'test_connection': {
        // Testar conexão com iFood
        const { data: integration, error: fetchError } = await supabase
          .from('ifood_integrations')
          .select('*')
          .eq('store_id', store_id)
          .single()

        if (fetchError || !integration) {
          throw new Error('Integração não encontrada')
        }

        if (!integration.access_token) {
          throw new Error('Token não disponível. Obtenha o token primeiro.')
        }

        // Verificar se token expirou
        if (integration.token_expires_at) {
          const expiresAt = new Date(integration.token_expires_at)
          if (expiresAt < new Date()) {
            throw new Error('Token expirado. Renove o token.')
          }
        }

        // Testar listando merchants
        const merchantsResponse = await fetch('https://merchant-api.ifood.com.br/merchant/v1.0/merchants', {
          headers: {
            'Authorization': `Bearer ${integration.access_token}`
          }
        })

        if (!merchantsResponse.ok) {
          throw new Error(`Erro ao conectar com iFood: ${merchantsResponse.status}`)
        }

        const merchants = await merchantsResponse.json()
        console.log('✅ Conexão testada com sucesso, merchants:', merchants.length)

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Conexão com iFood funcionando',
          merchants_count: merchants.length,
          merchants: merchants.slice(0, 5) // Retornar até 5 merchants
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      default:
        throw new Error(`Ação desconhecida: ${action}`)
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('❌ Erro:', errorMessage)
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
