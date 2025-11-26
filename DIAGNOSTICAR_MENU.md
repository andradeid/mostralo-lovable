# 🔍 Diagnosticar Problema do Menu

## Como Diagnosticar

### 1. Abra o Console do Navegador
- Pressione `F12` ou `Ctrl+Shift+I`
- Vá na aba "Console"

### 2. Execute este código no console:

```javascript
// 1. Verificar perfil do usuário
const { data: { session } } = await supabase.auth.getSession();
console.log('🔐 Sessão:', session?.user?.email);

// 2. Buscar perfil
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', session.user.id)
  .single();

console.log('👤 Perfil:', {
  id: profile?.id,
  email: profile?.email,
  user_type: profile?.user_type,
  approval_status: profile?.approval_status
});

// 3. Buscar loja pelo owner_id
const { data: storeByOwner, error: storeError } = await supabase
  .from('stores')
  .select('id, name, subscription_expires_at, owner_id')
  .eq('owner_id', profile.id)
  .single();

console.log('🏪 Loja (por owner_id):', {
  encontrada: !!storeByOwner,
  id: storeByOwner?.id,
  name: storeByOwner?.name,
  subscription_expires_at: storeByOwner?.subscription_expires_at,
  owner_id: storeByOwner?.owner_id,
  erro: storeError?.message
});

// 4. Buscar loja via user_roles
const { data: roleData } = await supabase
  .from('user_roles')
  .select('store_id, role')
  .eq('user_id', profile.id)
  .eq('role', 'store_admin')
  .limit(1)
  .maybeSingle();

console.log('🔑 Role:', {
  encontrada: !!roleData,
  store_id: roleData?.store_id,
  role: roleData?.role
});

if (roleData?.store_id) {
  const { data: storeByRole } = await supabase
    .from('stores')
    .select('id, name, subscription_expires_at, owner_id')
    .eq('id', roleData.store_id)
    .single();
  
  console.log('🏪 Loja (por user_roles):', {
    encontrada: !!storeByRole,
    id: storeByRole?.id,
    name: storeByRole?.name,
    subscription_expires_at: storeByRole?.subscription_expires_at,
    owner_id: storeByRole?.owner_id
  });
}

// 5. Verificar se a assinatura está ativa
if (storeByOwner || (roleData?.store_id && storeByRole)) {
  const store = storeByOwner || storeByRole;
  const expiresAt = store.subscription_expires_at;
  
  if (expiresAt) {
    const expirationDate = new Date(expiresAt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expirationDate.setHours(0, 0, 0, 0);
    
    const isActive = expirationDate > today;
    const daysUntil = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log('📅 Validação de Assinatura:', {
      expiresAt: expiresAt,
      expirationDate: expirationDate.toISOString().split('T')[0],
      today: today.toISOString().split('T')[0],
      isActive: isActive,
      daysUntil: daysUntil
    });
  } else {
    console.log('⚠️ Sem data de expiração');
  }
}
```

### 3. Verifique os Logs

Os logs devem mostrar:
- ✅ Se o perfil foi encontrado
- ✅ Se a loja foi encontrada (por `owner_id` ou `user_roles`)
- ✅ Se `subscription_expires_at` está preenchida
- ✅ Se a data está no futuro (assinatura ativa)

### 4. Possíveis Problemas

#### Problema 1: Loja não encontrada
- **Sintoma**: `encontrada: false` em ambos os casos
- **Solução**: Verificar se o usuário tem uma loja vinculada no banco de dados

#### Problema 2: `owner_id` não corresponde
- **Sintoma**: Loja encontrada via `user_roles` mas não via `owner_id`
- **Solução**: Atualizar o `owner_id` da loja para corresponder ao `profile.id`

#### Problema 3: `subscription_expires_at` está vazia
- **Sintoma**: `subscription_expires_at: null`
- **Solução**: Definir a data de expiração da assinatura

#### Problema 4: Data de expiração no passado
- **Sintoma**: `isActive: false` e `daysUntil` negativo
- **Solução**: Atualizar `subscription_expires_at` para uma data futura

---

## Envie os Resultados

Copie e cole todos os logs do console aqui para que eu possa identificar o problema exato.

