
Objetivo: migrar o restante do Realtime de forma segura, sem travar o banco, com rollout gradual por grupos e possibilidade de habilitar por partes para medir impacto real.

Resposta curta

Sim, dá para fazer por partes e esse é exatamente o jeito mais seguro.
Não é complicado conceitualmente, mas precisa separar bem o que pode virar polling direto, o que precisa de polling adaptativo e o que deve continuar em Realtime por decisão de produto.

Princípio que vamos seguir

```text
Estado realmente vivo e conversacional
→ manter Realtime por enquanto

Operação tolerante a atraso de alguns segundos
→ migrar para polling visível/adaptativo

Histórico/configuração
→ polling lento ou busca sob demanda
```

Base técnica já confirmada no projeto

- A política do projeto já diz que Realtime deve ficar só para “estado vivo”.
- A infraestrutura já privilegia redução agressiva de websockets.
- O módulo WhatsApp foi arquitetado originalmente com Realtime, então ele entra por último.
- Já existe `usePageVisibility`, que pode virar a base do polling padronizado.

Plano completo de migração

1. Criar a base única de polling setorizado
2. Migrar o grupo de risco controlado
3. Medir impacto
4. Migrar parcialmente o grupo WhatsApp por feature flag/produto
5. Decidir o que fica permanente em polling e o que continua em Realtime

Fase 1 — Base única para evitar duplicação

Criar um hook único de polling setorizado para padronizar:

- intervalo por setor
- pausa quando aba não está visível
- execução imediata ao entrar na tela
- cleanup automático
- proteção contra chamadas concorrentes
- opção de “modo foco” e “modo background”
- possibilidade de desligar por módulo/flag

Estrutura sugerida:

```ts
useSectorPolling({
  enabled,
  intervalMs,
  backgroundIntervalMs,
  runImmediately,
  pauseWhenHidden,
  onPoll,
  key,
})
```

Regras do hook:
- se a página estiver visível, usa o intervalo principal
- se estiver oculta, pausa ou usa um intervalo bem maior
- não roda se já houver uma execução em andamento
- permite `refetch()` manual
- registra `lastRunAt` para futura observabilidade leve

Resultado:
- uma regra só para Store, Booking, Comandas, Tracking e alertas derivados
- menos risco de cada tela inventar um polling diferente

Fase 2 — Migrar “risco controlado”

1) `src/hooks/useComandas.ts`

Estado atual
- hoje já usa React Query com polling de 2 minutos
- ainda mantém canal Realtime em `comandas`
- esse canal invalida query inteira

Leitura de impacto
- comanda é operação importante, mas não exige atualização em milissegundos
- atraso de 5s a 15s costuma ser aceitável
- como já existe polling, a migração é natural

Plano
- remover a subscription Realtime da tabela `comandas`
- trocar o polling atual de 120s por polling adaptativo:
  - tela visível: 10s a 15s
  - tela oculta: 60s a 120s
- manter invalidação imediata após ações locais:
  - criar comanda
  - adicionar item
  - remover item
  - fechar/cancelar
- separar duas frequências:
  - lista de comandas abertas: mais frequente
  - aprovações pendentes: 15s a 30s
- avaliar se `useComandaDetail` também precisa de polling leve quando a página do detalhe estiver aberta

Recomendação
- começar com:
  - comandas abertas: 10s
  - aprovações pendentes: 15s
  - background: 60s

2) `src/hooks/useOrderTracking.ts`

Estado atual
- usa Realtime no pedido
- só cai para polling de 30s se o Realtime falhar

Leitura de impacto
- é uma tela pública e importante para confiança do cliente
- mas ainda tolera pequeno atraso, desde que bem desenhado
- não precisa socket aberto o tempo todo se o pedido estiver estável

Plano
- remover a dependência do canal Realtime
- migrar para polling por fase do pedido:
  - status ativos (`entrada`, `em_preparo`, `aguarda_retirada`, `em_transito`): 5s a 10s
  - status finais (`concluido`, `cancelado`): desligar polling ou reduzir para 60s por curto período
- manter `refetch()` manual para o cliente
- preservar os toasts/notificações locais comparando status anterior vs novo status
- usar estratégia “adaptive polling”:
  - enquanto pedido está ativo: rápido
  - ao entrar em estado final: desacelerar ou parar

Recomendação
- ativo: 8s
- aba oculta: 20s ou pausa
- finalizado: parar após 1 ou 2 confirmações

3) `src/hooks/useNeedsHumanAlert.ts`

Estado atual
- carrega pendências no mount
- usa Realtime em `whatsapp_conversations` para detectar `needs_human = true`
- depois mantém só loop local de som

Leitura de impacto
- esse hook não é chat completo, mas é alerta operacional
- dá para migrar, porém com cuidado porque alerta atrasado afeta atendimento
- ainda assim é viável se o polling for curto e só na tela correta

Plano
- remover o canal Realtime
- transformar em polling focado apenas nas conversas com `needs_human = true`
- buscar somente colunas mínimas:
  - `id`
  - `contact_name`
  - `phone_number`
  - `needs_human_reason`
  - `needs_human`
- detectar diferenças entre snapshot anterior e atual:
  - novos IDs pendentes → tocar som + toast
  - IDs removidos → parar alerta local
- manter loop local de som como está
- rodar polling somente se:
  - módulo `whatsapp_chat` estiver ativo
  - usuário estiver em tela de atendimento

Recomendação
- foreground: 5s
- background: 20s ou pausa
- sem SELECT pesado e sem carregar mensagens

Fase 3 — Medição antes do grupo WhatsApp

Antes de migrar WhatsApp conversacional, validar o comportamento destes 3 módulos por alguns dias.

O que observar:
- volume de queries por loja
- tempo médio de resposta
- percepção operacional da equipe
- se algum fluxo passou a “parecer lento”
- se houve redução de canais/sockets abertos

Meta desta fase
- confirmar que polling setorial está estável antes de mexer no bloco mais sensível

Fase 4 — Grupo “migrar por último ou por decisão de produto”

1) `src/hooks/usePasswordCalls.ts`
2) `src/hooks/usePublicPasswordCalls.ts`

Leitura funcional
- isso é quase um painel de chamada ao vivo
- quando uma senha é chamada, o ideal é refletir rápido no painel público
- aqui polling é possível, mas o intervalo precisa ser curto para não perder percepção de instantaneidade

Plano
- migrar só se houver necessidade real de cortar sockets
- usar polling muito curto e barato:
  - painel público ativo: 2s a 3s
  - painel admin ativo: 3s a 5s
- otimizar busca:
  - apenas últimas N chamadas
  - ordenado por `created_at desc`
- manter popup/animação local baseado em diff entre lista anterior e nova
- para deletes, aceitar consistência eventual via refetch

Decisão recomendada
- pode migrar, mas depois dos grupos anteriores
- baixo volume de dados, porém alto impacto perceptivo na experiência

3) `src/pages/admin/WhatsAppChatPage.tsx`
4) `src/components/whatsapp-chat/ChatWindow.tsx`
5) `src/components/master-whatsapp-chat/MasterChatWindow.tsx`

Leitura funcional
- esse é o bloco mais delicado
- aqui existe chat manual, typing, presença, leitura, reações, ciclos e mensagens chegando em fluxo vivo
- pela política do projeto, chat é caso clássico de manter Realtime
- migrar tudo para polling é possível, mas muda muito a experiência

Separação correta dentro do WhatsApp

Pode dividir em duas camadas:

Camada A — pode migrar primeiro
- lista de conversas
- unread count
- status da conversa
- `needs_human`
- ordenação por `last_message_at`

Camada B — idealmente continua em Realtime
- mensagens do chat aberto
- typing/presença
- reações em tempo real
- updates muito frequentes de conversa ativa
- experiência do atendente respondendo ao vivo

Melhor caminho para “habilitar por partes”

```text
Etapa 1
Lista de conversas em polling adaptativo
Chat aberto continua Realtime

Etapa 2
Alerts needs_human em polling
Chat aberto continua Realtime

Etapa 3
Teste controlado com algumas lojas ou módulos
para reduzir também parte das atualizações do chat

Etapa 4
Decidir se vale manter híbrido permanentemente
```

Recomendação forte
- não migrar ChatWindow nem MasterChatWindow totalmente agora
- fazer arquitetura híbrida:
  - lista de conversas → polling
  - janela do chat aberta → Realtime
- isso reduz bastante conexões sem destruir a sensação de chat ao vivo

Fase 5 — Feature flags para habilitar por partes

Sim, é totalmente viável fazer rollout gradual.

Estratégia sugerida:
- criar flags por setor/módulo
- permitir ativação por loja ou globalmente
- começar desligando Realtime só em grupos específicos

Exemplo de flags:
- `polling_comandas_enabled`
- `polling_order_tracking_enabled`
- `polling_needs_human_enabled`
- `whatsapp_conversation_list_polling_enabled`
- `whatsapp_chat_window_realtime_enabled`
- `password_calls_polling_enabled`

Com isso você pode:
- testar em poucas lojas
- medir impacto real
- voltar atrás rápido sem reescrever tudo
- migrar conversa por conversa, setor por setor

Estratégia recomendada para o WhatsApp

```text
Fase A
Migrar alerts + lista de conversas

Fase B
Manter janela do chat aberta em Realtime

Fase C
Se o banco estabilizar bem, avaliar reduzir mais
sem mexer em typing/reação/mensagens ativas
```

Ordem final recomendada

Ordem 1 — agora
- `src/hooks/useComandas.ts`
- `src/hooks/useOrderTracking.ts`
- `src/hooks/useNeedsHumanAlert.ts`

Ordem 2 — depois, com rollout curto
- `src/hooks/usePasswordCalls.ts`
- `src/hooks/usePublicPasswordCalls.ts`

Ordem 3 — por decisão de produto, em modo híbrido
- `src/pages/admin/WhatsAppChatPage.tsx`
- `src/components/whatsapp-chat/ChatWindow.tsx`
- `src/components/master-whatsapp-chat/MasterChatWindow.tsx`

Arquitetura alvo

```text
Store / Booking / Comandas / Tracking / Alerts
→ polling setorial padronizado

Password calls
→ polling curto, experiência quase em tempo real

WhatsApp
→ híbrido
   - lista/painel/alertas: polling
   - conversa aberta e typing: Realtime
```

Ganhos esperados

- menos canais abertos simultaneamente
- menor risco de reconexão em massa
- menos fan-out do Realtime
- comportamento mais previsível
- rollout seguro por setor
- possibilidade real de medir impacto no banco sem ruptura

Riscos e mitigação

Risco 1: atraso perceptível em operação
- Mitigação: polling adaptativo e refetch imediato após ações locais

Risco 2: excesso de query no polling
- Mitigação:
  - filtros mínimos
  - colunas mínimas
  - pausa com aba oculta
  - intervalos por criticidade
  - desligamento por módulo inativo

Risco 3: piorar o chat
- Mitigação:
  - manter Realtime no chat aberto
  - migrar só lista/alertas primeiro

Risco 4: duplicidade de chamadas
- Mitigação:
  - hook com trava de execução concorrente
  - invalidação controlada
  - React Query onde fizer sentido

Implementação proposta

1. Criar `useSectorPolling`
2. Aplicar em `useComandas.ts`
3. Aplicar em `useOrderTracking.ts`
4. Aplicar em `useNeedsHumanAlert.ts`
5. Validar estabilidade
6. Migrar `usePasswordCalls.ts` e `usePublicPasswordCalls.ts`
7. Refatorar WhatsApp para modo híbrido
8. Introduzir flags para habilitação gradual por loja/setor
9. Medir impacto e ir ampliando aos poucos

Conclusão

Sim, podemos fazer isso e é um caminho bom.
Não é complicado se fizermos da forma certa: primeiro os módulos tolerantes a atraso, depois chamadas públicas, e por fim WhatsApp em modo híbrido.
A parte crítica não é “se dá para fazer”; é respeitar a criticidade de cada fluxo. Se fizer por etapas e com flags, você consegue reduzir risco para o banco e observar o impacto real sem quebrar a operação.

Detalhes técnicos

- `useComandas.ts`: hoje já tem polling de 120s + Realtime; é forte candidato para migração adaptativa
- `useOrderTracking.ts`: hoje depende de Realtime e só usa polling como fallback; deve virar polling por status do pedido
- `useNeedsHumanAlert.ts`: pode sair do Realtime e usar polling curto sobre pendências
- `usePasswordCalls.ts` e `usePublicPasswordCalls.ts`: migráveis, mas com polling muito curto para não perder efeito de chamada ao vivo
- `WhatsAppChatPage.tsx`, `ChatWindow.tsx`, `MasterChatWindow.tsx`: recomendação de arquitetura híbrida, não remoção total imediata do Realtime
