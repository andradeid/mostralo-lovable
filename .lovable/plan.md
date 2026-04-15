

## Plano: Auto-fechar sidebar no mobile/tablet ao clicar em menu

### Conceito
Você está correto — em mobile e tablet, o padrão de UX é o menu lateral fechar automaticamente quando o usuário toca em um item. Forçar o usuário a clicar fora é uma fricção desnecessária.

### Como funciona hoje
No mobile, o sidebar usa um `Sheet` (modal overlay) controlado por `openMobile`/`setOpenMobile` do `useSidebar()`. Ao clicar num item, a navegação acontece mas o Sheet permanece aberto.

### Solução
Adicionar um `onClick` handler nos links do menu que chama `setOpenMobile(false)` quando `isMobile` é `true`. Isso se aplica aos dois componentes com sidebar:

**Arquivos a editar:**

1. **`src/components/admin/AdminSidebar.tsx`**
   - Já tem `const { state, isMobile } = useSidebar()` — basta adicionar `setOpenMobile` na desestruturação
   - Nos `PreloadNavLink` (linhas ~905 e ~947), adicionar `onClick={() => isMobile && setOpenMobile(false)}`

2. **`src/components/delivery/DeliveryDriverSidebar.tsx`**
   - Importar `setOpenMobile` do `useSidebar()`
   - Adicionar o mesmo `onClick` nos `PreloadLink` dos itens de menu

3. **`src/components/professional/ProfessionalSidebar.tsx`**
   - Importar `useSidebar` e adicionar a mesma lógica nos `PreloadLink`

### Detalhes técnicos
- A função `setOpenMobile(false)` fecha o `Sheet` do sidebar no mobile
- No desktop (`isMobile === false`), o handler não faz nada — comportamento preservado
- O breakpoint mobile já está definido como `< 1024px` (cobre mobile + tablet)
- Nenhuma funcionalidade existente é alterada

