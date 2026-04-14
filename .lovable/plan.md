
## Plano: Sistema de Cupons com Duração Recorrente

### Problema Atual
O sistema de cupons só aplica desconto **uma vez** (no cadastro ou numa renovação manual). Não existe conceito de "aplicar desconto nos primeiros 3 meses" ou "desconto permanente". O campo `max_uses_per_user` controla quantas vezes o usuário pode **usar o cupom manualmente**, mas não há aplicação automática nas renovações seguintes.

### Como funciona hoje
1. Usuário aplica cupom no signup → desconto na 1ª fatura
2. Na renovação, o lojista precisa aplicar o cupom manualmente de novo
3. Se `max_uses_per_user = 1`, não consegue aplicar novamente

### Solução Proposta
Adicionar um campo `duration_months` na tabela `coupons` que define por quantos ciclos de cobrança o desconto se aplica automaticamente:

| Cenário | Configuração |
|---|---|
| Desconto só na 1ª mensalidade | `duration_months = 1`, `max_uses_per_user = 1` |
| Desconto nos 3 primeiros meses | `duration_months = 3`, `max_uses_per_user = 3` |
| Desconto permanente (todos os meses) | `duration_months = NULL` (sem limite), `max_uses_per_user = 0` (ilimitado) |
| 30 dias grátis (trial) | `discount_value = 100`, `duration_months = 1`, `max_uses_per_user = 1` |

### Mudanças

**1. Migração SQL**
- Adicionar coluna `duration_months INTEGER DEFAULT NULL` na tabela `coupons` (NULL = permanente)
- Adicionar coluna `duration_type VARCHAR DEFAULT 'once'` com valores: `once` (única vez), `multiple` (X meses), `forever` (permanente)

**2. Formulário de Cupons (`AdminCouponsPage.tsx`)**
- Adicionar seção "Duração do Desconto" com 3 opções visuais:
  - "Apenas 1ª mensalidade" (once)
  - "Primeiros X meses" (multiple) → campo numérico para quantidade
  - "Todas as mensalidades" (forever)
- Auto-ajustar `max_uses_per_user` baseado na seleção
- Adicionar tooltips/instruções em TODOS os campos do formulário para guiar o admin:
  - **Código**: "Código que o cliente digita. Ex: PROMO30, BEMVINDO"
  - **Nome**: "Nome interno para identificação. Ex: Promoção Black Friday"
  - **Tipo de Desconto**: "Porcentagem (%) ou valor fixo (R$)"
  - **Limite Total**: "Quantas vezes o cupom pode ser usado no total. Vazio = ilimitado"
  - **Por Usuário**: "Quantas vezes cada cliente pode usar. Ajustado automaticamente pela duração"
  - **Duração**: "Por quantos meses o desconto será aplicado nas renovações"

**3. Lógica de Validação (`useCouponValidation.ts`)**
- Ao validar, verificar `duration_type` e `duration_months`
- Para `multiple`: contar usos do usuário vs `duration_months`
- Para `forever`: não limitar usos por usuário

**4. Webhook/Renovação**
- Na geração de fatura de renovação, verificar se a loja tem cupom ativo com `duration_type != 'once'`
- Se tiver ciclos restantes, aplicar desconto automaticamente na nova fatura

**5. Página de Assinatura (`SubscriptionPage.tsx`)**
- Mostrar info do cupom ativo: "Desconto de X% aplicado (2 de 3 meses restantes)"

### Exemplos Práticos (como criar cada cenário)

```text
Desconto 1ª mensalidade:
  Código: BEMVINDO
  Desconto: 50% 
  Duração: "Apenas 1ª mensalidade"

Primeiros 3 meses com desconto:
  Código: PROMO3M  
  Desconto: 30%
  Duração: "Primeiros 3 meses"

Desconto permanente (parceiro):
  Código: PARCEIRO
  Desconto: 20%
  Duração: "Todas as mensalidades"

Trial 30 dias grátis:
  Código: 30DIAS
  Desconto: 100%
  Duração: "Apenas 1ª mensalidade"
```

### Detalhes Técnicos
- A coluna `duration_months` é nullable (NULL = permanente quando `duration_type = 'forever'`)
- O `max_uses_per_user` será sincronizado automaticamente com `duration_months` no formulário
- A verificação de ciclos restantes usa a contagem de registros em `coupon_usages` para aquele `user_id + coupon_id`
- Nenhuma funcionalidade existente é alterada -- cupons atuais continuam funcionando como `duration_type = 'once'`
