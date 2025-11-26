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

    const { token, action, counter_offer, accept_counter_offer } = await req.json();
    
    console.log('🎯 Processando convite:', { 
      token, 
      action, 
      accept_counter_offer,
      has_counter_offer: !!counter_offer 
    });

    if (!token || !action || !['accept', 'decline', 'counter-offer'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Token e ação (accept/decline/counter-offer) são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'counter-offer' && !counter_offer) {
      return new Response(
        JSON.stringify({ error: 'Dados da contra-proposta são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar usuário
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('👤 Usuário:', userData.user.id);

    // Buscar convite
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('driver_invitations')
      .select('*, stores(name)')
      .eq('token', token)
      .single();

    if (inviteError || !invitation) {
      console.error('❌ Convite não encontrado:', inviteError);
      return new Response(
        JSON.stringify({ error: 'Convite não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📧 Convite encontrado:', {
      id: invitation.id,
      driver_id: invitation.driver_id,
      store_id: invitation.store_id,
      status: invitation.status,
    });

    // Para aceitar contra-proposta, deve ser o dono da loja
    if (accept_counter_offer) {
      const { data: store } = await supabaseAdmin
        .from('stores')
        .select('owner_id')
        .eq('id', invitation.store_id)
        .single();

      if (!store || store.owner_id !== userData.user.id) {
        return new Response(
          JSON.stringify({ error: 'Apenas o dono da loja pode aceitar contra-propostas' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Dono da loja confirmado para aceitar contra-proposta');
    } else {
      // Verificar se o convite é para o usuário logado
      if (invitation.driver_id !== userData.user.id) {
        return new Response(
          JSON.stringify({ error: 'Este convite não é para você' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Verificar se já foi processado
    if (invitation.status !== 'pending' && invitation.status !== 'counter_offered') {
      return new Response(
        JSON.stringify({ error: `Este convite já foi ${invitation.status === 'accepted' ? 'aceito' : 'recusado'}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se expirou
    if (new Date(invitation.expires_at) < new Date()) {
      await supabaseAdmin
        .from('driver_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return new Response(
        JSON.stringify({ error: 'Este convite expirou' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'counter-offer') {
      // Salvar contra-proposta
      const { error: updateError } = await supabaseAdmin
        .from('driver_invitations')
        .update({
          counter_offer_payment_type: counter_offer.payment_type,
          counter_offer_fixed_amount: counter_offer.fixed_amount,
          counter_offer_commission_percentage: counter_offer.commission_percentage,
          counter_offer_message: counter_offer.message,
          counter_offer_at: new Date().toISOString(),
        })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('Error updating counter-offer:', updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Contra-proposta enviada! O lojista receberá sua proposta.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'accept') {
      console.log('✅ Iniciando aceitação do convite');

      // Determinar quais valores usar (contra-proposta ou proposta original)
      let paymentType, fixedAmount, commissionPercentage;
      
      if (accept_counter_offer && invitation.counter_offer_payment_type) {
        console.log('📝 Usando valores da contra-proposta');
        paymentType = invitation.counter_offer_payment_type;
        fixedAmount = invitation.counter_offer_fixed_amount;
        commissionPercentage = invitation.counter_offer_commission_percentage;
      } else {
        console.log('📝 Usando valores da proposta original');
        paymentType = invitation.proposed_payment_type;
        fixedAmount = invitation.proposed_fixed_amount;
        commissionPercentage = invitation.proposed_commission_percentage;
      }

      console.log('💰 Configuração de pagamento:', {
        paymentType,
        fixedAmount,
        commissionPercentage,
      });

      // Atualizar status do convite
      const { error: updateError } = await supabaseAdmin
        .from('driver_invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar convite:', updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Convite atualizado para accepted');

      // Verificar se já existe role (idempotência)
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', invitation.driver_id)
        .eq('store_id', invitation.store_id)
        .eq('role', 'delivery_driver')
        .maybeSingle();

      if (existingRole) {
        console.log('⚠️ Role já existe, pulando criação');
      } else {
        // Criar role de entregador para a loja
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: invitation.driver_id,
            role: 'delivery_driver',
            store_id: invitation.store_id
          });

        if (roleError) {
          console.error('❌ Erro ao criar role:', roleError);
          // Reverter status do convite
          await supabaseAdmin
            .from('driver_invitations')
            .update({ status: 'pending' })
            .eq('id', invitation.id);

          return new Response(
            JSON.stringify({ error: 'Erro ao criar vínculo com a loja. Tente novamente.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('✅ Role de entregador criado');
      }

      // Verificar se já existe config (idempotência)
      const { data: existingConfig } = await supabaseAdmin
        .from('driver_earnings_config')
        .select('id')
        .eq('driver_id', invitation.driver_id)
        .eq('store_id', invitation.store_id)
        .maybeSingle();

      if (existingConfig) {
        console.log('⚠️ Config já existe, atualizando');
        const { error: configUpdateError } = await supabaseAdmin
          .from('driver_earnings_config')
          .update({
            payment_type: paymentType,
            fixed_amount: fixedAmount,
            commission_percentage: commissionPercentage,
            is_active: true,
          })
          .eq('id', existingConfig.id);

        if (configUpdateError) {
          console.error('❌ Erro ao atualizar config:', configUpdateError);
        } else {
          console.log('✅ Config atualizado');
        }
      } else {
        // Criar configuração de ganhos
        const { error: configError } = await supabaseAdmin
          .from('driver_earnings_config')
          .insert({
            driver_id: invitation.driver_id,
            store_id: invitation.store_id,
            payment_type: paymentType,
            fixed_amount: fixedAmount,
            commission_percentage: commissionPercentage,
          });

        if (configError) {
          console.error('❌ Erro ao criar config de ganhos:', configError);
          // Continuar mesmo se houver erro na config, o role já foi criado
        } else {
          console.log('✅ Config de ganhos criado');
        }
      }

      const successMessage = accept_counter_offer 
        ? 'Contra-proposta aceita! O entregador foi vinculado à loja.'
        : `Convite aceito! Você agora é entregador da ${invitation.stores?.name}`;

      return new Response(
        JSON.stringify({ 
          success: true,
          message: successMessage,
          storeId: invitation.store_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else { // decline
      const { error: updateError } = await supabaseAdmin
        .from('driver_invitations')
        .update({ status: 'declined' })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('Error declining invitation:', updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Invitation declined');

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Convite recusado'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
