
# Plano: Remover Saudação Dinâmica do Assistente V2

## Problema Identificado

O bot V2 está enviando saudações com horário errado (ex: "Boa noite" às 10:29 da manhã). Isso acontece porque:
1. A função `get_current_greeting()` pode não estar sendo chamada pela IA
2. Mesmo quando chamada, pode haver inconsistência no fuso horário

## Solução

Remover completamente a saudação baseada em horário (Bom dia/Boa tarde/Boa noite) do prompt V2 e usar uma saudação neutra.

## Arquivos a Modificar

### `supabase/functions/openai-bot-sync/index.ts`

#### 1. Remover instruções de saudação dinâmica do prompt V2 (linhas 364-379)

**Antes:**
```typescript
PERSONALIZAÇÃO COM NOME DO CLIENTE E SAUDAÇÃO DINÂMICA (MUITO IMPORTANTE):
- Você receberá o nome do cliente no campo "pushName" das mensagens
- SEMPRE use o nome do cliente na primeira interação para criar conexão pessoal
- Durante a conversa, chame o cliente pelo nome ocasionalmente de forma natural
- Se o pushName não estiver disponível, use "você" de forma amigável

SAUDAÇÃO OBRIGATÓRIA - PRIMEIRA MENSAGEM (CRÍTICO):
- Na PRIMEIRA mensagem de cada conversa, você DEVE chamar get_current_greeting()...
```

**Depois:**
```typescript
PERSONALIZAÇÃO COM NOME DO CLIENTE (MUITO IMPORTANTE):
- Você receberá o nome do cliente no campo "pushName" das mensagens
- SEMPRE use o nome do cliente na primeira interação para criar conexão pessoal
- Durante a conversa, chame o cliente pelo nome ocasionalmente de forma natural
- Se o pushName não estiver disponível, use "você" de forma amigável

SAUDAÇÃO NA PRIMEIRA MENSAGEM:
- Use "Oi, [Nome]! 😊" ou "Olá, [Nome]! 👋" como saudação
- NÃO use saudações baseadas em horário (Bom dia, Boa tarde, Boa noite)
- Seja acolhedor e direto
```

#### 2. Atualizar regras críticas (linha 394)

**Remover:**
```typescript
1. NA PRIMEIRA MENSAGEM: Chame get_current_greeting() para saudar corretamente
```

**Substituir por:**
```typescript
1. NA PRIMEIRA MENSAGEM: Use saudação simples "Oi/Olá" + nome do cliente
```

#### 3. Remover `get_current_greeting` da lista de capacidades (linha 384)

**Remover:**
```typescript
- Obter saudação correta: get_current_greeting() - USE NA PRIMEIRA MENSAGEM!
```

## Resultado Esperado

```text
Cliente: Olá

Bot: Oi, Andrade! 😊 Seja bem-vindo à Drogaria Farma Bella! 
Como posso te ajudar hoje?
```

## Observações Técnicas

- A função `get_current_greeting` permanecerá disponível no `product-search-agent` para outros usos
- Apenas o prompt do V2 será alterado - o modo simples não será afetado
- A personalidade do bot (friendly, formal, etc.) continuará funcionando normalmente
- O nome do cliente via `pushName` continuará sendo usado

## Deploy

Após a modificação, será necessário:
1. Deploy da edge function `openai-bot-sync`
2. Re-sincronizar o bot da loja no painel admin
