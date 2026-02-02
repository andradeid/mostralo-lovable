
# Plano: Corrigir Duplicação de Mensagens e Captura do Nome (pushName)

## Problemas Identificados

### 1. Mensagens Duplicadas
Quando o usuário pergunta por texto (ex: "tem paracetamol?"):
- O `product-search-agent` envia imagens com legendas completas via `sendProductImages`
- Depois, o assistente OpenAI ainda envia OUTRA mensagem de texto com os mesmos dados
- Resultado: cliente recebe a mesma informação 2x

### 2. Nome não Capturado `[Nome]`
- O `pushName` do cliente não está sendo extraído do payload de function calling
- A Evolution API provavelmente não passa o pushName para a tool call
- O assistente usa `[Nome]` literal em vez do nome real

### 3. Formato Desejado
O formato correto (segunda imagem - image-638.png) já está implementado em `sendProductImageWithCaption`:
```
📦 *Paracetamol 750mg 30x10 CPS GEN Parace*
💰 R$ 3.00
👉 https://mostralo.com.br/loja/.../produto/...
```
O problema é que essa mensagem é enviada, E DEPOIS o assistente envia outra.

---

## Solução Proposta

### Etapa 1: Marcar que Imagens Já Foram Enviadas
No `product-search-agent`, quando `sendProductImages` é chamado com sucesso, incluir um flag no resultado:

```typescript
// Após enviar as imagens
let imagesSent = false;
if (productsWithImages.length > 0) {
  // ... enviar imagens ...
  imagesSent = true;
}

// No resultado retornado ao assistente
result = {
  products: [...],
  images_sent: imagesSent,  // NOVO FLAG
  images_sent_count: productsWithImages.length, // Quantas foram enviadas
  // ... resto do resultado
};
```

### Etapa 2: Ajustar o Prompt do Assistente (openai-bot-sync)
Adicionar instrução para o assistente NÃO repetir informações quando as imagens já foram enviadas:

```typescript
// No prompt do assistente (buildUnifiedPrompt)
REGRA CRÍTICA PARA RESPOSTAS COM PRODUTOS:
- Quando você receber resultado de busca com "images_sent: true", significa que as FOTOS dos produtos com todas as informações (nome, preço, link) JÁ FORAM ENVIADAS automaticamente
- Neste caso, responda APENAS com uma frase curta de confirmação, como: "Encontrei essas opções pra você! 😊"
- NÃO repita nomes, preços ou links que já estão nas fotos enviadas
- Evite duplicação de informações
```

### Etapa 3: Extrair pushName do Contexto da Conversa
O pushName não vem diretamente no payload de function calling, mas pode ser obtido de outra forma:

**Opção A**: Buscar na tabela `whatsapp_contacts` pelo remoteJid:
```typescript
// No product-search-agent, após extrair remoteJid
if (remoteJid) {
  const phone = remoteJid.replace(/@.*$/, '');
  const { data: contact } = await supabase
    .from('whatsapp_contacts')
    .select('push_name, name')
    .eq('phone_number', phone)
    .single();
  
  const customerName = contact?.push_name || contact?.name || null;
}
```

**Opção B**: Passar o pushName como argumento da tool (requer ajuste no assistente):
- Adicionar campo `customer_name` no schema das tools
- O assistente passa o nome que ele tem no contexto da conversa

### Etapa 4: Incluir Nome na Resposta de Confirmação
Se o nome for encontrado, incluir no resultado para o assistente usar:
```typescript
result = {
  products: [...],
  images_sent: true,
  customer_name: customerName, // Nome para saudação
  suggested_response: customerName 
    ? `Olá ${customerName}! Encontrei essas opções pra você 😊`
    : `Encontrei essas opções pra você 😊`
};
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/product-search-agent/index.ts` | Adicionar flags `images_sent`, buscar `pushName` da tabela `whatsapp_contacts`, retornar `suggested_response` |
| `supabase/functions/openai-bot-sync/index.ts` | Ajustar prompt do assistente para não duplicar informações quando `images_sent: true` |

---

## Fluxo Corrigido

```text
ANTES (com duplicação):
1. Cliente: "tem paracetamol?"
2. product-search-agent envia: [FOTO com legenda: 📦 Nome / 💰 R$ X / 👉 link]
3. Assistente envia: "Claro, [Nome]! Aqui estão: 1. Paracetamol - R$ X 👉 link"
4. Cliente recebe: 2 mensagens com a mesma informação ❌

DEPOIS (corrigido):
1. Cliente: "tem paracetamol?"
2. product-search-agent envia: [FOTO com legenda: 📦 Nome / 💰 R$ X / 👉 link]
3. Assistente envia: "Olá Maria! Encontrei essas opções pra você 😊"
4. Cliente recebe: foto completa + confirmação curta ✅
```

---

## Resultado Esperado

**Formato Final (igual à image-638.png):**
- 1 imagem com legenda completa por produto (máximo 3)
- Legenda contém: 📦 Nome + 💰 Preço + 👉 Link
- Seguida de UMA mensagem curta do assistente: "Olá [Nome]! Encontrei essas opções pra você 😊"

---

## Risco
**Baixo** - Ajustes aditivos que não quebram funcionalidades existentes. O fluxo de análise de imagem (Vision) continua funcionando como antes. Apenas o fluxo de busca por texto é otimizado.
