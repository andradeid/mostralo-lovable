

# Central de Analytics de Visitas - Nova aba "Visitas"

## Resumo

Adicionar uma nova aba **"Visitas"** na pagina `/dashboard/marketing-tracking` com um sistema completo de monitoramento de visitas do site. O sistema registra cada pageview dos visitantes (paginas publicas e lojas) e apresenta dashboards com metricas detalhadas. **Nenhuma funcionalidade existente sera alterada.**

## O que voce vai ganhar

- Ver em tempo real quantas pessoas estao visitando seu site
- Saber de qual cidade/pais vem seus visitantes
- Entender quais paginas sao mais acessadas
- Ver qual navegador e dispositivo (celular/desktop) seus visitantes usam
- Cruzar dados de UTM das campanhas com as visitas
- Filtrar por periodo (hoje, 7 dias, 30 dias, personalizado)

---

## O que sera criado

### 1. Tabela `page_visits` no banco de dados

Armazena cada visita com informacoes ricas:

| Campo | Descricao |
|-------|-----------|
| page_url | Pagina visitada (/especial, /loja/x, etc.) |
| session_id | Identificador unico da sessao |
| referrer | De onde o visitante veio |
| user_agent | Navegador e sistema operacional |
| device_type | mobile, tablet ou desktop |
| browser | Chrome, Safari, Firefox, etc. |
| os | Android, iOS, Windows, etc. |
| country | Pais do visitante |
| city | Cidade do visitante |
| region | Estado/regiao |
| utm_source, utm_medium, utm_campaign, utm_content, utm_term | Parametros de campanha |
| store_id | Loja associada (se aplicavel) |
| created_at | Data/hora da visita |

RLS: leitura apenas para master_admin; insercao publica (anon) para registrar visitas.

### 2. Edge Function `track-visit`

Para capturar a localizacao (pais/cidade) do visitante de forma segura:
- Recebe os dados da visita via POST
- Usa o IP do request para obter geolocalizacao (via headers do Supabase/Deno)
- Faz o parse do user_agent para extrair navegador e sistema operacional
- Insere na tabela `page_visits`
- Nenhum dado sensivel exposto no frontend

### 3. Hook `useTrackPageVisit`

Componente leve que dispara em cada navegacao:
- Detecta mudanca de rota (react-router)
- Coleta UTMs, referrer, device_type, user_agent
- Envia para a edge function `track-visit`
- Nao afeta performance (fire-and-forget, sem await bloqueante)
- Ativado apenas em paginas publicas (nao rastreia o dashboard admin)

### 4. Nova aba "Visitas" com dashboard completo

Adicionada como 4a aba na pagina Marketing & Tracking, contendo:

**Cards de resumo (topo)**
- Total de visitas (periodo selecionado)
- Visitantes unicos (por session_id)
- Paginas por sessao (media)
- Taxa de rejeicao estimada (sessoes com 1 pagina)

**Filtro de periodo**
- Hoje, 7 dias, 30 dias, 90 dias, personalizado (date picker)

**Graficos e tabelas**

| Secao | Tipo | O que mostra |
|-------|------|-------------|
| Visitas ao longo do tempo | Grafico de linha (Recharts) | Visitas por dia/hora no periodo |
| Paginas mais visitadas | Tabela com barra de progresso | Top 10 URLs mais acessadas |
| Origem do trafego | Grafico de pizza | Direto, Organico, Redes Sociais, Campanhas |
| Dispositivos | Grafico de rosca | Mobile vs Tablet vs Desktop |
| Navegadores | Grafico de barras horizontal | Chrome, Safari, Firefox, Edge, etc. |
| Localizacao | Tabela ranqueada | Top paises e cidades |
| Campanhas UTM | Tabela expansivel | Source, Medium, Campaign com visitas de cada |

---

## Impacto no sistema existente

- **ZERO alteracao** em paginas, componentes ou rotas existentes
- A pagina `MarketingTrackingPage.tsx` recebe apenas 1 nova aba (aditiva)
- O hook de tracking e inserido no layout publico, sem interferir na logica atual
- A tabela `popup_analytics` continua funcionando independentemente
- Os scripts de Google Ads/Facebook Pixel nao sao alterados

## Detalhes tecnicos

### Arquivos novos
```text
supabase/functions/track-visit/index.ts       -- Edge function para registrar visita + geo
src/components/admin/marketing/VisitsAnalytics.tsx  -- Dashboard principal da aba Visitas
src/components/admin/marketing/visits/VisitsSummaryCards.tsx
src/components/admin/marketing/visits/VisitsChart.tsx
src/components/admin/marketing/visits/TopPagesTable.tsx
src/components/admin/marketing/visits/TrafficSourcesChart.tsx
src/components/admin/marketing/visits/DevicesChart.tsx
src/components/admin/marketing/visits/BrowsersChart.tsx
src/components/admin/marketing/visits/LocationsTable.tsx
src/components/admin/marketing/visits/UTMCampaignsTable.tsx
src/hooks/useTrackPageVisit.ts                -- Hook para rastrear navegacao
```

### Arquivos modificados
```text
src/pages/dashboard/MarketingTrackingPage.tsx  -- Adicionar 4a aba "Visitas"
src/App.tsx ou layout publico                  -- Inserir useTrackPageVisit nas rotas publicas
```

### Fluxo de coleta
```text
Visitante acessa pagina publica
  -> useTrackPageVisit detecta navegacao
  -> Coleta: URL, referrer, UTMs, user_agent, device_type
  -> POST para edge function track-visit
  -> Edge function extrai IP, faz geo lookup, parse do user_agent
  -> Insere registro na tabela page_visits
```

### Fluxo de visualizacao
```text
Admin acessa /dashboard/marketing-tracking -> aba Visitas
  -> Query na tabela page_visits com filtro de periodo
  -> Agrega dados por dia, pagina, dispositivo, browser, cidade
  -> Renderiza graficos com Recharts (ja instalado)
```

### Ordem de implementacao
1. Criar tabela `page_visits` com RLS
2. Criar edge function `track-visit`
3. Criar hook `useTrackPageVisit` e inserir no layout publico
4. Criar componentes do dashboard de visitas
5. Adicionar aba na `MarketingTrackingPage`

