# Usuários de Exemplo - Sistema Mostralo

Este documento lista os usuários de demonstração criados no sistema para facilitar os testes e demonstrações.

## 👤 Usuários Criados

### 1. Super Admin (Master Admin)
- **Nome**: Carlos Silva - Super Admin  
- **Email**: admin@mostralo.com
- **Tipo**: `master_admin`
- **ID**: 11111111-1111-1111-1111-111111111111
- **Permissões**: 
  - Gerenciar todos os planos e módulos
  - Visualizar e gerenciar todas as lojas
  - Acesso total ao sistema

### 2. Dono do Estabelecimento (Store Admin)
- **Nome**: João Santos - Dono da Pizzaria
- **Email**: joao@pizzaria.com  
- **Tipo**: `store_admin`
- **ID**: 22222222-2222-2222-2222-222222222222
- **Loja**: Pizzaria do João (slug: `pizzaria-do-joao`)
- **Permissões**:
  - Gerenciar sua própria loja
  - Criar/editar produtos e categorias
  - Visualizar relatórios da loja

### 3. Cliente/Usuário Regular
- **Nome**: Maria Oliveira - Cliente
- **Email**: maria@cliente.com
- **Tipo**: `store_admin` (temporário - pode ser ajustado)
- **ID**: 33333333-3333-3333-3333-333333333333
- **Permissões**: Acesso básico ao sistema

## 🔑 Como Usar os Usuários de Exemplo

### Opção 1: Testes Rápidos (Dados Fictícios)
Os perfis já estão criados no banco com IDs fixos. Você pode:
1. Usar diretamente nos testes do dashboard
2. Simular login modificando o estado da aplicação
3. Testar diferentes níveis de permissão

### Opção 2: Usuários Reais (Recomendado)
Para criar usuários funcionais com login real:

1. **Acesse a página de registro**: `/auth`
2. **Crie contas com os emails**:
   - admin@mostralo.com
   - joao@pizzaria.com  
   - maria@cliente.com
3. **Os perfis serão automaticamente vinculados** pelo trigger `handle_new_user()`

## 🏪 Lojas de Exemplo

### Pizzaria do João
- **URL**: `/loja/pizzaria-do-joao`
- **Dono**: João Santos
- **Status**: Ativa
- **Produtos**: Pizzas, bebidas, sobremesas

### Hamburgueria do José (Planejada)
- **URL**: `/loja/hamburgueria-do-jose`
- **Plano**: Básico
- **Status**: Para ser implementada

## 🛡️ Níveis de Permissão

### Master Admin
- Acesso total ao sistema
- Gerenciamento de planos e módulos
- Visualização de todas as lojas
- Controle de usuários

### Store Admin  
- Gerenciamento da própria loja
- Criação/edição de produtos
- Controle de categorias
- Relatórios da loja

### Cliente (Futuro)
- Visualização de cardápios
- Histórico de pedidos
- Favoritos

## 📝 Notas Importantes

1. **Dados de Demonstração**: Os perfis atuais são apenas para demonstração
2. **Constraint Relaxada**: A foreign key foi ajustada para permitir dados de exemplo
3. **Produção**: Em produção, todos os usuários devem ser criados via autenticação normal
4. **Limpeza**: Os dados de exemplo podem ser removidos quando não necessários

## 🔧 Comandos Úteis

### Visualizar Perfis
```sql
SELECT id, email, full_name, user_type, created_at 
FROM public.profiles 
ORDER BY created_at;
```

### Conectar Perfil a Usuário Real
```sql
-- Após criar usuário real via signup
UPDATE public.profiles 
SET id = '[UUID_DO_USUARIO_REAL]' 
WHERE email = 'admin@mostralo.com';
```

### Limpar Dados de Exemplo
```sql
-- Remover perfis de exemplo
DELETE FROM public.profiles 
WHERE id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222', 
  '33333333-3333-3333-3333-333333333333'
);
```