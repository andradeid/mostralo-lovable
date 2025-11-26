# Fluxo de Aprovação de Assinantes

**Data:** 22/11/2025  
**Status:** ✅ Implementado e Funcional

---

## 📋 **Visão Geral**

Sistema completo de aprovação de novos assinantes pelo super admin, com criação automática de invoice e liberação de funcionalidades.

---

## 🔄 **Fluxo Completo do Usuário**

### **1. Cadastro do Novo Assinante**

```
Página: /signup

1. Usuário preenche formulário (4 passos)
   - Dados pessoais
   - Dados da empresa (CPF/CNPJ com validação)
   - Endereço (CEP com máscara)
   - Escolha do plano

2. Sistema cria:
   ✅ Conta no auth.users
   ✅ Profile com approval_status='pending'
   ✅ Loja com status='inactive'
   ✅ Registro em payment_approvals com status='pending'

3. Redireciona para /payment-proof
```

---

### **2. Envio do Comprovante**

```
Página: /payment-proof

1. Exibe dados de pagamento Pix (configurados pelo admin)
2. Usuário faz upload do comprovante
3. Upload para bucket subscription-receipts (público)
4. URL salva em payment_approvals.payment_proof_url
5. Campo de upload desaparece após envio
6. Redireciona para /dashboard/subscription
```

---

### **3. Aguardando Aprovação**

```
Página: /dashboard/subscription

Estado do usuário:
- approval_status: 'pending'
- Loja: inactive
- Menu lateral: APENAS "Minha Assinatura"
- Tentativa de acessar outras páginas: redirect automático

Alerta exibido:
⏳ Ação imediata requerida
Sua assinatura expirou. Pague as mensalidades pendentes para reativar.

Histórico de Mensalidades:
✅ Mostra registro do payment_approval com status "Aguardando"
✅ Botão "Ver Comprovante" disponível
```

---

## 🔑 **Fluxo do Super Admin**

### **Página: /dashboard/subscription-payments**

---

### **1. Visualização de Novos Assinantes**

```
Seção: "Novos Assinantes Pendentes de Aprovação"

Card sempre visível com 3 estados:
1. 🔄 Loading: "Carregando aprovações..."
2. ✅ Empty: "Nenhuma aprovação pendente no momento"
3. 📋 Com Dados: Tabela com assinantes

Tabela exibe:
- Usuário (nome + email)
- Empresa (nome + CNPJ)
- Plano
- Valor
- Data de cadastro
- Comprovante (botão "Ver")
- Ações (Aprovar / Rejeitar)
```

---

### **2. Aprovar Pagamento** ✅

#### **Ação: Clicar em "Aprovar"**

```
1. Abre Dialog de Confirmação
   - Exibe dados do usuário
   - Exibe dados da empresa
   - Exibe plano e valor

2. Ao confirmar "Aprovar Pagamento":
   
   ✅ Executa RPC approve_payment():
      - Atualiza payment_approval.status = 'approved'
      - Atualiza payment_approval.approved_by = admin_user_id
      - Atualiza payment_approval.approved_at = NOW()
      - Atualiza profiles.approval_status = 'approved'
      - Atualiza stores.status = 'active'
      - Define stores.subscription_expires_at (duração do plano)
   
   ✅ Cria Invoice em subscription_invoices:
      - store_id
      - plan_id
      - amount (valor pago)
      - due_date = NOW()
      - paid_at = NOW()
      - payment_status = 'paid'
      - payment_method = 'pix'
      - payment_proof_url (URL do comprovante)
      - pix_key
      - notes = 'Pagamento inicial aprovado pelo admin'
      - approved_at = NOW()
   
   ✅ Recarrega listas:
      - fetchPendingApprovals() - Remove da lista de pendentes
      - fetchInvoices() - Adiciona em "Todas as Faturas"

3. Toast de sucesso:
   "✅ Pagamento aprovado! Loja ativada com sucesso!"

4. Dialog fecha automaticamente
```

#### **Resultado para o Lojista:**

```
✅ approval_status: 'approved'
✅ Loja: 'active'
✅ Menu lateral: COMPLETO (todos os itens aparecem)
✅ Acesso liberado para:
   - Dashboard
   - Pedidos
   - Clientes
   - Produtos
   - Categorias
   - Adicionais
   - Banners
   - Promoções
   - Entregadores
   - Relatórios
   - Configurações
   - etc.

✅ Histórico de Mensalidades:
   - Aparece invoice com status "Paga" ✅
   - Data de pagamento
   - Comprovante disponível
```

---

### **3. Rejeitar Pagamento** ❌

#### **Ação: Clicar em "Rejeitar"**

```
1. Abre Dialog de Rejeição
   - Exibe dados do usuário
   - Exibe empresa e valor
   
2. Campo "Motivo da Rejeição" *
   ⚠️ OBRIGATÓRIO - Mínimo 10 caracteres
   
   Validações:
   - Campo required
   - Borda vermelha se < 10 caracteres
   - Contador em tempo real: "Mínimo 10 caracteres (5/10)"
   - Placeholder com exemplos:
     "Ex: Comprovante ilegível, valor incorreto, 
      dados bancários não conferem, etc."
   
   Alerta:
   ⚠️ O usuário será notificado sobre a rejeição e 
      poderá enviar um novo comprovante.

3. Ao tentar confirmar sem motivo adequado:
   ❌ Toast: "Por favor, informe um motivo detalhado 
            para a rejeição (mínimo 10 caracteres)"
   
4. Ao confirmar com motivo válido:
   
   ✅ Executa RPC reject_payment():
      - Atualiza payment_approval.status = 'rejected'
      - Atualiza payment_approval.rejection_reason = motivo
      - Mantém profiles.approval_status = 'pending'
      - Mantém stores.status = 'inactive'
   
   ✅ Recarrega lista:
      - fetchPendingApprovals() - Remove da lista de pendentes

5. Toast:
   "❌ Pagamento rejeitado. O usuário foi notificado."

6. Dialog fecha automaticamente
7. Campo de motivo é limpo
```

#### **Resultado para o Lojista:**

```
❌ approval_status: 'pending'
❌ Loja: 'inactive'
❌ Menu lateral: APENAS "Minha Assinatura"

Alerta exibido:
⏰ Pagamento Rejeitado
Seu pagamento foi rejeitado.
Motivo: [motivo informado pelo admin]

Botões disponíveis:
- "Enviar Novo Comprovante"
- "Reenviar Comprovante"

Histórico de Mensalidades:
✅ Mostra registro com status "Rejeitado" ❌
✅ Botão "Ver Motivo" disponível (mostra o motivo)
✅ Opção de enviar novo comprovante
```

---

## 📊 **Tabela "Todas as Faturas"**

### **Quando Invoice Aparece:**

Após aprovação, o invoice aparece com:

| Campo | Valor |
|-------|-------|
| Loja | Nome da loja aprovada |
| Lojista | Nome + email do proprietário |
| Plano | Nome do plano contratado |
| Vencimento | Data atual |
| Valor | Valor pago |
| Status | ✅ Paga (badge verde) |
| Ações | "Ver" (detalhes), "Ver Comprovante" |

---

## 🔒 **Segurança e Controle**

### **RLS Policies:**

```sql
-- payment_approvals
✅ Master admins podem ver todas as aprovações (SELECT)
✅ Master admins podem atualizar aprovações (UPDATE)
✅ Master admins podem deletar aprovações (DELETE)
✅ Usuários podem ver apenas suas próprias aprovações (SELECT)
✅ Usuários podem criar aprovações (INSERT)
✅ Usuários podem atualizar suas aprovações pendentes (UPDATE)

-- subscription_invoices
✅ Master admins podem CRUD completo
✅ Store admins podem ver apenas invoices da própria loja
✅ Invoices criadas automaticamente via código

-- stores
✅ Apenas master admins podem alterar status
✅ Store admins podem atualizar própria loja (dados, não status)

-- profiles
✅ Apenas master admins podem alterar approval_status
✅ Usuários podem atualizar próprio perfil (dados, não approval)
```

---

## 📝 **Arquivos Modificados**

### **Frontend:**

1. **`.mostralo/src/pages/admin/SubscriptionPaymentsManagementPage.tsx`**
   - `handleApprovePayment()` - Criação de invoice + recarregamento
   - `handleRejectPayment()` - Validação de motivo obrigatório
   - `fetchPendingApprovals()` - Queries manuais sem joins
   - Dialog de aprovação
   - Dialog de rejeição com validação

2. **`.mostralo/src/pages/admin/SubscriptionPage.tsx`**
   - Exibição de payment_approvals no histórico
   - Alertas de status (pending/rejected)
   - Opções de reenvio de comprovante

3. **`.mostralo/src/components/admin/AdminSidebar.tsx`**
   - Lógica de menu restrito para pendentes/rejeitados

4. **`.mostralo/src/components/admin/AdminLayout.tsx`**
   - Redirect automático para /dashboard/subscription

---

### **Backend (Supabase):**

1. **RPCs Existentes:**
   - `approve_payment(approval_id, admin_user_id)` ✅
   - `reject_payment(approval_id, admin_user_id, reason)` ✅

2. **Tabelas:**
   - `payment_approvals` (status: pending/approved/rejected)
   - `subscription_invoices` (faturas pagas)
   - `profiles` (approval_status)
   - `stores` (status, subscription_expires_at)
   - `plans` (duration_days)

---

## 🧪 **Como Testar**

### **Teste 1: Fluxo Completo de Aprovação**

```
1. Criar conta em /signup
2. Enviar comprovante
3. Login como super admin
4. Acessar /dashboard/subscription-payments
5. Ver assinante na seção de pendentes
6. Clicar "Ver" comprovante
7. Clicar "Aprovar"
8. Confirmar aprovação
9. Verificar que apareceu em "Todas as Faturas"
10. Fazer login com o lojista
11. Verificar menu completo liberado
12. Acessar outras páginas livremente
```

### **Teste 2: Fluxo de Rejeição**

```
1. Criar conta em /signup
2. Enviar comprovante
3. Login como super admin
4. Acessar /dashboard/subscription-payments
5. Clicar "Rejeitar"
6. Tentar enviar sem motivo - deve bloquear
7. Tentar com motivo < 10 chars - deve bloquear
8. Informar motivo válido (>= 10 chars)
9. Confirmar rejeição
10. Fazer login com o lojista
11. Ver alerta de rejeição com motivo
12. Verificar que menu está restrito
13. Ver histórico com status "Rejeitado"
14. Clicar "Ver Motivo" - ver motivo do admin
```

---

## ✅ **Status Final**

```
✅ Aprovação cria invoice automaticamente
✅ Invoice aparece em "Todas as Faturas"
✅ Lojista tem acesso completo após aprovação
✅ Rejeição exige motivo obrigatório (>= 10 chars)
✅ Contador de caracteres em tempo real
✅ Validação antes de enviar
✅ Usuário notificado do motivo
✅ Todas as listas recarregam corretamente
✅ Zero erros de linting
✅ 100% funcional
```

---

**Última Atualização:** 22/11/2025 às 02:30  
**Desenvolvedor:** Cursor AI Assistant  
**Status:** ✅ **PROD READY**

