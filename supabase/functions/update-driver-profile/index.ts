import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdateDriverProfileRequest {
  full_name?: string;
  email?: string;
  phone?: string;
}

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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se é delivery_driver
    const { data: driverRole, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'delivery_driver')
      .single();

    if (roleError || !driverRole) {
      return new Response(
        JSON.stringify({ error: 'Apenas entregadores podem atualizar este perfil' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { full_name, email, phone }: UpdateDriverProfileRequest = await req.json();
    
    console.log('Update driver profile request:', { user_id: user.id, full_name, email: email?.substring(0, 4) + '***', phone: phone?.substring(0, 4) + '***' });

    // Validar se há algo para atualizar
    if (!full_name && !email && !phone) {
      return new Response(
        JSON.stringify({ error: 'Nenhum campo para atualizar' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar email se fornecido
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: 'Formato de email inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se email já está em uso
      const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
      const emailInUse = existingUser?.users.find(u => u.email === email && u.id !== user.id);
      
      if (emailInUse) {
        return new Response(
          JSON.stringify({ error: 'Este email já está cadastrado no sistema' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Validar telefone se fornecido
    if (phone) {
      // Remover formatação
      const cleanPhone = phone.replace(/\D/g, '');
      
      // Validar formato brasileiro (10 ou 11 dígitos)
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        return new Response(
          JSON.stringify({ error: 'Formato de telefone inválido. Use (XX) XXXXX-XXXX ou (XX) XXXX-XXXX' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se telefone já está em uso por outro delivery driver
      const { data: existingDriver } = await supabaseClient
        .from('profiles')
        .select('id, email')
        .eq('phone', cleanPhone)
        .neq('id', user.id)
        .maybeSingle();

      if (existingDriver) {
        // Verificar se é delivery_driver
        const { data: driverCheck } = await supabaseClient
          .from('user_roles')
          .select('role')
          .eq('user_id', existingDriver.id)
          .eq('role', 'delivery_driver')
          .maybeSingle();
        
        if (driverCheck) {
          return new Response(
            JSON.stringify({ error: 'Este telefone já está sendo usado por outro entregador' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Atualizar profiles
    const profileUpdates: any = {};
    if (full_name) profileUpdates.full_name = full_name;
    if (phone) profileUpdates.phone = phone.replace(/\D/g, '');

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabaseClient
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar perfil' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Atualizar email no auth se fornecido
    if (email) {
      const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email }
      );

      if (emailError) {
        console.error('Email update error:', emailError);
        return new Response(
          JSON.stringify({ error: 'Erro ao atualizar email' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Atualizar user_metadata se telefone foi alterado
    if (phone) {
      const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...user.user_metadata,
            phone: phone.replace(/\D/g, '')
          }
        }
      );

      if (metadataError) {
        console.error('Metadata update error:', metadataError);
        // Não falhar aqui, apenas logar
      }
    }

    console.log('Driver profile updated successfully:', user.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: email 
          ? 'Perfil atualizado! Faça login novamente com o novo email.'
          : 'Perfil atualizado com sucesso!'
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
