

## Objetivo
Fazer o botão "Nova Loja" em `/dashboard/stores` abrir um dialog onde o master admin cria uma loja **vazia** (sem clonar) e escolhe o **dono** entre os `store_admin` já existentes — igual ao seletor de proprietário do "Clonar Loja".

## Análise do que já existe (não vou quebrar)

1. **`CreateStoreOwnerDialog`** (usado em SubscribersPage) — cria dono novo + loja. Continua intacto, é outro fluxo.
2. **`CloneStoreDialog`** — já tem a lógica de listar owners (`fetchOwners` via `user_roles` + `profiles`). Vou reaproveitar o mesmo padrão.
3. **Botão "Nova Loja"** em `StoresPage.tsx` (linha 177-180) hoje **não tem `onClick`** — é só visual. Vou plugar o novo dialog nele.
4. **Padrão de criação de loja** (do `CreateStoreOwnerDialog` linhas 149-192): insert em `stores` → insert em `user_roles` (role `store_admin` + `store_id`) → insert em `store_configurations`. Vou seguir exatamente esse padrão.

## Componente novo: `CreateStoreForExistingOwnerDialog.tsx`

Localização: `src/components/admin/stores/CreateStoreForExistingOwnerDialog.tsx`

**Campos do formulário:**
- **Nome da Loja** * (gera slug automático)
- **Slug (URL)** * (editável, validação de duplicado)
- **Proprietário (Store Admin)** * — Select com lista de `store_admin` existentes (mesmo `fetchOwners` do CloneStoreDialog)
- **Descrição** (opcional)
- **Telefone, Cidade, Estado** (opcionais)
- **Plano** (opcional, mesmo Select do `CreateStoreOwnerDialog`)
- **Data de Expiração** (opcional, mesmo Calendar)

**Fluxo do submit:**
1. Validar slug duplicado (`stores.slug`)
2. `INSERT INTO stores` com `owner_id = ownerId selecionado`, `status = 'active'`
3. `INSERT INTO user_roles` (`role: store_admin`, `store_id: novo`, `user_id: ownerSelecionado`) — permite multi-loja para o mesmo dono (já suportado pelo `useStoreAccess`)
4. `INSERT INTO store_configurations`
5. Notificar via `send-master-notification` (`type: 'new_store'`)
6. `onSuccess()` recarrega lista + fecha dialog

## Edição em `StoresPage.tsx`

- Adicionar `useState` `showCreateDialog`
- Plugar `onClick={() => setShowCreateDialog(true)}` no botão "Nova Loja"
- Renderizar `<CreateStoreForExistingOwnerDialog>` ao lado do `<CloneStoreDialog>`, passando `onSuccess={fetchStores}`

## Garantias de não-quebrar

- Não toco em `CreateStoreOwnerDialog`, `CloneStoreDialog`, `SubscribersPage`, nem em RLS/migrations.
- Reutilizo exatamente o mesmo padrão de inserts já validado em produção (`stores` + `user_roles` + `store_configurations`).
- O hook `useStoreAccess` já lida com store_admin tendo múltiplas lojas (linhas 96-167 do hook), então vincular uma loja extra a um dono existente vai funcionar nativamente — ele aparecerá no seletor de loja ativa.
- Validação de slug duplicado antes do insert evita erro de constraint.

## Arquivos afetados
- **Criar**: `src/components/admin/stores/CreateStoreForExistingOwnerDialog.tsx`
- **Editar**: `src/pages/admin/StoresPage.tsx` (adicionar state + onClick + render do dialog)

