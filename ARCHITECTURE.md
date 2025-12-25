# 🏗️ Arquitetura do Projeto Mostralo

Documentação das boas práticas de código implementadas no projeto.

---

## 1. Componentização da Landing Page

A página inicial (`src/pages/Index.tsx`) foi refatorada de **~1000 linhas para ~80 linhas**.

### Antes
Todo o conteúdo em um único arquivo gigante, difícil de manter.

### Depois
Cada seção é um componente separado em `src/components/landing/`:

| Componente | Responsabilidade |
|------------|------------------|
| `HeroSection.tsx` | Banner principal com CTA |
| `WhatsAppMarketingSection.tsx` | Seção de marketing via WhatsApp |
| `DigitalSignageSection.tsx` | Recursos de sinalização digital |
| `PasswordCallSection.tsx` | Sistema de senhas |
| `PDVComandasSection.tsx` | PDV e comandas |
| `ProblemsSection.tsx` | Problemas que o sistema resolve |
| `ComparisonSection.tsx` | Comparativo com concorrentes |
| `FAQSection.tsx` | Perguntas frequentes |
| `PlansSection.tsx` | Planos e preços |
| `TestimonialsSection.tsx` | Depoimentos de clientes |
| `CTASection.tsx` | Call-to-action final |

### Resultado
```tsx
// src/pages/Index.tsx - Agora limpo e organizado
export default function Index() {
  return (
    <>
      <HeroSection />
      <WhatsAppMarketingSection />
      <DigitalSignageSection />
      {/* ... outros componentes */}
    </>
  );
}
```

---

## 2. Componentização do Dashboard

O dashboard administrativo (`src/pages/admin/DashboardHome.tsx`) usa componentes modulares em `src/components/admin/dashboard/`:

| Componente | Responsabilidade |
|------------|------------------|
| `MasterAdminKPIs.tsx` | KPIs financeiros do SaaS (MRR, lojas, etc.) |
| `GrowthProjections.tsx` | Projeções de crescimento |
| `PendingActions.tsx` | Ações urgentes pendentes |
| `RecentActivityReal.tsx` | Atividades recentes do sistema |
| `StoreHealthIndicators.tsx` | Indicadores de saúde das lojas |

---

## 3. Lazy Loading de Rotas

Rotas não-críticas são carregadas **sob demanda** via `React.lazy()`, reduzindo o bundle inicial de **3-5MB para 300-500KB**.

### Estrutura de Rotas
Arquivos em `src/routes/`:

| Arquivo | Lazy Loading | Descrição |
|---------|--------------|-----------|
| `publicRoutes.tsx` | ❌ Não | Páginas críticas (Index, Auth, Store) |
| `masterRoutes.tsx` | ✅ Sim | Rotas do master admin |
| `storeAdminRoutes.tsx` | ✅ Sim | Rotas do admin da loja |
| `deliveryRoutes.tsx` | ✅ Sim | Rotas do entregador |
| `salespersonRoutes.tsx` | ✅ Sim | Rotas do vendedor |
| `customerRoutes.tsx` | ✅ Sim | Rotas do cliente |

### Implementação
```tsx
// Páginas críticas - carregam imediatamente
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';

// Páginas não-críticas - carregam sob demanda
const ProductsPage = lazy(() => import('@/pages/admin/ProductsPage'));
const OrdersPage = lazy(() => import('@/pages/admin/OrdersPage'));
```

---

## 4. Preload Inteligente

Páginas são **pré-carregadas quando o usuário passa o mouse** sobre links, reduzindo o tempo de navegação de **200-500ms para <50ms**.

### Arquivos Envolvidos

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/config/routePreloads.ts` | Mapeamento de rotas para imports |
| `src/hooks/usePreloadRoute.ts` | Hook com lógica de preload |
| `src/components/ui/preload-link.tsx` | Componentes PreloadLink e PreloadNavLink |

### Como Funciona
1. Usuário passa o mouse sobre um link do menu
2. Após 100ms (debounce), o código da página começa a carregar em background
3. Quando o usuário clica, a página já está pronta
4. Cache evita downloads duplicados

### Configuração
```tsx
// src/config/routePreloads.ts
export const routePreloadMap: Record<string, () => Promise<unknown>> = {
  '/dashboard': () => import('@/pages/admin/DashboardHome'),
  '/dashboard/orders': () => import('@/pages/admin/OrdersPage'),
  '/dashboard/products': () => import('@/pages/admin/ProductsPage'),
  // ... outras rotas
};
```

### Uso nos Sidebars
```tsx
// Antes
<NavLink to="/dashboard/orders">Pedidos</NavLink>

// Depois - com preload
<PreloadNavLink to="/dashboard/orders">Pedidos</PreloadNavLink>
```

---

## 5. Benefícios das Boas Práticas

| Prática | Benefício |
|---------|-----------|
| **Componentização** | Código organizado, fácil de manter, responsabilidade única |
| **Lazy Loading** | Bundle inicial menor, carregamento mais rápido |
| **Preload** | Navegação instantânea, melhor UX |
| **Modularização de Rotas** | Separação por perfil de usuário, fácil escalar |

---

## 6. Quando Aplicar

### Componentizar quando:
- Arquivo ultrapassar ~200-300 linhas
- Seção tiver lógica própria (estado, hooks)
- Conteúdo puder ser reutilizado
- Múltiplos desenvolvedores trabalharem no mesmo arquivo

### Lazy Loading quando:
- Página não é acessada imediatamente
- Página tem dependências pesadas (gráficos, editores)
- Bundle inicial estiver grande

### Preload quando:
- Navegação entre páginas for frequente
- Performance de transição for importante
- Usuário tiver padrões previsíveis de navegação

---

## 7. Referências no Código

```
src/
├── pages/
│   ├── Index.tsx                    # Landing page componentizada
│   └── admin/
│       └── DashboardHome.tsx        # Dashboard componentizado
├── components/
│   ├── landing/                     # Componentes da landing
│   │   ├── HeroSection.tsx
│   │   ├── FAQSection.tsx
│   │   └── ...
│   └── admin/
│       └── dashboard/               # Componentes do dashboard
│           ├── MasterAdminKPIs.tsx
│           └── ...
├── routes/                          # Rotas modularizadas
│   ├── index.ts
│   ├── publicRoutes.tsx
│   ├── masterRoutes.tsx
│   └── ...
├── config/
│   └── routePreloads.ts             # Mapeamento de preload
└── hooks/
    └── usePreloadRoute.ts           # Hook de preload
```

---

*Última atualização: Dezembro 2024*
