
# Plano: Header e Footer Exclusivos para Gestão 360°

## Análise do Problema

### Header Atual (LandingHeader)
- Visual semi-transparente (`bg-card/50 backdrop-blur`) que funciona bem em tema claro, mas fica "descolado" no tema escuro premium da Gestão 360°
- Links de navegação apontam para âncoras da landing antiga (`#recursos`, `#calculadora`, `#marketing-digital`, `#whatsapp-marketing`, `#gestao-financeira`, `#integracao-ia`, `#plans`) que **não existem** na página Gestão 360°
- Muito conteúdo no menu que não é relevante para a nova proposta comercial

### Footer Atual (DashboardFooter)
- Extremamente simples - apenas uma linha de copyright
- Não aproveita a oportunidade de reforçar a marca, links úteis ou redes sociais
- Visual `bg-card/50` destoa do gradiente escuro premium usado em toda a página

### Visual da Página Gestão 360°
A página tem uma identidade visual consistente e premium:
- **Background**: Gradientes escuros (`from-slate-950 to-slate-900`)
- **Cards**: `bg-slate-800/50` com bordas `border-slate-700/50`
- **Cores de destaque**: Laranja (CTA principal), Verde (secundário), Púrpura (segurança)
- **Efeitos**: Blur, orbs de luz, animações sutis

---

## Solução Proposta

### 1. Novo Header: `Header360.tsx`

**Características:**
- Background escuro sólido (`bg-slate-950/95 backdrop-blur`) que integra perfeitamente com a página
- Borda inferior sutil (`border-slate-800`)
- Logo Mostralo com ícone laranja (mantém identidade)
- Navegação simplificada com links para as seções da própria página:
  - "Pilares" → `#pilares`
  - "Tecnologia" → `#tecnologia`
  - "FAQ" → `#faq`
  - "Comece Agora" → `/signup` (botão CTA)
- Botões de ação: "Entrar" + "Começar Grátis"
- Menu mobile com Sheet (mesmo padrão atual)
- **Sem ThemeToggle** (página é fixa em dark mode)

**Navegação por âncoras:**
Será necessário adicionar `id` às seções da página Gestão 360° para que os links funcionem.

### 2. Novo Footer: `Footer360.tsx`

**Características:**
- Background gradiente escuro que continua o visual da página (`from-slate-900 to-slate-950`)
- Borda superior sutil (`border-slate-800`)
- **Seção superior** com 3-4 colunas:
  - **Mostralo**: Logo + descrição curta + redes sociais (WhatsApp, Instagram, LinkedIn)
  - **Navegação**: Links para seções da página
  - **Legal**: Termos de Uso, Política de Privacidade, LGPD
  - **Contato**: WhatsApp de vendas, Email comercial
- **Seção inferior**: Copyright + selos de segurança (LGPD, AWS)
- Visual coeso com as cores laranja/púrpura usadas na página

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/gestao-360/Header360.tsx` | Header exclusivo com navegação interna |
| `src/components/gestao-360/Footer360.tsx` | Footer premium com links e redes sociais |

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/public/Gestao360Page.tsx` | Substituir `LandingHeader` por `Header360` e `DashboardFooter` por `Footer360` |
| `src/components/gestao-360/PilaresValor.tsx` | Adicionar `id="pilares"` na section |
| `src/components/gestao-360/TecnologiaSection.tsx` | Adicionar `id="tecnologia"` na section |
| `src/components/gestao-360/FAQ360.tsx` | Adicionar `id="faq"` na section |

---

## Detalhes Técnicos

### Header360.tsx - Estrutura

```text
┌─────────────────────────────────────────────────────────────┐
│  [🏪 Mostralo]    Pilares | Tecnologia | FAQ    [Entrar] [Começar] │
└─────────────────────────────────────────────────────────────┘
       └── Logo          └── Navegação interna      └── Ações
```

- Sticky no topo (`sticky top-0 z-50`)
- Background: `bg-slate-950/95 backdrop-blur-lg border-b border-slate-800`
- Links usam scroll suave para âncoras
- Mobile: Sheet lateral com mesmo visual escuro

### Footer360.tsx - Estrutura

```text
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   🏪 MOSTRALO           NAVEGAÇÃO        LEGAL       CONTATO│
│   Sistema All-in-One    • Pilares        • Termos    📱 WhatsApp
│   para gestão de lucro  • Tecnologia     • Privacidade    
│   📱 📸 💼              • FAQ            • LGPD           │
│                         • Comece Agora                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│   © 2025 Mostralo. Todos os direitos reservados.   [LGPD] [AWS]│
└─────────────────────────────────────────────────────────────┘
```

- Background: `bg-gradient-to-b from-slate-900 to-slate-950`
- Grid responsivo: 1 coluna mobile → 4 colunas desktop
- Ícones de redes sociais com hover em laranja
- Selos de segurança no rodapé

---

## Benefícios

1. **Consistência Visual**: Header e Footer integrados ao design premium da página
2. **Navegação Relevante**: Links que realmente funcionam e levam às seções certas
3. **Profissionalismo**: Footer completo com informações de contato e links legais
4. **Marca Reforçada**: Redes sociais e selos de segurança visíveis
5. **Sem Quebras**: Componentes isolados não afetam outras páginas que usam o LandingHeader e DashboardFooter originais
