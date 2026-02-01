
# Plano: Correção do Fluxo de Processamento de Imagens via WhatsApp

## Diagnóstico do Problema

Ao analisar o código, identifiquei que o fluxo de imagens está **incompleto**:

1. O webhook `whatsapp-media-webhook` recebe a imagem da Evolution API
2. Chama o `product-search-agent` com a função `analyze_image`
3. Recebe o resultado da análise (identificação do produto)
4. **MAS NÃO ENVIA A RESPOSTA de volta para o cliente no WhatsApp**

O webhook apenas retorna o JSON para a Evolution API, que não faz nada com isso. A resposta deveria ser enviada ativamente para o cliente.

## Arquitetura Atual vs Esperada

```text
ATUAL (quebrado):
Evolution API → whatsapp-media-webhook → product-search-agent → JSON (perdido)

ESPERADO:
Evolution API → whatsapp-media-webhook → product-search-agent → whatsapp-send → Cliente recebe resposta
```

## Correções Necessárias

### 1. Modificar `whatsapp-media-webhook/index.ts`

Após receber a análise do `product-search-agent`, enviar a resposta para o cliente via Evolution API:

```text
- Extrair o `remoteJid` (número do cliente) do payload
- Após processar a imagem, chamar a Evolution API para enviar a resposta
- Usar o resultado da análise para compor uma mensagem amigável
- Opcionalmente, buscar produtos relacionados no catálogo
```

### 2. Integrar com o Bot OpenAI (Opcional - Fluxo Alternativo)

A Evolution API com OpenAI Assistants **já pode processar imagens diretamente** se o Assistant tiver a tool `analyze_image` configurada. Neste caso:

- A imagem chega via webhook normal (`whatsapp-webhook`)
- O OpenAI Assistant identifica que é uma imagem e chama `analyze_image`
- A resposta é enviada automaticamente pelo bot

### 3. Verificar Configuração na Evolution API

Garantir que:
- **WEBHOOK_BASE64 = true** está habilitado
- O webhook está apontando para a URL correta
- O evento `messages.upsert` está selecionado

## Tarefas de Implementação

### Tarefa 1: Atualizar `whatsapp-media-webhook`
- Adicionar envio de resposta via Evolution API após análise
- Extrair `remoteJid` e `pushName` do payload
- Buscar configuração da Evolution API no banco
- Enviar mensagem formatada com resultado da análise
- Se produtos forem identificados, buscar no catálogo e incluir links

### Tarefa 2: Melhorar Integração com OpenAI Assistant
- Verificar se o Assistant tem a tool `analyze_image` configurada
- Garantir que o `product-search-agent` retorna dados estruturados para o Assistant usar

### Tarefa 3: Criar Endpoint de Teste (Opcional)
- Criar interface no dashboard para testar o envio de imagem manualmente
- Permitir upload de imagem e simular o processamento

## Detalhes Técnicos

### Payload esperado da Evolution API (com imagem):
```json
{
  "event": "messages.upsert",
  "instance": "store_drogaria-farma-bella",
  "data": {
    "key": {
      "remoteJid": "5561999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "ABC123"
    },
    "pushName": "Cliente",
    "message": {
      "imageMessage": {
        "mimetype": "image/jpeg",
        "caption": "Preciso desse remédio"
      }
    },
    "messageType": "imageMessage",
    "base64": "data:image/jpeg;base64,/9j/4AAQ..."
  }
}
```

### Resposta esperada para o cliente:
```text
🔍 Analisei a imagem que você enviou!

Identifiquei os seguintes itens:

1. *Dipirona Sódica 500mg* - R$ 12,90
   👉 https://mostralo.com.br/loja/drogaria-farma-bella/produto/dipirona-500mg

Deseja que eu adicione ao carrinho? 🛒
```

## Prioridade de Implementação

1. **Alta**: Modificar `whatsapp-media-webhook` para enviar resposta
2. **Média**: Garantir que a tool está no OpenAI Assistant
3. **Baixa**: Interface de teste no dashboard

## Estimativa de Tempo
- Implementação: 30-45 minutos
- Testes: 15-20 minutos
