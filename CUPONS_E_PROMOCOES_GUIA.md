# 🎫 Guia Completo - Cupons e Promoções de Planos

## ✅ Ajustes Implementados

### 1. **Banner de Cupons na Home** ✅
- **Componente:** `PromotionBanner`
- **Localização:** Topo da home (logo após o header)
- **Funciona automaticamente:** Busca cupons públicos do banco

### 2. **Promoção de Planos nos Cards** ✅
- **Exibição:** Preço riscado + novo preço + desconto
- **Badge:** Porcentagem OFF
- **Economia:** Cálculo automático
- **Localização:** Seção de planos na home

---

## 🎯 Como Criar um Cupom que Aparece na Home

### Passo a Passo:

1. **Acesse o Admin:**
   - Login: `marcos@setupdigital.com.br`
   - Menu: **Sistema** → **Cupons**

2. **Clique em "Criar Cupom"**

3. **Preencha os Campos:**

   | Campo | Valor | Obrigatório |
   |-------|-------|-------------|
   | Código | Ex: `BLACK90` | ✅ Sim |
   | Tipo de Desconto | Porcentagem ou Fixo | ✅ Sim |
   | Valor do Desconto | Ex: `90` (para 90% OFF) | ✅ Sim |
   | Limite Total de Usos | Ex: `100` ou deixe vazio | ❌ Não |
   | Usos por Usuário | Ex: `1` | ❌ Não |
   | Data de Início | Agora | ✅ Sim |
   | Data de Término | Ex: 30 dias | ✅ Sim |
   | **Exibir Publicamente** | **ON** ⚠️ | ✅ **SIM** |

4. **Salvar**

5. **Resultado:**
   - Banner aparece automaticamente na home
   - Contador regressivo até a data de término
   - Código do cupom visível para copiar

---

## 💰 Como Criar Promoção de Plano

### Passo a Passo:

1. **Acesse o Admin:**
   - Menu: **Financeiro** → **Planos**

2. **Clique em "Editar"** no plano desejado

3. **Role até "Promoção"**

4. **Ative a Promoção:**
   - Toggle **"Ativar Promoção"** = **ON**

5. **Preencha os Campos:**

   | Campo | Valor | Obrigatório |
   |-------|-------|-------------|
   | Preço com Desconto | Ex: `597` (se o original é `997`) | ✅ Sim |
   | Desconto (%) | **Calculado automaticamente** | ✅ Sim |
   | Data de Início | Agora | ✅ Sim |
   | Data de Término | Ex: 30 dias | ✅ Sim |
   | Texto da Promoção | Ex: `OFERTA LIMITADA` | ❌ Não |

6. **Salvar**

7. **Resultado no Card:**
   ```
   ┌────────────────────────────┐
   │  Premium                   │
   │                            │
   │  [40% OFF]                 │ ← Badge verde
   │                            │
   │  R$ 997,00                 │ ← Preço riscado
   │                            │
   │  R$ 597,00                 │ ← Preço com desconto
   │                            │
   │  Economize R$ 400,00       │ ← Economia
   │  /mês                      │
   │                            │
   │  [ Começar Agora ]         │
   └────────────────────────────┘
   ```

---

## 📋 Checklist - Cupom Não Aparece?

Se o cupom não aparecer na home, verifique:

- [ ] **Exibir Publicamente** está **ON**
- [ ] **Data de Início** é anterior ou igual a hoje
- [ ] **Data de Término** é posterior ou igual a hoje
- [ ] **Limite de Usos** não foi atingido (ou está vazio)
- [ ] **Código do cupom** não está duplicado

---

## 📋 Checklist - Promoção de Plano Não Aparece?

Se a promoção não aparecer no card:

- [ ] **Ativar Promoção** está **ON**
- [ ] **Preço com Desconto** foi preenchido
- [ ] **Desconto (%)** foi calculado
- [ ] **Data de Início** é anterior ou igual a hoje
- [ ] **Data de Término** é posterior ou igual a hoje
- [ ] **Status do Plano** está **Ativo**

---

## 🔍 Teste Visual Rápido

1. **Home:**
   ```
   http://localhost:5173
   ```

2. **Recarregue:**
   ```
   Ctrl + Shift + R
   ```

3. **Deve Aparecer:**
   - Banner de cupom (se criou cupom público)
   - Contador regressivo
   - Planos com promoção (se ativou)

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `coupons`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `code` | text | Código do cupom (ex: BLACK90) |
| `discount_type` | text | `percentage` ou `fixed` |
| `discount_value` | numeric | Valor do desconto |
| `is_public` | boolean | **TRUE para aparecer na home** |
| `valid_from` | timestamp | Data de início |
| `valid_until` | timestamp | Data de término |
| `max_uses` | integer | Limite de usos (NULL = ilimitado) |

### Tabela: `plans`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `price` | numeric | Preço original |
| `promotion_active` | boolean | **TRUE para aparecer promoção** |
| `discount_price` | numeric | Preço com desconto |
| `discount_percentage` | integer | Porcentagem calculada |
| `promotion_start_date` | timestamp | Data de início |
| `promotion_end_date` | timestamp | Data de término |
| `status` | enum | `active` ou `inactive` |

---

## 🎨 Componentes Envolvidos

### 1. **PromotionBanner** (`src/components/coupons/PromotionBanner.tsx`)
- Busca cupons públicos (`is_public = true`)
- Filtra por datas válidas
- Exibe contador regressivo
- Botão para copiar código

### 2. **CountdownTimer** (`src/components/coupons/CountdownTimer.tsx`)
- Contador regressivo em tempo real
- Atualiza a cada segundo
- Formata: "X dias Y horas Z min W seg"

### 3. **Index.tsx** (`src/pages/Index.tsx`)
- Página pública principal
- Busca planos ativos do banco
- Verifica `promotion_active` de cada plano
- Exibe preço com desconto ou normal

---

## 🚀 Próximos Passos

- [ ] **Integrar cupons no checkout** (pendente)
- [ ] Testar aplicação de cupons em assinaturas
- [ ] Adicionar validação de cupons na finalização

---

## 📞 Suporte

Se algo não funcionar:

1. Verifique os checklists acima
2. Recarregue a página com `Ctrl + Shift + R`
3. Verifique o console do navegador (F12)
4. Entre em contato com o suporte técnico

---

**Data da última atualização:** 25/11/2025
**Versão:** 1.0

