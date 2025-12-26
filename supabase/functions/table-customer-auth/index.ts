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

// Normalizar telefone brasileiro para formato canônico (10-11 dígitos, SEM DDI 55)
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // Remover DDI 55 se presente
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits.substring(2);
  }
  return digits;
}

// Gerar variantes de telefone para busca tolerante
function getPhoneVariants(phone: string): string[] {
  const canonical = normalizePhone(phone);
  return [canonical, '55' + canonical];
}

// Gerar email temporário baseado no telefone (mesmo padrão do customer-auth)
function generateTempEmail(phone: string): string {
  const normalized = normalizePhone(phone);
  return `cliente_${normalized}@mostralo.me`;
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
    const tempEmail = generateTempEmail(phone);

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
      const phoneVariants = getPhoneVariants(phone);
      console.log('🔍 Buscando cliente com variantes:', phoneVariants);
      
      const { data: customer } = await supabase
        .from('customers')
        .select('id, name, phone, auth_user_id')
        .in('phone', phoneVariants)
        .is('deleted_at', null)
        .limit(1)
        .single();

      if (customer) {
        // MUDANÇA: has_password agora verifica auth_user_id (senha unificada do sistema)
        const hasPassword = !!customer.auth_user_id;
        console.log('✅ Cliente encontrado:', customer.name, '| Tem auth_user_id:', hasPassword);
        return new Response(
          JSON.stringify({ 
            exists: true, 
            has_password: hasPassword,
            name: customer.name
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('ℹ️ Cliente não encontrado');
      return new Response(
        JSON.stringify({ exists: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =====================
    // ACTION: REGISTER (cliente novo - cria via Supabase Auth)
    // =====================
    if (action === 'register') {
      if (!name) {
        return new Response(
          JSON.stringify({ error: 'Nome é obrigatório para cadastro' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (requirePassword && (!password || password.length < 4)) {
        return new Response(
          JSON.stringify({ error: 'Senha deve ter pelo menos 4 caracteres' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se cliente já existe
      const phoneVariants = getPhoneVariants(phone);
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id, name, auth_user_id')
        .in('phone', phoneVariants)
        .is('deleted_at', null)
        .limit(1)
        .single();

      let customerId: string;

      if (existingCustomer) {
        // Cliente existe mas precisa criar senha via Supabase Auth
        if (requirePassword && !existingCustomer.auth_user_id) {
          console.log('📝 Cliente existe sem auth, criando usuário auth...');
          
          // Criar usuário no Supabase Auth
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: tempEmail,
            password: password,
            email_confirm: true,
            user_metadata: {
              full_name: name,
              phone: normalizedPhone,
              role_type: 'customer'
            }
          });

          if (authError) {
            console.error('❌ Erro ao criar auth user:', authError);
            return new Response(
              JSON.stringify({ error: 'Erro ao criar conta. Tente novamente.' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Atualizar customer com auth_user_id
          await supabase
            .from('customers')
            .update({ 
              auth_user_id: authUser.user.id,
              name: name
            })
            .eq('id', existingCustomer.id);

          // Criar role de customer
          await supabase
            .from('user_roles')
            .upsert({
              user_id: authUser.user.id,
              role: 'customer'
            }, { onConflict: 'user_id,role' });

          console.log('✅ Auth user criado e vinculado ao cliente');
        }
        customerId = existingCustomer.id;
      } else {
        // Criar novo cliente COM Supabase Auth
        console.log('📝 Criando novo cliente com Supabase Auth...');

        // Primeiro criar usuário auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: tempEmail,
          password: password || '102030', // Senha padrão se não requer senha
          email_confirm: true,
          user_metadata: {
            full_name: name,
            phone: normalizedPhone,
            role_type: 'customer'
          }
        });

        if (authError) {
          console.error('❌ Erro ao criar auth user:', authError);
          return new Response(
            JSON.stringify({ error: 'Erro ao criar conta. Tente novamente.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Criar customer vinculado ao auth user
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert({
            name,
            phone: normalizedPhone,
            auth_user_id: authUser.user.id
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

        // Criar role de customer
        await supabase
          .from('user_roles')
          .upsert({
            user_id: authUser.user.id,
            role: 'customer'
          }, { onConflict: 'user_id,role' });

        // Vincular à loja
        await supabase
          .from('customer_stores')
          .insert({
            customer_id: customerId,
            store_id: store_id
          })
          .select();

        console.log('✅ Cliente criado com auth_user_id');
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
    // ACTION: LOGIN (usa Supabase Auth - mesma senha do checkout)
    // =====================
    if (action === 'login') {
      const phoneVariants = getPhoneVariants(phone);
      const { data: customer } = await supabase
        .from('customers')
        .select('id, name, auth_user_id')
        .in('phone', phoneVariants)
        .is('deleted_at', null)
        .limit(1)
        .single();

      if (!customer) {
        return new Response(
          JSON.stringify({ error: 'Cliente não encontrado. Faça seu cadastro primeiro.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (requirePassword) {
        if (!customer.auth_user_id) {
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

        // LOGIN VIA SUPABASE AUTH (mesma senha do checkout)
        console.log('🔐 Tentando login via Supabase Auth:', tempEmail);
        
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: tempEmail,
          password: password
        });

        if (authError) {
          console.error('❌ Erro de autenticação:', authError.message);
          return new Response(
            JSON.stringify({ error: 'Senha incorreta' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('✅ Login bem-sucedido via Supabase Auth');
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
      const phoneVariants = getPhoneVariants(phone);
      const { data: customer } = await supabase
        .from('customers')
        .select('id, name')
        .in('phone', phoneVariants)
        .is('deleted_at', null)
        .limit(1)
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
