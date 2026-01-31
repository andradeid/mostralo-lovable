

# Plano: Bot Tipo Assistant + Destaque Visual das Abas

## Resumo dos Problemas

1. **Tipo de Bot Incorreto**: O `master-bot-sync` usa `botType: 'chatCompletion'` que NAO suporta function calling
2. **Falta OpenAI Assistant**: O bot das lojas cria um Assistant na OpenAI com tools, o master nao faz isso
3. **Falta Function URL**: O bot das lojas tem URL para processar chamadas de funcao
4. **Abas sem Destaque**: Usuario nao consegue ver qual aba esta selecionada

---

## PARTE 1: Corrigir Tipo de Bot

### Comparacao: Bot das Lojas vs Master

| Caracteristica | openai-bot-sync (Lojas) | master-bot-sync (Atual) |
|----------------|-------------------------|-------------------------|
| botType | `assistant` | `chatCompletion` |
| OpenAI Assistant | Cria via API | NAO cria |
| assistantId | Inclui no payload | NAO tem |
| functionUrl | Inclui no payload | NAO tem |
| Tools/Functions | 7 funcoes de produto | NAO tem |
| FAQ Dinamico | Funciona | NAO funciona |

### Fluxo do Bot das Lojas (Modelo a Seguir)

```text
1. Recebe config do frontend
        ↓
2. Cria OpenAI Assistant via api.openai.com/v1/assistants
   - Com tools: search_products, check_stock, get_promotions, etc
   - Recebe assistantId
        ↓
3. Monta payload para Evolution API
   - botType: 'assistant'
   - assistantId: do passo 2
   - functionUrl: URL da edge function que processa tools
        ↓
4. Envia para Evolution /openai/create/{instance}
        ↓
5. Quando usuario manda mensagem:
   - Evolution chama OpenAI Assistant
   - Se Assistant precisa de dados, chama functionUrl
   - functionUrl executa e retorna dados
   - Assistant responde com dados reais
```

### Solucao para Master

Seguir o MESMO fluxo do bot das lojas, adaptando para os bots master:

| Bot | Tools Necessarias |
|-----|-------------------|
| Vendas | get_plans, calculate_savings, get_testimonials |
| Recrutamento | get_bonus_tiers, get_plans, calculate_commission |
| Suporte | search_faq, get_store_info, get_system_status |

---

## PARTE 2: Arquivos a Criar/Modificar

### Criar: Edge Function para Processar Tools

**Arquivo:** `supabase/functions/master-faq-agent/index.ts`

Funcao que recebe chamadas de tools do OpenAI Assistant e retorna dados do banco:

| Tool | Descricao | Dados |
|------|-----------|-------|
| get_plans | Lista planos disponiveis | Tabela plans |
| get_bonus_tiers | Lista tiers de bonus | Tabela affiliate_bonus_tiers |
| search_faq | Busca FAQs | Tabela master_bot_faqs |
| get_system_status | Status do sistema | Uptime, versao |

### Modificar: master-bot-sync/index.ts

| Linha | De | Para |
|-------|----|----|
| 960 | `botType: 'chatCompletion'` | `botType: 'assistant'` |
| Nova | - | Criar OpenAI Assistant via API |
| Nova | - | Adicionar `assistantId` ao payload |
| Nova | - | Adicionar `functionUrl` ao payload |

### Modificar: src/components/ui/tabs.tsx

| Linha | De | Para |
|-------|----|----|
| 30 | `data-[state=active]:bg-background data-[state=active]:text-foreground` | `data-[state=active]:bg-orange-500 data-[state=active]:text-white` |

---

## PARTE 3: Detalhamento Tecnico

### 3.1 OpenAI Assistant Tools para Master

```typescript
const masterTools = [
  {
    type: 'function',
    function: {
      name: 'get_plans',
      description: 'Retorna lista de planos disponiveis com precos atualizados',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_bonus_tiers',
      description: 'Retorna tiers de bonus para vendedores',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_faq',
      description: 'Busca perguntas frequentes',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Termo de busca' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'calculate_savings',
      description: 'Calcula economia vs iFood baseado no faturamento',
      parameters: {
        type: 'object',
        properties: {
          revenue: { type: 'number', description: 'Faturamento mensal' },
          plan_id: { type: 'string', description: 'ID do plano' }
        },
        required: ['revenue']
      }
    }
  }
];
```

### 3.2 Payload Atualizado para Evolution

```typescript
const botPayload = {
  enabled: true,
  openaiCredsId: openaiCredsId,
  botType: 'assistant',  // MUDANCA: era chatCompletion
  model: config.openai_model || 'gpt-4o-mini',
  maxTokens: 1000,
  systemMessages: [prompt],
  assistantMessages: [...],
  assistantId: openaiAssistantId,  // NOVO: ID do Assistant criado
  functionUrl: `${supabaseUrl}/functions/v1/master-faq-agent`,  // NOVO
  // ... resto igual
};
```

### 3.3 Estilo das Abas

```typescript
// De (atual):
"data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"

// Para (novo):
"data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm"
```

---

## PARTE 4: Arquivos Afetados

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `supabase/functions/master-faq-agent/index.ts` | CRIAR | Edge function para processar tools |
| `supabase/functions/master-bot-sync/index.ts` | MODIFICAR | Adicionar criacao de OpenAI Assistant |
| `supabase/config.toml` | MODIFICAR | Registrar master-faq-agent |
| `src/components/ui/tabs.tsx` | MODIFICAR | Adicionar destaque laranja |
| `master_whatsapp_config` | ADICIONAR COLUNA | `openai_assistant_id` para cada bot |

### Colunas Novas no Banco (se necessario)

```sql
ALTER TABLE master_whatsapp_config ADD COLUMN IF NOT EXISTS
  sales_openai_assistant_id TEXT,
  recruitment_openai_assistant_id TEXT,
  support_openai_assistant_id TEXT;
```

---

## PARTE 5: Ordem de Implementacao

```text
FASE 1: Estilo Visual (5 min)
   1.1 Modificar tabs.tsx com destaque laranja
   1.2 Testar visualizacao

FASE 2: Edge Function (15 min)
   2.1 Criar master-faq-agent/index.ts
   2.2 Implementar handlers para tools
   2.3 Registrar no config.toml
   2.4 Deploy

FASE 3: Atualizar master-bot-sync (20 min)
   3.1 Adicionar criacao de OpenAI Assistant
   3.2 Definir tools por tipo de bot
   3.3 Atualizar botPayload
   3.4 Salvar assistantId no banco
   3.5 Deploy

FASE 4: Testes (10 min)
   4.1 Sincronizar bot de vendas
   4.2 Verificar se Assistant foi criado na OpenAI
   4.3 Testar function calling via WhatsApp
```

---

## Resultado Esperado

| Item | Antes | Depois |
|------|-------|--------|
| Tipo de bot | chatCompletion | assistant |
| Function calling | NAO funciona | Funciona |
| FAQ dinamico | NAO funciona | Consulta banco em tempo real |
| Abas ativas | Fundo branco | Fundo laranja #f97316 |
| Assistente OpenAI | Nao existe | Criado automaticamente |

