import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      store_id, 
      driver_id,
      proposed_payment_type = 'fixed',
      proposed_fixed_amount,
      proposed_commission_percentage,
      invitation_message
    } = await req.json();
    
    console.log('📧 Criando convite:', { 
      store_id, 
      driver_id, 
      proposed_payment_type, 
      proposed_fixed_amount, 
      proposed_commission_percentage 
    });

    if (!store_id || !driver_id) {
      console.error('❌ Parâmetros faltando');
      return new Response(
        JSON.stringify({ error: 'store_id e driver_id são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar valores propostos
    if (proposed_payment_type === 'fixed' && !proposed_fixed_amount) {
      return new Response(
        JSON.stringify({ error: 'Valor fixo é obrigatório para tipo "fixed"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (proposed_payment_type === 'commission' && !proposed_commission_percentage) {
      return new Response(
        JSON.stringify({ error: 'Porcentagem de comissão é obrigatória para tipo "commission"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verificar se o usuário é dono da loja
    const { data: userData } = await supabase.auth.getUser();
    console.log('👤 Usuário autenticado:', userData.user?.id);
    
    if (!userData.user) {
      console.error('❌ Usuário não encontrado');
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name')
      .eq('id', store_id)
      .eq('owner_id', userData.user.id)
      .single();

    console.log('🏪 Verificando loja:', { store, error: storeError });

    if (!store || storeError) {
      console.error('❌ Loja não encontrada ou sem permissão:', storeError);
      return new Response(
        JSON.stringify({ error: 'Loja não encontrada ou você não tem permissão' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente admin para queries sem RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar se o entregador existe
    const { data: driver, error: driverError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', driver_id)
      .maybeSingle();

    console.log('🚗 Verificando entregador:', { driver, error: driverError });

    if (!driver || driverError) {
      console.error('❌ Entregador não encontrado:', driverError);
      return new Response(
        JSON.stringify({ error: 'Entregador não encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se já existe um convite pendente ou se o entregador já trabalha na loja
    const { data: existingInvite, error: inviteCheckError } = await supabaseAdmin
      .from('driver_invitations')
      .select('id, status')
      .eq('store_id', store_id)
      .eq('driver_id', driver_id)
      .maybeSingle();

    console.log('📋 Convite existente:', { existingInvite, error: inviteCheckError });

    if (existingInvite) {
      if (existingInvite.status === 'accepted') {
        console.warn('⚠️ Entregador já trabalha na loja');
        return new Response(
          JSON.stringify({ error: 'Este entregador já trabalha na sua loja' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (existingInvite.status === 'pending') {
        console.warn('⚠️ Já existe um convite pendente');
        return new Response(
          JSON.stringify({ error: 'Já existe um convite pendente para este entregador' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Gerar token único
    const token = crypto.randomUUID();
    
    // Criar convite (expira em 7 dias)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('driver_invitations')
      .insert({
        store_id,
        driver_id,
        token,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        proposed_payment_type,
        proposed_fixed_amount,
        proposed_commission_percentage,
        invitation_message,
      })
      .select()
      .single();

    console.log('✅ Convite criado:', { invitation, error: inviteError });

    if (inviteError) {
      console.error('❌ Erro ao criar convite:', inviteError);
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitation,
        message: `Convite enviado para ${driver.full_name}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Erro ao criar convite' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
