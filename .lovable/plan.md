
# Plano: Separar Verificação de Módulos no Sidebar

## Problema Identificado

O AdminSidebar (linhas 644-652) agrupa 4 funcionalidades diferentes sob um ÚNICO módulo `pdv_comandas`:

```typescript
// CÓDIGO ATUAL - INCORRETO
if (hasModule('pdv_comandas')) {
  menuItems.push(
    { title: 'PDV', ...},
    { title: 'Comandas', ...},
    { title: 'Cozinha (KDS)', ...},        // Deveria verificar 'kds'
    { title: 'Totem Autoatendimento', ...} // Deveria verificar 'self_service_totem'
  );
}
```

Porém, existem módulos **SEPARADOS** no banco:

| Módulo no Banco | Key | Funcionalidade |
|-----------------|-----|----------------|
| PDV e Comandas | `pdv_comandas` | PDV + Comandas |
| KDS (Cozinha) | `kds` | Cozinha (KDS) |
| Totem Autoatendimento | `self_service_totem` | Totem |
| Cardápio na Mesa | `self_service_table` | Mesas QR Code |

---

## Solução

Separar a verificação de cada módulo individualmente.

---

## Alteração no Código

### Arquivo: src/components/admin/AdminSidebar.tsx

**Linhas 644-652 - ANTES:**
```typescript
// PDV e Comandas - verifica módulo
if (hasModule('pdv_comandas')) {
  menuItems.push(
    { title: 'PDV', url: '/dashboard/pdv', icon: Monitor, group: 'Vendas Presenciais' },
    { title: 'Comandas', url: '/dashboard/comandas', icon: Receipt, group: 'Vendas Presenciais' },
    { title: 'Cozinha (KDS)', url: '/dashboard/cozinha', icon: UtensilsCrossed, group: 'Vendas Presenciais' },
    { title: 'Totem Autoatendimento', url: '/dashboard/totem-config', icon: Smartphone, group: 'Vendas Presenciais' }
  );
}
```

**Linhas 644-670 - DEPOIS:**
```typescript
// PDV e Comandas - verifica módulo pdv_comandas
if (hasModule('pdv_comandas')) {
  menuItems.push(
    { title: 'PDV', url: '/dashboard/pdv', icon: Monitor, group: 'Vendas Presenciais' },
    { title: 'Comandas', url: '/dashboard/comandas', icon: Receipt, group: 'Vendas Presenciais' }
  );
}

// Cozinha (KDS) - verifica módulo kds SEPARADAMENTE
if (hasModule('kds')) {
  menuItems.push(
    { title: 'Cozinha (KDS)', url: '/dashboard/cozinha', icon: UtensilsCrossed, group: 'Vendas Presenciais' }
  );
}

// Totem Autoatendimento - verifica módulo self_service_totem SEPARADAMENTE
if (hasModule('self_service_totem')) {
  menuItems.push(
    { title: 'Totem Autoatendimento', url: '/dashboard/totem-config', icon: Smartphone, group: 'Vendas Presenciais' }
  );
}
```

O módulo **Mesas QR Code** já está correto (linha 655-658), verificando `self_service_table`.

---

## Resultado Esperado

| Módulo Desabilitado no Master Admin | Item do Menu | Antes | Depois |
|-------------------------------------|--------------|-------|--------|
| KDS (Cozinha) | Cozinha (KDS) | Aparece | Oculto |
| Totem Autoatendimento | Totem Autoatendimento | Aparece | Oculto |
| Cardápio na Mesa | Mesas QR Code | Oculto | Oculto |
| PDV e Comandas | PDV + Comandas | Oculto/Aparece | Oculto/Aparece |

Cada funcionalidade será controlada **individualmente** pelo seu respectivo módulo.

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| src/components/admin/AdminSidebar.tsx | Separar verificação de módulos (linhas 644-652) |

---

## Impacto

- **Baixo risco**: Apenas adiciona verificações mais granulares
- **Não quebra funcionalidades existentes**: Lojas com todos os módulos habilitados continuarão vendo tudo normalmente
- **Retrocompatível**: A lógica do `hasModule` permanece a mesma
