

# Plano: Melhorar Abas do WhatsApp Master com Icones e Descricoes

## Objetivo

Tornar as abas mais claras e intuitivas, com icones representativos, textos completos visiveis e tooltips explicando a funcao de cada aba.

---

## Abas Atuais vs Propostas

| Aba | Atual | Proposto | Descricao (Tooltip) |
|-----|-------|----------|---------------------|
| 1 | Smartphone + "Conexao" | Smartphone + "Conexao WhatsApp" | Conecte e gerencie a instancia do WhatsApp Business |
| 2 | Bot + "Configurar Bots" | Bot + "Configurar Bots" | Configure os bots de vendas, suporte e recrutamento |
| 3 | BookOpen + "FAQ" | BookOpen + "Base de Conhecimento" | Gerencie perguntas e respostas que o bot utiliza |
| 4 | MessageSquare + "Sessoes" | Users + "Sessoes de Atendimento" | Visualize conversas e sessoes ativas com clientes |
| 5 | ExternalLink + "Links Paginas" | ExternalLink + "Links e Paginas" | Configure links do WhatsApp para paginas do site |

---

## Layout Visual Proposto

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TABS COM TOOLTIPS                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐
│  │ Smartphone   │ │ Bot          │ │ BookOpen     │ │ Users        │ │ ExternalLink│
│  │ Conexao      │ │ Configurar   │ │ Base de      │ │ Sessoes de   │ │ Links e    │
│  │ WhatsApp     │ │ Bots         │ │ Conhecimento │ │ Atendimento  │ │ Paginas    │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘
│        ↓                 ↓                ↓                ↓               ↓
│    [Tooltip]        [Tooltip]        [Tooltip]        [Tooltip]       [Tooltip]
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tooltips por Aba

| Aba | Tooltip |
|-----|---------|
| Conexao WhatsApp | "Conecte sua instancia do WhatsApp, escaneie o QR Code e envie mensagens de teste" |
| Configurar Bots | "Ative e configure os bots de vendas, recrutamento e suporte com prompts personalizados" |
| Base de Conhecimento | "Adicione perguntas e respostas para o bot consultar durante os atendimentos" |
| Sessoes de Atendimento | "Veja todas as conversas ativas, pausadas e o historico de mensagens" |
| Links e Paginas | "Configure os links de WhatsApp que aparecem nas paginas do site" |

---

## Secao Tecnica

### Arquivo a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/admin/MasterWhatsAppPage.tsx` | Adicionar TooltipProvider nas abas, textos completos e tooltips |

### Implementacao

1. Envolver TabsList com TooltipProvider
2. Cada TabsTrigger envolvido em Tooltip + TooltipTrigger
3. Adicionar TooltipContent com descricao da aba
4. Ajustar textos para serem mais descritivos
5. Trocar icone de "Sessoes" de MessageSquare para Users (mais representativo)

### Codigo Exemplo

```tsx
<TooltipProvider>
  <TabsList className="w-full flex overflow-x-auto gap-1 p-1">
    <Tooltip>
      <TooltipTrigger asChild>
        <TabsTrigger value="connection" className="flex-shrink-0 gap-1.5">
          <Smartphone className="w-4 h-4" />
          Conexao WhatsApp
        </TabsTrigger>
      </TooltipTrigger>
      <TooltipContent>
        <p>Conecte sua instancia do WhatsApp e envie mensagens de teste</p>
      </TooltipContent>
    </Tooltip>
    {/* ... demais abas */}
  </TabsList>
</TooltipProvider>
```

---

## Resultado Esperado

- Todas as abas com textos visiveis e claros
- Icones representativos para cada funcao
- Ao passar o mouse, aparece tooltip explicando a aba
- Interface mais intuitiva para o administrador

