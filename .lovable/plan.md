
# Plano: Corrigir Links Legais e Atualizar Informações Empresariais

## Situação Atual

### Links do Footer (MainFooter.tsx)
| Link Atual | Rota Correta | Status |
|------------|--------------|--------|
| `/privacy` | `/privacidade` | CORRIGIR |
| `/terms` | `/termos` | CORRIGIR |
| `/lgpd` | - | CRIAR PÁGINA |
| `/cookies` | - | CRIAR PÁGINA |

### Informações Empresariais
- CNPJ: XX.XXX.XXX/0001-XX (placeholder)
- Responsável: Mostralo Tecnologia LTDA (genérico)
- Localização: apenas "Brasil"

---

## Alterações Planejadas

### 1. Corrigir MainFooter.tsx

**Links Legais:**
- `/privacy` → `/privacidade`
- `/terms` → `/termos`
- `/lgpd` → `/lgpd` (nova página)
- `/cookies` → `/cookies` (nova página)

**Informações Empresariais:**
- CNPJ: 51.691.995/0001-15
- Responsável: Marcos Henrique da Silva Andrade
- Localização: Brasília - DF, Brasil
- Adicionar: Experiência Internacional (Brasil, Estados Unidos e Suíça)

---

### 2. Criar Página LGPD (`src/pages/LGPD.tsx`)

Conteúdo sobre:
- O que é a LGPD
- Base legal para tratamento de dados
- Direitos do titular (acesso, correção, exclusão, portabilidade)
- Como exercer seus direitos
- Encarregado de Dados (DPO)
- Canal de atendimento

---

### 3. Criar Página Cookies (`src/pages/Cookies.tsx`)

Conteúdo sobre:
- O que são cookies
- Tipos de cookies utilizados (essenciais, funcionais, analíticos)
- Como gerenciar cookies no navegador
- Cookies de terceiros
- Validade dos cookies

---

### 4. Registrar Novas Rotas (`src/routes/publicRoutes.tsx`)

Adicionar:
```
/lgpd → LGPD.tsx
/cookies → Cookies.tsx
```

---

## Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/LGPD.tsx` | Página sobre proteção de dados LGPD |
| `src/pages/Cookies.tsx` | Página sobre política de cookies |

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/MainFooter.tsx` | Corrigir links + atualizar dados empresariais |
| `src/routes/publicRoutes.tsx` | Adicionar rotas /lgpd e /cookies |

---

## Resultado Final

**Informações Empresariais no Footer:**
```
CNPJ: 51.691.995/0001-15

Responsável:
Marcos Henrique da Silva Andrade

Localização:
Brasília - DF, Brasil

Experiência Internacional:
Brasil, Estados Unidos e Suíça
```

**Links Funcionais:**
- Política de Privacidade → `/privacidade` ✓
- Termos de Uso → `/termos` ✓
- LGPD - Proteção de Dados → `/lgpd` (nova)
- Política de Cookies → `/cookies` (nova)
