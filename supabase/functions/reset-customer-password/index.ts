import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar método
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter token do header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente para verificar autenticação
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: ' + (authError?.message || 'Invalid token') }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', { userId: user.id, email: user.email });

    // Verificar se o usuário é admin (store_admin ou master_admin)
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (roleError) {
      console.error('Role query error:', roleError);
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Profile query error:', profileError);
    }

    console.log('User permissions:', { 
      role: roleData?.role, 
      userType: profile?.user_type,
      hasRole: !!roleData,
      hasProfile: !!profile
    });

    const isAdmin = roleData?.role === 'store_admin' || 
                    roleData?.role === 'master_admin' || 
                    profile?.user_type === 'master_admin' ||
                    profile?.user_type === 'store_admin';

    if (!isAdmin) {
      console.log('Access denied - not admin:', { 
        userId: user.id, 
        role: roleData?.role, 
        userType: profile?.user_type 
      });
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only admins can reset customer passwords' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Admin access granted');

    const { customerId, newPassword } = await req.json();
    
    console.log('Reset password request for customer:', customerId?.substring(0, 8) + '***');
    
    if (!customerId || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'customerId e newPassword são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Senha deve ter no mínimo 6 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Criar cliente admin com service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
    
    // Buscar cliente
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .select('id, name, phone, auth_user_id')
      .eq('id', customerId)
      .single();
    
    if (customerError || !customer) {
      console.error('Customer not found:', customerError);
      return new Response(
        JSON.stringify({ error: 'Cliente não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Customer found:', { name: customer.name, hasAuthUserId: !!customer.auth_user_id, phone: customer.phone });
    
    // Verificar se tem auth_user_id
    if (!customer.auth_user_id) {
      return new Response(
        JSON.stringify({ error: 'Cliente não possui autenticação configurada. O cliente precisa criar uma conta com senha primeiro.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalizar telefone (mesmo processo da função customer-auth)
    let normalizedPhone = customer.phone.replace(/\D/g, '');
    if (normalizedPhone.startsWith('55') && normalizedPhone.length > 11) {
      normalizedPhone = normalizedPhone.substring(2);
    }
    if (normalizedPhone.startsWith('0') && normalizedPhone.length === 11) {
      normalizedPhone = normalizedPhone.substring(1);
    }

    // Garantir que o email está no formato correto usado no login
    const expectedEmail = `cliente_${normalizedPhone}@temp.mostralo.com`;
    
    // Buscar dados do usuário atual
    const { data: currentUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(
      customer.auth_user_id
    );

    if (getUserError) {
      console.error('Failed to get user:', getUserError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar dados do usuário: ' + getUserError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar senha e email (se necessário) usando Admin API
    const updateData: { password: string; email?: string } = { password: newPassword };
    
    // Se o email não estiver no formato correto, atualizar também
    if (currentUser?.user?.email !== expectedEmail) {
      console.log('Updating email to match login format:', { 
        current: currentUser?.user?.email, 
        expected: expectedEmail 
      });
      updateData.email = expectedEmail;
    }
    
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      customer.auth_user_id,
      updateData
    );
    
    if (updateError) {
      console.error('Failed to update password:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar senha: ' + updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Password updated successfully for customer:', customer.name);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Senha de ${customer.name} atualizada com sucesso!`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || 'Erro ao processar solicitação' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
