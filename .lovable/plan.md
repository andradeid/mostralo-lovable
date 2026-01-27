
# Plano: Busca Automática de Imagens na Importação Alquimia

## Análise de Impacto: Nada Quebra

### Verificação do Google Shopping Feed
O feed do Google Shopping (`supabase/functions/google-shopping-feed/index.ts`) lê o campo `image_url` dos produtos (linha 63):
```typescript
<g:image_link>${escapeXML(product.image_url || '')}</g:image_link>
```

**Impacto**: NENHUM. A imagem será salva no Supabase Storage e o campo `image_url` receberá uma URL pública válida do nosso CDN:
```
https://noshwvwpjtnvndokbfjx.supabase.co/storage/v1/object/public/store-images/products/uuid.jpg
```

O Google Merchant Center vai receber uma URL funcional, permanente e rápida.

### Bucket de Storage
Confirmado que o bucket `store-images` existe e é **público**, permitindo acesso direto às imagens.

### Compatibilidade com Sistema Existente
- Tabela `products` continua igual (campo `image_url` recebe uma URL string)
- Bucket `store-images` já existente será reutilizado
- Caminho `products/` já é o padrão usado no sistema
- Nenhum componente de exibição será alterado

---

## Arquivos a Criar

### 1. Migration: `image_search_config`
Tabela para armazenar credenciais da API de busca de imagens.

**Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | Chave primária |
| provider | text | 'google' ou 'bing' |
| api_key | text | Chave da API (criptografada pelo RLS) |
| search_engine_id | text | ID do Search Engine (Google cx) |
| is_active | boolean | Se a busca está habilitada |
| daily_limit | integer | Limite diário de buscas (default: 100) |
| searches_today | integer | Contador do dia atual |
| last_reset_date | date | Data do último reset |
| created_at | timestamptz | Criação |
| updated_at | timestamptz | Atualização |

**RLS:** Apenas `master_admin` pode ler/escrever.

---

### 2. Edge Function: `search-product-image`
Função serverless que busca a imagem, faz download e salva no Storage.

**Fluxo:**
1. Receber nome do produto e laboratório
2. Buscar credenciais na tabela `image_search_config`
3. Verificar limite diário
4. Chamar Google Custom Search API
5. Fazer download da imagem encontrada
6. Upload no bucket `store-images` (path: `products/{uuid}.jpg`)
7. Incrementar contador de uso
8. Retornar URL pública do Supabase Storage

**Tratamento de erros:**
- API não configurada → Retornar erro amigável
- Limite atingido → Retornar erro com mensagem clara
- Imagem não encontrada → Tentar fallback (sem laboratório)
- Falha no download → Retornar null e continuar

---

### 3. Página: `ImageSearchConfigPage.tsx`
Interface no Master Admin para configurar a API de busca de imagens.

**Localização:** `src/pages/admin/ImageSearchConfigPage.tsx`

**UI baseada no GoogleAppsConfigPage:**
- Badge de status (Configurado/Não Configurado)
- Campo para API Key (com toggle mostrar/ocultar)
- Campo para Search Engine ID
- Toggle para ativar/desativar busca
- Configuração de limite diário
- Contador de uso do dia com barra de progresso
- Instruções passo a passo em acordeão

---

### 4. Hook: `useImageSearch`
Gerenciador de buscas em lote.

**Funcionalidades:**
- Processar produtos em lotes de 50
- Executar requisições em paralelo dentro do lote
- Delay de 500ms entre lotes (evitar rate limit)
- Controle de progresso e cancelamento
- Retry automático em falhas pontuais
- Retornar produtos com `imagem_url` preenchida

---

### 5. Componente: `ImageSearchProgress.tsx`
Indicador visual do progresso da busca.

**Exibe:**
- Lote atual (ex: "Lote 5 de 20")
- Progresso total (ex: "250 de 1000 produtos")
- Barra de progresso
- Produto sendo processado
- Taxa de sucesso (ex: "198 imagens encontradas")
- Tempo estimado restante
- Botões: Cancelar / Pular e Importar sem Imagens

---

## Arquivos a Modificar

### 1. `src/routes/masterRoutes.tsx`
Adicionar rota `/dashboard/image-search-config` com acesso restrito a `master_admin`.

### 2. `src/components/admin/products/import/AlquimiaExportStep.tsx`
Adicionar toggle "Buscar imagens automaticamente" com aviso sobre tempo adicional.

### 3. `src/pages/admin/AlquimiaImportPage.tsx`
Integrar hook `useImageSearch` antes do import:
- Se toggle ativo: buscar imagens em lotes de 50
- Mostrar componente de progresso
- Após busca: passar produtos com URLs para `importProducts`

### 4. `src/lib/parseAlquimia.ts`
Expor o campo `laboratorio` no tipo `AlquimiaProduct` para melhorar a query de busca.

---

## Instruções para o Master Admin Configurar a API

### Passo 1: Criar Projeto no Google Cloud Console
1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Clique em **"Selecionar projeto"** → **"Novo Projeto"**
3. Nome sugerido: `Mostralo Image Search`
4. Clique em **"Criar"**

### Passo 2: Ativar a Custom Search API
1. No menu lateral, vá em **"APIs e Serviços"** → **"Biblioteca"**
2. Pesquise por **"Custom Search API"**
3. Clique na API e depois em **"Ativar"**

### Passo 3: Criar Credenciais (API Key)
1. Vá em **"APIs e Serviços"** → **"Credenciais"**
2. Clique em **"+ Criar Credenciais"** → **"Chave de API"**
3. Copie a chave gerada
4. (Opcional) Clique em **"Editar chave de API"** para restringir à Custom Search API

### Passo 4: Criar Search Engine
1. Acesse [programmablesearchengine.google.com](https://programmablesearchengine.google.com/)
2. Clique em **"Novo mecanismo de pesquisa"**
3. Em "Sites para pesquisar", marque **"Pesquisar toda a web"**
4. Nome: `Mostralo Product Images`
5. Clique em **"Criar"**
6. Vá em **"Painel de controle"** do mecanismo criado
7. Copie o **ID do mecanismo de pesquisa** (cx)

### Passo 5: Configurar no Mostralo
1. Acesse `/dashboard/image-search-config`
2. Cole a **API Key** no campo correspondente
3. Cole o **Search Engine ID** no segundo campo
4. Defina o **limite diário** (100 é gratuito/dia)
5. Clique em **"Salvar Configurações"**

---

## Fluxo Completo na Importação (1000 produtos)

```text
1. Upload do CSV Alquimia ✓
2. Preview dos produtos ✓
3. Ativar "Buscar imagens automaticamente"
4. Clicar "Importar Produtos"

   FASE 1: Busca de Imagens (lotes de 50)
   ├─ Lote 1:  Produtos 1-50     → ~3 segundos
   ├─ Lote 2:  Produtos 51-100   → ~3 segundos
   ├─ ...
   └─ Lote 20: Produtos 951-1000 → ~3 segundos
   
   Tempo total: ~60-90 segundos para 1000 produtos
   
   FASE 2: Importação no Banco
   ├─ Produtos já têm imagem_url do nosso Storage
   └─ Import normal via import-products

5. Dialog de sucesso com estatísticas
```

---

## Estimativas

| Tarefa | Tempo |
|--------|-------|
| Migration (tabela + RLS) | 5 min |
| Edge Function (busca + download + upload) | 30 min |
| Página ImageSearchConfigPage | 25 min |
| Hook useImageSearch (lotes de 50) | 20 min |
| Componente ImageSearchProgress | 15 min |
| Integração AlquimiaExportStep | 10 min |
| Integração AlquimiaImportPage | 15 min |
| Ajuste parseAlquimia | 5 min |
| Rota masterRoutes | 5 min |
| **Total** | ~2.5 horas |

---

## Custos da API

| Cenário | Buscas/dia | Custo |
|---------|------------|-------|
| Gratuito | Até 100 | $0 |
| 500 buscas | 500 | ~$2.50 |
| 1000 buscas | 1000 | ~$5.00 |

Para importar 1000 produtos por dia, o custo seria de aproximadamente **$5/dia** ou **~R$25/dia** além do limite gratuito.

---

## Resumo de Garantias

| Aspecto | Status |
|---------|--------|
| Google Shopping Feed | Não afetado (URL válida do Storage) |
| Campo image_url | Mesmo formato (string URL) |
| Bucket store-images | Reutilizado (já existe e é público) |
| Componentes de exibição | Não alterados |
| Sistema de importação | Funciona com ou sem busca de imagens |
| Segurança | API Key protegida no backend |
