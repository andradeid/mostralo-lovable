# 🚨 SOLUÇÃO: Edge Function 401 Unauthorized

## 🔍 Diagnóstico

O erro mostra:
```
POST .../customer-auth 401 (Unauthorized)
data: null
```

**Isso significa:** A Edge Function está **BLOQUEADA** antes de executar!

---

## 🎯 Solução: Deploy Manual Via Dashboard

### PASSO 1: Abrir Supabase Dashboard

1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto
3. Menu lateral: **Edge Functions**

### PASSO 2: Editar customer-auth

1. Encontre **customer-auth** na lista
2. Clique em **Edit** ou **⋮** (três pontos) > **Edit**

### PASSO 3: Substituir TODO o código

**APAGUE TODO O CÓDIGO EXISTENTE** e cole este:

```typescript
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
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Customer auth request:', { action, phone: normalizedPhone?.substring(0, 4) + '***', phoneLength: normalizedPhone.length });

    // === MODO CADASTRO ===
    if (action === 'register') {
      if (!name || !address || !latitude || !longitude || !password) {
        return new Response(
          JSON.stringify({ error: 'Dados incompletos para cadastro' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Criar usuário de autenticação
      const tempEmail = `cliente_${normalizedPhone}@temp.mostralo.com`;
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: tempEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          phone: normalizedPhone
        }
      });

      if (createError) {
        console.error('Failed to create auth user:', createError);
        return new Response(
          JSON.stringify({ error: 'Erro ao criar usuário de autenticação' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Registration successful for:', newCustomer.id);

      return new Response(
        JSON.stringify({ 
          session: authData.session,
          customer: newCustomer
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      return new Response(
        JSON.stringify({ error: 'Sua conta foi criada sem senha. Por favor, crie uma nova conta com senha clicando em "Criar conta".' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fazer login
    const tempEmailLogin = `cliente_${normalizedPhone}@temp.mostralo.com`;
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
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### PASSO 4: Salvar e Deploy

1. Clique em **Save** ou **Deploy**
2. Aguarde a mensagem de sucesso
3. Verifique se o status está **Deployed** (verde)

### PASSO 5: Verificar Permissões

1. Na tela da Edge Function, vá em **Settings**
2. Verifique se **Verify JWT** está **DESABILITADO** ❌
3. Se estiver habilitado, **DESABILITE**

---

## 🧪 Teste Novamente

1. **Recarregue a página** (Ctrl+Shift+R)
2. **Abra o Console** (F12)
3. **Tente fazer login** com 33333333333
4. **Agora deve aparecer** mensagem específica!

---

## 📊 Execute o SQL (URGENTE)

```sql
SELECT 
  phone,
  name,
  auth_user_id,
  CASE 
    WHEN auth_user_id IS NULL THEN '🚨 SEM AUTH'
    ELSE '✅ TEM AUTH'
  END AS status
FROM customers
WHERE phone IN ('22222222222', '33333333333');
```

**Se retornar 0 linhas:**
- Clientes **NÃO EXISTEM**
- Precisam se **CADASTRAR** (não fazer login)

**Se retornar com auth_user_id = NULL:**
- Clientes existem MAS **SEM SENHA**
- Foram criados pelo fluxo antigo
- Precisam se **RECADASTRAR**

---

## ⚡ Atalho Rápido

Se não conseguir fazer deploy via Dashboard:

**Me confirme que executou o SQL acima!**

Isso vai me dizer se o problema é:
- ❌ Clientes não existem (precisam cadastrar)
- ⚠️ Clientes sem auth (precisam recadastrar)
- ✅ Clientes OK (problema só na Edge Function)

---

**PRIORIDADE:** Execute o SQL AGORA e me envie o resultado! 🚨

