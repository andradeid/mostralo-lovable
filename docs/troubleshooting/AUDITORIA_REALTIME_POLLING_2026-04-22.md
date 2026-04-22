# Auditoria de Realtime vs Polling

Data: 2026-04-22
Status da revisão: atualizado após as migrações já feitas em `Store`, `IFoodIntegrationPage`, `BookingCalendarPage`, `ProfessionalAgenda`, `useComandas`, `useOrderTracking`, `useNeedsHumanAlert`, `usePaymentRequests`, `usePasswordCalls` e `usePublicPasswordCalls`.

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

1. `src/pages/admin/WhatsAppChatPage.tsx`
2. `src/components/whatsapp-chat/ChatWindow.tsx`
3. `src/components/master-whatsapp-chat/MasterChatWindow.tsx`

### O que acabou de sair de Realtime nesta etapa

1. **`src/hooks/useOrderTracking.ts`**
   - Situação atual: **sem Realtime**
   - Método atual: polling adaptativo por status e visibilidade
   - Intervalos:
     - pedido ativo visível: `8s`
     - pedido ativo em segundo plano: `20s`
     - pedido finalizado visível: `60s`
   - Observação: mantém toast local quando o status muda entre snapshots

2. **`src/hooks/useNeedsHumanAlert.ts`**
   - Situação atual: **sem Realtime**
   - Método atual: polling curto com diff local das conversas `needs_human`
   - Intervalos:
     - visível: `5s`
     - oculto: `20s`
   - Observação: mantém som e toast ao detectar nova conversa pendente

3. **`src/hooks/usePaymentRequests.tsx`**
   - Situação atual: **sem Realtime**
   - Método atual: polling adaptativo + refetch imediato após mutações locais
   - Intervalos:
     - visível: `10s`
     - oculto: `30s`

4. **`src/hooks/usePasswordCalls.ts`**
   - Situação atual: **sem Realtime**
   - Método atual: polling curto com diff local da primeira chamada
   - Intervalos:
     - visível: `3s`
     - oculto: `10s`
   - Observação: continua preenchendo `latestCall` para animação/destaque

5. **`src/hooks/usePublicPasswordCalls.ts`**
   - Situação atual: **sem Realtime**
   - Método atual: polling curto com diff local e popup temporizado
   - Intervalos:
     - visível: `2.5s`
     - oculto: `10s`
   - Observação: mantém popup de destaque quando entra nova chamada

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
- **Situação atual:** migrado para polling adaptativo
- **Método atual:**
  - pedido ativo: `8s`
  - aba oculta: `20s`
  - status final: `60s`
- **Impacto da migração:** médio
  - cliente percebe pequeno atraso nas mudanças de etapa
  - simplifica bastante o hook
  - reduz dependência de subscribe/status/reconnect
- **Recomendação:** manter como está e só recalibrar intervalos se houver reclamação de atraso no tracking

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
- **Situação atual:** migrado para polling por loja
- **Método atual:**
  - `5s` visível / `20s` oculto
  - diff local entre snapshots para disparar som/toast
- **Impacto da migração:** médio
  - o alerta deixa de ser instantâneo
  - reduz um canal por loja no módulo WhatsApp
- **Recomendação:** manter fora de Realtime; isso ajuda a isolar o WhatsApp aberto como possível fonte do problema

### 3) `src/hooks/usePasswordCalls.ts`

- **Tabela / evento:** `password_calls` / `INSERT` e `DELETE`
- **O que faz hoje:**
  - atualiza o painel interno quando uma senha/pedido/mesa é chamada
  - destaca a última chamada para animação
  - recarrega ao apagar histórico
- **Por que existe:**
  - manter a percepção de chamada imediata no painel operacional
- **Classificação:** Estado Vivo local de fila/chamada
- **Situação atual:** migrado para polling curto
- **Método atual:**
  - `3s` visível / `10s` oculto
  - diff local para detectar nova chamada e preencher `latestCall`
- **Impacto da migração:** médio a alto
  - perda de imediatismo visual
  - experiência continua funcional se a tolerância for alguns segundos
- **Recomendação:** manter monitorado em operação real para validar tolerância de atraso no painel interno

### 4) `src/hooks/usePublicPasswordCalls.ts`

- **Tabela / evento:** `password_calls` / `INSERT` e `DELETE`
- **O que faz hoje:**
  - atualiza a tela pública/kiosk de chamadas
  - exibe popup quando chega uma nova chamada
  - mantém histórico recente
- **Por que existe:**
  - avisar clientes rapidamente em senhas, pedidos ou mesas chamadas
- **Classificação:** Estado Vivo público
- **Situação atual:** migrado para polling muito curto
- **Método atual:**
  - `2.5s` visível / `10s` oculto
  - diff local para acionar popup de destaque
- **Impacto da migração:** médio a alto
  - atraso perceptível no popup
  - continua viável se a operação aceitar atraso curto
- **Recomendação:** já migrado; observar se o atraso do popup continua aceitável na operação real

### 5) `src/hooks/usePaymentRequests.tsx`

- **Tabela / evento:** `payment_requests` / `*`
- **O que faz hoje:**
  - atualiza lista de solicitações de pagamento de entregadores
  - recalcula pendências
  - mostra toast quando chega nova solicitação
- **Por que existe:**
  - refletir rapidamente pedidos de pagamento do entregador no painel administrativo e no app do entregador
- **Classificação:** operação administrativa sensível, mas não conversa viva
- **Situação atual:** migrado para polling adaptativo
- **Método atual:**
  - `10s` visível / `30s` oculto
  - refetch imediato após criar/aprovar/rejeitar
- **Impacto da migração:** baixo a médio
  - pode haver pequeno atraso para aparecer nova solicitação
  - baixa pressão sobre UX comparado a chat
- **Recomendação:** manter como está; baixo risco e boa redução de canais

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

### Grupo único restante — WhatsApp em tempo real

1. `src/pages/admin/WhatsAppChatPage.tsx`
2. `src/components/whatsapp-chat/ChatWindow.tsx`
3. `src/components/master-whatsapp-chat/MasterChatWindow.tsx`

**Motivo:**
- são os pontos mais “Estado Vivo” do sistema
- remover Realtime aqui muda claramente a sensação de chat
- são justamente os pontos que você quer manter para monitorar se o problema do sistema está concentrado no WhatsApp

---

## Estratégia recomendada para zerar Realtime sem quebrar a operação

### Fase atual — sistema quase todo sem Realtime

- manter sem Realtime:
  - `useOrderTracking.ts`
  - `useNeedsHumanAlert.ts`
  - `usePaymentRequests.tsx`
  - `usePasswordCalls.ts`
  - `usePublicPasswordCalls.ts`

### Fase seguinte — monitorar o WhatsApp isolado

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
- `WhatsAppChatPage.tsx`
- `ChatWindow.tsx`
- `MasterChatWindow.tsx`

### Confirmação importante sobre o WhatsApp

No estado atual do código, **o Realtime do WhatsApp só existe nos módulos do próprio WhatsApp quando essas telas estão abertas/instanciadas**:

- `WhatsAppChatPage.tsx` mantém Realtime da lista de conversas e broadcast de typing do chat da loja
- `ChatWindow.tsx` mantém Realtime da conversa aberta do chat da loja
- `MasterChatWindow.tsx` mantém Realtime da conversa aberta do chat master

Além disso, o alerta `useNeedsHumanAlert.ts` **não usa mais Realtime**, então o bloco residual de websocket ficou concentrado no chat WhatsApp em si.

### Leitura técnica final

Se a meta é **estabilidade + previsibilidade de carga**, o caminho está correto.

Se a meta é **zerar Realtime de tudo**, isso é plenamente possível, mas os pontos que mais sentirão a troca são:

- acompanhamento vivo de pedido
- chamadas de senha/fila
- WhatsApp aberto (lista, typing e mensagens)

Ou seja: o sistema continua funcional sem Realtime, mas a diferença entre uma migração boa e uma migração ruim está em **onde aceitar atraso de segundos e onde isso machuca a operação/percepção do usuário**.
