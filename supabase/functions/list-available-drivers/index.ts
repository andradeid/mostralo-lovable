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

    const url = new URL(req.url);
    const storeId = url.searchParams.get('storeId');
    const email = url.searchParams.get('email');
    
    console.log('List available drivers request:', { storeId, email });

    if (!storeId) {
      return new Response(
        JSON.stringify({ error: 'storeId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Requer email para buscar entregadores
    if (!email || email.trim() === '') {
      return new Response(
        JSON.stringify({ 
          drivers: [], 
          total: 0,
          message: 'Digite o email do entregador para buscar' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verificar se o usuário é dono da loja
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('id', storeId)
      .eq('owner_id', userData.user.id)
      .single();

    if (!store) {
      return new Response(
        JSON.stringify({ error: 'Loja não encontrada ou você não tem permissão' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar entregador pelo email (não apenas os disponíveis)
    const { data: drivers, error: driversError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, avatar_url, created_at')
      .ilike('email', `%${email}%`)
      .eq('is_blocked', false)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (driversError) {
      console.error('Error fetching drivers:', driversError);
      return new Response(
        JSON.stringify({ error: driversError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Para cada entregador, verificar se já trabalha nesta loja ou tem convite pendente
    const driversWithStatus = await Promise.all(
      (drivers || []).map(async (driver) => {
        // Verificar se já trabalha na loja
        const { data: role } = await supabaseAdmin
          .from('user_roles')
          .select('id')
          .eq('user_id', driver.id)
          .eq('role', 'delivery_driver')
          .eq('store_id', storeId)
          .single();

        if (role) {
          return { ...driver, status: 'already_working' };
        }

        // Verificar se tem convite pendente
        const { data: invitation } = await supabaseAdmin
          .from('driver_invitations')
          .select('id, status, created_at')
          .eq('driver_id', driver.id)
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (invitation) {
          return { 
            ...driver, 
            status: invitation.status,
            invitation_date: invitation.created_at
          };
        }

        return { ...driver, status: 'available' };
      })
    );

    console.log(`Found ${driversWithStatus.length} drivers`);

    return new Response(
      JSON.stringify({ 
        drivers: driversWithStatus,
        total: driversWithStatus.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
