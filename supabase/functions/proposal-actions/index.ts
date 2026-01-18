import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { action, slug, data } = await req.json()
    console.log(`[proposal-actions] Action: ${action}, Slug: ${slug}`)

    // Fetch proposal by slug
    const { data: proposal, error: fetchError } = await supabase
      .from('commercial_proposals')
      .select('*')
      .eq('slug', slug)
      .single()

    if (fetchError || !proposal) {
      console.error('[proposal-actions] Proposal not found:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Proposta não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    switch (action) {
      case 'view': {
        // Register view only if not already viewed
        if (!proposal.viewed_at) {
          const { error: updateError } = await supabase
            .from('commercial_proposals')
            .update({ viewed_at: new Date().toISOString() })
            .eq('id', proposal.id)

          if (updateError) {
            console.error('[proposal-actions] Error updating view:', updateError)
          }

          // Log activity
          await supabase.from('proposal_activity_log').insert({
            proposal_id: proposal.id,
            action: 'viewed',
            details: { ip: req.headers.get('x-forwarded-for') || 'unknown' }
          })
        }

        return new Response(
          JSON.stringify({ success: true, proposal }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'accept': {
        if (proposal.status !== 'sent' && proposal.status !== 'viewed') {
          return new Response(
            JSON.stringify({ error: 'Esta proposta não pode ser aceita no momento' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Check if expired
        if (proposal.valid_until && new Date(proposal.valid_until) < new Date()) {
          return new Response(
            JSON.stringify({ error: 'Esta proposta expirou' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { signature_data, contract_accepted } = data || {}
        
        // Capturar IP e User Agent para segurança jurídica
        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                         req.headers.get('x-real-ip') || 
                         'unknown'
        const userAgent = req.headers.get('user-agent') || 'unknown'

        const { error: updateError } = await supabase
          .from('commercial_proposals')
          .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
            signature_data: signature_data || null,
            contract_accepted: contract_accepted || false,
            accept_ip_address: clientIp,
            accept_user_agent: userAgent
          })
          .eq('id', proposal.id)

        if (updateError) {
          console.error('[proposal-actions] Error accepting proposal:', updateError)
          return new Response(
            JSON.stringify({ error: 'Erro ao aceitar proposta' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Log activity com IP e User Agent
        await supabase.from('proposal_activity_log').insert({
          proposal_id: proposal.id,
          action: 'accepted',
          ip_address: clientIp,
          user_agent: userAgent,
          metadata: { 
            signature_data: !!signature_data,
            contract_accepted,
            accepted_at: new Date().toISOString()
          }
        })

        console.log(`[proposal-actions] Proposal ${proposal.proposal_number} accepted`)

        return new Response(
          JSON.stringify({ success: true, message: 'Proposta aceita com sucesso!' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'reject': {
        if (proposal.status !== 'sent' && proposal.status !== 'viewed') {
          return new Response(
            JSON.stringify({ error: 'Esta proposta não pode ser rejeitada no momento' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { reason } = data || {}

        const { error: updateError } = await supabase
          .from('commercial_proposals')
          .update({
            status: 'rejected',
            rejected_at: new Date().toISOString(),
            rejection_reason: reason || null
          })
          .eq('id', proposal.id)

        if (updateError) {
          console.error('[proposal-actions] Error rejecting proposal:', updateError)
          return new Response(
            JSON.stringify({ error: 'Erro ao rejeitar proposta' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Log activity
        await supabase.from('proposal_activity_log').insert({
          proposal_id: proposal.id,
          action: 'rejected',
          details: { reason }
        })

        console.log(`[proposal-actions] Proposal ${proposal.proposal_number} rejected`)

        return new Response(
          JSON.stringify({ success: true, message: 'Proposta recusada' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Ação inválida' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('[proposal-actions] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
