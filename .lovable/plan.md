
# Plano de Implementação

## Resumo
Este plano aborda duas melhorias solicitadas:
1. **Correção do mapeamento de categorias** no import do Alquimia
2. **Funcionalidade de exclusão em massa** de produtos e categorias com verificação de senha do admin da loja

---

## Parte 1: Correção do Mapeamento de Categorias

### Diagnóstico
O problema está na lógica de compactação das linhas do CSV. A função `compactAlquimiaRow` remove todas as células vazias, o que pode desalinhar as colunas quando o CSV original tem posições fixas (mesmo com células vazias intermediárias).

### Solução
Manter as posições originais das colunas em vez de compactar, usando os índices corretos do formato Alquimia padrão.

### Arquivos Afetados
- `src/lib/parseAlquimia.ts`

### Mudanças Técnicas
1. Modificar a lógica de parsing para usar índices fixos baseados no cabeçalho detectado
2. Adicionar mapeamento dinâmico de colunas baseado nos headers encontrados
3. Remover a compactação que desalinha as colunas

---

## Parte 2: Exclusão em Massa com Verificação de Senha

### Funcionalidade
- Botão "Limpar Tudo" na página de produtos (somente para store_admin)
- Modal de confirmação com 3 camadas de segurança:
  1. Checkbox de confirmação
  2. Digitar o nome da loja
  3. Digitar a senha do admin para verificação
- Edge Function segura para executar a exclusão no backend

### Fluxo de Segurança
```text
┌─────────────────────────────────────────────────────────────────┐
│                    MODAL DE EXCLUSÃO                            │
├─────────────────────────────────────────────────────────────────┤
│  ⚠️ ATENÇÃO: Esta ação é irreversível!                         │
│                                                                 │
│  Serão excluídos:                                               │
│  • 150 produtos                                                 │
│  • 12 categorias                                                │
│  • Variantes de produtos                                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [  ] Confirmo que desejo excluir TODOS os produtos      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Digite o nome da loja para confirmar:                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Farmácia Exemplo                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Digite sua senha para autorizar:                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ••••••••                                                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Cancelar]                            [🗑️ Excluir Tudo]       │
└─────────────────────────────────────────────────────────────────┘
```

### Arquivos a Criar/Modificar

#### Novos Arquivos
1. **`src/components/admin/products/DeleteAllProductsDialog.tsx`**
   - Modal com confirmação tripla
   - Input para nome da loja
   - Input para senha do admin
   - Contador de produtos/categorias a serem excluídos

2. **`supabase/functions/delete-all-products/index.ts`**
   - Verificação de autenticação (JWT)
   - Verificação de role (store_admin ou master_admin)
   - Verificação de senha via Supabase Auth
   - Exclusão de:
     - `product_variants` (por product_id da loja)
     - `product_addons` (por product_id da loja)
     - `products` (por store_id)
     - `categories` (por store_id)
   - Registro de auditoria

#### Arquivos Modificados
3. **`src/pages/admin/ProductsPage.tsx`**
   - Adicionar botão "Limpar Tudo" no header
   - Importar e usar o novo dialog

### Detalhes Técnicos da Edge Function

```text
POST /delete-all-products
Headers: Authorization: Bearer {jwt}
Body: {
  storeId: string,
  confirmationName: string,
  password: string
}

Fluxo:
1. Validar JWT → extrair user_id
2. Verificar role em user_roles (store_admin + store_id OU master_admin)
3. Validar senha via signInWithPassword
4. Contar e deletar em ordem:
   - product_variants
   - product_addons  
   - products
   - categories
5. Registrar em admin_audit_log
6. Retornar estatísticas de exclusão
```

### Verificação de Senha (Segura no Backend)
A senha é verificada chamando `supabase.auth.signInWithPassword` na Edge Function, garantindo que:
- A senha nunca é armazenada
- Usa a autenticação nativa do Supabase
- Falha imediatamente se a senha estiver errada

---

## Ordem de Implementação

| Ordem | Tarefa | Prioridade |
|-------|--------|------------|
| 1 | Corrigir parsing de categorias no `parseAlquimia.ts` | Alta |
| 2 | Criar Edge Function `delete-all-products` | Alta |
| 3 | Criar componente `DeleteAllProductsDialog.tsx` | Alta |
| 4 | Integrar botão na `ProductsPage.tsx` | Média |
| 5 | Testar fluxo completo | Alta |

---

## Considerações de Segurança

- **Senha verificada no servidor**: Nunca no frontend
- **Role verificada via user_roles**: Não via profile ou localStorage
- **Auditoria**: Toda exclusão é registrada com timestamp e user_id
- **Dupla confirmação**: Nome da loja + senha
- **Scope por loja**: store_admin só pode excluir da própria loja
