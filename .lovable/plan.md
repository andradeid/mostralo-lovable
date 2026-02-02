# Plano: Corrigir Duplicação de Mensagens e Captura de Nome ✅ IMPLEMENTADO

## Alterações Realizadas

### 1. ✅ Extração de pushName de functionArguments
O `pushName` agora é extraído PRIMEIRO dos argumentos da função (`parsedArgs?.pushName`) antes de tentar buscar no banco. Isso resolve o problema `[Nome]`.

### 2. ✅ Anti-Duplicação de Mensagens
Quando `imagesSentCount > 0`, o resultado agora NÃO inclui a lista `products[]`, apenas:
- `images_sent: true`
- `customer_name`
- `suggested_response`
- `message` explicativo

Isso impede que o assistente repita as informações.

### 3. ✅ Regra Anti-Duplicação Reforçada no Prompt
O prompt do assistente agora tem instruções claras e enfáticas para NÃO repetir informações quando receber `images_sent: true`.

## Arquivos Modificados

| Arquivo | Status |
|---------|--------|
| `supabase/functions/product-search-agent/index.ts` | ✅ Atualizado |
| `supabase/functions/openai-bot-sync/index.ts` | ✅ Atualizado |

## Deploy

✅ Edge Functions deployadas com sucesso.

## Próximo Passo

**Testar** enviando uma mensagem de texto pedindo produto (ex: "tem paracetamol?") para verificar:
1. Se o nome aparece corretamente (ex: "Olá Andrade!")
2. Se a duplicação parou (apenas foto + confirmação curta)

## Sobre a Imagem Errada

O produto "Paracetamol+codeina 500+30mg" está com a imagem de "Cloridrato de fexofenadina" cadastrada incorretamente no banco de dados da Drogaria Farma Bella. **Isso é um erro de dados**, não de código - deve ser corrigido pelo painel administrativo.
