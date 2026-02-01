
# Plano: Captura Automática de Leads via WhatsApp

## Resumo do Problema

Atualmente, quando alguém manda mensagem para o WhatsApp da loja:
- O sistema processa a mensagem e responde
- **MAS não salva o contato na base de dados**
- Apenas clientes que já fizeram pedido aparecem na tabela `customers`

A tabela `whatsapp_contacts` existe mas só é populada quando o dono da loja clica em "Sincronizar Contatos" (puxa a agenda do WhatsApp).

## Solução Proposta

Implementar **captura automática de leads** em tempo real: toda pessoa que mandar mensagem para o WhatsApp da loja será salva automaticamente como contato/lead.

## Arquitetura da Solução

```text
┌─────────────────────┐
│  Cliente manda msg  │
│  pelo WhatsApp      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   whatsapp-webhook  │  ◄── Adicionar lógica de
│     (modificar)     │      captura de contato
└──────────┬──────────┘
           │
           ├────────────────────────────┐
           │                            │
           ▼                            ▼
┌─────────────────────┐    ┌─────────────────────┐
│  whatsapp_contacts  │    │  Processamento      │
│  (upsert contato)   │    │  normal de msg      │
│  source: 'chat'     │    └─────────────────────┘
└─────────────────────┘
           │
           ▼
┌─────────────────────┐
│  Painel da Loja     │
│  /dashboard/customers│
│  exibe o contato    │
└─────────────────────┘
```

## Funcionalidades a Implementar

### 1. Captura Automática no Webhook
Quando uma mensagem chegar via `whatsapp-webhook`:
- Extrair: telefone (`remoteJid`), nome (`pushName`)
- Verificar se já existe em `whatsapp_contacts` para esta loja
- Se não existe: criar com `source: 'chat'`
- Se existe: atualizar `last_synced_at` e `push_name` (se veio diferente)

### 2. Diferenciação de Origem
Criar campo `source` com valores:
- `sync` = Sincronizado da agenda WhatsApp
- `chat` = Veio por mensagem recebida (NOVO)
- `group` = Extraído de grupo
- `import` = Importado manualmente

### 3. Pipeline Lead → Cliente
- **Lead (whatsapp_contacts)**: pessoa que mandou mensagem
- **Cliente (customers)**: pessoa que fez pedido
- Vincular: quando lead fizer pedido, atualizar `customer_id` em `whatsapp_contacts`

## Tarefas de Implementação

### Tarefa 1: Modificar whatsapp-webhook
**Arquivo:** `supabase/functions/whatsapp-webhook/index.ts`

Adicionar após a linha ~244 (após extrair senderPhone e senderName):

```typescript
// === CAPTURA AUTOMÁTICA DO LEAD/CONTATO ===
const captureContact = async () => {
  try {
    // Verificar se telefone é válido (não é grupo)
    if (remoteJid.includes('@g.us')) return;
    
    const phoneNormalized = senderPhone.replace(/\D/g, '');
    if (phoneNormalized.length < 10 || phoneNormalized.length > 15) return;
    
    // Upsert na tabela whatsapp_contacts
    const { error: contactError } = await supabase
      .from('whatsapp_contacts')
      .upsert({
        store_id: instance.store_id,
        phone_number: phoneNormalized,
        push_name: senderName,
        name: senderName,
        is_whatsapp_valid: true,
        source: 'chat',
        last_synced_at: new Date().toISOString(),
      }, {
        onConflict: 'store_id,phone_number',
        ignoreDuplicates: false,
      });
    
    if (contactError) {
      console.log('⚠️ Erro ao salvar contato:', contactError.message);
    } else {
      console.log(`📇 Contato salvo/atualizado: ${phoneNormalized} (${senderName})`);
    }
  } catch (e) {
    console.log('⚠️ Erro na captura de contato:', e);
  }
};

// Executar captura em background (não bloqueia resposta)
captureContact();
```

### Tarefa 2: Modificar whatsapp-media-webhook
**Arquivo:** `supabase/functions/whatsapp-media-webhook/index.ts`

Adicionar mesma lógica após identificar a loja (linha ~557), para capturar contatos que enviam imagens também.

### Tarefa 3: Atualizar Painel de Clientes (Opcional)
**Arquivo:** Página de gerenciamento de clientes

Atualmente a página mostra apenas `customers`. Podemos:
- Opção A: Exibir `whatsapp_contacts` com etiqueta "Lead" para quem não é cliente
- Opção B: Criar aba separada "Leads" vs "Clientes"
- Opção C: Manter como está, mas exibir contador de leads

## Fluxo Completo

**Cenário:** Você (556194009368) manda mensagem para a Drogaria Farma Bella

1. Mensagem chega no `whatsapp-webhook`
2. Sistema cria/atualiza registro em `whatsapp_contacts`:
   - `store_id`: ID da Drogaria Farma Bella
   - `phone_number`: 556194009368
   - `push_name`: Seu nome do WhatsApp
   - `source`: 'chat'
   - `customer_id`: NULL (você ainda não é cliente)
3. No painel, o contato aparece na lista

**Se você fizer um pedido:**
4. Sistema cria registro em `customers`
5. Atualiza `whatsapp_contacts.customer_id` com o ID do cliente
6. No painel, aparece como "Cliente" ao invés de "Lead"

## Detalhes Técnicos

### Estrutura da tabela whatsapp_contacts (já existente)
| Campo | Tipo | Uso |
|-------|------|-----|
| id | UUID | PK |
| store_id | UUID | FK para stores |
| phone_number | TEXT | Telefone normalizado |
| name | TEXT | Nome editável |
| push_name | TEXT | Nome do WhatsApp |
| source | TEXT | 'sync', 'chat', 'group' |
| customer_id | UUID | FK para customers (quando virar cliente) |
| is_whatsapp_valid | BOOLEAN | Sempre true para quem mandou msg |
| last_synced_at | TIMESTAMP | Última interação |

### RLS já configurada
A tabela `whatsapp_contacts` já tem RLS permitindo donos de loja gerenciarem seus contatos.

## Arquivos a Modificar

| Arquivo | Modificação |
|---------|-------------|
| `supabase/functions/whatsapp-webhook/index.ts` | Adicionar captura automática de contato |
| `supabase/functions/whatsapp-media-webhook/index.ts` | Mesma captura para mensagens de imagem |

## Benefícios

- **Base de leads em tempo real** - Todo mundo que interage vira lead automaticamente
- **Pipeline claro** - Lead → Cliente (quando compra)
- **Visibilidade** - Loja sabe quantas pessoas estão interagindo
- **Marketing** - Possibilidade de enviar campanhas para leads
- **Zero esforço** - Automático, sem necessidade de sincronização manual

## Testes Sugeridos

1. Mandar mensagem de um número novo para o WhatsApp da loja
2. Verificar se aparece em `whatsapp_contacts` com `source: 'chat'`
3. Verificar se aparece no painel de clientes/contatos da loja
4. Fazer pedido e verificar se `customer_id` é atualizado
