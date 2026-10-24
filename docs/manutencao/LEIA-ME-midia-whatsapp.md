# Mostralo · Mídia do WhatsApp no storage

Correção do bucket **whatsapp-chat-media** — 24/10/2026. Branch `storage-midia-whatsapp-2026-10-24` (andradeid/mostralo-lovable). Nada foi alterado em produção.

## Situação hoje (lida no banco, só leitura)

| Pasta | Loja | Arquivos | Tamanho | Com mais de 30 dias |
|---|---|---|---|---|
| master/ | WhatsApp master (seu número) | 1.701 | 816,8 MB | 441,8 MB |
| c9734c8f… | Barbearia Jeferson Dias (sem Central) | 1.172 | 573,0 MB | 573,0 MB |
| 2f2bebec… | Drogaria Farma Bella (ex-cliente, Central pelo plano) | 4.398 | 447,1 MB | 447,1 MB |
| ddf4a54c… | Farma Bella Exemplo 3 | 52 | 6,1 MB | 6,1 MB |
| **Total** | | **7.323** | **≈1,84 GB** | **≈1,47 GB** |

- O master salvou 56 mídias só nas últimas 24 h.
- **Jeferson:** Central desligada (override = não). Nas últimas 24 h ele enviou mais de 20 mensagens e o webhook não recebeu nenhum evento de mensagem dele. Indica webhook só com "connection". Os 573 MB são de mar–jul/2026.
- **Navalha Barbearia:** sem Central, desconectada, sem arquivos.
- **Farma Bella:** a instância está "connecting" e a loja ainda tem 24.910 mensagens no banco. A limpeza não pega porque ela tem Central pelo plano.
- **Instância órfã:** a UaZapi ainda manda eventos de conexão de "farma-bella-exemplo-mostralo", que não está cadastrada.

## O que mudou

**A. Lojas só de disparo (sem Central)**

- `uazapi-webhook`: a mídia só é baixada e salva quando a Central da loja foi **confirmada**. Se a checagem der erro (fail-open), a mensagem segue, mas sem baixar arquivo.
- O áudio usa os bytes já baixados para o Whisper (não depende de URL pública).

**B. Instância master**

- `master-whatsapp-webhook`: **não salva mais mídia no storage**. Guarda tipo, legenda, nome do arquivo e a marca `media_on_demand`.
- Áudio é baixado só em memória para transcrever, porque o bot usa a transcrição.
- Nova função **`master-whatsapp-media`** (só master_admin): busca na UaZapi um link temporário da mídia daquela mensagem.
- No chat do master, a mídia aparece como botão "Ver imagem / Ouvir áudio / Abrir documento".

**C. Limpeza (`whatsapp-cleanup-orphan-messages`)**

- Loja sem Central: apaga também **a pasta inteira da loja no bucket**, inclusive os órfãos antigos.
- Retenção (mesmo prazo das configurações, hoje 30 dias):
    - apaga as mensagens do master mais antigas;
    - apaga os arquivos do bucket mais antigos de qualquer pasta. Lojas com "manter histórico" ficam de fora.
    - Antes de apagar o arquivo, a mensagem é marcada "mídia expirada"; no chat aparece "Mídia expirada" em vez de imagem quebrada.
- Ações novas para o master: `media-diagnose` (tamanho por pasta) e `media-retention` (roda na hora).
- O histórico da limpeza passa a registrar arquivos apagados e espaço liberado.
- Migration `20261024090000_chat_media_retencao.sql` (aditiva): funções só para o service role e 2 colunas no log.

**D. Privacidade (bucket privado)**

- O front passa a abrir a mídia com **URL assinada** (1 h), tanto no chat das lojas, no chat do master e na análise de conversas. Funciona com o bucket público ou privado.
- O envio de mídia (lojas e master) passa à UaZapi uma URL assinada e só aceita arquivo da pasta da própria loja (ou master/).
- `docs/manutencao/2-bucket-whatsapp-chat-media-privado.sql`:
    - deixa o bucket privado;
    - leitura só para a equipe da loja (dono/atendente) e master;
    - upload só na pasta da própria loja;
    - apagar pelo navegador só o master;
    - tem o bloco de reversão no final.

**E. Faxina** (preparada, não executada)

- `docs/manutencao/1-faxina-whatsapp-chat-media-lista.sql`: só lista (SQL Editor).
- `scripts/faxina-whatsapp-chat-media.ts`:
    - por padrão só lista;
    - com `--executar` marca as mensagens como expiradas e apaga os arquivos em lotes de 100.

## Estimativa da faxina (rodada agora, só leitura)

| Pasta | Motivo | Arquivos | Tamanho |
|---|---|---|---|
| Barbearia Jeferson Dias | loja sem Central | 1.172 | 573,0 MB |
| Drogaria Farma Bella | mais de 30 dias | 4.398 | 447,1 MB |
| WhatsApp master | mais de 30 dias | 1.307 | 441,8 MB |
| Farma Bella Exemplo 3 | mais de 30 dias | 52 | 6,1 MB |
| **Total** | | **6.929** | **≈1,47 GB** |

- Ficam ≈375 MB do master (últimos 30 dias). Eles saem sozinhos pela retenção ao completar 30 dias.
- Com o master sem salvar mídia, o crescimento de ~370 MB/mês para.
- O bucket deve ficar perto de zero em um mês, só com mídia recente das lojas que usam Central.

## Testes feitos

| Teste | Resultado |
|---|---|
| Tipos (deno check) das 6 funções alteradas/novas e do script | OK |
| Deno: helpers de mídia (URLs, assinatura, pasta, lotes) | 6/6 OK |
| Deno: retenção com banco/storage em memória (master, órfãos, loja com histórico, ordem marcar→apagar, segunda execução não apaga nada) | 2/2 OK |
| Postgres 16 local: funções da migration (filtros, paginação, resumo, marcar expirada, permissões) | OK |
| Postgres 16 local: políticas do bucket privado (anônimo, dono, atendente, outra loja, master, upload e delete) | OK |
| Front: tsc + build do Vite | OK |
| SQL da faxina rodado em produção (só leitura) | números acima |

**Não testado:**

- Envio e recebimento real pela UaZapi com as funções novas: depende do deploy.
- Abertura da mídia no navegador: o Chrome não estava conectado.

## Como subir (ordem)

1. Fazer o merge da branch `storage-midia-whatsapp-2026-10-24` na main e publicar o front.
2. Aplicar a migration `20261024090000_chat_media_retencao.sql`.
3. Publicar as funções:
    - `uazapi-webhook`
    - `master-whatsapp-webhook`
    - `master-whatsapp-media` (nova)
    - `whatsapp-chat-send`
    - `master-whatsapp-chat-send`
    - `whatsapp-cleanup-orphan-messages`
4. Testar no chat:
    - Mandar um áudio e uma foto para o seu número: devem aparecer como botão e abrir.
    - Enviar uma imagem pelo chat do master e por uma loja com Central (Corte Fino).
5. Rodar a faxina:
    - primeiro `deno run -A scripts/faxina-whatsapp-chat-media.ts` (lista);
    - depois com `--executar`.
6. Rodar `docs/manutencao/3-cron-limpeza-diaria.sql`: a limpeza passa a rodar todo dia, em vez de dia 1 de cada mês.
7. Depois de conferir o chat funcionando, aplicar `docs/manutencao/2-bucket-whatsapp-chat-media-privado.sql`.
8. Opcional: no painel master, "Sincronizar webhooks" das lojas para garantir que lojas sem Central ficam só com "connection".

## Pontos para você decidir

- **Farma Bella (ex-cliente):** tirar a Central dela (ou excluir a loja) apaga as 24.910 mensagens na próxima limpeza.
- **Mensagens antigas das lojas com Central:** ficam no banco, só a mídia expira em 30 dias. Para manter a mídia de alguma loja, marque "manter histórico".
