

# Plano: Segmentação por Sessões usando whatsapp_conversation_cycles

## Resumo

Usar a tabela `whatsapp_conversation_cycles` (já preenchida automaticamente por trigger) para segmentar mensagens por sessão na edge function de análise comercial. Adicionar campo `metadata` JSONB na tabela de análise para auditoria. Exibir ciclos como separadores visuais no modal de conversa.

---

## Etapa 1 — Migration: adicionar campo metadata

Adicionar coluna `metadata JSONB DEFAULT '{}'` em `whatsapp_conversation_analysis` para armazenar:
```json
{
  "analyzed_session_start_at": "2026-03-20T10:00:00Z",
  "analyzed_session_end_at": "2026-03-20T14:30:00Z",
  "analyzed_session_type": "closed"
}
```

---

## Etapa 2 — Edge Function: segmentação por sessão

Arquivo: `supabase/functions/analyze-whatsapp-conversations/index.ts`

### Nova função `getSessionMessages(supabase, conv, allMessages)`

1. Buscar ciclos usando `conversation_id` como chave principal:
```sql
SELECT opened_at, closed_at FROM whatsapp_conversation_cycles
WHERE conversation_id = X ORDER BY opened_at DESC
```
Se nenhum resultado, fallback com `store_id + remote_jid`.

2. Selecionar sessão conforme regra de prioridade:
   - **Sessão aberta** (último ciclo sem `closed_at`): usar se houver >= 2 mensagens reais (não-system) com timestamp >= `opened_at`
   - **Última sessão fechada**: usar o último ciclo com `closed_at` preenchido
   - **Fallback**: sem ciclos → usar todas as mensagens (comportamento atual)

3. Filtrar mensagens da sessão:
   - `timestamp >= opened_at`
   - `timestamp <= closed_at` (ou sem limite superior se sessão aberta)
   - Excluir `direction = 'system'` do payload enviado à OpenAI

4. Calcular métricas (`calculateConversationMetrics`) apenas sobre mensagens da sessão selecionada.

5. Retornar objeto com: `messages`, `sessionType`, `sessionStartAt`, `sessionEndAt`.

### Timestamps

Tanto `opened_at`/`closed_at` (cycles) quanto `timestamp` (messages) são TIMESTAMPTZ — mesma base temporal, sem risco de timezone.

### Salvar auditoria no upsert

Adicionar ao `analysisData`:
```typescript
metadata: {
  analyzed_session_start_at: session.startAt,
  analyzed_session_end_at: session.endAt,
  analyzed_session_type: session.type // 'open' | 'closed' | 'fallback_full_conversation'
}
```

Bump `PROMPT_VERSION` para `"v3"`.

---

## Etapa 3 — Modal: separadores visuais de sessão

Arquivo: `src/components/admin/conversation-analysis/ConversationDetailModal.tsx`

1. Buscar ciclos via query adicional em `whatsapp_conversation_cycles` (por `store_id + remote_jid`, ordenados por `opened_at`).

2. Ao renderizar mensagens, inserir separadores visuais discretos quando o timestamp cruzar um limite de ciclo (opened_at ou closed_at). Estilo: linha horizontal com texto centralizado tipo "Sessão iniciada em DD/MM HH:MM" / "Sessão finalizada em DD/MM HH:MM", cor neutra, sem ocupar muito espaço.

3. Mensagens de `direction = 'system'` já existentes continuam renderizadas normalmente.

---

## Arquivos modificados (3)

| Arquivo | Alteração |
|---------|-----------|
| Migration SQL | ADD COLUMN `metadata` JSONB |
| `supabase/functions/analyze-whatsapp-conversations/index.ts` | Nova função `getSessionMessages`, integração no loop principal, salvar metadata de sessão |
| `src/components/admin/conversation-analysis/ConversationDetailModal.tsx` | Buscar ciclos e renderizar separadores visuais |

## Retrocompatibilidade

- Conversas sem ciclos → fallback para análise completa
- Conversas já analisadas não são afetadas
- Campo `metadata` é JSONB com default `{}`, sem impacto em registros existentes

