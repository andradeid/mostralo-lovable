import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface RegisterRequest {
  // Tipo de vendedor
  salesperson_type: 'affiliate' | 'partner';
  
  // Dados pessoais (ambos)
  full_name: string;
  email: string;
  phone: string;
  password: string;
  
  // Foto de perfil
  profile_photo_url?: string;
  
  // Qualificação
  qualification_answers?: Record<string, string>;
  qualification_score?: number;
  qualification_level?: string;
  
  // Dados PJ (apenas partner)
  cnpj?: string;
  company_name?: string;
  company_trade_name?: string;
  cnae_codes?: string[];
  cnpj_validation_data?: any;
  
  // Dados PF (apenas affiliate)
  cpf?: string;
  
  // PIX (ambos)
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
      salesperson_type = 'partner', // Default para manter compatibilidade
      full_name,
      email,
      phone,
      password,
      profile_photo_url,
      qualification_answers,
      qualification_score,
      qualification_level,
      cnpj,
      company_name,
      company_trade_name,
      cnae_codes,
      cnpj_validation_data,
      cpf,
      pix_key,
      pix_key_type,
    } = body;

    console.log(`Registrando vendedor tipo: ${salesperson_type}`);

    // Validações básicas (ambos tipos)
    if (!full_name || !email || !phone || !password) {
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

    // Validações específicas por tipo
    if (salesperson_type === 'partner') {
      if (!cnpj || !company_name) {
        return new Response(
          JSON.stringify({ error: 'CNPJ e razão social são obrigatórios para Parceiro PJ' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (salesperson_type === 'affiliate') {
      if (!cpf) {
        return new Response(
          JSON.stringify({ error: 'CPF é obrigatório para Afiliado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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

    // Verificar CNPJ ou CPF duplicado
    if (salesperson_type === 'partner' && cnpj) {
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
    }

    if (salesperson_type === 'affiliate' && cpf) {
      const { data: existingCPF } = await supabase
        .from('salespeople')
        .select('id')
        .eq('cpf', cpf)
        .single();

      if (existingCPF) {
        return new Response(
          JSON.stringify({ error: 'CPF já cadastrado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: {
        full_name,
        phone,
        role_type: 'salesperson',
        salesperson_type,
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

    // 2. Criar registro em salespeople
    const salespersonData: any = {
      user_id: userId,
      full_name,
      email,
      phone,
      salesperson_type,
      pix_key,
      pix_key_type,
      referral_code: referralCode,
      status: 'pending_approval',
      profile_photo_url: profile_photo_url || null,
      qualification_answers: qualification_answers || [],
      qualification_score: qualification_score || 0,
      qualification_level: qualification_level || 'evaluation',
    };

    // Dados específicos para Parceiro PJ
    if (salesperson_type === 'partner') {
      salespersonData.cnpj = cnpj;
      salespersonData.company_name = company_name;
      salespersonData.company_trade_name = company_trade_name;
      salespersonData.cnae_codes = cnae_codes || [];
      salespersonData.cnpj_validated = true;
      salespersonData.cnpj_validated_at = new Date().toISOString();
      salespersonData.cnpj_validation_data = cnpj_validation_data;
      salespersonData.bonus_eligible = true;
      salespersonData.monthly_earnings_limit = null; // Sem limite
    }

    // Dados específicos para Afiliado
    if (salesperson_type === 'affiliate') {
      salespersonData.cpf = cpf;
      salespersonData.bonus_eligible = false; // Afiliados não têm bônus
      salespersonData.monthly_earnings_limit = 1900; // Limite de R$ 1.900/mês
    }

    const { data: salesperson, error: salespersonError } = await supabase
      .from('salespeople')
      .insert(salespersonData)
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
    console.log(`Tipo: ${salesperson.salesperson_type}`);
    console.log(`Status: ${salesperson.status}`);

    // 3. Criar role na tabela user_roles
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role: 'salesperson',
        store_id: null // Vendedores não têm store_id
      });

    if (roleError) {
      console.error('Erro ao criar role do vendedor:', roleError);
      // Não é crítico, continua o fluxo
    } else {
      console.log(`✅ Role salesperson criada para user_id: ${userId}`);
    }

    // 4. Desabilitar usuário até aprovação do master admin
    await supabase.auth.admin.updateUserById(userId, {
      ban_duration: 'none',
      user_metadata: {
        ...authData.user!.user_metadata,
        pending_approval: true,
      },
    });

    // Mensagem de sucesso diferenciada por tipo
    const successMessage = salesperson_type === 'affiliate'
      ? 'Cadastro de Afiliado realizado com sucesso! Aguarde aprovação do administrador.'
      : 'Cadastro de Parceiro PJ realizado com sucesso! Aguarde aprovação do administrador.';

    return new Response(
      JSON.stringify({
        success: true,
        message: successMessage,
        salesperson: {
          id: salesperson.id,
          full_name: salesperson.full_name,
          email: salesperson.email,
          referral_code: salesperson.referral_code,
          status: salesperson.status,
          salesperson_type: salesperson.salesperson_type,
          bonus_eligible: salesperson.bonus_eligible,
          monthly_earnings_limit: salesperson.monthly_earnings_limit,
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
