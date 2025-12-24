# 🚀 Deploy em 3 Minutos - Copiar e Colar

## ⚡ MÉTODO SUPER RÁPIDO

### 📝 PASSO 1: Abrir HTML Automático (10 segundos)

1. Abra o arquivo:
```
C:\Users\PC\Projetos Cursor\.mostralo\ABRIR_SUPABASE_AUTO.html
```

2. Clique no botão **"Abrir Todas as Abas Necessárias"**

3. **PRONTO!** Todas as abas necessárias foram abertas! 🎉

---

### 💾 PASSO 2: Criar/Atualizar Edge Function (30 segundos)

Na aba que abriu com o título **"Edge Functions"**:

#### Se a função `reset-customer-password` JÁ EXISTE:
1. Clique nela
2. Clique em **"Edit"** ou **"Code Editor"**
3. **APAGUE TUDO** e cole este código:

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
    
    // Buscar cliente
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
    
    // Verificar se tem auth_user_id
    if (!customer.auth_user_id) {
      return new Response(
        JSON.stringify({ error: 'Cliente não possui autenticação configurada. O cliente precisa criar uma conta com senha primeiro.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Atualizar senha usando Admin API
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

4. Clique em **"Save"** ou **"Deploy"**

#### Se a função `reset-customer-password` NÃO EXISTE:
1. Clique em **"New Function"**
2. Nome: `reset-customer-password` (exatamente assim!)
3. Cole o código acima
4. Clique em **"Create"** ou **"Deploy"**

---

### ⚙️ PASSO 3: Desabilitar Verify JWT (20 segundos)

**IMPORTANTE:** Sem isso, vai dar erro 401!

1. Na mesma aba de Edge Functions
2. Clique em `reset-customer-password`
3. Vá em **"Settings"** ou **"Configurações"**
4. Procure por **"Verify JWT"**
5. **DESABILITE** (OFF)
6. Clique em **"Save"**

---

### ✅ PASSO 4: Testar (20 segundos)

1. Volte pro seu sistema
2. Pressione **Ctrl+Shift+R**
3. Vá em **Menu > Vendas > Clientes**
4. Clique em **"Resetar Senha"** do Capitão América
5. Digite senha: `999999`
6. Clique em **"Resetar"**

**DEVE APARECER:** "Senha atualizada com sucesso!" ✅

---

## 🎯 RESUMO

```
1. Abrir ABRIR_SUPABASE_AUTO.html (10s)
2. Colar código da função (30s)
3. Desabilitar Verify JWT (20s)
4. Testar (20s)
TOTAL: 1 minuto e 20 segundos!
```

---

## 🆘 Problemas?

### ❌ Erro 401
- Você esqueceu de desabilitar "Verify JWT"
- Vá em Settings da função e desabilite

### ❌ Erro 400
- Nome da função está errado
- Deve ser exatamente: `reset-customer-password`

### ❌ Função não aparece na lista
- Espere 10 segundos
- Recarregue a página (F5)

### ❌ Botão "Deploy" não aparece
- Você está no modo visualização
- Clique em "Edit" primeiro

---

## 💡 DICA PRO

Salve este guia nos favoritos!
Próxima vez vai ser ainda mais rápido! ⚡

---

**Precisa de ajuda? Me chame!** 🚀

