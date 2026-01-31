
# Plano: Corrigir Status dos Bots para Refletir o Assistente Unificado

## Problema

Após a unificação dos 3 bots em 1 assistente dinâmico:
- A Edge Function salva o ID do bot unificado **apenas** em `sales_bot_evolution_id`
- Seta `recruitment_bot_evolution_id` e `support_bot_evolution_id` como `null`
- A interface verifica cada coluna separadamente, resultando em:
  - Vendas: "Conectado" (tem o ID)
  - Recrutamento: "Não criado" (está null)
  - Suporte: "Não criado" (está null)

## Solução

Ajustar a interface para usar o **mesmo ID** (o do bot unificado) para todas as abas, já que na realidade é um único assistente que atende os 3 contextos.

---

## Alterações

### 1. Hook useMasterWhatsAppConfig

Adicionar `unified_openai_assistant_id` à interface `MasterWhatsAppConfig`:

```typescript
export interface MasterWhatsAppConfig {
  // ... campos existentes ...
  unified_openai_assistant_id: string | null; // NOVO
}
```

### 2. Componente MasterBotConfigTab

Modificar as 3 chamadas do `BotSyncStatusBadge` para usar o mesmo ID:

**Bot de Vendas (linha 513-518):**
```typescript
<BotSyncStatusBadge
  evolutionId={config.unified_openai_assistant_id || config.sales_bot_evolution_id}
  botEnabled={config.sales_bot_enabled}
  hasUnsyncedChanges={hasUnsyncedChanges('sales')}
  syncing={syncing}
/>
```

**Bot de Recrutamento (linha 611-616):**
```typescript
<BotSyncStatusBadge
  evolutionId={config.unified_openai_assistant_id || config.sales_bot_evolution_id}
  botEnabled={config.recruitment_bot_enabled}
  hasUnsyncedChanges={hasUnsyncedChanges('recruitment')}
  syncing={syncing}
/>
```

**Bot de Suporte (linha 705-710):**
```typescript
<BotSyncStatusBadge
  evolutionId={config.unified_openai_assistant_id || config.sales_bot_evolution_id}
  botEnabled={config.support_bot_enabled}
  hasUnsyncedChanges={hasUnsyncedChanges('support')}
  syncing={syncing}
/>
```

### 3. Atualizar BotSyncStatusBadge (opcional)

Melhorar o tooltip para refletir que é um bot unificado:

```typescript
synced: {
  label: 'Conectado',
  tooltip: 'Integrado ao assistente unificado Mostralo'
}
```

---

## Resultado Esperado

| Aba | Antes | Depois |
|-----|-------|--------|
| Vendas | Conectado ✓ | Conectado ✓ |
| Recrutamento | Não criado ✗ | Conectado ✓ |
| Suporte | Não criado ✗ | Conectado ✓ |

Todos os badges mostrarão "Conectado" quando o assistente unificado existir, refletindo corretamente que é um único bot atendendo os 3 contextos.
