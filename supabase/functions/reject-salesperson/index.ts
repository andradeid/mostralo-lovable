import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verificar se o usuário é master_admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'master_admin')
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Apenas master admins podem rejeitar vendedores' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { salesperson_id, reason } = await req.json();

    if (!salesperson_id || !reason) {
      return new Response(
        JSON.stringify({ error: 'salesperson_id e reason são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar vendedor
    const { data: salesperson, error: salesError } = await supabaseClient
      .from('salespeople')
      .select('status')
      .eq('id', salesperson_id)
      .single();

    if (salesError || !salesperson) {
      return new Response(
        JSON.stringify({ error: 'Vendedor não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (salesperson.status !== 'pending_approval') {
      return new Response(
        JSON.stringify({ error: 'Vendedor não está pendente de aprovação' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar status do vendedor
    const { error: updateError } = await supabaseClient
      .from('salespeople')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        rejected_at: new Date().toISOString(),
        rejected_by: user.id,
      })
      .eq('id', salesperson_id);

    if (updateError) {
      console.error('Erro ao rejeitar vendedor:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao rejeitar vendedor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Vendedor rejeitado:', salesperson_id, 'Motivo:', reason);

    return new Response(
      JSON.stringify({ success: true, message: 'Vendedor rejeitado' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao rejeitar vendedor:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
