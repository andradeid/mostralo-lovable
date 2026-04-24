## Objetivo

Permitir que o lojista personalize o **tema visual** da página pública de agendamento (`/agendar/:storeSlug`) — cores, modo claro/escuro, fonte e arredondamento — para combinar com o site existente do cliente. Disponibilizar também um **snippet de embed (iframe)** para colar no site dele.

## Funciona sem quebrar nada?

Sim. A página `BookingPage.tsx` já usa **tokens semânticos do Tailwind** (`bg-primary`, `bg-background`, `text-primary-foreground`, etc.) em vez de cores hard-coded. Isso significa que basta sobrescrever as variáveis CSS (`--primary`, `--background`, `--radius`, `--foreground`) **apenas no container raiz da página de agendamento** — sem afetar:

- O dashboard administrativo (escopo isolado por container)
- O restante do site da loja (loja, cardápio, etc.)
- Componentes shadcn/ui (continuam respondendo aos tokens, agora com cores do cliente)

O risco é baixo porque o escopo das variáveis CSS fica limitado ao elemento raiz da `/agendar/:slug` via atributo `style`.

## O que será adicionado

### 1. Nova aba "Aparência" em `BookingSettingsPage.tsx`
Adicionar `'aparencia'` ao tipo `SectionKey` e ao array `SECTIONS`, com ícone `Palette`.

Campos do formulário:
- **Cor primária** (color picker + input HEX) — botões, destaques, stepper ativo
- **Cor de fundo** — fundo geral da página
- **Cor do texto** — texto principal
- **Modo** — Claro / Escuro / Automático (segue o sistema)
- **Família de fonte** — Padrão / Serif elegante / Sans moderna / Mono
- **Raio dos cantos** — Reto / Suave / Arredondado / Pílula
- **Logo** — usar a logo da loja (já existe) ou enviar uma específica para o agendamento
- **Botão "Sincronizar com cores da loja"** (reaproveitando padrão do `TotemAppearancePanel`)

### 2. Preview ao vivo
Mini iframe ou card mock dentro da aba mostrando como ficará o passo "Escolha o serviço", atualizando em tempo real conforme o lojista mexe nos controles. Reaproveitando layout real para fidelidade visual.

### 3. Snippet de Embed
Bloco com código pronto para o cliente colar no site dele:
```html
<iframe
  src="https://mostralo.me/agendar/SEU-SLUG?embed=1"
  width="100%" height="900" frameborder="0"
  style="border-radius:12px"></iframe>
```
Botão "Copiar". Quando a página recebe `?embed=1`, esconde header da loja e padding extra (modo enxuto para encaixar no site do cliente).

### 4. Aplicação do tema na página pública
Em `BookingPage.tsx`, ler as configurações e aplicar via `style` no `<div>` raiz, convertendo HEX para HSL (formato do design system):

```tsx
<div
  className="min-h-screen bg-background"
  style={{
    '--primary': hexToHsl(theme.primary_color),
    '--background': hexToHsl(theme.background_color),
    '--foreground': hexToHsl(theme.text_color),
    '--radius': theme.radius,
    fontFamily: theme.font_family,
  } as React.CSSProperties}
  data-theme={theme.mode}
>
```

## Detalhes técnicos

### Banco de dados
Adicionar colunas em `booking_settings` (migration):
- `theme_primary_color text default '#f97316'`
- `theme_background_color text default '#ffffff'`
- `theme_text_color text default '#0f172a'`
- `theme_mode text default 'light'` (light/dark/auto)
- `theme_font_family text default 'inter'`
- `theme_radius text default '0.5rem'`
- `theme_logo_url text` (opcional, sobrescreve `stores.logo_url`)
- `embed_hide_header boolean default true` (comportamento do `?embed=1`)

### Arquivos a alterar
- `src/pages/admin/BookingSettingsPage.tsx` — nova seção "Aparência"
- `src/components/admin/booking/BookingAppearancePanel.tsx` — **novo** (similar ao `TotemAppearancePanel`)
- `src/components/admin/booking/BookingThemePreview.tsx` — **novo** (preview ao vivo)
- `src/components/admin/booking/BookingEmbedSnippet.tsx` — **novo** (gera/copia iframe)
- `src/pages/public/BookingPage.tsx` — ler e aplicar tema; respeitar `?embed=1`
- `src/lib/colorUtils.ts` — **novo**, helper `hexToHsl()` (usado para variáveis CSS shadcn)
- Migration Supabase para adicionar as colunas

### Compatibilidade
- Lojas existentes: defaults nas colunas garantem aparência atual (laranja #f97316 / fundo branco).
- Nenhuma alteração em rotas, autenticação ou fluxo de criação de agendamento.
- Modo embed apenas esconde elementos visuais — toda a lógica de checkout/pagamento permanece.

## Diagrama de escopo do tema

```text
/agendar/:slug  ───► <div style="--primary: ..."> ──► todos os componentes filhos
                                                       (botões, cards, stepper)
/dashboard/...   ───► sem alteração (variáveis globais do app intactas)
```

## Próximo passo

Após aprovação: implemento a migration, o painel "Aparência" com preview ao vivo, o snippet de embed, e a aplicação dinâmica do tema na `BookingPage`.