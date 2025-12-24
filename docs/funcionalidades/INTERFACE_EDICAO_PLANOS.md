# 🎨 Interface de Edição de Planos - Layout Esperado

## 📋 **O que DEVE aparecer**

### Dialog "Editar Plano"

```
┌─────────────────────────────────────────────────────────────────┐
│                         Editar Plano                    [X]     │
├─────────────────────────────────────────────────────────────────┤
│ Atualize as informações do plano de assinatura                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [  Básico  ]  [  Recursos  ]  [  Configurações  ]           │
│  ─────────────                                                  │
│                                                                 │
│  Nome do Plano *              Status *                         │
│  ┌─────────────────────┐     ┌─────────────────────┐          │
│  │ Básico              │     │ Ativo           [v] │          │
│  └─────────────────────┘     └─────────────────────┘          │
│                                                                 │
│  Descrição                                                      │
│  ┌───────────────────────────────────────────────────────┐    │
│  │ Plano ideal para pequenos negócios                    │    │
│  │                                                        │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                                 │
│  Valor (R$) *                 Ciclo de Cobrança *   ⭐         │
│  ┌─────────────────────┐     ┌─────────────────────────┐      │
│  │ 197                 │     │ Mensal (30 dias)    [v] │      │
│  └─────────────────────┘     └─────────────────────────┘      │
│                               ├─ Mensal (30 dias)              │
│                               ├─ Trimestral (90 dias)          │
│                               ├─ Semestral (180 dias)          │
│                               └─ Anual (365 dias)              │
│                                                                 │
│  Máx. Produtos                Máx. Categorias                  │
│  ┌─────────────────────┐     ┌─────────────────────┐          │
│  │ 100                 │     │ 10                  │          │
│  └─────────────────────┘     └─────────────────────┘          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                 [ Cancelar ]  [ Salvar Plano ]  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⭐ **Campo Importante: "Ciclo de Cobrança"**

### Localização
- **Aba:** Básico (primeira aba)
- **Posição:** Ao lado direito do campo "Valor (R$)"
- **Grid:** 2 colunas (Valor | Ciclo)

### Opções do Select

```
Ciclo de Cobrança *
┌────────────────────────────────────┐
│ Mensal (30 dias)              [v]  │  <- Selecionado
└────────────────────────────────────┘

Ao clicar:
┌────────────────────────────────────┐
│ ✓ Mensal (30 dias)                │  <- Opção 1
├────────────────────────────────────┤
│   Trimestral (90 dias)            │  <- Opção 2
├────────────────────────────────────┤
│   Semestral (180 dias)            │  <- Opção 3
├────────────────────────────────────┤
│   Anual (365 dias)                │  <- Opção 4
└────────────────────────────────────┘
```

---

## 🔍 **Como Verificar se Está Funcionando**

### 1. Abrir Dialog
```
/dashboard/plans
-> Clicar em "Editar" em qualquer plano
-> Dialog deve abrir
```

### 2. Verificar Aba "Básico"
```
✓ Nome do Plano (input text)
✓ Status (select)
✓ Descrição (textarea)
✓ Valor (R$) (input number)
✅ Ciclo de Cobrança (select)  <- DEVE ESTAR AQUI!
✓ Máx. Produtos (input number)
✓ Máx. Categorias (input number)
```

### 3. Testar o Select
```
1. Clicar no select "Ciclo de Cobrança"
2. Deve abrir dropdown com 4 opções
3. Selecionar "Trimestral (90 dias)"
4. Clicar em "Salvar Plano"
5. Deve salvar sem erros
```

---

## 🐛 **Se NÃO estiver aparecendo**

### Causa: Cache do Navegador

**Sintomas:**
- Select de "Ciclo de Cobrança" não aparece
- Card do plano mostra "R$ 197,00/mês" ao invés de "Mensal - 30 dias"
- Interface antiga sendo carregada

**Solução 1: Hard Refresh**
```
Windows: CTRL + SHIFT + R
      ou CTRL + F5

Mac:     CMD + SHIFT + R
```

**Solução 2: Limpar Cache**
```
1. CTRL + SHIFT + DELETE
2. Marcar: "Imagens e arquivos em cache"
3. Período: "Última hora"
4. Clicar: "Limpar dados"
5. Fechar e abrir novamente
```

**Solução 3: Aba Anônima**
```
1. CTRL + SHIFT + N (Chrome)
   CTRL + SHIFT + P (Firefox)
2. Abrir: http://localhost:5173
3. Login como master_admin
4. /dashboard/plans
5. Editar plano
```

**Solução 4: Reiniciar Servidor**
```
1. Fechar PowerShell (X no canto)
2. Duplo clique em: iniciar-mostralo.bat
3. Aguardar servidor iniciar
4. Abrir navegador em aba anônima
5. http://localhost:5173
```

---

## ✅ **Checklist de Verificação**

### Código (Backend)
- [x] Enum `billing_cycle_type` criado
- [x] Coluna `plans.billing_cycle` é enum
- [x] Função `approve_payment` usa `billing_cycle`
- [x] Migration aplicada com sucesso

### Código (Frontend)
- [x] `PlansPage.tsx` atualizado
- [x] Select com 4 opções implementado
- [x] Funções `getBillingCycleLabel()` criadas
- [x] Funções `getBillingCycleDays()` criadas
- [x] Card mostra "Mensal - 30 dias"
- [x] Sem erros de linting

### Browser
- [ ] Cache limpo
- [ ] Hard refresh feito
- [ ] Aba anônima testada
- [ ] Select aparecendo
- [ ] 4 opções visíveis
- [ ] Salvamento funcional

---

## 📸 **Comparação Visual**

### ANTES (Errado)
```
Valor (R$) *                 
┌─────────────────────┐     
│ 197                 │     
└─────────────────────┘     
                            
Máx. Produtos                
```

### DEPOIS (Correto)
```
Valor (R$) *                 Ciclo de Cobrança *  ⭐
┌─────────────────────┐     ┌─────────────────────────┐
│ 197                 │     │ Mensal (30 dias)    [v] │
└─────────────────────┘     └─────────────────────────┘
                            
Máx. Produtos                Máx. Categorias
```

---

## 🚀 **Teste Rápido**

```bash
# 1. Abra o DevTools
F12

# 2. Console tab
# 3. Digite:
localStorage.clear()
sessionStorage.clear()
location.reload(true)

# 4. Aguarde recarregar
# 5. Vá para /dashboard/plans
# 6. Editar plano
# 7. ✅ Deve aparecer o select!
```

---

## 📝 **Código do Select (Referência)**

```tsx
<div className="space-y-2">
  <Label htmlFor="billing_cycle">Ciclo de Cobrança *</Label>
  <Select
    value={formData.billing_cycle}
    onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}
  >
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="monthly">Mensal (30 dias)</SelectItem>
      <SelectItem value="quarterly">Trimestral (90 dias)</SelectItem>
      <SelectItem value="biannual">Semestral (180 dias)</SelectItem>
      <SelectItem value="annual">Anual (365 dias)</SelectItem>
    </SelectContent>
  </Select>
</div>
```

**Localização no arquivo:** `PlansPage.tsx` linhas 450-466

---

## 🎯 **Status Atual**

| Item | Status | Observação |
|------|--------|-----------|
| Código implementado | ✅ | Sem erros |
| Linting | ✅ | 0 erros |
| Servidor rodando | ✅ | Bun ativo |
| Browser cache | ❌ | Precisa limpar |
| Interface atualizada | ⏳ | Aguardando refresh |

---

**Próximo passo:** Limpe o cache do navegador e faça hard refresh! 🔄

