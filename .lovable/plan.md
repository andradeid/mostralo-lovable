

# Plano: Limpeza SQL + Auto-conclusão 48h + Confirmação manual + Fix build

## Etapa 0 — Fix build error

**Arquivo:** `src/components/whatsapp-chat/ChatHeader.tsx`

- Instalar `@radix-ui/react-visually-hidden` via package.json, OU substituir o import por um `<span className="sr-only">` nativo do Tailwind (mais simples, sem dependência extra).
- Abordagem escolhida: trocar `<VisuallyHidden.Root>` por `<span className="sr-only">` e remover o import.

---

## Etapa 1 — SQL de limpeza imediata

Executar via ferramenta de insert do Supabase:

```sql
UPDATE orders 
SET status = 'concluido', updated_at = now()
WHERE status NOT IN ('concluido', 'cancelado');
```

---

## Etapa 2 — Edge Function `auto-complete-orders`

**Novo arquivo:** `supabase/functions/auto-complete-orders/index.ts`

- Usa `SUPABASE_SERVICE_ROLE_KEY` para bypass de RLS.
- Calcula cutoff = `now() - 48 horas`.
- Para pedidos normais (`scheduled_for IS NULL`): marca como `concluido` se `created_at < cutoff`.
- Para pedidos agendados (`scheduled_for IS NOT NULL`): marca como `concluido` se `scheduled_for < cutoff`.
- Filtra apenas pedidos com status diferente de `concluido` e `cancelado`.
- Retorna contagem de pedidos atualizados.

**Agendamento pg_cron** (via insert tool):

```sql
SELECT cron.schedule(
  'auto-complete-orders-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/auto-complete-orders',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vc2h3dndwanRudm5kb2tiZmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3OTY2NzYsImV4cCI6MjA3MTM3MjY3Nn0.RkppC11I7QW8n8Fdx5FOyjlX_yE1kOFGUlzb3xpphEA"}'::jsonb,
    body:='{"source":"cron"}'::jsonb
  ) AS request_id;
  $$
);
```

---

## Etapa 3 — Edge Function `customer-confirm-delivery`

**Novo arquivo:** `supabase/functions/customer-confirm-delivery/index.ts`

- Recebe `{ customer_token, store_id, order_id }`.
- Valida token via `customer_tokens` (mesma lógica de `customer-orders`).
- Verifica que o pedido pertence ao `customer_id` retornado e está em status `em_transito` ou `aguarda_retirada`.
- Atualiza para `status = 'concluido'`, `completed_at = now()`, `updated_at = now()`.
- Retorna sucesso ou erro adequado.

---

## Etapa 4 — Botão "Confirmar Recebimento" na página do cliente

**Arquivo:** `src/pages/CustomerOrdersPage.tsx`

- Importar `CheckCircle` do lucide-react e `AlertDialog` components.
- Adicionar estado `confirmingOrderId` para controlar qual pedido está sendo confirmado.
- No card de cada pedido, quando `status === 'em_transito' || status === 'aguarda_retirada'`, exibir botão "Confirmar Recebimento" (verde, com ícone CheckCircle).
- O botão abre um AlertDialog de confirmação antes de chamar a edge function.
- Ao confirmar, chama `supabase.functions.invoke('customer-confirm-delivery', { body: { customer_token, store_id, order_id } })`.
- Em caso de sucesso, atualiza o pedido localmente para `concluido` e exibe toast de sucesso.
- O `onClick` do botão usa `e.stopPropagation()` para não navegar ao detalhe do pedido.

---

## Arquivos criados/editados

| Arquivo | Ação |
|---------|------|
| `src/components/whatsapp-chat/ChatHeader.tsx` | Fix: trocar VisuallyHidden por sr-only |
| `supabase/functions/auto-complete-orders/index.ts` | Criar |
| `supabase/functions/customer-confirm-delivery/index.ts` | Criar |
| `src/pages/CustomerOrdersPage.tsx` | Editar: adicionar botão confirmar |

