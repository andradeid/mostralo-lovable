
# Plano: Corrigir Formatacao das Mensagens WhatsApp

## Problema

O bot esta usando formatacao Markdown que NAO funciona no WhatsApp:

| Problema | Markdown | WhatsApp Correto |
|----------|----------|------------------|
| Negrito | `**texto**` | `*texto*` |
| Links | `[texto](url)` | Apenas `url` |
| Numero telefone | Aparece redundante | Remover |

---

## Solucao em 3 Partes

### Parte 1: Adicionar Instrucoes de Formatacao no Prompt

No arquivo `supabase/functions/master-bot-sync/index.ts`, adicionar uma secao de regras de formatacao:

```text
## REGRAS DE FORMATACAO (CRITICO!)

VOCE ESTA RESPONDENDO VIA WHATSAPP. Use APENAS estas formatacoes:

- Negrito: *texto* (UM asterisco de cada lado)
- Italico: _texto_ (underscore de cada lado)
- Tachado: ~texto~ (til de cada lado)
- Monoespaco: `texto` (crase de cada lado)

PROIBIDO (nao funciona no WhatsApp):
- NAO use **texto** (dois asteriscos)
- NAO use [texto](link) - envie apenas o link direto
- NAO coloque links entre parenteses
- NAO mencione numeros de telefone (o cliente ja esta no WhatsApp)
```

### Parte 2: Remover Numero de WhatsApp dos Arquivos

**Arquivo 1:** `supabase/functions/master-faq-agent/index.ts` (linha 592)
- Remover a linha `whatsapp: '(61) 99555-0099',`

**Arquivo 2:** `src/components/admin/master-whatsapp/MasterBotConfigTab.tsx` (linha 105)
- Remover a linha `WhatsApp: (61) 99555-0099` do DEFAULT_SUPPORT_GREETING

### Parte 3: Converter Formatacao Markdown no Prompt

No `buildUnifiedPrompt`, converter todas as ocorrencias:

| De | Para |
|----|------|
| `**Preço:**` | `*Preço:*` |
| `**IMPORTANTE:**` | `*IMPORTANTE:*` |
| `**Frase-chave:**` | `*Frase-chave:*` |
| Todos os `**texto**` | `*texto*` |

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| supabase/functions/master-bot-sync/index.ts | Adicionar regras de formatacao + converter ** para * |
| supabase/functions/master-faq-agent/index.ts | Remover linha do WhatsApp |
| src/components/admin/master-whatsapp/MasterBotConfigTab.tsx | Remover WhatsApp do greeting padrao |

---

## Resultado Esperado

| Antes | Depois |
|-------|--------|
| `**Marketing Digital**` | `*Marketing Digital*` |
| `[Mostralo](https://mostralo.com.br)` | `https://mostralo.com.br` |
| `(61) 99555-0099` | NAO aparece |

---

## Deploy

1. Modificar os 3 arquivos
2. Deploy das Edge Functions (master-bot-sync e master-faq-agent)
3. Sincronizar bot no painel
4. Testar enviando mensagem
