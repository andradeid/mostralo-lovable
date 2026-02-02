
# Plano: Assistente Inteligente v2 como Módulo Separado

## Resumo
Criar o módulo "Assistente Inteligente v2" no sistema de módulos para permitir precificação e controle de acesso independente. O custo de operação (OpenAI tokens) justifica um preço premium.

## Preço Sugerido: R$ 197,00/mês

### Referência de Mercado
| Concorrente | Preço |
|-------------|-------|
| Anota AI (assistente IA) | R$ 279,99/mês |
| FidelizAI (chatbot) | R$ 99,90/mês |
| Chatbots IA corporativos | R$ 150-350/mês |
| WhatsApp Recuperação (seu sistema) | R$ 99,90/mês |
| SENTINELA (seu sistema) | R$ 129,90/mês |

**Justificativa do preço R$ 197**: 
- Usa OpenAI Assistants API (custo por token)
- Function calling em tempo real (consultas ao banco)
- Envio de fotos de produtos automatizado
- Análise de imagens (receitas médicas)
- Preço competitivo (30% abaixo do Anota AI)

---

## Mudanças Necessárias

### 1. Inserir Módulo no Banco de Dados
Criar registro na tabela `modules` com:
- **key**: `intelligent_assistant_v2`
- **name**: Assistente Inteligente v2
- **description**: Assistente virtual com IA para WhatsApp. Responde perguntas sobre produtos, analisa receitas médicas por foto, envia imagens de produtos recomendados e consulta estoque em tempo real.
- **icon**: MessageCircle ou Bot
- **suggested_price**: 197.00
- **price_reference**: Anota AI R$ 279,99/mês, FidelizAI R$ 99,90/mês, chatbots IA R$ 150-350/mês
- **dependencies**: `["whatsapp"]` (depende do módulo WhatsApp)

### 2. Atualizar Página de Módulos (ModulesPage.tsx)
Adicionar no objeto `moduleDetails`:
```typescript
'intelligent_assistant_v2': {
  description: 'Assistente virtual com inteligência artificial para WhatsApp. Responde perguntas sobre produtos, estoque e promoções. Analisa fotos de receitas médicas e recomenda produtos. Envia fotos dos produtos automaticamente com preço e link de compra. Usa OpenAI Assistants API com function calling para consultas em tempo real.',
  category: 'premium'
}
```

Adicionar ícone `Bot` ou `Sparkles` no `iconMap`.

### 3. Liberar para Farma Bella
Inserir registro na tabela `store_modules`:
- **store_id**: `a8f04e0e-732b-4b60-acf8-a2a04b6a2382` (Farma Bella)
- **module_id**: (id do novo módulo)
- **is_enabled**: `true`

### 4. (Opcional) Gate no Assistente v2
Adicionar verificação no fluxo do bot para checar se a loja tem o módulo liberado antes de usar o assistente v2.

---

## Detalhes Técnicos

### SQL para criar o módulo
```sql
INSERT INTO modules (name, key, description, icon, suggested_price, price_reference, dependencies, is_active)
VALUES (
  'Assistente Inteligente v2',
  'intelligent_assistant_v2',
  'Assistente virtual com IA para WhatsApp. Responde sobre produtos, analisa receitas médicas por foto, envia imagens de produtos e consulta estoque em tempo real.',
  'MessageCircle',
  197.00,
  'Anota AI R$ 279,99/mês, FidelizAI R$ 99,90/mês, chatbots IA R$ 150-350/mês',
  '["whatsapp"]',
  true
);
```

### SQL para liberar Farma Bella
```sql
INSERT INTO store_modules (store_id, module_id, is_enabled)
SELECT 
  'a8f04e0e-732b-4b60-acf8-a2a04b6a2382',
  id,
  true
FROM modules 
WHERE key = 'intelligent_assistant_v2';
```

### Arquivo ModulesPage.tsx
```typescript
// Adicionar no iconMap
import { Bot } from 'lucide-react';
const iconMap = {
  // ... existentes
  Bot,
};

// Adicionar no moduleDetails
'intelligent_assistant_v2': {
  description: 'Assistente virtual com inteligência artificial para WhatsApp. Responde perguntas sobre produtos, estoque e promoções. Analisa fotos de receitas médicas e recomenda produtos. Envia fotos dos produtos automaticamente com preço e link de compra. Usa OpenAI Assistants API com function calling para consultas em tempo real.',
  category: 'premium'
}
```

---

## Arquivos a Modificar
1. **Migração SQL** - Criar módulo + liberar Farma Bella
2. **src/pages/admin/ModulesPage.tsx** - Adicionar descrição e ícone

## Resultado Esperado
- Módulo aparece na página `/dashboard/modules` com preço R$ 197,00
- Master admin pode liberar/bloquear por loja em `/dashboard/modulos/gerenciar-acesso`
- Farma Bella já terá o módulo liberado automaticamente

## Risco
**Baixo** - Apenas adiciona um novo módulo ao sistema sem alterar funcionalidades existentes.
