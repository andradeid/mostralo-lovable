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
    const { email, password, full_name, phone, pix_key_type, pix_key, invite_token } = await req.json();
    
    console.log('Driver self-register request:', { email, full_name, phone: phone?.substring(0, 4) + '***' });

    // Validações
    if (!email || !password || !full_name || !phone) {
      return new Response(
        JSON.stringify({ error: 'Email, senha, nome completo e telefone são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'A senha deve ter no mínimo 6 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Normalizar telefone
    const cleanPhone = phone.replace(/\D/g, '');

    // Verificar se telefone já está em uso por outro delivery driver
    const { data: existingDriverProfile } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (existingDriverProfile) {
      // Verificar se é delivery_driver
      const { data: existingDriverRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', existingDriverProfile.id)
        .eq('role', 'delivery_driver')
        .maybeSingle();
      
      if (existingDriverRole) {
        return new Response(
          JSON.stringify({ error: 'Este telefone já está sendo usado por outro entregador' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verificar se email já existe
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const emailExists = existingUsers?.users.find(u => u.email === email);
    
    if (emailExists) {
      return new Response(
        JSON.stringify({ error: 'Este email já está cadastrado no sistema' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar usuário no auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone: cleanPhone,
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created:', authData.user.id);

    // Atualizar perfil com driver_available_for_invites = true e telefone
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        driver_available_for_invites: true,
        full_name,
        phone: cleanPhone
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Não falhar aqui, apenas logar
    }

    // Se forneceu informações de pagamento, criar registro
    if (pix_key && pix_key_type) {
      const { error: paymentError } = await supabase
        .from('driver_payment_info')
        .insert({
          driver_id: authData.user.id,
          pix_key,
          pix_key_type,
          account_holder_name: full_name
        });

      if (paymentError) {
        console.error('Payment info error:', paymentError);
        // Não falhar aqui, apenas logar
      }
    }

    // Se tem token de convite, processar convite automático
    let inviteStoreId = null;
    let inviteStoreName = null;
    
    if (invite_token) {
      console.log('Processing invite token:', invite_token);
      
      // Buscar link de convite válido
      const { data: inviteLink, error: inviteLinkError } = await supabase
        .from('store_invite_links')
        .select('id, store_id, is_active, expires_at, max_uses, current_uses, stores(name)')
        .eq('token', invite_token)
        .single();

      if (inviteLinkError) {
        console.error('Invite link not found:', inviteLinkError);
      } else if (!inviteLink.is_active) {
        console.error('Invite link is inactive');
      } else if (inviteLink.expires_at && new Date(inviteLink.expires_at) < new Date()) {
        console.error('Invite link expired');
      } else if (inviteLink.max_uses && inviteLink.current_uses >= inviteLink.max_uses) {
        console.error('Invite link reached max uses');
      } else {
        // Link válido, criar role de delivery_driver para a loja
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'delivery_driver',
            store_id: inviteLink.store_id
          });

        if (roleError) {
          console.error('Error creating driver role:', roleError);
        } else {
          // Incrementar contador de usos
          await supabase
            .from('store_invite_links')
            .update({ current_uses: inviteLink.current_uses + 1 })
            .eq('id', inviteLink.id);

          inviteStoreId = inviteLink.store_id;
          inviteStoreName = (inviteLink.stores as any)?.name;
          console.log('Driver automatically assigned to store:', inviteStoreId);
        }
      }
    }

    console.log('Driver registered successfully:', authData.user.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        userId: authData.user.id,
        storeId: inviteStoreId,
        storeName: inviteStoreName,
        message: inviteStoreId 
          ? `Cadastro realizado com sucesso! Você já foi adicionado como entregador de ${inviteStoreName}.`
          : 'Cadastro realizado com sucesso! Aguarde convites de lojas para começar a trabalhar.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
