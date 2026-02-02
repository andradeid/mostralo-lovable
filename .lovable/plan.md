
# Plano: Adaptar AI Vision v2 para Múltiplos Nichos

## Problema Identificado
O prompt de análise de imagem no `product-search-agent` está **hardcoded** para:
- Medicamentos e receitas médicas
- Classificação de receitas (controlada, retida, simples)
- Terminologia farmacêutica

Isso **não funciona** para lojas de suplementos, pet shops, restaurantes, etc.

## Solução Proposta
Adaptar o prompt de Vision dinamicamente baseado no campo `segment` da loja:

| Segmento | Comportamento |
|----------|---------------|
| `saude-e-bem-estar` | Mantém análise de receitas + medicamentos |
| `alimentacao-e-bebidas` | Identifica pratos, ingredientes, cardápios |
| `suplementos` | Identifica suplementos, dosagens, sabores |
| `pet-shop` | Identifica produtos para pets, rações, embalagens |
| `outros/genérico` | Identificação genérica de produtos |

---

## Implementação Técnica

### Etapa 1: Buscar segmento da loja
No início do case `analyze_image`, buscar o segmento:

```typescript
// Buscar segmento da loja
const { data: storeData } = await supabase
  .from('stores')
  .select('segment, name')
  .eq('id', storeId)
  .single();

const segment = storeData?.segment || 'generico';
```

### Etapa 2: Criar função para gerar prompt dinâmico
Nova função `buildVisionPrompt(segment: string)` que retorna o prompt apropriado:

```typescript
function buildVisionPrompt(segment: string, imageContext?: string): string {
  const baseInstructions = `Você é um assistente especializado em identificar produtos em imagens.

INSTRUÇÕES GERAIS:
1. Identifique os produtos/itens visíveis na imagem
2. Seja preciso nos nomes e especificações
3. NÃO invente produtos que não estão visíveis
4. IGNORE dados pessoais se houver`;

  const segmentPrompts: Record<string, string> = {
    'saude-e-bem-estar': `
${baseInstructions}

FOCO: Medicamentos, produtos de saúde, cosméticos, suplementos.

CLASSIFICAÇÃO DE DOCUMENTO (primeira linha):
- RECEITA_CONTROLADA: Receitas com tarja preta ou medicamentos controlados
- RECEITA_RETIDA: Receitas de antibióticos ou tarja vermelha
- RECEITA_SIMPLES: Receitas médicas comuns
- PRODUTO: Foto de embalagem ou produto

FORMATO:
[TIPO_DOCUMENTO: X]

1. [Nome do produto/medicamento] [dosagem/quantidade]
2. ...`,

    'alimentacao-e-bebidas': `
${baseInstructions}

FOCO: Pratos, bebidas, ingredientes, cardápios.

FORMATO DE RESPOSTA:
[TIPO_DOCUMENTO: PRODUTO]

1. [Nome do prato/bebida] [tamanho/porção se visível]
2. ...

Identifique ingredientes principais quando possível.`,

    'pet-shop': `
${baseInstructions}

FOCO: Rações, petiscos, acessórios, medicamentos veterinários.

FORMATO:
[TIPO_DOCUMENTO: PRODUTO]

1. [Nome do produto] [peso/quantidade]
2. ...

Inclua: marca, sabor, tipo de animal (cão, gato, etc).`,

    'suplementos': `
${baseInstructions}

FOCO: Suplementos alimentares, vitaminas, proteínas, pré-treinos.

FORMATO:
[TIPO_DOCUMENTO: PRODUTO]

1. [Nome do suplemento] [dosagem/peso] [sabor se visível]
2. ...

Inclua: marca e especificações quando visíveis.`,

    'generico': `
${baseInstructions}

Identifique todos os produtos visíveis na imagem.

FORMATO:
[TIPO_DOCUMENTO: PRODUTO]

1. [Nome do produto] [especificações relevantes]
2. ...`
  };

  const prompt = segmentPrompts[segment] || segmentPrompts['generico'];
  return imageContext ? `${prompt}\n\nContexto do cliente: ${imageContext}` : prompt;
}
```

### Etapa 3: Modificar case `analyze_image`
Substituir o prompt hardcoded pelo prompt dinâmico:

```typescript
case 'analyze_image': {
  // ... código existente de verificação ...

  // NOVO: Buscar segmento da loja
  const { data: storeData } = await supabase
    .from('stores')
    .select('segment')
    .eq('id', storeId)
    .single();

  const segment = storeData?.segment || 'generico';
  console.log(`[product-search-agent] 🏪 Segmento da loja: ${segment}`);

  // NOVO: Gerar prompt dinâmico baseado no segmento
  const systemPrompt = buildVisionPrompt(segment, imageContext);

  // ... resto do código continua igual ...
}
```

### Etapa 4: Ajustar lógica de receitas controladas
Só aplicar aviso de receita controlada para segmentos de saúde:

```typescript
// Só aplicar aviso de receita controlada para farmácias
const isHealthSegment = segment === 'saude-e-bem-estar';
const isControlledPrescription = isHealthSegment && 
  (documentType === 'RECEITA_CONTROLADA' || documentType === 'RECEITA_RETIDA');
```

---

## Arquivos a Modificar
1. `supabase/functions/product-search-agent/index.ts`
   - Adicionar função `buildVisionPrompt`
   - Buscar segmento da loja
   - Usar prompt dinâmico
   - Ajustar lógica de receitas controladas

## Mapeamento de Segmentos
Para garantir que o sistema funcione com qualquer valor de `segment`:

| Valor em `stores.segment` | Prompt usado |
|---------------------------|--------------|
| `saude-e-bem-estar` | Farmácia (com receitas) |
| `alimentacao-e-bebidas` | Restaurante/Alimentação |
| `pet-shop` ou `animais` | Pet Shop |
| `suplementos` ou `fitness` | Suplementos |
| Qualquer outro valor | Genérico |

---

## Resultado Esperado

### Loja de Suplementos
Cliente envia foto de um pote de Whey Protein:
```
📦 *Whey Protein Gold Standard*
💰 R$ 289,90
👉 link

Assistente: "Encontrei o Whey Protein Gold Standard! Temos disponível nos sabores chocolate e baunilha."
```

### Farmácia (comportamento atual mantido)
Cliente envia receita médica:
```
⚠️ Receita controlada detectada - precisará apresentar documento na entrega

📦 *Clonazepam 2mg*
💰 R$ 12,90
👉 link
```

### Pet Shop
Cliente envia foto de ração:
```
📦 *Ração Premium Cães Adultos 15kg*
💰 R$ 189,90
👉 link
```

## Risco
**Baixo** - Adiciona flexibilidade sem remover funcionalidade existente. Farmácias continuam funcionando como antes.
