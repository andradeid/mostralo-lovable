import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Parse request body for source identification
    let source = 'manual'
    try {
      const body = await req.json()
      source = body.source || 'manual'
    } catch {
      // No body or invalid JSON, use default
    }

    console.log(`[reset-monthly-affiliate-earnings] Iniciando reset mensal. Source: ${source}`)

    // 1. Buscar afiliados com ganhos > 0
    const { data: affiliates, error: fetchError } = await supabase
      .from('salespeople')
      .select('id, full_name, current_month_earnings')
      .eq('salesperson_type', 'affiliate')
      .gt('current_month_earnings', 0)

    if (fetchError) {
      console.error('[reset-monthly-affiliate-earnings] Erro ao buscar afiliados:', fetchError)
      throw new Error(`Erro ao buscar afiliados: ${fetchError.message}`)
    }

    // 2. Validar se há afiliados para resetar
    if (!affiliates || affiliates.length === 0) {
      console.log('[reset-monthly-affiliate-earnings] Nenhum afiliado com ganhos para resetar')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhum afiliado com ganhos para resetar',
          data: {
            affiliates_count: 0,
            total_reset_amount: 0,
            reset_details: [],
            executed_at: new Date().toISOString(),
            source
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[reset-monthly-affiliate-earnings] Encontrados ${affiliates.length} afiliados com ganhos`)

    // 3. Calcular totais e preparar detalhes
    const resetDetails = affiliates.map(a => ({
      affiliate_id: a.id,
      affiliate_name: a.full_name,
      reset_amount: Number(a.current_month_earnings)
    }))

    const totalResetAmount = resetDetails.reduce((sum, d) => sum + d.reset_amount, 0)

    console.log(`[reset-monthly-affiliate-earnings] Total a resetar: R$ ${totalResetAmount.toFixed(2)}`)

    // 4. Inserir registro histórico
    const { error: historyError } = await supabase
      .from('affiliate_earnings_resets')
      .insert({
        affiliates_count: affiliates.length,
        total_reset_amount: totalResetAmount,
        reset_details: resetDetails,
        executed_by: source,
        notes: `Reset automático mensal via ${source}`
      })

    if (historyError) {
      console.error('[reset-monthly-affiliate-earnings] Erro ao registrar histórico:', historyError)
      throw new Error(`Erro ao registrar histórico: ${historyError.message}`)
    }

    console.log('[reset-monthly-affiliate-earnings] Histórico registrado com sucesso')

    // 5. Zerar ganhos de todos os afiliados encontrados
    const affiliateIds = affiliates.map(a => a.id)
    const { error: updateError } = await supabase
      .from('salespeople')
      .update({
        current_month_earnings: 0,
        last_earnings_reset_at: new Date().toISOString()
      })
      .in('id', affiliateIds)

    if (updateError) {
      console.error('[reset-monthly-affiliate-earnings] Erro ao zerar ganhos:', updateError)
      throw new Error(`Erro ao zerar ganhos: ${updateError.message}`)
    }

    console.log(`[reset-monthly-affiliate-earnings] Reset concluído com sucesso para ${affiliates.length} afiliados`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Reset mensal executado com sucesso',
        data: {
          affiliates_count: affiliates.length,
          total_reset_amount: totalResetAmount,
          reset_details: resetDetails,
          executed_at: new Date().toISOString(),
          source
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro interno ao executar reset'
    console.error('[reset-monthly-affiliate-earnings] Erro:', errorMessage)
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
