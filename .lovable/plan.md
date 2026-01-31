# Plano: Bot Tipo Assistant + Destaque Visual das Abas

## ✅ IMPLEMENTADO

### Resumo das Mudanças

1. **Abas com destaque laranja** - `src/components/ui/tabs.tsx`
   - Aba ativa agora tem fundo laranja (#f97316) e texto branco

2. **master-faq-agent atualizado** - Edge function com todas as tools
   - `get_plans`, `calculate_savings`, `get_testimonials` (Vendas)
   - `get_bonus_tiers`, `calculate_commission` (Recrutamento)
   - `search_faq`, `get_store_info`, `get_system_status` (Suporte)

3. **master-bot-sync atualizado** - Agora usa tipo `assistant`
   - Cria OpenAI Assistant via API com tools específicas por bot
   - Envia `assistantId` e `functionUrl` para Evolution API
   - Salva `openai_assistant_id` no banco para cada bot

4. **Colunas no banco** - Migration executada
   - `sales_openai_assistant_id`
   - `recruitment_openai_assistant_id`
   - `support_openai_assistant_id`

### Fluxo Atual (Igual ao Bot das Lojas)

```
1. Frontend solicita sync
       ↓
2. master-bot-sync cria/atualiza OpenAI Assistant
   - Com tools: get_plans, calculate_savings, etc.
   - Recebe assistantId
       ↓
3. Monta payload para Evolution API
   - botType: 'assistant'
   - assistantId: do passo 2
   - functionUrl: master-faq-agent
       ↓
4. Envia para Evolution /openai/create/{instance}
       ↓
5. Quando usuário manda mensagem:
   - Evolution chama OpenAI Assistant
   - Se precisa de dados, chama functionUrl
   - master-faq-agent executa e retorna dados
   - Assistant responde com dados reais
```

### Arquivos Modificados

| Arquivo | Status |
|---------|--------|
| `src/components/ui/tabs.tsx` | ✅ Destaque laranja |
| `supabase/functions/master-faq-agent/index.ts` | ✅ Tools completas |
| `supabase/functions/master-bot-sync/index.ts` | ✅ Tipo assistant |
| `supabase/config.toml` | ✅ Já registrado |
| `master_whatsapp_config` | ✅ Colunas adicionadas |
