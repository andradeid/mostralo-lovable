

# Plano: Criar Footer Completo e Reutilizável

## Visão Geral

Criar um componente `MainFooter.tsx` completo, profissional e reutilizável, inspirado no exemplo enviado, adaptado para a marca Mostralo.

---

## Estrutura do Novo Footer

```text
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│   MOSTRALO              REDES SOCIAIS      INFORMAÇÕES        INFORMAÇÕES       │
│   Sistema All-in-One    📱 LinkedIn        LEGAIS              EMPRESARIAIS     │
│   para delivery e       📸 Instagram       • Privacidade       CNPJ: XX.XXX...  │
│   gestão de negócios    💬 WhatsApp        • Termos de Uso     Responsável      │
│                                            • Aviso Legal       Localização      │
│   📞 WhatsApp Comercial                    • LGPD              Especialidade    │
│   ✉️ contato@mostralo                      • Cookies                            │
│   📍 Brasil                                                                     │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ⚠️ Aviso Legal Importante                                                       │
│                                                                                 │
│ Este site apresenta funcionalidades e resultados baseados em experiências       │
│ reais de clientes. Os resultados podem variar dependendo do segmento,           │
│ tamanho do negócio e implementação das estratégias.                             │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│              © 2026 Mostralo. Todos os direitos reservados.                     │
│         Plataforma completa para delivery e gestão de negócios locais           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Arquivo a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/MainFooter.tsx` | Footer completo e reutilizável para todas as páginas públicas |

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Index.tsx` | Substituir `DashboardFooter` por `MainFooter` |

---

## Detalhes Técnicos do MainFooter

### Colunas do Footer

**Coluna 1 - Mostralo (Sobre)**
- Logo com ícone Store (laranja) + nome "Mostralo"
- Descrição curta da plataforma
- Telefone/WhatsApp comercial com ícone
- Email de contato com ícone
- Localização: "Brasil" com ícone

**Coluna 2 - Redes Sociais**
- LinkedIn (com ícone)
- Instagram (com ícone)
- WhatsApp (com ícone)
- Cada link abre em nova aba

**Coluna 3 - Informações Legais**
- Política de Privacidade → `/privacy`
- Termos de Uso → `/terms`
- Aviso Legal → (anchor ou modal)
- Política de Cookies → `/cookies` ou modal
- LGPD - Proteção de Dados → `/lgpd`

**Coluna 4 - Informações Empresariais**
- CNPJ (placeholder para futura atualização)
- Nome do responsável
- Localização completa
- Especialidade/Descrição

### Seção de Aviso Legal (Disclaimer)

- Background levemente diferente (`bg-slate-800/50` ou `bg-muted/50`)
- Borda à esquerda em laranja (cor da marca)
- Título em laranja: "Aviso Legal Importante"
- Texto de disclaimer padrão sobre resultados

### Copyright Final

- Linha de copyright com ano dinâmico
- Tagline da plataforma
- Fundo mais escuro para separar visualmente

---

## Características do Componente

1. **Responsivo**: Grid de 1 coluna (mobile) → 2 colunas (tablet) → 4 colunas (desktop)
2. **Tema adaptável**: Funciona tanto em light mode quanto dark mode
3. **Reutilizável**: Pode ser usado em qualquer página pública
4. **Acessível**: Links com aria-labels, contraste adequado
5. **Props opcionais**: Possibilidade de ocultar seções específicas se necessário

### Props do Componente

```typescript
interface MainFooterProps {
  showDisclaimer?: boolean;  // Mostrar aviso legal (default: true)
  variant?: 'light' | 'dark' | 'auto';  // Variante de cor
}
```

---

## Benefícios

1. **Profissionalismo**: Footer completo transmite credibilidade
2. **SEO**: Links internos melhoram a navegação e indexação
3. **Legal**: Informações empresariais e links de compliance visíveis
4. **Reutilização**: Um único componente para todas as páginas públicas
5. **Manutenção**: Centraliza informações em um só lugar

