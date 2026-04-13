

## Plano: Melhorar UX de Agendamento Obrigatório no Checkout

### Problema atual
Quando a loja está configurada como "Somente Agendado" (`hide_asap: true`):
- O checkout mostra um card radio com apenas UMA opção ("Agendar para depois") — redundante e confuso
- O seletor de data fica escondido dentro de um Popover, exigindo clique extra
- Não há destaque visual informando que aquela loja exige agendamento
- O cliente não entende imediatamente que precisa escolher data e horário

### O que será feito

**1. DeliveryStep.tsx — Melhorar a seção de agendamento quando `hideAsap = true`**

Quando for "Somente Agendado":
- Remover o radio button solitário (não faz sentido mostrar 1 opção)
- Mostrar um banner informativo: "📅 Esta loja trabalha com pedidos agendados. Escolha a data e horário para receber seu pedido."
- Exibir o calendário diretamente inline (sem precisar clicar em botão/popover)
- Manter os slots de horário logo abaixo do calendário

Quando for "Normal + Agendado" (`hideAsap = false`):
- Manter o comportamento atual (toggle entre ASAP e Agendar)
- Sem alteração

**2. Validação no Checkout.tsx**
- Garantir que quando `hideAsap = true`, o botão "Próximo" só habilita se data E horário foram selecionados
- Mensagem clara se faltar selecionar

### Arquivos afetados
- `src/components/checkout/steps/DeliveryStep.tsx` — layout condicional para agendamento obrigatório
- `src/pages/Checkout.tsx` — validação do step (se necessário)

### Segurança
- Nenhuma funcionalidade é removida
- O modo "Normal + Agendado" continua exatamente igual
- Apenas melhora a experiência quando o agendamento é obrigatório

