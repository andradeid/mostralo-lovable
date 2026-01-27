

# Plano: Sistema de Produtos em Destaque com Aba "Destaques" em Primeiro

## Resumo

Criar uma nova aba "Destaques" na loja pública que aparece **em primeiro lugar** na navegação, seguida por "Todas" e depois as categorias. Isso permite que o cliente veja imediatamente os produtos curados pelo lojista.

---

## Ordem das Abas

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          NAVEGAÇÃO DA LOJA                                  │
│                                                                             │
│  [⭐ Destaques] [Todas] [Medicamentos] [Higiene] [Vitaminas] ...           │
│       ↑           ↑              ↑                                          │
│    PRIMEIRO    SEGUNDO      CATEGORIAS                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Comportamento:**
- **Destaques** → Mostra APENAS produtos marcados como destaque (página inicial padrão)
- **Todas** → Mostra todos os produtos disponíveis
- **Categoria X** → Mostra produtos da categoria específica

---

## Implementação

### 1. Banco de Dados - Adicionar Coluna `is_featured`

**Nova migração SQL:**

```sql
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_products_is_featured 
ON public.products(is_featured) WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_products_store_featured 
ON public.products(store_id, is_featured) WHERE is_featured = true;
```

---

### 2. Formulário de Produto (Admin)

**Arquivo:** `src/components/admin/ProductForm.tsx`

Adicionar toggle na seção de configurações:

- Campo: `is_featured` (boolean, default: false)
- Label: "Produto em Destaque"
- Descrição: "Este produto aparecerá na aba Destaques da loja"
- Ícone: Estrela (Star)
- Localização: Junto ao toggle de disponibilidade

---

### 3. Lista de Produtos (Admin)

**Arquivo:** `src/pages/admin/ProductsPage.tsx`

- Badge visual (estrela) nos produtos em destaque
- Botão de ação rápida para marcar/desmarcar destaque
- Filtro "Em Destaque" no dropdown de filtros

---

### 4. Página da Loja (Store.tsx)

**Arquivo:** `src/pages/Store.tsx`

#### 4.1 Estado Inicial

O estado `selectedCategory` iniciará como `"featured"` para que a aba Destaques seja a página inicial:

```typescript
const [selectedCategory, setSelectedCategory] = useState<string | null>('featured');
```

#### 4.2 Ordem de Renderização das Abas

```typescript
{/* 1. PRIMEIRO - Aba Destaques */}
{hasFeaturedProducts && (
  <Button 
    variant={selectedCategory === 'featured' ? "default" : "outline"}
    onClick={() => setSelectedCategory('featured')}
  >
    <Star className="w-4 h-4 mr-1" />
    Destaques
  </Button>
)}

{/* 2. SEGUNDO - Aba Todas */}
<Button 
  variant={selectedCategory === null ? "default" : "outline"}
  onClick={() => setSelectedCategory(null)}
>
  Todas
</Button>

{/* 3. TERCEIRO - Categorias */}
{categories.map((category) => (
  <Button onClick={() => setSelectedCategory(category.id)}>
    {category.name}
  </Button>
))}
```

#### 4.3 Lógica de Filtragem

```typescript
const getProductsByCategory = (categoryId: string | null) => {
  // Aba "Destaques" selecionada
  if (categoryId === 'featured') {
    return products.filter(p => p.is_featured === true);
  }
  
  // Aba "Todas" selecionada
  if (categoryId === null) {
    return products;
  }
  
  // Categoria específica
  return products.filter(p => p.category_id === categoryId);
};
```

---

## Interface Visual

### Na Loja (Navegação):
```text
┌─────────────────────────────────────────────────────────────────┐
│  [⭐ Destaques] [Todas] [Medicamentos] [Higiene] [Vitaminas]   │
│       ↑                                                         │
│  Selecionada por padrão ao entrar na loja                      │
└─────────────────────────────────────────────────────────────────┘
```

### No Formulário de Produto (Admin):
```text
┌─────────────────────────────────────────────────────────────────┐
│ Configurações                                                   │
├─────────────────────────────────────────────────────────────────┤
│ [●───] Produto disponível para venda                            │
│                                                                 │
│ [○───] Produto em Destaque ⭐                                   │
│   Este produto aparecerá na aba "Destaques" da loja            │
└─────────────────────────────────────────────────────────────────┘
```

### Na Lista de Produtos (Admin):
```text
┌─────────────────────────────────────────────────────────────────┐
│ [Imagem] Dipirona 500mg                          R$ 12,90      │
│          Categoria: Medicamentos                                │
│          ⭐ Destaque | ✓ Disponível                             │
│          [Editar] [⭐ Toggle] [🗑️]                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `supabase/migrations/` | Nova migração para coluna `is_featured` |
| `src/components/admin/ProductForm.tsx` | Adicionar toggle de destaque |
| `src/pages/admin/ProductsPage.tsx` | Badge, filtro e ação rápida |
| `src/pages/Store.tsx` | Nova aba "Destaques" em primeiro, estado inicial |

---

## Detalhes Técnicos

### Schema Zod (ProductForm.tsx)
```typescript
const productSchema = z.object({
  // ... campos existentes
  is_featured: z.boolean().default(false),
});
```

### Verificação de Produtos em Destaque
```typescript
// Verificar se há produtos em destaque para mostrar a aba
const hasFeaturedProducts = products.some(p => p.is_featured === true);

// Se não houver destaques, iniciar na aba "Todas"
useEffect(() => {
  if (!hasFeaturedProducts && selectedCategory === 'featured') {
    setSelectedCategory(null);
  }
}, [hasFeaturedProducts]);
```

---

## Benefícios

1. **Primeira Impressão**: Cliente vê os melhores produtos ao entrar na loja
2. **Curadoria**: Lojista controla o que aparece na vitrine principal
3. **Performance**: Com 14.000 produtos, a aba Destaques carrega apenas os selecionados
4. **Flexibilidade**: Cliente pode ver todos os produtos na aba "Todas" quando quiser
5. **Promoções**: Ideal para destacar ofertas, lançamentos ou produtos sazonais

