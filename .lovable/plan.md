# Plano: Correção do Fluxo de Processamento de Imagens via WhatsApp

## ✅ Status: IMPLEMENTADO

## Mudanças realizadas

### 1. `whatsapp-media-webhook/index.ts`
- ✅ Adicionada função `getBase64FromEvolution()` para obter base64 via Evolution API como fallback
- ✅ Implementado correlation ID para rastreamento de logs
- ✅ Quando `payload.data.base64` vem vazio, chama `POST /chat/getBase64FromMediaMessage/{instance}`
- ✅ Logs melhorados indicando a fonte da imagem (`webhook_base64` ou `evolution_getBase64`)
- ✅ Tratamento robusto do retorno da Evolution (diferentes formatos de resposta)

### 2. `product-search-agent/index.ts` (case `analyze_image`)
- ✅ Validação de URL do WhatsApp (`mmg.whatsapp.net`) - rejeita sem chamar OpenAI
- ✅ Prompt otimizado para receitas médicas (extrai nome + dosagem, ignora dados pessoais)
- ✅ Retorno estruturado compatível com `AnalysisResult` (com `products[]`)
- ✅ Busca automática no catálogo para cada item identificado
- ✅ Logs detalhados do processamento

## Teste esperado
1. Enviar receita/imagem para instância `store_drogaria-farma-bella`
2. Verificar nos logs:
   - `hasBase64: true` ou `imageSource: evolution_getBase64`
   - Análise bem sucedida sem `invalid_image_url`
3. Cliente recebe resposta no WhatsApp com itens identificados e links do catálogo

## Configuração necessária
Se o fallback via Evolution API não funcionar, habilite `WEBHOOK_BASE64=true` na configuração do webhook da instância.
