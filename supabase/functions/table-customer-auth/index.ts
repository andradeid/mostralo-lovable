import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  action: 'check_customer' | 'register' | 'login' | 'create_comanda';
  store_id: string;
  table_number: string;
  phone: string;
  name?: string;
  password?: string;
}

// Normalizar telefone brasileiro
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }
  if (digits.length === 11 || digits.length === 10) {
    return '55' + digits;
  }
  return digits;
}

// Hash simples para senha (4-6 dígitos)
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Gerar salt aleatório
function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  console.log('📱 table-customer-auth: Requisição recebida');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    const { action, store_id, table_number, phone, name, password } = body;

    console.log('📱 Action:', action, '| Store:', store_id, '| Mesa:', table_number);

    if (!store_id || !table_number || !phone) {
      return new Response(
        JSON.stringify({ error: 'store_id, table_number e phone são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedPhone = normalizePhone(phone);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se loja existe
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name, slug')
      .eq('id', store_id)
      .single();

    if (storeError || !store) {
      console.error('❌ Loja não encontrada:', storeError);
      return new Response(
        JSON.stringify({ error: 'Loja não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================
    // VERIFICAÇÃO DE MÓDULO - MODELO DE INVERSÃO
    // Ausência de registro = módulo liberado
    // Registro com is_enabled = false = bloqueado
    // ==========================================
    
    // Primeiro buscar o módulo pelo key
    const { data: moduleData, error: moduleError } = await supabase
      .from('modules')
      .select('id')
      .eq('key', 'self_service_table')
      .single();

    if (moduleError || !moduleData) {
      console.error('❌ Módulo self_service_table não encontrado na tabela modules:', moduleError);
      return new Response(
        JSON.stringify({ error: 'Módulo não encontrado no sistema' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se está BLOQUEADO (registro com is_enabled = false)
    const { data: blockedModule } = await supabase
      .from('store_modules')
      .select('id')
      .eq('store_id', store_id)
      .eq('module_id', moduleData.id)
      .eq('is_enabled', false)
      .single();

    // Se encontrou bloqueio, não permite
    if (blockedModule) {
      console.log('⛔ Módulo Cardápio na Mesa BLOQUEADO para loja:', store_id);
      return new Response(
        JSON.stringify({ error: 'Módulo Cardápio na Mesa não está ativo para esta loja' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Módulo Cardápio na Mesa liberado para loja:', store_id);

    // Buscar configuração do módulo
    const { data: config } = await supabase
      .from('store_table_service_config')
      .select('*')
      .eq('store_id', store_id)
      .single();

    const requirePassword = config?.customer_password_required ?? true;
    const requireApproval = config?.require_waiter_approval ?? true;

    // =====================
    // ACTION: CHECK_CUSTOMER
    // =====================
    if (action === 'check_customer') {
      const { data: customer } = await supabase
        .from('customers')
        .select('id, name, phone, table_password, auth_user_id')
        .eq('phone', normalizedPhone)
        .is('deleted_at', null)
        .single();

      if (customer) {
        const hasPassword = !!customer.table_password;
        return new Response(
          JSON.stringify({ 
            exists: true, 
            has_password: hasPassword,
            name: customer.name
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ exists: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =====================
    // ACTION: REGISTER
    // =====================
    if (action === 'register') {
      if (!name) {
        return new Response(
          JSON.stringify({ error: 'Nome é obrigatório para cadastro' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (requirePassword && (!password || password.length < 4 || password.length > 6)) {
        return new Response(
          JSON.stringify({ error: 'Senha deve ter entre 4 e 6 dígitos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se cliente já existe
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id, name, table_password')
        .eq('phone', normalizedPhone)
        .is('deleted_at', null)
        .single();

      let customerId: string;

      if (existingCustomer) {
        // Cliente existe - atualizar senha se necessário
        if (requirePassword && !existingCustomer.table_password) {
          const salt = generateSalt();
          const hashedPassword = await hashPassword(password!, salt);

          await supabase
            .from('customers')
            .update({ 
              table_password: hashedPassword, 
              password_salt: salt,
              name: name // Atualizar nome também
            })
            .eq('id', existingCustomer.id);
        }
        customerId = existingCustomer.id;
      } else {
        // Criar novo cliente
        const salt = generateSalt();
        const hashedPassword = requirePassword ? await hashPassword(password!, salt) : null;

        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert({
            name,
            phone: normalizedPhone,
            table_password: hashedPassword,
            password_salt: requirePassword ? salt : null,
          })
          .select('id')
          .single();

        if (createError) {
          console.error('❌ Erro ao criar cliente:', createError);
          return new Response(
            JSON.stringify({ error: 'Erro ao criar cadastro' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        customerId = newCustomer.id;

        // Vincular à loja
        await supabase
          .from('customer_stores')
          .insert({
            customer_id: customerId,
            store_id: store_id
          })
          .select();
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          customer_id: customerId,
          message: 'Cadastro realizado com sucesso'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =====================
    // ACTION: LOGIN
    // =====================
    if (action === 'login') {
      const { data: customer } = await supabase
        .from('customers')
        .select('id, name, table_password, password_salt')
        .eq('phone', normalizedPhone)
        .is('deleted_at', null)
        .single();

      if (!customer) {
        return new Response(
          JSON.stringify({ error: 'Cliente não encontrado. Faça seu cadastro primeiro.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (requirePassword) {
        if (!customer.table_password) {
          return new Response(
            JSON.stringify({ 
              error: 'Você precisa criar uma senha primeiro',
              needs_password: true
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!password) {
          return new Response(
            JSON.stringify({ error: 'Senha é obrigatória' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const hashedPassword = await hashPassword(password, customer.password_salt || '');
        if (hashedPassword !== customer.table_password) {
          return new Response(
            JSON.stringify({ error: 'Senha incorreta' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          customer_id: customer.id,
          customer_name: customer.name
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =====================
    // ACTION: CREATE_COMANDA
    // =====================
    if (action === 'create_comanda') {
      const { data: customer } = await supabase
        .from('customers')
        .select('id, name')
        .eq('phone', normalizedPhone)
        .is('deleted_at', null)
        .single();

      if (!customer) {
        return new Response(
          JSON.stringify({ error: 'Cliente não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se já existe comanda aberta para este cliente nesta mesa
      const { data: existingComanda } = await supabase
        .from('comandas')
        .select('id, number')
        .eq('store_id', store_id)
        .eq('customer_id', customer.id)
        .eq('table_number', table_number)
        .eq('status', 'open')
        .single();

      if (existingComanda) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            comanda_id: existingComanda.id,
            comanda_number: existingComanda.number,
            message: 'Comanda já existe',
            is_existing: true
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Gerar número da comanda
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('comandas')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store_id)
        .eq('type', 'mesa')
        .gte('opened_at', today);

      const comandaNumber = `M${String((count || 0) + 1).padStart(3, '0')}`;

      // Criar nova comanda
      const { data: newComanda, error: comandaError } = await supabase
        .from('comandas')
        .insert({
          store_id,
          number: comandaNumber,
          type: 'mesa',
          table_number,
          customer_id: customer.id,
          customer_name: customer.name,
          source: 'self_service',
          status: 'open',
        })
        .select('id, number')
        .single();

      if (comandaError) {
        console.error('❌ Erro ao criar comanda:', comandaError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar comanda' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('✅ Comanda criada:', newComanda.number);

      return new Response(
        JSON.stringify({ 
          success: true, 
          comanda_id: newComanda.id,
          comanda_number: newComanda.number,
          require_approval: requireApproval,
          message: 'Comanda criada com sucesso'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});