
## O que eu vi nos logs (por que a “imagem clara” falha)
Pelos logs mais recentes, o problema não é a qualidade da foto em si — é a forma como a imagem chega para a IA:

- `whatsapp-media-webhook` está recebendo **hasBase64: false**
- Ele está repassando para o `product-search-agent` apenas uma URL do WhatsApp (`https://mmg.whatsapp.net/...`)
- O OpenAI responde erro ao tentar baixar essa URL:
  - `code: "invalid_image_url"`
  - `message: "Error while downloading https://mmg.whatsapp.net/..."`

Consequência: o bot manda a resposta genérica “não consegui identificar os produtos claramente”.

## Causa raiz
A URL `mmg.whatsapp.net` normalmente exige autenticação/headers/cookies e **não é acessível para a OpenAI baixar diretamente**. Então, para funcionar, precisamos enviar a imagem em **base64** (ou então baixar a mídia via Evolution antes).

## Objetivo
Garantir que, ao receber uma receita/imagem, o sistema:
1) obtenha a mídia em base64 de forma confiável (mesmo quando o webhook não envia base64),
2) envie base64 para o `product-search-agent`,
3) retorne uma resposta útil no WhatsApp (ex: identificar “Amoxicilina 500mg”) e, se possível, já buscar no catálogo e mandar links.

---

## Mudanças planejadas (código)

### 1) `whatsapp-media-webhook`: obter base64 quando `payload.data.base64` vier vazio
Arquivo: `supabase/functions/whatsapp-media-webhook/index.ts`

**Ajuste principal**
- Se `payload.data.base64` estiver ausente, fazer fallback chamando a Evolution API:
  - Endpoint (Evolution): `POST /chat/getBase64FromMediaMessage/{instance}`
  - Body (mínimo):  
    ```json
    {
      "message": { "key": { "id": "<message_id>" } },
      "convertToMp4": false
    }
    ```
  - O `<message_id>` vem de `payload.data.key.id`.

**Robustez**
- Normalizar `api_url` removendo `/` no final.
- Tentar interpretar o retorno da Evolution de forma tolerante:
  - Se vier `base64` como `data:image/jpeg;base64,...` → remover prefixo e manter só o base64 puro
  - Se vier em outro campo (`data.base64`, `media.base64`, etc.) → tentar extrair
  - Se vier vazio (alguns ambientes têm bug de base64) → logar e retornar erro amigável sugerindo habilitar `WEBHOOK_BASE64=true`

**Logs melhores**
- Logar um “correlation id” para amarrar requisições (ex: `instance + message.key.id`)
- Logar se a imagem usada foi:
  - `source=webhook_base64` ou `source=evolution_getBase64` (importante pra diagnóstico)

### 2) `product-search-agent`: evitar URL do WhatsApp e retornar dados úteis para o webhook
Arquivo: `supabase/functions/product-search-agent/index.ts` (case `analyze_image`)

**Ajuste de segurança/estabilidade**
- Se `imageData.url` for `mmg.whatsapp.net` e `base64` estiver vazio:
  - retornar erro com mensagem clara (sem chamar OpenAI), porque sabemos que vai falhar
  - isso economiza custo e evita loops

**Ajuste do prompt para receita**
- Melhorar o prompt para:
  - extrair somente medicamentos (nome + dosagem + quantidade quando existir)
  - ignorar dados pessoais do paciente (nome, endereço etc.)
  - reforçar “não fazer diagnóstico nem orientação médica”

**Retorno estruturado compatível com o webhook**
Hoje o `analyze_image` devolve `{ success: true, analysis: "texto" }`, mas o webhook espera `products[]`.
Vamos alterar o retorno para algo compatível com `AnalysisResult`, por exemplo:
```json
{
  "success": true,
  "description": "Receita médica (itens identificados)",
  "products": [
    { "name": "Amoxicilina 500mg", "slug": "...", "price": 0 }
  ],
  "message": "Itens extraídos da receita e buscados no catálogo"
}
```

**Busca no catálogo**
- Para cada item identificado, fazer uma busca no banco (`products`) com `ilike` por nome/dosagem e retornar o melhor match (com `slug` e preço).
- Limitar quantidade de itens (ex: até 5) para não estourar tempo/custo.

### 3) `whatsapp-media-webhook`: formatar resposta baseada no retorno real do agent
Arquivo: `supabase/functions/whatsapp-media-webhook/index.ts`

- Ajustar `formatResponseMessage` para:
  - se houver `products[]`, listar e incluir links
  - se não houver `products[]` mas houver `description/analysis`, retornar um resumo do que foi lido (“Identifiquei: Amoxicilina 500mg…”) e pedir confirmação
  - tratar melhor o caso de erro `invalid_image_url` com dica direta (para facilitar troubleshooting)

---

## Testes (fim a fim)
1) Enviar a mesma receita/imagem para a instância `store_drogaria-farma-bella`.
2) Confirmar nos logs do `whatsapp-media-webhook`:
   - `hasBase64: true` ou “base64 obtido via getBase64FromMediaMessage”
3) Confirmar nos logs do `product-search-agent`:
   - não aparece mais `invalid_image_url`
   - `image_source` vira `base64`
4) Confirmar no WhatsApp:
   - a Bella responde com o item identificado (ex: *Amoxicilina 500mg*) e, se existir no catálogo, manda o link do produto.

---

## Riscos / fallback
- Se a Evolution estiver com bug e o endpoint `getBase64FromMediaMessage` retornar vazio:
  - o sistema ainda pode funcionar se você habilitar `WEBHOOK_BASE64=true` no webhook da instância
  - vamos deixar logs e mensagem de erro bem explícitos para esse cenário

---

## Resultado esperado
A receita da imagem do print deve passar a ser analisada corretamente e o bot deve identificar pelo menos:
- “Amoxicilina 500mg”
e então buscar no catálogo da Farma Bella para retornar link (quando houver match).
