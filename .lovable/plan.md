

# Plano: WhatsApp Dinâmico no Footer + Correção de Email

## Problema Identificado

| Item | Valor Atual | Valor Correto |
|------|-------------|---------------|
| WhatsApp | Link fixo `5511999999999` | Dinâmico da instância master |
| Email | `contato@mostralo.app` | `contato@mostralo.com.br` |
| Fallback WhatsApp | `5511941941427` | `556194009368` (número pessoal) |

---

## Lógica de Prioridade do WhatsApp

```text
1º - Número da instância conectada (master_whatsapp_config.instance_phone)
     Ex: 5511941941427 (se conectado)
     
2º - Número de fallback configurado (master_whatsapp_config.fallback_phone)
     
3º - Número pessoal padrão: 556194009368
```

---

## Alterações Planejadas

### 1. Atualizar Fallback no Hook

**Arquivo:** `src/hooks/useMasterWhatsApp.ts`

- Alterar `DEFAULT_FALLBACK_NUMBER` de `5511941941427` para `556194009368`

---

### 2. Integrar Hook no MainFooter

**Arquivo:** `src/components/MainFooter.tsx`

- Importar `useMasterWhatsApp`
- Usar `getWhatsAppLink('default')` para gerar link dinâmico
- Corrigir email para `contato@mostralo.com.br`

**Mudanças específicas:**

| Linha | Antes | Depois |
|-------|-------|--------|
| 40 | `href="https://wa.me/5511999999999"` | `href={whatsAppLink}` |
| 49-53 | `contato@mostralo.app` | `contato@mostralo.com.br` |
| 87 | `href="https://wa.me/5511999999999"` | `href={whatsAppLink}` |

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/hooks/useMasterWhatsApp.ts` | Alterar fallback para 556194009368 |
| `src/components/MainFooter.tsx` | Integrar hook + corrigir email |

---

## Comportamento Final

**Cenário 1 - Instância Conectada:**
- Link WhatsApp aponta para número da instância (ex: 5511941941427)

**Cenário 2 - Sem Instância:**
- Link WhatsApp aponta para fallback configurado no banco

**Cenário 3 - Sem Configuração:**
- Link WhatsApp aponta para 556194009368 (número pessoal)

---

## Benefícios

1. **Flexibilidade**: Mudança de número sem alterar código
2. **Continuidade**: Sempre há um número disponível
3. **Consistência**: Email com domínio oficial mostralo.com.br

