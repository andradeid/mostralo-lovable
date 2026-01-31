
# Plano: Corrigir Estilo das Abas para Usar a Cor Primary

## Problema Identificado

As abas (TabsTrigger) estao usando `bg-orange-500` do Tailwind enquanto o botao "Sincronizar Todos" usa `bg-primary` do sistema Mostralo. Isso causa uma inconsistencia visual.

| Elemento | Cor Atual | Cor Desejada |
|----------|-----------|--------------|
| Abas ativas | `bg-orange-500` (Tailwind) | `bg-primary` (Mostralo) |
| Botao Sincronizar | `bg-primary` (Mostralo) | Manter |

---

## Solucao

Modificar o componente `TabsTrigger` em `tabs.tsx` para usar a cor primary do sistema ao inves do orange-500 do Tailwind.

---

## Arquivo a Modificar

**Arquivo:** `src/components/ui/tabs.tsx`

**Linha 30 - De:**
```css
data-[state=active]:bg-orange-500 data-[state=active]:text-white
```

**Para:**
```css
data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
```

---

## Resultado Visual

```text
ANTES (cores diferentes):
┌─────────────────────────────────────────────────────────────────┐
│  [Conexao]  [Config Bots]  [FAQ]  [Sessoes]  [Links]           │
│               (orange-500)                                      │
│                                                                 │
│  [Vendas] [Recr.] [Suporte]          [Sincronizar Todos]       │
│           (orange-500)                    (primary)            │
└─────────────────────────────────────────────────────────────────┘

DEPOIS (cores iguais):
┌─────────────────────────────────────────────────────────────────┐
│  [Conexao]  [Config Bots]  [FAQ]  [Sessoes]  [Links]           │
│               (primary) ✓                                       │
│                                                                 │
│  [Vendas] [Recr.] [Suporte]          [Sincronizar Todos]       │
│           (primary) ✓                     (primary) ✓          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Secao Tecnica

### Por que essa mudanca funciona?

A cor `primary` esta definida no CSS global (`src/index.css`):

```css
:root {
  --primary: 24 70% 50%;  /* Laranja Mostralo */
  --primary-foreground: 0 0% 98%;  /* Branco */
}
```

Ao usar `bg-primary` ao inves de `bg-orange-500`, as abas vao automaticamente seguir o tema do sistema, garantindo consistencia visual com todos os botoes e elementos primarios.

### Impacto

| Area | Impacto |
|------|---------|
| Abas principais (WhatsApp Master) | Cor unificada com botoes |
| Abas internas (Vendas/Recr./Suporte) | Cor unificada com botoes |
| Abas em outras paginas | Mesma cor primary |
| Tema claro/escuro | Adapta automaticamente |

---

## Implementacao

```text
1. Modificar tabs.tsx (linha 30)
   - Substituir bg-orange-500 → bg-primary
   - Substituir text-white → text-primary-foreground
2. Testar visualizacao
   - Verificar abas principais
   - Verificar abas internas
   - Verificar consistencia com botao Sincronizar
```
