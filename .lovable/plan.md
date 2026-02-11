
# Rastreamento de Cliques em Botoes Importantes

## Resumo

Adicionar rastreamento de cliques em botoes estrategicos (WhatsApp, CTA de cadastro, downloads) reutilizando a infraestrutura ja existente (`page_visits` + edge function `track-visit`). Os dados de clique aparecerao em uma nova secao dentro da aba **"Visitas"**.

## O que voce vai ganhar

- Saber quantas vezes cada botao importante foi clicado
- Ver quais CTAs convertem mais (WhatsApp vs Cadastro vs Download)
- Cruzar cliques com campanhas UTM para medir efetividade
- Filtrar por periodo, dispositivo e pagina de origem
- Comparar performance de cliques ao longo do tempo

---

## Como funciona

Em vez de criar uma tabela separada, vamos adicionar um campo `event_type` na tabela `page_visits` existente:

- `pageview` (padrao, como ja funciona)
- `click_whatsapp`
- `click_cta_signup`
- `click_download`
- `click_cta_diagnostico`
- `click_cta_plans`

Cada clique registra a mesma riqueza de dados (UTMs, dispositivo, localizacao, sessao), permitindo cruzar com as visitas.

---

## O que sera criado/alterado

### 1. Alteracao na tabela `page_visits`

- Adicionar coluna `event_type TEXT DEFAULT 'pageview'`
- Adicionar coluna `event_label TEXT` (detalhes extras, ex: "botao-whatsapp-header")
- Indice na coluna `event_type` para consultas rapidas

### 2. Atualizar edge function `track-visit`

- Aceitar campos opcionais `event_type` e `event_label` no payload
- Se nao enviado, assume `pageview` (compatibilidade total)

### 3. Novo utilitario `trackClick`

Uma funcao simples para ser chamada em qualquer `onClick`:

```text
trackClick("click_whatsapp", "botao-flutuante-lead")
trackClick("click_cta_signup", "hero-landing-page")
trackClick("click_download", "catalogo-pdf-loja-x")
```

Fire-and-forget, sem bloquear a acao do botao.

### 4. Instrumentar botoes existentes

Adicionar `trackClick(...)` nos seguintes pontos (sem alterar comportamento visual ou funcional):

| Botao | Tipo de evento | Onde esta |
|-------|---------------|-----------|
| WhatsApp flutuante (LeadChatForm) | click_whatsapp | WhatsAppLeadButton.tsx |
| WhatsApp da loja (ProductDetail) | click_whatsapp | ProductDetail.tsx |
| WhatsApp do booking | click_whatsapp | BookingStoreInfo.tsx |
| CTA "Criar Conta" / "Cadastro" | click_cta_signup | Landing pages, FinalCTASection, etc. |
| CTA "Diagnostico Gratuito" | click_cta_diagnostico | AboutCTA.tsx, landing pages |
| CTA "Ver Planos" | click_cta_plans | AboutCTA.tsx, landing pages |
| Downloads de PDF/catalogo | click_download | Onde houver links de download |

### 5. Nova secao no dashboard "Visitas"

Adicionar ao `VisitsAnalytics.tsx`:

**Cards de cliques (resumo)**
- Total de cliques no periodo
- Cliques WhatsApp
- Cliques CTA Cadastro
- Cliques em Downloads

**Grafico de cliques por tipo**
- Grafico de barras mostrando cada tipo de evento

**Tabela de cliques detalhada**
- Tipo, label, pagina de origem, data/hora
- Filtro por tipo de evento
- Agrupamento por campanha UTM

---

## Impacto no sistema

- **Comportamento dos botoes**: ZERO alteracao - o tracking e adicionado junto ao onClick existente
- **Performance**: fire-and-forget, sem await, sem bloqueio
- **Tabela page_visits**: coluna nova com default, dados existentes continuam validos
- **Edge function**: campos opcionais, 100% compativel com chamadas atuais
- **Demais funcionalidades**: nenhuma alteracao

## Detalhes tecnicos

### Arquivos novos
```text
src/utils/trackClick.ts              -- Funcao utilitaria para rastrear cliques
src/components/admin/marketing/visits/ClicksAnalytics.tsx  -- Secao de cliques no dashboard
```

### Arquivos modificados
```text
supabase/migrations/new             -- ALTER TABLE page_visits ADD COLUMN event_type, event_label
supabase/functions/track-visit/index.ts  -- Aceitar event_type e event_label
src/components/admin/marketing/VisitsAnalytics.tsx  -- Adicionar secao de cliques
src/components/leads/WhatsAppLeadButton.tsx  -- trackClick no onClick
src/components/ProductDetail.tsx     -- trackClick no WhatsApp da loja
src/components/booking/BookingStoreInfo.tsx  -- trackClick no WhatsApp booking
src/components/about/AboutCTA.tsx    -- trackClick nos CTAs
src/components/gestao-total/FinalCTASection.tsx  -- trackClick no CTA signup
```

### Ordem de implementacao
1. Migrar banco (adicionar colunas event_type e event_label)
2. Atualizar edge function track-visit
3. Criar utilitario trackClick
4. Instrumentar botoes existentes
5. Criar componente ClicksAnalytics no dashboard
6. Integrar na aba Visitas
