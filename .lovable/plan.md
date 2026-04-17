

## Diagnóstico ampliado: travamento global afeta /agendar/{slug} também

### Por que /agendar travou junto

A página `/agendar/barbearia-jeferson-dias` é **pública** (sem login) e faz queries a `stores`, `professionals`, `services`, `bookings` (para calcular slots disponíveis) via Supabase. Quando o **pool de conexões do Postgres satura** por causa da cascata de queries do dashboard de pedidos (mesmo banco, mesmo pool), **todas as outras requisições — públicas ou autenticadas — entram em fila e dão timeout**.

Resumindo: não é o `/agendar` que está lento. É o **banco que está congestionado** porque o frontend do admin está disparando dezenas de queries simultâneas + Realtime + polling, e isso consome slots do pool compartilhado. Cliente público paga o preço.

### Plano consolidado (Fases 0 → 4 + Fase 5 nova)

**Fase 0 — Remover iFood** (já aprovado)
- Desativar todas as chamadas a hooks/serviços iFood em OrdersPage, contexto e dashboard
- Arquivos preservados, apenas não invocados

**Fase 1 — Otimização de queries do dashboard** (resolve ~80%)
- `OrdersPage.fetchOrders`: colunas explícitas (sem JSONBs pesados), filtro `created_at >= now() - 48h`, `LIMIT 100`
- Remover `setInterval` 30s redundante da própria página
- Manter Realtime + 1 polling fallback de 120s

**Fase 2 — Optimistic UI**
- Aceitar/Cancelar/Avançar pedido: atualizar estado local imediato, sem refetch completo
- Confiar no Realtime para sincronizar dispositivos

**Fase 3 — Limpeza de JS**
- Trocar `setInterval(1000ms)` do `soundPlayer` por `addEventListener('storage')` + evento custom
- Singleton de áudio (eliminar 2 loops paralelos)
- Guard contra subscriptions Realtime duplicadas

**Fase 4 — Hardening DB**
- Consolidar políticas RLS de `orders` (várias SELECT → uma única) — reduz CPU do Postgres
- `LIMIT` defensivo em queries de dashboard
- Confirmar índice composto `(store_id, created_at DESC)`

**Fase 5 — NOVA: Proteger rotas públicas (`/agendar`, `/loja`, `/r/{slug}`)**
- Garantir uso de **Public Secure Views** (`public_stores`, `public_professionals`, `public_services`) — leitura mais leve, sem avaliar RLS row-by-row
- Adicionar `LIMIT` defensivo nas queries de slots de agendamento
- Cache de 60s em memória (React Query `staleTime`) para dados estáticos da loja (nome, foto, descrição) — evita refetch a cada navegação
- Slots disponíveis: usar RPC consolidada (uma query) em vez de N queries (uma por dia/profissional)

### Como /agendar deixa de quebrar quando o admin trava

Com Fase 1 + 4 + 5:
- Pool de conexões para de saturar (admin usa 1-2 slots em vez de 10+)
- `/agendar` consome conexões mínimas (views otimizadas + cache)
- Mesmo se o admin abrir 5 abas, `/agendar` continua respondendo

### Ordem de execução

**Bloco A (impacto imediato)**: Fase 0 + Fase 1 + Fase 5 — você testa: abre admin no celular E `/agendar/barbearia-jeferson-dias` em outro dispositivo simultaneamente.

**Bloco B (refinamento)**: Fase 2 + Fase 3 + Fase 4.

### Arquivos
- `src/pages/OrdersPage.tsx` (Fase 0, 1, 2)
- `src/contexts/NewOrdersContext.tsx` (Fase 0, 1, 3)
- `src/hooks/useOrderPolling.ts`, `src/hooks/useDashboardOrders.ts` (Fase 1)
- `src/utils/soundPlayer.ts` + alertas (Fase 3)
- Páginas de `/agendar/{slug}` e hooks de slots (Fase 5)
- Migration SQL: consolidar RLS de `orders`, criar/ajustar views públicas, RPC de slots (Fase 4, 5)

Nenhuma funcionalidade é removida. iFood fica dormente.

