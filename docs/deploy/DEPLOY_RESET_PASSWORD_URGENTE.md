# 🚨 URGENTE: Deploy da Edge Function reset-customer-password

## ⚠️ Problema Atual

A Edge Function `reset-customer-password` **NÃO foi deployada ainda!**

Por isso o erro 400 aparece ao tentar resetar senha.

---

## ✅ O Que Já Foi Corrigido

1. ✅ AdminCustomersPage agora **filtra apenas clientes da loja**
2. ✅ Contagem de pedidos **apenas da loja**
3. ✅ Isolamento entre lojas mantido

---

## 🚀 Como Fazer Deploy

### Opção 1: Dashboard Supabase (Mais Fácil)

1. **Abrir:** https://supabase.com/dashboard/project/noshwvwpjtnvndokbfjx/functions

2. **Criar Nova Function:**
   - Nome: `reset-customer-password`
   - Clicar em "Create Function"

3. **Copiar Código:**
   - Arquivo: `supabase/functions/reset-customer-password/index.ts`
   - Abrir no Notepad
   - Ctrl+A, Ctrl+C

4. **Colar no Editor:**
   - Ctrl+A (selecionar tudo no editor)
   - Ctrl+V (colar)

5. **Deploy:**
   - Clicar em "Deploy"
   - Aguardar "Success"

6. **IMPORTANTE:**
   - Ir em "Configuration"
   - **Verify JWT: OFF** ❌
   - Salvar

---

## 📝 Código da Edge Function

**Arquivo:** `.mostralo/supabase/functions/reset-customer-password/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { customerId, newPassword } = await req.json();
    
    console.log('Reset password request for customer:', customerId?.substring(0, 8) + '***');
    
    if (!customerId || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'customerId e newPassword são obrigatórios' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Senha deve ter no mínimo 6 caracteres' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, phone, auth_user_id')
      .eq('id', customerId)
      .single();
    
    if (customerError || !customer) {
      console.error('Customer not found:', customerError);
      return new Response(
        JSON.stringify({ error: 'Cliente não encontrado' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Customer found:', { name: customer.name, hasAuthUserId: !!customer.auth_user_id });
    
    if (!customer.auth_user_id) {
      return new Response(
        JSON.stringify({ error: 'Cliente não possui autenticação configurada. O cliente precisa criar uma conta com senha primeiro.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      customer.auth_user_id,
      { password: newPassword }
    );
    
    if (updateError) {
      console.error('Failed to update password:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar senha: ' + updateError.message }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Password updated successfully for customer:', customer.name);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Senha de ${customer.name} atualizada com sucesso!`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao processar solicitação' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 🧪 Como Testar Depois do Deploy

1. **Recarregar sistema** (Ctrl+Shift+R)
2. **Ir em:** Menu > Vendas > Clientes
3. **Deve aparecer:**
   - Apenas clientes DA SUA LOJA
   - Capitão América ✓
   - Matheus Gontijo ✓
   - Mulher Aranha ⚠
   - Marcos Andrade ⚠

4. **Testar Reset:**
   - Clicar em "Resetar Senha" do Capitão América
   - Definir nova senha: 999999
   - Deve aparecer: "✅ Senha atualizada com sucesso!"

5. **Testar Login do Cliente:**
   - Telefone: 33333333333
   - Senha: 999999
   - Deve funcionar!

---

## 📊 O Que Foi Corrigido

### ANTES (❌ Errado):
```sql
-- Buscava TODOS os clientes de TODAS as lojas
SELECT * FROM customers
```

### DEPOIS (✅ Correto):
```sql
-- Busca apenas clientes da loja do admin logado
SELECT customers.* 
FROM customers
INNER JOIN customer_stores 
  ON customers.id = customer_stores.customer_id
WHERE customer_stores.store_id = 'store_do_admin_logado'
```

---

## ⚠️ Importante

### Isolamento por Loja

Cada loja vê apenas:
- ✅ Seus próprios clientes
- ✅ Pedidos desses clientes na sua loja
- ✅ Pode resetar senha apenas dos seus clientes

### Segurança Mantida

- ✅ RLS preservado
- ✅ Loja A não vê clientes da Loja B
- ✅ Admin só vê sua loja
- ✅ Master admin vê todas (se configurado)

---

## 🔧 Troubleshooting

### Se continuar dando erro 400:
1. Verificar se Edge Function foi criada
2. Ir em Dashboard > Edge Functions
3. Procurar `reset-customer-password`
4. Status deve estar "Deployed" (verde)

### Se aparecer erro 401:
1. Ir em Configuration da função
2. Verify JWT: **OFF** ❌
3. Salvar

### Se não aparecer clientes:
1. Verificar se você está logado como store_admin
2. Verificar se sua loja tem clientes
3. Verificar tabela `customer_stores`

---

## ✅ Checklist

```
[ ] Edge Function criada no Dashboard
[ ] Código colado e deployado
[ ] Verify JWT: OFF
[ ] Status: Deployed (verde)
[ ] Sistema recarregado (Ctrl+Shift+R)
[ ] Página /dashboard/customers acessada
[ ] Mostra apenas clientes da minha loja
[ ] Reset de senha testado
[ ] Tudo funcionando! 🎉
```

---

**Está pronto para fazer o deploy?** 🚀  
**Vou abrir o arquivo para você copiar!**

