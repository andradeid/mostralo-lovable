## Objetivo

Exibir, na tela de **Agendamento Confirmado**, um botão **"Gerenciar meu agendamento"** que leve o cliente para a página `/meu-agendamento/:token` — onde ele já pode visualizar e cancelar o agendamento. O cliente também recebe esse mesmo link por WhatsApp (já implementado), mas ter o botão na tela é importante porque:

- Permite acesso imediato sem depender do WhatsApp ter chegado
- Funciona para clientes que agendaram em loja com WhatsApp não conectado
- Reforça segurança: cada agendamento tem seu próprio token único (32 caracteres) salvo em `booking_tokens`

## Como funciona hoje (já existe)

- Tabela `booking_tokens` (booking_id + token único)
- Edge function `booking-magic-link` action `create`: gera token, salva no banco, envia link por WhatsApp e **retorna o token na resposta** (`{ success, token, whatsapp_sent }`)
- Rota pública `/meu-agendamento/:token` → `MyBookingPage.tsx` (visualização + cancelamento)
- Em `BookingPage.tsx` (linha 534-548), o magic link é disparado em `setTimeout(3000)` mas a resposta (o token) é descartada

## Mudanças propostas

### 1. Capturar o token retornado e guardar em estado
**`src/pages/public/BookingPage.tsx`**
- Adicionar estado `const [manageToken, setManageToken] = useState<string | null>(null)`
- Trocar o `setTimeout` + `.then()` por uma chamada que aguarda a resposta e faz `setManageToken(data.token)` quando vier
- Manter o envio por WhatsApp como está (não bloquear a UI: usar IIFE async, mas já capturar o token assim que disponível, sem esperar o WhatsApp)
- Passar `manageToken` como prop nova para `<BookingConfirmation>`

### 2. Adicionar prop e botão no componente de confirmação
**`src/components/booking/BookingConfirmation.tsx`**
- Nova prop opcional: `manageToken?: string | null`
- Acima do botão "Fazer novo agendamento", adicionar:
  - Botão **"Gerenciar meu agendamento"** (variant outline, ícone `CalendarCog` ou `Settings2`)
  - Ação: `window.open('/meu-agendamento/' + manageToken, '_blank')` (abre em nova aba para não perder a tela de sucesso)
  - Texto auxiliar pequeno abaixo: *"Use este link para reagendar ou cancelar. Também enviamos para o seu WhatsApp."*
- Estado de loading: enquanto `manageToken` for `null` (token ainda sendo gerado nos primeiros 1-2s), mostrar o botão desabilitado com spinner pequeno e texto "Preparando link de gestão..."
- Respeitar o tema da página (o botão usa as variáveis CSS de `--primary` e `--radius` já configuradas pelo tema da loja, mantendo a consistência visual com o resto da tela de confirmação)

### 3. Fallback em caso de erro
- Se a edge function falhar em retornar o token (raro), o botão não aparece — apenas o aviso de que o link foi enviado por WhatsApp
- Sem mudanças adicionais no banco ou em outras edge functions

## Arquivos afetados

- `src/pages/public/BookingPage.tsx` (capturar token, passar prop)
- `src/components/booking/BookingConfirmation.tsx` (nova prop, botão, estado de loading)

## Impacto / quebras

Nenhuma. O fluxo de criação do agendamento, o envio por WhatsApp e a página `/meu-agendamento/:token` continuam idênticos. A mudança é puramente aditiva na UI de confirmação.
