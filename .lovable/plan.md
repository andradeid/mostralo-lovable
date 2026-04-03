

# Plano: Remover Validação de WhatsApp dos Fluxos de Agendamento e Pedidos

## Contexto

Atualmente, ao agendar um serviço (BookingPage) ou se autenticar em uma mesa (TableCustomerAuth), o sistema chama a Edge Function `validate-whatsapp-number` para verificar se o número tem WhatsApp ativo. Isso causa erros quando a instância não está disponível e bloqueia o fluxo desnecessariamente.

As notificações via WhatsApp (confirmação, lembretes, etc.) já funcionam independentemente pela instância do lojista e não dependem dessa validação.

## O que será alterado

### 1. BookingPage.tsx — Remover validação no submit

- Remover a função `validateWhatsApp` e os estados relacionados (`whatsappValidating`, `whatsappValid`, `whatsappProfile`)
- Remover a chamada `validateWhatsApp()` dentro de `handleSubmit` (linhas 516-520)
- Remover o import do `WhatsAppProfilePreview`
- Remover a UI de preview do perfil WhatsApp e a mensagem de "número inválido" (linhas ~1110-1135)
- Remover a condição `whatsappValidating` do botão de submit
- Manter toda a lógica de envio de notificações intacta

### 2. TableCustomerAuth.tsx — Remover step de validação WhatsApp

- Remover os steps `validating_whatsapp` e `whatsapp_result` do fluxo
- No `useEffect` de auto-advance do step `identified`, ir direto para `goToFinalStep()` (ignorar a checagem `hasModule('whatsapp')`)
- Remover o `useEffect` de auto-advance do `whatsapp_result`
- Remover a função `validateWhatsApp`
- Remover o estado `whatsappStatus`
- Remover as referências ao componente `TableAuthWhatsAppStep` para os steps removidos
- Manter o import de `hasModule` se usado em outro lugar

## O que NÃO será alterado

- Edge Function `validate-whatsapp-number` — continua existindo para outros usos (Leads, Campanhas, Perfil, Contatos do Chat, etc.)
- Envio de notificações de agendamento via WhatsApp — continua funcionando normalmente pela instância do lojista
- Nenhuma tabela ou RLS será modificada
- Nenhuma outra página ou componente será tocado

## Arquivos impactados

| Arquivo | Ação |
|---|---|
| `src/pages/public/BookingPage.tsx` | Remover validação e UI relacionada |
| `src/components/table/TableCustomerAuth.tsx` | Remover steps de validação WhatsApp |

