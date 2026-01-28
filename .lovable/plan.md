
# Plano Completo: Assistente Inteligente v2 com Consultas em Tempo Real

## Resumo Executivo

Criar um **novo módulo de assistente** ("Assistente Inteligente v2") que coexiste com o sistema atual, permitindo lojas com catálogos grandes (7.000+ produtos) usarem consultas em tempo real ao banco de dados. O módulo mantém **todas as informações existentes** (horários, localização, pagamentos, delivery) e adiciona novas funcionalidades.

---

## O Que Já Existe e Será MANTIDO

### Dados da Loja (tabela `stores`)
| Campo | Uso no Prompt | Status |
|-------|---------------|--------|
| `name`, `description` | Identificação da loja | Manter |
| `address`, `city`, `state` | Localização física | Manter |
| `latitude`, `longitude` | Coordenadas para navegação | Manter |
| `google_maps_link` | Link direto do Maps | Manter |
| `business_hours` (JSON) | Horários de funcionamento | Manter |
| `delivery_fee`, `min_order_value` | Taxas de delivery | Manter |
| `accepts_pix`, `accepts_card`, `accepts_cash` | Formas de pagamento | Manter |
| `whatsapp`, `phone` | Contato | Manter |
| `slug` | Links dos produtos | Manter |

### Página de Navegação Existente
A página `/navegar` já existe e oferece escolha entre Google Maps, Waze e Uber:
- Recebe parâmetros: `?lat=X&lng=Y&store=slug&address=endereco`
- Cliente escolhe o app de navegação preferido
- Mostra logo e nome da loja

### Configurações do Bot (tabela `store_bot_config`)
| Campo | Descrição | Status |
|-------|-----------|--------|
| `bot_name` | Nome do assistente | Manter |
| `personality`, `emoji_level` | Estilo de comunicação | Manter |
| `custom_greeting` | Saudação personalizada | Manter |
| `include_location` | Incluir localização no prompt | Manter |
| `include_business_hours` | Incluir horários | Manter |
| `include_payment_methods` | Incluir pagamentos | Manter |
| `include_delivery_fee` | Incluir taxa de entrega | Manter |
| `include_min_order` | Incluir pedido mínimo | Manter |
| Todos os outros campos de trigger/comportamento | Configuração Evolution | Manter |

---

## Novos Recursos do Assistente v2

### 1. Consultas em Tempo Real ao Banco
Em vez de enviar 7.000 produtos no prompt, a IA consulta sob demanda:

```text
Cliente: "Vocês têm Dipirona Gotas?"
     ↓
IA chama: search_products("dipirona gotas")
     ↓
Edge Function consulta banco → Retorna 3-5 produtos
     ↓
IA responde com dados REAIS + link do produto
```

### 2. Link de Navegação Inteligente
Usando a página `/navegar` existente, a IA enviará:

```text
https://mostralo.com.br/navegar?lat=-23.5505&lng=-46.6333&store=farmacia-xyz&address=Rua+das+Flores+123
```

O cliente escolhe: Google Maps, Waze ou Uber.

### 3. Link Direto dos Produtos
Cada produto retornado inclui o link completo:

```text
https://mostralo.com.br/loja/farmacia-xyz/produto/dipirona-gotas-20ml
```

### 4. Produtos Recomendados (Maior Margem)
Usa o campo `is_featured` já existente na tabela `products`:
- Farmácia marca Vitamina C, Omega 3 como "Destaque"
- Quando cliente pedir sugestão, IA usa `get_recommendations()`
- Retorna produtos com `is_featured = true`

### 5. Prompt Editável pelo Lojista
Novo campo `custom_prompt_instructions` para adicionar regras específicas:

```text
Exemplo farmácia:
"Quando cliente pedir recomendação, sempre sugira:
Vitamina C, Omega 3 e Protetor Solar (maior margem).
Se perguntar sobre antibiótico, diga que precisa de receita."
```

---

## Comparativo: Modo Simples vs Inteligente v2

| Aspecto | Modo Simples (Atual) | Modo Inteligente v2 |
|---------|---------------------|---------------------|
| **Tokens/mensagem** | 10.000-20.000 | 800-1.500 |
| **Custo/1.000 conversas** | ~US$ 30-50 | ~US$ 3-5 |
| **Limite de produtos** | ~200 (prático) | Ilimitado |
| **Precisão de estoque** | Estático no prompt | Tempo real |
| **Links dos produtos** | Sim (fixos) | Sim (dinâmicos) |
| **Produtos recomendados** | Não | Sim (is_featured) |
| **Prompt editável** | Não | Sim |
| **Link de navegação** | Google Maps fixo | Página com escolha |

---

## Fluxo Completo de uma Conversa

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                    EXEMPLO DE CONVERSA - MODO INTELIGENTE V2               │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Cliente: "Oi, boa tarde!"                                                 │
│                                                                            │
│  Bot: "Boa tarde! 👋 Seja bem-vindo(a) à Farmácia XYZ!                    │
│        Como posso ajudar hoje?                                             │
│        📱 Confira nossos produtos: https://mostralo.com.br/loja/farmacia"  │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Cliente: "Vocês têm Dipirona Gotas?"                                      │
│                                                                            │
│  [IA chama: search_products("dipirona gotas")]                            │
│  [Edge Function retorna: {name, price, stock: 45, link}]                   │
│                                                                            │
│  Bot: "Sim! Temos Dipirona Gotas 20ml por R$ 12,90 (45 em estoque)        │
│        📎 Compre aqui: https://mostralo.com.br/loja/.../dipirona-gotas"   │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Cliente: "Qual o endereço de vocês?"                                      │
│                                                                            │
│  [IA usa dados da loja do prompt]                                          │
│                                                                            │
│  Bot: "Estamos na Rua das Flores, 123 - Centro, São Paulo/SP              │
│        📍 Escolha como chegar: https://mostralo.com.br/navegar?lat=...    │
│                                                                            │
│        ⏰ Funcionamos de Segunda a Sexta das 08:00 às 20:00               │
│        💳 Aceitamos: PIX, Cartão e Dinheiro"                              │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  Cliente: "Me recomenda algo pra imunidade?"                               │
│                                                                            │
│  [IA chama: get_recommendations() + search_products("imunidade")]          │
│  [Retorna produtos destacados + busca]                                     │
│                                                                            │
│  Bot: "Recomendo nossos produtos em destaque:                              │
│        - Vitamina C 1000mg - R$ 24,90 (link)                              │
│        - Vitamina D3 - R$ 32,00 (link)                                    │
│        - Própolis Spray - R$ 18,90 (link)                                 │
│        Todos em estoque! 🌟"                                              │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementação Técnica

### Novos Campos no Banco de Dados

**Tabela `store_bot_config` - Adicionar:**

```sql
ALTER TABLE store_bot_config 
ADD COLUMN IF NOT EXISTS bot_mode text DEFAULT 'chat_completion',
ADD COLUMN IF NOT EXISTS openai_assistant_id text,
ADD COLUMN IF NOT EXISTS custom_prompt_instructions text;

COMMENT ON COLUMN store_bot_config.bot_mode IS 'chat_completion (atual) ou assistant (v2)';
COMMENT ON COLUMN store_bot_config.openai_assistant_id IS 'ID do Assistant na OpenAI';
COMMENT ON COLUMN store_bot_config.custom_prompt_instructions IS 'Instruções personalizadas do lojista';
```

### Nova Edge Function: `product-search-agent`

Endpoint que recebe chamadas de Function Calling da OpenAI:

**Funções disponíveis:**

| Função | Descrição | Retorno |
|--------|-----------|---------|
| `search_products(query)` | Busca produtos por termo | nome, preço, estoque, link |
| `check_stock(product_name)` | Verifica estoque específico | stock_quantity, in_stock |
| `get_product_details(slug)` | Detalhes completos | todos os campos + link |
| `list_categories()` | Lista categorias ativas | array de nomes |
| `get_promotions()` | Produtos em oferta | is_on_offer = true |
| `get_recommendations()` | Produtos destacados | is_featured = true |

**Estrutura de retorno:**

```json
{
  "products": [
    {
      "name": "Dipirona Gotas 20ml",
      "price": 12.90,
      "stock_quantity": 45,
      "in_stock": true,
      "is_featured": false,
      "is_on_offer": false,
      "link": "https://mostralo.com.br/loja/farmacia/produto/dipirona-gotas",
      "category": "Medicamentos"
    }
  ]
}
```

### Nova Edge Function: `manage-openai-assistant`

Gerencia OpenAI Assistants (API Assistants) para cada loja:

- **create**: Cria um Assistant com tools pré-definidas
- **update**: Atualiza prompt quando lojista editar instruções
- **delete**: Remove Assistant quando bot desativado

**Configuração das Tools no Assistant:**

```json
{
  "name": "Assistente Farmácia XYZ",
  "model": "gpt-4o-mini",
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "search_products",
        "description": "Busca produtos no catálogo por nome ou termo",
        "parameters": {
          "type": "object",
          "properties": {
            "query": { "type": "string", "description": "Termo de busca" }
          },
          "required": ["query"]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "check_stock",
        "description": "Verifica estoque de um produto específico",
        "parameters": {
          "type": "object",
          "properties": {
            "product_name": { "type": "string" }
          },
          "required": ["product_name"]
        }
      }
    },
    {
      "type": "function",
      "function": {
        "name": "get_recommendations",
        "description": "Retorna produtos em destaque/recomendados pela loja"
      }
    },
    {
      "type": "function",
      "function": {
        "name": "list_categories",
        "description": "Lista todas as categorias de produtos"
      }
    },
    {
      "type": "function",
      "function": {
        "name": "get_promotions",
        "description": "Retorna produtos em promoção"
      }
    }
  ]
}
```

### Modificação: `openai-bot-sync/index.ts`

Adicionar suporte ao modo "assistant":

```typescript
// Quando bot_mode === 'assistant':
if (botMode === 'assistant') {
  // 1. Criar/atualizar Assistant via manage-openai-assistant
  // 2. Configurar Evolution com botType: 'assistant'
  
  const botPayload = {
    botType: 'assistant',
    assistantId: config.openai_assistant_id,
    functionUrl: `${supabaseUrl}/functions/v1/product-search-agent?storeId=${storeId}`,
    // ... demais configs (triggers, delays, etc)
  };
} else {
  // Fluxo atual (chat_completion) - INALTERADO
}
```

---

## Prompt Enxuto para Modo Inteligente v2

O prompt reduz de ~15.000+ tokens para ~800 tokens:

```text
Você é {botName}, assistente virtual da {store.name}.

CAPACIDADES (use as funções disponíveis):
- Buscar produtos: search_products("termo")
- Verificar estoque: check_stock("nome produto")
- Ver detalhes: get_product_details("slug")
- Listar categorias: list_categories()
- Mostrar promoções: get_promotions()
- Recomendar produtos: get_recommendations()

REGRAS:
1. SEMPRE use search_products antes de falar sobre produtos
2. Se perguntarem "tem X?", verifique estoque real com check_stock
3. NÃO invente produtos - só use dados retornados pelas funções
4. SEMPRE inclua o LINK do produto nas respostas
5. Se pedirem sugestão, use get_recommendations()
6. Se não encontrar, sugira buscar com outros termos

{custom_prompt_instructions}

INFORMAÇÕES DA LOJA:
- Nome: {store.name}
- Descrição: {store.description}
- Endereço: {store.address} - {store.city}/{store.state}
- WhatsApp: {store.whatsapp}
- Link do cardápio: {storeLink}

LOCALIZAÇÃO E NAVEGAÇÃO:
- Endereço completo: {store.address}
- Link para navegação: {navigationLink}
- Quando cliente pedir localização/endereço, ENVIE o link de navegação
- O cliente poderá escolher: Google Maps, Waze ou Uber

HORÁRIO DE FUNCIONAMENTO:
{formatted_business_hours}

FORMAS DE PAGAMENTO:
{payment_methods}

DELIVERY:
- Taxa de entrega: {delivery_fee}
- Pedido mínimo: {min_order_value}

INSTRUÇÕES GERAIS:
1. Quando pedirem localização, envie o link de navegação
2. Informe horários quando perguntado
3. Informe formas de pagamento quando perguntado
4. Responda sempre em português brasileiro
5. Seja acolhedor e prestativo
```

---

## Interface do Lojista

### Localização no Sistema
**Página**: `/dashboard/whatsapp` → Tab "Assistente IA"

### Novos Elementos na Interface

**1. Seletor de Modo do Assistente**

```text
┌─────────────────────────────────────────────────────────────┐
│ 🤖 Modo do Assistente                                       │
│                                                             │
│ ○ Simples (até 200 produtos)                               │
│   Catálogo enviado no prompt. Ideal para lojas pequenas.   │
│                                                             │
│ ● Inteligente v2 (catálogos grandes)                       │
│   Consultas em tempo real ao banco. Estoque atualizado,    │
│   links dinâmicos, recomendações personalizadas.           │
│   Recomendado para 200+ produtos.                          │
└─────────────────────────────────────────────────────────────┘
```

**2. Editor de Instruções Personalizadas** (só aparece no modo v2)

```text
┌─────────────────────────────────────────────────────────────┐
│ 📝 Instruções Personalizadas                                │
│                                                             │
│ Adicione regras específicas para o assistente:             │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Quando cliente pedir recomendação, sempre sugira:      ││
│ │ Vitamina C, Omega 3 e Protetor Solar.                  ││
│ │                                                         ││
│ │ Se perguntar sobre antibiótico, informe que            ││
│ │ precisa de receita médica.                              ││
│ │                                                         ││
│ │ Sempre mencione que temos farmacêutico de plantão.     ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ Estas instruções serão adicionadas ao prompt padrão.       │
└─────────────────────────────────────────────────────────────┘
```

**3. Card de Produtos Recomendados**

```text
┌─────────────────────────────────────────────────────────────┐
│ ⭐ Produtos Recomendados pelo Bot                           │
│                                                             │
│ O assistente recomenda produtos marcados como              │
│ "Destaque" no seu catálogo.                                │
│                                                             │
│ Produtos em destaque: 12                                   │
│                                                             │
│ [Gerenciar Produtos em Destaque →]                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/functions/product-search-agent/index.ts` | **CRIAR** | Funções de busca em tempo real |
| `supabase/functions/manage-openai-assistant/index.ts` | **CRIAR** | Gerenciar Assistants OpenAI |
| `supabase/functions/openai-bot-sync/index.ts` | **MODIFICAR** | Suporte a botType: 'assistant' |
| `supabase/config.toml` | **MODIFICAR** | Registrar novas functions |
| `src/hooks/useBotConfig.ts` | **MODIFICAR** | Novos campos (bot_mode, custom_prompt) |
| `src/lib/botPromptGenerator.ts` | **MODIFICAR** | Gerar prompt v2 com navigation link |
| `src/components/admin/bot/BotModeSelector.tsx` | **CRIAR** | Seletor simples/inteligente |
| `src/components/admin/bot/BotCustomPromptCard.tsx` | **CRIAR** | Editor de instruções |
| `src/components/admin/bot/BotRecommendationsCard.tsx` | **CRIAR** | Card de produtos destacados |
| `src/pages/admin/WhatsAppInstancePage.tsx` | **MODIFICAR** | Incluir novos cards |
| **Migração SQL** | **EXECUTAR** | Adicionar 3 campos no banco |

---

## Etapas de Implementação

### Fase 1: Infraestrutura de Backend
1. Executar migração SQL (3 campos novos em `store_bot_config`)
2. Criar Edge Function `product-search-agent` com todas as funções
3. Criar Edge Function `manage-openai-assistant`
4. Atualizar `supabase/config.toml`
5. Deploy e teste das Edge Functions

### Fase 2: Integração com Evolution
1. Modificar `openai-bot-sync` para suportar modo assistant
2. Implementar lógica de criação de Assistant na OpenAI
3. Configurar `functionUrl` apontando para `product-search-agent`
4. Garantir que link de navegação use a página `/navegar` existente
5. Testar fluxo completo com loja piloto

### Fase 3: Interface do Lojista
1. Criar `BotModeSelector` (toggle simples/inteligente)
2. Criar `BotCustomPromptCard` (editor de instruções)
3. Criar `BotRecommendationsCard` (link para destaques)
4. Atualizar `useBotConfig.ts` com novos campos
5. Atualizar página de configuração do bot

### Fase 4: Testes e Documentação
1. Testar busca de produtos em tempo real
2. Testar verificação de estoque
3. Testar link de navegação (Google Maps, Waze, Uber)
4. Testar produtos recomendados (is_featured)
5. Validar economia de tokens
6. Documentar como ativar o novo modo

---

## Garantias de Segurança

### O Que NÃO Será Alterado
- Fluxo atual do modo `chat_completion` continua funcionando 100%
- Todas as Edge Functions existentes mantêm comportamento atual
- Tabelas existentes não perdem dados
- Interface atual permanece funcional para lojas que não ativarem v2
- Página `/navegar` continua funcionando normalmente

### Estratégia de Rollback
- Toggle simples: mudar `bot_mode` de volta para `chat_completion`
- Lojas podem alternar entre modos a qualquer momento
- Sem impacto em lojas que não ativarem o v2

---

## Resumo dos Links que a IA Enviará

| Tipo | Formato | Exemplo |
|------|---------|---------|
| **Cardápio** | `{baseUrl}/loja/{slug}` | `https://mostralo.com.br/loja/farmacia-xyz` |
| **Produto** | `{baseUrl}/loja/{slug}/produto/{productSlug}` | `.../produto/dipirona-gotas` |
| **Navegação** | `{baseUrl}/navegar?lat=X&lng=Y&store={slug}&address={address}` | `.../navegar?lat=-23.55&lng=-46.63&store=farmacia-xyz&address=Rua+das+Flores` |

O cliente ao clicar no link de navegação poderá escolher entre:
- Google Maps
- Waze  
- (Uber pode ser adicionado no futuro)
