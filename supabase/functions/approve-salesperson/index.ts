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
        JSON.stringify({ error: 'Apenas master admins podem aprovar vendedores' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { salesperson_id } = await req.json();

    if (!salesperson_id) {
      return new Response(
        JSON.stringify({ error: 'salesperson_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar vendedor
    const { data: salesperson, error: salesError } = await supabaseClient
      .from('salespeople')
      .select('user_id, status')
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
        status: 'pending_contract',
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq('id', salesperson_id);

    if (updateError) {
      console.error('Erro ao atualizar vendedor:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao aprovar vendedor' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Habilitar usuário no auth usando service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      salesperson.user_id,
      { ban_duration: 'none' }
    );

    if (authError) {
      console.error('Erro ao habilitar usuário no auth:', authError);
    }

    console.log('Vendedor aprovado com sucesso:', salesperson_id);

    return new Response(
      JSON.stringify({ success: true, message: 'Vendedor aprovado com sucesso' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao aprovar vendedor:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
