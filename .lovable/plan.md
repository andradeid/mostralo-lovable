
# Plano: Corrigir Extração de Nomes e Adicionar Busca por Similares

## Diagnóstico do Problema

O GPT-4o Vision retorna:
```text
- Nome: Paracetamol
- Marca: EMS
- Dosagem: 750 mg
- Uso: Adulto, Uso Oral
```

Mas o regex está extraindo TODA a linha após o `-`, resultando em:
- `"Nome: Paracetamol"` (com prefixo errado)
- `"Marca: EMS"` (metadado, não é produto)

Quando busca `"Nome: Paracetamol"` no banco, não encontra nada.

## Soluções Planejadas

### 1. Melhorar o Prompt do GPT-4o Vision
Arquivo: `supabase/functions/product-search-agent/index.ts`

Alterar o prompt para retornar **apenas uma lista limpa** dos medicamentos:

```text
FORMATO DE RESPOSTA OBRIGATÓRIO (apenas lista de produtos):
1. Paracetamol 750mg
2. Amoxicilina 500mg

NÃO inclua informações como Marca, Uso, Indicação, Tipo - apenas o nome do medicamento e dosagem.
```

### 2. Melhorar a Lógica de Extração do Nome
Adicionar tratamento para:
- Remover prefixos como `"Nome: "`, `"Medicamento: "`, `"Produto: "`
- Ignorar linhas que são metadados (começam com `Marca:`, `Uso:`, `Indicação:`, `Tipo:`, `Quantidade:`)
- Extrair apenas o valor após `Nome:` quando encontrar esse padrão

### 3. Adicionar Busca por Produtos Similares (Princípio Ativo)
Quando o produto exato não for encontrado:
1. Extrair o princípio ativo (ex: "Paracetamol" de "Paracetamol EMS 750mg")
2. Buscar produtos similares no catálogo pelo princípio ativo
3. Mostrar como sugestão: "Não temos o exato, mas temos similar disponível"

### 4. Atualizar Resposta no WhatsApp
Quando encontrar similares, mostrar:
```text
❌ Paracetamol EMS 750mg não encontrado

✅ Produtos similares disponíveis:
• Paracetamol 750mg 30x10 CPS - R$ X,XX
  👉 link
```

## Mudanças nos Arquivos

### `product-search-agent/index.ts`:

1. **Novo prompt** (linhas 700-725):
```typescript
const systemPrompt = `Você é um assistente especializado em identificar medicamentos em imagens.

INSTRUÇÕES:
1. Identifique APENAS os nomes dos medicamentos/produtos visíveis
2. Inclua a dosagem quando visível
3. IGNORE: marca, uso, indicação, tipo - apenas o NOME + DOSAGEM

FORMATO DE RESPOSTA (apenas lista numerada):
1. [Nome do medicamento] [dosagem]
2. [Nome do medicamento] [dosagem]

Exemplo correto:
1. Paracetamol 750mg
2. Dipirona 500mg

Exemplo ERRADO (não faça isso):
- Nome: Paracetamol
- Marca: EMS
`;
```

2. **Nova lógica de extração** (linhas 791-825):
```typescript
// Ignorar linhas de metadados
const metadataKeywords = ['marca:', 'uso:', 'indicação:', 'tipo:', 'quantidade:', 'apresentação:'];
if (metadataKeywords.some(k => trimmedLine.toLowerCase().startsWith(k))) continue;

// Se a linha tem "Nome: X", extrair apenas X
if (trimmedLine.toLowerCase().startsWith('nome:')) {
  const value = trimmedLine.replace(/^nome:\s*/i, '').trim();
  if (value.length > 2) productNames.push(value);
  continue;
}
```

3. **Busca por similares** (após linha 875):
```typescript
// Se não encontrou nenhum produto, buscar por termo principal (princípio ativo)
if (matchedProducts.length === 0 && searchTerms.length > 0) {
  const { data: similarMatch } = await supabase
    .from('products')
    .select(...)
    .ilike('name', `%${searchTerms[0]}%`)
    .limit(3);
    
  if (similarMatch && similarMatch.length > 0) {
    // Marcar como "similar" ao invés de "encontrado"
    for (const p of similarMatch) {
      foundProducts.push({
        ...p,
        is_similar: true,
        original_search: productName,
      });
    }
  }
}
```

### `whatsapp-media-webhook/index.ts`:

1. **Atualizar `formatResponseMessage`** para mostrar produtos similares:
```typescript
const similarProducts = result.products?.filter(p => p.is_similar) || [];

if (similarProducts.length > 0) {
  message += `\n\n🔄 *Produtos similares disponíveis:*\n`;
  for (const p of similarProducts) {
    message += `• ${p.name}`;
    if (p.price) message += ` - R$ ${p.price.toFixed(2)}`;
    if (p.link) message += `\n  👉 ${p.link}`;
    message += '\n';
  }
}
```

## Resultado Esperado

Quando enviar imagem de "Paracetamol EMS 750mg":

1. GPT-4o Vision retorna: `1. Paracetamol 750mg`
2. Sistema busca "Paracetamol 750mg" → encontra "Paracetamol 750mg 30x10 CPS GEN"
3. Cliente recebe:
```text
✅ Produtos disponíveis:
• Paracetamol 750mg 30x10 CPS - R$ X,XX
  Estoque: 1 unidade
  👉 link
```

## Tarefas de Implementação

1. ✅ Identificar causa raiz (regex extraindo nome errado)
2. 🔄 Melhorar prompt para formato mais limpo
3. 🔄 Adicionar filtro de metadados na extração
4. 🔄 Implementar busca por similares
5. 🔄 Atualizar formatação da resposta no webhook
6. 🔄 Deploy e teste end-to-end
