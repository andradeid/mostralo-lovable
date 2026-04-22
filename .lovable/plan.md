
Objetivo: remover o Realtime apenas de `src/hooks/useComandas.ts`, sem criar um hook genérico novo agora, mantendo o fluxo operacional de comandas estável e previsível.

Escopo fechado desta etapa

- Arquivo principal:
  - `src/hooks/useComandas.ts`
- Impacto indireto validado nas telas que consomem esse hook:
  - `src/pages/admin/ComandasPage.tsx`
  - `src/pages/admin/ComandaDetailPage.tsx`
  - `src/hooks/usePDV.ts`

Diagnóstico atual

- `useComandas.ts` hoje mistura duas estratégias:
  - React Query com polling lento de 120s
  - Realtime em `comandas` com invalidação global da lista
- O canal atual escuta `event: '*'` na tabela `comandas` por `store_id`.
- Isso significa que qualquer mudança relevante gera refresh da lista inteira.
- O detalhe da comanda (`useComandaDetail`) não usa Realtime próprio.
- A consistência hoje depende muito de invalidação após ações locais:
  - criar comanda
  - adicionar item
  - remover item
  - fechar comanda
  - cancelar comanda
- `pendingApprovalsByComanda` também já usa polling de 120s e pode continuar sem Realtime.

Decisão técnica

Não criar `useSectorPolling` agora.

Motivo:
- para comandas, o problema está concentrado em um único hook já bem delimitado;
- criar uma base compartilhada neste momento aumenta escopo e abstração antes de provar a necessidade;
- o melhor caminho agora é fazer uma migração local, explícita e fácil de medir.

Estratégia final para comandas

```text
Lista de comandas
→ polling adaptativo simples dentro do próprio useComandas

Detalhe da comanda aberta
→ polling próprio mais curto, só quando houver comanda aberta

Ações locais do usuário
→ continuam forçando refetch/invalidate imediatos

Sem websocket
→ remove channel Supabase de comandas
```

Plano completo de execução

1. Remover o Realtime de `useComandas.ts`

Remover:
- `debouncedRefetchRef`
- `debouncedRefetch`
- `useEffect` que cria `channel('comandas-realtime-${storeId}')`
- `supabase.removeChannel(channel)`

Resultado:
- nenhuma assinatura websocket para `comandas`
- fim do fan-out de eventos dessa tabela nesse módulo

2. Trocar o polling da lista por polling operacional realista

Ajustar a query principal `['comandas', storeId]`:

De:
- `refetchInterval: 120000`

Para:
- quando módulo ativo:
  - aba visível: 10000 ms
  - aba oculta: 60000 ms

Sem criar hook novo:
- usar o `usePageVisibility` já existente
- calcular `refetchInterval` diretamente dentro de `useComandas`

Comportamento esperado:
- tela aberta no uso normal: atualização a cada 10s
- aba em segundo plano: cai para 60s
- reduz carga sem deixar a operação “cega”

3. Ajustar a query de aprovações pendentes

A query `['pending-approvals', storeId]` hoje busca:
- `comanda_id` de itens com `requires_approval = true` e `approved_at is null`

Plano:
- manter separada
- trocar polling de 120s para:
  - visível: 15000 ms
  - oculto: 60000 ms

Motivo:
- esse dado é importante, mas não precisa mesma frequência da lista principal

4. Fortalecer o detalhe da comanda sem Realtime

Hoje `useComandaDetail(comandaId)`:
- busca a comanda
- busca seus itens
- não tem polling

Problema após remover Realtime:
- se outro operador alterar a comanda, a tela de detalhe pode ficar desatualizada por tempo demais

Plano:
- adicionar polling apenas quando houver `comandaId`
- intervalos:
  - visível: 8000 ms
  - oculto: false ou 30000 ms
- condicionar pelo status:
  - se comanda estiver `open`, mantém polling curto
  - se estiver `closed` ou `cancelled`, desacelerar ou desligar

Forma prática:
- primeira versão segura:
  - `enabled: !!comandaId`
  - visível: 8000 ms
  - oculto: 30000 ms
- otimização opcional depois:
  - parar polling quando status final

5. Preservar atualização imediata após ações locais

Esse ponto é obrigatório para não piorar UX.

Manter e revisar invalidações em:
- `createComandaMutation`
- `addItemMutation`
- `removeItemMutation`
- `closeComandaMutation`
- `cancelComandaMutation`

Ajustes recomendados:
- garantir invalidate/refetch de:
  - `['comandas', storeId]`
  - `['comanda', comandaId]` quando aplicável
  - `['pending-approvals', storeId]` quando item puder afetar aprovação
- em `addItemMutation`, além do detalhe, manter atualização da lista
- em `removeItemMutation`, idem
- em fechamento/cancelamento, a lista precisa refletir imediatamente sem esperar o próximo ciclo

6. Revisar o fluxo de detalhe que depende de aprovação

Em `ComandaDetailPage.tsx`, `handleApprovalChange` já faz:
- invalidate `['comanda', id]`
- invalidate `['pending-approvals']`
- `refetchComandas()`

Plano:
- manter esse comportamento
- se possível, padronizar para invalidar `['pending-approvals', storeId]` em vez de chave ampla
- isso evita refresh desnecessário

7. Garantir compatibilidade com as telas consumidoras

Impactos esperados por tela:

`ComandasPage.tsx`
- continua funcionando sem mudança estrutural
- lista aberta/hoje/todas passará a depender só do polling + mutações locais

`ComandaDetailPage.tsx`
- passa a receber atualização periódica própria
- continua atualizando imediatamente após ações do operador

`usePDV.ts`
- continua funcionando porque já encadeia ações locais:
  - cria comanda
  - adiciona itens
  - fecha comanda
- como cada mutation já invalida/refaz dados, não depende de Realtime

8. Intervalos finais recomendados

```text
Lista de comandas
- visível: 10s
- oculta: 60s

Pendências de aprovação
- visível: 15s
- oculta: 60s

Detalhe da comanda aberta
- visível: 8s
- oculta: 30s
```

Por que esses números:
- 10s para lista: bom equilíbrio entre operação e carga
- 15s para aprovações: suficiente para painel/cartões
- 8s no detalhe: a tela mais sensível operacionalmente merece ficar mais responsiva

9. O que não vamos fazer nesta etapa

Para manter escopo controlado, não vamos:
- criar hook genérico compartilhado
- migrar `comanda_items` com canal separado
- mexer em outras telas/módulos fora de comandas
- introduzir feature flags agora, a menos que você queira rollout por loja

10. Riscos e mitigação

Risco 1: operador perceber atraso na lista
- Mitigação: polling de 10s + invalidate imediato após ações locais

Risco 2: detalhe da comanda ficar desatualizado ao editar em outro terminal
- Mitigação: polling próprio no `useComandaDetail`

Risco 3: aumento de query no banco
- Mitigação:
  - reduzir frequência em background
  - manter escopo só no módulo de comandas
  - não fazer polling agressivo em tudo ao mesmo tempo

Risco 4: aprovações demorarem a refletir nos cards
- Mitigação: polling separado de 15s + invalidation manual após aprovação

11. Ordem de implementação

Passo 1
- editar `useComandas.ts`
- remover subscription Realtime

Passo 2
- ligar `usePageVisibility` no próprio hook
- ajustar `refetchInterval` da lista e aprovações

Passo 3
- adicionar polling ao `useComandaDetail`

Passo 4
- revisar invalidações das mutations para garantir consistência imediata

Passo 5
- validar fluxos:
  - abrir comanda
  - adicionar item
  - remover item
  - aprovar item
  - fechar comanda
  - cancelar comanda
  - abrir mesma comanda em duas abas e confirmar atualização por polling

Resultado esperado

- `useComandas.ts` deixa de depender de Realtime
- o módulo continua operacionalmente estável
- a carga fica mais previsível
- a migração é local, explícita e fácil de reverter
- sem abstração genérica prematura

Detalhes técnicos

- Remover o bloco de `channel('comandas-realtime-${storeId}')` e o debounce de invalidation.
- Importar `usePageVisibility` em `useComandas.ts`.
- Aplicar `refetchInterval` dinâmico nas queries React Query já existentes.
- Adicionar `refetchInterval` também em `useComandaDetail`.
- Ajustar invalidations para usar chaves específicas:
  - `['comandas', storeId]`
  - `['comanda', comandaId]`
  - `['pending-approvals', storeId]`
