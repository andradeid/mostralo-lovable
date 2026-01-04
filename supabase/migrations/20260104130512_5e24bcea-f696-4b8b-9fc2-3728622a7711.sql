-- Inserir atualizações do Sistema de Agendamento (3.0.x)
INSERT INTO system_updates (version, title, description, category, importance, release_date, is_published)
VALUES 
(
  '3.0.0',
  'Sistema de Agendamento de Serviços',
  '## 📅 Central Completa de Agendamento

Lançamento do sistema completo de agendamento online para barbearias, salões, clínicas e consultórios.

### ⭐ Destaques:
- **Página pública de agendamento** (/agendar/sua-loja)
- Cliente escolhe serviço, profissional, data e horário
- Validação de WhatsApp com foto do perfil
- Detecção automática de conflitos (sem double booking)
- Link compartilhável para divulgação

### 💰 Benefícios:
- Cliente agenda 24/7 sem precisar ligar
- Fim dos conflitos de horário
- Redução de faltas com lembretes automáticos
- Aumento de receita com agenda otimizada',
  'feature',
  'critical',
  '2026-01-04',
  true
),
(
  '3.0.1',
  'Gestão de Profissionais e Horários',
  '## 👤 Gestão Completa de Profissionais

### Cadastro de Profissionais:
- Foto, nome, especialidade e descrição
- Vinculação de serviços específicos
- Preços e durações personalizados por profissional
- Sistema de comissões (percentual ou valor fixo)

### Configuração de Horários:
- Horário de trabalho por dia da semana
- Intervalo de almoço/pausa configurável
- Bloqueios de agenda (férias, feriados, consultas)
- Motivos para cada bloqueio

### Grade de Disponibilidade:
- Visualização semanal em cores
- Verde: disponível | Vermelho: ocupado | Laranja: bloqueado
- Taxa de ocupação em tempo real
- Agendamento direto clicando no slot',
  'feature',
  'important',
  '2026-01-04',
  true
),
(
  '3.0.2',
  'Calendário Visual e Relatórios de Agendamentos',
  '## 📊 Calendário e Relatórios Inteligentes

### Calendário Visual:
- Visualização por dia, semana ou mês
- Filtro por profissional
- Cores por status (pendente, confirmado, em andamento, concluído, cancelado)
- Criação de agendamento direto no calendário

### Relatórios de Performance:
- **KPIs**: Total de agendamentos, taxa de comparecimento, cancelamentos, receita
- **Horários de pico**: Saiba quando sua agenda está mais cheia
- **Serviços populares**: Descubra o que mais vende
- **Ranking de profissionais**: Quem mais atende
- **Tendência**: Análise de crescimento semanal/mensal',
  'feature',
  'important',
  '2026-01-04',
  true
),
(
  '3.0.3',
  'Mensagens Automáticas de Agendamento via WhatsApp',
  '## 💬 Automação Completa via WhatsApp

### Mensagens Automáticas:
- **Confirmação**: Enviada imediatamente após o agendamento
- **Lembrete**: X horas antes do horário marcado
- **Pesquisa de satisfação**: Após o atendimento

### Templates Personalizáveis:
Use variáveis para personalizar suas mensagens:
- `{cliente}` - Nome do cliente
- `{profissional}` - Nome do profissional
- `{servico}` - Serviço agendado
- `{data}` - Data do agendamento
- `{horario}` - Horário marcado
- `{valor}` - Valor do serviço

### Configurações:
- Ativar/desativar cada tipo de mensagem
- Definir tempo do lembrete (1h, 2h, 24h antes)
- Personalizar texto de cada template',
  'feature',
  'important',
  '2026-01-04',
  true
),
(
  '3.0.4',
  'Avaliações e Reputação de Profissionais',
  '## ⭐ Sistema de Avaliações

### Coleta Automática:
- Link de avaliação enviado após cada atendimento
- Avaliação de 1 a 5 estrelas
- Campo de feedback/comentário
- Opção de avaliação anônima

### Dashboard de Reputação:
- Média geral de estrelas
- Total de avaliações recebidas
- Filtros por profissional, período, rating
- Visualização de todos os comentários
- Opção de tornar avaliação pública ou privada

### Benefícios:
- Melhore a qualidade do atendimento
- Identifique profissionais com problemas
- Mostre sua reputação para novos clientes',
  'feature',
  'normal',
  '2026-01-04',
  true
),
(
  '3.0.5',
  'Configurações Avançadas de Agendamento',
  '## ⚙️ Configurações Flexíveis

### Intervalos e Limites:
- **Intervalo entre slots**: 15, 20, 30, 45 ou 60 minutos
- **Dias máximos para agendar**: Limite de quanto tempo no futuro
- **Antecedência mínima**: Evite agendamentos de última hora
- **Prazo de cancelamento**: Defina política de cancelamento

### Opções Especiais:
- "Qualquer profissional disponível" - Cliente não escolhe, sistema aloca
- Sistema de sinal/depósito via PIX
- Porcentagem configurável do depósito

### Flexibilidade Total:
Adapte o sistema às regras do seu negócio!',
  'feature',
  'normal',
  '2026-01-04',
  true
),
-- Inserir atualizações do Sistema de Cartão Digital (3.1.x)
(
  '3.1.0',
  'Cartão Digital para Profissionais',
  '## 💳 Cartão Digital para Profissionais

Crie cartões digitais personalizados para sua equipe compartilhar com clientes!

### ⭐ Funcionalidades:
- **Página pública exclusiva** (/c/nome-profissional)
- Foto, nome, título e headline personalizáveis
- Bio e estatística destacada (ex: "+500 clientes atendidos")
- Contatos: WhatsApp, telefone, email, site
- Redes sociais: Instagram, LinkedIn, Facebook, YouTube, TikTok

### 🎨 Personalização Visual:
- **4 temas**: Escuro, Claro, Laranja, Gradiente
- **8 cores de destaque** para combinar com sua marca
- CTA principal personalizável
- Links customizados ilimitados

### 📊 Estatísticas Completas:
- Total de visualizações do cartão
- Cliques por tipo (WhatsApp, email, redes, etc.)
- Gráfico de cliques dos últimos 7 dias
- Taxa de conversão

### 🔗 Recursos Extras:
- QR Code gerado automaticamente
- Botão "Salvar Contato" gera vCard para agenda
- Compartilhamento via WhatsApp, email, Twitter
- Integração com sistema de agendamento
- Badge "Powered by MOSTRALO" (opcional)

### 💼 Para o Lojista:
- Gerencie até 5 cartões por loja
- Vincule cada cartão a um profissional
- Ative/desative cartões individualmente',
  'feature',
  'critical',
  '2026-01-04',
  true
),
(
  '3.1.1',
  'Cartão Digital para Vendedores MOSTRALO',
  '## 👔 Cartão Digital para Vendedores

Nossos vendedores agora têm cartão digital próprio para prospecção!

### 📱 Funcionalidades:
- **Link exclusivo** personalizado (/c/seu-nome)
- Editor completo com preview em tempo real
- Foto profissional com upload direto
- Empresa: MOSTRALO (pré-configurado)

### 🎯 Ideal para:
- Prospecção de novos lojistas
- Networking em eventos
- Assinatura em emails
- Compartilhamento em redes sociais

### 📊 Dashboard de Performance:
- Quantas pessoas visualizaram seu cartão
- Quais links foram clicados
- Análise de conversão
- Histórico de 7 dias

### 🚀 Benefícios:
- Profissionalismo na abordagem
- Informações sempre atualizadas
- Fácil compartilhamento
- Métricas para otimização',
  'feature',
  'important',
  '2026-01-04',
  true
),
(
  '3.1.2',
  'Compartilhamento Avançado e vCard',
  '## 📤 Compartilhamento Avançado de Cartões

### 📲 Botão de Compartilhamento:
- **WhatsApp**: Envie o link diretamente
- **Email**: Abra cliente de email com link
- **Twitter/X**: Publique com texto automático
- **Copiar Link**: Para colar em qualquer lugar
- **Share nativo**: Usa o menu de compartilhamento do celular (quando disponível)

### 📇 Salvar Contato (vCard):
Clientes podem salvar o contato diretamente na agenda!

**O que é incluído no vCard:**
- Nome completo
- Título/cargo
- Empresa
- Telefone e WhatsApp
- Email
- Website
- Foto do profissional (opcional)

### 📈 Rastreamento:
Cada clique é registrado para análise:
- `whatsapp` - Cliques no WhatsApp
- `phone` - Cliques em Ligar
- `email` - Cliques em Email
- `website` - Cliques no Site
- `save_contact` - Downloads de vCard
- `share` - Compartilhamentos
- `instagram`, `linkedin`, `facebook`, `youtube` - Redes sociais
- `custom_link` - Links personalizados
- `booking` - Cliques em Agendar
- `cta` - Cliques no botão principal',
  'feature',
  'normal',
  '2026-01-04',
  true
);