

## Plano: Seletor de Data/Hora para Encomendas (em vez de minutos)

### Problema Atual
Quando o lojista aceita ou edita o tempo estimado de uma **encomenda** (pedido agendado), o sistema mostra o mesmo seletor de minutos (15min, 30min, 45min...) usado para pedidos normais. Isso não faz sentido para encomendas que serão entregues dias depois -- o lojista precisa escolher **a data e horário de entrega**, não contar minutos.

### Solução
Modificar o componente `DeliveryTimeSelector` para detectar quando o pedido é uma encomenda (`scheduled_for` presente) e exibir um modo alternativo com **seletor de data + horário** em vez de botões de minutos.

### Mudanças

**1. Atualizar `DeliveryTimeSelector.tsx`**
- Adicionar prop `scheduledFor?: string | null` para indicar que é encomenda
- Quando `scheduledFor` existir, exibir:
  - Título: "Data de Entrega da Encomenda" (em vez de "Tempo Estimado")
  - Calendário (componente `Calendar` do shadcn) para selecionar a data
  - Seletor de horário (input time ou grid de horários)
  - Preview mostrando a data/hora selecionada formatada
- O `onConfirm` continuará retornando minutos (diferença entre agora e a data escolhida) para manter compatibilidade com o sistema existente
- Data inicial pré-preenchida com o `scheduled_for` do pedido

**2. Atualizar `OrderDetailDialog.tsx`**
- Passar `scheduledFor={order.scheduled_for}` para ambas as instâncias do `DeliveryTimeSelector` (aceitar pedido e editar tempo)

**3. Atualizar `GlobalNewOrderAlert.tsx`**
- Passar `scheduledFor={currentOrder?.scheduled_for}` para o `DeliveryTimeSelector` no alerta de novo pedido

### Detalhes Técnicos
- O calendário usará `pointer-events-auto` conforme padrão do projeto
- Data mínima: hoje; data máxima: 30 dias
- Horários em intervalos de 30 minutos (grade de botões)
- O cálculo `differenceInMinutes(dataSelecionada, agora)` converte para o formato existente do banco (`estimated_delivery_minutes`)
- Pedidos normais (sem `scheduled_for`) continuam com o seletor de minutos atual, sem alteração

