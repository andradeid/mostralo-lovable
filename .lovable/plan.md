
# Plano: Envio de Fotos com Legenda Completa no Assistente v2

## ✅ STATUS: IMPLEMENTADO

## Resumo
Quando o assistente v2 encontrar produtos, enviará as fotos com legenda completa contendo nome, valor e link para compra direta.

## Mudanças Implementadas

### 1. Extração de dados da sessão WhatsApp
- Adicionado extração de `instanceName` e `remoteJid` do payload da Evolution API

### 2. Função `sendProductImageWithCaption`
- Envia imagem via Evolution API com legenda formatada:
```text
📦 *Nome do Produto*
💰 R$ 00,00
👉 https://mostralo.com.br/loja/slug/produto/slug
```

### 3. Integração nas funções de busca
- `search_products` ✅
- `check_stock` ✅
- `get_promotions` ✅
- `get_recommendations` ✅

### 4. Campo `image_url` nos SELECTs
- Adicionado em todas as consultas que retornam produtos

## Resultado
Cliente pergunta "tem vitamina C?" → Recebe:
1. **Foto 1** com legenda: `📦 *Vitamina C 1g*\n💰 R$ 29,90\n👉 link`
2. **Foto 2** com legenda: `📦 *Vitamina C Efervescente*\n💰 R$ 24,90\n👉 link`
3. **Texto** do assistente com lista completa e informações adicionais

## Compatibilidade
- Se `instanceName`/`remoteJid` não estiverem no payload, funciona normalmente (apenas texto)
- Não afeta o fluxo de análise de receitas no `whatsapp-media-webhook`
- Respeita limite de 3 fotos para não sobrecarregar
