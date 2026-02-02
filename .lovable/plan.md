

# Plano: Corrigir Duplicação de Mensagens e Captura de Nome

## Problemas Identificados

### 1. Nome do Cliente Não Capturado
O `pushName: "Andrade"` chega em `functionArguments` mas não está sendo extraído corretamente. O código busca na tabela `whatsapp_contacts` mas o telefone não está cadastrado lá.

**Solução**: Extrair `pushName` diretamente de `functionArguments` antes de tentar buscar no banco.

### 2. Duplicação de Mensagens Continua
Mesmo com `images_sent: true` e `suggested_response`, o assistente ainda envia:
- Mensagem de confirmação
- Lista de produtos repetida
- Mensagem de encerramento

**Solução**: Fortalecer as instruções e modificar o resultado para não incluir a lista de produtos quando imagens já foram enviadas.

### 3. Imagem Errada do Produto
A foto do produto "Paracetamol+codeina" está mostrando "Cloridrato de fexofenadina". Isso é um **erro de dados no banco** - não é problema de código.

---

## Alterações Propostas

### Arquivo 1: `supabase/functions/product-search-agent/index.ts`

**Mudança A - Extrair pushName de functionArguments:**
```typescript
// ANTES: Busca apenas no banco
let customerName: string | null = null;
if (remoteJid) {
  // ... busca no banco
}

// DEPOIS: Primeiro tenta functionArguments, depois banco
let customerName: string | null = parsedArgs?.pushName || null;
if (!customerName && remoteJid) {
  // ... busca no banco como fallback
}
```

**Mudança B - Não enviar lista de produtos quando imagens foram enviadas:**
```typescript
// ANTES: Sempre retorna a lista completa de produtos
result = {
  products: (products || []).map(formatProduct),
  images_sent: true,
  // ...
};

// DEPOIS: Quando imagens foram enviadas, retorna apenas confirmação
result = {
  images_sent: true,
  images_sent_count: imagesSentCount,
  customer_name: customerName,
  suggested_response: suggestedResponse,
  // Não incluir lista de produtos para evitar que assistente repita
  message: `${imagesSentCount} produto(s) encontrado(s) e enviado(s) com foto`
};
```

### Arquivo 2: `supabase/functions/openai-bot-sync/index.ts`

**Mudança C - Reforçar regra anti-duplicação no prompt:**
```typescript
REGRA CRÍTICA DE ANTI-DUPLICAÇÃO (OBRIGATÓRIO SEGUIR):
Quando você receber resultado com "images_sent: true":
1. O cliente JÁ recebeu as fotos dos produtos com TODAS as informações (nome, preço, link)
2. Responda APENAS com a frase da "suggested_response" ou similar
3. NÃO liste produtos novamente - as fotos já contêm tudo
4. NÃO repita nomes, preços ou links
5. Exemplo correto: "Olá Andrade! Encontrei essas opções pra você 😊"
6. Exemplo ERRADO: listar "1. Produto X - R$ Y" depois da foto
```

---

## Fluxo Corrigido

```text
ANTES (com problemas):
1. Cliente: "tem paracetamol?"
2. Foto enviada: [📦 Nome / 💰 Preço / 👉 Link] ✅
3. Assistente: "Sim, encontrei uma opção de paracetamol disponível!" ❌
4. Assistente: "· Paracetamol... - R$ X 👉 link" ❌ (DUPLICAÇÃO)
5. Assistente: "Se precisar de mais alguma coisa..." ❌

DEPOIS (corrigido):
1. Cliente: "tem paracetamol?"
2. Foto enviada: [📦 Nome / 💰 Preço / 👉 Link] ✅
3. Assistente: "Olá Andrade! Encontrei essa opção pra você 😊" ✅ (FIM)
```

---

## Sobre a Imagem Errada

O produto "Paracetamol+codeina 500+30mg" está com a imagem de "Cloridrato de fexofenadina" cadastrada incorretamente no banco de dados da Drogaria Farma Bella.

**Ação recomendada**: Corrigir a imagem do produto pelo painel administrativo da loja ou diretamente no banco de dados.

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/functions/product-search-agent/index.ts` | Extrair `pushName` de `functionArguments`, não enviar lista quando `images_sent` |
| `supabase/functions/openai-bot-sync/index.ts` | Reforçar regra anti-duplicação no prompt |

---

## Risco
**Baixo** - Alterações focadas em melhorar a experiência sem quebrar funcionalidades existentes.

