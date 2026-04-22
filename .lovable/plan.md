
Objetivo: mapear por que ainda existe Realtime em `IFoodIntegrationPage.tsx`, `Store.tsx`, `BookingCalendarPage.tsx` e `ProfessionalAgenda.tsx`, qual o impacto de remover, e qual estratégia adotar para migrar para polling sem quebrar operação.

1. Estado atual encontrado no código

- `src/pages/admin/integrations/IFoodIntegrationPage.tsx`
  - Ainda abre um canal Realtime em `ifood_events_log` por `store_id`.
  - Só ativa se `useModuleEnabled('ifood_integration')` retornar `true`.
  - Ao receber `INSERT`, chama `refetchEvents()`.
- `src/hooks/useIFoodIntegration.ts`
  - Além do Realtime da página, já existe polling automático de 30s via edge function `ifood-webhook`.
  - Esse polling só roda se:
    - módulo iFood estiver habilitado
    - integração estiver ativa
    - existir token válido
- `src/pages/admin/OrdersPage.tsx`
  - Já existe comentário explícito: `iFood DESATIVADO` e o polling de eventos iFood foi removido dali.
  - Isso indica que a integração foi despriorizada no fluxo operacional principal, mas a tela administrativa de iFood ainda ficou parcialmente viva.
- `src/pages/Store.tsx`
  - Abre um canal Realtime na tabela `stores`, filtrado por `slug`.
  - Escuta `UPDATE` para atualizar `business_hours`.
  - Uso real: refletir rapidamente mudança de “serviço pausado”/horário da loja pública sem o cliente precisar recarregar a página.
- `src/pages/admin/BookingCalendarPage.tsx`
  - Abre canal Realtime em `bookings` por `store_id`.
  - Em qualquer `INSERT/UPDATE/DELETE`, chama `refetchBookings()`.
  - Uso real: atualizar agenda administrativa automaticamente.
- `src/pages/professional/ProfessionalAgenda.tsx`
  - Abre canal Realtime em `bookings` por `professional_id`.
  - Invalida query de agenda e mostra toast em novo agendamento.
  - Uso real: profissional receber novo agendamento quase em tempo real.

2. Leitura funcional simples: por que cada tela usa Realtime hoje

- iFood
  - Motivo original: mostrar eventos novos do iFood assim que chegassem.
  - Situação atual: isso perdeu sentido operacional se a integração está desativada no produto.
  - Observação importante: hoje a tela ainda tem código ativo porque o módulo pode continuar habilitado em alguma loja/plano, então tecnicamente o código “pode funcionar”, mas deixou de ser prioridade do sistema.
- Loja pública (`Store.tsx`)
  - Motivo: quando o admin pausa atendimento ou altera disponibilidade, o visitante na loja pública vê a mudança sem reload.
  - Não é caso crítico de segundos, mas melhora consistência da vitrine.
- Agenda admin (`BookingCalendarPage.tsx`)
  - Motivo: equipe administrativa ver novas reservas, remarcações e cancelamentos automaticamente.
  - É “semi-crítico”: atraso pequeno costuma ser aceitável.
- Agenda do profissional (`ProfessionalAgenda.tsx`)
  - Motivo: profissional ver novos agendamentos sem atualizar manualmente.
  - É mais sensível que a loja pública, mas ainda tolera pequeno atraso se o polling for bem desenhado.

3. Impacto prático de remover o Realtime dessas 4 telas

- `IFoodIntegrationPage.tsx`
  - Baixíssimo risco.
  - Se remover, a tela pode virar “consulta sob demanda” + botão atualizar + polling opcional só quando a aba de eventos estiver aberta.
- `Store.tsx`
  - Risco baixo.
  - Sem Realtime, a vitrine pública pode demorar alguns segundos para refletir:
    - pausa de atendimento
    - retomada de atendimento
    - mudanças em `business_hours`
- `BookingCalendarPage.tsx`
  - Risco baixo a médio.
  - Sem Realtime, a equipe pode ver novos agendamentos alguns segundos depois.
  - Se o polling for de 10–15s e só com página visível, o impacto operacional tende a ser pequeno.
- `ProfessionalAgenda.tsx`
  - Risco médio.
  - O profissional pode não ver instantaneamente uma reserva recém-criada.
  - Ainda assim, 10–15s costuma ser aceitável para agenda, desde que exista:
    - aviso visual de última atualização
    - botão atualizar
    - refetch imediato após ações locais

4. Realtime vs Polling explicado de forma simples

Regra prática:
- Realtime = conexão aberta o tempo todo esperando eventos.
- Polling = pergunta de tempos em tempos “mudou alguma coisa?”.

Comparação simples:

```text
Realtime
- Vantagem: reage na hora
- Custo: mantém canal aberto, reconexões, estado de socket, fan-out
- Melhor para: eventos vivos e urgentes

Polling
- Vantagem: mais previsível e controlável
- Custo: faz consultas periódicas mesmo sem mudança
- Melhor para: telas operacionais que toleram atraso pequeno
```

5. O que é mais pesado: canal aberto ou polling?

Não existe resposta única; depende de quantidade de usuários, frequência e quantidade de telas abertas.

Em cenário como o seu:
- Muitos canais abertos espalhados em várias telas costumam ser mais perigosos para estabilidade.
- O problema não é só “um canal”.
- O problema é:
  - várias abas abertas
  - vários usuários
  - reconexões
  - múltiplas subscriptions por tabela/área
  - cada evento disparando refetch completo

Ou seja:
- Um único polling bem controlado por área costuma ser mais previsível.
- Realtime demais em telas não críticas tende a sair mais caro operacionalmente do que polling setorizado.

6. Quando Realtime costuma valer a pena

Manter Realtime faz sentido para:
- novos pedidos
- chats
- KDS
- estados realmente “ao vivo”
- rastreamento que o cliente está olhando em tempo real

Pela política já registrada no projeto:
- “Estado vivo” = Realtime
- histórico/configuração/telas administrativas = polling ou busca sob demanda

As 4 telas analisadas se encaixam assim:
- `IFoodIntegrationPage.tsx`: não deveria ter Realtime hoje
- `Store.tsx`: pode migrar
- `BookingCalendarPage.tsx`: pode migrar
- `ProfessionalAgenda.tsx`: pode migrar com cuidado

7. Centralizar polling por setores é um bom caminho?

Sim, esse é o caminho mais saudável.

Exemplo simples:
- setor pedidos → 1 estratégia
- setor agendamentos → 1 estratégia
- setor integrações → 1 estratégia
- setor loja pública → 1 estratégia

Isso é melhor do que cada página inventar seu próprio Realtime.

Modelo recomendado:

```text
Pedidos
- prioridade alta
- pode manter Realtime ou polling curto
- escopo: somente telas operacionais

Agendamentos
- polling de 10s a 15s
- só com aba visível
- refetch imediato após criar/editar/cancelar

Loja pública
- polling de 30s a 60s
- somente enquanto página aberta
- opcional: refetch ao voltar foco para a aba

Integrações desativadas
- sem Realtime contínuo
- refresh manual
- polling apenas durante inspeção
```

8. Melhor caminho para o seu caso

Fase 1 — remover primeiro o que tem menor risco
- `IFoodIntegrationPage.tsx`
  - remover Realtime
  - manter apenas refresh manual
  - se necessário, polling curto só na aba “Eventos” e somente enquanto aberta
- `Store.tsx`
  - trocar Realtime por polling leve de 30s–60s
  - também atualizar ao voltar foco para a aba

Fase 2 — migrar agendas
- `BookingCalendarPage.tsx`
  - trocar Realtime por polling setorial de 10s–15s
  - pausar quando aba estiver oculta
  - manter refetch imediato após ações locais
- `ProfessionalAgenda.tsx`
  - mesmo padrão da agenda admin
  - opcionalmente com intervalo um pouco menor quando estiver na visão “dia”

Fase 3 — padronizar arquitetura
- criar um padrão único de polling controlado por:
  - visibilidade da aba
  - foco da janela
  - setor funcional
  - criticidade da tela
- evitar que cada página abra seus próprios canais sem necessidade

9. Resultado esperado após a migração

- menos conexões abertas
- menos risco de saturação por subscriptions espalhadas
- comportamento mais previsível
- manutenção mais simples
- perda pequena de imediatismo em telas onde isso é aceitável
- preservação de Realtime apenas onde realmente gera valor

10. Trabalho de implementação proposto

1. Auditar se o módulo `ifood_integration` está efetivamente ativo em alguma loja e desligar o Realtime da tela de iFood.
2. Substituir em `Store.tsx` o canal por polling leve com atualização em foco/visibilidade.
3. Substituir em `BookingCalendarPage.tsx` o canal por polling de agenda com pausa em aba oculta.
4. Substituir em `ProfessionalAgenda.tsx` pelo mesmo padrão de agenda.
5. Criar um utilitário/hook comum para polling setorizado, evitando lógica duplicada.
6. Validar impacto visual e operacional nas quatro telas para garantir que nada essencial perdeu atualização.

Detalhes técnicos

- Evidências do código:
  - `IFoodIntegrationPage.tsx`: canal `ifood_events_${storeId}` em `ifood_events_log`
  - `Store.tsx`: canal `store-${slug}` em `stores`
  - `BookingCalendarPage.tsx`: canal `bookings-realtime-${storeId}` em `bookings`
  - `ProfessionalAgenda.tsx`: canal `professional-bookings-realtime-${professional.id}` em `bookings`
- Política já existente no projeto:
  - Realtime exclusivo para “estado vivo”
  - dashboards/configuração/histórico devem priorizar polling otimizado
- Ordem mais segura de remoção:
  - iFood → Store → Booking admin → Professional agenda
