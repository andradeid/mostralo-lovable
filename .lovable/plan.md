
## Plano: operar sem Realtime, manter pop-up/som com segurança e criar auditoria real de travamentos

## Resposta curta
Sim, você ainda pode receber pop-up de pedido sem Realtime.
A diferença é:

- com Realtime: o aviso chega quase instantaneamente
- sem Realtime: o aviso chega na próxima rodada de polling

Então o pop-up continua possível, mas com atraso controlado.

## Como ficaria sem Realtime
### 1. Pop-up de novos pedidos
Hoje o pop-up global (`GlobalNewOrderAlert`) depende do `NewOrdersContext`, que usa Realtime no `AdminLayout`.

Sem Realtime, o plano é:
- remover a subscription global do `NewOrdersContext`
- manter um polling leve para buscar pedidos `entrada`
- comparar a lista atual com a anterior
- quando surgir um pedido novo:
  - abrir o pop-up
  - tocar som uma vez
  - marcar esse pedido como “já notificado”

Resultado:
- continua existindo pop-up
- só não será no segundo exato do pedido
- o atraso dependerá do intervalo escolhido

### 2. Tela de pedidos
A `OrdersPage` já funciona fortemente em polling via `fetchOrders()`.
Então ela é a tela mais fácil de deixar 100% sem Realtime.

Ajuste proposto:
- usar polling como fonte única
- reduzir intervalo atual de 120s para algo operacional
- detectar novos pedidos por diff entre snapshots
- manter refresh manual

### 3. KDS cozinha
O `useKitchenDisplay` ainda usa dois canais Realtime e um polling de backup.

Sem Realtime, o plano é:
- remover os dois canais
- transformar o polling no mecanismo principal
- detectar itens novos por comparação entre snapshots
- tocar som só quando surgirem novos itens pendentes

## Como evitar travamento por loop infinito de som
Esse é um ponto crítico. Hoje existe risco porque o projeto usa `playOrderAlertLoop()` em mais de um lugar, inclusive:
- `NewOrdersContext`
- `OrdersPage`

Se mantiver loop infinito, o risco de comportamento ruim continua mesmo sem Realtime.

## Estratégia recomendada para som
### Regra principal
Não usar mais loop infinito contínuo como padrão.

### Em vez disso
Usar um modelo de alerta controlado:
- tocar 1 vez quando detectar pedido novo
- opcionalmente repetir por no máximo 2 ou 3 tentativas
- parar automaticamente depois de um tempo
- nunca reiniciar o som para o mesmo pedido já notificado
- parar o som ao:
  - abrir detalhes
  - aceitar pedido
  - mudar status
  - trocar de aba/tela
  - esconder a página por muito tempo

## Comportamento ideal
```text
Novo pedido detectado
  -> toca 1 som curto
  -> abre pop-up
  -> registra orderId como notificado

Se ainda continuar em "entrada" após X segundos
  -> no máximo 1 ou 2 novos lembretes
  -> depois silencia

Ao aceitar/ver/dismiss
  -> remove da fila sonora
  -> para qualquer som pendente
```

## Proteções obrigatórias contra loops
### 1. Deduplicação por ID
Cada pedido/item precisa ter controle:
- detectado
- pop-up exibido
- som já tocado
- último toque em timestamp

### 2. Cooldown global
Mesmo chegando vários pedidos juntos:
- não tocar som a cada evento bruto
- agrupar por janela curta, ex. 2–5 segundos
- tocar uma vez para o lote

### 3. Limite de repetição
Exemplo:
- máximo 3 alertas por pedido
- intervalo mínimo de 20–30s entre lembretes
- zerar ao sair de `entrada`

### 4. Sem som em aba oculta
Quando a aba estiver oculta:
- reduzir polling
- opcionalmente não tocar loop nenhum
- deixar só badge/contagem ao voltar

## O que fazer com o pop-up global
Para máxima estabilidade, há 2 caminhos.

### Opção recomendada agora
Manter pop-up global, mas:
- abastecido por polling, não por Realtime
- sem loop infinito
- com fila simples e deduplicada

### Opção ainda mais estável
Remover o pop-up global do layout e concentrar alertas:
- badge simples na sidebar
- aviso visual apenas na tela de pedidos

Se a prioridade absoluta for parar travamentos, essa segunda opção é a mais segura.

## Auditoria real: como descobrir a causa exata do travamento
Você quer sair do “acho que é Realtime” e chegar em “é exatamente isso”.
O plano certo é criar uma auditoria em 4 camadas.

## Camada 1 — Auditoria de frontend
Objetivo: descobrir se o travamento está no navegador.

### O que medir
- long tasks
- re-renderizações excessivas
- handlers de som/notificação
- tempo gasto em listas/kanban
- quantidade de componentes reagindo por atualização

### Onde olhar
- `OrdersPage.tsx`
- `NewOrdersContext.tsx`
- `GlobalNewOrderAlert.tsx`
- `useKitchenDisplay.ts`
- `soundPlayer.ts`

### O que procurar
- múltiplos `setState` em cascata
- som reiniciando o tempo todo
- polling concorrente
- render de listas grandes sem memoização
- updates otimistas + refetch duplicado
- tela recebendo mudanças globais do layout inteiro

### Entregável
Criar uma rotina de diagnóstico para identificar:
- qual componente trava
- quanto tempo cada ciclo consome
- se o gargalo é JS/render, não banco

## Camada 2 — Auditoria de consultas
Objetivo: descobrir se o travamento vem do banco/query lenta.

### O alerta que vocês receberam
O `system-health-alert` marca “Query Time” pelo tempo total da Edge Function `system-health-check`.
Isso quer dizer:
- não aponta automaticamente qual query foi lenta
- indica só que o conjunto da coleta levou mais de 5s

Então hoje o alerta mostra sintoma, não causa raiz.

### O que precisa ser auditado
No `system-health-check`, revisar o peso de:
- conexões
- stats do banco
- realtime stats
- top tables
- chamadas RPC agregadas

### Próximo nível de auditoria
Adicionar observabilidade para capturar:
- top queries mais lentas
- tempo médio por query
- tabelas com mais seq scan
- tabelas com índice pouco usado
- queries mais chamadas
- queries que mais leem linhas para retornar pouco

## Camada 3 — Auditoria de tabelas e índices
Objetivo: saber se o banco está sofrendo por tabela sem índice ou consulta ruim.

### Verificações prioritárias
Para pedidos e cozinha, validar índices em especial sobre:
- `orders.store_id`
- `orders.status`
- `orders.created_at`
- combinações como `(store_id, status, created_at desc)`
- `order_items.order_id`
- `order_items.store_id`
- `order_items.preparation_status`
- `comanda_items.store_id`
- `comanda_items.preparation_status`

### O que medir
- seq scan alto em `orders`, `order_items`, `comanda_items`
- relação `idx_scan` x `seq_scan`
- tabelas com muito row read e pouco índice
- crescimento de linhas vivas e mortas
- consultas por range temporal sem índice adequado

### Resultado esperado
Confirmar se o problema é:
- frontend
- query
- ausência de índice
- mistura dos três

## Camada 4 — Auditoria operacional
Objetivo: entender o comportamento real de uso.

### O que observar
- quantas abas do admin ficam abertas
- quantas abas simultâneas de pedidos
- KDS aberto sem uso
- quantas pessoas usam a mesma loja ao mesmo tempo
- quantas atualizações de status por minuto
- quantos pedidos entram em rajada

### Por quê
Porque às vezes o travamento não é “uma query ruim” isolada.
É a soma de:
- várias abas
- polling + popup + som + KDS
- re-render pesado do Kanban
- browser com pouca memória

## Arquitetura recomendada para esta fase
## Fase 1 — tirar Realtime de tudo
### Arquivos principais
- `src/components/admin/AdminLayout.tsx`
- `src/contexts/NewOrdersContext.tsx`
- `src/components/admin/GlobalNewOrderAlert.tsx`
- `src/pages/admin/OrdersPage.tsx`
- `src/hooks/useKitchenDisplay.ts`

### Ação
- remover `NewOrdersProvider` do modelo baseado em subscription
- remover subscriptions do KDS
- operar apenas com polling

## Fase 2 — manter aviso sem travar
### Pop-up
- continuar existindo
- disparado por polling
- somente para pedidos novos detectados
- fila deduplicada por ID

### Som
- remover loop infinito contínuo
- usar toque único + lembretes limitados
- cooldown por lote
- deduplicação por pedido/item
- stop obrigatório em todas as ações de resolução

## Fase 3 — padronizar intervalos
### Sugestão inicial
```text
Admin geral:
  sem realtime
  polling 30-60s se houver badge global

Tela de pedidos:
  10-15s visível
  30-60s oculta

KDS:
  5-10s visível
  30s ou desligado oculta

Dashboard:
  manter 60s
```

## Fase 4 — auditoria técnica real
### Frente de app
- instrumentar pontos críticos de render e refetch
- mapear quantas vezes a tela de pedidos renderiza por ciclo
- medir custo do pop-up, badges e filtros

### Frente de banco
- ampliar dashboard de saúde para mostrar causa, não só sintoma
- listar queries lentas
- listar tabelas com alto seq scan
- evidenciar ausência de índices úteis
- revisar RPCs usadas no monitoramento

### Frente operacional
- comparar comportamento com:
  - 1 aba
  - várias abas
  - pedidos + KDS abertos
  - pico de inserções/updates

## O que muda para você no dia a dia
### Sem Realtime
- ainda recebe pop-up, mas com atraso pequeno
- ainda pode receber som, mas controlado
- muito menos chance de congelamento por cascata de eventos

### Em compensação
- não será “instantâneo absoluto”
- o KDS terá pequeno atraso
- a tela de pedidos fica mais previsível e estável

## O que provavelmente mais ajuda a parar travamentos
Ordem de impacto:

1. remover Realtime global
2. remover Realtime do KDS
3. eliminar loop infinito de som
4. deduplicar alertas/pop-ups
5. reduzir re-render da `OrdersPage`
6. revisar índices e consultas de `orders` / `order_items` / `comanda_items`
7. melhorar observabilidade para achar a causa exata

## Resultado esperado
### Curto prazo
- menos travamentos
- menos uso de memória
- menos canais ativos
- menos “engasgos” ao chegar pedido

### Médio prazo
- saber exatamente se o gargalo real era:
  - websocket/realtime
  - som/alerta
  - renderização do kanban
  - query lenta
  - tabela sem índice
  - combinação de tudo

## Implementação recomendada
Eu seguiria nesta ordem:

1. remover Realtime do `NewOrdersContext`
2. remover Realtime do `useKitchenDisplay`
3. converter pop-up global para polling com diff por IDs
4. trocar loop infinito de som por alerta controlado com cooldown
5. revisar `OrdersPage` para polling operacional e menos refetch redundante
6. ampliar auditoria de saúde do sistema para apontar causa raiz
7. revisar índices das tabelas mais sensíveis de pedidos/cozinha

## Critérios de sucesso
- zero canais Realtime de pedidos e KDS
- pop-up continua funcionando por polling
- som não entra em loop infinito
- notificações não duplicam para o mesmo pedido
- travamentos diminuem perceptivelmente
- dashboard de saúde passa a mostrar causa real, não só “query time alto”
- fica claro se o problema está no frontend, banco ou ambos
