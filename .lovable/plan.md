
# Taxa de Entrega por Horario (Noturna/Madrugada)

## Problema
A farmacia precisa cobrar taxas de entrega diferentes dependendo do horario do pedido (ex: madrugada = taxa mais alta). Atualmente cada zona tem apenas uma taxa fixa.

## Solucao Proposta
Adicionar um sistema de **taxas por faixa de horario** em cada zona de entrega, mantendo a taxa principal como padrao e permitindo adicionar sobretaxas ou taxas alternativas para horarios especificos.

## Como vai funcionar

### Para o dono da loja (Admin)
Na tela de configuracao de zonas de entrega, ao criar/editar uma zona, alem da "Taxa de Entrega (R$)" atual, aparecera um botao **"Adicionar taxa por horario"** que permite configurar:

```text
+------------------------------------------+
| Taxa de Entrega (R$)                      |
| [  7.00  ]  (taxa padrao)                 |
|                                           |
| [v] Habilitar taxa por horario            |
|                                           |
| Faixa 1:                                  |
|  Horario: [22:00] ate [06:00]             |
|  Taxa (R$): [15.00]                       |
|  [Remover]                                |
|                                           |
| [+ Adicionar faixa de horario]            |
+------------------------------------------+
```

### Para o cliente (Checkout)
- O sistema verifica automaticamente o horario atual do pedido
- Aplica a taxa correspondente a faixa horaria ativa
- Exibe uma mensagem informativa: "Taxa noturna aplicada (22h-06h): R$ 15,00"

### Na lista de zonas criadas
Cada zona mostrara a taxa padrao e, se houver, um indicador de que tem taxas por horario configuradas.

## Detalhes Tecnicos

### 1. Atualizar interface DeliveryZone
Adicionar campo `timeFees` (opcional) em ambos os arquivos:
- `src/components/admin/store-config/DeliveryZonesPicker.tsx`
- `src/utils/deliveryZoneValidation.ts`

```typescript
interface TimeFee {
  id: string;
  startTime: string; // "22:00"
  endTime: string;   // "06:00"
  fee: number;
  label?: string;    // "Taxa noturna"
}

interface DeliveryZone {
  // ... campos existentes mantidos
  deliveryFee: number; // taxa padrao (mantida)
  timeFees?: TimeFee[]; // NOVO - taxas por horario
}
```

### 2. Atualizar DeliveryZonesPicker.tsx (Admin)
- Adicionar formulario de faixas de horario dentro do formulario de criacao/edicao de zona
- Checkbox "Habilitar taxa por horario" que expande os campos
- Campos: horario inicio, horario fim, taxa, label opcional
- Botao para adicionar/remover faixas
- Salvar `timeFees` junto com os dados da zona no JSON existente (sem alterar banco de dados)

### 3. Atualizar deliveryZoneValidation.ts (Logica de calculo)
- Modificar `calculateDeliveryFee` e `validateDeliveryLocation` para verificar o horario atual
- Se existir uma `timeFee` ativa para o horario, usar essa taxa em vez da taxa padrao
- Logica para horarios que cruzam meia-noite (ex: 22:00 ate 06:00)

### 4. Atualizar Checkout (exibicao ao cliente)
- Em `src/components/checkout/steps/DeliveryStep.tsx` e `src/components/checkout/CustomerLocationPicker.tsx`
- Exibir mensagem quando taxa por horario esta ativa
- Mostrar qual faixa horaria esta sendo aplicada

### Arquivos a modificar
1. `src/utils/deliveryZoneValidation.ts` - tipos e logica de calculo
2. `src/components/admin/store-config/DeliveryZonesPicker.tsx` - UI admin para configurar
3. `src/components/checkout/steps/DeliveryStep.tsx` - exibir info no checkout
4. `src/components/checkout/CustomerLocationPicker.tsx` - aplicar taxa correta

### O que NAO muda
- Estrutura do banco de dados (tudo fica no JSON `delivery_zones` ja existente)
- Zonas existentes continuam funcionando normalmente (campo `timeFees` e opcional)
- Nenhuma funcionalidade existente e quebrada
- Layout e cores das zonas no mapa permanecem iguais
