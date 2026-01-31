

# Plano Completo: Sistema de Atendimento Inteligente com FAQ Dinamico

## Visao Geral

Implementar um sistema onde o Bot Master usa OpenAI Assistants com function calling para consultar uma base de conhecimento dinamica (FAQ) armazenada no banco de dados, respondendo EXCLUSIVAMENTE sobre o Mostralo.

---

## Arquitetura do Sistema

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DE ATENDIMENTO                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Cliente              Evolution API           OpenAI              Supabase  │
│  ┌──────┐            ┌────────────┐        ┌─────────┐        ┌──────────┐ │
│  │ Msg  │───────────►│ Bot Master │───────►│Assistant│───────►│master-faq│ │
│  │      │            │            │        │  API    │        │  -agent  │ │
│  │      │◄───────────│ botType:   │◄───────│         │◄───────│          │ │
│  │      │            │ assistant  │        │ Tools   │        │ Consulta:│ │
│  └──────┘            │            │        │         │        │ -master_ │ │
│                      │ functionUrl│        │         │        │  faq     │ │
│                      │ /master-faq│        │         │        │ -modules │ │
│                      │  -agent    │        │         │        │ -plans   │ │
│                      └────────────┘        └─────────┘        └──────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Menu Inicial (Apenas 2 Opcoes Visiveis)

```text
"Ola! Sou o assistente do Mostralo. Como posso ajudar?

1 - Quero conhecer o Mostralo para meu negocio
2 - Ja sou cliente e preciso de ajuda"

* RECRUTAMENTO: Detectado por keywords, NAO aparece no menu
```

---

## FASE 1: Banco de Dados

### 1.1 Criar Tabela `master_faq`

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | uuid | PK |
| category | text | 'sales', 'support', 'recruitment' |
| question | text | Pergunta principal |
| answer | text | Resposta completa |
| keywords | text[] | Palavras para matching |
| priority | int | 1-10 (maior = mais relevante) |
| is_active | boolean | Se ativa |
| metadata | jsonb | Links, valores extras |
| created_at | timestamptz | Criacao |
| updated_at | timestamptz | Atualizacao |

### 1.2 Criar Tabela `master_recruitment_keywords`

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | uuid | PK |
| keyword | text | Palavra de deteccao |
| is_active | boolean | Se ativa |

### 1.3 Keywords Padrao de Recrutamento

```text
trabalhar, vendedor, parceiro, comissao, ganhar dinheiro, 
renda extra, afiliado, representante, vender, oportunidade
```

### 1.4 Configurar RLS

- Leitura publica para consultas do bot
- Escrita apenas para master_admin

---

## FASE 2: Edge Function `master-faq-agent`

### 2.1 Criar Arquivo

**Caminho:** `supabase/functions/master-faq-agent/index.ts`

### 2.2 Tools (Functions) Disponiveis

| Funcao | Descricao | Parametros |
|--------|-----------|------------|
| `identify_intent` | Detecta vendas/suporte/parceria | message |
| `check_recruitment_keywords` | Verifica keywords ocultas | message |
| `search_faq` | Busca FAQ por categoria | query, category |
| `get_modules` | Lista os 30 modulos do Mostralo | category (opcional) |
| `get_module_details` | Detalhes de um modulo | key |
| `get_plans` | Planos com precos atuais | - |
| `calculate_savings` | Economia vs marketplace (25%) | monthly_revenue |
| `get_recruitment_link` | Retorna /seja-vendedor | - |

### 2.3 Registrar no config.toml

```toml
[functions.master-faq-agent]
verify_jwt = false
```

---

## FASE 3: Prompt do Bot Master

### 3.1 Prompt de Sistema

```text
Voce e o assistente oficial do Mostralo, uma plataforma completa de 
Delivery + Marketing Digital + Gestao Financeira.

REGRA CRITICA - ESCOPO DE RESPOSTAS:
- Voce SOMENTE responde sobre o Mostralo e seus servicos
- Se perguntarem sobre historia, politica, celebridades, esportes 
  ou qualquer assunto fora do Mostralo, responda:
  "Desculpe, sou especialista apenas no Mostralo! Posso ajudar 
  voce a conhecer nossa plataforma ou tirar duvidas se voce ja e cliente."
- NUNCA mencione concorrentes pelo nome (iFood, Rappi, etc.) 
  - use "marketplaces tradicionais"
- Mantenha o foco 100% no Mostralo

MENU INICIAL (Usar na primeira mensagem):
"Ola! Sou o assistente do Mostralo. Como posso ajudar?

1 - Quero conhecer o Mostralo para meu negocio
2 - Ja sou cliente e preciso de ajuda"

DETECCAO OCULTA DE RECRUTAMENTO:
- Se a mensagem contiver palavras como: trabalhar, vendedor, parceiro, 
  comissao, ganhar dinheiro, renda extra, afiliado, representante
- Responda: "Que legal seu interesse! Acesse nosso programa de 
  parceiros: https://mostralo.com.br/seja-vendedor"
- NAO ofereca essa opcao no menu inicial

FLUXO DE VENDAS (Opcao 1):
1. Perguntar tipo de negocio
2. Perguntar se usa marketplace
3. Se sim, calcular economia com calculate_savings()
4. Mostrar planos com get_plans()
5. Listar modulos relevantes com get_modules()

FLUXO DE SUPORTE (Opcao 2):
1. Perguntar qual o problema
2. Buscar resposta em search_faq(query, 'support')
3. Se nao encontrar, usar resposta padrao de encaminhamento

QUANDO NAO CONSEGUIR RESPONDER:
- Responda: "Entendi sua duvida! Vou encaminhar para nossa equipe 
  e um de nossos atendentes ira retornar o mais breve possivel 
  para ajuda-lo."
- NAO forneca numeros de telefone diretamente
- NAO prometa tempo especifico de resposta

SITE OFICIAL:
- https://mostralo.com.br
```

---

## FASE 4: Interface Admin - Nova Aba "FAQ"

### 4.1 Adicionar Aba na Pagina

**Arquivo:** `src/pages/admin/MasterWhatsAppPage.tsx`

```text
Tabs atuais: [Conexao] [Bots] [Sessoes] [Links]
                              |
                              v
Tabs novas:  [Conexao] [Bots] [FAQ] [Sessoes] [Links]
```

### 4.2 Componentes a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/admin/master-whatsapp/MasterFaqTab.tsx` | Aba principal |
| `src/components/admin/master-whatsapp/FaqItemCard.tsx` | Card de item FAQ |
| `src/components/admin/master-whatsapp/FaqEditModal.tsx` | Modal de edicao |
| `src/hooks/useMasterFaq.ts` | Hook CRUD |

### 4.3 Layout da Aba FAQ

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Base de Conhecimento do Bot                            [+ Nova Pergunta]  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Filtros: [Todas] [Vendas] [Recrutamento*] [Suporte]       [Buscar...]     │
│  * Recrutamento: detectado por keywords, nao aparece no menu                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ VENDAS (12 perguntas)                                               │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ "Quanto custa o Mostralo?"                            [Editar] [X]  │   │
│  │    Keywords: preco, custo, valor, plano                             │   │
│  │    Prioridade: 10                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ RECRUTAMENTO (5 perguntas) - Ativado por keywords                   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ "Como ser parceiro do Mostralo?"                      [Editar] [X]  │   │
│  │    Resposta padrao: Link /seja-vendedor                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Keywords de Deteccao (Recrutamento Oculto)            [Configurar]  │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │ [trabalhar] [vendedor] [parceiro] [comissao] [renda extra] [+]     │   │
│  │                                                                      │   │
│  │ Link padrao parceiros: /seja-vendedor                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## FASE 5: Popular Dados Iniciais

### 5.1 FAQs de Vendas

| Pergunta | Keywords | Resposta |
|----------|----------|----------|
| Quanto custa? | preco, valor, custo | Busca get_plans() |
| Tem taxa por pedido? | taxa, comissao | "0% de taxa! Apenas mensalidade fixa" |
| Quais modulos inclusos? | modulo, recurso | Busca get_modules() |
| Funciona para farmacia? | farmacia, pet, salao | Lista modulos compativeis |
| Tem teste gratis? | teste, experimentar | "7 dias gratis!" |

### 5.2 FAQs de Suporte

| Pergunta | Keywords | Resposta |
|----------|----------|----------|
| Como conectar WhatsApp? | whatsapp, conectar, qrcode | Tutorial passo a passo |
| Nao recebo pedidos | pedido, notificacao | Checklist de verificacao |
| Como mudar plano? | plano, mudar, upgrade | Instrucoes do painel |
| Como cancelar? | cancelar, cancelamento | Processo de cancelamento |

### 5.3 FAQs de Recrutamento (Oculto)

| Pergunta | Keywords | Resposta |
|----------|----------|----------|
| Como ser parceiro? | parceiro, vendedor | Link: /seja-vendedor |
| Quanto posso ganhar? | ganhar, comissao | Tabela de comissoes |
| Preciso de CNPJ? | cnpj, mei | "Nao para comecar!" |

---

## Secao Tecnica

### Arquivos a CRIAR (Novos)

| Arquivo | Descricao |
|---------|-----------|
| `supabase/functions/master-faq-agent/index.ts` | Edge Function principal |
| `src/components/admin/master-whatsapp/MasterFaqTab.tsx` | Aba de gerenciamento |
| `src/components/admin/master-whatsapp/FaqItemCard.tsx` | Card de item FAQ |
| `src/components/admin/master-whatsapp/FaqEditModal.tsx` | Modal de edicao |
| `src/hooks/useMasterFaq.ts` | Hook CRUD de FAQs |

### Arquivos a MODIFICAR (Minimo)

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/admin/MasterWhatsAppPage.tsx` | Adicionar aba "FAQ" nas Tabs |
| `supabase/config.toml` | Registrar master-faq-agent |

### Arquivos que NAO serao alterados

| Arquivo | Motivo |
|---------|--------|
| `supabase/functions/master-bot-sync/index.ts` | Continua funcionando independente |
| `supabase/functions/openai-bot-sync/index.ts` | Bot das lojas intacto |
| `supabase/functions/product-search-agent/index.ts` | Bot das lojas intacto |
| `src/components/admin/master-whatsapp/MasterBotConfigTab.tsx` | Nenhuma alteracao |

---

## Ordem de Implementacao

```text
FASE 1: Banco de Dados
   1.1 Criar tabela master_faq
   1.2 Criar tabela master_recruitment_keywords
   1.3 Popular keywords padrao
   1.4 Configurar RLS

FASE 2: Edge Function
   2.1 Criar master-faq-agent/index.ts
   2.2 Implementar todas as functions (tools)
   2.3 Registrar no config.toml
   2.4 Deploy automatico

FASE 3: Interface Admin
   3.1 Criar hook useMasterFaq
   3.2 Criar MasterFaqTab.tsx
   3.3 Criar FaqItemCard.tsx
   3.4 Criar FaqEditModal.tsx
   3.5 Adicionar aba em MasterWhatsAppPage.tsx

FASE 4: Dados Iniciais
   4.1 Popular FAQs de Vendas via interface
   4.2 Popular FAQs de Suporte via interface
   4.3 Popular FAQs de Recrutamento via interface

FASE 5: Teste
   5.1 Testar fluxo de Vendas
   5.2 Testar fluxo de Suporte
   5.3 Testar deteccao de keywords de Recrutamento
   5.4 Testar respostas fora do escopo
```

---

## Exemplo de Conversa

### Cenario: Cliente quer conhecer

```text
CLIENTE: Oi

BOT: Ola! Sou o assistente do Mostralo. Como posso ajudar?

     1 - Quero conhecer o Mostralo para meu negocio
     2 - Ja sou cliente e preciso de ajuda

CLIENTE: 1

BOT: Otimo! Vou te ajudar a conhecer o Mostralo!
     Qual tipo de negocio voce tem?

CLIENTE: farmacia

BOT: [Consulta get_modules() filtrado]
     Farmacias tem otimos resultados com o Mostralo!

     Modulos especiais para voce:
     - Catalogo Digital - Todos seus produtos online
     - Delivery - Areas de entrega com taxas
     - Sentinela - Lembrete automatico de recompra!

     Voce usa algum marketplace hoje?

CLIENTE: sim, ifood

BOT: Quanto voce fatura por mes aproximadamente?

CLIENTE: 30 mil

BOT: [Consulta calculate_savings(30000)]
     Veja a comparacao:

     Faturamento: R$ 30.000/mes
     Taxa marketplace (25%): R$ 7.500/mes
     Mostralo: R$ 397,90/mes

     Economia: R$ 7.102/mes = R$ 85.224/ano!
```

### Cenario: Deteccao de Parceria

```text
CLIENTE: Quero trabalhar com voces

BOT: [Detecta "trabalhar" = keyword de recrutamento]
     Que legal seu interesse em fazer parte do time Mostralo!

     Temos um programa de parceiros com comissoes RECORRENTES.

     Veja todos os detalhes e faca seu cadastro:
     https://mostralo.com.br/seja-vendedor
```

### Cenario: Fora do Escopo

```text
CLIENTE: Quem foi Getulio Vargas?

BOT: Desculpe, sou especialista apenas no Mostralo!

     Posso ajudar voce a:
     1 - Conhecer nossa plataforma para seu negocio
     2 - Tirar duvidas se voce ja e cliente

     Como posso ajudar?
```

### Cenario: Bot Nao Sabe Responder

```text
CLIENTE: Meu relatorio de vendas esta com erro X

BOT: [Busca search_faq() - nao encontra]
     Entendi sua duvida! Vou encaminhar para nossa equipe 
     e um de nossos atendentes ira retornar o mais breve 
     possivel para ajuda-lo.
```

---

## Garantia de Seguranca

| Verificacao | Status |
|-------------|--------|
| master-bot-sync alterado? | NAO |
| openai-bot-sync alterado? | NAO |
| product-search-agent alterado? | NAO |
| MasterBotConfigTab alterado? | NAO |
| Bot das lojas afetado? | NAO |
| Apenas arquivos NOVOS criados? | SIM |

