
# Plano: Remover Numero WhatsApp e Ajustar Instrucao de Escalacao

## Problema

O prompt unificado ainda contem o numero de WhatsApp comercial na secao de contato:

```
## CONTATO
WhatsApp Comercial: (61) 99555-0099
Site: https://mostralo.com.br
Email: suporte@mostralo.com.br
```

Como o cliente ja esta em contato pelo WhatsApp, nao faz sentido passar outro numero.

---

## Solucao

Modificar a secao de contato para:
1. Remover o numero de WhatsApp Comercial
2. Adicionar instrucao para quando nao conseguir responder

---

## Alteracao no Arquivo

**Arquivo:** `supabase/functions/master-bot-sync/index.ts`

**Linhas 324-330 - De:**
```
---

## CONTATO

WhatsApp Comercial: (61) 99555-0099
Site: https://mostralo.com.br
Email: suporte@mostralo.com.br
```

**Para:**
```
---

## CONTATO E ESCALACAO

Site: https://mostralo.com.br
Email: suporte@mostralo.com.br

**IMPORTANTE:** Quando nao souber responder ou a duvida for muito especifica, diga:
"Vou encaminhar sua solicitacao para um de nossos especialistas. Em breve um assistente entrara em contato para ajudar voce com mais detalhes!"
```

---

## Resultado

| Antes | Depois |
|-------|--------|
| Passa numero de WhatsApp redundante | Sem numero de WhatsApp |
| Sem instrucao de escalacao | Instrucao clara para encaminhar |
| Cliente fica perdido | Cliente sabe que sera atendido por humano |
