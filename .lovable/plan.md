
# Plano: Modo Tela Cheia no PDV (Similar aos Pedidos)

## Objetivo

Implementar o mesmo comportamento da página de pedidos no PDV:
1. Abrir com menu lateral minimizado (sidebar colapsada)
2. Header oculto para tela mais limpa
3. Botão "Sair" para restaurar o menu lateral e header
4. Atalho `Escape` para sair do modo tela cheia

## Análise do Comportamento Atual

### Página de Pedidos (OrdersPage):
- Estado `isFullscreen` inicia como `true`
- Dispara evento customizado `kanbanFullscreenChange` para o `AdminLayout`
- O `AdminLayout` escuta esse evento e oculta o header
- Usa hook `useSidebar` para colapsar/expandir a sidebar
- Botão "Sair" com ícones `Minimize2`/`Maximize2`
- Atalho `Escape` para sair do modo tela cheia

### Página do PDV (PDVPage) - Atual:
- Não tem controle de fullscreen
- Sempre mostra header e sidebar expandida
- Sem otimização para uso como frente de caixa

## Modificações Necessárias

### Arquivo: `src/pages/admin/PDVPage.tsx`

**Adicionar imports:**
```typescript
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Minimize2, Maximize2 } from "lucide-react";
```

**Adicionar lógica de fullscreen:**
1. Estado `isFullscreen` iniciando como `true` (igual OrdersPage)
2. Hook `useSidebar` para controlar a sidebar
3. Função `toggleFullscreen` que:
   - Alterna o estado
   - Dispara evento `kanbanFullscreenChange`
   - Colapsa/expande sidebar
4. Effect para sincronizar ao montar (enviar evento de fullscreen)
5. Effect para cleanup ao desmontar (restaurar sidebar/header)
6. Effect para atalho `Escape`

**Adicionar botão "Sair" na UI:**
- Desktop: No header dos tabs (ao lado do TabsList)
- Mobile: Botão flutuante no canto superior direito

## Fluxo de Funcionamento

```text
┌─────────────────────────────────────────────────────────────────┐
│  ABERTURA DO PDV                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. PDVPage monta com isFullscreen = true                       │
│                                                                 │
│  2. useEffect dispara evento kanbanFullscreenChange:            │
│     → AdminLayout oculta header                                 │
│     → setSidebarOpen(false) colapsa menu lateral                │
│                                                                 │
│  3. UI renderiza botão "Sair" (ícone Minimize2)                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CLIQUE NO BOTÃO "SAIR" ou TECLA ESCAPE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. toggleFullscreen() é chamado                                │
│                                                                 │
│  2. isFullscreen = false                                        │
│                                                                 │
│  3. Dispara evento kanbanFullscreenChange { isFullscreen: false }│
│     → AdminLayout mostra header novamente                       │
│                                                                 │
│  4. setSidebarOpen(true) expande menu lateral                   │
│                                                                 │
│  5. Botão muda para "Tela Cheia" (ícone Maximize2)              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Design da UI

### Desktop:
```text
┌─────────────────────────────────────────────────────────────────┐
│  [PDV] [Comandas (2)] [Histórico]              [Sair 🗕]        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────┐  ┌─────────────────────────┐  │
│  │     Grid de Produtos        │  │    Carrinho Lateral     │  │
│  │                             │  │                         │  │
│  │                             │  │                         │  │
│  └─────────────────────────────┘  └─────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile:
```text
┌─────────────────────────────────────────┐
│                               [🗕 Sair] │  ← Botão flutuante
├─────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐                │
│  │Produtos │ │Carrinho │                │
│  └─────────┘ └─────────┘                │
│  ┌─────────┐ ┌─────────┐                │
│  │Comandas │ │Histórico│                │
│  └─────────┘ └─────────┘                │
├─────────────────────────────────────────┤
│          [Grid de Produtos]             │
│                                         │
└─────────────────────────────────────────┘
```

## Código a Implementar

### Imports adicionais:
```typescript
import { useEffect, useState } from 'react';
import { useSidebar } from "@/components/ui/sidebar";
import { Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
```

### Estados e hooks:
```typescript
// Hook do sidebar
const { setOpen: setSidebarOpen } = useSidebar();

// Estado para modo tela cheia (inicia como true)
const [isFullscreen, setIsFullscreen] = useState<boolean>(true);
```

### Função toggleFullscreen:
```typescript
const toggleFullscreen = () => {
  const newState = !isFullscreen;
  setIsFullscreen(newState);
  
  // Dispara evento para AdminLayout ocultar/mostrar header
  window.dispatchEvent(new CustomEvent('kanbanFullscreenChange', { 
    detail: { isFullscreen: newState } 
  }));
  
  // Colapsa ou expande sidebar
  setSidebarOpen(!newState);
};
```

### Effects:
```typescript
// Sincronizar ao montar
useEffect(() => {
  if (isFullscreen) {
    window.dispatchEvent(new CustomEvent('kanbanFullscreenChange', { 
      detail: { isFullscreen: true } 
    }));
    setSidebarOpen(false);
  }
  
  // Cleanup ao desmontar
  return () => {
    window.dispatchEvent(new CustomEvent('kanbanFullscreenChange', { 
      detail: { isFullscreen: false } 
    }));
  };
}, []);

// Atalho Escape
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isFullscreen) {
      toggleFullscreen();
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [isFullscreen]);
```

### Botão na UI (Desktop):
```typescript
<div className="flex items-center justify-between mb-4">
  <TabsList className="w-fit">
    {/* tabs existentes */}
  </TabsList>
  
  <Button
    variant={isFullscreen ? "default" : "outline"}
    size="sm"
    onClick={toggleFullscreen}
    title={isFullscreen ? "Sair da tela cheia (Esc)" : "Modo tela cheia"}
    className="gap-1"
  >
    {isFullscreen ? (
      <>
        <Minimize2 className="h-4 w-4" />
        <span>Sair</span>
      </>
    ) : (
      <>
        <Maximize2 className="h-4 w-4" />
        <span>Tela Cheia</span>
      </>
    )}
  </Button>
</div>
```

### Botão na UI (Mobile):
```typescript
{/* Botão flutuante no mobile */}
<div className="absolute top-2 right-2 z-10">
  <Button
    variant={isFullscreen ? "default" : "outline"}
    size="sm"
    onClick={toggleFullscreen}
    className="gap-1 shadow-md"
  >
    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
    <span className="sr-only">
      {isFullscreen ? "Sair da tela cheia" : "Modo tela cheia"}
    </span>
  </Button>
</div>
```

## Benefícios

1. **Mais espaço**: Sem header e com sidebar colapsada, a área útil aumenta significativamente
2. **Foco**: Interface limpa para operações de caixa
3. **Consistência**: Mesmo padrão usado na página de pedidos
4. **Flexibilidade**: Usuário pode alternar entre modos conforme necessidade
5. **Atalho**: Tecla Escape oferece forma rápida de sair

## Estimativa

| Tarefa | Tempo |
|--------|-------|
| Adicionar lógica de fullscreen | 15 min |
| Ajustar UI desktop | 10 min |
| Ajustar UI mobile | 10 min |
| Testes | 5 min |
| **Total** | ~40 min |

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/admin/PDVPage.tsx` | Adicionar fullscreen logic, botão sair, effects |
