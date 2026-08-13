# Reagendamento pelo cliente (link mágico)

## Situação atual (verificada no código)

Na página `meu-agendamento/{token}` (`src/pages/public/MyBookingPage.tsx`) o cliente só tem **Cancelar Agendamento**. O botão "Agendar Novamente" aparece apenas **depois** que o agendamento já foi cancelado ou já passou. Ou seja, hoje reagendar = cancelar + voltar na loja e marcar de novo, exatamente como você descreveu.

Toda a inteligência de horários disponíveis (agenda do profissional, bloqueios, intervalos, antecedência mínima/máxima) vive dentro da página pública de agendamento (`src/pages/public/BookingPage.tsx`). Duplicar essa lógica dentro do link mágico seria arriscado e sujeito a divergência, então o plano **reaproveita a página existente**.

## Como vai funcionar (experiência do cliente)

1. No link do agendamento aparece um botão novo **"Reagendar"** (destaque primário), acima do "Cancelar Agendamento".
2. Ao clicar, abre uma confirmação curta explicando: "Vamos escolher um novo horário. O horário atual só será liberado depois que o novo for confirmado."
3. O cliente é levado para a página de agendamento da loja **já com o profissional e o serviço pré-selecionados**, direto no passo de escolher data/hora, com uma faixa no topo: "Reagendando seu horário de {data} às {hora}".
4. Ele escolhe a nova data/hora e confirma.
5. Só nesse momento o agendamento antigo é cancelado automaticamente (motivo: "Reagendado pelo cliente") e o novo fica confirmado.
6. O cliente recebe **uma única mensagem** no WhatsApp: a confirmação do novo horário (a mensagem de "agendamento cancelado" é suprimida nesse fluxo, para não confundir).
7. Se ele desistir no meio do caminho, nada é cancelado — o agendamento original continua intacto.

## Regras de segurança

- Reagendar respeita o mesmo limite de horas do cancelamento (`cancellation_hours_limit`). Dentro do prazo apertado, o botão não aparece e a mensagem atual de "cancelamento permitido até Xh antes" continua igual.
- Não aparece para agendamentos `cancelled`, `completed`, `no_show` ou já passados (mantém o "Agendar Novamente" que já existe nesses casos).
- Se o cancelamento do antigo falhar por algum motivo, o novo agendamento permanece válido e o caso é registrado em log para a loja resolver — nunca se perde um horário confirmado.

## Detalhes técnicos

**1. `supabase/functions/booking-magic-link/index.ts`**
- Nova action `cancel_for_reschedule`: valida o token, cancela o agendamento com `cancellation_reason = 'Reagendado pelo cliente'`, **sem** disparar a mensagem de cancelamento no WhatsApp e **sem** aplicar o bloqueio de horas (a validação já foi feita antes de liberar o botão).
- A action `cancel` atual permanece 100% intacta.

**2. `src/pages/public/MyBookingPage.tsx`**
- Novo botão "Reagendar" + `AlertDialog` de confirmação, exibido sob a mesma condição de `canCancel()`.
- Redireciona para `/agendar/{slug}?profissional={professional_id}&servico={service_id}&reagendar={token}`.

**3. `src/pages/public/BookingPage.tsx`**
- Ler os novos parâmetros `servico` e `reagendar` (o `profissional` já é suportado).
- Pré-selecionar o serviço quando `servico` estiver presente e avançar para o passo de data/hora.
- Faixa informativa de "Reagendando" no topo quando `reagendar` estiver presente.
- Depois do `create-public-booking` retornar sucesso e da confirmação ser enviada, chamar `booking-magic-link` com `action: 'cancel_for_reschedule'` para liberar o horário antigo.
- Nenhuma alteração na lógica de slots, conflito, PIX ou confirmação existente.

## Fora de escopo

- Não muda a agenda do admin nem a do profissional (lá o reagendamento continua via edição do agendamento).
- Não altera templates de mensagem já configurados pelas lojas.
