
O usuário está questionando por que webhooks do WhatsApp ficam reiniciando em volume e consumindo recursos do banco em paralelo com queries globais. Ele quer entender e corrigir.

Os logs mostram claramente:
- `master-whatsapp-webhook`: múltiplos boot/shutdown por minuto (eventos `presence` e `messages`)
- `uazapi-webhook`: shutdowns repetidos
- `track-visit`: erros 522 (Cloudflare timeout) tentando inserir no banco saturado

O ponto do usuário é correto: webhooks devem ser **pontuais** (receber → processar mínimo → responder 200 OK). Não deveriam ficar lendo dados pesados do banco a cada evento.

Preciso explicar:
1. O que é um webhook (evento pontual)
2. Por que estão "reiniciando em volume" (UaZapi dispara `presence` para CADA contato online — isso é lixo de evento)
3. Por que estão lendo banco (provavelmente fazem SELECT em stores/whatsapp_instances/whatsapp_chats a cada evento pra rotear)
4. Como corrigir: filtrar eventos inúteis na entrada + cache em memória + fire-and-forget

Vou verificar rapidamente os webhooks reais.

Plano enxuto sem código.
