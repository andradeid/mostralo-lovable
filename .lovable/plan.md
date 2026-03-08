

# Melhorias no Modal de Zonas de Entrega

## 1. Tooltip explicativo na taxa por horario

Adicionar um `InfoTooltip` (componente que ja existe no projeto) ao lado do titulo/label da secao de taxa por horario, explicando claramente:

> "A taxa por horario e o valor FINAL da entrega nesse periodo, e nao um valor adicional. Exemplo: se a taxa padrao e R$ 7,00 e a taxa noturna e R$ 15,00, o cliente pagara R$ 15,00 (e nao R$ 22,00)."

Tambem adicionar um tooltip na taxa padrao:

> "Taxa cobrada quando nenhuma faixa de horario especifica esta ativa."

**Arquivo:** `src/components/admin/store-config/DeliveryZonesPicker.tsx`

## 2. Modal em tela cheia

Alterar o `DialogContent` de `max-w-6xl h-[90vh]` para ocupar 100% da tela, facilitando a edicao das areas no mapa.

**Mudanca:** No `DialogContent`, trocar a classe para algo como `max-w-full w-full h-full max-h-full sm:rounded-none` para que o modal ocupe toda a tela.

**Arquivo:** `src/components/admin/store-config/DeliveryZonesPicker.tsx`

## Resumo das alteracoes

Apenas um arquivo sera modificado: `DeliveryZonesPicker.tsx`

1. Importar `InfoTooltip` de `@/components/ui/info-tooltip`
2. Adicionar tooltip ao lado do label "Taxa de Entrega (R$)"
3. Adicionar tooltip ao lado do checkbox "Habilitar taxa por horario" e nos campos de taxa por faixa
4. Alterar classes do `DialogContent` para tela cheia

Nenhuma funcionalidade existente sera quebrada - apenas adicoes visuais e ajuste de tamanho do modal.
