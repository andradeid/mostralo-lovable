# 📅 Ciclos de Cobrança dos Planos

## 📋 **Resumo**

Sistema completo de ciclos de cobrança para planos de assinatura, incluindo enum no banco de dados, interface de edição atualizada e cálculo automático de vencimento.

---

## 🗂️ **Enum `billing_cycle_type`**

### Valores Disponíveis

| Valor | Tradução PT-BR | Duração | Descrição |
|-------|---------------|---------|-----------|
| `monthly` | Mensal | 30 dias | Cobrança mensal |
| `quarterly` | Trimestral | 90 dias | Cobrança a cada 3 meses |
| `biannual` | Semestral | 180 dias | Cobrança a cada 6 meses |
| `annual` | Anual | 365 dias | Cobrança anual |

### Criação do Enum

```sql
-- Migration: add_billing_cycle_enum_v2.sql
CREATE TYPE billing_cycle_type AS ENUM (
  'monthly',
  'quarterly',
  'biannual',
  'annual'
);

ALTER TABLE plans 
  ALTER COLUMN billing_cycle TYPE billing_cycle_type 
  USING billing_cycle::billing_cycle_type;

ALTER TABLE plans 
  ALTER COLUMN billing_cycle SET DEFAULT 'monthly'::billing_cycle_type;
```

---

## 🎨 **Interface de Edição de Planos**

### PlansPage.tsx - Funções Helper

```typescript
// Tradução PT-BR
const getBillingCycleLabel = (cycle: string) => {
  const labels: Record<string, string> = {
    'monthly': 'Mensal',
    'quarterly': 'Trimestral',
    'biannual': 'Semestral',
    'annual': 'Anual',
    'yearly': 'Anual', // backward compatibility
  };
  return labels[cycle] || cycle;
};

// Duração em dias
const getBillingCycleDays = (cycle: string) => {
  const days: Record<string, number> = {
    'monthly': 30,
    'quarterly': 90,
    'biannual': 180,
    'annual': 365,
    'yearly': 365, // backward compatibility
  };
  return days[cycle] || 30;
};
```

### Select Component

```tsx
<div className="space-y-2">
  <Label htmlFor="billing_cycle">Ciclo de Cobrança *</Label>
  <Select
    value={formData.billing_cycle}
    onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}
  >
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="monthly">Mensal (30 dias)</SelectItem>
      <SelectItem value="quarterly">Trimestral (90 dias)</SelectItem>
      <SelectItem value="biannual">Semestral (180 dias)</SelectItem>
      <SelectItem value="annual">Anual (365 dias)</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Exibição nos Cards

```tsx
<p className="text-sm text-muted-foreground">
  {getBillingCycleLabel(plan.billing_cycle)} - {getBillingCycleDays(plan.billing_cycle)} dias
</p>
```

---

## ⚙️ **Função RPC `approve_payment`**

### Cálculo Automático de Vencimento

```sql
-- Buscar billing_cycle do plano
SELECT billing_cycle INTO plan_billing_cycle
FROM public.plans p
JOIN public.payment_approvals pa ON pa.plan_id = p.id
WHERE pa.id = approval_id;

-- Calcular dias baseado no billing_cycle
expiration_days := CASE plan_billing_cycle
  WHEN 'monthly' THEN 30
  WHEN 'quarterly' THEN 90
  WHEN 'biannual' THEN 180
  WHEN 'annual' THEN 365
  ELSE 30 -- Default para mensal
END;

-- Aplicar no store
UPDATE public.stores
SET 
  status = 'active',
  subscription_expires_at = NOW() + INTERVAL '1 day' * expiration_days
WHERE id = target_store_id;
```

---

## 🔄 **Fluxo Completo**

### 1. Super Admin Edita Plano

```
1. Acessa /dashboard/plans
2. Clica em "Editar" no plano
3. Seleciona o "Ciclo de Cobrança"
   ├─ Mensal (30 dias)
   ├─ Trimestral (90 dias)
   ├─ Semestral (180 dias)
   └─ Anual (365 dias)
4. Salva o plano
```

### 2. Novo Usuário Se Cadastra

```
1. Escolhe o plano na página de cadastro
2. Plano mostra: "R$ 197,00 - Mensal - 30 dias"
3. Completa cadastro
4. Envia comprovante
```

### 3. Super Admin Aprova

```
1. Acessa /dashboard/subscription-payments
2. Vê "Novos Assinantes Pendentes"
3. Clica em "Aprovar"
4. Sistema executa:
   ├─ Busca o plano do usuário
   ├─ Identifica billing_cycle: "monthly"
   ├─ Calcula: 30 dias
   └─ Define: subscription_expires_at = HOJE + 30 dias
```

### 4. Resultado

```
✅ Store ativada
✅ Vencimento: 22/12/2025 (se aprovado hoje: 22/11/2025)
✅ Invoice criada
✅ Menu liberado para o lojista
```

---

## 🧪 **Como Testar**

### Teste 1: Editar Plano

```
1. Login como master_admin
2. /dashboard/plans
3. Editar "Plano Básico"
4. Ciclo de Cobrança: Trimestral (90 dias)
5. Salvar Plano
6. ✅ Deve salvar sem erros
```

### Teste 2: Aprovar Novo Assinante

```
1. Login como master_admin
2. /dashboard/subscription-payments
3. Ver assinante pendente
4. Clicar em "Aprovar"
5. ✅ Deve aprovar sem erros
6. Verificar vencimento: HOJE + 90 dias
```

### Teste 3: Verificar Vencimento

```sql
-- No Supabase SQL Editor
SELECT 
  s.name AS loja,
  s.subscription_expires_at AS vencimento,
  s.status,
  p.name AS plano,
  p.billing_cycle,
  EXTRACT(DAY FROM (s.subscription_expires_at - s.created_at)) AS dias_calculados
FROM stores s
JOIN plans p ON s.plan_id = p.id
WHERE s.subscription_expires_at IS NOT NULL
ORDER BY s.subscription_expires_at DESC
LIMIT 10;
```

**Resultado Esperado:**

| loja | vencimento | status | plano | billing_cycle | dias_calculados |
|------|-----------|--------|-------|--------------|----------------|
| Loja 005 | 2025-12-22 | active | Básico | monthly | 30 |
| Loja 004 | 2026-02-20 | active | Pro | quarterly | 90 |

---

## 🐛 **Troubleshooting**

### Erro: `column "duration_days" does not exist`

**Causa:** Função RPC ainda usa coluna antiga.

**Solução:** Já corrigida na migration `fix_approve_payment_billing_cycle.sql`.

### Erro: Select não mostra todas as opções

**Causa:** PlansPage.tsx não atualizado.

**Solução:** Código já atualizado com 4 opções (monthly, quarterly, biannual, annual).

### Vencimento errado

**Causa:** Plano sem billing_cycle ou com valor inválido.

**Verificação:**

```sql
SELECT id, name, billing_cycle 
FROM plans 
WHERE billing_cycle NOT IN ('monthly', 'quarterly', 'biannual', 'annual');
```

**Correção:**

```sql
UPDATE plans 
SET billing_cycle = 'monthly' 
WHERE billing_cycle IS NULL OR billing_cycle NOT IN ('monthly', 'quarterly', 'biannual', 'annual');
```

---

## 📊 **Exemplos de Cálculo**

### Plano Mensal

```
Plano: Básico
Billing Cycle: monthly
Aprovação: 22/11/2025
Vencimento: 22/12/2025 (30 dias depois)
```

### Plano Trimestral

```
Plano: Pro
Billing Cycle: quarterly
Aprovação: 22/11/2025
Vencimento: 20/02/2026 (90 dias depois)
```

### Plano Semestral

```
Plano: Premium
Billing Cycle: biannual
Aprovação: 22/11/2025
Vencimento: 21/05/2026 (180 dias depois)
```

### Plano Anual

```
Plano: Enterprise
Billing Cycle: annual
Aprovação: 22/11/2025
Vencimento: 22/11/2026 (365 dias depois)
```

---

## 🔗 **Arquivos Relacionados**

### Frontend

- **`src/pages/admin/PlansPage.tsx`**: Interface de edição de planos
- **`src/pages/SignUp.tsx`**: Seleção de plano no cadastro
- **`src/pages/admin/SubscriptionPaymentsManagementPage.tsx`**: Aprovação de pagamentos

### Backend

- **`supabase/migrations/*_add_billing_cycle_enum_v2.sql`**: Criação do enum
- **`supabase/migrations/*_fix_approve_payment_billing_cycle.sql`**: Correção da função RPC

### Banco de Dados

- **Tabela**: `plans`
  - Coluna: `billing_cycle` (tipo: `billing_cycle_type`)
- **Função**: `approve_payment(approval_id, admin_user_id)`

---

## ✅ **Status da Implementação**

| Componente | Status | Observações |
|-----------|--------|-------------|
| Enum `billing_cycle_type` | ✅ Criado | 4 opções: monthly, quarterly, biannual, annual |
| Coluna `plans.billing_cycle` | ✅ Atualizado | Tipo alterado para enum |
| PlansPage.tsx | ✅ Atualizado | Select com 4 opções + traduções |
| Função `approve_payment` | ✅ Corrigida | Usa billing_cycle para calcular dias |
| Testes | ✅ Funcionando | Vencimento calculado corretamente |

---

## 📚 **Documentação Adicional**

- [FLUXO_APROVACAO_ASSINANTES.md](./FLUXO_APROVACAO_ASSINANTES.md) - Fluxo completo de aprovação
- [GUIAS_E_DOCS.md](./GUIAS_E_DOCS.md) - Índice de toda documentação
- [README.md](./README.md) - Visão geral do projeto

---

**Última atualização:** 22/11/2025  
**Versão:** 1.0

