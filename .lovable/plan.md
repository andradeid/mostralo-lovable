
# Plano: Preview Real do Prompt e Botao Sincronizar Todos

## Problema Identificado

Atualmente o "Preview do Prompt" no card de cada bot (Vendas, Recrutamento, Suporte) mostra o prompt **gerado localmente** usando funcoes como `generateSalesPrompt()`, nao o prompt que esta **realmente configurado** na Evolution API/OpenAI.

## Solucao

### Arquitetura Atual vs Proposta

```text
ATUAL:
Frontend gera prompt local → Mostra no preview → Usuario sincroniza → Prompt vai para Evolution

PROPOSTO:
Frontend busca prompt da Evolution → Mostra prompt REAL → Botao "Sincronizar Todos" atualiza tudo
```

---

## FASE 1: Nova Edge Function para Buscar Prompts

### 1.1 Criar `master-bot-fetch-prompt`

**Arquivo:** `supabase/functions/master-bot-fetch-prompt/index.ts`

| Endpoint | Descricao |
|----------|-----------|
| POST | Busca prompt atual de um ou todos os bots na Evolution API |

**Payload de entrada:**
```json
{
  "configId": "uuid",
  "botType": "sales" | "recruitment" | "support" | "all"
}
```

**Retorno:**
```json
{
  "success": true,
  "prompts": {
    "sales": {
      "prompt": "texto do prompt...",
      "model": "gpt-4o-mini",
      "botId": "evolution-bot-id",
      "exists": true
    },
    "recruitment": { ... },
    "support": { ... }
  }
}
```

### 1.2 Registrar no config.toml

```toml
[functions.master-bot-fetch-prompt]
verify_jwt = false
```

---

## FASE 2: Atualizar Interface do MasterBotConfigTab

### 2.1 Novo Estado para Prompts Reais

Adicionar estados para armazenar os prompts buscados da Evolution:

```typescript
const [realPrompts, setRealPrompts] = useState<{
  sales: { prompt: string; model: string; exists: boolean } | null;
  recruitment: { prompt: string; model: string; exists: boolean } | null;
  support: { prompt: string; model: string; exists: boolean } | null;
}>({ sales: null, recruitment: null, support: null });

const [fetchingPrompts, setFetchingPrompts] = useState(false);
```

### 2.2 Funcao para Buscar Prompts Reais

```typescript
const fetchRealPrompts = async () => {
  setFetchingPrompts(true);
  // Chamar edge function master-bot-fetch-prompt
  // Atualizar estado realPrompts
  setFetchingPrompts(false);
};
```

### 2.3 Atualizar PromptPreviewCard

Modificar para mostrar:
- **Tab "Configurado"**: Prompt que esta NA EVOLUTION (real)
- **Tab "Preview Local"**: Prompt que SERA enviado se sincronizar

---

## FASE 3: Botao "Sincronizar Todos os Bots"

### 3.1 Adicionar Botao no Header das Tabs

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Vendas] [Recr.] [Suporte]                     [Sincronizar Todos] Modelo: │
├─────────────────────────────────────────────────────────────────────────────┤
```

### 3.2 Funcao syncAllBots

```typescript
const syncAllBots = async () => {
  setSyncingAll(true);
  
  // Sincronizar cada bot que estiver ativo
  const botsToSync = ['sales', 'recruitment', 'support'].filter(
    bot => config[`${bot}_bot_enabled`]
  );
  
  for (const bot of botsToSync) {
    await syncBots(bot);
  }
  
  // Atualizar prompts reais apos sincronizacao
  await fetchRealPrompts();
  
  setSyncingAll(false);
};
```

---

## FASE 4: Modificar PromptPreviewCard

### 4.1 Nova Interface

| Props Nova | Tipo | Descricao |
|------------|------|-----------|
| `realPrompt` | string | null | Prompt da Evolution (real) |
| `localPrompt` | string | Prompt gerado localmente |
| `onRefresh` | () => void | Callback para atualizar prompt real |
| `loading` | boolean | Estado de carregamento |

### 4.2 Layout com Tabs

```text
┌──────────────────────────────────────────────────────────────────┐
│ 👁️ Preview do Prompt  [Persuasivo]  [✓ Sincronizado]           │
├──────────────────────────────────────────────────────────────────┤
│  [Configurado na IA]  [Preview Local]                    [🔄]   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🤖 PROMPT DE VENDAS MOSTRALO - PERSUASIVO                      │
│                                                                  │
│  ## IDENTIDADE E ESTILO                                         │
│  Você é um consultor de vendas focado em números e resultados.  │
│  ...                                                             │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  22.691 caracteres  3.425 palavras        [📋 Copiar Prompt]    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/master-bot-fetch-prompt/index.ts` | Edge function para buscar prompts |

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `supabase/config.toml` | Registrar nova edge function |
| `src/components/admin/master-whatsapp/MasterBotConfigTab.tsx` | Adicionar botao "Sincronizar Todos", estados de prompts reais |
| `src/components/admin/master-whatsapp/PromptPreviewCard.tsx` | Adicionar tabs "Configurado" vs "Preview Local" |
| `src/hooks/useMasterWhatsAppConfig.ts` | Adicionar funcao fetchRealPrompts |

## Arquivos que NAO serao alterados

| Arquivo | Motivo |
|---------|--------|
| `supabase/functions/master-bot-sync/index.ts` | Continua funcionando igual |
| `supabase/functions/openai-bot-sync/index.ts` | Bot das lojas intacto |

---

## Ordem de Implementacao

```text
FASE 1: Edge Function
   1.1 Criar master-bot-fetch-prompt/index.ts
   1.2 Implementar busca na Evolution API
   1.3 Registrar no config.toml
   1.4 Deploy

FASE 2: Hook
   2.1 Adicionar fetchRealPrompts em useMasterWhatsAppConfig.ts
   2.2 Adicionar estados realPrompts

FASE 3: Interface
   3.1 Atualizar MasterBotConfigTab com botao "Sincronizar Todos"
   3.2 Atualizar PromptPreviewCard com tabs
   3.3 Conectar tudo

FASE 4: Teste
   4.1 Testar busca de prompts
   4.2 Testar sincronizacao de todos
   4.3 Testar exibicao correta
```

---

## Resultado Esperado

| Funcionalidade | Antes | Depois |
|----------------|-------|--------|
| Preview mostra | Prompt gerado localmente | Prompt REAL da Evolution |
| Sincronizar | Um bot por vez | Botao "Sincronizar Todos" |
| Identificar diferenca | Badge "Nao sincronizado" | Tabs mostrando ambos os prompts |
| Atualizar preview | Manual | Botao de refresh busca da Evolution |

---

## Secao Tecnica: Como Funciona a Busca na Evolution

A Evolution API tem endpoint `/openai/find/{instance}` que retorna:

```json
[
  {
    "id": "bot-uuid",
    "openaiCredsId": "creds-uuid",
    "botType": "chatCompletion",
    "model": "gpt-4o-mini",
    "systemMessages": ["prompt aqui..."],
    "triggerType": "keyword",
    "triggerValue": "preco,plano"
  }
]
```

O campo `systemMessages[0]` contem o prompt configurado.
