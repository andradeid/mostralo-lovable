
# Plano: Adicionar Informações da Loja ao Modal de Pagamento

## Objetivo
Enriquecer o modal "Finalizar Venda" com branding da loja para uma experiência mais profissional.

## Elementos a Adicionar

| Elemento | Posição | Descrição |
|----------|---------|-----------|
| Logo da loja | Cabeçalho do modal | Ao lado do título "Finalizar Venda" |
| Nome da loja | Abaixo/ao lado do logo | Identifica o estabelecimento |
| Número da venda (opcional) | Próximo ao título | Formato: #001234 (sequencial) |

## Layout Proposto

```text
┌─────────────────────────────────────────────────────────────────┐
│  [LOGO]  Nome da Loja                                     [X]  │
│          Finalizar Venda                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Itens da Venda (7)            │    Subtotal      R$ 93,00    │
│  ┌─────────────────────────┐   │    Desconto         0        │
│  │ Lista de produtos...    │   │    ─────────────────────     │
│  └─────────────────────────┘   │    Total         R$ 93,00    │
│                                 │                               │
│                                 │    Forma de Pagamento         │
│                                 │    [Dinheiro] [Crédito]...    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [Imprimir recibo]          [Confirmar R$ 93,00]   [Cancelar]  │
└─────────────────────────────────────────────────────────────────┘
```

## Alterações Técnicas

### 1. Expandir Query da Loja (`PDVPage.tsx`)

**Arquivo:** `src/pages/admin/PDVPage.tsx`
**Linhas:** 84-96

Adicionar `logo_url` à consulta existente:

```tsx
// Antes
.select('name')

// Depois  
.select('name, logo_url')
```

### 2. Atualizar Interface do Modal (`PDVPaymentModal.tsx`)

**Arquivo:** `src/components/pdv/PDVPaymentModal.tsx`

Adicionar props para receber dados da loja:

```tsx
interface PDVPaymentModalProps {
  // props existentes...
  storeName?: string;    // Nome da loja
  storeLogo?: string;    // URL do logo
}
```

### 3. Redesenhar Cabeçalho do Modal

Substituir o cabeçalho simples por um header com branding:

```tsx
<DialogHeader className="pb-4 border-b">
  <div className="flex items-center gap-4">
    {/* Logo da loja */}
    {storeLogo ? (
      <img 
        src={storeLogo} 
        alt={storeName}
        className="w-12 h-12 rounded-lg object-cover border"
      />
    ) : (
      <div className="w-12 h-12 rounded-lg bg-primary/10 
                      flex items-center justify-center">
        <Store className="h-6 w-6 text-primary" />
      </div>
    )}
    
    {/* Textos */}
    <div>
      {storeName && (
        <p className="text-sm text-muted-foreground font-medium">
          {storeName}
        </p>
      )}
      <DialogTitle className="text-xl">Finalizar Venda</DialogTitle>
    </div>
  </div>
</DialogHeader>
```

### 4. Passar Props no PDVPage

Atualizar as duas chamadas do `PDVPaymentModal` (mobile e desktop):

```tsx
<PDVPaymentModal
  open={paymentModalOpen}
  onOpenChange={setPaymentModalOpen}
  subtotal={subtotal}
  items={cart}
  onConfirm={handleFinalize}
  isProcessing={isProcessing}
  storeName={storeData?.name}      // Novo
  storeLogo={storeData?.logo_url}  // Novo
/>
```

### 5. Adaptar para Mobile (Drawer)

O mesmo padrão de header será aplicado no `DrawerHeader` para manter consistência:

```tsx
<DrawerHeader className="text-left border-b pb-4">
  <div className="flex items-center gap-3">
    {/* Logo menor para mobile */}
    {storeLogo ? (
      <img src={storeLogo} className="w-10 h-10 rounded-lg..." />
    ) : (
      <div className="w-10 h-10 rounded-lg bg-primary/10...">
        <Store className="h-5 w-5 text-primary" />
      </div>
    )}
    <div>
      {storeName && <p className="text-xs...">{storeName}</p>}
      <DrawerTitle className="text-xl">Finalizar Venda</DrawerTitle>
    </div>
  </div>
</DrawerHeader>
```

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/admin/PDVPage.tsx` | Expandir query + passar props |
| `src/components/pdv/PDVPaymentModal.tsx` | Adicionar props + redesenhar header |

## Resultado Visual Esperado

O modal terá um cabeçalho profissional com:
- Logo da loja (ou ícone placeholder se não houver logo)
- Nome da loja em destaque
- Título "Finalizar Venda" mantido
- Separador visual entre header e conteúdo
