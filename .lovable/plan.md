

# Plano Completo: AI Vision Plus + Monitoramento de Custos OpenAI

## Visao Geral

Implementar duas funcionalidades integradas ao Assistente Inteligente v2 existente:

1. **Modulo AI Vision Plus** - Interpretar imagens de qualquer segmento
2. **Sistema de Custos OpenAI** - Visivel apenas para Master Admin

---

## Parte 1: Tabela de Tracking de Uso (Banco de Dados)

### 1.1 Criar tabela `openai_usage_logs`

```sql
CREATE TABLE openai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
  
  usage_type VARCHAR(20) NOT NULL DEFAULT 'text',
  model VARCHAR(50) NOT NULL,
  estimated_cost_cents INTEGER NOT NULL DEFAULT 0,
  
  message_type VARCHAR(50),
  metadata JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_openai_usage_store_date ON openai_usage_logs(store_id, created_at DESC);
CREATE INDEX idx_openai_usage_type ON openai_usage_logs(usage_type);

ALTER TABLE openai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON openai_usage_logs FOR ALL USING (true);
```

### 1.2 Criar modulo `ai_vision` na tabela `modules`

```sql
INSERT INTO modules (key, name, description, base_price, is_active)
VALUES (
  'ai_vision',
  'Visao por IA (Plus)',
  'Permite ao assistente interpretar imagens enviadas pelos clientes (fotos de produtos, receitas, embalagens)',
  99.00,
  true
);
```

---

## Parte 2: Modificar Webhook para Detectar Imagens

### Arquivo: `supabase/functions/whatsapp-webhook/index.ts`

**Adicionar deteccao de mensagem com imagem:**

```typescript
// Apos linha 183 (apos receber body)
const message = body.data;

// Detectar tipo de mensagem
const messageType = message.messageType || message.type;
const hasImage = messageType === 'imageMessage' || 
                 Boolean(message.message?.imageMessage) ||
                 Boolean(message.mediaUrl);

let imageData = null;
if (hasImage) {
  imageData = {
    url: message.mediaUrl || message.message?.imageMessage?.url,
    base64: message.base64 || message.message?.imageMessage?.base64,
    caption: message.message?.imageMessage?.caption || '',
    mimetype: message.message?.imageMessage?.mimetype || 'image/jpeg'
  };
  console.log('🖼️ Imagem detectada:', imageData.mimetype);
}

// Passar para product-search-agent (via Evolution API ou chamar diretamente)
```

---

## Parte 3: Modificar product-search-agent para Processar Imagens

### Arquivo: `supabase/functions/product-search-agent/index.ts`

**Adicionar nova funcao `analyze_image`:**

```typescript
// Nova tool para o assistente
{
  type: 'function',
  function: {
    name: 'analyze_image',
    description: 'Analisa uma imagem enviada pelo cliente para identificar produtos.',
    parameters: {
      type: 'object',
      properties: {
        image_context: { type: 'string', description: 'Descricao ou contexto da imagem' }
      }
    }
  }
}
```

**Adicionar handler para imagens:**

```typescript
// Quando funcao 'analyze_image' for chamada
if (functionName === 'analyze_image' && imageData) {
  // Verificar se loja tem modulo ai_vision
  const { data: visionAccess } = await supabase
    .from('store_modules')
    .select('is_enabled, modules!inner(key)')
    .eq('store_id', storeId)
    .eq('modules.key', 'ai_vision')
    .single();

  if (!visionAccess?.is_enabled) {
    return { error: 'Modulo de Visao nao habilitado para esta loja' };
  }

  // Processar imagem com GPT-4o Vision
  const visionResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${imageData.mimetype};base64,${imageData.base64}` } },
          { type: 'text', text: 'Identifique o produto nesta imagem. Retorne nome, marca e descricao se possiveis.' }
        ]
      }
    ],
    max_tokens: 300
  });

  // Registrar uso de tokens (Vision)
  await logOpenAIUsage(supabase, storeId, {
    promptTokens: 1000, // ~765 tokens da imagem + prompt
    completionTokens: visionResponse.usage?.completion_tokens || 100,
    usageType: 'image',
    model: 'gpt-4o'
  });

  return visionResponse.choices[0].message.content;
}
```

---

## Parte 4: Funcao de Log de Uso (Helper Compartilhado)

### Arquivo: `supabase/functions/_shared/openai-usage.ts`

```typescript
export interface UsageData {
  promptTokens: number;
  completionTokens: number;
  usageType: 'text' | 'image';
  model: string;
  messageType?: string;
  metadata?: Record<string, any>;
}

// Precos OpenAI em centavos USD por 1M tokens
const PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 250, output: 1000 },
  'gpt-4o-mini': { input: 15, output: 60 },
  'gpt-4-turbo': { input: 1000, output: 3000 },
};

export function calculateCost(data: UsageData): number {
  const price = PRICING[data.model] || PRICING['gpt-4o-mini'];
  const inputCost = (data.promptTokens / 1000000) * price.input * 100;
  const outputCost = (data.completionTokens / 1000000) * price.output * 100;
  return Math.ceil(inputCost + outputCost);
}

export async function logOpenAIUsage(
  supabase: any,
  storeId: string,
  data: UsageData
): Promise<void> {
  try {
    await supabase.from('openai_usage_logs').insert({
      store_id: storeId,
      prompt_tokens: data.promptTokens,
      completion_tokens: data.completionTokens,
      usage_type: data.usageType,
      model: data.model,
      estimated_cost_cents: calculateCost(data),
      message_type: data.messageType || 'chat',
      metadata: data.metadata || null
    });
  } catch (error) {
    console.warn('Falha ao registrar uso OpenAI:', error);
    // NAO falha a operacao principal
  }
}
```

---

## Parte 5: Modificar openai-bot-sync para Registrar Uso

### Arquivo: `supabase/functions/openai-bot-sync/index.ts`

**Importar helper e adicionar logging apos cada resposta:**

```typescript
import { logOpenAIUsage, estimateTokens } from '../_shared/openai-usage.ts';

// Apos obter resposta do bot (aproximadamente linha 1495)
// DENTRO de try-catch para nao afetar fluxo principal

try {
  const promptTokens = estimateTokens(systemPrompt);
  const completionTokens = 150; // Estimativa media

  await logOpenAIUsage(supabaseClient, config.storeId, {
    promptTokens,
    completionTokens,
    usageType: 'text',
    model: model,
    messageType: 'sync'
  });
} catch (logError) {
  console.warn('Falha ao registrar uso:', logError);
}
```

---

## Parte 6: Edge Function de Relatorio (Master Admin)

### Novo arquivo: `supabase/functions/openai-usage-report/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Verificar se usuario eh Master Admin
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Nao autorizado' }), { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (profile?.user_type !== 'master_admin') {
    return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403 });
  }

  const url = new URL(req.url);
  const period = url.searchParams.get('period') || '30';
  const storeId = url.searchParams.get('store_id');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(period));

  // Query principal
  let query = supabase
    .from('openai_usage_logs')
    .select('*, stores(name, slug)')
    .gte('created_at', startDate.toISOString());

  if (storeId) {
    query = query.eq('store_id', storeId);
  }

  const { data: logs, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Calcular totais
  const summary = {
    total_tokens: 0,
    total_cost_usd: 0,
    total_cost_brl: 0,
    text_tokens: 0,
    image_tokens: 0,
    text_cost: 0,
    image_cost: 0
  };

  const byStore: Record<string, any> = {};

  for (const log of logs || []) {
    summary.total_tokens += log.total_tokens || 0;
    summary.total_cost_usd += (log.estimated_cost_cents || 0) / 100;
    
    if (log.usage_type === 'image') {
      summary.image_tokens += log.total_tokens || 0;
      summary.image_cost += (log.estimated_cost_cents || 0) / 100;
    } else {
      summary.text_tokens += log.total_tokens || 0;
      summary.text_cost += (log.estimated_cost_cents || 0) / 100;
    }

    const sid = log.store_id;
    if (!byStore[sid]) {
      byStore[sid] = {
        store_id: sid,
        store_name: log.stores?.name || 'Desconhecida',
        store_slug: log.stores?.slug,
        total_tokens: 0,
        cost_usd: 0,
        interactions: 0
      };
    }
    byStore[sid].total_tokens += log.total_tokens || 0;
    byStore[sid].cost_usd += (log.estimated_cost_cents || 0) / 100;
    byStore[sid].interactions += 1;
  }

  summary.total_cost_brl = summary.total_cost_usd * 5; // Cambio aproximado

  return new Response(JSON.stringify({
    summary,
    by_store: Object.values(byStore).sort((a, b) => b.cost_usd - a.cost_usd),
    period_days: period,
    total_records: logs?.length || 0
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
```

---

## Parte 7: Pagina Master Admin (Frontend)

### Novo arquivo: `src/pages/admin/OpenAIUsagePage.tsx`

```typescript
// Dashboard com:
// - Cards de KPI (tokens totais, custo mensal, media por loja)
// - Grafico de consumo diario (Recharts)
// - Tabela de ranking por loja
// - Filtros (periodo, tipo texto/imagem, loja especifica)
// - Protecao: verificar profile.user_type === 'master_admin'
```

---

## Parte 8: Adicionar Rota e Menu

### Arquivo: `src/components/admin/AdminSidebar.tsx`

```typescript
// Na secao de itens Master Admin
if (isMasterAdmin) {
  menuItems.push({
    title: 'Custos OpenAI',
    url: '/dashboard/openai-usage',
    icon: DollarSign,
    group: 'Administracao'
  });
}
```

### Arquivo: `src/routes/masterRoutes.tsx`

```typescript
<Route path="/dashboard/openai-usage" element={<OpenAIUsagePage />} />
```

---

## Parte 9: Atualizar Prompt do Assistente para Visao

### Arquivo: `supabase/functions/openai-bot-sync/index.ts`

**Adicionar instrucoes de analise de imagem no prompt (funcao generateAssistantModePrompt):**

```typescript
// Adicionar apos "CAPACIDADES"
ANALISE DE IMAGENS (se cliente enviar foto):
- Se receber foto de PRODUTO: identifique marca, nome, quantidade e sugira similar do catalogo
- Se receber foto de RECEITA MEDICA: identifique medicamentos prescritos e busque no estoque
- Se receber foto de EMBALAGEM: leia informacoes e ajude encontrar reposicao
- Se nao conseguir identificar claramente, peca foto mais nitida
- NUNCA faca diagnosticos medicos - apenas identifique o produto
```

---

## Fluxo Completo

```text
┌─────────────────────────────────────────────────────────────────┐
│             CLIENTE ENVIA MENSAGEM/IMAGEM                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              whatsapp-webhook                                    │
│    - Detecta se tem imagem                                       │
│    - Extrai base64/URL                                           │
│    - Passa para Evolution API                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Evolution API + OpenAI Assistant                    │
│    - Assistant recebe mensagem                                   │
│    - Se precisa analisar imagem → chama analyze_image           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              product-search-agent                                │
│    1. Verifica se loja tem modulo ai_vision                     │
│    2. Se sim → processa com GPT-4o Vision                       │
│    3. Registra uso em openai_usage_logs                         │
│    4. Retorna identificacao do produto                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              RESPOSTA AO CLIENTE                                 │
│    "Identifiquei o *Dipirona 500mg*!                            │
│     Temos em estoque por R$ 8,90.                               │
│     👉 https://loja.com/produto/dipirona"                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              MASTER ADMIN DASHBOARD                              │
│    - Ve custos por loja                                         │
│    - Filtra por texto/imagem                                    │
│    - Exporta relatorios                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| SQL Migration | Criar | Tabela `openai_usage_logs` + modulo `ai_vision` |
| `supabase/functions/_shared/openai-usage.ts` | Criar | Helper de tracking |
| `supabase/functions/whatsapp-webhook/index.ts` | Modificar | Detectar imagens |
| `supabase/functions/product-search-agent/index.ts` | Modificar | Processar imagens + logging |
| `supabase/functions/openai-bot-sync/index.ts` | Modificar | Adicionar tool analyze_image + logging |
| `supabase/functions/openai-usage-report/index.ts` | Criar | Endpoint de relatorio |
| `src/pages/admin/OpenAIUsagePage.tsx` | Criar | Dashboard Master Admin |
| `src/components/admin/AdminSidebar.tsx` | Modificar | Menu Custos OpenAI |
| `src/routes/masterRoutes.tsx` | Modificar | Rota da pagina |

---

## Custos Estimados por Interacao

| Tipo | Tokens | Custo USD | Custo BRL |
|------|--------|-----------|-----------|
| Texto simples | ~500 | $0.003 | R$ 0,015 |
| Texto + busca | ~2.000 | $0.010 | R$ 0,05 |
| Imagem (Vision) | ~3.000 | $0.055 | R$ 0,28 |

---

## Seguranca e Impacto

| Aspecto | Garantia |
|---------|----------|
| Fluxo existente | PRESERVADO - logging em try-catch |
| Bot v2 | COMPATIVEL - usa mesma arquitetura |
| Performance | MINIMA - INSERT assincrono |
| Acesso a custos | APENAS Master Admin (verificacao dupla) |
| Modulo Vision | GRANULAR - habilitado por loja |

---

## Ordem de Execucao

1. Criar tabela `openai_usage_logs` no banco
2. Inserir modulo `ai_vision` na tabela `modules`
3. Criar helper `_shared/openai-usage.ts`
4. Modificar `product-search-agent` (Vision + logging)
5. Modificar `openai-bot-sync` (tool + logging)
6. Criar `openai-usage-report`
7. Criar `OpenAIUsagePage.tsx`
8. Adicionar menu e rota
9. Deploy das Edge Functions
10. Testar com loja de teste

