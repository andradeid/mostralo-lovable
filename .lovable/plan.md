
# Plano: Melhorias no PDV - Carrinho Fixo e Impressão de Venda

## Problema Identificado

### 1. Botão "Finalizar" some ao rolar
Na imagem fornecida, o carrinho está à direita da tela como um `Card` normal. Quando há muitos produtos na lista de produtos (à esquerda), o usuário rola a página e o botão "Finalizar Venda" no rodapé do carrinho pode ficar invisível.

### 2. Impressão no PDV
Analisando o código atual:
- **Comandas** têm impressão implementada via `printComanda()` ✅
- **Vendas de balcão (PDV)** NÃO têm impressão ❌

O fluxo atual do `finalizeSale` no `usePDV.ts`:
1. Cria comanda tipo "balcão"
2. Adiciona itens
3. Fecha comanda
4. Limpa carrinho
5. **Não imprime nada!**

---

## Solução Proposta

### Parte 1: Carrinho Sticky (Sempre Visível)

**Abordagem técnica**: Usar `position: sticky` com `top: 0` no container do carrinho no layout Desktop.

**Alterações em `PDVPage.tsx`**:
```text
Antes:
<div className="w-80 lg:w-96 flex-shrink-0">
  <PDVCart ... />
</div>

Depois:
<div className="w-80 lg:w-96 flex-shrink-0 self-start sticky top-0">
  <PDVCart ... />
</div>
```

**Alterações em `PDVCart.tsx`**:
- Ajustar a altura máxima do carrinho para `max-h-[calc(100vh-120px)]` para evitar que ultrapasse a viewport
- O `CardFooter` com o botão "Finalizar" já está dentro do Card, então ficará visível com o sticky

### Parte 2: Impressão Automática de Venda PDV

**Fluxo proposto**:
1. Após `finalizeSale`, retornar a comanda criada com seus itens
2. Chamar `printComanda()` automaticamente
3. Opção: Adicionar botão "Imprimir" no modal de pagamento ou imprimir automaticamente após confirmação

**Alterações necessárias**:

1. **`usePDV.ts`**: Modificar `finalizeSale` para retornar a comanda completa com itens
   
2. **`PDVPage.tsx`**: 
   - Após `handleFinalize`, chamar `printComanda()` com a comanda retornada
   - Usar o `printComanda` que já existe e está funcionando para comandas

3. **`PDVPaymentModal.tsx`** (opcional):
   - Adicionar checkbox "Imprimir cupom após finalizar"
   - Ou adicionar botão "Imprimir" no modal de sucesso

---

## Detalhes Técnicos

### Modificação 1: PDVPage.tsx (Sticky Cart)
```tsx
// Linha ~318 - Desktop layout
<div className="w-80 lg:w-96 flex-shrink-0 self-start sticky top-0 max-h-[calc(100vh-80px)]">
  <PDVCart ... />
</div>
```

### Modificação 2: PDVCart.tsx (Altura máxima)
```tsx
// Linha ~37
<Card className="flex flex-col h-full max-h-[calc(100vh-100px)] overflow-hidden">
```

### Modificação 3: usePDV.ts (Retornar dados para impressão)
```tsx
// finalizeSale retorna { comanda, items } para permitir impressão
const finalizeSale = async (...) => {
  // ... código existente ...
  
  // Buscar itens criados para impressão
  const { data: createdItems } = await supabase
    .from('comanda_items')
    .select('*')
    .eq('comanda_id', comanda.id);
  
  return { comanda, items: createdItems || [] };
};
```

### Modificação 4: PDVPage.tsx (Impressão automática)
```tsx
const handleFinalize = async (paymentMethod, discount, paymentDetails) => {
  const result = await finalizeSale(paymentMethod, discount, paymentDetails);
  setPaymentModalOpen(false);
  
  // Imprimir automaticamente
  if (result?.comanda && result?.items) {
    printComanda(
      result.comanda, 
      result.items, 
      storeData?.name || 'Estabelecimento'
    );
  }
};
```

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `PDVPage.tsx` | Adicionar classes `self-start sticky top-0 max-h-[calc(100vh-80px)]` no container do carrinho |
| `PDVCart.tsx` | Adicionar `max-h-[calc(100vh-100px)] overflow-hidden` no Card principal |
| `usePDV.ts` | Modificar `finalizeSale` para retornar comanda + itens |
| `PDVPage.tsx` | Chamar `printComanda()` após finalização bem-sucedida |

---

## Benefícios

1. **UX melhorada**: Operador sempre vê o botão "Finalizar" sem precisar rolar
2. **Fluxo profissional**: Impressão automática do cupom como em PDVs tradicionais
3. **Reutilização**: Usa o sistema de impressão já existente (`printComanda`)
4. **Consistência**: Mesmo formato de impressão entre comandas e vendas balcão
