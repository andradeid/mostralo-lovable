
# Plano: Adaptar AI Vision v2 para Múltiplos Nichos

## ✅ IMPLEMENTADO

### Mudanças Realizadas

#### 1. Função `buildVisionPrompt(segment, imageContext)`
Criada função que retorna prompts especializados por segmento:
- `saude-e-bem-estar` → Medicamentos + classificação de receitas (controlada/retida/simples)
- `alimentacao-e-bebidas` → Pratos, bebidas, ingredientes, cardápios
- `suplementos` → Suplementos, vitaminas, proteínas, pré-treinos
- `pet-shop` → Rações, petiscos, acessórios para pets
- `moda-e-vestuario` → Roupas, calçados, acessórios
- `generico` → Identificação genérica (fallback)

#### 2. Mapeamento de Segmentos Alternativos
```typescript
const segmentMapping = {
  'farmacia': 'saude-e-bem-estar',
  'drogaria': 'saude-e-bem-estar',
  'restaurante': 'alimentacao-e-bebidas',
  'lanchonete': 'alimentacao-e-bebidas',
  'pizzaria': 'alimentacao-e-bebidas',
  'pet': 'pet-shop',
  'animais': 'pet-shop',
  'fitness': 'suplementos',
  'academia': 'suplementos',
  'moda': 'moda-e-vestuario',
  'roupas': 'moda-e-vestuario',
  // ...
};
```

#### 3. Lógica Condicional de Receitas Controladas
Aviso de receita controlada só aparece para segmentos de saúde:
```typescript
const isControlledPrescription = isHealthSegment(storeSegment) && 
  (documentType === 'RECEITA_CONTROLADA' || documentType === 'RECEITA_RETIDA');
```

### Arquivo Modificado
- `supabase/functions/product-search-agent/index.ts`

---

## Resultado Esperado

### Farmácia (saude-e-bem-estar)
Cliente envia receita médica:
```
⚠️ Receita controlada detectada

📦 *Clonazepam 2mg*
💰 R$ 12,90
👉 link
```

### Loja de Suplementos
Cliente envia foto de Whey Protein:
```
📦 *Whey Protein Gold Standard*
💰 R$ 289,90
👉 link
```

### Pet Shop
Cliente envia foto de ração:
```
📦 *Ração Premium Cães Adultos 15kg*
💰 R$ 189,90
👉 link
```

### Restaurante
Cliente envia foto de prato:
```
📦 *Pizza Margherita Grande*
💰 R$ 45,90
👉 link
```

---

## Risco
**Baixo** - Farmácias continuam funcionando exatamente como antes. Outros nichos ganham prompts especializados.
