
## Plano: Adicionar Seleção de Fontes na Importação de Receitas

### Objetivo
Permitir que o Master Admin escolha quais tipos de receitas deseja importar (Assinaturas, Faturas Externas, Approvals) ao clicar em "Importar receitas". Isso é útil durante a fase de validação para evitar importar dados de teste.

### Alterações Planejadas

#### 1. Atualizar o Diálogo de Importação (Frontend)

**Arquivo:** `src/components/admin/financial/SystemRevenueImportDialog.tsx`

Adicionar checkboxes para cada fonte de dados:
- Assinaturas (subscription_invoices)
- Faturas Externas (external_invoices)  
- Approvals (payment_approvals)

```text
┌─────────────────────────────────────────────────┐
│ Importar receitas automáticas                   │
├─────────────────────────────────────────────────┤
│                                                 │
│ Data inicial: [__________]  Data final: [____]  │
│                                                 │
│ ┌─── Fontes de receita ────────────────────┐   │
│ │ ☑ Assinaturas (pagamentos de planos)     │   │
│ │ ☑ Faturas externas (clientes externos)   │   │
│ │ ☑ Approvals (comprovantes aprovados)     │   │
│ └──────────────────────────────────────────┘   │
│                                                 │
│ ┌─── Simular (dry run) ────────────────────┐   │
│ │ Não grava no banco...            [toggle]│   │
│ └──────────────────────────────────────────┘   │
│                                                 │
│            [Cancelar]  [Importar receitas]      │
└─────────────────────────────────────────────────┘
```

**Mudanças:**
- Adicionar estado `sources` como objeto com 3 booleanos
- Renderizar 3 checkboxes com ícones visuais
- Validar que pelo menos 1 fonte está selecionada
- Passar `sources` para o hook

#### 2. Atualizar o Hook de Importação

**Arquivo:** `src/hooks/useSystemFinanceImportRevenue.ts`

- Adicionar novo parâmetro `sources` na interface `ImportRevenueParams`
- Passar as fontes selecionadas para a Edge Function

```typescript
export interface ImportRevenueParams {
  startDate?: string;
  endDate?: string;
  dryRun?: boolean;
  sources?: {
    subscription_invoices?: boolean;
    external_invoices?: boolean;
    payment_approvals?: boolean;
  };
}
```

#### 3. Atualizar a Edge Function

**Arquivo:** `supabase/functions/system-finance-import-revenue/index.ts`

- Receber o parâmetro `sources` no payload
- Condicionar as queries de cada fonte baseado na seleção
- Manter compatibilidade retroativa (se `sources` não vier, importar tudo)

**Lógica:**
```typescript
const sources = payload.sources ?? {
  subscription_invoices: true,
  external_invoices: true,
  payment_approvals: true,
};

// Só buscar cada fonte se estiver habilitada
if (sources.subscription_invoices) {
  // query subscription_invoices
}
if (sources.external_invoices) {
  // query external_invoices
}
if (sources.payment_approvals) {
  // query payment_approvals
}
```

### Detalhes Técnicos

| Componente | Alteração |
|------------|-----------|
| `SystemRevenueImportDialog.tsx` | +40 linhas (checkboxes + estado) |
| `useSystemFinanceImportRevenue.ts` | +5 linhas (interface) |
| `system-finance-import-revenue/index.ts` | +20 linhas (lógica condicional) |

### Comportamento Esperado

1. Ao abrir o diálogo, todas as 3 fontes vêm marcadas por padrão
2. O usuário pode desmarcar qualquer fonte que não deseja importar
3. O botão "Importar" fica desabilitado se nenhuma fonte estiver selecionada
4. A simulação (dry run) também respeita as fontes selecionadas
5. O resultado mostra apenas as fontes que foram processadas

### Deploy

Após as alterações, a Edge Function `system-finance-import-revenue` será redeployada automaticamente.
