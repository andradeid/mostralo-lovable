# 🔍 Debug: Timeline de Status do Pedido

## Problema Reportado
- Cliente não vê status marcado na timeline
- Status não atualiza em tempo real
- Aviso sobre cookie "__cf_bm"

## Logs Adicionados

### No Console do Cliente:
1. `📊 OrderStatusTimeline:` - Mostra status atual, tipo de entrega, datas
2. `🔍 Status mapping:` - Mostra mapeamento de status e índice atual
3. `🎯 Step X (Label):` - Mostra status de cada passo da timeline
4. `🔄 Order update received:` - Quando recebe atualização em tempo real

## Como Verificar

### 1. Abra o Console (F12)
### 2. Procure pelos logs:
- `📊 OrderStatusTimeline:` - Deve mostrar o status atual do pedido
- `🔍 Status mapping:` - Deve mostrar se o status foi encontrado na lista
- `🎯 Step X:` - Deve mostrar o status de cada passo

### 3. Verifique:
- Se `currentStatus` está correto
- Se `currentIndex` não é -1
- Se `stepStatus` está como 'completed' para passos anteriores

## Possíveis Problemas

### Problema 1: Status não encontrado (currentIndex = -1)
**Sintoma:** `⚠️ Status não encontrado na lista`
**Causa:** Status do pedido não está na lista de status válidos
**Solução:** Verificar se o status do pedido no banco está correto

### Problema 2: Realtime não funciona
**Sintoma:** Status não atualiza quando lojista muda
**Causa:** Subscription do Supabase não está funcionando
**Solução:** Verificar conexão com Supabase, verificar se há erros no console

### Problema 3: Cookie "__cf_bm" rejeitado
**Sintoma:** Aviso no console sobre cookie
**Causa:** Cookie do Cloudflare com domínio inválido
**Solução:** Não afeta funcionalidade, mas pode indicar problema de CORS ou domínio

## Teste Manual

1. **Abra o pedido no cliente**
2. **No console, verifique os logs:**
   ```javascript
   // Ver status atual
   console.log('Status:', order.status);
   console.log('Delivery Type:', order.delivery_type);
   ```

3. **Mude o status no dashboard do lojista**
4. **No console do cliente, procure por:**
   - `🔄 Order update received`
   - `📢 Status changed, showing notification`

## Envie os Logs

Copie e cole todos os logs do console que começam com:
- `📊 OrderStatusTimeline:`
- `🔍 Status mapping:`
- `🎯 Step`
- `🔄 Order update`

Isso ajudará a identificar exatamente onde está o problema.

