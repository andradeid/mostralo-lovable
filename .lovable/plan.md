
# Implementação: Remover Saudação Dinâmica do V2

## Status Atual
O código ainda contém instruções para usar `get_current_greeting()`, causando o erro de saudação incorreta.

## Alterações Necessárias

### Arquivo: `supabase/functions/openai-bot-sync/index.ts`

**Linhas 364-379** - Substituir seção de saudação dinâmica:

```typescript
// ANTES (atual):
PERSONALIZAÇÃO COM NOME DO CLIENTE E SAUDAÇÃO DINÂMICA (MUITO IMPORTANTE):
...
SAUDAÇÃO OBRIGATÓRIA - PRIMEIRA MENSAGEM (CRÍTICO):
- Na PRIMEIRA mensagem de cada conversa, você DEVE chamar get_current_greeting()...

// DEPOIS (novo):
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

**Linha 384** - Remover capacidade:
```typescript
// REMOVER esta linha:
- Obter saudação correta: get_current_greeting() - USE NA PRIMEIRA MENSAGEM!
```

**Linha 394** - Atualizar regra crítica:
```typescript
// ANTES:
1. NA PRIMEIRA MENSAGEM: Chame get_current_greeting() para saudar corretamente

// DEPOIS:
1. NA PRIMEIRA MENSAGEM: Use saudação simples "Oi/Olá" + nome do cliente
```

## Resultado Esperado
```
Cliente: Olá
Bot: Oi, Andrade! 😊 Bem-vindo à Drogaria Farma Bella! Como posso te ajudar?
```

## Deploy
1. Aplicar alterações no `openai-bot-sync`
2. Deploy da edge function
3. Re-sincronizar bot no painel admin
