# 🚀 Como Pedir Novas Funcionalidades - Guia Completo

> **Este guia vai te ajudar a pedir novas funcionalidades de forma clara e eficiente, garantindo que o desenvolvimento seja rápido e preciso.**

---

## 📋 **ÍNDICE**

1. [O Que o Cursor Já Sabe](#o-que-o-cursor-já-sabe)
2. [Template para Pedidos](#template-para-pedidos)
3. [Informações Necessárias](#informações-necessárias)
4. [Exemplos Práticos](#exemplos-práticos)
5. [Ideias de Funcionalidades](#ideias-de-funcionalidades)
6. [Modos de Trabalho](#modos-de-trabalho)
7. [Checklist de Qualidade](#checklist-de-qualidade)

---

## ✅ **O QUE O CURSOR JÁ SABE**

Graças às memórias salvas, o Cursor tem conhecimento completo sobre:

### **Backend/Banco de Dados:**
- ✅ 35 tabelas e suas estruturas
- ✅ Relacionamentos entre tabelas
- ✅ 109 migrations existentes
- ✅ 14 Edge Functions do Supabase
- ✅ Políticas RLS e permissões

### **Frontend:**
- ✅ ~200 componentes React
- ✅ 50+ páginas da aplicação
- ✅ 18 custom hooks especializados
- ✅ Rotas e proteções por role
- ✅ Contexts e Providers

### **Arquitetura:**
- ✅ Stack completa (React, TypeScript, Supabase, Tailwind)
- ✅ Padrões de código do projeto
- ✅ Fluxos de dados e negócio
- ✅ Sistema de autenticação e permissões
- ✅ Integrações (Mapbox, PWA, Notificações)

**Isso significa:** O Cursor consegue criar funcionalidades que se integram perfeitamente com o código existente!

---

## 📝 **TEMPLATE PARA PEDIDOS**

### **Template Simples (Copie e Cole):**

```markdown
🎯 FUNCIONALIDADE: [Nome curto e descritivo]

📝 DESCRIÇÃO:
[Explique o que a funcionalidade faz e como deve funcionar]

👥 USUÁRIOS:
[Quem vai usar? Marque com X]
- [ ] Master Admin
- [ ] Store Admin
- [ ] Delivery Driver
- [ ] Cliente
- [ ] Público (sem login)

📍 ONDE APARECE:
[Em quais telas/páginas deve aparecer]

⚙️ REGRAS DE NEGÓCIO:
- [Regra 1: Como deve funcionar]
- [Regra 2: Validações necessárias]
- [Regra 3: Comportamentos esperados]

💡 OBSERVAÇÕES: (opcional)
[Qualquer detalhe adicional, inspiração ou dúvida]
```

---

## 🎯 **INFORMAÇÕES NECESSÁRIAS**

### **1️⃣ Descrição da Funcionalidade**

**✅ BOM:**
> "Quero criar um sistema de avaliações onde os clientes podem avaliar os produtos com estrelas (1-5) e comentários. Essas avaliações devem aparecer na página do produto e o admin deve poder moderar (aprovar/reprovar)."

**❌ RUIM:**
> "Quero avaliações"

**💡 Dica:** Seja específico! Quanto mais detalhes, melhor o resultado.

---

### **2️⃣ Quem Vai Usar?**

Marque todos que se aplicam:

| Role | Quando Usar |
|------|-------------|
| **Master Admin** | Gestão global, configurações do sistema |
| **Store Admin** | Gestão da própria loja, produtos, pedidos |
| **Delivery Driver** | Entregas, rotas, ganhos |
| **Cliente** | Fazer pedidos, ver histórico, avaliar |
| **Público** | Sem login, visualização de cardápio |

**Exemplo:**
> "Clientes logados podem avaliar. Admins da loja podem moderar."

---

### **3️⃣ Onde Deve Aparecer?**

Seja específico sobre a localização na interface:

**✅ Exemplos claros:**
- "Na página do produto, abaixo da descrição"
- "No dashboard admin, criar nova aba no menu lateral"
- "No checkout, antes de confirmar o pedido"
- "No painel do cliente, na aba 'Meus Pedidos'"

**❌ Vago:**
- "No sistema"
- "Onde fizer sentido"

---

### **4️⃣ Regras de Negócio**

**Perguntas para te ajudar:**

#### **Permissões:**
- Quem pode criar/editar/deletar?
- Precisa de aprovação?
- Tem limite de ações por usuário?

#### **Validações:**
- Campos obrigatórios?
- Limites de caracteres/valores?
- Formatos específicos?

#### **Comportamentos:**
- O que acontece quando [ação X]?
- Como deve calcular [valor Y]?
- Quando deve enviar notificação?

**Exemplo completo:**
```markdown
⚙️ REGRAS:
- Cliente só pode avaliar produtos que comprou
- Uma avaliação por produto por cliente
- Comentário: mínimo 10 caracteres, máximo 500
- Avaliações ficam pendentes até aprovação do admin
- Média de estrelas é calculada automaticamente
- Notificar admin quando há nova avaliação pendente
```

---

### **5️⃣ Dados Necessários (Opcional)**

**Não sabe quais dados guardar?** Sem problema! 

O Cursor pode sugerir a estrutura baseado na funcionalidade descrita.

**Mas se souber, ajuda:**
```markdown
💾 DADOS:
- Campo 1: tipo (ex: texto, número, data)
- Campo 2: tipo
- Relações com outras tabelas
```

---

## 💡 **EXEMPLOS PRÁTICOS**

### **Exemplo 1: Sistema de Fidelidade**

```markdown
🎯 FUNCIONALIDADE: Programa de Fidelidade

📝 DESCRIÇÃO:
Sistema onde clientes acumulam pontos a cada compra e podem 
trocar por descontos em pedidos futuros.

👥 USUÁRIOS:
- [X] Store Admin (configurar programa, ver ranking)
- [X] Cliente (ver pontos, resgatar)

📍 ONDE APARECE:
- Painel do cliente: Card com saldo de pontos
- Checkout: Opção "Usar pontos" antes de finalizar
- Dashboard admin: Nova página "Fidelidade" com ranking

⚙️ REGRAS:
- A cada R$ 10 em compras = 1 ponto
- 100 pontos = R$ 10 de desconto
- Pontos são creditados quando pedido é entregue
- Pontos expiram após 6 meses
- Cliente vê histórico de pontos ganhos e usados
- Admin pode ajustar pontos manualmente (com justificativa)

💡 OBSERVAÇÕES:
Inspiração: Programa de pontos do Starbucks
```

---

### **Exemplo 2: Agendamento de Pedidos**

```markdown
🎯 FUNCIONALIDADE: Agendamento de Pedidos

📝 DESCRIÇÃO:
Permitir que clientes façam pedidos para serem entregues 
em data e hora futura (até 7 dias de antecedência).

👥 USUÁRIOS:
- [X] Cliente (fazer pedido agendado)
- [X] Store Admin (ver pedidos agendados)

📍 ONDE APARECE:
- Checkout: Adicionar step "Quando deseja receber?"
- Painel cliente: Ver pedidos agendados
- Dashboard admin: Nova aba "Pedidos Agendados"

⚙️ REGRAS:
- Mínimo 2 horas de antecedência
- Máximo 7 dias de antecedência
- Horário deve estar dentro do funcionamento da loja
- Notificar loja 1 hora antes do horário agendado
- Cliente pode cancelar até 1 hora antes
- Mostrar contador regressivo no painel do cliente

💡 OBSERVAÇÕES:
Ver se é possível integrar com calendário do Google
```

---

### **Exemplo 3: Chat de Suporte**

```markdown
🎯 FUNCIONALIDADE: Chat Interno de Suporte

📝 DESCRIÇÃO:
Sistema de chat em tempo real entre cliente e loja para 
tirar dúvidas sobre produtos e pedidos.

👥 USUÁRIOS:
- [X] Cliente (iniciar chat, enviar mensagens)
- [X] Store Admin (responder chats)

📍 ONDE APARECE:
- Site público: Botão flutuante "Ajuda" canto inferior direito
- Painel cliente: Aba "Mensagens"
- Dashboard admin: Aba "Chat" com lista de conversas

⚙️ REGRAS:
- Chat disponível apenas em horário de funcionamento
- Fora do horário: mostrar formulário de contato
- Notificar loja quando cliente envia mensagem
- Notificar cliente quando loja responde
- Histórico de conversas salvo
- Marcar como "resolvido" quando finalizar atendimento
- Cliente pode avaliar atendimento (estrelas)

💡 OBSERVAÇÕES:
Pode usar Supabase Realtime para as mensagens em tempo real
```

---

## 🎨 **IDEIAS DE FUNCIONALIDADES**

### **📊 Relatórios e Analytics**
- Dashboard de vendas por período
- Ranking de produtos mais vendidos
- Análise de clientes recorrentes (RFM)
- Mapa de calor de pedidos por região
- Previsão de demanda (ML básico)
- Comparativo mês atual vs anterior

### **🎁 Marketing e Vendas**
- Sistema de cupons avançado (primeira compra, aniversário)
- Programa de fidelidade (pontos)
- Cashback automático para clientes
- Indicação de amigos (referral com bônus)
- Flash sales (promoções relâmpago)
- Upsell/Cross-sell no checkout

### **📦 Gestão de Pedidos**
- Agendamento de pedidos recorrentes
- Pedidos por atacado (mínimo de itens)
- Combo de produtos com desconto
- Split de pedido (múltiplos pagamentos)
- Rastreamento ao vivo com GPS
- Tempo estimado de entrega dinâmico

### **👥 Gestão de Clientes**
- Segmentação de clientes (VIP, novos, inativos)
- Sistema de avaliações de produtos
- Wishlist/Lista de desejos
- Programa VIP com benefícios
- Newsletter personalizada
- Histórico de preferências

### **🚚 Delivery Avançado**
- Múltiplos entregadores simultâneos
- Sistema de gorjetas
- Avaliação do entregador
- Roteirização otimizada
- Recompensas para entregadores (gamificação)
- Seguro de entrega

### **💳 Pagamentos**
- Integração PIX completa
- Split de pagamento (dividir com amigos)
- Crédito para clientes (fiado digital)
- Assinaturas recorrentes
- Pagamento via cartão de crédito (API Stripe/Mercado Pago)
- Cashless (saldo em conta)

### **📱 Experiência do Usuário**
- Temas personalizados por loja
- Multi-idioma (PT, EN, ES)
- Modo acessibilidade (alto contraste, font size)
- Tour guiado para novos usuários
- Onboarding interativo
- Atalhos de teclado

### **🔔 Notificações e Comunicações**
- WhatsApp automático (status do pedido)
- Email marketing com templates
- SMS para pedidos urgentes
- Push notifications avançadas (segmentadas)
- Lembretes de carrinho abandonado
- Notificações de promoções personalizadas

### **🔧 Automações**
- Fechamento automático fora do horário
- Ajuste de preços por horário (happy hour)
- Promoções automáticas (estoque encalhado)
- Estoque baixo = produto offline
- Re-ordem automática de estoque
- Backup automático de dados

### **🎮 Gamificação**
- Sistema de badges/conquistas
- Ranking de clientes
- Desafios semanais (compre X, ganhe Y)
- Missões (complete 5 pedidos = desconto)
- Níveis de cliente (Bronze, Prata, Ouro)
- Rodas da sorte/Scratch cards

---

## 🎯 **MODOS DE TRABALHO**

### **1. Modo Planejador** 🧠

**Quando usar:** Funcionalidades complexas ou quando não tem certeza dos detalhes.

**Como funciona:**
1. Você descreve a ideia geral
2. Cursor analisa e faz 4-6 perguntas esclarecedoras
3. Cursor propõe plano de ação completo
4. Você aprova ou pede ajustes
5. Cursor implementa tudo

**Exemplo de pedido:**
> "Quero entrar no **Modo Planejador** para criar um sistema de fidelidade"

---

### **2. Modo Executor** ⚡

**Quando usar:** Você já sabe exatamente o que quer.

**Como funciona:**
1. Você descreve detalhadamente
2. Cursor implementa direto
3. Mostra o resultado
4. Ajusta se necessário

**Exemplo de pedido:**
> "Implemente direto: [descrição completa usando o template]"

---

### **3. Modo Consultor** 💡

**Quando usar:** Quer sugestões ou analisar viabilidade.

**Como funciona:**
1. Você expõe o problema ou objetivo
2. Cursor sugere soluções
3. Analisa viabilidade e complexidade
4. Compara opções
5. Você escolhe e ele implementa

**Exemplo de pedido:**
> "Quero aumentar vendas recorrentes. Me sugira funcionalidades."

---

### **4. Modo Depurador** 🐛

**Quando usar:** Algo não está funcionando como esperado.

**Como funciona:**
1. Você descreve o problema
2. Cursor analisa 5-7 possíveis causas
3. Adiciona logs e testa
4. Identifica e corrige o bug
5. Remove logs extras

**Exemplo de pedido:**
> "Entre no **Modo Depurador** - as notificações não estão funcionando"

---

## ✅ **CHECKLIST DE QUALIDADE**

Antes de pedir uma funcionalidade, verifique:

### **Descrição:**
- [ ] Expliquei claramente o que a funcionalidade faz?
- [ ] Dei exemplos de uso?
- [ ] Mencionei onde deve aparecer?

### **Usuários:**
- [ ] Defini quem vai usar (roles)?
- [ ] Especifiquei permissões necessárias?

### **Regras:**
- [ ] Listei as principais validações?
- [ ] Defini comportamentos esperados?
- [ ] Mencionei casos especiais/exceções?

### **Integração:**
- [ ] Pensei em como interage com funcionalidades existentes?
- [ ] Considerei notificações necessárias?

**Quanto mais itens marcados, melhor o resultado! ✅**

---

## 💬 **COMO PEDIR**

### **Formato Livre:**
Você pode simplesmente conversar! Exemplo:

> "Quero criar um sistema onde clientes podem avaliar produtos. Como faço isso?"

**O Cursor vai:**
- Te fazer perguntas
- Sugerir estrutura
- Propor implementação

---

### **Formato Estruturado:**
Use o template deste guia para pedidos mais complexos.

---

### **Iterativo:**
Comece simples e vá refinando:

> "Quero avaliações de produtos"

Cursor pergunta detalhes...

> "Só clientes que compraram podem avaliar"

Cursor ajusta...

> "Adiciona também fotos nas avaliações"

E assim vai evoluindo! 🚀

---

## 🎯 **RESUMO PRÁTICO**

### **Para Começar:**

1. **Copie o template** no início deste arquivo
2. **Preencha** com sua ideia
3. **Envie** para o Cursor
4. **Acompanhe** a implementação
5. **Teste** e peça ajustes se necessário

### **Dicas Finais:**

- ✅ Seja específico, mas não se preocupe com detalhes técnicos
- ✅ Use exemplos de outros sistemas como referência
- ✅ Mencione integrações com funcionalidades existentes
- ✅ Pergunte se tiver dúvidas sobre viabilidade
- ✅ Teste sempre após implementação

---

## 📞 **EXEMPLOS DE PEDIDOS RÁPIDOS**

### **Simples:**
> "Adiciona um botão de WhatsApp flutuante no cardápio público"

### **Médio:**
> "Cria uma página de relatório de vendas com gráfico de linha mostrando vendas dos últimos 30 dias"

### **Complexo:**
> "Implementa sistema completo de cashback: 5% do valor do pedido volta como crédito na conta do cliente para usar na próxima compra"

---

## 🎁 **BÔNUS: ATALHOS MENTAIS**

### **Para cada funcionalidade, pense:**

1. **O quê?** - O que a funcionalidade faz
2. **Quem?** - Quem vai usar
3. **Onde?** - Em qual tela aparece
4. **Como?** - Regras de negócio
5. **Quando?** - Em que momento/contexto

**Responda essas 5 perguntas e terá um pedido completo!** ✨

---

## 📚 **DOCUMENTAÇÃO DE REFERÊNCIA**

### **Arquivos Úteis do Projeto:**
- `README.md` - Visão geral completa
- `COMO_INICIAR.md` - Como rodar o servidor
- `rules/` - Padrões de código
- `supabase/migrations/` - Estrutura do banco

### **Estrutura de Pastas:**
- `src/components/` - Componentes reutilizáveis
- `src/pages/` - Páginas da aplicação
- `src/hooks/` - Custom hooks
- `src/utils/` - Funções utilitárias

---

## 🚀 **PRONTO PARA COMEÇAR!**

Agora você tem tudo que precisa para pedir funcionalidades de forma eficiente.

**Lembre-se:** Quanto mais claro o pedido, melhor e mais rápido será o resultado!

---

**Última atualização:** 22/11/2024

**Criado com ❤️ para facilitar o desenvolvimento do Mostralo**

