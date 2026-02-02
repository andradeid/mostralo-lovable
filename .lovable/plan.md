
# Plano: Envio de Fotos com Legenda Completa no Assistente v2

## Resumo
Quando o assistente v2 encontrar produtos, enviará as fotos com legenda completa contendo nome, valor e link para compra direta.

## Problema Atual
- No `whatsapp-media-webhook` (análise de receita), a legenda é apenas `📸 Nome - R$ 00,00` sem link
- O assistente v2 (`product-search-agent`) não envia fotos dos produtos

## Solução
Modificar o `product-search-agent` para enviar até 3 fotos de produtos com legenda rica:

```text
📦 *Dipirona 500mg - 20 comprimidos*
💰 R$ 12,90
👉 https://mostralo.com.br/loja/farmabella/produto/dipirona-500mg
```

## Fluxo Proposto
```text
Cliente pergunta "tem dipirona?" →
  ↓
[1] product-search-agent busca produtos
[2] Para cada produto com imagem (máx 3):
    → Envia FOTO com legenda completa (nome + preço + link)
[3] OpenAI recebe dados e responde em texto
```

---

## Implementação Técnica

### Etapa 1: Extrair dados da sessão WhatsApp
O `product-search-agent` precisa receber `instanceName` e `remoteJid` do payload da Evolution API para saber para onde enviar as fotos.

```typescript
// No início do handler, extrair:
const instanceName = body.instance || body.instanceName;
const remoteJid = body.remoteJid || body.key?.remoteJid;
```

### Etapa 2: Criar função de envio de imagem com legenda
Nova função `sendProductImageWithCaption` que envia imagem via Evolution API com legenda formatada:

```typescript
async function sendProductImageWithCaption(
  supabase: any,
  instanceName: string,
  remoteJid: string,
  product: { name: string; price: number; link: string; image_url: string }
): Promise<boolean> {
  // Buscar config Evolution
  const { data: evolutionConfig } = await supabase
    .from('evolution_config')
    .select('api_url, api_key')
    .eq('is_active', true)
    .single();
  
  if (!evolutionConfig) return false;
  
  const phone = remoteJid.replace(/@.*$/, '');
  
  // Legenda completa com nome, preço e link
  const caption = `📦 *${product.name}*\n💰 R$ ${product.price.toFixed(2)}\n👉 ${product.link}`;
  
  const response = await fetch(
    `${evolutionConfig.api_url.replace(/\/+$/, '')}/message/sendMedia/${instanceName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionConfig.api_key,
      },
      body: JSON.stringify({
        number: phone,
        mediatype: 'image',
        media: product.image_url,
        caption: caption,
      }),
    }
  );
  
  return response.ok;
}
```

### Etapa 3: Integrar nas funções que retornam produtos
Modificar os cases `search_products`, `get_promotions`, `get_recommendations`, `check_stock`:

```typescript
case 'search_products': {
  // ... código existente de busca ...
  
  // NOVO: Enviar fotos se tiver sessão WhatsApp
  if (instanceName && remoteJid && products?.length > 0) {
    const productsWithImages = products
      .filter(p => p.image_url)
      .slice(0, 3); // Máximo 3 fotos
    
    for (const product of productsWithImages) {
      await sendProductImageWithCaption(supabase, instanceName, remoteJid, {
        name: product.name,
        price: product.is_on_offer && product.offer_price ? product.offer_price : product.price,
        link: buildProductLink(product.slug),
        image_url: product.image_url,
      });
      await new Promise(r => setTimeout(r, 300)); // Delay para ordem correta
    }
  }
  
  // Retorna resultado normalmente para o OpenAI responder em texto
  result = { products: (products || []).map(formatProduct), ... };
}
```

### Etapa 4: Incluir image_url nas consultas
Adicionar `image_url` nos SELECTs que ainda não têm:

```typescript
.select(`
  id, name, slug, price, offer_price, image_url, ...
`)
```

---

## Arquivos a Modificar
1. `supabase/functions/product-search-agent/index.ts`
   - Extrair `instanceName` e `remoteJid` do payload
   - Adicionar função `sendProductImageWithCaption`
   - Modificar cases: `search_products`, `get_promotions`, `get_recommendations`, `check_stock`
   - Adicionar `image_url` nos SELECTs

## Compatibilidade
- Se `instanceName`/`remoteJid` não estiverem no payload, funciona normalmente (apenas texto)
- Não afeta o fluxo de análise de receitas no `whatsapp-media-webhook`
- Respeita limite de 3 fotos para não sobrecarregar

## Resultado Esperado
Cliente pergunta "tem vitamina C?" → Recebe:
1. **Foto 1** com legenda: `📦 *Vitamina C 1g*\n💰 R$ 29,90\n👉 link`
2. **Foto 2** com legenda: `📦 *Vitamina C Efervescente*\n💰 R$ 24,90\n👉 link`
3. **Texto** do assistente com lista completa e informações adicionais

## Risco
**Baixo** - Adiciona funcionalidade sem alterar fluxos existentes.
