
# Plano: Atualizar Identidade Visual das Páginas Legais

## Problema Identificado

| Página | Status Atual | Problema |
|--------|--------------|----------|
| `/lgpd` | Moderna | Emails com domínio errado (mostralo.app) |
| `/cookies` | Moderna | OK |
| `/privacidade` | Layout antigo | Sem header, hero, ícones e MainFooter |
| `/termos` | Layout antigo | Sem header, hero, ícones e MainFooter |

---

## Alterações Planejadas

### 1. Corrigir Emails na Página LGPD

**Arquivo:** `src/pages/LGPD.tsx`

| Linha | Antes | Depois |
|-------|-------|--------|
| 149-150 | `privacidade@mostralo.app` | `privacidade@mostralo.com.br` |
| 185 | `dpo@mostralo.app` | `dpo@mostralo.com.br` |

---

### 2. Atualizar Página de Privacidade

**Arquivo:** `src/pages/Privacy.tsx`

**Nova estrutura (igual LGPD/Cookies):**

- Header com logo Mostralo + link "Voltar ao início"
- Hero Section com gradiente escuro e ícone Shield
- Seções com ícones (FileText, User, Shield, Database, etc.)
- Cards estilizados para cada tópico
- Box de destaque para contato/direitos
- MainFooter no final

**Conteúdo mantido:** Todo o texto atual será preservado, apenas reorganizado visualmente.

---

### 3. Atualizar Página de Termos de Uso

**Arquivo:** `src/pages/TermsOfUse.tsx`

**Nova estrutura (igual LGPD/Cookies):**

- Header com logo Mostralo + link "Voltar ao início"
- Hero Section com gradiente escuro e ícone FileText
- Seções com ícones para cada tópico
- Cards destacando direitos do usuário
- Box especial para "Seus Direitos Garantidos"
- MainFooter no final

**Conteúdo mantido:** Todo o texto atual será preservado, apenas reorganizado visualmente.

---

## Componentes Visuais da Nova Identidade

```text
┌─────────────────────────────────────────────────────┐
│  [Logo] Mostralo              ← Voltar ao início    │  ← Header escuro
├─────────────────────────────────────────────────────┤
│                                                     │
│         [Ícone Grande no Círculo]                   │
│         Título da Página                            │  ← Hero com gradiente
│         Descrição breve                             │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Ícone] Seção 1                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  Conteúdo com background muted               │  │  ← Cards estilizados
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  [Ícone] Seção 2                                    │
│  ┌─────────────┐  ┌─────────────┐                  │
│  │  Card 1     │  │  Card 2     │                  │  ← Grid de cards
│  └─────────────┘  └─────────────┘                  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  Box de destaque com borda primary           │  │  ← Contato/Direitos
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  Última atualização: 31 de janeiro de 2026          │
│                                                     │
├─────────────────────────────────────────────────────┤
│                 [MainFooter]                        │
└─────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/LGPD.tsx` | Corrigir 3 emails de mostralo.app → mostralo.com.br |
| `src/pages/Privacy.tsx` | Reescrever com nova identidade visual |
| `src/pages/TermsOfUse.tsx` | Reescrever com nova identidade visual |

---

## Resultado Final

Todas as 4 páginas legais terão:
- Identidade visual consistente
- Header unificado
- Hero section com gradiente
- Seções com ícones
- MainFooter
- Emails corretos com domínio mostralo.com.br
