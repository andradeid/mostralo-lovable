
# Plano: Aplicar Niveis de Abordagem ao Prompt Unificado

## Problema Atual

Os campos de configuracao existem no banco:
- `sales_bot_approach`: basic, intermediate, aggressive
- `recruitment_bot_approach`: cold_lead, moderate, aggressive, super_aggressive
- `support_bot_custom_prompt`: prompt customizado

Porem a funcao `buildUnifiedPrompt` ignora completamente esses valores, usando um estilo generico fixo.

---

## Solucao

Modificar `buildUnifiedPrompt` para receber o config completo e gerar instrucoes especificas baseadas nos niveis de abordagem selecionados.

---

## Mapeamento de Abordagens

### Vendas

| Valor DB | Nome Interface | Estilo |
|----------|----------------|--------|
| basic | Consultivo | Educativo, sem pressao, foco em informar |
| intermediate | Persuasivo | Destaca beneficios, cria desejo, usa gatilhos |
| aggressive | Urgencia | Escassez, FOMO, pressao para decisao rapida |

### Recrutamento

| Valor DB | Nome Interface | Estilo |
|----------|----------------|--------|
| cold_lead | Lead Frio | Suave, informativo, sem pressao |
| moderate | Moderado | Equilibrado, destaca beneficios |
| aggressive | Agressivo | Enfatiza ganhos, cria urgencia |
| super_aggressive | Super Agressivo | Maximo FOMO, pressao total |

---

## Alteracoes no Codigo

### Arquivo: supabase/functions/master-bot-sync/index.ts

**1. Modificar assinatura da funcao (linha 179):**
```typescript
// ANTES
function buildUnifiedPrompt(config: any, plans: Plan[], bonusTiers: BonusTier[]): string {

// DEPOIS - recebe config completo
function buildUnifiedPrompt(config: any, plans: Plan[], bonusTiers: BonusTier[]): string {
  const salesApproach = config.sales_bot_approach || 'intermediate';
  const recruitmentApproach = config.recruitment_bot_approach || 'moderate';
  const supportCustomPrompt = config.support_bot_custom_prompt || '';
```

**2. Adicionar funcao geradora de estilo de vendas:**
```typescript
function getSalesApproachInstructions(approach: string): string {
  switch (approach) {
    case 'basic':
      return `### ESTILO: CONSULTIVO
- Seja educativo e informativo, SEM pressionar
- Foque em explicar beneficios de forma clara
- Deixe o cliente tomar a decisao no tempo dele
- Use frases como: "Fico a disposicao para mais informacoes"
- NAO use urgencia ou escassez artificial`;

    case 'aggressive':
      return `### ESTILO: URGENCIA
- Crie senso de urgencia REAL (vagas limitadas, promocoes)
- Use gatilhos de escassez: "Ultimas vagas", "Promocao termina hoje"
- Pergunte "O que te impede de comecar agora?"
- Oferte bonus exclusivos para decisao rapida
- Use FOMO: "Enquanto voce pensa, concorrentes estao agindo"`;

    default: // intermediate
      return `### ESTILO: PERSUASIVO
- Destaque beneficios e diferenciais com entusiasmo
- Use comparacoes favoraveis (vs iFood)
- Conte historias de sucesso de outros clientes
- Faca perguntas que levem a reflexao
- Sugira proximos passos sem pressionar demais`;
  }
}
```

**3. Adicionar funcao geradora de estilo de recrutamento:**
```typescript
function getRecruitmentApproachInstructions(approach: string): string {
  switch (approach) {
    case 'cold_lead':
      return `### ESTILO: LEAD FRIO
- Abordagem suave e informativa
- Foque em educar sobre a oportunidade
- NAO pressione por cadastro imediato
- Responda duvidas com paciencia
- Use: "Quando se sentir pronto, estou aqui"`;

    case 'aggressive':
      return `### ESTILO: AGRESSIVO
- Enfatize ganhos financeiros com exemplos
- Crie urgencia: "Cada dia sem vender e dinheiro perdido"
- Pergunte: "Por que esperar para comecar a ganhar?"
- Use projecoes de ganhos mensais/anuais`;

    case 'super_aggressive':
      return `### ESTILO: SUPER AGRESSIVO
- MAXIMO senso de urgencia e FOMO
- "Vagas de parceiro podem fechar a qualquer momento"
- Calcule quanto a pessoa PERDE por NAO comecar HOJE
- "Enquanto voce pensa, outros ja estao ganhando"
- Pressione por cadastro IMEDIATO`;

    default: // moderate
      return `### ESTILO: MODERADO
- Equilibrio entre informacao e motivacao
- Destaque beneficios da comissao recorrente
- Use exemplos de ganhos reais
- Encoraje sem pressionar demais
- Sugira: "Que tal dar o primeiro passo hoje?"`;
  }
}
```

**4. Integrar no prompt unificado:**

Substituir a linha 340 (estilo generico) por:

```typescript
## ESTILOS DE ABORDAGEM CONFIGURADOS

${getSalesApproachInstructions(salesApproach)}

---

${getRecruitmentApproachInstructions(recruitmentApproach)}

---

### SUPORTE
- Seja sempre paciente e empático
- Resolva problemas de forma clara e objetiva
${supportCustomPrompt ? `\n### INSTRUCOES CUSTOMIZADAS DE SUPORTE:\n${supportCustomPrompt}` : ''}
```

---

## Resultado Esperado

| Configuracao | Antes | Depois |
|--------------|-------|--------|
| Vendas: Consultivo | Ignorado | Prompt educativo, sem pressao |
| Vendas: Urgencia | Ignorado | Prompt com escassez e FOMO |
| Recrutamento: Lead Frio | Ignorado | Prompt suave |
| Recrutamento: Super Agressivo | Ignorado | Prompt com pressao maxima |
| Suporte: Custom Prompt | Ignorado | Instrucoes customizadas aplicadas |

---

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| supabase/functions/master-bot-sync/index.ts | Adicionar funcoes de estilo e integrar ao prompt |

---

## Ordem de Implementacao

1. Adicionar funcoes `getSalesApproachInstructions` e `getRecruitmentApproachInstructions`
2. Modificar `buildUnifiedPrompt` para extrair valores do config
3. Integrar estilos dinamicos no prompt final
4. Deploy da Edge Function
5. Sincronizar bot para aplicar mudancas
