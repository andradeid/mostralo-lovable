

# Plano: Módulo Legacy - Página Personalizada para Clientes Antigos

## Contexto
Clientes antigos do sistema (época linkcardmenu) tinham páginas de landing personalizadas em HTML puro (como o exemplo "Casa de Kit Festas"). O objetivo é criar um módulo no painel admin que permita a esses clientes configurar e personalizar uma página similar sem precisar de código.

---

## Visão Geral da Arquitetura

```text
┌─────────────────────────────────────────┐
│  Painel Admin (Dashboard)               │
│  /dashboard/legacy-page                 │
│  - Editor visual com preview ao vivo    │
│  - Configurações salvas no Supabase     │
└────────────────┬────────────────────────┘
                 │ salva em
                 ▼
┌─────────────────────────────────────────┐
│  Tabela: store_legacy_pages             │
│  - store_id, nome, subtítulo, logo      │
│  - cores, gradiente, info cards         │
│  - botões (cardápio, WhatsApp)          │
│  - efeitos visuais (confete)            │
│  - og_tags (meta compartilhamento)      │
└────────────────┬────────────────────────┘
                 │ renderiza em
                 ▼
┌─────────────────────────────────────────┐
│  Página Pública                         │
│  /p/:slug  (ex: /p/casadekitfestas)     │
│  - Renderiza layout baseado nos dados   │
│  - Full responsivo, mobile-first        │
└─────────────────────────────────────────┘
```

---

## Etapas de Implementação

### Etapa 1 — Tabela no Supabase
Criar tabela `store_legacy_pages` com os campos:
- `id`, `store_id`, `slug` (único), `is_active`
- **Conteúdo**: `store_name`, `subtitle`, `logo_url`
- **Visual**: `background_gradient` (ex: "135deg, #ff758c, #ff7eb3, #667eea"), `card_border_color`, `logo_border_color`
- **Info Cards** (JSONB): array de objetos `{icon, label, value}` (ex: tempo de entrega, pagamento, especialidades)
- **Botões** (JSONB): array de `{type, label, url, color}` (ex: botão cardápio, botão WhatsApp)
- **Efeitos**: `confetti_enabled` (boolean)
- **OG Tags**: `og_title`, `og_description`, `og_image`
- RLS: leitura pública, escrita restrita ao dono da loja

### Etapa 2 — Hook e Tipos
- Criar `src/types/legacyPage.ts` com interfaces TypeScript
- Criar `src/hooks/useLegacyPage.ts` para CRUD (buscar, salvar, atualizar)

### Etapa 3 — Editor no Admin (Configuração)
Criar página `/dashboard/legacy-page` com abas:
- **Conteúdo**: nome, subtítulo, logo (upload)
- **Aparência**: cores do gradiente de fundo, cor da borda da logo (color pickers)
- **Informações**: adicionar/remover/editar info cards (ícone emoji, label, valor)
- **Botões**: configurar botões de ação (label, URL, cor)
- **Efeitos**: toggle confete
- **Compartilhamento**: OG tags
- **Preview ao vivo** ao lado do editor (simulando a página final)

### Etapa 4 — Página Pública
Criar rota `/p/:slug` que:
- Busca dados da `store_legacy_pages` pelo slug
- Renderiza a página no estilo do exemplo (card centralizado, gradiente, logo circular, info cards, botões)
- Responsivo e mobile-first
- Aplica efeito de confete se habilitado

### Etapa 5 — Sidebar e Módulo
- Registrar módulo `legacy_page` no sistema de módulos
- Adicionar item "Página Legacy" na sidebar do admin (grupo "Marketing")
- Gate por `hasModule('legacy_page')`

### Etapa 6 — Rota no Router
- Adicionar rota pública `/p/:slug` no App.tsx

---

## Campos Personalizáveis pelo Cliente

| Campo | Tipo | Exemplo |
|-------|------|---------|
| Nome da loja | texto | "Casa de Kit Festas" |
| Subtítulo | texto | "Sua festa perfeita! 🎈" |
| Logo | upload/URL | imagem circular |
| Gradiente de fundo | 3 cores | rosa → rosa claro → roxo |
| Cor da borda da logo | cor | #ff7eb3 |
| Info cards | array dinâmico | ⏱️ Tempo de Entrega: 30-50 min |
| Botão principal | label + URL + cor | "🎈 VER CARDÁPIO COMPLETO" |
| Botão WhatsApp | número + mensagem | "💬 FAZER PEDIDO POR WHATSAPP" |
| Efeito confete | on/off | animação de confete ao abrir |
| OG Tags | título, descrição, imagem | para compartilhamento em redes |

---

## Arquivos a Criar/Modificar

**Novos:**
- `supabase/migrations/xxx_create_store_legacy_pages.sql`
- `src/types/legacyPage.ts`
- `src/hooks/useLegacyPage.ts`
- `src/pages/admin/LegacyPageEditor.tsx` — editor com tabs e preview
- `src/components/legacy-page/LegacyPagePreview.tsx` — preview ao vivo
- `src/components/legacy-page/LegacyPageRenderer.tsx` — renderizador da página pública
- `src/pages/public/LegacyPublicPage.tsx` — rota pública `/p/:slug`

**Modificados:**
- `src/components/admin/AdminSidebar.tsx` — adicionar item de menu
- `src/App.tsx` — adicionar rota pública

---

## Resultado Esperado
O cliente acessa `/dashboard/legacy-page`, personaliza sua página via formulário visual com preview, e a página fica disponível publicamente em `/p/seu-slug` — com visual idêntico ao exemplo fornecido, totalmente personalizável sem código.

