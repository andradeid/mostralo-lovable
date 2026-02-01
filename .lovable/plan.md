
# Plano: Sistema Completo de Processamento de Imagens via WhatsApp

## Resumo Executivo
Implementar o sistema completo para que o bot de IA possa receber, processar e analisar imagens enviadas pelos clientes via WhatsApp, usando GPT-4o Vision. O sistema será por loja (multi-tenant) e a configuração do webhook será visível apenas para o Master Admin.

---

## Contexto Atual

### O que já existe:
1. **Tool `analyze_image`** no `product-search-agent` - funcional e implementada
2. **Módulo AI Vision** habilitado para Farma Bella
3. **OpenAI Assistant** configurado para cada loja

### O que está faltando:
1. **Tool `analyze_image` não registrada** no OpenAI Assistant (linhas 1231-1317 do `openai-bot-sync`)
2. **Webhook Base64 desabilitado** na Evolution API
3. **Passagem de dados da imagem** para o `product-search-agent`
4. **Interface de configuração** para o Master Admin

---

## Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE PROCESSAMENTO                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. Cliente envia imagem pelo WhatsApp                                  │
│                    │                                                    │
│                    ▼                                                    │
│  2. Evolution API recebe imagem + base64                                │
│     (Webhook Base64 = habilitado)                                       │
│                    │                                                    │
│                    ▼                                                    │
│  3. Evolution envia para OpenAI Assistant                               │
│     (via botType: 'assistant')                                          │
│                    │                                                    │
│                    ▼                                                    │
│  4. Assistant detecta imagem e chama tool 'analyze_image'               │
│                    │                                                    │
│                    ▼                                                    │
│  5. product-search-agent recebe chamada                                 │
│     - Verifica módulo AI Vision                                         │
│     - Processa imagem com GPT-4o Vision                                 │
│     - Retorna análise                                                   │
│                    │                                                    │
│                    ▼                                                    │
│  6. Assistant responde ao cliente com identificação do produto          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Tarefas de Implementação

### Tarefa 1: Adicionar Tool `analyze_image` no OpenAI Assistant
**Arquivo:** `supabase/functions/openai-bot-sync/index.ts`

Adicionar as 3 tools faltantes no array `assistantTools` (linha ~1317):
- `analyze_image` - Analisar imagens enviadas
- `check_store_status` - Verificar se loja está aberta
- `get_current_greeting` - Obter saudação correta por horário

```text
{
  type: 'function',
  function: {
    name: 'analyze_image',
    description: 'Analisa uma imagem enviada pelo cliente para identificar produtos, receitas médicas ou embalagens.',
    parameters: {
      type: 'object',
      properties: {
        image_data: {
          type: 'object',
          description: 'Dados da imagem (base64 ou url)',
          properties: {
            base64: { type: 'string' },
            url: { type: 'string' },
            mimetype: { type: 'string' }
          }
        },
        image_context: {
          type: 'string',
          description: 'Contexto adicional da imagem'
        }
      },
      required: ['image_data']
    }
  }
}
```

---

### Tarefa 2: Criar Página de Configuração do Webhook (Master Admin)
**Arquivos Novos:**
- `src/pages/dashboard/WhatsAppWebhookConfigPage.tsx`

**Funcionalidade:**
- Listar todas as instâncias WhatsApp das lojas
- Mostrar URL do webhook por instância
- Status de configuração de cada webhook
- Botão para copiar URL

**Interface:**
```text
┌─────────────────────────────────────────────────────────────────┐
│  Configuração de Webhooks - Imagens WhatsApp                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Loja: Farma Bella                                              │
│  Instância: farmabella_instance                                 │
│  Status: ✅ Conectada                                            │
│                                                                 │
│  Webhook URL:                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ https://noshwvw...supabase.co/functions/v1/whatsapp-... │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [📋 Copiar URL]  [📖 Instruções]                               │
│                                                                 │
│  ⚠️ Configurações na Evolution API:                             │
│  □ WEBHOOK_BASE64 = true                                        │
│  □ WEBHOOK_EVENTS = messages.upsert                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Tarefa 3: Criar Edge Function para Webhook de Mídia
**Arquivo Novo:** `supabase/functions/whatsapp-media-webhook/index.ts`

Esta função receberá especificamente eventos de mídia da Evolution API:
- Receber payload com imagem em base64
- Identificar a loja pela instância
- Repassar dados para o `product-search-agent`

```text
Endpoints:
POST /whatsapp-media-webhook
  - event: messages.upsert
  - message.messageType: imageMessage | documentMessage
  - message.message.base64: <dados da imagem>
```

---

### Tarefa 4: Atualizar Prompt do Assistant para Contexto de Imagens
**Arquivo:** `supabase/functions/openai-bot-sync/index.ts`

Adicionar instruções no prompt sobre como lidar com imagens:

```text
ANÁLISE DE IMAGENS (MÓDULO VISÃO POR IA):
- Quando o cliente enviar uma IMAGEM, use a função analyze_image
- Identifique: produto, marca, quantidade, informações da embalagem
- Se for receita médica: liste os medicamentos (SEM diagnósticos médicos)
- Após identificar, use search_products para localizar no catálogo
- Se não conseguir identificar: peça foto mais nítida educadamente
```

---

### Tarefa 5: Adicionar Rota no App.tsx e Menu Master Admin
**Arquivos:**
- `src/App.tsx` - Adicionar rota `/dashboard/webhook-config`
- `src/components/dashboard/DashboardSidebar.tsx` - Adicionar item no menu Master

---

### Tarefa 6: Deploy e Sincronização
Após as alterações:
1. Deploy das edge functions modificadas
2. Re-sincronizar bot da Farma Bella para atualizar tools no OpenAI
3. Configurar webhook na Evolution API manualmente

---

## Configuração Manual Necessária (Evolution API)

O Master Admin precisará acessar o painel da Evolution API e:

1. **Habilitar Webhook Base64:**
   - Settings → Webhook → Webhook Base64 = `true`

2. **Configurar URL do Webhook:**
   - URL: `https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/whatsapp-media-webhook`

3. **Selecionar Eventos:**
   - `messages.upsert` (para receber mensagens com mídia)

---

## Segurança e Isolamento Multi-Tenant

- Cada loja tem sua própria instância WhatsApp
- O webhook identifica a loja pelo `instance_name`
- Credenciais OpenAI são isoladas por loja
- Módulo AI Vision deve estar habilitado por loja
- Apenas Master Admin pode ver/configurar webhooks

---

## Estimativa de Tempo
- Tarefa 1 (Tools no Assistant): 15 minutos
- Tarefa 2 (Página de Config): 45 minutos
- Tarefa 3 (Edge Function Webhook): 30 minutos
- Tarefa 4 (Prompt): 10 minutos
- Tarefa 5 (Rotas/Menu): 10 minutos
- Tarefa 6 (Deploy/Teste): 20 minutos

**Total: ~2 horas**

---

## Próximos Passos Após Aprovação
1. Implementar alterações no código
2. Fazer deploy das edge functions
3. Re-sincronizar bot da Farma Bella
4. Configurar webhook na Evolution API
5. Testar envio de imagem pelo WhatsApp
