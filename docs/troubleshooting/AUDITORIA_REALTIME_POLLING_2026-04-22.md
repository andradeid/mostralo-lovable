# Auditoria de Realtime vs Polling

Data: 2026-04-22
Status da revisão: atualizado após as migrações já feitas em `Store`, `IFoodIntegrationPage`, `BookingCalendarPage`, `ProfessionalAgenda` e `useComandas`.

## Objetivo

Mapear onde o frontend ainda usa Supabase Realtime, o que cada uso faz, o que já foi removido, o que ainda precisa ser ajustado para o sistema ficar sem Realtime e qual o impacto esperado por módulo.

## Política atual do projeto

Segundo a memória arquitetural do projeto, o Realtime deve ficar restrito a eventos de **Estado Vivo**:

- chats
- typing/presença
- mudanças realmente instantâneas de operação

Dados de configuração, histórico, monitoramento administrativo e telas tolerantes a atraso curto devem preferir **fetch sob demanda** ou **polling otimizado**.

---

## Resumo executivo atualizado

### O que já saiu de Realtime

1. **`src/pages/Store.tsx`**
   - Situação atual: **sem Realtime**
   - Método atual: polling leve para `business_hours` / `delivery_config`
   - Objetivo: refletir status da loja pública sem manter websocket aberto

2. **`src/pages/admin/integrations/IFoodIntegrationPage.tsx`**
   - Situação atual: **sem Realtime**
   - Método atual: polling somente na aba de eventos e somente com página visível
   - Objetivo: observabilidade operacional sem canal persistente

3. **`src/pages/admin/BookingCalendarPage.tsx`**
   - Situação atual: **sem Realtime**
   - Método atual: polling setorial de `15s` com página visível
   - Objetivo: agenda administrativa atualizada sem canal por loja

4. **`src/pages/professional/ProfessionalAgenda.tsx`**
   - Situação atual: **sem Realtime**
   - Método atual: polling via React Query (`15s` quando visível)
   - Objetivo: agenda do profissional sem canal individual

5. **`src/hooks/useComandas.ts`**
   - Situação atual: **sem Realtime**
   - Método atual:
     - lista de comandas: `10s` visível / `60s` oculto
     - aprovações pendentes: `15s` visível / `60s` oculto
     - detalhe da comanda aberta: `8s` visível / `30s` oculto
   - Objetivo: sincronização operacional por polling adaptativo + invalidação imediata após mutações locais

### O que continua com Realtime ativo

Na revisão atual do código, os pontos ainda ativos no runtime são:

1. `src/hooks/useOrderTracking.ts`
2. `src/hooks/useNeedsHumanAlert.ts`
3. `src/hooks/usePasswordCalls.ts`
4. `src/hooks/usePublicPasswordCalls.ts`
5. `src/hooks/usePaymentRequests.tsx`
6. `src/pages/admin/WhatsAppChatPage.tsx`
7. `src/components/whatsapp-chat/ChatWindow.tsx`
8. `src/components/master-whatsapp-chat/MasterChatWindow.tsx`

### Ocorrências sem impacto de produção

- `src/pages/admin/TechnicalDocsPage.tsx`
  - contém apenas exemplo de código/documentação
  - **não roda como subscription operacional do sistema**

- `src/hooks/useDriverInvitations.tsx`
  - Realtime está comentado/desativado
  - método atual: fetch manual

---

## Inventário atualizado: o que cada Realtime faz no sistema

### 1) `src/hooks/useOrderTracking.ts`

- **Tabela / evento:** `orders` / `UPDATE`
- **O que faz hoje:**
  - acompanha mudança de status de um pedido específico
  - atualiza a UI do tracking do cliente quase em tempo real
  - dispara toast local quando o status muda
- **Por que existe:**
  - manter a experiência de acompanhamento vivo do pedido
- **Classificação:** Estado Vivo do cliente
- **Situação atual:** ainda usa Realtime como principal e polling de fallback (`30s`) só quando o canal falha
- **Pode migrar para polling?** Sim
- **Estratégia recomendada:** polling por fase do pedido
  - pedido ativo: `8s`
  - aba oculta: `20s`
  - status final: desligar ou reduzir fortemente
- **Impacto ao migrar:** médio
  - cliente percebe pequeno atraso nas mudanças de etapa
  - simplifica bastante o hook
  - reduz dependência de subscribe/status/reconnect
- **Recomendação:** migrar na próxima leva controlada

### 2) `src/hooks/useNeedsHumanAlert.ts`

- **Tabela / evento:** `whatsapp_conversations` / `UPDATE`
- **O que faz hoje:**
  - detecta quando uma conversa passa para `needs_human = true`
  - adiciona conversa nos pendentes
  - toca som imediatamente
  - mostra toast do alerta
  - remove da fila quando `needs_human` volta para `false`
- **Por que existe:**
  - reduzir tempo de resposta no handoff bot → humano
- **Classificação:** triagem viva, mas não é chat aberto em si
- **Situação atual:** ainda usa Realtime por loja
- **Pode migrar para polling?** Sim
- **Estratégia recomendada:**
  - polling curto apenas das colunas mínimas da conversa
  - `5s` visível / `20s` oculto
  - diff local entre snapshot anterior e atual para disparar som/toast
- **Impacto ao migrar:** médio
  - o alerta deixa de ser instantâneo
  - reduz um canal por loja no módulo WhatsApp
- **Recomendação:** migrar antes do chat aberto

### 3) `src/hooks/usePasswordCalls.ts`

- **Tabela / evento:** `password_calls` / `INSERT` e `DELETE`
- **O que faz hoje:**
  - atualiza o painel interno quando uma senha/pedido/mesa é chamada
  - destaca a última chamada para animação
  - recarrega ao apagar histórico
- **Por que existe:**
  - manter a percepção de chamada imediata no painel operacional
- **Classificação:** Estado Vivo local de fila/chamada
- **Situação atual:** Realtime opcional, mas a tela de gestão usa `realtime: true`
- **Pode migrar para polling?** Sim
- **Estratégia recomendada:**
  - polling curto `3s` a `5s`
  - diff local para detectar nova chamada e preencher `latestCall`
- **Impacto ao migrar:** médio a alto
  - perda de imediatismo visual
  - experiência continua funcional se a tolerância for alguns segundos
- **Recomendação:** migrar depois dos fluxos moderados

### 4) `src/hooks/usePublicPasswordCalls.ts`

- **Tabela / evento:** `password_calls` / `INSERT` e `DELETE`
- **O que faz hoje:**
  - atualiza a tela pública/kiosk de chamadas
  - exibe popup quando chega uma nova chamada
  - mantém histórico recente
- **Por que existe:**
  - avisar clientes rapidamente em senhas, pedidos ou mesas chamadas
- **Classificação:** Estado Vivo público
- **Situação atual:** ainda usa Realtime
- **Pode migrar para polling?** Sim
- **Estratégia recomendada:**
  - polling muito curto `2s` a `3s`
  - diff local para acionar popup de destaque
- **Impacto ao migrar:** médio a alto
  - atraso perceptível no popup
  - continua viável se a operação aceitar atraso curto
- **Recomendação:** decisão de produto; migrar só depois dos módulos menos sensíveis

### 5) `src/hooks/usePaymentRequests.tsx`

- **Tabela / evento:** `payment_requests` / `*`
- **O que faz hoje:**
  - atualiza lista de solicitações de pagamento de entregadores
  - recalcula pendências
  - mostra toast quando chega nova solicitação
- **Por que existe:**
  - refletir rapidamente pedidos de pagamento do entregador no painel administrativo e no app do entregador
- **Classificação:** operação administrativa sensível, mas não conversa viva
- **Situação atual:** ainda usa Realtime por loja ou por entregador
- **Pode migrar para polling?** Sim
- **Estratégia recomendada:**
  - `10s` visível / `30s` ou `60s` oculto
  - refetch imediato após criar/aprovar/rejeitar
- **Impacto ao migrar:** baixo a médio
  - pode haver pequeno atraso para aparecer nova solicitação
  - baixa pressão sobre UX comparado a chat
- **Recomendação:** candidato forte a migrar também, apesar de não estar na auditoria inicial

### 6) `src/pages/admin/WhatsAppChatPage.tsx`

- **Canais / eventos:**
  - broadcast `typing-presence`
  - `whatsapp_conversations` / `*`
- **O que faz hoje:**
  - mostra indicador de digitação/presença do cliente
  - mantém lista de conversas atualizada
  - reordena lista por última mensagem
  - atualiza seleção da conversa quando o registro muda
- **Por que existe:**
  - dar UX de mensageria viva ao atendente
- **Classificação:** chat operacional
- **Situação atual:** ainda usa Realtime para lista + typing broadcast
- **Pode migrar para polling?** Parcialmente
- **Estratégia recomendada:**
  - **lista de conversas:** migrar para polling `5s`
  - **typing/presença:** remover se a meta for zerar Realtime; não vale simular com polling
- **Impacto ao migrar:** alto na UX, baixo na integridade
  - lista fica alguns segundos atrasada
  - typing deixa de existir
  - reduz um dos blocos mais caros em canais simultâneos
- **Recomendação:** arquitetura híbrida ou migração gradual por partes

### 7) `src/components/whatsapp-chat/ChatWindow.tsx`

- **Tabelas / eventos:**
  - `whatsapp_chat_messages` / `*`
  - `whatsapp_conversation_cycles` / `*`
- **O que faz hoje:**
  - atualiza mensagens do chat aberto em tempo real
  - atualiza edição/status/reflexo de mensagens
  - atualiza ciclos da conversa
- **Por que existe:**
  - chat humano vivo de atendimento
- **Classificação:** Estado Vivo crítico
- **Situação atual:** ainda usa Realtime por conversa aberta
- **Pode migrar para polling?** Sim, tecnicamente
- **Estratégia recomendada:**
  - se quiser zerar Realtime: polling `2s` a `4s` quando a conversa estiver aberta
  - `8s` a `10s` fora de foco
  - paginação continua como hoje
- **Impacto ao migrar:** alto
  - o chat perde responsividade percebida
  - maior risco de aumentar queries se mal calibrado
- **Recomendação:** esse deve ser um dos últimos a migrar, ou até permanecer em Realtime por decisão de produto

### 8) `src/components/master-whatsapp-chat/MasterChatWindow.tsx`

- **Tabela / evento:** `master_whatsapp_chat_messages` / `*`
- **O que faz hoje:**
  - atualiza mensagens do chat master em tempo real
  - reflete inserts e updates da conversa aberta
- **Por que existe:**
  - mesma necessidade do chat operacional, mas no ambiente master
- **Classificação:** Estado Vivo crítico
- **Situação atual:** ainda usa Realtime por conversa aberta
- **Pode migrar para polling?** Sim
- **Estratégia recomendada:** polling `2s` a `4s` na conversa aberta
- **Impacto ao migrar:** alto
  - mesma perda de fluidez do chat principal
- **Recomendação:** deixar por último

---

## O que já foi validado como ajustado

### Remoções concluídas e coerentes com a política do projeto

#### `src/pages/Store.tsx`
- **Antes:** Realtime em `stores`
- **Agora:** polling leve via snapshot público
- **Validação:** condiz com “configuração operacional”, não com Estado Vivo crítico
- **Avaliação:** ajuste correto

#### `src/pages/admin/integrations/IFoodIntegrationPage.tsx`
- **Antes:** Realtime de eventos do iFood
- **Agora:** polling só na aba certa e com página visível
- **Validação:** tela administrativa de monitoramento, não exige websocket
- **Avaliação:** ajuste correto

#### `src/pages/admin/BookingCalendarPage.tsx`
- **Antes:** Realtime em `bookings`
- **Agora:** polling de `15s`
- **Validação:** agenda tolera atraso curto
- **Avaliação:** ajuste correto

#### `src/pages/professional/ProfessionalAgenda.tsx`
- **Antes:** Realtime em `bookings`
- **Agora:** polling de `15s`
- **Validação:** agenda individual tolera atraso curto
- **Avaliação:** ajuste correto

#### `src/hooks/useComandas.ts`
- **Antes:** Realtime em `comandas`
- **Agora:** polling adaptativo + invalidações locais + detalhe da comanda com polling próprio
- **Validação:** fluxo operacional continua estável sem canal websocket
- **Avaliação:** ajuste correto e bem alinhado com o objetivo de reduzir conexões

---

## O que ainda precisa ser feito para ficar sem Realtime

### Grupo 1 — próximo passo mais seguro

1. `src/hooks/useOrderTracking.ts`
2. `src/hooks/useNeedsHumanAlert.ts`
3. `src/hooks/usePaymentRequests.tsx`

**Motivo:**
- são fluxos importantes, mas ainda migráveis sem destruir a UX central do sistema
- reduzem canais sem atacar primeiro o núcleo conversacional do WhatsApp

### Grupo 2 — sensíveis à percepção de tempo real

4. `src/hooks/usePasswordCalls.ts`
5. `src/hooks/usePublicPasswordCalls.ts`

**Motivo:**
- continuam migráveis
- mas o atraso fica perceptível na chamada de senhas/pedidos

### Grupo 3 — decisão de produto / arquitetura híbrida

6. `src/pages/admin/WhatsAppChatPage.tsx`
7. `src/components/whatsapp-chat/ChatWindow.tsx`
8. `src/components/master-whatsapp-chat/MasterChatWindow.tsx`

**Motivo:**
- são os pontos mais “Estado Vivo” do sistema
- remover Realtime aqui muda claramente a sensação de chat

---

## Estratégia recomendada para zerar Realtime sem quebrar a operação

### Fase 1 — terminar os fluxos moderados

- migrar `useOrderTracking.ts`
- migrar `useNeedsHumanAlert.ts`
- migrar `usePaymentRequests.tsx`

### Fase 2 — migrar os painéis de chamada

- migrar `usePasswordCalls.ts`
- migrar `usePublicPasswordCalls.ts`

### Fase 3 — decidir o WhatsApp

**Opção A — híbrido permanente**
- lista de conversas em polling
- alertas `needs_human` em polling
- chat aberto e typing continuam em Realtime

**Opção B — zerar Realtime de verdade**
- lista de conversas em polling curto
- typing removido
- conversa aberta em polling muito curto
- master chat em polling muito curto

---

## Impacto arquitetural de zerar Realtime

### Benefícios

- menos conexões websocket persistentes
- menos reconexões e menos variabilidade por instabilidade de rede
- menos complexidade de lifecycle (`subscribe`, `removeChannel`, status de canal)
- comportamento mais previsível para diagnóstico e monitoramento
- menor chance de pressão no ecossistema Realtime do Supabase

### Custos

- atualizações deixam de ser instantâneas
- polling agressivo pode aumentar volume de queries se for mal calibrado
- chat e chamadas públicas perdem sensação de tempo real
- módulos conversacionais passam a exigir mais cuidado com intervalos e diff local

---

## Conclusão atualizada

Hoje o sistema **já avançou bastante** na remoção de Realtime dos módulos administrativos e operacionais tolerantes a atraso.

### Já está certo e alinhado
- `Store.tsx`
- `IFoodIntegrationPage.tsx`
- `BookingCalendarPage.tsx`
- `ProfessionalAgenda.tsx`
- `useComandas.ts`

### Ainda faltam para ficar sem Realtime
- `useOrderTracking.ts`
- `useNeedsHumanAlert.ts`
- `usePaymentRequests.tsx`
- `usePasswordCalls.ts`
- `usePublicPasswordCalls.ts`
- `WhatsAppChatPage.tsx`
- `ChatWindow.tsx`
- `MasterChatWindow.tsx`

### Leitura técnica final

Se a meta é **estabilidade + previsibilidade de carga**, o caminho está correto.

Se a meta é **zerar Realtime de tudo**, isso é plenamente possível, mas os pontos que mais sentirão a troca são:

- acompanhamento vivo de pedido
- chamadas de senha/fila
- WhatsApp aberto (lista, typing e mensagens)

Ou seja: o sistema continua funcional sem Realtime, mas a diferença entre uma migração boa e uma migração ruim está em **onde aceitar atraso de segundos e onde isso machuca a operação/percepção do usuário**.
