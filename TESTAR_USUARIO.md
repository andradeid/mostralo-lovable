# 🔧 Testar e Corrigir Login do Usuário

## Usuário para Testar
- **Nome**: Inga Beach
- **Email**: ingabeachsports@gmail.com
- **Senha Atual**: Ing@beach!951753

## Como Testar e Corrigir

### Opção 1: Via Interface (Recomendado)

1. **Acesse a página de Usuários**:
   - Dashboard → Usuários
   - Ou navegue para `/dashboard/usuarios`

2. **Busque o usuário**:
   - Use a busca para encontrar `ingabeachsports@gmail.com`

3. **Clique no menu (3 pontos)** ao lado do usuário

4. **Selecione "Diagnosticar Login"**

5. **No diálogo**:
   - O email já estará preenchido
   - **Opcional**: Digite uma nova senha (mínimo 6 caracteres)
   - Clique em "Corrigir e Resetar Senha" ou apenas "Diagnosticar"

6. **Verifique o resultado**:
   - O diálogo mostrará:
     - Se o email está confirmado
     - Se a senha foi resetada
     - Perfil do usuário
     - Roles do usuário
     - Correções aplicadas

### Opção 2: Via Console do Navegador

Se você quiser testar diretamente via código:

```javascript
// 1. Verificar se está logado como master admin
const { data: { session } } = await supabase.auth.getSession();
console.log('Sessão:', !!session);

// 2. Chamar a função de correção
const { data, error } = await supabase.functions.invoke('fix-user-login', {
  body: {
    email: 'ingabeachsports@gmail.com',
    newPassword: 'NovaSenha123' // Opcional
  }
});

console.log('Resultado:', { data, error });
```

## O que a Função Faz

A função `fix-user-login` automaticamente:

1. ✅ **Busca o usuário** pelo email
2. ✅ **Verifica se o email está confirmado** - se não, confirma automaticamente
3. ✅ **Reseta a senha** (se fornecida)
4. ✅ **Remove banimento** (se existir)
5. ✅ **Mostra informações do perfil e roles**

## Possíveis Problemas e Soluções

### Problema: "Usuário não encontrado"
- **Causa**: Email não existe no sistema
- **Solução**: Verifique se o email está correto no banco de dados

### Problema: "Não autorizado"
- **Causa**: Você não está logado como master_admin
- **Solução**: Faça login com uma conta master_admin

### Problema: "Email não confirmado"
- **Causa**: O usuário nunca confirmou o email
- **Solução**: A função confirma automaticamente

### Problema: "Senha incorreta" ao tentar logar
- **Causa**: Senha antiga não funciona
- **Solução**: Use a função para resetar a senha

## Após Corrigir

1. **Tente fazer login** com:
   - Email: `ingabeachsports@gmail.com`
   - Senha: A nova senha definida (ou a original se não foi resetada)

2. **Se ainda não funcionar**:
   - Verifique os logs no Supabase Dashboard
   - Verifique se o usuário tem role/permissões corretas
   - Verifique se a conta não está bloqueada

---

**Última atualização**: Função criada e deployada com sucesso.

