
# Plano: Adicionar Novidade do Assistente Inteligente v2

## Objetivo
Adicionar um novo registro na tabela `system_updates` para informar os usuários sobre a nova funcionalidade do **Assistente Inteligente v2**.

---

## O que será feito

### Inserir nova atualização via SQL

Executar uma migração SQL para inserir um novo registro na tabela `system_updates` com as seguintes informações:

| Campo | Valor |
|-------|-------|
| **version** | `3.2.0` |
| **title** | `Assistente Inteligente v2` |
| **category** | `feature` (Nova Funcionalidade) |
| **importance** | `important` (Importante) |
| **is_published** | `true` |
| **release_date** | Data atual (28/01/2026) |

**Conteúdo da descrição (Markdown):**

```markdown
## 🤖 Assistente Inteligente v2

O bot de WhatsApp da sua loja agora conta com uma versão muito mais inteligente e econômica!

### ⚡ O que mudou?

**Antes (v1):**
- Limite de até 200 produtos no catálogo
- Consumia até 20.000 tokens por conversa
- Custo elevado para lojas com muitos produtos

**Agora (v2):**
- Catálogo ilimitado de produtos
- Consulta em tempo real ao estoque
- Apenas 800-1.500 tokens por conversa
- Redução de até 90% nos custos de IA

### 🎯 Novos Recursos

- **Busca inteligente**: O assistente consulta o banco de dados em tempo real
- **Verificação de estoque**: Informa disponibilidade instantânea
- **Recomendações personalizadas**: Sugere produtos com base nas preferências
- **Links diretos**: Envia link do produto para o cliente visualizar
- **Navegação com Uber**: Opção de chamar Uber além do Waze e Google Maps

### 🔧 Como ativar?

1. Acesse o painel do WhatsApp
2. Na seção "Modo do Assistente", selecione "Inteligente v2"
3. Clique em "Sincronizar Bot"

### 💡 Dica

Você pode personalizar as instruções do assistente e definir produtos prioritários para recomendação!
```

---

## Resultado esperado

Após a execução:
- A novidade aparecerá automaticamente na página `/dashboard/novidades`
- Será exibida com o ícone 🚀 (categoria: feature)
- Terá destaque amarelo (importância: important)
- Usuários que não leram verão a notificação de "não lida"

---

## Detalhes Técnicos

**Arquivo a ser criado:**
- `supabase/migrations/[timestamp]_add_intelligent_assistant_v2_update.sql`

**Query SQL:**
```sql
INSERT INTO system_updates (
  version,
  title,
  description,
  category,
  importance,
  is_published,
  release_date
) VALUES (
  '3.2.0',
  'Assistente Inteligente v2',
  '## 🤖 Assistente Inteligente v2...',
  'feature',
  'important',
  true,
  NOW()
);
```

---

## Resumo

| Item | Descrição |
|------|-----------|
| **Tipo** | Inserção de dados |
| **Tabela** | `system_updates` |
| **Arquivos** | 1 migração SQL |
| **Impacto** | Nenhum código alterado, apenas dados |
