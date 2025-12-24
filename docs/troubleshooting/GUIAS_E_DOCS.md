# 📚 Guias e Documentação - Mostralo

> **Índice de todos os guias, documentação e arquivos de referência do projeto.**

---

## 🚀 **INÍCIO RÁPIDO**

### **Para Começar:**

1. **[COMO_INICIAR.md](./COMO_INICIAR.md)** ⭐
   - Como iniciar o servidor
   - Comandos úteis
   - Troubleshooting básico
   - Scripts automáticos

2. **[README.md](./README.md)** 📖
   - Visão geral completa do projeto
   - Tecnologias utilizadas
   - Estrutura detalhada
   - Deploy e configuração

---

## 🛠️ **DESENVOLVIMENTO**

### **Criar Novas Funcionalidades:**

3. **[COMO_PEDIR_FUNCIONALIDADES.md](./COMO_PEDIR_FUNCIONALIDADES.md)** 🎯
   - Guia completo de como pedir features
   - O que o Cursor já sabe
   - Informações necessárias
   - Exemplos práticos
   - Modos de trabalho

4. **[TEMPLATES_FUNCIONALIDADES.md](./TEMPLATES_FUNCIONALIDADES.md)** 📋
   - 10+ templates prontos para copiar
   - Templates para: páginas, relatórios, CRUD, integrações, etc
   - Preencha e envie!

---

## 📧 **TEMPLATES DE EMAIL**

5. **[email-templates/INDEX.md](./email-templates/INDEX.md)** 📧 ⭐
   - Índice completo dos templates
   - Status de implementação
   - Navegação rápida

6. **[email-templates/COMO_CONFIGURAR_SUPABASE.md](./email-templates/COMO_CONFIGURAR_SUPABASE.md)** 🛠️
   - Passo a passo configuração Supabase
   - Como aplicar templates
   - SMTP customizado
   - Troubleshooting

7. **[email-templates/PREVIEW.md](./email-templates/PREVIEW.md)** 👁️
   - Visualização dos designs
   - Anatomia dos elementos
   - Paleta de cores
   - Dimensões e layouts

8. **[email-templates/README.md](./email-templates/README.md)** 📖
   - Visão geral dos templates
   - Identidade visual
   - Boas práticas
   - Templates futuros

**Templates Disponíveis:**
- ✅ Welcome (Boas-vindas) - `welcome-account-created.html`
- ✅ Password Reset (Recuperação) - `password-reset.html`
- ✅ Magic Link (Login rápido) - `magic-link.html`

---

## ⚙️ **FUNCIONALIDADES IMPLEMENTADAS**

9. **[MASCARA_TELEFONE.md](./MASCARA_TELEFONE.md)** 📱
   - Máscara automática de telefone
   - Validação de telefone fixo e celular
   - Formatação em tempo real: `(00) 00000-0000`
   - Implementação técnica completa

9.1. **[MASCARA_CPF_CNPJ.md](./MASCARA_CPF_CNPJ.md)** 🆔
     - Máscara automática de CPF/CNPJ
     - Detecção automática (CPF ou CNPJ)
     - Validação de dígitos verificadores
     - Formatação: `000.000.000-00` ou `00.000.000/0000-00`
     - Algoritmo oficial da Receita Federal

10. **[FUNCIONALIDADE_CADASTRO_COM_APROVACAO.md](./FUNCIONALIDADE_CADASTRO_COM_APROVACAO.md)** 🎫
    - Sistema completo de cadastro com pagamento
    - Aprovação de novos assinantes
    - Integração com Pix
    - Fluxo de aprovação pelo super admin

10.1. **[FLUXO_APROVACAO_ASSINANTES.md](./FLUXO_APROVACAO_ASSINANTES.md)** ✅ ⭐
     - Fluxo completo de aprovação/rejeição
     - Aprovação: cria invoice automaticamente
     - Rejeição: motivo obrigatório (>= 10 chars)
     - Liberação de funcionalidades para lojista
     - Invoice aparece em "Todas as Faturas"
     - Contador de caracteres em tempo real

10.2. **[CICLOS_COBRANCA_PLANOS.md](./CICLOS_COBRANCA_PLANOS.md)** 📅 ⭐
     - Enum billing_cycle_type (monthly, quarterly, biannual, annual)
     - Interface de edição com Select atualizado
     - Funções helper para tradução PT-BR e cálculo de dias
     - Função RPC approve_payment corrigida
     - Cálculo automático de subscription_expires_at

10.3. **[ABAS_EDICAO_PLANOS.md](./ABAS_EDICAO_PLANOS.md)** 🎨 ⭐
     - 3 abas completas: Básico, Recursos, Configurações
     - Aba Básico: Ciclo de Cobrança com 4 opções
     - Aba Recursos: Lista dinâmica de recursos do plano
     - Aba Configurações: Switch "Mais Popular"
     - Componentes Tabs e Switch do Shadcn/ui
     - Salvamento de is_popular e features (JSONB)

10.4. **[INTEGRACAO_PLANOS_PUBLICO.md](./INTEGRACAO_PLANOS_PUBLICO.md)** 🔗 ⭐
     - Sincronização entre admin e página pública
     - Badge "Mais Popular" em ambas as páginas
     - Filtragem de planos ativos (status='active')
     - Query dinâmica do banco de dados
     - Planos inativos não aparecem para venda
     - Link "Começar Agora" para /signup

11. **[PROTECAO_AUTENTICACAO_CARRINHO.md](./PROTECAO_AUTENTICACAO_CARRINHO.md)** 🔐 ⭐
     - Sistema completo de proteção por autenticação
     - Exige login antes de adicionar ao carrinho
     - Verificação via localStorage (customer_{storeId})
     - Implementado em ProductPage.tsx e ProductDetail.tsx
     - Dialogs de autenticação automáticos
     - Fluxo completo com callbacks e toasts

12. **[CORRECAO_ASSINATURA_BLOQUEADA.md](./CORRECAO_ASSINATURA_BLOQUEADA.md)** 🔧 ⭐
     - Correção para assinaturas sem data de expiração
     - Tratamento de NULL como ilimitado/ativo
     - Script SQL para diagnóstico e correção
     - Lógica atualizada no AdminSidebar.tsx
     - Solução que não quebra funcionalidades existentes
     - Previne bloqueio de usuários com plano ativo

12.1. **[CORRECAO_APPROVAL_STATUS.md](./CORRECAO_APPROVAL_STATUS.md)** 🔓 ⭐⭐
     - Correção para usuários bloqueados por approval_status
     - Sistema de dupla verificação (assinatura + aprovação)
     - Script SQL completo (FIX_APPROVAL_STATUS.sql)
     - Como aprovar usuários via interface ou SQL
     - Diagnóstico de todos os bloqueios possíveis
     - Previne bloqueio mesmo com plano ativo

12.2. **[SOLUCAO_CRIACAO_LOJISTA.md](./SOLUCAO_CRIACAO_LOJISTA.md)** 🛠️ ⭐⭐
     - Correção para lojistas criados pelo super admin
     - Agora já criam com approval_status='approved'
     - Diferença entre cadastro normal vs criado pelo admin
     - CreateStoreOwnerDialog.tsx corrigido
     - Script SQL para corrigir ingabeachsports (CORRIGIR_INGABEACHSPORTS.sql)
     - Não quebra fluxo de aprovação de cadastros normais

12.3. **[EXECUTAR_SQL_SUPABASE.md](./EXECUTAR_SQL_SUPABASE.md)** 📋 ⭐
     - Guia passo a passo para executar SQL no Dashboard
     - Prints visuais e instruções detalhadas
     - Troubleshooting completo
     - Tempo estimado: menos de 2 minutos
     - SQL pronto para copiar e colar
     - Verificação de resultados

13. **[FUNCIONALIDADE_RESET_SENHA.md](./FUNCIONALIDADE_RESET_SENHA.md)** 🔐
    - Reset de senha por super admin
    - Envio de email de recuperação
    - Edge Function implementada

14. **[SOLUCOES_LOGIN_CLIENTE.md](./SOLUCOES_LOGIN_CLIENTE.md)** 🔐 ⭐
    - Soluções para problemas de login de clientes
    - Diagnóstico de erros de autenticação
    - Rate limiting e bloqueio temporário
    - Guia completo de troubleshooting
    - 4 cenários principais e soluções

14.1. **[DIAGNOSTICO_CLIENTE.sql](./DIAGNOSTICO_CLIENTE.sql)** 🔍
     - Script SQL completo para diagnóstico
     - Verifica se cliente existe
     - Status do auth_user_id
     - Bloqueio temporário (banned_until)
     - Histórico de tentativas
     - Soluções SQL para desbloqueio

14.2. **[SOLUCAO_FINAL_LOGIN.md](./SOLUCAO_FINAL_LOGIN.md)** 🎯 ⭐⭐⭐
     - Solução definitiva para problemas de login
     - Diagnóstico: clientes com e sem auth_user_id
     - Edge Function retornando 401 (Unauthorized)
     - Deploy manual via Dashboard
     - Clientes precisam recriar conta sem senha
     - Checklist completo de teste

14.3. **[FIX_EDGE_FUNCTION_401.md](./FIX_EDGE_FUNCTION_401.md)** 🔧
     - Código completo da Edge Function
     - Instruções de deploy passo a passo
     - Desabilitar Verify JWT
     - Teste após deploy

14.4. **[deploy-customer-auth.ps1](./deploy-customer-auth.ps1)** 🚀
     - Script PowerShell helper
     - Abre arquivo no Notepad
     - Instruções visuais
     - Checklist de deploy

15. **[GERENCIAMENTO_CLIENTES_COMPLETO.md](./GERENCIAMENTO_CLIENTES_COMPLETO.md)** 👥 ⭐⭐⭐
    - Sistema completo de gerenciamento de clientes
    - Página AdminCustomersPage.tsx com listagem e busca
    - Reset de senha pelo admin
    - Edge Function reset-customer-password
    - Preservação de histórico de pedidos
    - Badges de status (com/sem senha)
    - SQL para atualizar clientes existentes

15.1. **[FIX_CLIENTES_SENHAS.sql](./FIX_CLIENTES_SENHAS.sql)** 🔧
     - Atualizar senha dos clientes 22222222222 e 33333333333
     - Define senha como 112233
     - Verifica auth_user_id
     - Mantém histórico completo
     - Solução imediata para clientes bloqueados

11.1. **[TROUBLESHOOTING_CADASTRO.md](./TROUBLESHOOTING_CADASTRO.md)** 🔧
     - Resolver "Lojista sem loja vinculada"
     - Usuário preso no sistema
     - Como deletar usuários incompletos
     - Comandos SQL úteis
     - Prevenção de problemas

11.2. **[CORRECOES_COMPROVANTE_E_APROVACOES.md](./CORRECOES_COMPROVANTE_E_APROVACOES.md)** 🔧
     - Correção de bucket privado (payment-proofs → subscription-receipts)
     - Query de payment_approvals corrigida
     - Comprovantes agora aparecem
     - Novos assinantes visíveis no super admin

---

## 👥 **USUÁRIOS E ACESSO**

12. **[CRIAR_USUARIOS_REAIS.md](./CRIAR_USUARIOS_REAIS.md)** 👤
    - Como criar usuários para teste
    - Tipos de usuário (roles)
    - Passo a passo

13. **[USUARIOS_EXEMPLO.md](./USUARIOS_EXEMPLO.md)** 👥
    - Exemplos de usuários
    - Credenciais de teste

---

## 📐 **PADRÕES E CONVENÇÕES**

### **Regras de Código (Pasta `rules/`):**

14. **[rules/React.mdc](./rules/React.mdc)** ⚛️
    - Padrões React do projeto
    - Boas práticas
    - Estrutura de componentes

15. **[rules/TypeScript.mdc](./rules/TypeScript.mdc)** 🔷
    - Convenções TypeScript
    - Tipos e interfaces
    - Validações

16. **[rules/Supabase.mdc](./rules/Supabase.mdc)** 🗄️
    - Integração com Supabase
    - RLS policies
    - Edge Functions

17. **[rules/Performance.mdc](./rules/Performance.mdc)** ⚡
    - Otimizações
    - Best practices
    - Performance tips

18. **[rules/Prioridade.mdc](./rules/Prioridade.mdc)** 🎯
    - Prioridades do projeto
    - Ordem de implementação

19. **[rules/Basicas.mdc](./rules/Basicas.mdc)** 📝
    - Regras básicas
    - Convenções gerais

20. **[rules/Claude.mdc](./rules/Claude.mdc)** 🤖
    - Guia para Claude AI

21. **[rules/GPT-4.1.mdc](./rules/GPT-4.1.mdc)** 🤖
    - Guia para GPT-4

22. **[rules/Gemini.mdc](./rules/Gemini.mdc)** 🤖
    - Guia para Gemini AI

---

## 🔧 **SCRIPTS UTILITÁRIOS**

23. **[iniciar-mostralo.bat](./iniciar-mostralo.bat)** 🖱️
    - Script Windows (duplo clique)
    - Inicia servidor automaticamente

24. **[iniciar-mostralo.ps1](./iniciar-mostralo.ps1)** 💻
    - Script PowerShell avançado
    - Verifica porta, libera se necessário
    - Tratamento de erros

---

## 📊 **CONFIGURAÇÃO**

18. **[package.json](./package.json)** 📦
    - Dependências do projeto
    - Scripts disponíveis

19. **[vite.config.ts](./vite.config.ts)** ⚙️
    - Configuração do Vite
    - Porta do servidor
    - PWA settings

20. **[tailwind.config.ts](./tailwind.config.ts)** 🎨
    - Configuração do Tailwind
    - Temas e cores
    - Plugins

21. **[tsconfig.json](./tsconfig.json)** 🔷
    - Configuração TypeScript
    - Paths e aliases

---

## 🗄️ **BANCO DE DADOS**

### **Supabase:**

22. **[supabase/migrations/](./supabase/migrations/)** 📁
    - 109 migrations SQL
    - Histórico de mudanças no banco

23. **[supabase/functions/](./supabase/functions/)** ⚡
    - 14 Edge Functions
    - Lógica server-side

24. **[supabase/config.toml](./supabase/config.toml)** ⚙️
    - Configuração do projeto Supabase
    - Project ID e settings

---

## 📱 **PWA**

25. **[public/manifest.json](./public/manifest.json)** 📱
    - Manifest da PWA
    - Ícones e configurações

26. **[public/sw.js](./public/sw.js)** 🔧
    - Service Worker
    - Cache e notificações

27. **[public/sounds/](./public/sounds/)** 🔔
    - 8 sons de notificação
    - Personalizáveis

---

## 🎨 **ASSETS**

28. **[public/favicon.png](./public/favicon.png)** 🖼️
    - Ícone da aplicação

29. **[public/placeholder.svg](./public/placeholder.svg)** 🖼️
    - Placeholder para imagens

30. **[public/robots.txt](./public/robots.txt)** 🤖
    - SEO e crawlers

---

## 📂 **ESTRUTURA DE PASTAS**

```
.mostralo/
├── 📖 Documentação (você está aqui)
│   ├── README.md
│   ├── COMO_INICIAR.md
│   ├── COMO_PEDIR_FUNCIONALIDADES.md
│   ├── TEMPLATES_FUNCIONALIDADES.md
│   ├── GUIAS_E_DOCS.md
│   ├── CRIAR_USUARIOS_REAIS.md
│   └── USUARIOS_EXEMPLO.md
│
├── 🎯 Scripts
│   ├── iniciar-mostralo.bat
│   └── iniciar-mostralo.ps1
│
├── ⚙️ Configuração
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── components.json
│
├── 📐 Regras (rules/)
│   ├── React.mdc
│   ├── TypeScript.mdc
│   ├── Supabase.mdc
│   ├── Performance.mdc
│   └── ...
│
├── 💻 Código (src/)
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── contexts/
│   ├── utils/
│   ├── types/
│   ├── lib/
│   ├── integrations/
│   └── config/
│
├── 🗄️ Backend (supabase/)
│   ├── migrations/
│   ├── functions/
│   └── config.toml
│
└── 📱 Assets (public/)
    ├── sounds/
    ├── manifest.json
    ├── sw.js
    └── ...
```

---

## 🔍 **BUSCA RÁPIDA**

### **Procurando por algo específico?**

| Quero... | Arquivo |
|----------|---------|
| Iniciar servidor | `COMO_INICIAR.md` |
| Criar funcionalidade | `COMO_PEDIR_FUNCIONALIDADES.md` |
| Template pronto | `TEMPLATES_FUNCIONALIDADES.md` |
| Entender estrutura | `README.md` |
| Ver padrões React | `rules/React.mdc` |
| Criar usuário | `CRIAR_USUARIOS_REAIS.md` |
| Configurar Supabase | `rules/Supabase.mdc` |
| Ver migrations | `supabase/migrations/` |
| Personalizar tema | `src/index.css` |
| Adicionar componente | `src/components/` |
| Criar página | `src/pages/` |
| Novo hook | `src/hooks/` |

---

## 📞 **AJUDA RÁPIDA**

### **Comandos Mais Usados:**

```bash
# Iniciar servidor
bun run dev

# Build para produção
bun run build

# Linting
bun run lint

# Ver versão do Bun
bun --version
```

### **URLs Importantes:**

- Local: http://localhost:5173
- Login Admin: http://localhost:5173/auth
- Dashboard: http://localhost:5173/dashboard

---

## 🆘 **PROBLEMAS COMUNS**

### **Servidor não inicia:**
→ Ver `COMO_INICIAR.md` seção "Problemas Comuns"

### **Porta em uso:**
→ Usar `iniciar-mostralo.ps1` (libera automaticamente)

### **Erro no banco:**
→ Ver `rules/Supabase.mdc` e verificar credenciais

### **Componente quebrado:**
→ Ver `rules/React.mdc` para padrões

---

## 🎓 **PARA NOVOS DESENVOLVEDORES**

### **Roteiro de Onboarding:**

1. ✅ Ler `README.md` (visão geral)
2. ✅ Seguir `COMO_INICIAR.md` (ambiente)
3. ✅ Ler `rules/Basicas.mdc` (convenções)
4. ✅ Ler `rules/React.mdc` (padrões React)
5. ✅ Criar usuário teste (CRIAR_USUARIOS_REAIS.md)
6. ✅ Navegar pelo sistema
7. ✅ Ler `COMO_PEDIR_FUNCIONALIDADES.md`
8. ✅ Criar primeira feature! 🚀

**Tempo estimado:** 1-2 horas

---

## 💡 **DICAS**

- 📌 **Favoritos:** Marque este arquivo para acesso rápido
- 🔍 **Ctrl+F:** Use busca para encontrar rapidamente
- 📱 **Mobile:** Todos os .md são legíveis no celular
- 🔄 **Atualizado:** Este índice é mantido sempre atual

---

## 🤝 **CONTRIBUINDO**

Encontrou algo desatualizado ou faltando?

1. Edite o arquivo
2. Atualize este índice
3. Commit com mensagem clara
4. Todos agradecem! 🙏

---

## 📊 **ESTATÍSTICAS**

- **Total de Guias:** 30+ arquivos
- **Linhas de Documentação:** ~10.000+
- **Templates Disponíveis:** 10+
- **Última Atualização:** 22/11/2024

---

## 🎯 **PRÓXIMOS PASSOS**

**Agora que você conhece toda a documentação:**

1. 🚀 **[Inicie o servidor](./COMO_INICIAR.md)**
2. 🎯 **[Crie sua primeira funcionalidade](./COMO_PEDIR_FUNCIONALIDADES.md)**
3. 📋 **[Use os templates](./TEMPLATES_FUNCIONALIDADES.md)**

---

<div align="center">

**Documentação completa do Mostralo** 📚

Criado com ❤️ para facilitar o desenvolvimento

[⬆️ Voltar ao Topo](#-guias-e-documentação---mostralo)

</div>

