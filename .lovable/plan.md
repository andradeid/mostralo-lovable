

# Plano: Remover Referências a Gestão de Redes Sociais da Página Inicial

## Problema Identificado

A página inicial (`/`) contém várias referências à funcionalidade de "Gestão de Redes Sociais" e "Marketing Digital" que você deseja remover ou substituir por um contexto mais adequado.

---

## Arquivos que Serão Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Index.tsx` | Remover importação e uso da `<MarketingDigitalSection />` |
| `src/components/landing/LandingHeader.tsx` | Remover link "Marketing Digital" do menu de navegação (desktop e mobile) |
| `src/components/landing/FAQSection.tsx` | Remover/ajustar 3 perguntas sobre gestão de redes sociais |

---

## Detalhes das Alterações

### 1. Index.tsx - Remover Seção de Marketing Digital

**Antes:**
```
<SavingsCalculator />
<MarketingDigitalSection />   ← REMOVER
<ComparisonSection />
```

**Depois:**
```
<SavingsCalculator />
<ComparisonSection />
```

A seção inteira `MarketingDigitalSection` será removida da página inicial.

---

### 2. LandingHeader.tsx - Remover Link de Navegação

**Remover do menu desktop (linha 70-75):**
```tsx
<a href="#marketing-digital" ...>
  Marketing Digital
</a>
```

**Remover do menu mobile (linha 156-162):**
```tsx
<a href="#marketing-digital" ...>
  Marketing Digital
</a>
```

---

### 3. FAQSection.tsx - Remover/Ajustar Perguntas

**Perguntas que serão REMOVIDAS:**

1. *"O marketing digital realmente está incluso no preço?"* - Faz referência direta à gestão de redes sociais inclusa

2. *"Quantos perfis de redes sociais posso ter?"* - Específica sobre a funcionalidade que você quer ocultar

3. *"Preciso entender de marketing para usar?"* - Menciona IA para criar legendas em redes sociais

**Resultado:** O FAQ ficará com 7 perguntas focadas em delivery, sistema, WhatsApp e valores - sem mencionar gestão de redes sociais.

---

## O que NÃO será alterado (escopo limitado)

Os seguintes arquivos contêm referências mas são de outras áreas do sistema (não da página inicial):

- Templates de compartilhamento comercial (CommercialPresentationTemplate)
- Editor de cartão digital da loja (StoreDigitalCardEditorPage)
- Drawer de informações da loja (StoreInfoDrawer)
- Páginas de nichos específicos (SuplementosPage)
- Dados de ideias/planos (ideasData.ts)

Se você quiser que eu remova também dessas áreas, posso fazer em um próximo passo.

---

## Resultado Esperado

Após as alterações:
- A página inicial não terá mais a seção de "Gestão de Redes Sociais"
- O menu de navegação não terá mais o link "Marketing Digital"
- O FAQ não terá mais perguntas sobre redes sociais
- O foco da página ficará em: Delivery, WhatsApp IA, Gestão Financeira, PDV e Automação

