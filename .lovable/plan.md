
# Plano: Detecção de Receitas Controladas no Módulo Vision Plus

## Resumo

Adicionar inteligência ao módulo de análise de imagens para identificar automaticamente quando uma imagem é uma receita médica controlada, enviando uma mensagem profissional informando que o documento precisa estar em mãos para o entregador.

## Escopo Funcional

### O que será implementado:
1. **Detecção automática de tipo de receita** - O GPT-4o Vision irá classificar a imagem como:
   - Receita de Tarja Preta (controlados - Portaria 344)
   - Receita de Tarja Vermelha (antibióticos, etc.)
   - Receita Simples
   - Não é uma receita (foto de medicamento/embalagem)

2. **Mensagem automática profissional** - Quando detectar receita controlada:
   > "📋 Identifiquei que você enviou uma receita de medicamento controlado. Por favor, tenha o documento original em mãos no momento da entrega, pois o entregador precisará recolhê-la."

3. **Aviso de validade** - Incluir lembrete sobre prazo de validade da receita quando aplicável

## Arquitetura da Solução

```text
┌─────────────────────┐
│   WhatsApp Image    │
│     (Cliente)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  whatsapp-media-    │
│     webhook         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  product-search-    │  ◄── Modificar prompt GPT-4o
│     agent           │      para detectar receitas
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ formatResponseMsg   │  ◄── Adicionar aviso de
│                     │      receita controlada
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Resposta ao       │
│     Cliente         │
└─────────────────────┘
```

## Tarefas de Implementação

### Tarefa 1: Atualizar o prompt do GPT-4o Vision
**Arquivo:** `supabase/functions/product-search-agent/index.ts`

Modificar o `systemPrompt` (linhas 701-725) para incluir instruções de classificação de receita:

**Adicionar ao prompt:**
```
CLASSIFICAÇÃO DE DOCUMENTO:
Identifique o tipo de documento na imagem:
- RECEITA_CONTROLADA: Se for receita com tarja preta (controlados especiais) ou que menciona medicamentos como: clonazepam, diazepam, alprazolam, zolpidem, rivotril, etc.
- RECEITA_RETIDA: Se for receita com tarja vermelha (antibióticos, etc.) que precisa ser retida
- RECEITA_SIMPLES: Se for receita médica comum
- PRODUTO: Se for foto de embalagem, caixa ou medicamento

FORMATO DE RESPOSTA:
[TIPO_DOCUMENTO: RECEITA_CONTROLADA|RECEITA_RETIDA|RECEITA_SIMPLES|PRODUTO]

1. [Nome do medicamento] [dosagem]
2. ...
```

### Tarefa 2: Processar classificação no resultado
**Arquivo:** `supabase/functions/product-search-agent/index.ts`

Após receber a resposta do GPT-4o (linha 772), extrair o tipo de documento:

```typescript
// Extrair tipo de documento
let documentType: 'RECEITA_CONTROLADA' | 'RECEITA_RETIDA' | 'RECEITA_SIMPLES' | 'PRODUTO' = 'PRODUTO';
const docTypeMatch = analysisContent.match(/\[TIPO_DOCUMENTO:\s*(RECEITA_CONTROLADA|RECEITA_RETIDA|RECEITA_SIMPLES|PRODUTO)\]/i);
if (docTypeMatch) {
  documentType = docTypeMatch[1].toUpperCase() as typeof documentType;
}
```

Incluir no objeto `result` (linha 1000+):
```typescript
result = {
  success: true,
  products: foundProducts,
  document_type: documentType,  // NOVO CAMPO
  is_controlled_prescription: documentType === 'RECEITA_CONTROLADA' || documentType === 'RECEITA_RETIDA',
  // ... demais campos
};
```

### Tarefa 3: Atualizar interface AnalysisResult
**Arquivo:** `supabase/functions/whatsapp-media-webhook/index.ts`

Adicionar novos campos na interface (linhas 100-120):
```typescript
interface AnalysisResult {
  success: boolean;
  // ... campos existentes
  document_type?: 'RECEITA_CONTROLADA' | 'RECEITA_RETIDA' | 'RECEITA_SIMPLES' | 'PRODUTO';
  is_controlled_prescription?: boolean;
}
```

### Tarefa 4: Atualizar formatResponseMessage
**Arquivo:** `supabase/functions/whatsapp-media-webhook/index.ts`

Modificar a função `formatResponseMessage` (linhas 291-397) para incluir aviso de receita:

```typescript
function formatResponseMessage(
  analysis: AnalysisResult,
  customerName: string,
  storeSlug?: string
): string {
  const greeting = customerName ? `Olá, ${customerName}! ` : '';
  
  // NOVO: Aviso de receita controlada
  let prescriptionWarning = '';
  if (analysis.is_controlled_prescription) {
    if (analysis.document_type === 'RECEITA_CONTROLADA') {
      prescriptionWarning = `\n\n📋 *ATENÇÃO - Receita Controlada*\nIdentifiquei que esta é uma receita de medicamento controlado (tarja preta). Por favor, tenha o documento *original* em mãos no momento da entrega, pois nosso entregador precisará *recolher a receita*.\n\n⏰ Lembre-se: receitas controladas têm validade de 30 dias.\n`;
    } else if (analysis.document_type === 'RECEITA_RETIDA') {
      prescriptionWarning = `\n\n📋 *ATENÇÃO - Receita Retida*\nIdentifiquei que esta receita precisa ficar retida na farmácia. Por favor, tenha o documento *original* em mãos no momento da entrega.\n`;
    }
  }
  
  // ... resto da função
  
  // Inserir aviso após a análise inicial
  if (prescriptionWarning) {
    message += prescriptionWarning;
  }
  
  return message;
}
```

## Exemplo de Fluxo Completo

**Cenário:** Cliente envia foto de receita com Clonazepam 2mg

**1. Resposta do GPT-4o:**
```
[TIPO_DOCUMENTO: RECEITA_CONTROLADA]

1. Clonazepam 2mg
```

**2. Mensagem enviada ao cliente:**
```
Olá, Maria! 🔍 Analisei a imagem que você enviou!

📋 *ATENÇÃO - Receita Controlada*
Identifiquei que esta é uma receita de medicamento controlado (tarja preta). 
Por favor, tenha o documento *original* em mãos no momento da entrega, 
pois nosso entregador precisará *recolher a receita*.

⏰ Lembre-se: receitas controladas têm validade de 30 dias.

✅ *Disponíveis em estoque:*

1. *Clonazepam 2mg EMS* - R$ 25,90
   👉 https://mostralo.com.br/loja/farmacia/produto/clonazepam-2mg

Clique no link acima para ver mais detalhes e finalizar sua compra! 🛒
```

## Detalhes Técnicos

### Lista de medicamentos controlados para detecção
O prompt incluirá exemplos comuns de controlados:
- **Tarja Preta (especiais):** Clonazepam, Diazepam, Alprazolam, Lorazepam, Zolpidem, Bromazepam, Rivotril, Lexotan, Frontal
- **Tarja Vermelha (retida):** Antibióticos (Amoxicilina, Azitromicina, Cefalexina), Retinoides

### Validação de segurança
- O sistema NÃO armazenará dados da receita médica (nome do paciente, CRM, etc.)
- Apenas o tipo de documento será processado
- Os medicamentos identificados são usados apenas para busca no catálogo

## Arquivos a serem modificados

| Arquivo | Modificação |
|---------|-------------|
| `supabase/functions/product-search-agent/index.ts` | Atualizar prompt, extrair tipo de documento, incluir no resultado |
| `supabase/functions/whatsapp-media-webhook/index.ts` | Atualizar interface, modificar formatResponseMessage |

## Testes sugeridos

1. Enviar foto de receita com medicamento controlado (ex: Clonazepam)
2. Enviar foto de receita com antibiótico (ex: Amoxicilina)
3. Enviar foto de embalagem de medicamento comum
4. Verificar se o aviso aparece corretamente em cada cenário

## Benefícios

- **Profissionalização do atendimento** - Cliente sabe imediatamente o que precisa fazer
- **Redução de problemas na entrega** - Entregador não perde viagem
- **Conformidade legal** - Lembra o cliente das exigências regulatórias
- **Experiência do cliente** - Informação clara e objetiva
