
# Plano: Filtro de Estoque Válido + Importação em Lotes + Cálculo de Custo SerpAPI

## Resumo

Implementar funcionalidade para filtrar produtos por estoque válido antes da importação, permitir importação em lotes de 500 produtos, e exibir cálculo de custo estimado baseado nos planos SerpAPI.

---

## Análise do Cenário Atual

### O que já existe:
- O parser Alquimia captura `quantidade_estoque` de cada produto
- Filtro de produtos "válidos" (nome e preço) já existe
- Processamento em lotes de 50 para busca de imagens já implementado
- Contador de requisições na tela de configuração

### O que falta:
- **Filtro de estoque > 0** antes de buscar imagens
- **Seleção de quantidade para importar** (500 de cada vez)
- **Cálculo de custo estimado** baseado no SerpAPI

---

## Estimativa de Custos SerpAPI

| Plano | Preço (USD/mês) | Buscas/mês | Custo por busca |
|-------|-----------------|------------|-----------------|
| Free | $0 | 250 | R$ 0,00 |
| Starter | $25 | 1.000 | ~R$ 0,14 |
| Developer | $75 | 5.000 | ~R$ 0,08 |
| Production | $150 | 15.000 | ~R$ 0,055 |
| Big Data | $275 | 30.000 | ~R$ 0,05 |

### Para 14.000 produtos:
- **Plano Production ($150)** = 15.000 buscas → suficiente
- **Custo estimado: ~$150 USD (~R$ 825)** para toda a operação
- **Se importar 500 de cada vez (28 lotes)**:
  - Cada lote de 500 = ~$5 USD (~R$ 27,50)
  - Pode distribuir ao longo de meses usando o plano mais barato

---

## Implementação

### 1. Adicionar Toggle "Apenas com Estoque" no Preview

**Arquivo:** `src/components/admin/products/import/AlquimiaPreviewStep.tsx`

- Adicionar switch para filtrar apenas produtos com `quantidade_estoque > 0`
- Atualizar estatísticas em tempo real
- Mostrar quantos produtos têm estoque válido vs sem estoque

### 2. Adicionar Seletor de Quantidade no Export

**Arquivo:** `src/components/admin/products/import/AlquimiaExportStep.tsx`

- Adicionar slider/input para selecionar quantos produtos importar (1 a N)
- Presets: 100, 250, 500, 1000, Todos
- Mostrar estimativa de tempo e custo em tempo real
- Informar produtos restantes para próximas importações

### 3. Passar Filtro de Estoque para a Página Principal

**Arquivo:** `src/pages/admin/AlquimiaImportPage.tsx`

- Receber configuração de "apenas com estoque"
- Aplicar filtro antes de enviar para busca de imagens
- Limitar quantidade de produtos baseado na seleção do usuário

### 4. Exibir Painel de Custo Estimado

**Arquivo:** `src/components/admin/products/import/AlquimiaExportStep.tsx`

- Card com cálculo baseado no plano SerpAPI
- Mostrar: Quantidade selecionada × Custo por busca
- Sugerir melhor plano baseado no volume
- Mostrar economias por filtrar produtos sem estoque

---

## Fluxo do Usuário

```text
+-------------------+       +----------------------+       +-------------------------+
|  1. Upload CSV    | ----> |  2. Preview + Filtro | ----> |  3. Configurar + Exportar|
|  (14.000 prods)   |       |  [x] Apenas estoque  |       |  Qtd: [500]              |
+-------------------+       |  8.000 com estoque   |       |  Custo: ~R$ 27,50        |
                            +----------------------+       +-------------------------+
                                                                      |
                                                                      v
                                                           +-------------------------+
                                                           |  4. Importar Lote 1/28  |
                                                           |  500 produtos           |
                                                           +-------------------------+
```

---

## Interface Proposta

### No Preview (Passo 2):
```text
┌─────────────────────────────────────────────────┐
│ ☑ Apenas produtos com estoque > 0              │
│   8.234 de 14.000 produtos têm estoque válido  │
│   (57% dos produtos serão importados)          │
└─────────────────────────────────────────────────┘
```

### No Export (Passo 3):
```text
┌─────────────────────────────────────────────────┐
│ 💰 Estimativa de Custo (SerpAPI)               │
├─────────────────────────────────────────────────┤
│ Produtos com estoque: 8.234                    │
│ Quantidade a importar: [500    ] ▾             │
│                                                 │
│ Custo estimado: ~R$ 27,50 (500 buscas)         │
│ Lotes restantes: 16 (para importar tudo)       │
│                                                 │
│ 💡 Dica: Use o plano Production ($150/mês)     │
│    para importar todos de uma vez              │
└─────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/admin/products/import/AlquimiaPreviewStep.tsx` | Adicionar toggle de filtro por estoque, callback |
| `src/components/admin/products/import/AlquimiaExportStep.tsx` | Adicionar seletor de quantidade, card de custo |
| `src/pages/admin/AlquimiaImportPage.tsx` | Gerenciar estado do filtro, aplicar limite de quantidade |
| `src/lib/parseAlquimia.ts` | (Opcional) Adicionar flag `hasStock` para facilitar filtros |

---

## Detalhes Técnicos

### Estado para Filtro de Estoque
```typescript
const [onlyWithStock, setOnlyWithStock] = useState(false);

// Filtrar produtos
const productsWithStock = products.filter(p => p.quantidade_estoque > 0);
const displayProducts = onlyWithStock ? productsWithStock : products;
```

### Estado para Limite de Quantidade
```typescript
const [importLimit, setImportLimit] = useState<number | 'all'>(500);

// Aplicar limite
const productsToImport = importLimit === 'all' 
  ? validProducts 
  : validProducts.slice(0, importLimit);
```

### Cálculo de Custo
```typescript
const COST_PER_SEARCH_BRL = 0.055; // Baseado no plano Production

const estimatedCost = productsToImport.length * COST_PER_SEARCH_BRL;
const remainingProducts = validProducts.length - productsToImport.length;
const remainingBatches = Math.ceil(remainingProducts / importLimit);
```

---

## Benefícios

1. **Economia**: Filtrar produtos sem estoque pode reduzir de 14.000 → ~8.000 buscas (43% de economia)
2. **Controle**: Importar em lotes permite pausar e continuar depois
3. **Transparência**: Usuário sabe exatamente quanto vai gastar
4. **Flexibilidade**: Pode ajustar plano SerpAPI conforme volume mensal

