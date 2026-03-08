

## Plano: Botão "Adicionar Contato" na Página de Chat WhatsApp

### O que será feito

Adicionar um botão de "+" ao lado da barra de busca na lista de conversas (área destacada na imagem). Ao clicar, abre um modal para iniciar conversa com um novo número de WhatsApp, com validação completa via Evolution API.

### Fluxo do Modal

1. Usuário clica no botão "+"
2. Modal abre com campo DDI (pré-selecionado +55) + campo de telefone com máscara brasileira
3. Botão "Validar" fica habilitado quando o número tem 10+ dígitos
4. Ao validar, chama `validate-whatsapp-number` (edge function já existente) que retorna: `valid`, `pictureUrl`, `pushName`
5. Se válido: exibe preview do perfil (componente `WhatsAppProfilePreview` já existente) + botão "Iniciar Conversa"
6. Se inválido: exibe mensagem de erro amigável
7. Ao confirmar, cria/busca conversa em `whatsapp_conversations` e abre o chat

### Componentes e arquivos

**Novo componente**: `src/components/whatsapp-chat/AddContactModal.tsx`
- Modal com Dialog do Radix
- `CountryCodeSelect` (já existe) para DDI pré-selecionado Brasil
- Input com `formatBrazilianPhone` (já existe em utils)
- Animação de validação (spinner)
- `WhatsAppProfilePreview` (já existe) para mostrar foto + nome após validação
- Botão "Iniciar Conversa" que cria/busca a conversa

**Editar**: `src/components/whatsapp-chat/ConversationList.tsx`
- Adicionar botão "+" ao lado direito da barra de busca (onde o usuário marcou na imagem)
- Importar e renderizar o `AddContactModal`

**Editar**: `src/pages/admin/WhatsAppChatPage.tsx`
- Passar `storeId` e callback `onConversationCreated` para o `ConversationList` para que ao criar a conversa, ela seja selecionada automaticamente

### Lógica de criação/busca de conversa

Ao confirmar no modal:
1. Normalizar telefone para formato canônico
2. Buscar conversa existente em `whatsapp_conversations` pelo `phone_number` + `store_id`
3. Se existir: selecionar essa conversa
4. Se não existir: inserir nova conversa com `contact_name` (pushName), `profile_picture_url`, `phone_number`, `remote_jid` (formato `55XXXXXXXXX@s.whatsapp.net`), `status: 'open'`
5. Selecionar a conversa criada/encontrada

### Reutilização

- Edge function `validate-whatsapp-number`: já faz validação + busca foto + pushName
- `CountryCodeSelect`: seletor de DDI
- `WhatsAppProfilePreview`: preview do perfil validado
- `formatBrazilianPhone`: máscara do telefone

