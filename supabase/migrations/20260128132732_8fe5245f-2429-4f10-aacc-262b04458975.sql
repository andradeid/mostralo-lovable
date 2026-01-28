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
  '## 🤖 Assistente Inteligente v2

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

Você pode personalizar as instruções do assistente e definir produtos prioritários para recomendação!',
  'feature',
  'important',
  true,
  NOW()
);