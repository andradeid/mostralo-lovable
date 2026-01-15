import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateProfessionalRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  countryCode?: string;
  specialty?: string;
  description?: string;
  photo_url?: string;
  commission_type?: 'percentage' | 'fixed';
  commission_value?: number;
  store_id: string;
  send_whatsapp?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: CreateProfessionalRequest = await req.json();
    const { 
      name, 
      email,
      password,
      phone, 
      countryCode = '+55',
      specialty, 
      description, 
      photo_url, 
      commission_type = 'percentage', 
      commission_value = 0,
      store_id,
      send_whatsapp = false
    } = body;

    console.log(`📨 Criando conta profissional: ${name} (${email})`);

    // Validações
    if (!name || !email || !store_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Dados obrigatórios faltando: name, email, store_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!password || password.length < 6) {
      return new Response(
        JSON.stringify({ success: false, error: 'Senha deve ter pelo menos 6 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verificar se email já existe
    const { data: existingUser } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (userExists) {
      return new Response(
        JSON.stringify({ success: false, error: 'Este email já está cadastrado no sistema' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Buscar nome da loja
    const { data: storeData } = await supabase
      .from('stores')
      .select('name, slug')
      .eq('id', store_id)
      .single();

    const storeName = storeData?.name || 'nossa loja';

    // 3. Criar usuário no auth.users com a senha definida pelo lojista
    // IMPORTANTE: role_type é usado pelo trigger handle_new_user para identificar o tipo
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role_type: 'professional', // CRÍTICO: trigger usa isso para definir user_type
        user_type: 'professional',
        store_id,
      }
    });

    if (authError || !authUser.user) {
      console.error('❌ Erro ao criar usuário auth:', authError);
      return new Response(
        JSON.stringify({ success: false, error: authError?.message || 'Erro ao criar usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Usuário auth criado: ${authUser.user.id}`);

    // 4. Formatar telefone
    let formattedPhone = '';
    if (phone) {
      formattedPhone = `${countryCode.replace('+', '')}${phone.replace(/\D/g, '')}`;
    }

    // 5. Criar registro em professionals
    const { data: professional, error: professionalError } = await supabase
      .from('professionals')
      .insert({
        store_id,
        user_id: authUser.user.id,
        name,
        specialty: specialty || null,
        description: description || null,
        photo_url: photo_url || null,
        phone: formattedPhone || null,
        commission_type,
        commission_value,
        is_active: true,
      })
      .select()
      .single();

    if (professionalError) {
      console.error('❌ Erro ao criar profissional:', professionalError);
      // Rollback: deletar usuário auth
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return new Response(
        JSON.stringify({ success: false, error: professionalError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Profissional criado: ${professional.id}`);

    // 6. Inserir role na tabela user_roles
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authUser.user.id,
        role: 'professional',
        store_id,
      });

    if (roleError) {
      console.error('⚠️ Aviso ao inserir role:', roleError);
    }

    console.log(`✅ Role 'professional' atribuída`);

    // 7. Atualizar profile com user_type correto
    // NOTA: O trigger já cria o profile, mas precisamos garantir user_type = 'professional'
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: name,
        phone: formattedPhone || null,
        user_type: 'professional',
        approval_status: 'approved', // Profissionais são aprovados automaticamente
      })
      .eq('id', authUser.user.id);

    if (profileError) {
      console.error('⚠️ Aviso ao atualizar profile:', profileError);
    } else {
      console.log('✅ Profile atualizado com user_type: professional');
    }

    // 8. Enviar notificação via WhatsApp (se tiver telefone e solicitado)
    let whatsappSent = false;
    if (send_whatsapp && formattedPhone) {
      try {
        // Buscar configuração Evolution
        const { data: evolutionConfig } = await supabase
          .from('evolution_config')
          .select('api_url, api_key')
          .eq('is_active', true)
          .single();

        const { data: masterConfig } = await supabase
          .from('master_whatsapp_config')
          .select('instance_name, instance_status')
          .single();

        if (evolutionConfig && masterConfig && 
            (masterConfig.instance_status === 'open' || masterConfig.instance_status === 'connected')) {
          
          const firstName = name.split(' ')[0];
          const loginUrl = `${req.headers.get('origin') || 'https://mostralo.com.br'}/auth`;
          
          // Mensagem sem incluir a senha (definida pelo lojista)
          const message = `Olá ${firstName}! 🎉

Você foi cadastrado como *Profissional* em *${storeName}*!

📱 *Acesse seu portal:*
${loginUrl}

📧 *Seu email:* ${email}
🔑 *Sua senha foi definida pelo administrador*

Entre em contato com o responsável da loja caso precise das suas credenciais! 💬

No portal você pode:
✅ Ver sua agenda de atendimentos
✅ Acompanhar suas comissões
✅ Gerenciar seus horários e bloqueios`;

          const evolutionUrl = `${evolutionConfig.api_url}/message/sendText/${masterConfig.instance_name}`;
          
          const response = await fetch(evolutionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionConfig.api_key,
            },
            body: JSON.stringify({
              number: formattedPhone,
              text: message,
            }),
          });

          if (response.ok) {
            whatsappSent = true;
            console.log(`✅ Notificação enviada via WhatsApp para ${formattedPhone}`);
          } else {
            console.error('⚠️ Falha ao enviar WhatsApp:', await response.text());
          }
        }
      } catch (whatsappError) {
        console.error('⚠️ Erro ao enviar WhatsApp:', whatsappError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Profissional criado com sucesso',
        professional,
        user_id: authUser.user.id,
        whatsapp_sent: whatsappSent,
        credentials: {
          email: email.toLowerCase(),
          password_set: true
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no create-professional-account:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});