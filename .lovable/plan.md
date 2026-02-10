

# Central de Rastreamento de Marketing (Master Admin)

## Resumo

Criar uma nova seção no painel Master Admin para configurar e monitorar o rastreamento de campanhas (Google Ads, Facebook Pixel, Google Analytics) de todas as lojas da plataforma, sem alterar nada que já funciona.

## Impacto no sistema existente

- Os campos google_analytics_id e facebook_pixel_id que já existem na configuracao de cada loja continuam funcionando normalmente
- O arquivo advertisingScripts.ts nao e usado por nenhum componente atualmente, entao refatora-lo e seguro
- Nenhuma tabela existente sera modificada
- Nenhuma rota existente sera alterada
- Tudo que sera criado e novo (paginas, tabela, rotas)

## O que sera criado

### 1. Tabela no banco de dados
Nova tabela `platform_marketing_config` para configuracoes globais de tracking da plataforma (landing pages como /especial):
- google_ads_id (texto)
- google_ads_conversion_label (texto)
- facebook_pixel_id (texto)
- RLS: apenas master_admin pode ler/escrever

### 2. Pagina "Marketing e Tracking" no Master Admin

**Aba "Visao Geral das Lojas"**
- Tabela com todas as lojas mostrando status dos pixels configurados
- Indicador verde = configurado, vermelho = nao configurado
- Colunas: Loja, Google Analytics, Facebook Pixel
- Clique na loja leva para a configuracao dela

**Aba "Tracking da Plataforma"**
- Formulario para configurar Google Ads ID global (para landing pages /especial, home, etc.)
- Campo para Facebook Pixel ID global
- Campo para Conversion Label do Google Ads
- Instrucoes de como obter cada ID

**Aba "Eventos de Conversao"**
- Lista informativa dos eventos rastreados (PageView, SignUp, Purchase, Lead, etc.)
- Onde cada evento e disparado no sistema
- Status ativo/inativo

### 3. Menu no sidebar
- Novo item "Marketing" na secao de ferramentas do Master Admin
- Icone: Target ou BarChart3

### 4. Ativacao dos scripts de rastreamento
- Refatorar advertisingScripts.ts para aceitar IDs como parametro (em vez de variaveis de ambiente)
- Nas paginas publicas da loja: buscar IDs da store_configurations e injetar scripts
- Nas landing pages (/especial, home): buscar IDs da platform_marketing_config e injetar scripts
- Injecao condicional: so injeta se o ID existir

## Detalhes tecnicos

### Arquivos novos
```text
src/pages/dashboard/MarketingTrackingPage.tsx
src/components/admin/marketing/TrackingOverview.tsx
src/components/admin/marketing/PlatformTrackingConfig.tsx
src/components/admin/marketing/ConversionEventsList.tsx
```

### Arquivos modificados
```text
src/lib/advertisingScripts.ts -- refatorar para aceitar IDs como parametro
src/routes/masterRoutes.tsx -- adicionar rota
src/components/admin/sidebar -- adicionar item de menu
```

### Fluxo de injecao de scripts
1. Pagina publica carrega
2. Busca IDs de tracking do banco (store_configurations ou platform_marketing_config)
3. Se ID existe, cria elemento script e adiciona ao head
4. Registra eventos de conversao nos pontos corretos (signup, pedido, etc.)

### Ordem de implementacao
1. Criar tabela platform_marketing_config com RLS
2. Criar pagina e componentes de UI
3. Adicionar rota e menu no sidebar
4. Refatorar advertisingScripts.ts
5. Integrar injecao de scripts nas paginas publicas

