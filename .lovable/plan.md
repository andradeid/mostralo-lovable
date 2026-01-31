
# Plano: Unificar os 3 Assistentes em 1 Assistente Dinamico

## Problema Atual

O codigo cria 3 OpenAI Assistants separados:
- `Mostralo Vendas - Mostralo` (asst_8Z0t5NDM4...)
- `Mostralo Recrutamento - Mostralo` (asst_KmUo84ghx...)
- `Mostralo Suporte - Mostralo` (asst_Uu8wACrHq...)

Mas a Evolution API suporta apenas **1 bot ativo por instancia**. Resultado: apenas o ultimo sincronizado funciona.

---

## Solucao: Assistente Unificado Dinamico

Criar **UM UNICO OpenAI Assistant** com:
1. **Todas as tools combinadas** (vendas + recrutamento + suporte)
2. **Tool `identify_intent`** para detectar automaticamente a intencao do usuario
3. **Prompt unificado** com instrucoes para os 3 contextos
4. **Logica dinamica** que responde de acordo com a intencao detectada

---

## Fluxo do Assistente Unificado

```text
Usuario envia mensagem
        ↓
Assistant detecta intencao via "identify_intent"
        ↓
     ┌──────────────┼──────────────┐
     ↓              ↓              ↓
  VENDAS      RECRUTAMENTO     SUPORTE
     ↓              ↓              ↓
get_plans      get_bonus_tiers  search_faq
calculate_     calculate_       get_store_info
savings        commission       get_system_status
     ↓              ↓              ↓
     └──────────────┼──────────────┘
                    ↓
          Resposta contextualizada
```

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/functions/master-bot-sync/index.ts` | Unificar tools e criar 1 assistant |
| `supabase/functions/master-faq-agent/index.ts` | Ja tem todas as funcoes (sem alteracao) |
| Banco de dados | Simplificar para 1 coluna `unified_openai_assistant_id` |

---

## Secao Tecnica

### 1. Tools Unificadas

Combinar todas as tools em um unico array, incluindo `identify_intent`:

```typescript
const UNIFIED_MASTER_TOOLS = [
  // IDENTIFICACAO DE INTENCAO (nova)
  {
    type: 'function',
    function: {
      name: 'identify_intent',
      description: 'Identifica a intencao do usuario para direcionar atendimento',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'Mensagem do usuario' }
        },
        required: ['message']
      }
    }
  },
  
  // VENDAS
  { name: 'get_plans', description: 'Lista planos disponiveis' },
  { name: 'calculate_savings', description: 'Calcula economia vs iFood' },
  { name: 'get_testimonials', description: 'Depoimentos de clientes' },
  { name: 'get_modules', description: 'Modulos da plataforma' },
  
  // RECRUTAMENTO
  { name: 'get_bonus_tiers', description: 'Tiers de bonus vendedores' },
  { name: 'calculate_commission', description: 'Calcula comissao' },
  { name: 'get_recruitment_link', description: 'Link de cadastro parceiros' },
  
  // SUPORTE
  { name: 'search_faq', description: 'Busca FAQs' },
  { name: 'get_store_info', description: 'Info da plataforma' },
  { name: 'get_system_status', description: 'Status dos sistemas' },
];
```

### 2. Prompt Unificado

O prompt sera composto por:

```text
# IDENTIDADE
Voce e o Assistente Virtual Mostralo, capaz de atender:
- VENDAS: Novos lojistas interessados na plataforma
- RECRUTAMENTO: Pessoas interessadas em ser parceiros/vendedores
- SUPORTE: Clientes com duvidas ou problemas

# FLUXO DE ATENDIMENTO
1. SEMPRE use "identify_intent" para detectar a intencao
2. Baseado no resultado, use as tools apropriadas
3. Se intent="sales": use get_plans, calculate_savings, etc
4. Se intent="recruitment": use get_bonus_tiers, calculate_commission
5. Se intent="support": use search_faq, get_store_info

# REGRAS
[Prompt de vendas quando intent=sales]
[Prompt de recrutamento quando intent=recruitment]  
[Prompt de suporte quando intent=support]
```

### 3. Simplificacao do Banco

```sql
-- Remover 3 colunas separadas
ALTER TABLE master_whatsapp_config 
DROP COLUMN IF EXISTS sales_openai_assistant_id,
DROP COLUMN IF EXISTS recruitment_openai_assistant_id,
DROP COLUMN IF EXISTS support_openai_assistant_id;

-- Adicionar 1 coluna unica
ALTER TABLE master_whatsapp_config 
ADD COLUMN IF NOT EXISTS unified_openai_assistant_id TEXT;
```

### 4. Modificacoes no master-bot-sync

**Remover:**
- Loop `for (const bt of botsToSync)`
- Logica separada por tipo de bot
- Criacao de 3 assistants

**Adicionar:**
- Criacao de 1 assistant unificado
- Tools combinadas
- Prompt unificado que inclui os 3 contextos

**Linha-chave (substituir linhas 1009-1328):**
```typescript
// ANTES: Loop criando 3 assistants
for (const bt of botsToSync) { ... }

// DEPOIS: Criar 1 assistant unificado
const unifiedPrompt = buildUnifiedPrompt(config, plansForPrompt, bonusTiers);
const unifiedTools = buildUnifiedTools();
const assistantId = await createOrUpdateUnifiedAssistant(
  unifiedPrompt,
  unifiedTools,
  config.unified_openai_assistant_id
);
```

---

## Exemplo de Conversa com Assistente Unificado

```text
Usuario: "Oi, quero saber sobre os planos"
         ↓
Assistant: identify_intent("Oi, quero saber sobre os planos")
         → { intent: "sales", confidence: 0.9 }
         ↓
Assistant: get_plans()
         → [Basico R$197, Avancado R$397, Premium R$597]
         ↓
Resposta: "Ola! Temos 3 planos incriveis..."

---

Usuario: "Quero trabalhar como vendedor"
         ↓
Assistant: identify_intent("Quero trabalhar como vendedor")
         → { intent: "recruitment", confidence: 0.95 }
         ↓
Assistant: get_bonus_tiers(), calculate_commission()
         ↓
Resposta: "Otimo! Como parceiro Mostralo voce pode ganhar..."

---

Usuario: "Meu pedido nao chegou"
         ↓
Assistant: identify_intent("Meu pedido nao chegou")
         → { intent: "support", confidence: 0.85 }
         ↓
Assistant: search_faq("pedido nao chegou")
         ↓
Resposta: "Entendo sua preocupacao. Vamos verificar..."
```

---

## Ordem de Implementacao

```text
FASE 1: Preparar Tools Unificadas (5 min)
   1.1 Criar array UNIFIED_MASTER_TOOLS combinando todas
   1.2 Adicionar tool identify_intent
   1.3 Remover MASTER_BOT_TOOLS separados

FASE 2: Criar Prompt Unificado (10 min)
   2.1 Criar funcao buildUnifiedPrompt()
   2.2 Incluir secoes para vendas, recrutamento, suporte
   2.3 Adicionar instrucoes de roteamento por intent

FASE 3: Modificar Logica de Criacao (15 min)
   3.1 Remover loop por tipo de bot
   3.2 Criar funcao createOrUpdateUnifiedAssistant()
   3.3 Salvar em unified_openai_assistant_id

FASE 4: Atualizar Banco (2 min)
   4.1 Adicionar coluna unified_openai_assistant_id
   4.2 (Opcional) Remover colunas antigas

FASE 5: Deploy e Teste (10 min)
   5.1 Deploy master-bot-sync
   5.2 Sincronizar bot
   5.3 Testar intents diferentes via WhatsApp
```

---

## Resultado Esperado

| Item | Antes | Depois |
|------|-------|--------|
| OpenAI Assistants | 3 separados | 1 unificado |
| Evolution Bot | Apenas ultimo funciona | Bot unico funciona |
| Contexto | Fixo por bot | Dinamico por intent |
| Tools | Separadas por tipo | Todas disponiveis |
| Banco | 3 colunas assistant_id | 1 coluna unificada |
| Custo OpenAI | 3x assistants | 1x assistant |
