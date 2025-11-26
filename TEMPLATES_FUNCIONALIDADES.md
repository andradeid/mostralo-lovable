# 📋 Templates Prontos para Funcionalidades

> **Copie, cole e preencha! Templates rápidos para pedir novas funcionalidades.**

---

## 🎯 **TEMPLATE BÁSICO**

```markdown
🎯 FUNCIONALIDADE: [Nome]

📝 DESCRIÇÃO:
[O que faz]

👥 USUÁRIOS:
- [ ] Master Admin
- [ ] Store Admin
- [ ] Delivery Driver
- [ ] Cliente
- [ ] Público

📍 ONDE APARECE:
[Localização]

⚙️ REGRAS:
- [Regra 1]
- [Regra 2]

💡 OBSERVAÇÕES:
[Extras]
```

---

## 📊 **TEMPLATE: NOVA PÁGINA/TELA**

```markdown
🎯 FUNCIONALIDADE: Nova Página - [Nome da Página]

📝 DESCRIÇÃO:
Criar uma nova página no [dashboard/site público/painel do cliente] 
para exibir [informação/funcionalidade].

👥 USUÁRIOS:
- [X] [Role que vai acessar]

📍 ONDE APARECE:
- Menu lateral: [Nome do menu] > [Nome do submenu]
- URL: /[caminho-da-url]

📊 ELEMENTOS DA PÁGINA:
- [Elemento 1: ex: Gráfico de vendas]
- [Elemento 2: ex: Tabela com filtros]
- [Elemento 3: ex: Botões de ação]

⚙️ REGRAS:
- Dados exibidos: [fonte dos dados]
- Atualização: [tempo real / ao carregar / manual]
- Permissões: [quem pode ver o quê]
- Filtros disponíveis: [por data, categoria, etc]

💡 OBSERVAÇÕES:
[Layout, inspiração, integrações]
```

---

## 🎁 **TEMPLATE: SISTEMA DE PONTOS/GAMIFICAÇÃO**

```markdown
🎯 FUNCIONALIDADE: Sistema de [Pontos/Fidelidade/Recompensas]

📝 DESCRIÇÃO:
Sistema onde [usuário] acumula [pontos/moedas/estrelas] ao [ação] 
e pode trocar por [benefício].

👥 USUÁRIOS:
- [X] [Quem ganha pontos]
- [X] [Quem gerencia]

📍 ONDE APARECE:
- [Local 1]: Saldo de pontos
- [Local 2]: Histórico
- [Local 3]: Resgate de recompensas
- [Local 4]: Ranking (se aplicável)

⚙️ REGRAS DE PONTUAÇÃO:
- [Ação 1] = [X pontos]
- [Ação 2] = [Y pontos]
- [Z pontos] = [Benefício]

⚙️ REGRAS GERAIS:
- Pontos são creditados quando: [momento]
- Pontos expiram em: [tempo]
- Limite máximo de pontos: [quantidade]
- Cliente pode: [ver histórico / transferir / etc]

💡 OBSERVAÇÕES:
[Inspiração em programas existentes]
```

---

## 📧 **TEMPLATE: NOTIFICAÇÕES/ALERTAS**

```markdown
🎯 FUNCIONALIDADE: Notificação/Alerta - [Evento]

📝 DESCRIÇÃO:
Enviar notificação [tipo] quando [evento] acontecer.

📱 TIPO DE NOTIFICAÇÃO:
- [ ] Push (navegador)
- [ ] Email
- [ ] SMS
- [ ] WhatsApp
- [ ] Toast/Banner interno
- [ ] Som

👥 DESTINATÁRIOS:
- [Quem recebe a notificação]

⏰ QUANDO ENVIAR:
- [Evento que dispara]
- [Condições específicas]

📝 CONTEÚDO:
Título: [texto do título]
Mensagem: [texto da mensagem]
Ação: [botão/link se aplicável]

⚙️ REGRAS:
- Frequência: [imediata / agrupada / diária]
- Preferências do usuário: [pode desativar?]
- Horário permitido: [24h / apenas comercial]
- Tentativas em caso de falha: [quantas]

💡 OBSERVAÇÕES:
[Prioridade, sons específicos, etc]
```

---

## 🔄 **TEMPLATE: AUTOMAÇÃO/TRIGGER**

```markdown
🎯 FUNCIONALIDADE: Automação - [Nome da Automação]

📝 DESCRIÇÃO:
Automatizar [ação] quando [condição] for atendida.

🎬 GATILHO (TRIGGER):
Quando: [evento que inicia]
Condição: [verificação necessária]

⚙️ AÇÕES AUTOMÁTICAS:
1. [Ação 1]
2. [Ação 2]
3. [Ação 3]

📊 DADOS NECESSÁRIOS:
- [Campo 1] de [tabela]
- [Campo 2] de [tabela]

⚙️ REGRAS:
- Executar: [imediatamente / agendado / em background]
- Em caso de erro: [tentar novamente / notificar admin / ignorar]
- Log: [registrar execução? onde?]
- Frequência máxima: [limite de execuções]

💡 OBSERVAÇÕES:
[Horários, condições especiais]
```

---

## 💳 **TEMPLATE: PAGAMENTO/TRANSAÇÃO**

```markdown
🎯 FUNCIONALIDADE: [Método de Pagamento / Transação]

📝 DESCRIÇÃO:
Implementar [forma de pagamento / fluxo financeiro] para [finalidade].

💰 TIPO:
- [ ] Pagamento recebido (cliente paga loja)
- [ ] Pagamento enviado (loja paga entregador)
- [ ] Reembolso
- [ ] Crédito/Saldo em conta
- [ ] Split de pagamento

👥 ENVOLVIDOS:
- Pagador: [quem paga]
- Recebedor: [quem recebe]

⚙️ FLUXO:
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]
4. [Confirmação]

⚙️ REGRAS:
- Valor mínimo/máximo: [R$]
- Taxa de processamento: [%]
- Prazo de compensação: [dias]
- Estorno permitido até: [prazo]
- Parcelas: [sim/não, quantas]

🔒 SEGURANÇA:
- Validações necessárias: [CPF, comprovante, etc]
- Logs de auditoria: [sim/não]
- Aprovação manual: [sim/não]

💡 OBSERVAÇÕES:
[Integrações, APIs necessárias]
```

---

## 📊 **TEMPLATE: RELATÓRIO/DASHBOARD**

```markdown
🎯 FUNCIONALIDADE: Relatório - [Nome do Relatório]

📝 DESCRIÇÃO:
Relatório mostrando [informação] com possibilidade de [ações].

👥 USUÁRIOS:
- [X] [Quem acessa]

📍 ONDE APARECE:
Dashboard > [Menu] > [Submenu]

📊 VISUALIZAÇÕES:
- [Tipo 1]: Gráfico de [linhas/barras/pizza] mostrando [dado]
- [Tipo 2]: Tabela com colunas [col1, col2, col3]
- [Tipo 3]: Cards com KPIs [métrica1, métrica2]

🔍 FILTROS DISPONÍVEIS:
- Por período: [hoje / semana / mês / custom]
- Por categoria: [lista de categorias]
- Por status: [lista de status]
- Busca: [por nome / código / etc]

📥 EXPORTAÇÃO:
- [ ] Excel/CSV
- [ ] PDF
- [ ] Imprimir
- [ ] Enviar por email

⚙️ REGRAS:
- Dados considerados: [critérios]
- Cálculos: [como calcular cada métrica]
- Atualização: [tempo real / ao carregar]
- Performance: [se muitos dados, usar paginação]

💡 OBSERVAÇÕES:
[Cores, comparativos, metas]
```

---

## 🎨 **TEMPLATE: INTERFACE/VISUAL**

```markdown
🎯 FUNCIONALIDADE: Melhoria Visual - [Componente/Tela]

📝 DESCRIÇÃO:
Melhorar/Criar visual de [componente/página] para [objetivo].

📍 LOCALIZAÇÃO:
[Onde está ou onde vai ficar]

🎨 MUDANÇAS VISUAIS:
- Layout: [descrição do layout desejado]
- Cores: [paleta de cores]
- Tipografia: [tamanhos, fontes]
- Espaçamentos: [mais/menos espaçado]
- Animações: [efeitos desejados]
- Responsividade: [mobile, tablet, desktop]

📱 REFERÊNCIAS:
- Inspiração: [link ou descrição]
- Estilo: [moderno, minimalista, colorido, etc]

⚙️ FUNCIONALIDADES AFETADAS:
- [Funcionalidade 1]: [como deve se comportar]
- [Funcionalidade 2]: [como deve se comportar]

💡 OBSERVAÇÕES:
[Mockups, screenshots, exemplos]
```

---

## 🔐 **TEMPLATE: PERMISSÃO/ACESSO**

```markdown
🎯 FUNCIONALIDADE: Controle de Acesso - [Recurso]

📝 DESCRIÇÃO:
Controlar quem pode [ação] em [recurso].

👥 ROLES ENVOLVIDAS:
- Master Admin: [pode fazer X, Y, Z]
- Store Admin: [pode fazer X, Y]
- Cliente: [pode fazer X]
- Público: [pode fazer nada/apenas visualizar]

🔒 PERMISSÕES ESPECÍFICAS:
- Criar: [quem pode]
- Visualizar: [quem pode]
- Editar: [quem pode]
- Deletar: [quem pode]
- Aprovar: [quem pode]

⚙️ REGRAS:
- [Role] só pode [ação] em [condição]
- Auditoria: [registrar quem fez o quê]
- Herança: [roles herdam de outras?]

🚫 COMPORTAMENTO QUANDO NEGADO:
- Usuário vê: [mensagem de erro / redirecionamento / nada]
- Log: [registrar tentativas de acesso negado]

💡 OBSERVAÇÕES:
[Casos especiais, exceções]
```

---

## 📁 **TEMPLATE: CRUD SIMPLES**

```markdown
🎯 FUNCIONALIDADE: CRUD de [Entidade]

📝 DESCRIÇÃO:
Gerenciar [entidade] com operações de criar, visualizar, editar e deletar.

👥 USUÁRIOS:
- [X] [Quem gerencia]

📍 ONDE APARECE:
Dashboard > [Menu] > [Nome]

📊 LISTA (Tabela):
Colunas: [col1, col2, col3, col4, ações]
- Busca por: [campo]
- Filtros: [filtro1, filtro2]
- Ordenação: [crescente/decrescente por campo]
- Paginação: [sim, X itens por página]

📝 FORMULÁRIO (Criar/Editar):
Campos obrigatórios:
- [Campo 1]: [tipo] - [validação]
- [Campo 2]: [tipo] - [validação]

Campos opcionais:
- [Campo 3]: [tipo] - [validação]

🗑️ DELETAR:
- Confirmação: [sim, com modal]
- Tipo: [hard delete / soft delete]
- Validação: [não pode deletar se...]

⚙️ REGRAS:
- [Regra de negócio 1]
- [Regra de negócio 2]

💡 OBSERVAÇÕES:
[Upload de imagens, relacionamentos]
```

---

## 🔄 **TEMPLATE: INTEGRAÇÃO EXTERNA**

```markdown
🎯 FUNCIONALIDADE: Integração com [Serviço/API]

📝 DESCRIÇÃO:
Integrar com [nome do serviço] para [finalidade].

🔌 SERVIÇO:
Nome: [nome]
API: [URL da documentação]
Autenticação: [API Key / OAuth / etc]

📤 DADOS ENVIADOS:
- [Campo 1]: [valor / origem]
- [Campo 2]: [valor / origem]

📥 DADOS RECEBIDOS:
- [Campo 1]: [salvar em / usar para]
- [Campo 2]: [salvar em / usar para]

⏰ QUANDO EXECUTAR:
- [Evento que dispara]
- Frequência: [tempo real / agendado / manual]

⚙️ TRATAMENTO DE ERROS:
- Timeout: [tempo] → [ação]
- Erro 400: [ação]
- Erro 500: [ação]
- Retry: [quantas tentativas]

⚙️ REGRAS:
- Requisitos: [credenciais, conta no serviço]
- Logs: [registrar todas chamadas]
- Fallback: [o que fazer se falhar]

💡 OBSERVAÇÕES:
[Custos, limites de rate, webhooks]
```

---

## 🎉 **DICA FINAL**

**Escolha o template mais próximo da sua necessidade, copie, preencha e envie!**

Não precisa preencher tudo perfeitamente - o Cursor pode te ajudar a completar os detalhes! 🚀

---

**Criado para facilitar seu desenvolvimento no Mostralo** ❤️

