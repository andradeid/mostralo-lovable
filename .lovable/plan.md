
# Plano: Aba "Destaques" como Padrão ao Abrir a Loja

## Problema Identificado

Atualmente, a loja sempre abre na aba "Todas" (linha 134: `selectedCategory` inicia como `null`). A lógica para abrir automaticamente na aba "Destaques" quando há produtos em destaque **não foi implementada**.

---

## Solução Proposta

Adicionar um `useEffect` que monitora quando os produtos são carregados e define a categoria inicial:

- **Se houver produtos em destaque** → Abre na aba "Destaques" (`selectedCategory = 'featured'`)
- **Se NÃO houver produtos em destaque** → Permanece na aba "Todas" (`selectedCategory = null`)

---

## Implementação

### Arquivo: `src/pages/Store.tsx`

Adicionar um novo `useEffect` após o `hasFeaturedProducts` (após linha 692):

```typescript
// Definir aba inicial baseado em produtos em destaque
useEffect(() => {
  // Só executa quando os produtos foram carregados pela primeira vez
  // e nenhuma categoria foi selecionada manualmente ainda
  if (products.length > 0 && selectedCategory === null && !loadingProducts) {
    if (hasFeaturedProducts) {
      setSelectedCategory('featured');
    }
  }
}, [products.length, hasFeaturedProducts, loadingProducts]);

// Se não houver destaques e estiver na aba featured, voltar para Todas
useEffect(() => {
  if (!hasFeaturedProducts && selectedCategory === 'featured') {
    setSelectedCategory(null);
  }
}, [hasFeaturedProducts, selectedCategory]);
```

---

## Lógica Detalhada

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FLUXO DE ABERTURA DA LOJA                               │
│                                                                             │
│  1. Usuário acessa /loja/farmacia-exemplo                                  │
│  2. Página carrega produtos do banco                                       │
│  3. useEffect verifica se há produtos com is_featured = true               │
│  4. SE houver → selectedCategory = 'featured' (aba Destaques)             │
│  5. SE NÃO houver → selectedCategory = null (aba Todas)                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Por que esta abordagem é eficiente?

1. **Não bloqueia o carregamento inicial** - O estado começa como `null` e é atualizado após os produtos carregarem
2. **Evita flicker visual** - A mudança ocorre antes do usuário ver a lista de produtos
3. **Fallback automático** - Se o lojista remover todos os destaques, automaticamente volta para "Todas"
4. **Preserva seleção manual** - Se o usuário clicar em outra aba, a escolha é respeitada
5. **Funciona com infinite scroll** - Ao carregar mais produtos com destaque, não altera a seleção atual

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Store.tsx` | Adicionar `useEffect` para definir aba inicial baseado em `hasFeaturedProducts` |

---

## Resultado Esperado

- Loja com produtos em destaque → Abre na aba "Destaques"
- Loja sem produtos em destaque → Abre na aba "Todas"
- Usuário pode navegar livremente entre as abas
- Se todos os destaques forem removidos (admin), volta automaticamente para "Todas"
