
Achados imediatos:

- O travamento atual não é “por causa da auditoria”. Os logs mostram carga real agora:
  - `master-whatsapp-webhook`: vários `booted` em sequência e eventos `messages`
  - `uazapi-webhook`: eventos `messages` e `messages_update`
  - `track-visit`: erro `522` ao inserir em `page_visits`, que é sintoma de banco/pool saturado
- O maior problema hoje é: os webhooks ainda fazem trabalho pesado e síncrono demais antes de devolver `200 OK`, principalmente o `master-whatsapp-webhook`.

O que cada webhook recebe hoje:

1) `master-whatsapp-webhook`
- Ignora na entrada: `presence`, `presence.update`, `chats*`, `connection*`, `contacts*`, `groups*`, `labels*`, `call/calls*`, `qrcode/qr`
- Processa de fato:
  - `messages.reaction` / `reaction`
  - `messages_update` / `messages.update`
  - `messages` / `messages.upsert`

2) `uazapi-webhook`
- Também ignora na entrada: `presence`, `chats*`, `connection*`, `contacts*`, `groups*`, `labels*`, `call/calls*`, `qrcode/qr`
- Processa de fato:
  - `messages`
  - `messages_update` / `messagesUpdate`
  - `messages_reaction` / `reaction`
- O código ainda tem `case 'presence'` e `case 'connection'`, mas com o filtro atual eles deveriam morrer antes; o volume atual está vindo principalmente de `messages` e `messages_update`

Queries que cada um dispara hoje:

1) `master-whatsapp-webhook`
- Reação:
  - `master_whatsapp_config` select por `instance_name`
  - `master_whatsapp_chat_messages` select da msg alvo
  - `master_whatsapp_chat_messages` update de `reactions`
- Edição:
  - `master_whatsapp_config` select
  - `master_whatsapp_chat_messages` select da msg anterior
  - `master_whatsapp_chat_messages` update
- Mensagem normal:
  - `master_whatsapp_config` select `*`
  - `master_whatsapp_chat_messages` select dedupe por `evolution_message_id`
  - `uazapi_config` select
  - `master_whatsapp_chat_messages` select quoted msg
  - `master_whatsapp_chat_messages` insert
  - `master_whatsapp_conversations` upsert
  - `master_whatsapp_conversations` select unread
  - `master_whatsapp_conversations` update unread
  - `master_whatsapp_sessions` select sessão
  - `master_whatsapp_sessions` update pause/reactivate/lock
  - `master_whatsapp_sessions` upsert/create
  - `master_whatsapp_chat_messages` inserts das respostas do bot
  - `master_whatsapp_conversations` update final
  - `master_whatsapp_sessions` update final metadata

Ponto crítico:
- Ele faz polling da OpenAI dentro do webhook (`runs` com até ~30 polls de 2s) antes de responder.
- Isso pode segurar a request por muitos segundos e provocar retry do provedor + cold starts paralelos + mais leitura/escrita no banco.

2) `uazapi-webhook`
- Resolução de instância (`findInstance`):
  - `whatsapp_instances` select por nome
  - `whatsapp_instances` select por token
  - fallback caro: `whatsapp_instances` select de todas provider=`uazapi`
- `messages`:
  - grupos ignorados ainda fazem `webhook_logs` insert
  - story reply:
    - `findInstance`
    - `whatsapp_chat_messages` insert
    - `whatsapp_conversations` select
    - `whatsapp_conversations` update/insert
    - resposta do bot com novas queries
  - edição:
    - `findInstance`
    - `whatsapp_chat_messages` select alvo
    - `whatsapp_chat_messages` select conteúdo original
    - `whatsapp_chat_messages` update
    - `webhook_logs` insert
  - reação:
    - `findInstance`
    - `whatsapp_chat_messages` select alvo
    - `whatsapp_chat_messages` update
    - `webhook_logs` insert
  - mensagem normal:
    - `findInstance`
    - `whatsapp_instances` update telefone às vezes
    - `customers` select nome
    - `whatsapp_chat_messages` select dedupe
    - mídia: `whatsapp_instances` select token + `uazapi_config` select + upload storage
    - quoted: `whatsapp_chat_messages` select
    - `whatsapp_conversations` select pausa/manual
    - `whatsapp_chat_messages` insert
    - `whatsapp_conversations` select
    - `whatsapp_conversations` update/insert
    - `whatsapp_contacts` upsert
    - `store_bot_config` select
    - `whatsapp_conversations` select `is_bot_active`
    - `webhook_logs` insert
- `messages_update`:
  - `whatsapp_chat_messages` update status/edição
  - `webhook_logs` insert
- IA em background ainda dispara depois:
  - `stores` select chave OpenAI
  - `uazapi_config` select
  - `whatsapp_instances` select token
  - `whatsapp_chat_messages` select unread
  - `whatsapp_chat_messages` update read
  - `whatsapp_conversations` select/update metadata/thread
  - tool calls em `products`, `categories`, `stores`, `customers`
  - inserts/updates de mensagens e conversa ao responder

Diagnóstico objetivo do travamento:
- `master-whatsapp-webhook` ainda está arquiteturalmente errado para webhook: ele processa IA e polling inline.
- `uazapi-webhook` já está melhor, mas ainda faz muitas queries síncronas por evento útil.
- Ambos ainda escrevem demais em `webhook_logs`; isso vira carga extra justamente quando o banco está no limite.
- Se dois navegadores abrem dashboard/auth ao mesmo tempo, somam queries globais de sessão/perfil/roles/cliente com essas leituras/escritas dos webhooks.
- O `track-visit` falhando com `522` confirma saturação do host/pool, não problema isolado do tracking.

Plano de correção recomendado:

1. Blindagem imediata dos webhooks
- Remover `webhook_logs` para eventos de sucesso/rotina; manter só erro e amostragem
- Não logar grupo ignorado, status update comum, reaction comum
- Transformar `findInstance` em cache em memória com TTL
- Cachear `uazapi_config.api_url` e tokens por instância

2. Corrigir o erro estrutural do `master-whatsapp-webhook`
- Responder `200 OK` antes do fluxo de IA
- Mover OpenAI + polling + envio do bot para `EdgeRuntime.waitUntil(...)` ou função assíncrona separada
- O webhook master deve só:
  - validar
  - deduplicar
  - persistir mínimo
  - devolver 200

3. Enxugar o `uazapi-webhook`
- Manter webhook focado em persistência mínima
- Deixar mídia pesada, IA, mark-read e send-presence fora do caminho crítico
- Reduzir selects repetidos em `whatsapp_instances` / `uazapi_config` / `whatsapp_conversations`

4. Cortar carga paralela fora do WhatsApp
- Revisar bootstrap de auth/dashboard para impedir consultas globais de `profiles`, `user_roles`, `customers` em rotas que não precisam imediatamente
- Garantir fetch sob demanda e não em cascata ao abrir duas abas

Se você aprovar, a próxima implementação deve seguir exatamente esta ordem:
1) desligar `webhook_logs` de rotina
2) cachear `findInstance` + configs
3) transformar `master-whatsapp-webhook` em resposta imediata + background
4) revisar bootstrap global de auth/dashboard para reduzir concorrência com os webhooks
