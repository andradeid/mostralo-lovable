# 🔧 Correções: Status do Pedido em Tempo Real

## Problemas Identificados

1. **Status "Aguarda Retirada" não aparece para o cliente**
2. **Atualização não é em tempo real** (precisa recarregar página)
3. **Timeline não marca status corretamente**

## Correções Aplicadas

### 1. **Subscription Realtime Melhorada** (`useOrderTracking.ts`)
- ✅ Nome único para cada channel (evita conflitos)
- ✅ Logs detalhados do status da subscription
- ✅ Fallback de polling a cada 10 segundos como backup
- ✅ Atualização imediata do estado quando recebe update

### 2. **Timeline Corrigida** (`OrderStatusTimeline.tsx`)
- ✅ Verificação direta do status (não só pelo índice)
- ✅ Tratamento especial para "aguarda_retirada" em pickup
- ✅ Logs detalhados para debug
- ✅ Garantia de que currentIndex está dentro dos limites

### 3. **Mapeamento de Status Robusto**
- ✅ Fallback quando status não é encontrado
- ✅ Tratamento especial para "aguarda_retirada"
- ✅ Validação de limites do array

## Como Funciona Agora

### Realtime (Prioritário):
1. Subscription do Supabase escuta mudanças na tabela `orders`
2. Quando status muda, atualiza imediatamente
3. Mostra notificação para o cliente

### Polling (Backup):
1. A cada 10 segundos, verifica se há mudanças
2. Só ativa se subscription não estiver funcionando
3. Atualiza apenas o status (não recarrega tudo)

## Como Testar

### 1. Abra o pedido no cliente
### 2. No console, procure por:
- `📡 Subscription status: SUBSCRIBED` - Deve aparecer
- `✅ Realtime subscription ativa` - Confirma que está funcionando

### 3. Mude o status no dashboard do lojista
### 4. No console do cliente, deve aparecer:
- `🔄 Order update received` - Update recebido
- `✅ Order state updated` - Estado atualizado
- `📢 Status changed` - Notificação mostrada

### 5. Se não aparecer em tempo real:
- Verifique se aparece `🔄 Polling backup` a cada 10 segundos
- Isso indica que o polling está funcionando como backup

## Troubleshooting

### Problema: Subscription não conecta
**Sintoma:** `📡 Subscription status: CHANNEL_ERROR` ou `TIMED_OUT`
**Solução:** O polling backup deve funcionar automaticamente

### Problema: Status não aparece na timeline
**Sintoma:** Timeline mostra todos como pendentes
**Solução:** Verifique os logs `🔍 Status mapping` e `✅ Final currentIndex`

### Problema: "Aguarda Retirada" não aparece
**Sintoma:** Status muda mas timeline não atualiza
**Solução:** Verifique se `delivery_type` está correto (deve ser 'pickup')

## Logs Importantes

No console do cliente, procure por:
- `📊 OrderStatusTimeline:` - Status inicial
- `🔍 Status mapping:` - Mapeamento de status
- `✅ Final currentIndex:` - Índice final calculado
- `🎯 Step X:` - Status de cada passo
- `🔄 Order update received:` - Update em tempo real
- `📡 Subscription status:` - Status da conexão

---

**Última atualização**: Correções aplicadas com realtime melhorado e polling backup.

