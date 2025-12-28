import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateProfessionalRequest {
  name: string;
  email: string;
  phone?: string;
  countryCode?: string;
  specialty?: string;
  description?: string;
  photo_url?: string;
  commission_type?: 'percentage' | 'fixed';
  commission_value?: number;
  store_id: string;
}

function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = 'Pro@';
  for (let i = 0; i < 6; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
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
      phone, 
      countryCode = '+55',
      specialty, 
      description, 
      photo_url, 
      commission_type = 'percentage', 
      commission_value = 0,
      store_id 
    } = body;

    console.log(`📨 Criando conta profissional: ${name} (${email})`);

    if (!name || !email || !store_id) {
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios faltando: name, email, store_id' }),
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
        JSON.stringify({ error: 'Este email já está cadastrado no sistema' }),
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
    const storeSlug = storeData?.slug || '';

    // 3. Gerar senha temporária
    const temporaryPassword = generateTemporaryPassword();
    console.log(`🔑 Senha temporária gerada para ${email}`);

    // 4. Criar usuário no auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: temporaryPassword,
      email_confirm: true, // Auto-confirma o email
      user_metadata: {
        name,
        user_type: 'professional',
        store_id,
      }
    });

    if (authError || !authUser.user) {
      console.error('❌ Erro ao criar usuário auth:', authError);
      return new Response(
        JSON.stringify({ error: authError?.message || 'Erro ao criar usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Usuário auth criado: ${authUser.user.id}`);

    // 5. Formatar telefone
    let formattedPhone = '';
    if (phone) {
      formattedPhone = `${countryCode.replace('+', '')}${phone.replace(/\D/g, '')}`;
    }

    // 6. Criar registro em professionals
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
        JSON.stringify({ error: professionalError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Profissional criado: ${professional.id}`);

    // 7. Inserir role na tabela user_roles
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: authUser.user.id,
        role: 'professional',
        store_id,
      });

    if (roleError) {
      console.error('❌ Erro ao inserir role:', roleError);
      // Não fazemos rollback aqui, apenas logamos
    }

    console.log(`✅ Role 'professional' atribuída`);

    // 8. Criar profile se não existir
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authUser.user.id,
        name,
        email: email.toLowerCase(),
        phone: formattedPhone || null,
        user_type: 'professional',
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('⚠️ Aviso ao criar profile:', profileError);
    }

    // 9. Enviar credenciais via WhatsApp (se tiver telefone)
    let whatsappSent = false;
    if (formattedPhone) {
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
          
          const message = `Olá ${firstName}! 🎉

Você foi cadastrado como *Profissional* em *${storeName}*!

📱 *Acesse seu portal:*
${loginUrl}

📧 *Seu email:* ${email}
🔑 *Senha temporária:* ${temporaryPassword}

⚠️ *Importante:* Recomendamos trocar a senha no primeiro acesso!

No portal você pode:
✅ Ver sua agenda de atendimentos
✅ Acompanhar suas comissões
✅ Gerenciar seus horários e bloqueios

Qualquer dúvida, fale com o responsável da loja! 💬`;

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
            console.log(`✅ Credenciais enviadas via WhatsApp para ${formattedPhone}`);
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
        // Retornar credenciais apenas para exibição no frontend (uma única vez)
        credentials: {
          email: email.toLowerCase(),
          temporary_password: temporaryPassword,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro no create-professional-account:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
