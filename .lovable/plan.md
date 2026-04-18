

## Status atual e próximo passo

### O que já foi feito
A RPC consolidada **já existe** como `get_order_detail(_order_id)` (migration `20260418001132`) e já está em uso no `OrderDetailDialog.tsx`. Ela retorna pedido + itens + adicionais + cliente + roles em uma única query JSONB. Não precisa recriar — apenas validar que está sendo usada em todos os pontos que abrem detalhe de pedido.

### Diagnóstico: o que ainda pode travar o banco

Mesmo com a RPC consolidada, sobram 3 vetores de pressão no pool de conexões:

1. **Realtime sem throttle no `NewOrdersContext`** — cada INSERT/UPDATE em `orders` dispara um refetch completo. Se chegam 5 eventos em 2s (ex: pedido criado + 4 updates de status), são 5 queries em sequência.
2. **Queries paralelas no carregamento da OrdersPage** — `fetchOrders` + `useDashboardOrders` + `NewOrdersContext` ainda rodam simultaneamente ao montar a página, cada uma puxando `orders` com filtros diferentes.
3. **Falta de Optimistic UI** — ações de Aceitar/Cancelar/Avançar fazem UPDATE + refetch. O refetch é redundante porque o Realtime vai trazer a mudança de qualquer forma.

### Plano: Bloco C — Blindagem final contra saturação

**1. Throttle/Debounce no Realtime (`NewOrdersContext.tsx`)**
- Agrupar eventos Realtime em janelas de 500ms
- Um único refetch por janela, mesmo que cheguem 10 eventos
- Reduz picos de 5-10 queries/seg para 1-2 queries/seg

**2. Optimistic UI (`OrdersPage.tsx`)**
- Aceitar/Cancelar/Avançar: atualizar estado local imediatamente após o UPDATE
- Remover refetch manual pós-ação (Realtime sincroniza)
- Elimina ~3 queries por interação

**3. Unificar fonte de pedidos**
- Remover duplicação entre `fetchOrders` (página) e `NewOrdersContext` (badge)
- Contexto vira **única fonte de verdade**; página consome via hook
- Reduz de 3 queries simultâneas no mount para 1

**4. Auditar usos da RPC `get_order_detail`**
- Garantir que **todos** os modais/páginas que abrem pedido usem a RPC (não queries separadas)
- Buscar referências a `from('orders').select(...items...customer...)` e migrar

### Arquivos
- `src/contexts/NewOrdersContext.tsx` — throttle Realtime, virar fonte única
- `src/pages/admin/OrdersPage.tsx` — Optimistic UI, consumir do contexto
- `src/hooks/useDashboardOrders.ts` — verificar se ainda é necessário ou pode ser removido
- Componentes que abrem detalhe de pedido — auditar uso da RPC

### Resultado esperado
Pool de conexões usa **1-2 slots** mesmo com 5 abas abertas + Realtime ativo + ações simultâneas. `/agendar` continua respondendo mesmo sob carga máxima do admin.

Nenhuma funcionalidade é alterada — apenas reduzida a quantidade de queries disparadas.

