

# Plano: Enviar Imagem do Produto no WhatsApp

## Visão Geral

Quando o sistema identificar produtos no catálogo, enviará primeiro a **imagem do produto** com nome e preço como legenda, seguido da mensagem de texto com o link de compra.

## Fluxo Proposto

```text
Cliente envia foto → Sistema analisa → Encontra produto
                                           ↓
                               1️⃣ Envia IMAGEM do produto
                                  Caption: "Nome + Preço"
                                           ↓
                               2️⃣ Envia TEXTO com link
                                  "Clique para comprar..."
```

## Implementação

### Arquivo: `whatsapp-media-webhook/index.ts`

#### 1. Nova função para enviar imagem via Evolution API

Criar função `sendWhatsAppImage` (similar à existente `sendWhatsAppMessage`):

```typescript
async function sendWhatsAppImage(
  supabase: any,
  instanceName: string,
  remoteJid: string,
  imageUrl: string,
  caption: string
): Promise<{ success: boolean; error?: string }> {
  // Buscar config Evolution API
  // Chamar endpoint /message/sendMedia com mediatype: 'image'
  // Retornar resultado
}
```

#### 2. Atualizar interface `AnalysisResult`

Adicionar campo `image_url` aos produtos:

```typescript
products?: Array<{
  // ... campos existentes
  image_url?: string;  // URL da imagem do produto
}>;
```

#### 3. Modificar fluxo de resposta (linhas 558-573)

Após obter `agentResult`:

```typescript
// Enviar imagem do primeiro produto disponível (se tiver)
const availableProducts = agentResult.products?.filter(
  p => p.found_in_catalog && p.in_stock && p.image_url
) || [];

if (availableProducts.length > 0) {
  const firstProduct = availableProducts[0];
  const caption = `${firstProduct.name}${firstProduct.price ? ` - R$ ${firstProduct.price.toFixed(2)}` : ''}`;
  
  await sendWhatsAppImage(
    supabase,
    instanceName,
    remoteJid,
    firstProduct.image_url,
    caption
  );
}

// Depois envia o texto normal com links
const responseMessage = formatResponseMessage(agentResult, customerName, storeSlug);
await sendWhatsAppMessage(...);
```

### Arquivo: `product-search-agent/index.ts`

Garantir que o campo `image_url` seja incluído na resposta dos produtos encontrados (já existe na query `select`, só precisa verificar se está sendo retornado).

## Resultado Esperado

```text
[IMAGEM DO PRODUTO]
📸 Paracetamol 750mg - R$ 12,50

---

🔍 Analisei a imagem que você enviou!

✅ Disponíveis em estoque:
1. Paracetamol 750mg - R$ 12,50
   👉 https://mostralo.com.br/loja/.../produto/...

Clique no link acima para ver mais detalhes e finalizar sua compra! 🛒
```

## Segurança

- Fallback silencioso: se não houver imagem ou der erro no envio, continua com texto normalmente
- Não quebra fluxo existente
- Sem autenticação extra necessária (webhook já é interno)

## Tarefas

1. Criar função `sendWhatsAppImage` no webhook
2. Verificar retorno de `image_url` no `product-search-agent`
3. Adicionar lógica de envio de imagem antes do texto
4. Deploy das edge functions
5. Testar end-to-end

