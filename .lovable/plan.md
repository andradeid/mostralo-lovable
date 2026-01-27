
# Plano: Sistema de Detecção de Duplicatas com Atualização Inteligente

## Resumo

Criar um sistema robusto que detecta produtos já existentes durante a importação, oferece opções de ação (pular, atualizar ou criar mesmo assim), e permite atualização inteligente de imagens via busca automática.

---

## Estratégia de Identificação de Duplicatas

**Chave Composta:** `store_id` + `LOWER(name)` + `category_id`

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LÓGICA DE DETECÇÃO DE DUPLICATAS                        │
│                                                                             │
│  Produto da Planilha:                                                      │
│    Nome: "Dipirona 500mg"                                                  │
│    Categoria: "Medicamentos"                                               │
│                                                                             │
│  Busca no Banco:                                                           │
│    SELECT * FROM products                                                  │
│    WHERE store_id = 'loja-123'                                             │
│    AND LOWER(name) = LOWER('Dipirona 500mg')                               │
│    AND category_id = 'cat-medicamentos'                                    │
│                                                                             │
│  Resultado: ✓ Encontrado → É DUPLICATA                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Opções de Ação para Duplicatas

| Modo | Comportamento | Caso de Uso |
|------|--------------|-------------|
| **Pular** | Ignora produtos já existentes | Adicionar APENAS novos produtos |
| **Atualizar** | Sobrescreve preço, descrição, estoque, imagem | Sincronizar catálogo atualizado |
| **Criar mesmo assim** | Cria duplicatas (atual) | Importação de teste/backup |

---

## Interface do Usuário

### Novo Passo: Análise de Duplicatas (entre Validação e Confirmação)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 Análise de Duplicatas                                                   │
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                           │
│  │    150      │ │     42      │ │    108      │                           │
│  │  Produtos   │ │   Novos     │ │  Existentes │                           │
│  │   Total     │ │   🆕        │ │   ⚠️        │                           │
│  └─────────────┘ └─────────────┘ └─────────────┘                           │
│                                                                             │
│  🔧 Como deseja tratar os 108 produtos existentes?                         │
│                                                                             │
│  ○ Pular - Importar apenas os 42 novos produtos                           │
│  ● Atualizar - Atualizar dados dos 108 existentes + criar 42 novos        │
│  ○ Criar mesmo assim - Importar todos (pode gerar duplicatas)             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ [✓] Atualizar imagens dos produtos existentes que não têm imagem   │   │
│  │ [✓] Buscar imagens automaticamente para produtos sem imagem        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  [← Voltar]                                    [Continuar →]               │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Preview com Badges de Status

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Produto                    │ Categoria      │ Preço     │ Status          │
├─────────────────────────────┼────────────────┼───────────┼─────────────────┤
│  Dipirona 500mg             │ Medicamentos   │ R$ 12,90  │ 🆕 Novo         │
│  Paracetamol 750mg          │ Medicamentos   │ R$ 8,50   │ ⚠️ Existente    │
│  Vitamina C 1000mg          │ Vitaminas      │ R$ 25,00  │ ⚠️ Atualizar    │
│  Protetor Solar FPS 50      │ Beleza         │ R$ 45,00  │ 🆕 Novo         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Atualização Inteligente de Imagens

### Cenários de Atualização

1. **Produto existente sem imagem** → Buscar automaticamente (se opção marcada)
2. **Planilha traz nova imagem_url** → Substituir imagem existente
3. **Produto existente com imagem válida** → Manter (não sobrescrever)

### Opções de Imagem na Importação

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  🖼️ Opções de Imagem                                                       │
│                                                                             │
│  [✓] Atualizar imagens quando a planilha trouxer nova URL                 │
│  [✓] Buscar imagens automaticamente para produtos SEM imagem              │
│  [ ] Substituir TODAS as imagens dos produtos atualizados                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Importação Atualizado

```text
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│  Upload  │ → │ Mapeamento│ → │ Validação│ → │ Duplicatas│ → │ Importar │
│          │   │          │   │          │   │          │   │          │
│  📄      │   │  🔗      │   │  ✓       │   │  🔍      │   │  ⬇️      │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
                                              NOVO PASSO
```

---

## Implementação Técnica

### 1. Edge Function: Detectar Duplicatas

Nova action `check-duplicates` na edge function `import-products`:

```typescript
// Consulta para encontrar duplicatas
const { data: existingProducts } = await supabase
  .from('products')
  .select('id, name, category_id, price, image_url')
  .eq('store_id', storeId);

// Criar mapa de lookup por chave composta
const existingMap = new Map();
existingProducts?.forEach(p => {
  const key = `${p.name.toLowerCase().trim()}|${categoryIdToName[p.category_id]?.toLowerCase()}`;
  existingMap.set(key, p);
});

// Classificar cada produto da planilha
products.forEach(product => {
  const key = `${product.nome.toLowerCase().trim()}|${product.categoria.toLowerCase().trim()}`;
  if (existingMap.has(key)) {
    duplicates.push({ 
      product, 
      existingProduct: existingMap.get(key),
      status: 'existing' 
    });
  } else {
    newProducts.push({ product, status: 'new' });
  }
});
```

### 2. Edge Function: Importar com Upsert

```typescript
// Modo "update" - usar upsert com chave composta
if (duplicateAction === 'update') {
  // Buscar produto existente pelo nome + categoria
  const existing = existingMap.get(key);
  
  if (existing) {
    // Determinar se deve atualizar imagem
    let imageUrl = existing.image_url;
    
    if (imageOptions.updateFromSpreadsheet && product.imagem_url) {
      // Planilha traz nova URL
      imageUrl = product.imagem_url;
    } else if (imageOptions.searchMissing && !existing.image_url) {
      // Buscar imagem automaticamente
      imageUrl = await searchProductImage(product.nome, storeId);
    }
    
    // UPDATE do produto existente
    await supabase
      .from('products')
      .update({
        price: product.preco,
        description: product.descricao,
        offer_price: product.preco_oferta,
        is_on_offer: hasOfferPrice,
        stock_quantity: product.quantidade_estoque,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
      
    updatedCount++;
  }
} else if (duplicateAction === 'skip') {
  // Pular produtos existentes
  skippedCount++;
} else {
  // Criar mesmo assim (comportamento atual)
  await supabase.from('products').insert({...});
}
```

### 3. Novo Componente: DuplicateAnalysisStep

Campos:
- `duplicateAction`: 'skip' | 'update' | 'create'
- `imageOptions.updateFromSpreadsheet`: boolean
- `imageOptions.searchMissing`: boolean
- `imageOptions.replaceAll`: boolean

### 4. Atualizar Interface ImportPayload

```typescript
interface ImportPayload {
  action: 'validate' | 'check-duplicates' | 'import';
  storeId: string;
  createMissingCategories: boolean;
  products: ProductImportData[];
  fileName: string;
  // Novos campos
  duplicateAction?: 'skip' | 'update' | 'create';
  imageOptions?: {
    updateFromSpreadsheet: boolean;
    searchMissing: boolean;
    replaceAll: boolean;
  };
}
```

---

## Arquivos a Modificar/Criar

| Arquivo | Tipo | Alteração |
|---------|------|-----------|
| `supabase/functions/import-products/index.ts` | Modificar | Adicionar action `check-duplicates`, lógica de upsert e opções de imagem |
| `src/components/admin/products/import/DuplicateAnalysisStep.tsx` | Criar | UI para análise e opções de duplicatas |
| `src/pages/admin/ProductImportPage.tsx` | Modificar | Adicionar novo passo no wizard |
| `src/hooks/useProductImport.ts` | Modificar | Adicionar função `checkDuplicates` e parâmetros de opções |

---

## Resumo das Estatísticas de Importação

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 Resultado da Importação                                                 │
│                                                                             │
│  ✅ 42 produtos criados                                                     │
│  🔄 95 produtos atualizados                                                 │
│  ⏭️ 13 produtos pulados (já existentes)                                    │
│  🖼️ 28 imagens buscadas automaticamente                                    │
│  ❌ 2 erros                                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Benefícios

1. **Evita duplicatas acidentais** - Nunca mais subir a mesma planilha duas vezes
2. **Atualização em massa** - Sincronizar preços e estoque de fornecedores
3. **Imagens inteligentes** - Buscar automaticamente apenas quando necessário
4. **Flexibilidade** - Escolher comportamento por importação
5. **Rastreabilidade** - Log detalhado de criações vs atualizações
6. **Performance** - Usar chave composta indexada para busca rápida
