# 🔐 Problema: Conflito de Sessões entre Cliente e Admin

## 🐛 O Problema

Quando você tenta fazer login como **cliente** em uma aba privada e como **admin** na aba normal (ou vice-versa), pode ocorrer um conflito de sessões que causa o erro:

```
Invalid login credentials
```

### Por que isso acontece?

1. **Supabase usa localStorage**: O Supabase armazena a sessão de autenticação no `localStorage` do navegador
2. **Sessões compartilhadas**: Mesmo em abas diferentes, o `localStorage` é compartilhado (exceto em modo privado)
3. **Sobrescrita de sessão**: Quando você faz login como cliente, a sessão é salva. Quando tenta fazer login como admin, pode estar usando a sessão do cliente que já está no `localStorage`
4. **Token inválido**: O token do cliente não funciona para fazer login como admin, causando o erro "Invalid login credentials"

---

## ✅ Solução Implementada

### 1. Limpeza Automática de Sessão Antes do Login

Agora, antes de tentar fazer login, o sistema:
- ✅ Verifica se há uma sessão anterior
- ✅ Faz logout automático se encontrar
- ✅ Aguarda a limpeza ser processada
- ✅ Então tenta o novo login

```typescript
// Limpar sessão anterior antes de tentar novo login
const { data: currentSession } = await supabase.auth.getSession();
if (currentSession.session) {
  console.log('⚠️ Sessão anterior detectada, fazendo logout antes do novo login...');
  await supabase.auth.signOut();
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

### 2. Limpeza de Dados do Cliente no Logout

Quando você faz logout, o sistema também:
- ✅ Remove todos os dados de cliente do `localStorage` (chaves que começam com `customer_`)
- ✅ Limpa a sessão do Supabase
- ✅ Limpa estados locais

---

## 🧪 Como Testar

### Cenário 1: Login Admin após Login Cliente

1. **Aba Normal**: Faça login como cliente em uma loja
2. **Mesma Aba**: Tente fazer login como admin
3. **Resultado Esperado**: 
   - O sistema detecta a sessão do cliente
   - Faz logout automático
   - Permite login como admin

### Cenário 2: Login Cliente após Login Admin

1. **Aba Normal**: Faça login como admin
2. **Mesma Aba**: Tente fazer login como cliente
3. **Resultado Esperado**: 
   - O sistema detecta a sessão do admin
   - Faz logout automático
   - Permite login como cliente

### Cenário 3: Abas Separadas (Ideal)

1. **Aba Normal**: Login como admin
2. **Aba Privada**: Login como cliente
3. **Resultado Esperado**: 
   - Cada aba mantém sua própria sessão
   - Sem conflitos

---

## 📝 Recomendações

### Para Desenvolvedores

1. **Sempre faça logout antes de trocar de usuário** na mesma aba
2. **Use abas privadas** para testar diferentes tipos de usuários
3. **Limpe o localStorage** se encontrar problemas persistentes:
   ```javascript
   // No console do navegador (F12)
   localStorage.clear();
   location.reload();
   ```

### Para Usuários Finais

1. **Use abas separadas** se precisar acessar como cliente e admin
2. **Faça logout** antes de trocar de conta na mesma aba
3. **Limpe o cache** se encontrar problemas de login

---

## 🔍 Debug

Se ainda encontrar problemas, verifique no console do navegador (F12):

```
🔐 Tentando login: { emailOriginal: "...", emailNormalized: "..." }
⚠️ Sessão anterior detectada, fazendo logout antes do novo login...
✅ Login bem-sucedido: { userId: "...", email: "..." }
```

Se você ver a mensagem "Sessão anterior detectada", significa que a correção está funcionando!

---

## 🚨 Problemas Conhecidos

### Modo Privado/Incógnito

- Em modo privado, cada aba tem seu próprio `localStorage`
- Isso é **esperado** e **correto**
- Não há conflito entre abas privadas

### Múltiplas Abas Normais

- Todas as abas normais compartilham o mesmo `localStorage`
- Se você fizer login em uma aba, todas as outras abas serão atualizadas
- Isso é o comportamento padrão do Supabase

---

## ✅ Status

- ✅ Limpeza automática de sessão antes do login
- ✅ Limpeza de dados do cliente no logout
- ✅ Logs detalhados para debug
- ✅ Tratamento de erros melhorado

**Última atualização**: Correção implementada para evitar conflitos de sessão.

