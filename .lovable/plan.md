
# Plano de Implementacao: Modulo "Analise Comercial de Conversas"

## Resumo

Criar modulo completo com: migration SQL, edge function, 3 hooks, 5 componentes, pagina principal, rota e menu. Processamento em lotes de 10 conversas usando OpenAI de cada loja.

---

## Etapa 1 — Migration SQL

Criar tabela `whatsapp_conversation_analysis` com:
- Campos comerciais: `houve_intencao_compra`, `houve_fechamento`, `valor_estimado`, `canal_fechamento` (sistema/manual_whatsapp/indefinido), `atendimento_predominante` (ia/humano/misto), `precisou_humano`, `motivo_sem_fechamento`, `resumo_comercial`, `confidence_score`, `confidence_reason`
- Controle: `analysis_status` (pending/success/error), `analysis_error`, `retry_count`, `prompt_version`
- Metadata: `model_used`, `prompt_tokens`, `completion_tokens`, `total_messages_analyzed`, `last_message_at`
- FKs: `conversation_id` (UNIQUE), `store_id`, `remote_jid`, `phone_number`, `contact_name`
- Indices em store_id, status, intencao, fechamento, last_message_at
- RLS: store users veem suas analises
- INSERT modulo `commercial_analysis` na tabela `modules`

---

## Etapa 2 — Edge Function `analyze-whatsapp-conversations`

Arquivo: `supabase/functions/analyze-whatsapp-conversations/index.ts`

1. Recebe `storeId`, `batchSize` (default 10), `conversationId` (opcional para reprocessar)
2. Busca `openai_api_key` da loja (tabela `stores`)
3. Se `conversationId`: UPDATE registro existente (incrementa retry_count, atualiza prompt_version/analyzed_at)
4. Se batch: busca conversas sem analise via LEFT JOIN
5. Para cada conversa: busca mensagens de `whatsapp_chat_messages` ordenadas por timestamp
6. Formata historico: `[CLIENTE]`, `[IA]`, `[ATENDENTE]`
7. Chama OpenAI gpt-4o-mini com tool calling (structured output) com criterios:
   - Intencao: pediu produto, perguntou preco, solicitou disponibilidade
   - Fechamento: confirmou pedido, aceitou compra, informou endereco, confirmou pagamento
   - Canal: sistema vs manual_whatsapp vs indefinido
8. Salva resultado, registra uso em `openai_usage_logs` via helper existente
9. Delay 1s entre chamadas

Registrar em `supabase/config.toml`.

---

## Etapa 3 — Hooks

### `useConversationAnalysis(storeId, filters)`
- Busca dados paginados de `whatsapp_conversation_analysis`
- Calcula 8 KPIs: total analisadas, com intencao, com fechamento, vendas fora do sistema (canal=manual_whatsapp), faturamento estimado, faturamento invisivel, pendentes (count de conversas sem analise), taxa de fechamento (fechamentos/intencoes)
- Filtros: periodo, confianca (alta>=80/media>=50/baixa<50), status, canal, intencao, fechamento
- Ordenacao padrao por last_message_at DESC

### `useAnalyzeConversations(storeId)`
- Invoca edge function via `supabase.functions.invoke()`
- Suporta batch e reprocessamento individual (conversationId)
- Retorna loading, progresso

### `useConversationMessages(storeId, remoteJid)`
- Busca mensagens de `whatsapp_chat_messages` para o modal
- Identifica cliente (direction=incoming), IA (is_from_bot=true), atendente (direction=outgoing, is_from_bot=false)
- Ordenacao cronologica

---

## Etapa 4 — Componentes

| Componente | Descricao |
|-----------|-----------|
| `AnalysisKPIs.tsx` | 8 cards: total, intencao, fechamento, vendas fora, faturamento estimado, faturamento invisivel, pendentes, taxa fechamento. Verde=positivo, vermelho=perda, azul=info |
| `AnalysisFunnel.tsx` | Funil recharts: Conversas → Intencao → Fechamento |
| `AnalysisCharts.tsx` | 2 donuts recharts: atendimento (IA/Humano/Misto) + canal (Sistema/Manual/Indefinido) |
| `AnalysisTable.tsx` | Tabela paginada (10/20/50) com filtros por confianca, status, canal, intencao, fechamento. Acoes: "Ver conversa" e "Reprocessar" |
| `ConversationDetailModal.tsx` | Dialog com historico cronologico. Cliente=azul, IA=verde, Atendente=laranja. Timestamps visiveis. Scroll com max-height |

---

## Etapa 5 — Pagina Principal

`src/pages/admin/ConversationAnalysisPage.tsx`

Composicao:
1. Barra topo: filtro periodo + botao "Processar conversas" + badge pendentes
2. KPIs (8 cards em grid)
3. Graficos (funil + donuts lado a lado)
4. Tabela detalhada paginada
5. Estado vazio com CTA para processar

---

## Etapa 6 — Rota + Menu

**storeAdminRoutes.tsx**: Adicionar lazy import + rota `/dashboard/analise-comercial` protegida para store_admin/master_admin.

**AdminSidebar.tsx**: Apos linha 641 (fim do bloco whatsapp_chat), adicionar condicionado a `hasModule('commercial_analysis')`:
```
{ title: 'Analise Comercial', url: '/dashboard/analise-comercial', icon: TrendingUp, group: 'WhatsApp' }
```

---

## Arquivos (14 total)

| Arquivo | Acao |
|---------|------|
| Migration SQL | Criar |
| `supabase/functions/analyze-whatsapp-conversations/index.ts` | Criar |
| `supabase/config.toml` | Editar |
| `src/hooks/useConversationAnalysis.ts` | Criar |
| `src/hooks/useAnalyzeConversations.ts` | Criar |
| `src/hooks/useConversationMessages.ts` | Criar |
| `src/components/admin/conversation-analysis/AnalysisKPIs.tsx` | Criar |
| `src/components/admin/conversation-analysis/AnalysisFunnel.tsx` | Criar |
| `src/components/admin/conversation-analysis/AnalysisCharts.tsx` | Criar |
| `src/components/admin/conversation-analysis/AnalysisTable.tsx` | Criar |
| `src/components/admin/conversation-analysis/ConversationDetailModal.tsx` | Criar |
| `src/pages/admin/ConversationAnalysisPage.tsx` | Criar |
| `src/components/admin/AdminSidebar.tsx` | Editar |
| `src/routes/storeAdminRoutes.tsx` | Editar |
