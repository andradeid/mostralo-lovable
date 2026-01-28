

# Plano: Reformular HeroSection com Abordagem Estratégica

## Problema Identificado
A mensagem atual "PARE DE PAGAR PARA O iFOOD CRESCER" é agressiva e gera resistência em quem usa iFood. Precisamos de uma abordagem que destaque os benefícios do Mostralo sem atacar concorrentes diretamente.

---

## Estratégia de Comunicação

### Mensagem Atual (Agressiva)
```text
Badge: "A Verdade que Ninguém Conta"
Título: "PARE DE PAGAR PARA O iFOOD CRESCER COM SEUS CLIENTES"
Subtítulo: "A cada pedido, você financia a expansão do marketplace..."
```

### Nova Mensagem (Positiva e Estratégica)
```text
Badge: "Você no Controle Total"
Título: "SEUS CLIENTES. SEUS DADOS. SEU LUCRO."
Subtítulo: "Tenha seu próprio canal de vendas com 0% de taxa por pedido"
```

---

## Mudanças Específicas no Arquivo

### Arquivo: `src/components/landing/HeroSection.tsx`

| Elemento | Antes | Depois |
|----------|-------|--------|
| **Badge** | "A Verdade que Ninguém Conta" (tom alarmista) | "Você no Controle Total" (tom empoderador) |
| **Ícone Badge** | AlertTriangle (vermelho) | Crown ou Shield (positivo) |
| **Título Principal** | "PARE DE PAGAR PARA O iFOOD CRESCER" | "SEUS CLIENTES. SEUS DADOS. SEU LUCRO." |
| **Subtítulo** | "A cada pedido, você financia a expansão..." | "Tenha seu próprio canal de vendas digital..." |
| **Parágrafo de apoio** | Menciona 0% taxa + SENTINELA | Foca em autonomia + assistente IA 24h |
| **Seção verde (Marketing)** | "Marketing Digital Incluso" + SENTINELA | **Removida completamente** |
| **Botões** | "Calcular Minha Economia" | "Começar Agora" / "Ver na Prática" |

---

## Nova Estrutura Visual

```text
┌─────────────────────────────────────────────────────────────┐
│                    [👑 Você no Controle Total]              │
│                                                             │
│            SEUS CLIENTES. SEUS DADOS. SEU LUCRO.            │
│                                                             │
│   Tenha seu próprio canal de vendas digital com             │
│   0% de taxa por pedido. Cada cliente é 100% seu.           │
│                                                             │
│   Sistema completo com Assistente IA no WhatsApp            │
│   que atende seus clientes 24 horas por dia.                │
│                                                             │
│   [ 🚀 Começar Agora ]    [ 📺 Ver na Prática ]             │
│                                                             │
│              [Banner de Cupons Promocionais]                │
└─────────────────────────────────────────────────────────────┘
```

---

## O Que Será Removido

1. **Menção ao iFood** - Removida completamente
2. **Tom de "verdade oculta"** - Substituído por empoderamento
3. **Badge "Marketing Digital Incluso"** - Removida
4. **Seção verde inteira** - Removida (era sobre marketing + SENTINELA)
5. **Ícone AlertTriangle** - Substituído por ícone positivo (Crown)

---

## O Que Será Mantido

1. **Destaque do 0% de taxa** - Continua como diferencial
2. **100% seus clientes** - Mensagem central
3. **Banner de Cupons Promocionais** - Funcionalidade ativa
4. **Botões de ação** - Ajustados para CTAs mais diretos

---

## Benefícios da Nova Abordagem

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Tom** | Negativo/Ataque | Positivo/Empoderamento |
| **Reação esperada** | Defensiva | Curiosidade |
| **Foco** | O que você perde (iFood) | O que você ganha (autonomia) |
| **Emoção** | Medo/Raiva | Controle/Confiança |

---

## Detalhes Técnicos

### Dependências de Ícones (Lucide)
- Remover: `AlertTriangle`
- Adicionar: `Crown` ou `Shield` (já usado em outros lugares)

### Classes Tailwind
- Manter gradiente de fundo atual
- Remover cores de alerta (vermelho agressivo)
- Usar cores mais neutras/positivas (laranja/verde)

---

## Observação Importante

Como a página `/` agora redireciona automaticamente para `/gestao-360`, esta HeroSection só será vista se alguém acessar a rota antiga diretamente. Ainda assim, é importante manter consistência na mensagem do produto em todas as páginas.

