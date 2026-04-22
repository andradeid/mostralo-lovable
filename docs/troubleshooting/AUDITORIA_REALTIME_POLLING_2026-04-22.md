# Auditoria de Realtime vs Polling

Data: 2026-04-22

## Objetivo

Mapear onde o frontend ainda usa Supabase Realtime, por que usa, se pode ser migrado para polling e qual o impacto esperado dessa mudança.

## Política atual do projeto

Segundo a memória arquitetural do projeto, o Realtime deve ficar restrito a eventos de **Estado Vivo**:

- novos pedidos
- chats
- mudanças de status

Dados de configuração, histórico e telas administrativas de consulta devem preferir **fetch sob demanda** ou **polling otimizado**.

## Resumo executivo

### O que já foi migrado para polling

1. **Pedidos novos no painel**
   - Arquivo: `src/contexts/NewOrdersContext.tsx`
   - Situação atual: **sem Realtime**
   - Método atual: polling adaptativo (`15s` em aba visível / `60s` em aba oculta)

2. **KDS / cozinha**
   - Arquivo: `src/hooks/useKitchenDisplay.ts`
   - Situação atual: **sem Realtime**
   - Método atual: polling adaptativo (`10s` visível / `30s` em background)

3. **Convites de entregador**
   - Arquivo: `src/hooks/useDriverInvitations.tsx`
   - Situação atual: **Realtime desativado e comentado**
   - Método atual: fetch manual

### O que ainda usa Realtime

Na auditoria atual, os pontos ativos encontrados no frontend foram:

1. `src/hooks/useComandas.ts`
2. `src/hooks/useOrderTracking.ts`
3. `src/pages/Store.tsx`
4. `src/pages/admin/integrations/IFoodIntegrationPage.tsx`
5. `src/hooks/usePublicPasswordCalls.ts`
6. `src/hooks/usePasswordCalls.ts`
7. `src/hooks/useNeedsHumanAlert.ts`
8. `src/pages/admin/WhatsAppChatPage.tsx`
9. `src/components/whatsapp-chat/ChatWindow.tsx`
10. `src/components/master-whatsapp-chat/MasterChatWindow.tsx`
11. `src/pages/admin/BookingCalendarPage.tsx`
12. `src/pages/professional/ProfessionalAgenda.tsx`

### Ocorrência sem impacto operacional

- `src/pages/admin/TechnicalDocsPage.tsx`
  - Contém **apenas exemplo de documentação** mostrando uma subscription antiga.
  - Não afeta runtime de produção.

## Inventário completo

### 1) `src/pages/Store.tsx`

- **Tabela/evento:** `stores` / `UPDATE`
- **Uso atual:** atualizar `business_hours` em tempo real na loja pública
- **Por que existe:** refletir imediatamente pausa manual da loja ou mudança de horário
- **Classificação:** **configuração operacional**, não é Estado Vivo crítico
- **Pode migrar para polling?** **Sim**
- **Polling sugerido:** `30s` a `60s` somente com a página aberta
- **Impacto da migração:** baixo
  - cliente pode ver atraso de alguns segundos para perceber que a loja abriu/fechou
  - reduz conexões persistentes desnecessárias em página pública
- **Recomendação:** **migrar**

### 2) `src/hooks/useComandas.ts`

- **Tabela/evento:** `comandas` / `*`
- **Uso atual:** sincronizar alterações de comandas entre operadores/PDV
- **Por que existe:** múltiplos operadores podem abrir/fechar/editar comandas simultaneamente
- **Classificação:** Estado Vivo operacional, mas não tão sensível quanto chat
- **Pode migrar para polling?** **Sim**
- **Polling sugerido:** `10s` a `20s` em tela ativa; `30s` a `60s` em background
- **Impacto da migração:** médio
  - atraso na sincronização entre caixas/garçons
  - risco de sensação de defasagem em operação simultânea
  - menor consumo de websocket e menor pressão em reconnect
- **Recomendação:** **migrar se a prioridade for estabilidade máxima**

### 3) `src/hooks/useOrderTracking.ts`

- **Tabela/evento:** `orders` / `UPDATE`
- **Uso atual:** atualizar a tela de acompanhamento do cliente quando o status do pedido muda
- **Por que existe:** feedback quase instantâneo de `entrada` → `em_preparo` → `saiu_entrega` → `entregue`
- **Classificação:** Estado Vivo claro
- **Pode migrar para polling?** **Sim**
- **Polling sugerido:** `10s` a `15s` para pedido ativo; `30s` após status final
- **Impacto da migração:** médio
  - cliente verá o status com pequeno atraso
  - menos fluidez para notificações imediatas de mudança de etapa
  - em compensação simplifica o hook e reduz variabilidade de conexão
- **Recomendação:** **migrar se o objetivo for zerar Realtime**

### 4) `src/pages/admin/integrations/IFoodIntegrationPage.tsx`

- **Tabela/evento:** `ifood_events_log` / `INSERT`
- **Uso atual:** atualizar a tela de integração conforme novos eventos chegam
- **Por que existe:** observabilidade operacional do conector iFood
- **Classificação:** monitoramento administrativo
- **Pode migrar para polling?** **Sim**
- **Polling sugerido:** `10s` a `30s` enquanto a página estiver aberta
- **Impacto da migração:** baixo
  - eventos continuam aparecendo, só não instantaneamente
  - quase nenhum impacto funcional fora da UX de inspeção
- **Recomendação:** **migrar**

### 5) `src/hooks/usePasswordCalls.ts`

- **Tabela/evento:** `password_calls` / `INSERT` e `DELETE`
- **Uso atual:** painel interno de chamadas de senha/comanda/fila
- **Por que existe:** refletir nova chamada imediatamente e destacar a última chamada
- **Classificação:** Estado Vivo local
- **Pode migrar para polling?** **Sim**
- **Polling sugerido:** `2s` a `5s` em painel ativo
- **Impacto da migração:** médio a alto
  - o painel pode demorar alguns segundos para exibir a senha recém-chamada
  - piora um pouco experiência de painel/TV/caixa
  - ainda é viável se houver tolerância a atraso curto
- **Recomendação:** **migrar apenas se o objetivo for eliminar 100% do Realtime**

### 6) `src/hooks/usePublicPasswordCalls.ts`

- **Tabela/evento:** `password_calls` / `INSERT` e `DELETE`
- **Uso atual:** tela pública de exibição de chamadas com popup/realce
- **Por que existe:** avisar clientes rapidamente quando a senha é chamada
- **Classificação:** Estado Vivo público
- **Pode migrar para polling?** **Sim**
- **Polling sugerido:** `2s` a `5s` em modo kiosk/tela pública
- **Impacto da migração:** médio a alto
  - o aviso visual perde imediatismo
  - pode haver atraso perceptível em operação de fila
- **Recomendação:** **manter só se a fila exigir resposta quase instantânea; caso contrário, migrar**

### 7) `src/hooks/useNeedsHumanAlert.ts`

- **Tabela/evento:** `whatsapp_conversations` / `UPDATE`
- **Uso atual:** detectar quando uma conversa passa a exigir atendimento humano
- **Por que existe:** reduzir tempo de resposta do atendente quando o bot pede escalonamento
- **Classificação:** Estado Vivo de triagem
- **Pode migrar para polling?** **Sim**
- **Polling sugerido:** `5s` a `10s`, preferencialmente acoplado ao polling de conversas
- **Impacto da migração:** médio
  - handoff humano fica menos imediato
  - menor chance de explosão de canais em lojas com muito atendimento
- **Recomendação:** **migrar junto com o módulo de chat se a decisão for padronizar tudo em polling**

### 8) `src/pages/admin/WhatsAppChatPage.tsx`

- **Canais/eventos:**
  - broadcast `typing-presence`
  - `whatsapp_conversations` / `*`
- **Uso atual:**
  - mostrar indicador de digitação do cliente
  - atualizar lista de conversas em tempo real
- **Por que existe:** UX de atendimento semelhante a mensageria viva
- **Classificação:** Estado Vivo crítico para chat
- **Pode migrar para polling?** **Sim**
- **Polling sugerido:**
  - conversas: `3s` a `5s`
  - digitação: **remover**, não vale polling
- **Impacto da migração:** alto na UX, baixo na integridade
  - lista de conversas fica alguns segundos atrasada
  - indicador de digitação praticamente deixa de fazer sentido
  - reduz muito complexidade e custo de conexão
- **Recomendação:**
  - **migrar lista de conversas para polling** se a meta for estabilidade
  - **remover typing presence** em vez de tentar simular por polling

### 9) `src/components/whatsapp-chat/ChatWindow.tsx`

- **Tabela/evento:**
  - `whatsapp_chat_messages` / `*`
  - `whatsapp_conversation_cycles` / `*`
- **Uso atual:** atualizar mensagens e ciclos da conversa aberta em tempo real
- **Por que existe:** chat operacional vivo para atendimento humano
- **Classificação:** Estado Vivo crítico
- **Pode migrar para polling?** **Sim**
- **Polling sugerido:** `2s` a `4s` quando a conversa estiver aberta; `10s` fora de foco
- **Impacto da migração:** alto
  - atrasos perceptíveis no recebimento/envio refletido na UI
  - sensação de chat menos responsivo
  - aumento de queries frequentes se o intervalo for muito curto
- **Recomendação:** **decisão estratégica**
  - manter Realtime se o WhatsApp for central para a operação
  - migrar se a prioridade absoluta for reduzir gargalo e conexões persistentes

### 10) `src/components/master-whatsapp-chat/MasterChatWindow.tsx`

- **Tabela/evento:** `master_whatsapp_chat_messages` / `*`
- **Uso atual:** chat do ambiente master em tempo real
- **Por que existe:** mesma motivação do chat operacional
- **Classificação:** Estado Vivo crítico
- **Pode migrar para polling?** **Sim**
- **Polling sugerido:** `2s` a `4s` com aba ativa
- **Impacto da migração:** alto
  - mesma perda de responsividade do chat principal
- **Recomendação:** mesma do chat normal

### 11) `src/pages/admin/BookingCalendarPage.tsx`

- **Tabela/evento:** `bookings` / `*`
- **Uso atual:** atualizar agenda administrativa automaticamente
- **Por que existe:** refletir novos agendamentos, remarcações e cancelamentos rapidamente
- **Classificação:** Estado Vivo operacional
- **Pode migrar para polling?** **Sim**
- **Polling sugerido:** `10s` a `15s`
- **Impacto da migração:** médio
  - atraso pequeno na atualização da agenda
  - menor risco de canais simultâneos em contas com muitos profissionais
- **Recomendação:** **migrar**

### 12) `src/pages/professional/ProfessionalAgenda.tsx`

- **Tabela/evento:** `bookings` / `*`
- **Uso atual:** atualizar agenda individual do profissional
- **Por que existe:** mostrar novos agendamentos e mudanças rapidamente
- **Classificação:** Estado Vivo operacional
- **Pode migrar para polling?** **Sim**
- **Polling sugerido:** `10s` a `15s`
- **Impacto da migração:** médio
  - profissional pode demorar alguns segundos a ver nova marcação
- **Recomendação:** **migrar**

## Classificação consolidada

### Migrar primeiro (baixo risco)

1. `src/pages/Store.tsx`
2. `src/pages/admin/integrations/IFoodIntegrationPage.tsx`
3. `src/pages/admin/BookingCalendarPage.tsx`
4. `src/pages/professional/ProfessionalAgenda.tsx`

### Migrar em seguida (risco controlado)

5. `src/hooks/useComandas.ts`
6. `src/hooks/useOrderTracking.ts`
7. `src/hooks/useNeedsHumanAlert.ts`

### Migrar por último ou com decisão de produto

8. `src/hooks/usePasswordCalls.ts`
9. `src/hooks/usePublicPasswordCalls.ts`
10. `src/pages/admin/WhatsAppChatPage.tsx`
11. `src/components/whatsapp-chat/ChatWindow.tsx`
12. `src/components/master-whatsapp-chat/MasterChatWindow.tsx`

## Gargalos prováveis ao manter Realtime

Os maiores candidatos a gargalo não são os pontos simples de admin, e sim os módulos com maior frequência de eventos e maior número de canais simultâneos:

1. **WhatsApp Chat**
   - mensagens em tempo real
   - lista de conversas em tempo real
   - presença/digitação via broadcast

2. **Painéis operacionais em múltiplas abas/dispositivos**
   - comandas
   - bookings
   - password calls

3. **Páginas públicas com canal aberto sem necessidade forte**
   - `Store.tsx`

## Impacto arquitetural de trocar tudo para polling

### Benefícios

- menos conexões websocket persistentes
- menos reconexões e menos variação por instabilidade de rede
- menos complexidade de lifecycle (`subscribe`, `removeChannel`, status de canal)
- comportamento mais previsível para diagnóstico e monitoramento
- menor chance de pressão no pool e no ecossistema Realtime do Supabase

### Custos

- atualizações deixam de ser instantâneas
- polling agressivo pode aumentar volume de queries se mal calibrado
- chat e filas perdem sensação de tempo real
- telas públicas/operacionais podem apresentar atraso perceptível

## Estratégia recomendada se a meta for zerar Realtime

### Fase 1 — Remoções simples

- `Store.tsx`
- `IFoodIntegrationPage.tsx`
- `BookingCalendarPage.tsx`
- `ProfessionalAgenda.tsx`

### Fase 2 — Fluxos operacionais moderados

- `useComandas.ts`
- `useOrderTracking.ts`
- `useNeedsHumanAlert.ts`

### Fase 3 — Fluxos sensíveis

- `usePasswordCalls.ts`
- `usePublicPasswordCalls.ts`
- `WhatsAppChatPage.tsx`
- `ChatWindow.tsx`
- `MasterChatWindow.tsx`

## Recomendação final

Se o objetivo principal é **estabilidade e redução de gargalo**, a melhor decisão técnica é:

1. **remover imediatamente o Realtime que não é Estado Vivo crítico**
2. **migrar bookings, tracking e comandas para polling adaptativo**
3. **tratar chat/typing/password-calls como decisão de produto**, porque a perda de imediatismo será visível

Se a diretriz for realmente **“tirar Realtime de tudo”**, isso é plenamente possível, mas os módulos que mais sentirão a troca serão:

- WhatsApp Chat
- chamadas de senha/fila
- acompanhamento vivo de pedido

Nesses casos, o sistema continuará funcional, porém com atraso controlado em vez de atualização instantânea.