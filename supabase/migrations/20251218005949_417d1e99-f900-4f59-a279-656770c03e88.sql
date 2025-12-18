
INSERT INTO system_updates (version, title, description, category, importance, release_date, is_published) VALUES

-- v2.0.0 - Sistema de Novidades (HOJE)
('v2.0.0', 'Sistema de Novidades do Sistema', 
'## O que há de novo?

Agora você pode acompanhar todas as **novidades e melhorias** do sistema em um só lugar!

### Recursos:
- 📝 Descrições com **formatação rica** (Markdown)
- 🖼️ Screenshots das novidades
- 🔴 Badge de **novidades não lidas**
- 🏷️ Filtros por categoria
- ✅ Marcar como lido

Fique sempre atualizado com as últimas melhorias!', 
'feature', 'important', CURRENT_DATE, true),

-- v1.9.9 - Bot IA WhatsApp Saudações Contextuais
('v1.9.9', 'Bot IA com Saudações Contextuais de Fechamento', 
'## Comunicação Inteligente

O bot agora comunica o **horário de reabertura** de forma contextual:

### Exemplos:
- ⏰ **< 2 horas**: "Abrimos em instantes, às 18:00"
- 📅 **Hoje**: "Ainda estamos fechados, mas abrimos às 18:00"
- 🌅 **Amanhã**: "Voltamos amanhã às 08:00"

Comunicação mais **natural e humana**!', 
'feature', 'important', CURRENT_DATE - INTERVAL '2 days', true),

-- v1.9.8 - Sessões Ativas Bot
('v1.9.8', 'Gerenciamento de Sessões Ativas do Bot', 
'## Controle Total das Conversas

Interface em **tempo real** para gerenciar sessões do bot:

- 👥 Visualizar todas as sessões ativas
- ⏸️ Pausar sessões específicas
- 🔄 Reativar conversas pausadas
- 🗑️ Encerrar sessões
- 🔍 Buscar por cliente

Atualização automática a cada **30 segundos**.', 
'feature', 'normal', CURRENT_DATE - INTERVAL '5 days', true),

-- v1.9.7 - Sistema de Pausa Permanente
('v1.9.7', 'Pausa Automática com Reativação Configurável', 
'## Atendimento Híbrido

Quando você responde manualmente, o bot **pausa automaticamente**:

### Configurações:
- ⏱️ Tempo de reativação: 0 a 120 minutos
- 0 = reativação manual apenas
- Configurável por loja

Perfeito para **atendimentos VIP**!', 
'feature', 'normal', CURRENT_DATE - INTERVAL '8 days', true),

-- v1.9.6 - Personalidade do Bot
('v1.9.6', 'Sistema de Personalidade do Bot IA', 
'## Seu Bot, Sua Identidade

Escolha a **personalidade** do seu assistente:

| Estilo | Descrição |
|--------|-----------|
| 🎩 Profissional | Formal e objetivo |
| 😊 Amigável | Caloroso e acolhedor |
| 🎉 Divertido | Casual e descontraído |
| 📚 Consultivo | Especialista e consultivo |

+ Controle de **emojis** e **saudação personalizada**!', 
'feature', 'important', CURRENT_DATE - INTERVAL '10 days', true),

-- v1.9.5 - Links de Produtos no Bot
('v1.9.5', 'Links Diretos de Produtos nas Respostas do Bot', 
'## Conversão Facilitada

O bot agora inclui **links clicáveis** dos produtos:

```
Cliente: Quanto custa o X-Burguer?
Bot: O X-Burguer custa R$ 25,90! 
🛒 Peça aqui: mostralo.com.br/loja/sua-loja/produto/x-burguer
```

**Um clique** direto para o checkout!', 
'feature', 'normal', CURRENT_DATE - INTERVAL '12 days', true),

-- v1.9.4 - Classificação de Clientes
('v1.9.4', 'Saudações Inteligentes por Tipo de Cliente', 
'## Reconhecimento Automático

O sistema identifica o cliente pelo WhatsApp:

| Tipo | Critério | Saudação |
|------|----------|----------|
| 🆕 Novo | Desconhecido | Boas-vindas |
| 🔄 Frequente | Pediu < 7 dias | "Que bom ver você!" |
| 😢 Sumido | > 30 dias | "Sentimos sua falta!" |
| 🌟 VIP | > R$ 500 gastos | Tratamento especial |

**Personalização automática**!', 
'feature', 'critical', CURRENT_DATE - INTERVAL '15 days', true),

-- v1.9.3 - Tempo Estimado de Entrega
('v1.9.3', 'Countdown de Tempo Estimado de Entrega', 
'## Transparência para o Cliente

Novo sistema de **tempo estimado**:

- ⏱️ Countdown em tempo real
- 🟢 Verde: no prazo
- 🟡 Amarelo: quase chegando
- 🔴 Vermelho: atrasado
- ✏️ Editável pelo lojista

Reduz ansiedade e melhora a experiência!', 
'feature', 'important', CURRENT_DATE - INTERVAL '18 days', true),

-- v1.9.2 - Cupons na Renovação
('v1.9.2', 'Aplicação de Cupons na Renovação de Assinatura', 
'## Economia na Renovação

Agora você pode usar **cupons de desconto** ao renovar:

1. Acesse sua assinatura
2. Clique em "Renovar"
3. Aplique o cupom
4. Veja o desconto aplicado
5. Gere o PIX com valor reduzido

**Mesmo benefício** de novos assinantes!', 
'feature', 'normal', CURRENT_DATE - INTERVAL '20 days', true),

-- v1.9.1 - Rastreamento de Cupons
('v1.9.1', 'Rastreamento Automático de Uso de Cupons', 
'## Analytics de Promoções

Trigger automático registra cada uso:

- 📊 Contador de usos atualizado
- 📝 Histórico completo
- 💰 Valor do desconto aplicado
- 👤 Quem usou

Acompanhe o **ROI** das suas campanhas!', 
'improvement', 'normal', CURRENT_DATE - INTERVAL '22 days', true),

-- v1.9.0 - Página de Ideias
('v1.9.0', 'Página de Ideias e Roadmap', 
'## Planejamento Estratégico

Nova página para documentar e priorizar ideias:

### Funcionalidades:
- 📝 Descrições detalhadas
- 🎯 Níveis de prioridade
- 📊 Status de desenvolvimento
- 🔀 Drag-and-drop para reordenar
- 💾 Persistência no banco

**15 ideias** já documentadas!', 
'feature', 'normal', CURRENT_DATE - INTERVAL '25 days', true),

-- v1.8.9 - Bot IA Completo
('v1.8.9', 'Sistema Completo de Bot IA para WhatsApp', 
'## Inteligência Artificial no Atendimento

Bot com **OpenAI + Evolution API**:

- 🤖 GPT-4, GPT-4o, GPT-3.5
- 📋 Prompt automático com produtos
- ⚙️ Configurações avançadas
- 🧪 Ambiente de testes
- 🏪 Interface para lojistas

**Atendimento 24/7** automatizado!', 
'feature', 'critical', CURRENT_DATE - INTERVAL '28 days', true),

-- v1.8.8 - Contrato Lojistas
('v1.8.8', 'Sistema de Contratos Digitais para Lojistas', 
'## Segurança Jurídica

Contratos com **validade legal**:

- 📄 Templates versionados
- ✅ Aceite obrigatório no cadastro
- 🔐 Hash SHA-256 de verificação
- 🌐 IP e User Agent registrados
- 📋 Histórico de aceites

Verificação pública por hash!', 
'feature', 'important', CURRENT_DATE - INTERVAL '32 days', true),

-- v1.8.7 - Landing Suplementos
('v1.8.7', 'Landing Page para Lojas de Suplementos', 
'## Expansão Vertical

Nova página otimizada para **suplementos**:

- 💪 Dados do mercado (US$ 10B)
- 📈 Calculadora de economia
- 🔄 Ciclo de recompra (30-45 dias)
- 📱 WhatsApp para lembretes
- 🛒 Google/Instagram Shopping

**Template de 18 seções**!', 
'feature', 'normal', CURRENT_DATE - INTERVAL '35 days', true),

-- v1.8.6 - Guia de Navegação
('v1.8.6', 'Guia Completo de Navegação do Sistema', 
'## Documentação Interna

Página com **todas as rotas** do sistema:

- 📊 Estatísticas por área
- 🏷️ Badges por permissão
- 🔍 Busca de rotas
- 📋 Copiar path
- 🔗 Abrir em nova aba

Ideal para **suporte e treinamento**!', 
'feature', 'normal', CURRENT_DATE - INTERVAL '38 days', true),

-- v1.8.5 - Sistema de Survey
('v1.8.5', 'Sistema de Qualificação de Leads por Survey', 
'## Gamificação de Vendas

Questionário que **pontua leads**:

| Tier | Pontos | Benefício |
|------|--------|-----------|
| 🏆 Premium | 80-100 | 1 mês grátis |
| 🔥 Quente | 60-79 | 15 dias grátis |
| 🌡️ Morno | 40-59 | 7 dias trial |
| ❄️ Frio | 20-39 | PDF análise |

**5 tiers configuráveis**!', 
'feature', 'normal', CURRENT_DATE - INTERVAL '40 days', true),

-- v1.8.4 - WhatsApp Marketing Landing
('v1.8.4', 'Seção WhatsApp Marketing na Landing Page', 
'## Destaque na Home

Nova seção com **animações**:

- 📱 3 mockups animados
- 🔄 Ciclo de 24 segundos
- 📊 KPIs destacados
- 💬 23% recuperação
- 💰 R$ 2.400/mês aumento

**Scroll-reveal** suave!', 
'improvement', 'normal', CURRENT_DATE - INTERVAL '45 days', true),

-- v1.8.3 - Páginas Públicas Completas
('v1.8.3', 'Páginas de Funcionalidades e Guia do Vendedor', 
'## Documentação Rica

Duas novas páginas públicas:

### /funcionalidades
- 17 seções detalhadas
- Comparativo com iFood
- "Copiar Todo o Texto"

### /guia-vendedor
- 18 seções de vendas
- Scripts prontos
- Calculadora de ganhos

Para **vendedores e clientes**!', 
'feature', 'normal', CURRENT_DATE - INTERVAL '50 days', true),

-- v1.8.2 - Dashboard BI
('v1.8.2', 'Dashboard de Business Intelligence', 
'## Inteligência de Negócios

Métricas estratégicas em tempo real:

- 📈 MRR/ARR projetado
- 🏪 Contagem de lojas ativas
- 📊 Taxa de churn
- 🎯 3 cenários de crescimento
- 👥 Análise de vendedores

**Gráficos interativos**!', 
'feature', 'normal', CURRENT_DATE - INTERVAL '55 days', true),

-- v1.8.1 - Sistema de Módulos
('v1.8.1', 'Sistema de Módulos por Plano', 
'## Controle Granular

Modelo de permissões **invertido**:

- ✅ Todos os módulos habilitados por padrão
- 🚫 Admin bloqueia módulos específicos
- 📦 17 módulos disponíveis
- 🎯 Distribuição por plano sugerida

**Flexibilidade total**!', 
'feature', 'normal', CURRENT_DATE - INTERVAL '60 days', true);
