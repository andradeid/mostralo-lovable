# Plano: Aplicar Niveis de Abordagem ao Prompt Unificado

## ✅ IMPLEMENTADO

As configurações de nível de abordagem agora são aplicadas dinamicamente ao prompt do assistente.

### Mapeamento Implementado

#### Vendas
| Valor DB | Interface | Estilo |
|----------|-----------|--------|
| basic | Consultivo | Educativo, sem pressão |
| intermediate | Persuasivo | Destaca benefícios |
| aggressive | Urgência | FOMO, escassez |

#### Recrutamento
| Valor DB | Interface | Estilo |
|----------|-----------|--------|
| cold_lead | Lead Frio | Suave, informativo |
| moderate | Moderado | Equilibrado |
| aggressive | Agressivo | Enfatiza ganhos |
| super_aggressive | Super Agressivo | FOMO máximo |

### Próximos Passos
1. ✅ Funções `getSalesApproachInstructions` e `getRecruitmentApproachInstructions` adicionadas
2. ✅ `buildUnifiedPrompt` modificado para usar config
3. ✅ Edge Function deployada
4. 🔄 **Sincronizar bot** no painel para aplicar as mudanças
