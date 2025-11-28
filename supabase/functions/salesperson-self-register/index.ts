import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface RegisterRequest {
  full_name: string;
  email: string;
  phone: string;
  password: string;
  cnpj: string;
  company_name: string;
  company_trade_name?: string;
  cnae_codes: string[];
  cnpj_validation_data: any;
  pix_key?: string;
  pix_key_type?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RegisterRequest = await req.json();

    const {
      full_name,
      email,
      phone,
      password,
      cnpj,
      company_name,
      company_trade_name,
      cnae_codes,
      cnpj_validation_data,
      pix_key,
      pix_key_type,
    } = body;

    // Validações básicas
    if (!full_name || !email || !phone || !password || !cnpj || !company_name) {
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios faltando' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Senha deve ter no mínimo 6 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cliente Supabase com service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Registrando vendedor: ${email}`);

    // Verificar se email já existe
    const { data: existingEmail } = await supabase
      .from('salespeople')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return new Response(
        JSON.stringify({ error: 'Email já cadastrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se CNPJ já existe
    const { data: existingCNPJ } = await supabase
      .from('salespeople')
      .select('id')
      .eq('cnpj', cnpj)
      .single();

    if (existingCNPJ) {
      return new Response(
        JSON.stringify({ error: 'CNPJ já cadastrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Gerar código de indicação único (primeiras letras do nome + timestamp)
    const timestamp = Date.now().toString(36).toUpperCase();
    const namePrefix = full_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 4);
    const referralCode = `${namePrefix}${timestamp}`;

    console.log(`Código de indicação gerado: ${referralCode}`);

    // 1. Criar usuário no Supabase Auth (DESABILITADO até aprovação)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Não confirmar email automaticamente
      user_metadata: {
        full_name,
        phone,
        role_type: 'salesperson',
      },
    });

    if (authError) {
      console.error('Erro ao criar usuário:', authError);
      return new Response(
        JSON.stringify({ error: `Erro ao criar usuário: ${authError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authData.user!.id;
    console.log(`Usuário criado: ${userId}`);

    // 2. Criar registro em salespeople com status pending_approval
    const { data: salesperson, error: salespersonError } = await supabase
      .from('salespeople')
      .insert({
        user_id: userId,
        full_name,
        email,
        phone,
        cnpj,
        company_name,
        company_trade_name,
        cnae_codes,
        cnpj_validated: true,
        cnpj_validated_at: new Date().toISOString(),
        cnpj_validation_data,
        pix_key,
        pix_key_type,
        referral_code: referralCode,
        status: 'pending_approval',
      })
      .select()
      .single();

    if (salespersonError) {
      console.error('Erro ao criar vendedor:', salespersonError);
      
      // Rollback: deletar usuário criado
      await supabase.auth.admin.deleteUser(userId);
      
      return new Response(
        JSON.stringify({ error: `Erro ao criar vendedor: ${salespersonError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Vendedor registrado com sucesso: ${salesperson.id}`);
    console.log(`Status: ${salesperson.status}`);

    // 3. Desabilitar usuário até aprovação do master admin
    await supabase.auth.admin.updateUserById(userId, {
      ban_duration: 'none', // Não banir permanentemente
      user_metadata: {
        ...authData.user!.user_metadata,
        pending_approval: true,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cadastro realizado com sucesso! Aguarde aprovação do administrador.',
        salesperson: {
          id: salesperson.id,
          full_name: salesperson.full_name,
          email: salesperson.email,
          referral_code: salesperson.referral_code,
          status: salesperson.status,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no registro:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'Erro ao processar cadastro. Tente novamente.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
