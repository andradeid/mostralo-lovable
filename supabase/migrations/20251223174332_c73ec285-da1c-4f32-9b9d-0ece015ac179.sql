
INSERT INTO system_updates (version, title, description, category, importance, release_date, is_published)
VALUES 
(
  '2.4.0',
  'Módulo de Faturamento Externo',
  '> 🔒 **Exclusivo para Master Admin**

## Faturamento para Clientes Externos

Gere faturas e boletos para clientes que **não são lojistas** do sistema: consultorias, projetos avulsos, serviços externos, etc.

### 👥 Clientes Externos
- Cadastro completo com **CPF/CNPJ** validado
- Endereço com busca automática por **CEP**
- Pessoa Física ou Jurídica

### 📋 Catálogo de Serviços
- Defina serviços com preço padrão
- Tipos: **valor fixo**, **por hora** ou **mensal**

### 📄 Faturas
- Crie faturas avulsas ou **recorrentes** (mensal, trimestral, anual)
- Gere **boleto bancário** via EFI
- Envie diretamente pelo **WhatsApp**
- Link público para o cliente visualizar e pagar

### 🔗 Acesso: Menu → Faturamento Externo',
  'feature',
  'important',
  '2025-12-23',
  true
),
(
  '2.5.0',
  'Monitor de Webhooks',
  '> 🔒 **Exclusivo para Master Admin**

Novo dashboard para monitorar webhooks do PIX e Boleto em tempo real.

### Recursos:
- **Estatísticas em tempo real** - Total, sucessos, erros e taxa
- **Gráfico de 7 dias** - Volume por dia
- **Tabela filtrada** - Status e tipo de webhook
- **Detalhes completos** - Payload de cada webhook

### 🔗 Acesso: Menu Master Admin → Monitor Webhooks',
  'feature',
  'normal',
  '2025-12-23',
  true
),
(
  '2.5.1',
  'Edição de Faturas Externas',
  '> 🔒 **Exclusivo para Master Admin**

Agora você pode **editar faturas externas** pendentes ou vencidas.

### Campos editáveis:
- ✅ Descrição
- ✅ Valor
- ✅ Data de vencimento
- ✅ Observações

**Nota:** Cliente e serviço não podem ser alterados.

Clique nos 3 pontinhos (⋮) → "Editar Fatura"',
  'feature',
  'normal',
  '2025-12-23',
  true
),
(
  '2.5.2',
  'Correção de Boleto Vencido',
  'Corrigido problema de boletos aparecendo "vencidos" no mesmo dia.

### Correções:
- Boletos vencem apenas **após 23:59:59** do dia
- Segunda via calcula nova data automaticamente **(+7 dias)**',
  'fix',
  'normal',
  '2025-12-23',
  true
);
