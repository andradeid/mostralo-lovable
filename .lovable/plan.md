# Plano: Correção do Fluxo de Processamento de Imagens via WhatsApp

## ✅ Status: IMPLEMENTADO (2026-02-01)

## Diagnóstico do Problema

O fluxo de imagens estava **incompleto**:

1. O webhook `whatsapp-media-webhook` recebia a imagem da Evolution API ✅
2. Chamava o `product-search-agent` com a função `analyze_image` ✅
3. Recebia o resultado da análise ✅
4. **NÃO ENVIAVA A RESPOSTA de volta para o cliente** ❌ → **CORRIGIDO** ✅

## Correções Implementadas

### ✅ Tarefa 1: Atualizado `whatsapp-media-webhook/index.ts`

Adicionadas as seguintes funcionalidades:

- **Função `sendWhatsAppMessage()`**: Envia mensagem via Evolution API
  - Busca configuração da Evolution API na tabela `evolution_config`
  - Normaliza número de telefone do `remoteJid`
  - Envia resposta formatada para o cliente

- **Função `formatResponseMessage()`**: Formata a resposta para o cliente
  - Saudação personalizada com nome do cliente (`pushName`)
  - Lista produtos identificados com nome, preço e link
  - Tratamento de erros de forma amigável

- **Extração de dados do cliente**:
  - `remoteJid`: Número do cliente para resposta
  - `pushName`: Nome do cliente para personalização
  - `storeSlug`: Para gerar links dos produtos

### Fluxo Corrigido

```text
Evolution API → whatsapp-media-webhook → product-search-agent → sendWhatsAppMessage → Cliente recebe resposta ✅
```

### Formato da Resposta para o Cliente

```text
Olá, [Nome]! 🔍 Analisei a imagem que você enviou!

📋 [Descrição da análise]

Identifiquei os seguintes itens:

1. *Dipirona Sódica 500mg* - R$ 12,90
   👉 https://mostralo.com.br/loja/[slug]/produto/[produto-slug]

Deseja que eu adicione algum ao carrinho? 🛒
```

## Tarefas Pendentes (Opcionais)

### 🔲 Tarefa 2: Verificar OpenAI Assistant (Média prioridade)
- Garantir que a tool `analyze_image` está configurada no Assistant
- Verificar se o `product-search-agent` retorna dados estruturados corretamente

### 🔲 Tarefa 3: Interface de Teste no Dashboard (Baixa prioridade)
- Criar interface para testar envio de imagem manualmente
- Permitir upload de imagem e simular o processamento

## Requisitos de Configuração

Para funcionar corretamente, garantir que:

1. **Evolution API**:
   - `WEBHOOK_BASE64 = true` habilitado
   - Webhook apontando para: `https://noshwvwpjtnvndokbfjx.supabase.co/functions/v1/whatsapp-media-webhook?instance=[instance_name]`
   - Evento `messages.upsert` selecionado

2. **Banco de Dados**:
   - `evolution_config` com `api_url` e `api_key` configurados e `is_active = true`
   - `whatsapp_instances` com instância da loja
   - `store_modules` com módulo `ai_vision` habilitado para a loja
