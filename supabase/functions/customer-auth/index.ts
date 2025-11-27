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
    const body = await req.json();
    const { action = 'login', phone, password, name, email, address, latitude, longitude, notes, storeId } = body;
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Normalizar e validar telefone
    let normalizedPhone = phone.replace(/\D/g, '');
    
    // Remover DDI 55 se presente
    if (normalizedPhone.startsWith('55') && normalizedPhone.length > 11) {
      normalizedPhone = normalizedPhone.substring(2);
    }
    
    // Remover 0 à esquerda do DDD se presente
    if (normalizedPhone.startsWith('0') && normalizedPhone.length === 11) {
      normalizedPhone = normalizedPhone.substring(1);
    }
    
    // Validar formato (deve ter 10 ou 11 dígitos)
    if (normalizedPhone.length < 10 || normalizedPhone.length > 11) {
      console.log('Invalid phone format:', { original: phone?.substring(0, 4) + '***', normalized: normalizedPhone, length: normalizedPhone.length });
      return new Response(
        JSON.stringify({ error: 'Formato de telefone inválido. Use (XX) XXXXX-XXXX ou (XX) XXXX-XXXX' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Customer auth request:', { action, phone: normalizedPhone?.substring(0, 4) + '***', phoneLength: normalizedPhone.length });

    // === MODO CADASTRO ===
    if (action === 'register') {
      if (!name || !address || !latitude || !longitude || !password) {
        return new Response(
          JSON.stringify({ error: 'Dados incompletos para cadastro' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se telefone já existe
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', normalizedPhone)
        .maybeSingle();

      if (existingCustomer) {
        return new Response(
          JSON.stringify({ error: 'Este telefone já está cadastrado. Use "Já tenho conta" para fazer login.' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Criar usuário de autenticação
      const tempEmail = `cliente_${normalizedPhone}@mostralo.me`;
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: tempEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          phone: normalizedPhone,
          role_type: 'customer'
        }
      });

      if (createError) {
        console.error('Failed to create auth user:', createError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar usuário de autenticação' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Criar cliente
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name,
          phone: normalizedPhone,
          email: email || null,
          address,
          latitude,
          longitude,
          notes: notes || null,
          auth_user_id: newUser.user.id
        })
        .select('id, name, phone, email, address, latitude, longitude, auth_user_id')
        .single();

      if (customerError) {
        console.error('Failed to create customer:', customerError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar cadastro de cliente' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se o usuário já tem role store_admin (prevenção de conflito)
      const { data: existingAdminRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', newUser.user.id)
        .eq('role', 'store_admin')
        .maybeSingle();

      if (existingAdminRole) {
        console.error('User already has store_admin role:', newUser.user.id);
        return new Response(
          JSON.stringify({ 
            error: 'Este usuário já possui role administrativa e não pode ser cliente' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Criar role de customer
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: newUser.user.id, role: 'customer' });

      if (roleError) {
        console.error('Failed to create customer role:', roleError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar role de cliente' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Criar relacionamento com a loja
      if (storeId) {
        await supabase
          .from('customer_stores')
          .insert({
            customer_id: newCustomer.id,
            store_id: storeId,
            first_order_at: new Date().toISOString()
          });
      }

      // Fazer login automático
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: tempEmail,
        password: password
      });

      if (authError) {
        console.error('Auto-login error:', authError);
        return new Response(
          JSON.stringify({ error: 'Cadastro criado, mas erro no login automático' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Registration successful for:', newCustomer.id);

      return new Response(
        JSON.stringify({ 
          session: authData.session,
          customer: newCustomer
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === MODO LOGIN ===
    // Buscar cliente GLOBALMENTE
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, auth_user_id, phone, email, address, latitude, longitude')
      .eq('phone', normalizedPhone)
      .maybeSingle();
    
    if (customerError) {
      console.error('Database error fetching customer:', customerError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar cliente no banco de dados.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!customer) {
      console.log('Customer not found for phone:', normalizedPhone?.substring(0, 4) + '***');
      return new Response(
        JSON.stringify({ error: 'Cliente não encontrado. Crie uma conta primeiro clicando em "Criar conta".' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Customer found for login:', { customerId: customer.id, hasAuthUserId: !!customer.auth_user_id });

    // Verificar se tem auth_user_id
    if (!customer.auth_user_id) {
      console.log('Customer without auth_user_id:', customer.id);
      
      // Se não tem senha, não pode fazer login ainda
      if (!password) {
        return new Response(
          JSON.stringify({ error: 'Sua conta foi criada sem senha. Por favor, defina uma senha primeiro.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Criar usuário de autenticação para cliente existente
      const tempEmail = `cliente_${normalizedPhone}@mostralo.me`;
      
      console.log('Creating auth user for existing customer:', { customerId: customer.id, phone: normalizedPhone?.substring(0, 4) + '***' });
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: tempEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: customer.name,
          phone: normalizedPhone,
          role_type: 'customer'
        }
      });

      if (createError) {
        console.error('Failed to create auth user for existing customer:', createError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar conta de autenticação. Tente novamente.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Atualizar cliente com auth_user_id
      const { error: updateError } = await supabase
        .from('customers')
        .update({ auth_user_id: newUser.user.id })
        .eq('id', customer.id);

      if (updateError) {
        console.error('Failed to update customer with auth_user_id:', updateError);
        return new Response(
          JSON.stringify({ error: 'Erro ao vincular conta de autenticação.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verificar se já tem role customer
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', newUser.user.id)
        .eq('role', 'customer')
        .maybeSingle();

      if (!existingRole) {
        // Criar role de customer se não existir
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: newUser.user.id, role: 'customer' });

        if (roleError) {
          console.error('Failed to create customer role:', roleError);
          // Não falhar aqui, apenas logar
        }
      }

      // Atualizar customer com auth_user_id
      customer.auth_user_id = newUser.user.id;
      
      console.log('Auth user created and linked to customer:', customer.id);
    }
    
    // Fazer login
    const tempEmailLogin = `cliente_${normalizedPhone}@mostralo.me`;
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: tempEmailLogin,
      password: password
    });
    
    if (authError) {
      console.error('Auth error:', authError.message);
      return new Response(
        JSON.stringify({ error: 'Senha incorreta. Verifique sua senha e tente novamente.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Login successful for customer:', customer.id);
    
    return new Response(
      JSON.stringify({ 
        session: authData.session,
        customer: customer
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao processar login' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
