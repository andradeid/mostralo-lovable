

## Plano: Fazer valer a regra de Pedidos Agendados no Checkout

### Problema atual
A configuração de "Pedidos Agendados" existe no painel admin (`delivery_config.scheduled_orders`), mas **não é aplicada** no checkout:
- `scheduledOrdersEnabled` está **fixo como `true`** no `Checkout.tsx` (linha 573)
- A opção `hide_asap` (ocultar "Para agora") existe na config mas **nunca é lida** no checkout
- Resultado: o cliente sempre vê o agendamento disponível, independente da configuração

### Recomendação sobre abordagem
A melhor opção é **manter a regra na loja** (como já está configurado) em vez de por produto, pelos motivos:
- Simplicidade: a loja decide se aceita pedidos imediatos, agendados ou ambos
- Já existe a infraestrutura (`hide_asap`, `enabled`, horários mín/máx) — só falta conectar ao checkout
- Não quebra nada existente

Se no futuro precisar de agendamento por produto (ex: bolo sob encomenda vs brigadeiro pronta-entrega), podemos adicionar uma flag `is_scheduled_only` no produto, mas isso é uma evolução futura.

### O que será feito

**1. Checkout.tsx — Ler config real da loja**
- Buscar `delivery_config.scheduled_orders` do banco ao carregar o checkout
- Passar `scheduledOrdersEnabled` com o valor real (não fixo `true`)
- Ler `hide_asap` e, se ativo, forçar `isScheduled = true` automaticamente (sem opção "Para agora")

**2. DeliveryStep.tsx — Respeitar `hide_asap`**
- Receber nova prop `hideAsap`
- Quando `hideAsap = true`: não mostrar opção "Para agora", iniciar com agendamento ativo
- Quando `hideAsap = false` e agendamento habilitado: mostrar toggle entre "Para agora" e "Agendar"

**3. CheckoutDialog.tsx — Mesma lógica**
- Aplicar a mesma correção para o modal de checkout (se usado em paralelo)
- Ler `hide_asap` do `scheduledConfig` já carregado

### Arquivos afetados
- `src/pages/Checkout.tsx`
- `src/components/checkout/steps/DeliveryStep.tsx`
- `src/components/checkout/CheckoutDialog.tsx`

### Segurança
- Nenhuma alteração no banco de dados
- Nenhuma funcionalidade existente é removida — apenas conectamos configs que já existem
- Se `scheduled_orders.enabled = false`, comportamento continua igual (sem agendamento)

